
import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    cartId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "cart_id",
    },

    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "product_id",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
    underscored: true,
  }
);

export default CartItem;
