
export async function up({ context: queryInterface }) {
  await queryInterface.addColumn("products", "image_url", {
    type: "TEXT",
    allowNull: true,
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("products", "image_url");
}
