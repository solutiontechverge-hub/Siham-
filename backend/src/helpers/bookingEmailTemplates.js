const BRAND_TEAL = "#0d9ea8";
const TEXT_PRIMARY = "#1a2b42";
const TEXT_MUTED = "#5c6778";
const TEXT_LIGHT = "#9aa3b2";
const CARD_BG = "#ffffff";
const DETAILS_BG = "#f3f5f7";
const FOOTER_BG = "#f7f9fb";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatBookingId = (uniqueCode) => {
  const code = String(uniqueCode ?? "").trim();
  if (!code) return "BK-00000";
  if (code.toUpperCase().startsWith("BK-")) return code.toUpperCase();
  return `BK-${code}`;
};

const formatStartTime = (startTime) => {
  if (!startTime) return "—";
  const date = startTime instanceof Date ? startTime : new Date(startTime);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

const buildBookingDetailsUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/clients/booking?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const buildReviewUrl = (uniqueCode, rating) => {
  const base = `${getFrontendBaseUrl()}/clients/booking?ref=${encodeURIComponent(String(uniqueCode ?? ""))}&action=review`;
  return rating ? `${base}&rating=${rating}` : base;
};

const buildPaymentUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/clients/booking/checkout?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const buildInvoiceUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/api/finance/invoice?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const logoBlock = () => `
  <div style="text-align:center;padding:28px 24px 12px;">
  <span style="display:inline-block;width:28px;height:28px;background:${BRAND_TEAL};border-radius:50%;margin-right:8px;vertical-align:middle;"></span>
  <strong style="font-size:22px;color:${TEXT_PRIMARY};vertical-align:middle;">Mollure</strong>
  </div>`;

const footerBlock = () => {
  const year = new Date().getFullYear();
  const address =
    process.env.MOLLURE_COMPANY_ADDRESS ||
    "123 Beauty Lane, Suite 100, Wellness City, 90210";
  const privacyUrl = `${getFrontendBaseUrl()}/privacy`;
  const unsubscribeUrl = `${getFrontendBaseUrl()}/clients/profile?tab=notifications`;

  return `
    <div style="background:${FOOTER_BG};padding:24px;text-align:center;margin-top:8px;">
      <p style="margin:0 0 8px;font-size:13px;color:${TEXT_MUTED};">f &nbsp; ig &nbsp; web</p>
      <p style="margin:0 0 4px;font-size:12px;color:${TEXT_LIGHT};">Mollure Inc. © ${year}. All Rights Reserved.</p>
      <p style="margin:0 0 12px;font-size:12px;color:${TEXT_LIGHT};">${escapeHtml(address)}</p>
      <p style="margin:0;font-size:12px;">
        <a href="${unsubscribeUrl}" style="color:${TEXT_MUTED};text-decoration:none;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="${privacyUrl}" style="color:${TEXT_MUTED};text-decoration:none;">Privacy Policy</a>
      </p>
    </div>`;
};

const detailsBox = ({ professionalName, startTime, uniqueCode }) => `
  <div style="background:${DETAILS_BG};border-radius:10px;padding:18px 20px;text-align:left;margin:20px 0;">
    <p style="margin:0 0 10px;font-size:14px;color:${TEXT_PRIMARY};">
      <strong>Professional:</strong> ${escapeHtml(professionalName)}
    </p>
    <p style="margin:0 0 10px;font-size:14px;color:${TEXT_PRIMARY};">
      🕐 <strong>Start Time:</strong> ${escapeHtml(formatStartTime(startTime))}
    </p>
    <p style="margin:0;font-size:14px;color:${TEXT_PRIMARY};">
      # <strong>Booking ID:</strong> ${escapeHtml(formatBookingId(uniqueCode))}
    </p>
  </div>`;

const primaryButton = (label, href) => `
  <a href="${href}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
    ${escapeHtml(label)}
  </a>`;

const secondaryButton = (label, href) => `
  <a href="${href}" style="display:inline-block;padding:14px 24px;background:#ffffff;color:${TEXT_PRIMARY};text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #d5dbe3;margin-right:12px;">
    ${escapeHtml(label)}
  </a>`;

const wrapEmail = (innerHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#eef2f6;">
    ${logoBlock()}
    <div style="margin:0 16px 24px;background:${CARD_BG};border-radius:12px;box-shadow:0 4px 24px rgba(26,43,66,0.08);padding:32px 28px;text-align:center;">
      ${innerHtml}
    </div>
    ${footerBlock()}
  </div>
</body>
</html>`;

const statusIcon = (type) => {
  if (type === "confirmed") {
    return `<div style="width:52px;height:52px;border-radius:50%;background:${BRAND_TEAL};color:#fff;font-size:28px;line-height:52px;margin:0 auto 16px;">✓</div>`;
  }
  if (type === "cancelled") {
    return `<div style="width:52px;height:52px;border-radius:50%;background:#e53935;color:#fff;font-size:28px;line-height:52px;margin:0 auto 16px;">✕</div>`;
  }
  if (type === "reminder") {
    return `<div style="font-size:36px;margin:0 auto 16px;">🔔</div>`;
  }
  return "";
};

const bookingCardEmail = ({ title, salonName, professionalName, startTime, uniqueCode, iconType, ctaLabel }) => {
  const detailsUrl = buildBookingDetailsUrl(uniqueCode);
  const html = wrapEmail(`
    ${statusIcon(iconType)}
    <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_PRIMARY};">${escapeHtml(title)}</h1>
    <p style="margin:0 0 4px;font-size:16px;color:${TEXT_MUTED};font-weight:600;">${escapeHtml(salonName)}</p>
    ${detailsBox({ professionalName, startTime, uniqueCode })}
    ${primaryButton(ctaLabel || "View Booking Details", detailsUrl)}
  `);

  const text = `${title}\n${salonName}\nProfessional: ${professionalName}\nStart: ${formatStartTime(startTime)}\nBooking ID: ${formatBookingId(uniqueCode)}\n${detailsUrl}`;
  return { html, text };
};

export const buildBookingConfirmedEmail = (ctx) =>
  bookingCardEmail({
    title: "Booking has been confirmed",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "confirmed",
  });

export const buildIncomingErEmail = (ctx) =>
  bookingCardEmail({
    title: "Incoming ER",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: null,
  });

export const buildBookingCancelledEmail = (ctx) =>
  bookingCardEmail({
    title: "Booking Cancelled",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "cancelled",
  });

export const buildAppointmentReminderEmail = (ctx) =>
  bookingCardEmail({
    title: "Appointment Reminder",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "reminder",
    ctaLabel: "View booking details",
  });

export const buildPostTreatmentPaymentEmail = (ctx) => {
  const invoiceUrl = ctx.invoiceUrl || buildInvoiceUrl(ctx.uniqueCode);
  const paymentUrl = ctx.paymentUrl || buildPaymentUrl(ctx.uniqueCode);
  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_PRIMARY};">After/Post treatment payment</h1>
    <p style="margin:0 0 4px;font-size:16px;color:${TEXT_MUTED};font-weight:600;">${escapeHtml(ctx.salonName)}</p>
    ${detailsBox({
      professionalName: ctx.professionalName,
      startTime: ctx.startTime,
      uniqueCode: ctx.uniqueCode,
    })}
    <div style="margin-top:8px;">
      ${secondaryButton("Invoice Pdf", invoiceUrl)}
      ${primaryButton("Payment Link", paymentUrl)}
    </div>
  `);
  const text = `After/Post treatment payment\n${ctx.salonName}\nInvoice: ${invoiceUrl}\nPayment: ${paymentUrl}`;
  return { html, text };
};

