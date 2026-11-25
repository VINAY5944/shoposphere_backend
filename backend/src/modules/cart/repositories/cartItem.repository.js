
import CartItem from "../models/CartItem.js";
import "../models/associations.js";

const findByCartAndProduct = async (
  cartId,
  productId,
  transaction = null
) => {
  return CartItem.findOne({
    where: {
      cartId,
      productId,
    },
    transaction,
  });
};

const findByIdAndCartId = async (
  itemId,
  cartId,
  transaction = null
) => {
  return CartItem.findOne({
    where: {
      id: itemId,
      cartId,
    },
    transaction,
  });
};

const create = async (itemData, transaction = null) => {
  return CartItem.create(itemData, { transaction });
};

const update = async (
  cartItem,
  itemData,
  transaction = null
) => {
  return cartItem.update(itemData, { transaction });
};

const remove = async (cartItem, transaction = null) => {
  return cartItem.destroy({ transaction });
};

const clearByCartId = async (cartId, transaction = null) => {
  return CartItem.destroy({
    where: { cartId },
    transaction,
  });
};

const findByIdsAndCartId = async (
  itemIds,
  cartId,
  transaction = null
) => {
  return CartItem.findAll({
    where: {
      id: itemIds,
      cartId,
    },
    transaction,
  });
};

const removeByIdsAndCartId = async (
  itemIds,
  cartId,
  transaction = null
) => {
  return CartItem.destroy({
    where: {
      id: itemIds,
      cartId,
    },
    transaction,
  });
};

export default {
  findByCartAndProduct,
  findByIdAndCartId,
  create,
  update,
  remove,
  clearByCartId,
  findByIdsAndCartId,
  findByIdAndCartId,
  removeByIdsAndCartId,
};
