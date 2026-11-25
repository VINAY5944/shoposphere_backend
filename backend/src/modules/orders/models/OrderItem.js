import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    orderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "order_id",
    },

    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "product_id",
    },

    productName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "product_name",
    },

    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "unit_price",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },

    lineTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "line_total",
    },
  },
  {
    tableName: "order_items",
    timestamps: true,
    underscored: true,
  }
);

export default OrderItem;