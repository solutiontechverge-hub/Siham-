import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import {
  buildInvoicePostDueReminderEmail,
  buildInvoicePreDueReminderEmail,
  buildInvoiceReissuedEmail,
} from "../helpers/financeEmailTemplates.js";
import {
  daysUntilDate,
  durationToDays,
  mergeInvoiceSettings,
} from "../helpers/financeInvoiceSettings.js";

export const FINANCE_EMAIL_TYPES = {
  INVOICE_PRE_DUE: "invoice_pre_due",
  INVOICE_POST_DUE: "invoice_post_due",
  INVOICE_REISSUED: "invoice_reissued",
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
  [FINANCE_EMAIL_TYPES.INVOICE_REISSUED]: {
    subject: "Invoice reissued — new due date",
    build: buildInvoiceReissuedEmail,
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

/**
 * Send a finance email immediately. For reissues, tracks by due-date key so
 * each new due date can notify the client again.
 */
export const sendFinanceClientEmail = async (
  transactionId,
  emailType,
  { forceKey = null } = {},
) => {
  const config = EMAIL_BUILDERS[emailType];
  if (!config) {
    throw new Error(`Unknown finance email type: ${emailType}`);
  }

  const trackType = forceKey ? `${emailType}:${forceKey}` : emailType;

  try {
    if (forceKey) {
      const alreadySent = await hasSentFinanceEmail(transactionId, trackType);
      if (alreadySent) {
        return { sent: false, reason: "already_sent" };
      }
    } else {
      const alreadySent = await hasSentFinanceEmail(transactionId, emailType);
      if (alreadySent) {
        return { sent: false, reason: "already_sent" };
      }
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

    await markFinanceEmailSent(transactionId, trackType);
    return { sent: true, to: ctx.clientEmail };
  } catch (error) {
    console.error(`[finance-email] Failed to send ${emailType} for transaction ${transactionId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

/**
 * Send pre-due reminder emails for every unpaid invoice whose due date matches
 * that professional's Reminder 1 / Reminder 2 settings (days before due).
 */
export const processInvoiceReminders = async () => {
  const outcomes = [];

  const result = await query(
    `SELECT
       ft.id,
       ft.document->>'dueDate' AS due_date,
       COALESCE(ft.document->'issuedSnapshot'->'invoiceSettings', pfs.invoice_settings, '{}'::jsonb) AS invoice_settings
     FROM finance_transactions ft
     LEFT JOIN professional_finance_settings pfs
       ON pfs.professional_profile_id = ft.professional_profile_id
     WHERE ft.status IN ('Payment due', 'Pending')
       AND ft.client_email IS NOT NULL
       AND ft.client_email <> ''
       AND NULLIF(ft.document->>'dueDate', '') IS NOT NULL`,
  );

  for (const row of result.rows) {
    const settings = mergeInvoiceSettings(row.invoice_settings);
    const daysLeft = daysUntilDate(row.due_date);
    if (daysLeft == null || daysLeft < 0) continue;

    const reminderSlots = [
      {
        key: "reminder1",
        days: durationToDays(
          settings.reminders.reminder1Value,
          settings.reminders.reminder1Unit,
        ),
      },
      {
        key: "reminder2",
        days: durationToDays(
          settings.reminders.reminder2Value,
          settings.reminders.reminder2Unit,
        ),
      },
    ];

    for (const slot of reminderSlots) {
      if (slot.days == null || slot.days < 0) continue;
      if (daysLeft !== slot.days) continue;

      const outcome = await sendFinanceClientEmail(
        row.id,
        FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE,
        { forceKey: `${slot.key}:${row.due_date}` },
      );
      outcomes.push({
        transactionId: row.id,
        type: FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE,
        reminder: slot.key,
        ...outcome,
      });
    }
  }

  return outcomes;
};
