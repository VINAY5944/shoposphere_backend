
import emailQueue from "../queues/email.queue.js";
import notificationService from "./notification.service.js";

export const enqueueOrderConfirmationEmail = async ({
  email,
  customerName,
  orderNumber,
  totalAmount,
  currency,
  items = [],
}) => {
  const jobId = `order-confirmation-${orderNumber}`;
  const notification = await notificationService.createQueuedNotification({
    jobId,
    jobName: "order-confirmation",
    email,
    orderNumber,
  });

  try {
    return await emailQueue.add(
      "order-confirmation",
      {
        email,
        customerName,
        orderNumber,
        totalAmount,
        currency,
        items,
        notificationId: notification.id,
      },
      { jobId }
    );
  } catch (error) {
    await notificationService.markQueueFailed(notification.id, error);
    throw error;
  }
};