export const buildReviewRequestEmail = (ctx) => {
  const serviceName = ctx.serviceName || "your service";
  const reviewBaseUrl = buildReviewUrl(ctx.uniqueCode);
  const starLinks = [1, 2, 3, 4, 5]
    .map(
      (rating) =>
        `<a href="${buildReviewUrl(ctx.uniqueCode, rating)}" style="font-size:32px;color:#d5dbe3;text-decoration:none;margin:0 4px;">☆</a>`,
    )
    .join("");

  const html = wrapEmail(`
    <h1 style="margin:0 0 12px;font-size:24px;color:${TEXT_PRIMARY};">How was the service?</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
      I'd love to hear your feedback on your recent appointment. Your review helps other clients and allows professionals to improve.
    </p>
    <p style="margin:0 0 20px;font-size:16px;color:${TEXT_MUTED};font-weight:600;">${escapeHtml(ctx.salonName)}</p>
    <div style="background:${DETAILS_BG};border-radius:10px;padding:20px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;color:${TEXT_PRIMARY};">
        Rate your experience for &ldquo;${escapeHtml(serviceName)}&rdquo;
      </p>
      <div style="margin:0 0 16px;">${starLinks}</div>
      <p style="margin:0 0 16px;font-size:13px;color:${TEXT_LIGHT};">Share your thoughts on Mollure</p>
      ${primaryButton("Submit Review", reviewBaseUrl)}
    </div>
  `);
  const text = `How was the service at ${ctx.salonName}? Rate "${serviceName}" here: ${reviewBaseUrl}`;
  return { html, text };
};

export { formatBookingId, formatStartTime, buildBookingDetailsUrl };
