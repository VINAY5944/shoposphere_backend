import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";
import { FAILED_NOTIFICATION_STATUS } from "../failed-notification.constants.js";

const FailedNotificationJob = sequelize.define(
  "FailedNotificationJob",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    originalJobId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "original_job_id",
    },
    latestQueueJobId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "latest_queue_job_id",
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "notification_id",
    },
    jobName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "job_name",
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: FAILED_NOTIFICATION_STATUS.FAILED,
      validate: {
        isIn: [Object.values(FAILED_NOTIFICATION_STATUS)],
      },
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "error_message",
    },
    attemptsMade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "attempts_made",
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "retry_count",
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "failed_at",
    },
    lastRetriedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_retried_at",
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "resolved_at",
    },
  },
  {
    tableName: "notification_failed_jobs",
    timestamps: true,
    underscored: true,
  }
);

export default FailedNotificationJob;
