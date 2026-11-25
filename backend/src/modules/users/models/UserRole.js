
import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const UserRole = sequelize.define(
  "UserRole",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },

    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "role_id",
    },
  },
  {
    tableName: "user_roles",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "role_id"],
        name: "uq_user_roles_user_id_role_id",
      },
      {
        fields: ["role_id"],
        name: "idx_user_roles_role_id",
      },
    ],
  }
);

export default UserRole;
