import { FAILED_NOTIFICATION_STATUS } from "../failed-notification.constants.js";
import failedNotificationRepository from "../repositories/failed-notification.repository.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const serializeFailedJob = (record) => {
  const payload = record.payload || {};

  return {
    id: record.id,
    originalJobId: record.originalJobId,
    latestQueueJobId: record.latestQueueJobId,
    jobName: record.jobName,
    recipient: typeof payload.email === "string" ? payload.email : null,
    orderNumber:
      typeof payload.orderNumber === "string" ? payload.orderNumber : null,
    status: record.status,
    errorMessage: record.errorMessage,
    attemptsMade: record.attemptsMade,
    retryCount: record.retryCount,
    failedAt: record.failedAt.toISOString(),
    lastRetriedAt: record.lastRetriedAt
      ? record.lastRetriedAt.toISOString()
      : null,
    resolvedAt: record.resolvedAt
      ? record.resolvedAt.toISOString()
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

const getFailedJobs = async (query = {}) => {
  const limit = Number(query.limit ?? 20);
  const offset = Number(query.offset ?? 0);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw createError("Limit must be between 1 and 100");
  }

  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    throw createError("Offset must be between 0 and 100000");
  }

  const result = await failedNotificationRepository.list({ limit, offset });

  return {
    data: result.rows.map(serializeFailedJob),
    pagination: {
      limit,
      offset,
      total: result.count,
    },
  };
};

const recordFinalFailure = async (job, error) => {
  const jobId = String(job.id);
  const failedNotificationId = job.data?.failedNotificationId;
  const payload = { ...(job.data || {}) };
  delete payload.failedNotificationId;

  const failureValues = {
    latestQueueJobId: jobId,
    notificationId: job.data?.notificationId || null,
    jobName: job.name,
    payload,
    status: FAILED_NOTIFICATION_STATUS.FAILED,
    errorMessage: String(error?.message || "Notification delivery failed").slice(
      0,
      5000
    ),
    attemptsMade: Number(job.attemptsMade || 0),
    failedAt: new Date(),
    resolvedAt: null,
  };

  if (failedNotificationId) {
    const updated = await failedNotificationRepository.markRetryFailed(
      failedNotificationId,
      jobId,
      failureValues
    );

    if (!updated) {
      throw new Error(
        `Failed notification retry record ${failedNotificationId} was not in retrying state`
      );
    }

    return;
  }

  await failedNotificationRepository.createIfMissing(jobId, {
    originalJobId: jobId,
    ...failureValues,
    retryCount: 0,
    lastRetriedAt: null,
  });

  if (failureValues.notificationId) {
    await failedNotificationRepository.attachNotificationIfMissing(
      jobId,
      failureValues.notificationId
    );
  }
};

const markRetryResolved = async (failedNotificationId, jobId) => {
  const updated = await failedNotificationRepository.markResolved(
    failedNotificationId,
    String(jobId),
    new Date()
  );

  if (!updated) {
    throw new Error(
      `Failed notification retry record ${failedNotificationId} could not be marked resolved`
    );
  }
};

export default {
  getFailedJobs,
  recordFinalFailure,
  markRetryResolved,
};
