
import { DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("orders", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
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
      onDelete: "RESTRICT",
    },

    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "PENDING",
    },

    payment_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "PENDING",
    },

    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: "INR",
    },

    payment_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex("orders", ["user_id"], {
    name: "orders_user_id_idx",
  });

  await queryInterface.addIndex("orders", ["status"], {
    name: "orders_status_idx",
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("orders");
};
