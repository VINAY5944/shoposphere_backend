import failedNotificationService from "../services/failed-notification.service.js";
import notificationService from "../services/notification.service.js";

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.query);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const listFailedJobs = async (req, res, next) => {
  try {
    const result = await failedNotificationService.getFailedJobs(req.query);

    return res.status(200).json({
      success: true,
      message: "Failed notification jobs fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listNotifications,
  listFailedJobs,
};
