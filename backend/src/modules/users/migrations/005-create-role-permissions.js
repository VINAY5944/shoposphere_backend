import { DataTypes } from "sequelize";
export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("role_permissions", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    role_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    permission_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "permissions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },
  });

  await queryInterface.addConstraint("role_permissions", {
    fields: ["role_id", "permission_id"],
    type: "unique",
    name: "uq_role_permissions_role_id_permission_id",
  });

  await queryInterface.addIndex(
    "role_permissions",
    ["permission_id"],
    {
      name: "idx_role_permissions_permission_id",
    }
  );
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("role_permissions");
};
