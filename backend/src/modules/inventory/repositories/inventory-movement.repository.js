import { Op } from "sequelize";
import InventoryMovement from "../models/InventoryMovement.js";

const create = async (movementData, transaction) =>
  InventoryMovement.create(movementData, { transaction });

const findByProductId = async ({ productId, limit, cursor }) => {
  const where = { productId };

  if (cursor) {
    where[Op.or] = [
      { createdAt: { [Op.lt]: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        id: { [Op.lt]: cursor.id },
      },
    ];
  }

  return InventoryMovement.findAll({
    where,
    limit: limit + 1,
    order: [["createdAt", "DESC"], ["id", "DESC"]],
  });
};

export default {
  create,
  findByProductId,
};
