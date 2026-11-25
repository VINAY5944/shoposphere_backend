import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const Order = sequelize.define(
  "Order",
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
      field: "user_id",
    },

    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "order_number",
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "PENDING",
    },

    paymentStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "PENDING",
      field: "payment_status",
    },

    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_amount",
    },

    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: "INR",
    },

    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "payment_reference",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true,
  }
);

export default Order;