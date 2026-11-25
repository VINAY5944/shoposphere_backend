import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.createTable("notifications", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    original_job_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    latest_queue_job_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    job_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING(320),
      allowNull: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "QUEUED",
    },
    attempts_made: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    queued_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_retried_at: {
      type: DataTypes.DATE,
      allowNull: true,
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

  await queryInterface.addConstraint("notifications", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "status IN ('QUEUED', 'RETRYING', 'SENT', 'FAILED', 'QUEUE_FAILED')"
    ),
    name: "chk_notifications_status",
  });

  await queryInterface.addConstraint("notifications", {
    fields: ["attempts_made", "retry_count"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "attempts_made >= 0 AND retry_count >= 0"
    ),
    name: "chk_notifications_counts",
  });

  await queryInterface.addIndex("notifications", ["status", "queued_at"], {
    name: "idx_notifications_status_queued_at",
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("notifications");
}
