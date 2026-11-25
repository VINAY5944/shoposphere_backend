import assert from "node:assert/strict";
import { test } from "node:test";

for (const key of ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"]) {
  if (!process.env[key]) {
    process.env[key] = "shopsphere_test";
  }
}

const [
  { default: sequelize },
  { default: inventoryRepository },
  { default: inventoryMovementRepository },
  { default: productService },
  { default: inventoryService },
  { decodeCursor, encodeCursor },
] = await Promise.all([
  import("../../src/config/database.js"),
  import("../../src/modules/inventory/repositories/inventory.repository.js"),
  import("../../src/modules/inventory/repositories/inventory-movement.repository.js"),
  import("../../src/modules/products/services/product.service.js"),
  import("../../src/modules/inventory/services/inventory.service.js"),
  import("../../src/shared/utils/cursorPagination.js"),
]);

const testTransaction = { id: "test-transaction" };

const stubTransaction = (context) =>
  context.mock.method(sequelize, "transaction", async (callback) =>
    callback(testTransaction)
  );

test("restock updates quantity and records an incoming movement", async (context) => {
  const inventory = { quantity: 12 };
  const updates = [];
  const movements = [];

  stubTransaction(context);
  context.mock.method(
    inventoryRepository,
    "findByProductIdForUpdate",
    async () => inventory
  );
  context.mock.method(productService, "getProductById", async () => ({}));
  context.mock.method(
    inventoryRepository,
    "updateQuantity",
    async (...args) => updates.push(args)
  );
  context.mock.method(
    inventoryMovementRepository,
    "create",
    async (...args) => movements.push(args)
  );

  const result = await inventoryService.restock("7", 5);

  assert.deepEqual(result, {
    productId: "7",
    previousQuantity: 12,
    addedQuantity: 5,
    availableQuantity: 17,
  });
  assert.deepEqual(updates, [[inventory, 17, testTransaction]]);
  assert.equal(movements.length, 1);
  const { createdAt, ...movement } = movements[0][0];
  assert.deepEqual(movement, {
    productId: "7",
    type: "RESTOCK",
    quantityChange: 5,
    previousQuantity: 12,
    newQuantity: 17,
    reference: null,
  });
  assert.ok(createdAt instanceof Date);
  assert.equal(movements[0][1], testTransaction);
});

test("restock rejects quantities beyond the database integer range", async (context) => {
  const inventory = { quantity: 2147483640 };
  let updateCalled = false;
  let movementCalled = false;

  stubTransaction(context);
  context.mock.method(
    inventoryRepository,
    "findByProductIdForUpdate",
    async () => inventory
  );
  context.mock.method(productService, "getProductById", async () => ({}));
  context.mock.method(
    inventoryRepository,
    "updateQuantity",
    async () => {
      updateCalled = true;
    }
  );
  context.mock.method(
    inventoryMovementRepository,
    "create",
    async () => {
      movementCalled = true;
    }
  );

  await assert.rejects(
    inventoryService.restock("7", 10),
    (error) => error.statusCode === 400
  );
  assert.equal(updateCalled, false);
  assert.equal(movementCalled, false);
});

test("order stock deduction records a negative movement tied to the order", async (context) => {
  const inventory = { quantity: 8 };
  const updates = [];
  const movements = [];

  context.mock.method(
    inventoryRepository,
    "findByProductIdForUpdate",
    async () => inventory
  );
  context.mock.method(
    inventoryRepository,
    "updateQuantity",
    async (...args) => updates.push(args)
  );
  context.mock.method(
    inventoryMovementRepository,
    "create",
    async (...args) => movements.push(args)
  );

  await inventoryService.decreaseStock(
    "7",
    3,
    "ORD-TEST-1",
    testTransaction
  );

  assert.deepEqual(updates, [[inventory, 5, testTransaction]]);
  assert.equal(movements.length, 1);
  assert.equal(movements[0][0].type, "ORDER");
  assert.equal(movements[0][0].quantityChange, -3);
  assert.equal(movements[0][0].previousQuantity, 8);
  assert.equal(movements[0][0].newQuantity, 5);
  assert.equal(movements[0][0].reference, "ORD-TEST-1");
  assert.equal(movements[0][1], testTransaction);
});

