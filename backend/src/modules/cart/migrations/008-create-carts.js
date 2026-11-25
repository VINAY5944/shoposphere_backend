
export async function up({ context: queryInterface }) {
  await queryInterface.createTable("carts", {
    id: {
      type: "BIGINT",
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    user_id: {
      type: "UUID",
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("carts");
}
