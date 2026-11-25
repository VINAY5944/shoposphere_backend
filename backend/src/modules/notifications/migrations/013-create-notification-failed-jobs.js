import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.createTable("notification_failed_jobs", {
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
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "FAILED",
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attempts_made: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    last_retried_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolved_at: {
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

  await queryInterface.addConstraint("notification_failed_jobs", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "status IN ('FAILED', 'RETRYING', 'RESOLVED')"
    ),
    name: "chk_notification_failed_jobs_status",
  });

  await queryInterface.addConstraint("notification_failed_jobs", {
    fields: ["attempts_made", "retry_count"],
    type: "check",
    where: queryInterface.sequelize.literal(
      "attempts_made >= 0 AND retry_count >= 0"
    ),
    name: "chk_notification_failed_jobs_counts",
  });

  await queryInterface.addIndex("notification_failed_jobs", ["status", "failed_at"], {
    name: "idx_notification_failed_jobs_status_failed_at",
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("notification_failed_jobs");
}
