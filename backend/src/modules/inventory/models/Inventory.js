
import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const Inventory = sequelize.define(
  "Inventory",
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
      unique: true,
      field: "product_id",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true,
      },
    },
  },
  {
    tableName: "inventory",
    timestamps: true,
    underscored: true,
  }
);

export default Inventory;
