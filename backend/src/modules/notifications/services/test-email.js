
import { enqueueOrderConfirmationEmail } from "./services/email.service.js";
import emailQueue from "./queues/email.queue.js";

const testEmail = async () => {
  try {
    const job = await enqueueOrderConfirmationEmail({
      email: process.env.SMTP_USER,
      customerName: "ShopSphere Test Customer",
      orderNumber: "ORD-TEST-001",
      totalAmount: "1499.00",
      currency: "INR",
    });

    console.log("Email job added successfully:", job.id);
  } catch (error) {
    console.error("Failed to enqueue email:", error);
    process.exitCode = 1;
  } finally {
    await emailQueue.close();
  }
};

testEmail();
