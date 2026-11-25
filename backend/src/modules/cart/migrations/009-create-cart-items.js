
export async function up({ context: queryInterface }) {
  await queryInterface.createTable("cart_items", {
    id: {
      type: "BIGINT",
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    cart_id: {
      type: "BIGINT",
      allowNull: false,
      references: {
        model: "carts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    product_id: {
      type: "BIGINT",
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    quantity: {
      type: "INTEGER",
      allowNull: false,
      defaultValue: 1,
    },

    created_at: {
      type: "DATE",
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },

    updated_at: {
      type: "DATE",
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },
  });

  // A product can appear only once in a cart.
  await queryInterface.addConstraint("cart_items", {
    fields: ["cart_id", "product_id"],
    type: "unique",
    name: "uq_cart_items_cart_id_product_id",
  });

  // Quantity must always be greater than zero.
  await queryInterface.addConstraint("cart_items", {
    fields: ["quantity"],
    type: "check",
    where: {
      quantity: {
        [queryInterface.sequelize.Sequelize.Op.gt]: 0,
      },
    },
    name: "chk_cart_items_quantity_positive",
  });

  // Index for retrieving items belonging to a cart.
  await queryInterface.addIndex("cart_items", ["cart_id"], {
    name: "idx_cart_items_cart_id",
  });

  // Index for finding carts containing a product.
  await queryInterface.addIndex("cart_items", ["product_id"], {
    name: "idx_cart_items_product_id",
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("cart_items");
}
