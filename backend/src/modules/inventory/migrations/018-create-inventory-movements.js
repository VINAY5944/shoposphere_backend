import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.createTable("inventory_movements", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
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
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    quantity_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previous_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("NOW()"),
    },
  });

  await queryInterface.addConstraint("inventory_movements", {
    fields: ["type"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "type IN ('RESTOCK', 'ORDER')"
    ),
    name: "chk_inventory_movements_type",
  });

  await queryInterface.addConstraint("inventory_movements", {
    fields: ["quantity_change", "previous_quantity", "new_quantity"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "quantity_change <> 0 AND previous_quantity >= 0 AND new_quantity >= 0"
    ),
    name: "chk_inventory_movements_quantities",
  });

  await queryInterface.addIndex(
    "inventory_movements",
    ["product_id", "created_at", "id"],
    { name: "idx_inventory_movements_product_history" }
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("inventory_movements");
}
