import { DataTypes, Op } from "sequelize";

export const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("order_items", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    order_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    product_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    line_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
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

await queryInterface.addConstraint("order_items", {
  fields: ["quantity"],
  type: "check",
  where: {
    quantity: {
      [Op.gt]: 0,
    },
  },
  name: "order_items_quantity_positive",
});

  await queryInterface.addIndex("order_items", ["order_id"], {
    name: "order_items_order_id_idx",
  });

  await queryInterface.addIndex("order_items", ["product_id"], {
    name: "order_items_product_id_idx",
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("order_items");
};
