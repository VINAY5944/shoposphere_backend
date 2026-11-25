import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOrderConfirmationEmail } from "../../src/modules/notifications/templates/orderConfirmation.template.js";

test("order confirmation includes item details in text and HTML", () => {
  const email = buildOrderConfirmationEmail({
    customerName: "Asha",
    orderNumber: "ORD-123",
    totalAmount: "24.00",
    currency: "INR",
    items: [
      {
        productName: "<Steel Spoon & Fork>",
        sku: "SPN-1",
        quantity: 2,
        unitPrice: "12.00",
        lineTotal: "24.00",
      },
    ],
  });

  assert.match(email.text, /<Steel Spoon & Fork>/);
  assert.match(email.text, /\(SKU: SPN-1\), quantity: 2, INR 24\.00/);
  assert.match(email.html, /&lt;Steel Spoon &amp; Fork&gt;/);
  assert.match(email.html, /SKU: SPN-1/);
  assert.match(email.html, /INR 12\.00 each/);
  assert.match(email.html, /INR 24\.00/);
  assert.doesNotMatch(email.html, /<Steel Spoon & Fork>/);
});

test("order confirmation handles older jobs without item data", () => {
  const email = buildOrderConfirmationEmail({
    customerName: "Asha",
    orderNumber: "ORD-123",
    totalAmount: "24.00",
    currency: "INR",
  });

  assert.match(email.text, /Item details are unavailable/);
  assert.match(email.html, /Item details are unavailable/);
});
