import FailedNotificationJob from "../models/FailedNotificationJob.js";
import { FAILED_NOTIFICATION_STATUS } from "../failed-notification.constants.js";

const findById = async (id) => FailedNotificationJob.findByPk(id);

const list = async ({ limit, offset }) =>
  FailedNotificationJob.findAndCountAll({
    limit,
    offset,
    order: [["failedAt", "DESC"], ["id", "DESC"]],
  });

const createIfMissing = async (originalJobId, values) => {
  const [record] = await FailedNotificationJob.findOrCreate({
    where: { originalJobId },
    defaults: values,
  });

  return record;
};

const attachNotificationIfMissing = async (originalJobId, notificationId) => {
  const [updated] = await FailedNotificationJob.update(
    { notificationId },
    {
      where: {
        originalJobId,
        notificationId: null,
      },
    }
  );

  return updated === 1;
};

const markRetryFailed = async (id, latestQueueJobId, values) => {
  const [updated] = await FailedNotificationJob.update(values, {
    where: {
      id,
      latestQueueJobId,
      status: FAILED_NOTIFICATION_STATUS.RETRYING,
    },
  });

  return updated === 1;
};

const markResolved = async (id, latestQueueJobId, resolvedAt) => {
  const [updated] = await FailedNotificationJob.update(
    {
      status: FAILED_NOTIFICATION_STATUS.RESOLVED,
      resolvedAt,
    },
    {
      where: {
        id,
        latestQueueJobId,
        status: FAILED_NOTIFICATION_STATUS.RETRYING,
      },
    }
  );

  if (updated === 1) {
    return true;
  }

  const record = await FailedNotificationJob.findByPk(id);
  return (
    record?.status === FAILED_NOTIFICATION_STATUS.RESOLVED &&
    record.latestQueueJobId === latestQueueJobId
  );
};

export default {
  findById,
  list,
  createIfMissing,
  attachNotificationIfMissing,
  markRetryFailed,
  markResolved,
};
