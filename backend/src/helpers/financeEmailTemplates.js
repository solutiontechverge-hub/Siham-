import {
  detailsBox,
  escapeHtml,
  getFrontendBaseUrl,
  primaryButton,
  secondaryButton,
  simpleEmail,
  wrapEmail,
} from "./emailLayout.js";

const formatEuro = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "€0";
  return `€${n.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const buildPaymentUrl = (bookingId) =>
  `${getFrontendBaseUrl()}/clients/booking/checkout?ref=${encodeURIComponent(String(bookingId ?? ""))}`;

const buildInvoiceUrl = (bookingId) =>
  `${getFrontendBaseUrl()}/api/finance/invoice?ref=${encodeURIComponent(String(bookingId ?? ""))}`;

export const buildInvoicePreDueReminderEmail = (ctx) => {
  const paymentUrl = ctx.paymentUrl || buildPaymentUrl(ctx.bookingId);
  const invoiceUrl = ctx.invoiceUrl || buildInvoiceUrl(ctx.bookingId);
  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">Invoice payment reminder</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c6778;">
      Your invoice is due soon. Please complete your payment before the due date.
    </p>
    ${detailsBox([
      { label: "Invoice", value: ctx.documentNumber || "—" },
      { label: "Amount", value: formatEuro(ctx.amount) },
      { label: "Due date", value: formatDate(ctx.dueDate) },
      { label: "Salon", value: ctx.salonName || "—" },
    ])}
    <div style="margin-top:8px;">
      ${secondaryButton("Invoice PDF", invoiceUrl)}
      ${primaryButton("Payment link", paymentUrl)}
    </div>
  `);
  const text = `Invoice payment reminder\nDue: ${formatDate(ctx.dueDate)}\nAmount: ${formatEuro(ctx.amount)}\nPay: ${paymentUrl}`;
  return { html, text };
};

export const buildInvoicePostDueReminderEmail = (ctx) => {
  const paymentUrl = ctx.paymentUrl || buildPaymentUrl(ctx.bookingId);
  const invoiceUrl = ctx.invoiceUrl || buildInvoiceUrl(ctx.bookingId);
  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">Overdue invoice</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c6778;">
      Your invoice is now overdue. Please complete your payment as soon as possible.
    </p>
    ${detailsBox([
      { label: "Invoice", value: ctx.documentNumber || "—" },
      { label: "Amount", value: formatEuro(ctx.amount) },
      { label: "Due date", value: formatDate(ctx.dueDate) },
      { label: "Salon", value: ctx.salonName || "—" },
    ])}
    <div style="margin-top:8px;">
      ${secondaryButton("Invoice PDF", invoiceUrl)}
      ${primaryButton("Payment link", paymentUrl)}
    </div>
  `);
  const text = `Overdue invoice\nDue: ${formatDate(ctx.dueDate)}\nAmount: ${formatEuro(ctx.amount)}\nPay: ${paymentUrl}`;
  return { html, text };
};

export const buildInvoiceReissuedEmail = (ctx) => {
  const paymentUrl = ctx.paymentUrl || buildPaymentUrl(ctx.bookingId);
  const invoiceUrl = ctx.invoiceUrl || buildInvoiceUrl(ctx.bookingId);
  const html = wrapEmail(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1a2b42;">Invoice reissued</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c6778;">
      Your salon has reissued your invoice with a new payment due date. Please complete your payment by the date below.
    </p>
    ${detailsBox([
      { label: "Invoice", value: ctx.documentNumber || "—" },
      { label: "Amount", value: formatEuro(ctx.amount) },
      { label: "New due date", value: formatDate(ctx.dueDate) },
      { label: "Salon", value: ctx.salonName || "—" },
    ])}
    <div style="margin-top:8px;">
      ${secondaryButton("Invoice PDF", invoiceUrl)}
      ${primaryButton("Payment link", paymentUrl)}
    </div>
  `);
  const text = `Invoice reissued\nNew due date: ${formatDate(ctx.dueDate)}\nAmount: ${formatEuro(ctx.amount)}\nPay: ${paymentUrl}`;
  return { html, text };
};

export const buildRespondToRequestReminderEmail = (ctx) =>
  simpleEmail({
    title: "Reminder: respond to booking request",
    iconType: "reminder",
    bodyHtml: `
      <p style="margin:0 0 12px;">You have a pending booking request that needs your response.</p>
      ${detailsBox([
        { label: "Client", value: ctx.clientName || "—" },
        { label: "Booking ID", value: ctx.bookingId || "—" },
        { label: "Start time", value: ctx.startTime || "—" },
        { label: "Status", value: ctx.status || "requested" },
      ])}`,
    ctaLabel: "View booking requests",
    ctaHref: `${getFrontendBaseUrl()}/professionals/fixed-location/calendar`,
  });
