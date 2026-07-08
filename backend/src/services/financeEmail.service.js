import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import {
  buildInvoicePostDueReminderEmail,
  buildInvoicePreDueReminderEmail,
} from "../helpers/financeEmailTemplates.js";

export const FINANCE_EMAIL_TYPES = {
  INVOICE_PRE_DUE: "invoice_pre_due",
  INVOICE_POST_DUE: "invoice_post_due",
};

const EMAIL_BUILDERS = {
  [FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE]: {
    subject: "Invoice payment reminder",
    build: buildInvoicePreDueReminderEmail,
  },
  [FINANCE_EMAIL_TYPES.INVOICE_POST_DUE]: {
    subject: "Overdue invoice — payment required",
    build: buildInvoicePostDueReminderEmail,
  },
};

const hasSentFinanceEmail = async (transactionId, emailType) => {
  try {
    const result = await query(
      `SELECT 1 FROM finance_email_notifications WHERE transaction_id = $1 AND email_type = $2 LIMIT 1`,
      [transactionId, emailType],
    );
    return result.rowCount > 0;
  } catch {
    return false;
  }
};

const markFinanceEmailSent = async (transactionId, emailType) => {
  try {
    await query(
      `INSERT INTO finance_email_notifications (transaction_id, email_type)
       VALUES ($1, $2)
       ON CONFLICT (transaction_id, email_type) DO NOTHING`,
      [transactionId, emailType],
    );
  } catch {
    // table may not exist before migration
  }
};

const loadTransactionEmailContext = async (transactionId) => {
  const result = await query(
    `SELECT
       ft.id,
       ft.client_email,
       ft.client_name,
       ft.net_amount,
       ft.booking_id,
       ft.document,
       ft.status,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Your salon') AS salon_name
     FROM finance_transactions ft
     LEFT JOIN bookings b ON b.unique_code = ft.booking_id
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     WHERE ft.id = $1
     LIMIT 1`,
    [transactionId],
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  const doc = row.document ?? {};
  return {
    transactionId: row.id,
    clientEmail: row.client_email,
    clientName: row.client_name,
    amount: row.net_amount,
    bookingId: row.booking_id,
    documentNumber: doc.documentNumber,
    dueDate: doc.dueDate,
    salonName: row.salon_name,
    status: row.status,
  };
};

export const sendFinanceClientEmailOnce = async (transactionId, emailType) => {
  const config = EMAIL_BUILDERS[emailType];
  if (!config) {
    throw new Error(`Unknown finance email type: ${emailType}`);
  }

  try {
    const alreadySent = await hasSentFinanceEmail(transactionId, emailType);
    if (alreadySent) {
      return { sent: false, reason: "already_sent" };
    }

    const ctx = await loadTransactionEmailContext(transactionId);
    if (!ctx?.clientEmail) {
      return { sent: false, reason: "transaction_or_email_not_found" };
    }

    const { html, text } = config.build(ctx);
    await sendMail({
      to: ctx.clientEmail,
      subject: config.subject,
      html,
      text,
    });

    await markFinanceEmailSent(transactionId, emailType);
    return { sent: true, to: ctx.clientEmail };
  } catch (error) {
    console.error(`[finance-email] Failed to send ${emailType} for transaction ${transactionId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

const PRE_DUE_DAYS = Number(process.env.INVOICE_PRE_DUE_REMINDER_DAYS || 3);
const POST_DUE_DAYS = Number(process.env.INVOICE_POST_DUE_REMINDER_DAYS || 1);

export const processInvoiceReminders = async () => {
  const outcomes = [];

  const preDueResult = await query(
    `SELECT ft.id
     FROM finance_transactions ft
     WHERE ft.status IN ('Payment due', 'Pending')
       AND ft.client_email IS NOT NULL
       AND ft.client_email <> ''
       AND (ft.document->>'dueDate') IS NOT NULL
       AND (ft.document->>'dueDate')::date = (CURRENT_DATE + $1::int)
       AND NOT EXISTS (
         SELECT 1 FROM finance_email_notifications n
         WHERE n.transaction_id = ft.id AND n.email_type = $2
       )`,
    [PRE_DUE_DAYS, FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE],
  );

  for (const row of preDueResult.rows) {
    const outcome = await sendFinanceClientEmailOnce(row.id, FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE);
    outcomes.push({ transactionId: row.id, type: FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE, ...outcome });
  }

  const postDueResult = await query(
    `SELECT ft.id
     FROM finance_transactions ft
     WHERE ft.status IN ('Payment due', 'Overdue', 'Pending')
       AND ft.client_email IS NOT NULL
       AND ft.client_email <> ''
       AND (ft.document->>'dueDate') IS NOT NULL
       AND (ft.document->>'dueDate')::date <= (CURRENT_DATE - $1::int)
       AND NOT EXISTS (
         SELECT 1 FROM finance_email_notifications n
         WHERE n.transaction_id = ft.id AND n.email_type = $2
       )`,
    [POST_DUE_DAYS, FINANCE_EMAIL_TYPES.INVOICE_POST_DUE],
  );

  for (const row of postDueResult.rows) {
    const outcome = await sendFinanceClientEmailOnce(row.id, FINANCE_EMAIL_TYPES.INVOICE_POST_DUE);
    outcomes.push({ transactionId: row.id, type: FINANCE_EMAIL_TYPES.INVOICE_POST_DUE, ...outcome });
  }

  return outcomes;
};
