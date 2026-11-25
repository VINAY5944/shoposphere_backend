import * as orderRepository from "../repositories/order.repository.js";
import { PAYMENT_STATUS } from "../../payments/constants/payment.constants.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const encodeCursor = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeCursor = (cursor) => {
  try {
    if (typeof cursor !== "string") {
      throw new Error("Invalid cursor");
    }

    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded);

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      Object.keys(payload).length !== 2 ||
      typeof payload.createdAt !== "string" ||
      typeof payload.id !== "string" ||
      !/^[1-9]\d*$/.test(payload.id) ||
      BigInt(payload.id) > 9223372036854775807n
    ) {
      throw new Error("Invalid cursor");
    }

    const createdAt = new Date(payload.createdAt);

    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString() !== payload.createdAt ||
      encodeCursor(payload) !== cursor
    ) {
      throw new Error("Invalid cursor");
    }

    return {
      createdAt,
      id: payload.id,
    };
  } catch {
    throw createError("Invalid pagination cursor", 400);
  }
};

const listOrdersForUser = async (userId, query = {}) => {
  const limit = Number(query.limit ?? 20);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw createError("Limit must be between 1 and 100", 400);
  }

  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  const orders = await orderRepository.findAllByUserId({
    userId,
    limit,
    cursor,
  });

  const hasNextPage = orders.length > limit;

  if (hasNextPage) {
    orders.pop();
  }

  const lastOrder = orders[orders.length - 1];
  const nextCursor =
    hasNextPage && lastOrder
      ? encodeCursor({
          createdAt: new Date(lastOrder.createdAt).toISOString(),
          id: String(lastOrder.id),
        })
      : null;

  return {
    data: orders,
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
  };
};

const getOrderForUser = async (orderId, userId) => {
  const order = await orderRepository.findByIdAndUserId(
    orderId,
    userId
  );

  if (!order) {
    throw createError("Order not found", 404);
  }

  return order;
};

const listOrdersForAdmin = async (query = {}) => {
  const limit = Number(query.limit ?? 20);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw createError("Limit must be between 1 and 100", 400);
  }

  const status =
    query.status === undefined
      ? undefined
      : typeof query.status === "string"
        ? query.status.trim().toUpperCase()
        : null;

  if (status !== undefined && (!status || status.length > 30)) {
    throw createError("Invalid order status filter", 400);
  }

  const paymentStatus =
    query.paymentStatus === undefined
      ? undefined
      : typeof query.paymentStatus === "string"
        ? query.paymentStatus.trim().toUpperCase()
        : null;

  if (
    paymentStatus !== undefined &&
    !Object.values(PAYMENT_STATUS).includes(paymentStatus)
  ) {
    throw createError("Invalid payment status filter", 400);
  }

  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  const orders = await orderRepository.findAllForAdmin({
    limit,
    cursor,
    status,
    paymentStatus,
  });

  const hasNextPage = orders.length > limit;

  if (hasNextPage) {
    orders.pop();
  }

  const lastOrder = orders[orders.length - 1];
  const nextCursor =
    hasNextPage && lastOrder
      ? encodeCursor({
          createdAt: new Date(lastOrder.createdAt).toISOString(),
          id: String(lastOrder.id),
        })
      : null;

  return {
    data: orders.map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: String(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
    })),
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
  };
};

const getOrderForAdmin = async (orderId) => {
  const order = await orderRepository.findByIdForAdmin(orderId);

  if (!order) {
    throw createError("Order not found", 404);
  }

  return {
    id: String(order.id),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: String(order.totalAmount),
    currency: order.currency,
    paymentReference: order.paymentReference,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    },
    items: order.items.map((item) => ({
      id: String(item.id),
      productId: String(item.productId),
      productName: item.productName,
      sku: item.sku,
      unitPrice: String(item.unitPrice),
      quantity: item.quantity,
      lineTotal: String(item.lineTotal),
    })),
  };
};

export default {
  listOrdersForUser,
  getOrderForUser,
  listOrdersForAdmin,
  getOrderForAdmin,
};
