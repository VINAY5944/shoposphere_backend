import { DataTypes } from "sequelize";
export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("user_roles", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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

  await queryInterface.addConstraint("user_roles", {
    fields: ["user_id", "role_id"],
    type: "unique",
    name: "uq_user_roles_user_id_role_id",
  });

  await queryInterface.addIndex("user_roles", ["role_id"], {
    name: "idx_user_roles_role_id",
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("user_roles");
};
