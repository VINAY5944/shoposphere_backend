
import { Op } from "sequelize";

import "../models/associations.js";

import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";

const create = async (orderData, transaction) => {
  return Order.create(orderData, { transaction });
};

const createItems = async (items, transaction) => {
  return OrderItem.bulkCreate(items, { transaction });
};

const findById = async (orderId, transaction = null) => {
  return Order.findByPk(orderId, {
    include: [
      {
        association: "items",
        include: [
          {
            association: "product",
            attributes: ["id", "name", "sku"],
          },
        ],
      },
    ],
    ...(transaction && { transaction }),
  });
};

const findByIdAndUserId = async (orderId, userId) => {
  return Order.findOne({
    where: {
      id: orderId,
      userId,
    },
    include: [
      {
        association: "items",
        include: [
          {
            association: "product",
            attributes: ["id", "name", "sku"],
          },
        ],
      },
    ],
  });
};

const findByOrderNumber = async (orderNumber) => {
  return Order.findOne({
    where: { orderNumber },
  });
};

const findAllByUserId = async ({ userId, limit, cursor }) => {
  const where = { userId };

  if (cursor) {
    where[Op.or] = [
      {
        createdAt: {
          [Op.lt]: cursor.createdAt,
        },
      },
      {
        createdAt: cursor.createdAt,
        id: {
          [Op.lt]: cursor.id,
        },
      },
    ];
  }

  return Order.findAll({
    where,
    attributes: [
      "id",
      "orderNumber",
      "status",
      "paymentStatus",
      "totalAmount",
      "currency",
      "createdAt",
      "updatedAt",
    ],
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit: limit + 1,
  });
};

const findAllForAdmin = ({
  limit,
  cursor,
  status,
  paymentStatus,
}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (cursor) {
    where[Op.or] = [
      {
        createdAt: {
          [Op.lt]: cursor.createdAt,
        },
      },
      {
        createdAt: cursor.createdAt,
        id: {
          [Op.lt]: cursor.id,
        },
      },
    ];
  }

  return Order.findAll({
    where,
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
    limit: limit + 1,
  });
};

const findByIdForAdmin = async (orderId) => {
  return Order.findByPk(orderId, {
    attributes: [
      "id",
      "orderNumber",
      "status",
      "paymentStatus",
      "totalAmount",
      "currency",
      "paymentReference",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        association: "user",
        attributes: ["id", "name", "email"],
        required: true,
      },
      {
        association: "items",
        attributes: [
          "id",
          "productId",
          "productName",
          "sku",
          "unitPrice",
          "quantity",
          "lineTotal",
        ],
      },
    ],
  });
};

export {
  create,
  createItems,
  findById,
  findByIdAndUserId,
  findByOrderNumber,
  findAllByUserId,
  findAllForAdmin,
  findByIdForAdmin,
};
