
import crypto from "node:crypto";
import { PAYMENT_STATUS, PAYMENT_METHOD } from "../constants/payment.constants.js";

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isValidPaymentPassword = (enteredPassword) => {
  const configuredPassword = process.env.DUMMY_PAYMENT_PASSWORD;

  if (
    typeof configuredPassword !== "string" ||
    !configuredPassword ||
    typeof enteredPassword !== "string"
  ) {
    return false;
  }

  const enteredBuffer = Buffer.from(enteredPassword);
  const configuredBuffer = Buffer.from(configuredPassword);

  if (enteredBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(enteredBuffer, configuredBuffer);
};

const processPayment = async ({ password, amount, currency = "INR" }) => {
  // Simulate an external payment gateway response.
  await delay(1500);

  const paymentReference = `PAY-${crypto.randomUUID()}`;

  if (!isValidPaymentPassword(password)) {
    return {
      status: PAYMENT_STATUS.FAILED,
      paymentMethod: PAYMENT_METHOD.DUMMY,
      paymentReference,
      amount,
      currency,
      message: "Payment failed. Invalid payment password.",
    };
  }

  return {
    status: PAYMENT_STATUS.SUCCESS,
    paymentMethod: PAYMENT_METHOD.DUMMY,
    paymentReference,
    amount,
    currency,
    message: "Payment successful.",
  };
};

export { processPayment };
