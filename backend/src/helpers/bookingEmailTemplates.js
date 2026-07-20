import {
  detailsBox,
  escapeHtml,
  getFrontendBaseUrl,
  primaryButton,
  secondaryButton,
  statusIcon,
  wrapEmail,
} from "./emailLayout.js";

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

const buildBookingDetailsUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/clients/booking?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const buildPaymentUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/clients/booking/checkout?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const buildInvoiceUrl = (uniqueCode) =>
  `${getFrontendBaseUrl()}/api/finance/invoice?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const formatStatusLabel = (status) => {
  const labels = {
    requested: "Requested",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
    no_show: "No show",
  };
  return labels[status] || String(status ?? "—");
};

const bookingCardEmail = ({ title, salonName, professionalName, startTime, uniqueCode, iconType, ctaLabel, status, ctaUrl }) => {
  const detailsUrl = ctaUrl || buildBookingDetailsUrl(uniqueCode);
  const rows = [
    { label: "Professional", value: professionalName },
    { label: "Start Time", value: formatStartTime(startTime) },
    { label: "Booking ID", value: formatBookingId(uniqueCode) },
  ];
  if (status) {
    rows.push({ label: "Status", value: formatStatusLabel(status) });
  }

  const html = wrapEmail(`
    ${statusIcon(iconType)}
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 4px;font-size:16px;color:#5c6778;font-weight:600;">${escapeHtml(salonName)}</p>
    ${detailsBox(rows)}
    ${primaryButton(ctaLabel || "View Booking Details", detailsUrl)}
  `);

  const text = `${title}\n${salonName}\nProfessional: ${professionalName}\nStart: ${formatStartTime(startTime)}\nBooking ID: ${formatBookingId(uniqueCode)}${status ? `\nStatus: ${formatStatusLabel(status)}` : ""}\n${detailsUrl}`;
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
    status: ctx.status || "confirmed",
  });

export const buildIncomingErEmail = (ctx) =>
  bookingCardEmail({
    title: "Incoming ER",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: null,
    status: ctx.status,
  });

export const buildBookingCancelledEmail = (ctx) =>
  bookingCardEmail({
    title: "Booking Cancelled",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "cancelled",
    status: ctx.status || "cancelled",
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
    status: ctx.status || "confirmed",
  });

export const buildProfessionalActionEmail = (ctx) =>
  bookingCardEmail({
    title: "Booking update from your professional",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "info",
    status: ctx.status,
    ctaLabel: "View booking section",
  });

export const buildNewBookingRequestEmail = (ctx) =>
  bookingCardEmail({
    title: "New booking request",
    salonName: ctx.salonName,
    professionalName: ctx.clientName || "Client",
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "info",
    status: ctx.status || "requested",
    ctaLabel: "View calendar",
    ctaUrl: `${getFrontendBaseUrl()}/professionals/calendar`,
  });

export const buildPrepaymentReceivedEmail = (ctx) =>
  bookingCardEmail({
    title: "Prepayment received",
    salonName: ctx.salonName,
    professionalName: ctx.clientName || "Client",
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "confirmed",
    status: ctx.status || "confirmed",
    ctaLabel: "View calendar",
    ctaUrl: `${getFrontendBaseUrl()}/professionals/calendar`,
  });

export const buildPostTreatmentPaymentEmail = (ctx) => {
  const invoiceUrl = ctx.invoiceUrl || buildInvoiceUrl(ctx.uniqueCode);
  const paymentUrl = ctx.paymentUrl || buildPaymentUrl(ctx.uniqueCode);
  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">After/Post treatment payment</h1>
    <p style="margin:0 0 4px;font-size:16px;color:#5c6778;font-weight:600;">${escapeHtml(ctx.salonName)}</p>
    ${detailsBox([
      { label: "Professional", value: ctx.professionalName },
      { label: "Start Time", value: formatStartTime(ctx.startTime) },
      { label: "Booking ID", value: formatBookingId(ctx.uniqueCode) },
    ])}
    <div style="margin-top:8px;">
      ${secondaryButton("Invoice Pdf", invoiceUrl)}
      ${primaryButton("Payment Link", paymentUrl)}
    </div>
  `);
  const text = `After/Post treatment payment\n${ctx.salonName}\nInvoice: ${invoiceUrl}\nPayment: ${paymentUrl}`;
  return { html, text };
};

export { formatBookingId, formatStartTime, buildBookingDetailsUrl };
