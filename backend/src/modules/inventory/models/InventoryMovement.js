import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const InventoryMovement = sequelize.define(
  "InventoryMovement",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "product_id",
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["RESTOCK", "ORDER"]],
      },
    },
    quantityChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity_change",
    },
    previousQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "previous_quantity",
    },
    newQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "new_quantity",
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "inventory_movements",
    timestamps: false,
    underscored: true,
  }
);

export default InventoryMovement;
