
import Cart from "../models/Cart.js";
import CartItem from "../models/CartItem.js";
import "../models/associations.js";



const create = async (userId, transaction = null) => {
  return Cart.create(
    { userId },
    { transaction }
  );
};

const findOrCreate = async (userId, transaction = null) => {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
    transaction,
  });

  return cart;
};

const findByUserIdWithItems = async (userId) => {
  return Cart.findOne({
    where: { userId },
    include: [
      {
        association: "items",
        include: [
          {
            association: "product",
            attributes: [
              "id",
              "name",
              "slug",
              "sku",
              "price",
              "imageUrl",
              "isActive",
            ],
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: "items" }, "id", "ASC"]],
  });
};

const findByUserId = async (userId, transaction = null) => {
  return Cart.findOne({
    where: { userId },
    transaction,
    ...(transaction && {
      lock: transaction.LOCK.UPDATE,
    }),
  });
};


export default {
  findByUserId,
  findOrCreate,
  create,
  findByUserIdWithItems,
};
