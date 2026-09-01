import {
  dangerButton,
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
  `${getFrontendBaseUrl()}/clients/booking/checkout?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const buildEbrRespondUrl = (uniqueCode, action) => {
  const params = new URLSearchParams();
  params.set("ref", String(uniqueCode ?? ""));
  params.set("tab", "upcoming");
  params.set("ebr", action);
  return `${getFrontendBaseUrl()}/clients/booking/checkout?${params.toString()}`;
};

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

const bookingCardEmail = ({
  title,
  salonName,
  professionalName,
  startTime,
  uniqueCode,
  iconType,
  ctaLabel,
  status,
  ctaUrl,
  message,
}) => {
  const detailsUrl = ctaUrl || buildBookingDetailsUrl(uniqueCode);
  const rows = [
    { label: "Professional", value: professionalName },
    { label: "Start Time", value: formatStartTime(startTime) },
    { label: "Booking ID", value: formatBookingId(uniqueCode) },
  ];
  if (status) {
    rows.push({ label: "Status", value: formatStatusLabel(status) });
  }

  const messageHtml = message
    ? `<p style="margin:0 0 16px;font-size:15px;color:#5c6778;line-height:1.5;">${escapeHtml(message)}</p>`
    : "";

  const html = wrapEmail(`
    ${statusIcon(iconType)}
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 4px;font-size:16px;color:#5c6778;font-weight:600;">${escapeHtml(salonName)}</p>
    ${messageHtml}
    ${detailsBox(rows)}
    ${primaryButton(ctaLabel || "View Booking Details", detailsUrl)}
  `);

  const text = `${title}\n${salonName}${message ? `\n${message}` : ""}\nProfessional: ${professionalName}\nStart: ${formatStartTime(startTime)}\nBooking ID: ${formatBookingId(uniqueCode)}${status ? `\nStatus: ${formatStatusLabel(status)}` : ""}\n${detailsUrl}`;
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

export const buildIncomingErEmail = (ctx) => {
  const uniqueCode = ctx.uniqueCode;
  const acceptUrl = buildEbrRespondUrl(uniqueCode, "accept");
  const rejectUrl = buildEbrRespondUrl(uniqueCode, "reject");
  const suggestUrl = buildEbrRespondUrl(uniqueCode, "suggest");
  const rows = [
    { label: "Professional", value: ctx.professionalName },
    { label: "Start Time", value: formatStartTime(ctx.startTime) },
    { label: "Booking ID", value: formatBookingId(uniqueCode) },
  ];
  if (ctx.status) {
    rows.push({ label: "Status", value: formatStatusLabel(ctx.status) });
  }

  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">Incoming ER</h1>
    <p style="margin:0 0 4px;font-size:16px;color:#5c6778;font-weight:600;">${escapeHtml(ctx.salonName)}</p>
    ${detailsBox(rows)}
    <div style="margin-top:8px;">
      ${primaryButton("Accept", acceptUrl)}
    </div>
    <div style="margin-top:12px;">
      ${secondaryButton("Suggest", suggestUrl)}
      ${dangerButton("Reject", rejectUrl)}
    </div>
  `);

  const text = `Incoming ER\n${ctx.salonName}\nProfessional: ${ctx.professionalName}\nStart: ${formatStartTime(ctx.startTime)}\nBooking ID: ${formatBookingId(uniqueCode)}${ctx.status ? `\nStatus: ${formatStatusLabel(ctx.status)}` : ""}\nAccept: ${acceptUrl}\nSuggest: ${suggestUrl}\nReject: ${rejectUrl}`;
  return { html, text };
};

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
    title: ctx.title || "Booking update from your professional",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "info",
    status: ctx.status,
    ctaLabel: "View booking section",
    message: ctx.message || null,
  });

export const buildReviewInviteEmail = (ctx) => {
  const reviewUrl =
    ctx.reviewUrl ||
    `${getFrontendBaseUrl()}/reviews/write?token=${encodeURIComponent(String(ctx.inviteToken || ""))}`;

  return bookingCardEmail({
    title: "How was your visit?",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "confirmed",
    status: "completed",
    ctaLabel: "Write a review",
    ctaUrl: reviewUrl,
  });
};

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

export const buildBookingRequestSentEmail = (ctx) =>
  bookingCardEmail({
    title: "Booking request sent",
    salonName: ctx.salonName,
    professionalName: ctx.professionalName,
    startTime: ctx.startTime,
    uniqueCode: ctx.uniqueCode,
    iconType: "info",
    status: ctx.status || "requested",
    ctaLabel: "View booking",
    ctaUrl: buildPaymentUrl(ctx.uniqueCode),
    message: "Your booking request was sent. You will be notified when the professional responds.",
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
    message: ctx.clientName
      ? `Prepayment received from ${ctx.clientName}.`
      : "Prepayment received from the client.",
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

/** Generic email mirroring an in-app notification. */
export const buildNotificationCompanionEmail = (ctx) => {
  const base = getFrontendBaseUrl().replace(/\/$/, "");
  const path = String(ctx.href || "").startsWith("/") ? ctx.href : `/${ctx.href || ""}`;
  const detailsUrl = `${base}${path || "/"}`;
  const rows = [];
  if (ctx.actorName) rows.push({ label: "From", value: ctx.actorName });
  if (ctx.bookingRef) rows.push({ label: "Booking ID", value: formatBookingId(ctx.bookingRef) });
  if (ctx.message) rows.push({ label: "Details", value: ctx.message });

  const html = wrapEmail(`
    ${statusIcon(ctx.iconType || "info")}
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">${escapeHtml(ctx.title || "Update")}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c6778;">
      ${escapeHtml(ctx.message || "You have a new update on Mollure.")}
    </p>
    ${rows.length ? detailsBox(rows) : ""}
    ${primaryButton(ctx.ctaLabel || "Open Mollure", detailsUrl)}
  `);
  const text = `${ctx.title || "Update"}\n${ctx.message || ""}\n${detailsUrl}`;
  return { html, text };
};

export { formatBookingId, formatStartTime, buildBookingDetailsUrl };
