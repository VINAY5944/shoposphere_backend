import { NOTIFICATION_STATUS } from "../notification.constants.js";
import failedNotificationRepository from "../repositories/failed-notification.repository.js";
import notificationRepository from "../repositories/notification.repository.js";

import createError from "../../../shared/utils/error.js";

const toIsoString = (date) => (date ? date.toISOString() : null);

const serializeNotification = (notification) => ({
  id: notification.id,
  originalJobId: notification.originalJobId,
  latestQueueJobId: notification.latestQueueJobId,
  jobName: notification.jobName,
  recipient: notification.recipient,
  orderNumber: notification.orderNumber,
  status: notification.status,
  attemptsMade: notification.attemptsMade,
  retryCount: notification.retryCount,
  errorMessage: notification.errorMessage,
  queuedAt: notification.queuedAt.toISOString(),
  acceptedAt: toIsoString(notification.acceptedAt),
  sentAt: toIsoString(notification.sentAt),
  deliveredAt: toIsoString(notification.deliveredAt),
  failedAt: toIsoString(notification.failedAt),
  lastRetriedAt: toIsoString(notification.lastRetriedAt),
  createdAt: notification.createdAt.toISOString(),
  updatedAt: notification.updatedAt.toISOString(),
});

const getJobTimestamps = (job) => {
  const queueTimestamp = Number(job.timestamp);
  const finishTimestamp = Number(job.finishedOn);

  return {
    queuedAt: Number.isFinite(queueTimestamp)
      ? new Date(queueTimestamp)
      : new Date(),
    finishedAt: Number.isFinite(finishTimestamp)
      ? new Date(finishTimestamp)
      : new Date(),
  };
};

const notificationDefaultsFromJob = (job, status) => {
  const data = job.data || {};
  const { queuedAt, finishedAt } = getJobTimestamps(job);

  return {
    originalJobId: String(job.id),
    latestQueueJobId: String(job.id),
    jobName: String(job.name || "unknown").slice(0, 100),
    recipient:
      typeof data.email === "string" ? data.email.slice(0, 320) : null,
    orderNumber:
      typeof data.orderNumber === "string"
        ? data.orderNumber.slice(0, 50)
        : null,
    status,
    attemptsMade: Number(job.attemptsMade || 0),
    retryCount: 0,
    errorMessage: null,
    queuedAt,
    acceptedAt:
      status === NOTIFICATION_STATUS.ACCEPTED ? finishedAt : null,
    sentAt: status === NOTIFICATION_STATUS.SENT ? finishedAt : null,
    deliveredAt:
      status === NOTIFICATION_STATUS.DELIVERED ? finishedAt : null,
    failedAt: status === NOTIFICATION_STATUS.FAILED ? finishedAt : null,
    lastRetriedAt: null,
  };
};

const createQueuedNotification = async ({
  jobId,
  jobName,
  email,
  orderNumber,
}) => {
  const [notification] = await notificationRepository.findOrCreateByJobId(
    jobId,
    {
      originalJobId: jobId,
      latestQueueJobId: jobId,
      jobName,
      recipient: email,
      orderNumber,
      status: NOTIFICATION_STATUS.QUEUED,
      attemptsMade: 0,
      retryCount: 0,
      errorMessage: null,
      queuedAt: new Date(),
      acceptedAt: null,
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
      lastRetriedAt: null,
    }
  );

  return notification;
};

const ensureNotificationForJob = async (job, defaultStatus) => {
  let notificationId = job.data?.notificationId;

  if (!notificationId && job.data?.failedNotificationId) {
    const failedJob = await failedNotificationRepository.findById(
      job.data.failedNotificationId
    );
    notificationId = failedJob?.notificationId;
  }

  if (notificationId) {
    const notification = await notificationRepository.findById(
      notificationId
    );

    if (notification) {
      return notification;
    }
  }

  const [notification] = await notificationRepository.findOrCreateByJobId(
    String(job.id),
    notificationDefaultsFromJob(job, defaultStatus)
  );

  return notification;
};

const markQueueFailed = async (notificationId, error) => {
  await notificationRepository.updateById(notificationId, {
    status: NOTIFICATION_STATUS.QUEUE_FAILED,
    errorMessage: String(error?.message || "Notification could not be queued")
      .slice(0, 5000),
    failedAt: new Date(),
  });
};

const recordAttemptFailure = async (job, error, isFinalAttempt) => {
  const notification = await ensureNotificationForJob(
    job,
    NOTIFICATION_STATUS.QUEUED
  );
  const values = {
    latestQueueJobId: String(job.id),
    attemptsMade: Number(job.attemptsMade || 0),
    errorMessage: String(error?.message || "Notification delivery failed")
      .slice(0, 5000),
  };

  if (isFinalAttempt) {
    values.status = NOTIFICATION_STATUS.FAILED;
    values.failedAt = new Date();
  }

  await notificationRepository.updateById(notification.id, values);
  return notificationRepository.findById(notification.id);
};

const ensureFinalFailureForRetainedJob = async (job, error) => {
  const notification = await ensureNotificationForJob(
    job,
    NOTIFICATION_STATUS.FAILED
  );
  const jobId = String(job.id);

  if (
    notification.latestQueueJobId === jobId &&
    notification.status !== NOTIFICATION_STATUS.FAILED
  ) {
    await notificationRepository.updateById(notification.id, {
      status: NOTIFICATION_STATUS.FAILED,
      attemptsMade: Number(job.attemptsMade || 0),
      errorMessage: String(
        error?.message || "Notification delivery failed"
      ).slice(0, 5000),
      failedAt: new Date(),
    });

    return notificationRepository.findById(notification.id);
  }

  return notification;
};

const recordAccepted = async (job) => {
  const notification = await ensureNotificationForJob(
    job,
    NOTIFICATION_STATUS.ACCEPTED
  );
  const jobId = String(job.id);

  if (notification.latestQueueJobId !== jobId) {
    return notification;
  }

  const { finishedAt } = getJobTimestamps(job);

  await notificationRepository.updateById(notification.id, {
    latestQueueJobId: jobId,
    status: NOTIFICATION_STATUS.ACCEPTED,
    attemptsMade: Number(job.attemptsMade || 0),
    errorMessage: null,
    failedAt: null,
    acceptedAt: finishedAt,
  }, {
    status: [
      NOTIFICATION_STATUS.QUEUED,
      NOTIFICATION_STATUS.RETRYING,
      NOTIFICATION_STATUS.ACCEPTED,
    ],
  });

  return notificationRepository.findById(notification.id);
};

const listNotifications = async (query = {}) => {
  const limit = Number(query.limit ?? 20);
  const offset = Number(query.offset ?? 0);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw createError("Limit must be between 1 and 100");
  }

  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    throw createError("Offset must be between 0 and 100000");
  }

  let status;

  if (query.status !== undefined) {
    if (
      typeof query.status !== "string" ||
      !Object.values(NOTIFICATION_STATUS).includes(query.status)
    ) {
      throw createError("Invalid notification status");
    }

    status = query.status;
  }

  const result = await notificationRepository.list({
    limit,
    offset,
    status,
  });

  return {
    data: result.rows.map(serializeNotification),
    pagination: {
      limit,
      offset,
      total: result.count,
    },
  };
};

export default {
  createQueuedNotification,
  markQueueFailed,
  recordAttemptFailure,
  ensureFinalFailureForRetainedJob,
  recordAccepted,
  listNotifications,
};
