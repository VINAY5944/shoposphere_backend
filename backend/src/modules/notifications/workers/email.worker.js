
import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import sequelize from "../../../config/database.js";
import { EMAIL_QUEUE_NAME } from "../email.constants.js";
import emailQueue from "../queues/email.queue.js";
import failedNotificationService from "../services/failed-notification.service.js";
import notificationService from "../services/notification.service.js";
import { buildOrderConfirmationEmail } from "../templates/orderConfirmation.template.js";

const redisConnection = {
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT || 6379),
};

const requiredSmtpSettings = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];
const missingSmtpSettings = requiredSmtpSettings.filter(
  (setting) => !process.env[setting]
);

if (missingSmtpSettings.length > 0) {
  throw new Error(
    `Missing SMTP settings: ${missingSmtpSettings.join(", ")}`
  );
}

const smtpPort = Number(process.env.SMTP_PORT);

if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
  throw new Error("SMTP_PORT must be a positive integer");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD.replace(/\s/g, ""),
  },
});

const pendingNotificationUpdates = new Set();

const trackNotificationUpdate = (operation, message) => {
  let task;
  task = operation()
    .catch((error) => {
      console.error(message, error);
    })
    .finally(() => {
      pendingNotificationUpdates.delete(task);
    });

  pendingNotificationUpdates.add(task);
};

const reconcileRetainedFailures = async () => {
  const batchSize = 100;
  let start = 0;
  let scanned = 0;

  while (true) {
    const jobs = await emailQueue.getFailed(start, start + batchSize - 1);

    for (const job of jobs) {
      const maxAttempts = Number(job.opts.attempts || 1);

      if (job.attemptsMade < maxAttempts) {
        continue;
      }

      const error = new Error(
        job.failedReason || "Notification delivery failed"
      );
      const notification =
        await notificationService.ensureFinalFailureForRetainedJob(
          job,
          error
        );

      await failedNotificationService.recordFinalFailure(
        {
          ...job,
          data: {
            ...job.data,
            notificationId: notification.id,
          },
        },
        error
      );
      scanned += 1;
    }

    if (jobs.length < batchSize) {
      break;
    }

    start += jobs.length;
  }

  console.log(`Reconciled ${scanned} retained failed email jobs`);
};

const reconcileRetainedCompletions = async () => {
  const batchSize = 100;
  let start = 0;
  let scanned = 0;

  while (true) {
    const jobs = await emailQueue.getCompleted(start, start + batchSize - 1);

    for (const job of jobs) {
      await notificationService.recordAccepted(job);

      if (job.data?.failedNotificationId) {
        await failedNotificationService.markRetryResolved(
          job.data.failedNotificationId,
          job.id
        );
      }

      scanned += 1;
    }

    if (jobs.length < batchSize) {
      break;
    }

    start += jobs.length;
  }

  console.log(`Reconciled ${scanned} retained completed email jobs`);
};

const reconcileRetainedNotifications = async () => {
  await reconcileRetainedCompletions();
  await reconcileRetainedFailures();
};

const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    if (job.name !== "order-confirmation") {
      throw new Error(`Unsupported email job: ${job.name}`);
    }

    const {
      email,
      customerName,
      orderNumber,
      totalAmount,
      currency,
      items,
    } = job.data;
    const emailContent = buildOrderConfirmationEmail({
      customerName,
      orderNumber,
      totalAmount,
      currency,
      items,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `ShopSphere - Order ${orderNumber} confirmed`,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log(
      `Order confirmation email accepted by SMTP provider: ${orderNumber}`
    );
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);

  trackNotificationUpdate(
    () => notificationService.recordAccepted(job),
    `Could not mark email job ${job.id} as accepted:`
  );

  const failedNotificationId = job.data?.failedNotificationId;

  if (failedNotificationId) {
    trackNotificationUpdate(
      () =>
        failedNotificationService.markRetryResolved(
          failedNotificationId,
          job.id
        ),
      `Could not mark notification retry ${failedNotificationId} as resolved:`
    );
  }
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);

  if (!job) {
    return;
  }

  const maxAttempts = Number(job.opts.attempts || 1);
  const isFinalAttempt = job.attemptsMade >= maxAttempts;

  trackNotificationUpdate(
    async () => {
      const notification = await notificationService.recordAttemptFailure(
        job,
        error,
        isFinalAttempt
      );

      if (isFinalAttempt) {
        await failedNotificationService.recordFinalFailure(
          {
            ...job,
            data: {
              ...job.data,
              notificationId: notification.id,
            },
          },
          error
        );
      }
    },
    `Could not persist failure for email job ${job.id}:`
  );
});

emailWorker.on("error", (error) => {
  console.error("Email worker error:", error);
});

const startupReconciliation = reconcileRetainedNotifications().catch((error) => {
  console.error("Could not reconcile retained failed email jobs:", error);
});

const shutdown = async () => {
  console.log("Shutting down email worker...");

  await emailWorker.close();
  await startupReconciliation;
  await Promise.all([...pendingNotificationUpdates]);
  await emailQueue.close();
  await transporter.close();
  await sequelize.close();

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("Email worker is running...");
