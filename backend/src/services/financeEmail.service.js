import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import {
  buildInvoicePostDueReminderEmail,
  buildInvoicePreDueReminderEmail,
  buildInvoiceReissuedEmail,
  buildRefundCompletedEmail,
} from "../helpers/financeEmailTemplates.js";
import {
  isReminderTriggerDay,
  mergeInvoiceSettings,
  resolveDocumentReminders,
  resolveStoredDueDate,
} from "../helpers/financeInvoiceSettings.js";

export const FINANCE_EMAIL_TYPES = {
  INVOICE_PRE_DUE: "invoice_pre_due",
  INVOICE_POST_DUE: "invoice_post_due",
  INVOICE_REISSUED: "invoice_reissued",
  REFUND_COMPLETED: "refund_completed",
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
  [FINANCE_EMAIL_TYPES.REFUND_COMPLETED]: {
    subject: "Your payment has been refunded",
    build: buildRefundCompletedEmail,
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

const refundMethodLabel = (method) => {
  const value = String(method ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (!value) return "";
  if (value === "online-direct" || value === "onlinedirect") return "Online Direct";
  if (value === "online-non-direct" || value === "onlinenondirect") {
    return "Online transfer / bank";
  }
  if (value === "offline-direct" || value === "offlinedirect") return "Offline Direct";
  if (value === "offline-non-direct" || value === "offlinenondirect") {
    return "Offline transfer / bank";
  }
  if (value.startsWith("online")) return "Online";
  if (value.startsWith("offline") || value.includes("transfer") || value.includes("bank")) {
    return "Bank transfer";
  }
  return String(method).trim();
};

const loadTransactionEmailContext = async (transactionId) => {
  // booking_id is TEXT: sync may store unique_code; manual create may store UUID.
  const result = await query(
    `SELECT
       ft.id,
       ft.client_email,
       ft.client_name,
       ft.net_amount,
       ft.booking_id,
       ft.document,
       ft.status,
       b.unique_code AS booking_code,
       COALESCE(
         NULLIF(TRIM(ft.client_email), ''),
         NULLIF(TRIM(ft.document->'client'->>'email'), ''),
         NULLIF(TRIM(u.email), '')
       ) AS resolved_client_email,
       COALESCE(
         NULLIF(TRIM(ft.client_name), ''),
         NULLIF(TRIM(ft.document->'client'->>'legalName'), ''),
         NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
         NULLIF(TRIM(u.email), '')
       ) AS resolved_client_name,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Your salon') AS salon_name
     FROM finance_transactions ft
     LEFT JOIN bookings b
       ON b.unique_code = ft.booking_id OR b.id::text = ft.booking_id
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     LEFT JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     WHERE ft.id = $1
     LIMIT 1`,
    [transactionId],
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  const doc = row.document ?? {};
  const refundItems = Array.isArray(doc.refundItems)
    ? doc.refundItems
        .map((item) => ({
          name: String(item?.name || item?.label || item?.description || "").trim(),
          amount: Number(item?.amount ?? item?.totalPrice ?? item?.value),
        }))
        .filter((item) => item.name)
    : [];
  const clientEmail = String(row.resolved_client_email || "").trim();
  // Persist resolved email so retries / activity don't miss the client again.
  if (clientEmail && !String(row.client_email || "").trim()) {
    void query(
      `UPDATE finance_transactions
       SET client_email = $2, updated_at = NOW()
       WHERE id = $1 AND (client_email IS NULL OR TRIM(client_email) = '')`,
      [row.id, clientEmail],
    ).catch(() => {});
  }
  return {
    transactionId: row.id,
    clientEmail,
    clientName: row.resolved_client_name || row.client_name,
    amount: doc.refundAmount ?? row.net_amount,
    bookingId: row.booking_code || row.booking_id,
    documentNumber: doc.creditNoteNumber || doc.documentNumber,
    dueDate: doc.dueDate,
    salonName: row.salon_name,
    status: row.status,
    refundMethod: refundMethodLabel(doc.refundMethod),
    refundMode: doc.refundMode === "item" || doc.refundMode === "amount" ? doc.refundMode : null,
    refundReason: doc.refundReason ? String(doc.refundReason).trim() : "",
    refundItems,
    refundBankDetails: doc.refundBankDetails || null,
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
 * Send pre-due reminder emails for every unpaid invoice whose stored due date
 * matches Reminder 1 / Reminder 2 lead timing (value + Days|Weeks before due).
 * Trigger dates are computed only from the frozen due date — never from live
 * "today + payment terms" recalculation.
 */
export const processInvoiceReminders = async () => {
  const outcomes = [];

  const result = await query(
    `SELECT
       ft.id,
       ft.payment_deadline,
       ft.document,
       COALESCE(pfs.invoice_settings, '{}'::jsonb) AS live_settings
     FROM finance_transactions ft
     LEFT JOIN professional_finance_settings pfs
       ON pfs.professional_profile_id = ft.professional_profile_id
     WHERE ft.status IN ('Payment due', 'Pending')
       AND ft.client_email IS NOT NULL
       AND ft.client_email <> ''
       AND COALESCE(ft.payment_deadline, NULLIF(ft.document->>'dueDate', '')::date) IS NOT NULL`,
  );

  for (const row of result.rows) {
    const doc = row.document ?? {};
    const storedDue = resolveStoredDueDate(
      row.payment_deadline,
      doc.dueDate,
    );
    if (!storedDue) continue;

    const live = mergeInvoiceSettings(row.live_settings);
    const reminders = resolveDocumentReminders(doc, live.reminders);

    const reminderSlots = [
      {
        key: "reminder1",
        value: reminders.reminder1Value,
        unit: reminders.reminder1Unit,
      },
      {
        key: "reminder2",
        value: reminders.reminder2Value,
        unit: reminders.reminder2Unit,
      },
    ];

    for (const slot of reminderSlots) {
      if (!isReminderTriggerDay(storedDue, slot.value, slot.unit)) continue;

      const outcome = await sendFinanceClientEmail(
        row.id,
        FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE,
        { forceKey: `${slot.key}:${storedDue}` },
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
