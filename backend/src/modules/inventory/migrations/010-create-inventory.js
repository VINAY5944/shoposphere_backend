
export async function up({ context: queryInterface }) {
  await queryInterface.createTable("inventory", {
    id: {
      type: "BIGINT",
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    product_id: {
      type: "BIGINT",
      allowNull: false,
      unique: true,
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
      defaultValue: 0,
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

  await queryInterface.addConstraint("inventory", {
    fields: ["quantity"],
    type: "check",
    where: queryInterface.sequelize.literal("quantity >= 0"),
    name: "chk_inventory_quantity_non_negative",
  });

  await queryInterface.addIndex("inventory", ["product_id"], {
    name: "idx_inventory_product_id",
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("inventory");
}
