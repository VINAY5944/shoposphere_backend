import { DataTypes } from "sequelize";
import sequelize from "../../../config/database.js";
import { NOTIFICATION_STATUS } from "../notification.constants.js";

const Notification = sequelize.define(
  "Notification",
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
    jobName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "job_name",
    },
    recipient: {
      type: DataTypes.STRING(320),
      allowNull: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "order_number",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: NOTIFICATION_STATUS.QUEUED,
      validate: {
        isIn: [Object.values(NOTIFICATION_STATUS)],
      },
    },
    attemptsMade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "attempts_made",
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "retry_count",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
    queuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "queued_at",
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "accepted_at",
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "sent_at",
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "failed_at",
    },
    lastRetriedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_retried_at",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  }
);

export default Notification;
