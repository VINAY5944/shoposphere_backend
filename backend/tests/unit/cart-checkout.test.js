import assert from "node:assert/strict";
import { test } from "node:test";

for (const key of ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"]) {
  if (!process.env[key]) {
    process.env[key] = "shopsphere_test";
  }
}

const [
  { default: cartRepository },
  { default: cartItemRepository },
  { default: cartService },
  { checkoutCartSchema },
] = await Promise.all([
  import("../../src/modules/cart/repositories/cart.repository.js"),
  import("../../src/modules/cart/repositories/cartItem.repository.js"),
  import("../../src/modules/cart/services/cart.service.js"),
  import("../../src/modules/orders/validations/checkout.validation.js"),
]);

test("cart checkout requires unique cart item IDs", () => {
  const valid = checkoutCartSchema.safeParse({
    body: {
      cartItemIds: ["10"],
      paymentPassword: "PAY123",
    },
  });
  const missingIds = checkoutCartSchema.safeParse({
    body: { paymentPassword: "PAY123" },
  });
  const emptyIds = checkoutCartSchema.safeParse({
    body: { cartItemIds: [], paymentPassword: "PAY123" },
  });
  const duplicateIds = checkoutCartSchema.safeParse({
    body: {
      cartItemIds: ["10", "10"],
      paymentPassword: "PAY123",
    },
  });

  assert.equal(valid.success, true);
  assert.equal(missingIds.success, false);
  assert.equal(emptyIds.success, false);
  assert.equal(duplicateIds.success, false);
});

test("checkout loads only selected items belonging to the customer's cart", async (context) => {
  const selectedItems = [
    { id: "10", productId: "2", quantity: 1 },
  ];
  let queriedItemIds;

  context.mock.method(
    cartRepository,
    "findByUserId",
    async () => ({ id: "cart-1" })
  );
  context.mock.method(
    cartItemRepository,
    "findByIdsAndCartId",
    async (itemIds, cartId) => {
      queriedItemIds = { itemIds, cartId };
      return selectedItems;
    }
  );

  const result = await cartService.getCartItemsForCheckout(
    "user-1",
    ["10"]
  );

  assert.deepEqual(queriedItemIds, {
    itemIds: ["10"],
    cartId: "cart-1",
  });
  assert.deepEqual(result, {
    cartId: "cart-1",
    items: selectedItems,
  });
});

test("checkout rejects cart item IDs that do not all belong to the customer", async (context) => {
  context.mock.method(
    cartRepository,
    "findByUserId",
    async () => ({ id: "cart-1" })
  );
  context.mock.method(
    cartItemRepository,
    "findByIdsAndCartId",
    async () => [{ id: "10", productId: "2", quantity: 1 }]
  );

  await assert.rejects(
    cartService.getCartItemsForCheckout("user-1", ["10", "11"]),
    (error) => error.statusCode === 404
  );
});

test("successful checkout removes selected cart rows only", async (context) => {
  const transaction = { id: "test-transaction" };
  let removed;
  let clearCartCalled = false;

  context.mock.method(
    cartRepository,
    "findByUserId",
    async () => ({ id: "cart-1" })
  );
  context.mock.method(
    cartItemRepository,
    "removeByIdsAndCartId",
    async (...args) => {
      removed = args;
      return 1;
    }
  );
  context.mock.method(
    cartItemRepository,
    "clearByCartId",
    async () => {
      clearCartCalled = true;
    }
  );

  await cartService.removeCheckedOutItems(
    "user-1",
    ["10"],
    transaction
  );

  assert.deepEqual(removed, [["10"], "cart-1", transaction]);
  assert.equal(clearCartCalled, false);
});