test("order stock deduction rejects insufficient stock without writing a movement", async (context) => {
  const inventory = { quantity: 2 };
  let updateCalled = false;
  let movementCalled = false;

  context.mock.method(
    inventoryRepository,
    "findByProductIdForUpdate",
    async () => inventory
  );
  context.mock.method(
    inventoryRepository,
    "updateQuantity",
    async () => {
      updateCalled = true;
    }
  );
  context.mock.method(
    inventoryMovementRepository,
    "create",
    async () => {
      movementCalled = true;
    }
  );

  await assert.rejects(
    inventoryService.decreaseStock(
      "7",
      3,
      "ORD-TEST-2",
      testTransaction
    ),
    (error) => error.statusCode === 409
  );
  assert.equal(updateCalled, false);
  assert.equal(movementCalled, false);
});

test("order stock deduction requires the order transaction", async () => {
  await assert.rejects(
    inventoryService.decreaseStock("7", 1, "ORD-TEST-3", null),
    /A transaction is required/
  );
});

test("history returns a next cursor when another page exists", async (context) => {
  const createdAt = new Date("2026-11-25T10:00:00.000Z");
  const rows = [
    { id: "103", createdAt },
    { id: "102", createdAt },
    { id: "101", createdAt },
  ];
  let repositoryQuery;

  context.mock.method(
    inventoryRepository,
    "findByProductId",
    async () => ({ id: "7" })
  );
  context.mock.method(
    inventoryMovementRepository,
    "findByProductId",
    async (query) => {
      repositoryQuery = query;
      return rows;
    }
  );

  const result = await inventoryService.getHistory("7", { limit: "2" });
  const decodedCursor = decodeCursor(result.pagination.nextCursor);

  assert.deepEqual(result.data, rows.slice(0, 2));
  assert.deepEqual(repositoryQuery, {
    productId: "7",
    limit: 2,
    cursor: null,
  });
  assert.deepEqual(result.pagination, {
    limit: 2,
    hasNextPage: true,
    nextCursor: encodeCursor({
      createdAt: createdAt.toISOString(),
      id: "102",
    }),
  });
  assert.deepEqual(decodedCursor, {
    createdAt: createdAt.toISOString(),
    id: "102",
  });
});

test("history passes a decoded cursor to the repository", async (context) => {
  const createdAt = "2026-11-25T10:00:00.000Z";
  const cursor = encodeCursor({ createdAt, id: "102" });
  let repositoryQuery;

  context.mock.method(
    inventoryRepository,
    "findByProductId",
    async () => ({ id: "7" })
  );
  context.mock.method(
    inventoryMovementRepository,
    "findByProductId",
    async (query) => {
      repositoryQuery = query;
      return [];
    }
  );

  const result = await inventoryService.getHistory("7", {
    limit: "5",
    cursor,
  });

  assert.deepEqual(repositoryQuery, {
    productId: "7",
    limit: 5,
    cursor: {
      createdAt: new Date(createdAt),
      id: "102",
    },
  });
  assert.deepEqual(result.pagination, {
    limit: 5,
    hasNextPage: false,
    nextCursor: null,
  });
});

test("history rejects malformed cursors and missing inventory", async (context) => {
  context.mock.method(
    inventoryRepository,
    "findByProductId",
    async () => ({ id: "7" })
  );
  context.mock.method(
    inventoryMovementRepository,
    "findByProductId",
    async () => {
      throw new Error("Movement repository should not be called");
    }
  );

  await assert.rejects(
    inventoryService.getHistory("7", { cursor: "not-a-cursor" }),
    (error) => error.statusCode === 400
  );

  context.mock.method(
    inventoryRepository,
    "findByProductId",
    async () => null
  );
  await assert.rejects(
    inventoryService.getHistory("7"),
    (error) => error.statusCode === 404
  );
});
