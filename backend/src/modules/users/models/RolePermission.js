
import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "role_id",
    },

    permissionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "permission_id",
    },
  },
  {
    tableName: "role_permissions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["role_id", "permission_id"],
        name: "uq_role_permissions_role_id_permission_id",
      },
      {
        fields: ["permission_id"],
        name: "idx_role_permissions_permission_id",
      },
    ],
  }
);

export default RolePermission;
