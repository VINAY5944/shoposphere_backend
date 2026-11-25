
import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "user_id",
    },
  },
  {
    tableName: "carts",
    timestamps: true,
    underscored: true,
  }
);

export default Cart;
