import { Op, col, fn } from "sequelize";

import "../../orders/models/associations.js";
import "../../inventory/models/associations.js";
import "../models/associations.js";

import Order from "../../orders/models/Order.js";
import Inventory from "../../inventory/models/Inventory.js";
import Product from "../../products/models/Product.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import userRepository from "../repositories/user.repository.js";
import { PAYMENT_STATUS } from "../../payments/constants/payment.constants.js";

const LOW_STOCK_THRESHOLD = 5;
const SALES_MONTHS = 6;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatAmount = (value) => {
  const [whole, fraction = ""] = String(value ?? "0").split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
};

const formatMonth = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const encodeCustomerCursor = (cursor) =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

const decodeCustomerCursor = (cursor) => {
  try {
    if (typeof cursor !== "string") {
      throw new Error("Invalid cursor");
    }

    const payload = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      Object.keys(payload).length !== 2 ||
      typeof payload.createdAt !== "string" ||
      typeof payload.id !== "string" ||
      !UUID_PATTERN.test(payload.id)
    ) {
      throw new Error("Invalid cursor");
    }

    const createdAt = new Date(payload.createdAt);

    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString() !== payload.createdAt ||
      encodeCustomerCursor(payload) !== cursor
    ) {
      throw new Error("Invalid cursor");
    }

    return {
      createdAt,
      id: payload.id,
    };
  } catch {
    const error = new Error("Invalid pagination cursor");
    error.statusCode = 400;
    throw error;
  }
};

const serializeCustomer = (customer) => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  isActive: customer.isActive,
  emailVerifiedAt: customer.emailVerifiedAt
    ? customer.emailVerifiedAt.toISOString()
    : null,
  roles: customer.roles.map((role) => role.name),
  createdAt: customer.createdAt.toISOString(),
  updatedAt: customer.updatedAt.toISOString(),
});

const getDashboard = async () => {
  const now = new Date();
  const firstMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - SALES_MONTHS + 1, 1)
  );
  const monthStarts = Array.from({ length: SALES_MONTHS }, (_, index) => {
    const date = new Date(
      Date.UTC(
        firstMonth.getUTCFullYear(),
        firstMonth.getUTCMonth() + index,
        1
      )
    );

    return formatMonth(date);
  });

  const monthExpression = fn("date_trunc", "month", col("created_at"));

  const [
    totalOrders,
    paidOrders,
    totalRevenue,
    totalCustomers,
    activeProducts,
    lowStockCount,
    lowStockRows,
    recentOrderRows,
    monthlyRevenueRows,
  ] = await Promise.all([
    Order.count(),
    Order.count({
      where: { paymentStatus: PAYMENT_STATUS.SUCCESS },
    }),
    Order.sum("totalAmount", {
      where: {
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        currency: "INR",
      },
    }),
    User.count({
      include: [
        {
          model: Role,
          as: "roles",
          attributes: [],
          through: { attributes: [] },
          where: { name: "CUSTOMER" },
        },
      ],
      distinct: true,
    }),
    Product.count({ where: { isActive: true } }),
    Inventory.count({
      where: {
        quantity: { [Op.lte]: LOW_STOCK_THRESHOLD },
      },
    }),
    Inventory.findAll({
      attributes: ["productId", "quantity"],
      where: {
        quantity: { [Op.lte]: LOW_STOCK_THRESHOLD },
      },
      include: [
        {
          association: "product",
          attributes: ["name", "sku"],
          required: true,
        },
      ],
      order: [["quantity", "ASC"], ["productId", "ASC"]],
      limit: 10,
    }),
    Order.findAll({
      attributes: [
        "id",
        "orderNumber",
        "status",
        "paymentStatus",
        "totalAmount",
        "currency",
        "createdAt",
      ],
      include: [
        {
          association: "user",
          attributes: ["id", "name", "email"],
          required: true,
        },
      ],
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: 5,
    }),
    Order.findAll({
      attributes: [
        [monthExpression, "month"],
        [fn("SUM", col("total_amount")), "revenue"],
      ],
      where: {
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        currency: "INR",
        createdAt: { [Op.gte]: firstMonth },
      },
      group: [monthExpression],
      order: [[monthExpression, "ASC"]],
      raw: true,
    }),
  ]);

  const monthlyRevenue = new Map(
    monthStarts.map((key) => [key, "0.00"])
  );

  for (const row of monthlyRevenueRows) {
    const key = formatMonth(new Date(row.month));

    if (monthlyRevenue.has(key)) {
      monthlyRevenue.set(key, formatAmount(row.revenue));
    }
  }

  return {
    generatedAt: now.toISOString(),
    overview: {
      totalOrders,
      paidOrders,
      totalRevenue: {
        amount: formatAmount(totalRevenue),
        currency: "INR",
      },
      totalCustomers,
      activeProducts,
      lowStockCount,
    },
    salesByMonth: monthStarts.map((key) => ({
      month: key,
      revenue: monthlyRevenue.get(key),
      currency: "INR",
    })),
    recentOrders: recentOrderRows.map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: formatAmount(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
    })),
    lowStockItems: lowStockRows.map((item) => ({
      productId: String(item.productId),
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
    })),
  };
};

const listCustomers = async (query = {}) => {
  const limit = Number(query.limit ?? 20);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error("Limit must be between 1 and 100");
    error.statusCode = 400;
    throw error;
  }

  let search;

  if (query.search !== undefined) {
    if (typeof query.search !== "string") {
      const error = new Error("Invalid customer search");
      error.statusCode = 400;
      throw error;
    }

    search = query.search.trim();

    if (search.length > 100) {
      const error = new Error("Search cannot exceed 100 characters");
      error.statusCode = 400;
      throw error;
    }
  }

  let isActive;

  if (query.isActive !== undefined) {
    if (query.isActive === "true" || query.isActive === true) {
      isActive = true;
    } else if (
      query.isActive === "false" ||
      query.isActive === false
    ) {
      isActive = false;
    } else {
      const error = new Error("isActive must be true or false");
      error.statusCode = 400;
      throw error;
    }
  }

  const cursor = query.cursor
    ? decodeCustomerCursor(query.cursor)
    : null;
  const customers = await userRepository.findCustomersForAdmin({
    limit,
    cursor,
    search: search || undefined,
    isActive,
  });

  const hasNextPage = customers.length > limit;

  if (hasNextPage) {
    customers.pop();
  }

  const lastCustomer = customers[customers.length - 1];
  const nextCursor =
    hasNextPage && lastCustomer
      ? encodeCustomerCursor({
          createdAt: lastCustomer.createdAt.toISOString(),
          id: lastCustomer.id,
        })
      : null;

  return {
    data: customers.map(serializeCustomer),
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
  };
};

const getCustomerForAdmin = async (customerId) => {
  const customer =
    await userRepository.findCustomerByIdForAdmin(customerId);

  if (
    !customer ||
    !customer.roles.some((role) => role.name === "CUSTOMER")
  ) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  return serializeCustomer(customer);
};

const updateCustomerStatus = async (customerId, isActive) => {
  const customer =
    await userRepository.findCustomerByIdForAdmin(customerId);

  if (
    !customer ||
    !customer.roles.some((role) => role.name === "CUSTOMER")
  ) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCustomer =
    await userRepository.updateCustomerStatus(customer, isActive);

  return serializeCustomer(updatedCustomer);
};

export default {
  getDashboard,
  listCustomers,
  getCustomerForAdmin,
  updateCustomerStatus,
};
