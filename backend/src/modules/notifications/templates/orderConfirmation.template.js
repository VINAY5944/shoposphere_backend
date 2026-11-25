const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const renderItemHtml = (item, currency) => `
  <tr>
    <td style="padding:16px 12px;border-bottom:1px solid #e8edf4;color:#172033;">
      <strong style="display:block;font-size:14px;line-height:20px;">${escapeHtml(item.productName || "Product")}</strong>
      <span style="display:block;margin-top:3px;color:#718096;font-size:12px;">SKU: ${escapeHtml(item.sku || "-")}</span>
      <span style="display:block;margin-top:3px;color:#718096;font-size:12px;">${escapeHtml(currency)} ${escapeHtml(item.unitPrice)} each</span>
    </td>
    <td align="center" style="padding:16px 8px;border-bottom:1px solid #e8edf4;color:#42526b;font-size:14px;">${escapeHtml(item.quantity)}</td>
    <td align="right" style="padding:16px 12px;border-bottom:1px solid #e8edf4;color:#172033;font-size:14px;font-weight:700;">${escapeHtml(currency)} ${escapeHtml(item.lineTotal)}</td>
  </tr>`;

export const buildOrderConfirmationEmail = ({
  customerName,
  orderNumber,
  totalAmount,
  currency,
  items = [],
}) => {
  const name = typeof customerName === "string" ? customerName : "";
  const orderItems = Array.isArray(items) ? items : [];
  const itemText = orderItems.length
    ? orderItems
        .map(
          (item) =>
            `- ${item.productName} (SKU: ${item.sku}), quantity: ${item.quantity}, ${currency} ${item.lineTotal}`
        )
        .join("\n")
    : "- Item details are unavailable.";
  const itemsHtml = orderItems.length
    ? orderItems.map((item) => renderItemHtml(item, currency)).join("")
    : `
      <tr>
        <td colspan="3" style="padding:18px 12px;color:#718096;text-align:center;font-size:14px;">
          Item details are unavailable.
        </td>
      </tr>`;

  return {
    text: `Hello ${name},

Thank you for your order. Your order is confirmed.

Order number: ${orderNumber}

Items:
${itemText}

Order total: ${currency} ${totalAmount}

Thank you for shopping with ShopSphere!`,
    html: `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:30px 32px;background:#14213d;color:#ffffff;">
                <p style="margin:0 0 22px;color:#a8c7fa;font-size:13px;font-weight:700;letter-spacing:2px;">SHOPSPHERE</p>
                <span style="display:inline-block;padding:6px 10px;border-radius:20px;background:#1f805a;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;">ORDER CONFIRMED</span>
                <h1 style="margin:18px 0 8px;font-size:26px;line-height:34px;">Thank you, ${escapeHtml(name)}!</h1>
                <p style="margin:0;color:#d6deed;font-size:15px;line-height:23px;">We have received your order and are getting it ready.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;">
                <p style="margin:0 0 6px;color:#718096;font-size:12px;font-weight:700;letter-spacing:1px;">ORDER NUMBER</p>
                <p style="margin:0;color:#172033;font-size:18px;font-weight:700;">${escapeHtml(orderNumber)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <thead>
                    <tr style="background:#f6f8fc;">
                      <th align="left" style="padding:11px 12px;color:#718096;font-size:11px;letter-spacing:1px;">ITEM</th>
                      <th align="center" style="padding:11px 8px;color:#718096;font-size:11px;letter-spacing:1px;">QTY</th>
                      <th align="right" style="padding:11px 12px;color:#718096;font-size:11px;letter-spacing:1px;">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding-top:16px;border-top:1px solid #e8edf4;color:#42526b;font-size:15px;font-weight:700;">Order total</td>
                    <td align="right" style="padding-top:16px;border-top:1px solid #e8edf4;color:#14213d;font-size:20px;font-weight:700;">${escapeHtml(currency)} ${escapeHtml(totalAmount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 24px;background:#f6f8fc;color:#718096;font-size:12px;line-height:19px;">
                Thank you for choosing ShopSphere.<br />
                This is an automated order confirmation email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
};
