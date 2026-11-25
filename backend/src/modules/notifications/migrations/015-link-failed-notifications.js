import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn("notification_failed_jobs", "notification_id", {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "notifications",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await queryInterface.addIndex(
    "notification_failed_jobs",
    ["notification_id"],
    { name: "idx_notification_failed_jobs_notification_id" }
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(
    "notification_failed_jobs",
    "idx_notification_failed_jobs_notification_id"
  );
  await queryInterface.removeColumn(
    "notification_failed_jobs",
    "notification_id"
  );
}
