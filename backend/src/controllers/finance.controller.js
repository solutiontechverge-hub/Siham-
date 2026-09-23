import { query } from "../db/index.js";
import { emitBusinessChangedForProfile } from "../messaging/messagingSocket.js";
import {
  dispatchInvoiceReissuedNotification,
  dispatchPaymentDueSetNotification,
} from "../services/bookingNotification.service.js";
import {
  FINANCE_EMAIL_TYPES,
  sendFinanceClientEmail,
} from "../services/financeEmail.service.js";
import { parseUuid } from "../utils/uuid.js";
import {
  buildPaginationMeta,
  parseListPagination,
  sqlLimitOffset,
  withPaginationParams,
} from "../utils/pagination.js";
import {
  flagFinancePaymentAfterCancel,
  isSettledFinanceStatus,
  processOverdueInvoiceReissues,
  syncBookingToFinanceTransaction,
} from "../services/finance-sync.service.js";
import {
  logAddonPaidActivity,
  logRefundCompletedActivity,
} from "../services/bookingActivity.service.js";
import {
  DEFAULT_INVOICE_SETTINGS,
  mergeInvoiceSettings,
} from "../helpers/financeInvoiceSettings.js";
import { sendCaughtError } from "../utils/httpError.js";

const DEFAULT_TRANSACTION_OPTIONS = {
  onlineImmediate: true,
  onlineInvoiceDueDate: true,
  offlineImmediate: true,
  offlineInvoiceDueDate: false,
};

const getProfessionalProfile = async (userId) => {
  const result = await query(
    `SELECT id, user_id FROM professional_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

const formatEuro = (value) => {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const rounded = Math.round(n * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `€${text}`;
};

const toIsoDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = String(value);
  const wallClock = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return wallClock ? wallClock[1] : text.length >= 10 ? text.slice(0, 10) : text;
};

const mapTransactionRow = (row) => ({
  id: row.id,
  entryType: row.entry_type,
  entryId: row.entry_id,
  date: toIsoDate(row.transaction_date),
  entryLabel: row.entry_label ?? undefined,
  clientName: row.client_name,
  clientEmail: row.client_email ?? "",
  clientType: row.client_type,
  grossAmount: formatEuro(row.gross_amount),
  stripeFee: formatEuro(row.stripe_fee),
  mollureFee: formatEuro(row.mollure_fee),
  netAmount: formatEuro(row.net_amount) ?? "€0",
  methodTitle: row.method_title,
  methodDetail: row.method_detail ?? "",
  status: row.status,
  statusDetail: row.status_detail ?? undefined,
  note: row.note ?? undefined,
  bookingId: row.booking_id ?? undefined,
  document: row.document ?? undefined,
});

const ensureFinanceSettings = async (professionalProfileId) => {
  const existing = await query(
    `SELECT * FROM professional_finance_settings WHERE professional_profile_id = $1`,
    [professionalProfileId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await query(
    `INSERT INTO professional_finance_settings (
      professional_profile_id, subscription_status, stripe_connect_status,
      transaction_options, invoice_settings
    ) VALUES ($1, 'inactive', 'not_connected', $2::jsonb, $3::jsonb)
    RETURNING *`,
    [
      professionalProfileId,
      JSON.stringify(DEFAULT_TRANSACTION_OPTIONS),
      JSON.stringify(DEFAULT_INVOICE_SETTINGS),
    ],
  );
  return inserted.rows[0];
};

const mapSettingsRow = (row) => ({
  subscriptionStatus: row.subscription_status,
  stripeConnectStatus: row.stripe_connect_status,
  transactionOptions: {
    ...DEFAULT_TRANSACTION_OPTIONS,
    ...(row.transaction_options ?? {}),
  },
  invoiceSettings: mergeInvoiceSettings(row.invoice_settings),
});

const requireProfessional = async (req, res) => {
  if (req.user.user_type !== "professional") {
    res.status(403).json({ success: false, message: "Only professionals can access finance.", data: null });
    return null;
  }
  const profile = await getProfessionalProfile(req.user.id);
  if (!profile) {
    res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    return null;
  }
  return profile;
};

const parseCsv = (value) =>
  typeof value === "string" && value.trim()
    ? value.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

const buildTransactionFilters = (queryParams) => {
  const conditions = [];
  const values = [];
  let idx = 2;

  const q = typeof queryParams.q === "string" ? queryParams.q.trim().toLowerCase() : "";
  if (q) {
    conditions.push(`(
      LOWER(client_name) LIKE $${idx}
      OR LOWER(client_email) LIKE $${idx}
      OR LOWER(COALESCE(entry_id, '')) LIKE $${idx}
      OR LOWER(COALESCE(entry_label, '')) LIKE $${idx}
      OR LOWER(COALESCE(booking_id, '')) LIKE $${idx}
    )`);
    values.push(`%${q}%`);
    idx += 1;
  }

  if (queryParams.fromDate) {
    conditions.push(`transaction_date >= $${idx}::date`);
    values.push(queryParams.fromDate);
    idx += 1;
  }
  if (queryParams.toDate) {
    conditions.push(`transaction_date <= $${idx}::date`);
    values.push(queryParams.toDate);
    idx += 1;
  }

  const entryTypes = parseCsv(queryParams.entryTypes);
  if (entryTypes.length) {
    conditions.push(`entry_type = ANY($${idx}::text[])`);
    values.push(entryTypes);
    idx += 1;
  }

  const clientTypes = parseCsv(queryParams.clientTypes);
  if (clientTypes.length) {
    conditions.push(`client_type = ANY($${idx}::text[])`);
    values.push(clientTypes);
    idx += 1;
  }

  const statuses = parseCsv(queryParams.statuses);
  if (statuses.length) {
    conditions.push(`status = ANY($${idx}::text[])`);
    values.push(statuses);
    idx += 1;
  }

  const methodFilter = queryParams.methodFilter;
  if (methodFilter === "onlineDirect") {
    conditions.push(`LOWER(method_title) LIKE 'online%' AND LOWER(method_title) NOT LIKE '%invoice%'`);
  } else if (methodFilter === "onlineInvoice") {
    conditions.push(`LOWER(method_title) LIKE 'online%' AND LOWER(method_title) LIKE '%invoice%'`);
  } else if (methodFilter === "offlineDirect") {
    conditions.push(`LOWER(method_title) LIKE 'offline%' AND LOWER(method_title) NOT LIKE '%invoice%'`);
  } else if (methodFilter === "offlineInvoice") {
    conditions.push(`LOWER(method_title) LIKE 'offline%' AND LOWER(method_title) LIKE '%invoice%'`);
  }

  const txTypes = parseCsv(queryParams.txTypes);
  if (txTypes.length && !methodFilter) {
    const txConditions = [];
    if (txTypes.includes("onlineDirect")) {
      txConditions.push(`(LOWER(method_title) LIKE 'online%' AND LOWER(method_title) NOT LIKE '%invoice%')`);
    }
    if (txTypes.includes("onlineInvoice")) {
      txConditions.push(`(LOWER(method_title) LIKE 'online%' AND LOWER(method_title) LIKE '%invoice%')`);
    }
    if (txTypes.includes("offlineDirect")) {
      txConditions.push(`(LOWER(method_title) LIKE 'offline%' AND LOWER(method_title) NOT LIKE '%invoice%')`);
    }
    if (txTypes.includes("offlineInvoice")) {
      txConditions.push(`(LOWER(method_title) LIKE 'offline%' AND LOWER(method_title) LIKE '%invoice%')`);
    }
    if (txConditions.length) {
      conditions.push(`(${txConditions.join(" OR ")})`);
    }
  }

  return { conditions, values };
};

export const getFinanceSettings = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const row = await ensureFinanceSettings(profile.id);
    return res.status(200).json({
      success: true,
      message: "Finance settings loaded.",
      data: mapSettingsRow(row),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const updateFinanceInvoiceSettings = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    await ensureFinanceSettings(profile.id);
    const invoiceSettings = mergeInvoiceSettings(req.body?.invoiceSettings ?? req.body);

    const result = await query(
      `UPDATE professional_finance_settings
       SET invoice_settings = $2::jsonb, updated_at = NOW()
       WHERE professional_profile_id = $1
       RETURNING *`,
      [profile.id, JSON.stringify(invoiceSettings)],
    );

    emitBusinessChangedForProfile(profile.id, {
      action: "updated",
      scope: "finance",
    });

    return res.status(200).json({
      success: true,
      message: "Invoice settings updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const updateFinanceTransactionOptions = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    await ensureFinanceSettings(profile.id);
    const options = { ...DEFAULT_TRANSACTION_OPTIONS, ...(req.body ?? {}) };

    const result = await query(
      `UPDATE professional_finance_settings
       SET transaction_options = $2::jsonb, updated_at = NOW()
       WHERE professional_profile_id = $1
       RETURNING *`,
      [profile.id, JSON.stringify(options)],
    );

    emitBusinessChangedForProfile(profile.id, {
      action: "updated",
      scope: "finance",
    });

    return res.status(200).json({
      success: true,
      message: "Transaction options updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const updateFinanceStripeStatus = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    await ensureFinanceSettings(profile.id);
    const { subscriptionStatus, stripeConnectStatus, action } = req.body ?? {};

    let nextSubscription;
    let nextConnect;

    if (action === "activate_subscription") {
      nextSubscription = "active";
      nextConnect = "onboarding";
    } else if (action === "deactivate_subscription") {
      nextSubscription = "inactive";
      nextConnect = "not_connected";
    } else if (action === "connect_payments") {
      nextSubscription = "active";
      nextConnect = "connected";
    } else {
      nextSubscription = subscriptionStatus ?? undefined;
      nextConnect = stripeConnectStatus ?? undefined;
    }

    const result = await query(
      `UPDATE professional_finance_settings
       SET subscription_status = COALESCE($2, subscription_status),
           stripe_connect_status = COALESCE($3, stripe_connect_status),
           updated_at = NOW()
       WHERE professional_profile_id = $1
       RETURNING *`,
      [profile.id, nextSubscription ?? null, nextConnect ?? null],
    );

    emitBusinessChangedForProfile(profile.id, {
      action: "updated",
      scope: "finance",
    });

    return res.status(200).json({
      success: true,
      message: "Stripe status updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const listFinanceTransactions = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const { conditions, values } = buildTransactionFilters(req.query);
    const where = conditions.length
      ? `AND ${conditions.join(" AND ")}`
      : "";

    const pagination = parseListPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 500,
      force: true,
    });
    const { clause: limitClause } = sqlLimitOffset(2 + values.length);

    const result = await query(
      `SELECT * FROM finance_transactions
       WHERE professional_profile_id = $1
       ${where}
       ORDER BY COALESCE(transaction_date, created_at::date) DESC, created_at DESC
       ${limitClause}`,
      withPaginationParams([profile.id, ...values], pagination),
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM finance_transactions
       WHERE professional_profile_id = $1 ${where}`,
      [profile.id, ...values],
    );
    const total = countResult.rows[0]?.total ?? 0;

    return res.status(200).json({
      success: true,
      message: "Transactions loaded.",
      data: {
        rows: result.rows.map(mapTransactionRow),
        total,
      },
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: true,
      }),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const createFinanceTransaction = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const body = req.body ?? {};
    const isOnline = body.paymentMethod === "onlineDirect";
    const gross = Number(body.totalPrice) || 0;
    const stripeFee = isOnline ? Math.round(gross * 0.029 * 100) / 100 : null;
    const mollureFee = isOnline ? Math.round(gross * 0.01 * 100) / 100 : null;
    const net = gross - (stripeFee ?? 0) - (mollureFee ?? 0);
    const today = new Date().toISOString().slice(0, 10);
    const entryNum = String(100 + Math.floor(Math.random() * 900));
    const paymentPhase = body.paymentPhase === "addon" ? "addon" : null;
    const isAddon = paymentPhase === "addon";
    const bookingRef =
      (typeof body.bookingRef === "string" && body.bookingRef.trim()) ||
      (typeof body.bookingId === "string" && body.bookingId.trim()) ||
      null;
    const addonId =
      (typeof body.addonId === "string" && body.addonId.trim()) ||
      (isAddon ? `addon-${Date.now()}` : null);

    const lineItems = Array.isArray(body.lines)
      ? body.lines.map((line) => ({
          description: line.name,
          quantity: String(line.quantity ?? 1),
          vat: "21%",
          pricePerUnit: formatEuro(line.unitPrice),
          totalPrice: formatEuro((line.quantity ?? 1) * (line.unitPrice ?? 0)),
        }))
      : [];

    if (body.discountAmount > 0) {
      lineItems.push({
        description: "Discount",
        quantity: "1",
        vat: "0%",
        pricePerUnit: formatEuro(-body.discountAmount),
        totalPrice: formatEuro(-body.discountAmount),
      });
    }

    let bookingUuid = null;
    if (bookingRef) {
      const bookingLookup = await query(
        `SELECT b.id, b.unique_code
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         WHERE bs.professional_profile_id = $1
           AND (b.id::text = $2 OR b.unique_code = $2)
         LIMIT 1`,
        [profile.id, bookingRef],
      );
      if (bookingLookup.rows[0]) {
        bookingUuid = bookingLookup.rows[0].id;
        if (!body.bookingRef) {
          body.bookingRef = bookingLookup.rows[0].unique_code;
        }
      }
    }

    const entryType = bookingRef
      ? body.entryType === "offlineBooking"
        ? "offlineBooking"
        : "onlineBooking"
      : "manualEntry";
    const entryLabel = isAddon
      ? "Add-ons"
      : bookingRef
        ? body.entryLabel || "Booking"
        : "Manual entry";
    const status = isAddon
      ? isOnline
        ? "Pending"
        : "Paid"
      : isOnline
        ? "Pending"
        : "Paid";

    const document = {
      documentNumber: `INV-G${entryNum}`,
      receiptNumber: isOnline ? undefined : `RCP-G${entryNum}`,
      serviceDate: today,
      invoiceDate: today,
      dueDate: today,
      client: {
        legalName: body.clientName ?? "Guest",
        email: body.clientEmail || undefined,
      },
      lineItems,
      totalPrice: formatEuro(gross),
      ...(paymentPhase ? { paymentPhase } : {}),
      ...(addonId ? { addonId, payerKey: addonId } : {}),
    };

    const result = await query(
      `INSERT INTO finance_transactions (
        professional_profile_id, entry_type, entry_id, transaction_date, entry_label,
        client_name, client_email, client_type,
        gross_amount, stripe_fee, mollure_fee, net_amount,
        method_title, method_detail, status, status_detail, booking_id, document
      ) VALUES (
        $1, $2, $3, $4::date, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18::jsonb
      ) RETURNING *`,
      [
        profile.id,
        entryType,
        entryNum,
        today,
        entryLabel,
        body.clientName ?? "Guest",
        body.clientEmail ?? "",
        body.clientType ?? "guest",
        gross,
        stripeFee,
        mollureFee,
        net,
        isOnline ? "Online – direct" : "Offline – direct",
        isOnline ? "iDeal" : "",
        status,
        isOnline ? "Pay within 15 min" : null,
        body.bookingRef || bookingRef,
        JSON.stringify(document),
      ],
    );

    if (isAddon && (bookingUuid || bookingRef)) {
      void logAddonPaidActivity({
        bookingId: bookingUuid,
        bookingCode: body.bookingRef || bookingRef,
        amount: gross,
        actorLabel: body.clientName || "Client",
        addonId,
      });
    }

    return res.status(201).json({
      success: true,
      message: isAddon ? "Add-on sale created." : "Transaction created.",
      data: mapTransactionRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const updateFinanceTransaction = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const id = parseUuid(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid transaction id.", data: null });
    }

    const { status, note } = req.body ?? {};

    const existing = await query(
      `SELECT id, status, gross_amount FROM finance_transactions
       WHERE professional_profile_id = $1 AND id = $2
       LIMIT 1`,
      [profile.id, id],
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: "Transaction not found.", data: null });
    }

    // Cancel Sales voided this row — refuse silent Paid/Prepaid; stamp review flag instead.
    if (
      isSettledFinanceStatus(status) &&
      String(existing.rows[0].status) === "Voided"
    ) {
      const flagged = await flagFinancePaymentAfterCancel(id, {
        intendedStatus: status,
        amount: existing.rows[0].gross_amount,
      });
      return res.status(200).json({
        success: true,
        message: "Payment on canceled sale flagged for review.",
        data: mapTransactionRow(flagged),
      });
    }

    const fields = [];
    const values = [profile.id, id];
    let idx = 3;

    if (status !== undefined) {
      fields.push(`status = $${idx}`);
      values.push(status);
      idx += 1;
    }
    if (note !== undefined) {
      fields.push(`note = $${idx}`);
      values.push(note);
      idx += 1;
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: "No fields to update.", data: null });
    }

    fields.push("updated_at = NOW()");

    const result = await query(
      `UPDATE finance_transactions SET ${fields.join(", ")}
       WHERE professional_profile_id = $1 AND id = $2
       RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: "Transaction not found.", data: null });
    }

    const updated = result.rows[0];
    if (status === "Payment due") {
      const dueDate = updated.document?.dueDate;
      void dispatchPaymentDueSetNotification(updated.id, dueDate ?? null);
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated.",
      data: mapTransactionRow(updated),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const bulkFinanceTransactionAction = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const { ids, action } = req.body ?? {};
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: "Transaction ids are required.", data: null });
    }

    const parsedIds = ids.map((id) => parseUuid(id)).filter(Boolean);
    if (!parsedIds.length) {
      return res.status(400).json({ success: false, message: "Invalid transaction ids.", data: null });
    }

    if (action === "delete") {
      await query(
        `DELETE FROM finance_transactions
         WHERE professional_profile_id = $1 AND id = ANY($2::uuid[])`,
        [profile.id, parsedIds],
      );
      return res.status(200).json({
        success: true,
        message: `Deleted ${parsedIds.length} transaction(s).`,
        data: { affected: parsedIds.length },
      });
    }

    if (action === "refund") {
      const rows = await query(
        `SELECT * FROM finance_transactions
         WHERE professional_profile_id = $1 AND id = ANY($2::uuid[])`,
        [profile.id, parsedIds],
      );

      const notRefundable = rows.rows.filter(
        (row) => row.status !== "Paid" && row.status !== "Prepaid",
      );
      if (notRefundable.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Refund is only available for Paid or Prepaid transactions. Overdue or unpaid entries cannot be refunded.",
          data: null,
        });
      }

      for (const row of rows.rows) {
        const doc = row.document ?? {};
        const creditNoteNumber = `CR-${Date.now().toString().slice(-6)}`;
        const creditDocument = {
          ...doc,
          creditNoteNumber,
          receiptNumber: creditNoteNumber,
          refundAmount: formatEuro(row.net_amount),
          refundedAt: new Date().toISOString().slice(0, 10),
        };
        await query(
          `UPDATE finance_transactions
           SET status = 'Refunded',
               document = $3::jsonb,
               updated_at = NOW()
           WHERE id = $1 AND professional_profile_id = $2`,
          [row.id, profile.id, JSON.stringify(creditDocument)],
        );

        if (row.booking_id) {
          void logRefundCompletedActivity({
            bookingCode: row.booking_id,
            actorLabel: "Professional",
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Refunded ${rows.rows.length} transaction(s) with credit note.`,
        data: { affected: rows.rows.length, status: "Refunded" },
      });
    }

    const statusMap = {
      void: "Voided",
      cancel: "Voided",
    };
    const nextStatus = statusMap[action];
    if (!nextStatus) {
      return res.status(400).json({ success: false, message: "Invalid action.", data: null });
    }

    const result = await query(
      `UPDATE finance_transactions
       SET status = $3, updated_at = NOW()
       WHERE professional_profile_id = $1 AND id = ANY($2::uuid[])
       RETURNING id`,
      [profile.id, parsedIds, nextStatus],
    );

    return res.status(200).json({
      success: true,
      message: `Updated ${result.rows.length} transaction(s).`,
      data: { affected: result.rows.length, status: nextStatus },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

async function resolveBookingIdFromRequest(body) {
  const parsedId = parseUuid(body?.bookingId);
  if (parsedId) return parsedId;

  const bookingRef = String(body?.bookingRef ?? "").trim();
  if (!bookingRef) return null;

  const lookup = await query(`SELECT id FROM bookings WHERE unique_code = $1 LIMIT 1`, [bookingRef]);
  return lookup.rows[0]?.id ?? null;
}

export const createFinanceTransactionFromBooking = async (req, res) => {
  try {
    const bookingId = await resolveBookingIdFromRequest(req.body ?? {});
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId or bookingRef is required.",
        data: null,
      });
    }

    const txId = await syncBookingToFinanceTransaction(bookingId, {
      paymentPhase: req.body?.paymentPhase ?? "full",
      paymentMethod: req.body?.paymentMethod ?? "onlineDirect",
      amountOverride: req.body?.amount ?? null,
      statusOverride: req.body?.status ?? null,
    });

    if (!txId) {
      return res.status(404).json({ success: false, message: "Booking not found.", data: null });
    }

    const result = await query(`SELECT * FROM finance_transactions WHERE id = $1`, [txId]);
    return res.status(201).json({
      success: true,
      message: "Booking synced to finance.",
      data: mapTransactionRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const replaceFinanceTransaction = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const id = parseUuid(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid transaction id.", data: null });
    }

    const existing = await query(
      `SELECT id FROM finance_transactions WHERE id = $1 AND professional_profile_id = $2`,
      [id, profile.id],
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: "Transaction not found.", data: null });
    }

    await query(`DELETE FROM finance_transactions WHERE id = $1 AND professional_profile_id = $2`, [
      id,
      profile.id,
    ]);

    const body = req.body ?? {};
    const isOnline = body.paymentMethod === "onlineDirect";
    const gross = Number(body.totalPrice) || 0;
    const stripeFee = isOnline ? Math.round(gross * 0.029 * 100) / 100 : null;
    const mollureFee = isOnline ? Math.round(gross * 0.01 * 100) / 100 : null;
    const net = gross - (stripeFee ?? 0) - (mollureFee ?? 0);
    const today = new Date().toISOString().slice(0, 10);
    const entryNum = String(100 + Math.floor(Math.random() * 900));

    const result = await query(
      `INSERT INTO finance_transactions (
        professional_profile_id, entry_type, entry_id, transaction_date, entry_label,
        client_name, client_email, client_type,
        gross_amount, stripe_fee, mollure_fee, net_amount,
        method_title, method_detail, status, document
      ) VALUES (
        $1, 'manualEntry', $2, $3::date, 'Manual entry (replaced)',
        $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb
      ) RETURNING *`,
      [
        profile.id,
        entryNum,
        today,
        body.clientName ?? "Guest",
        body.clientEmail ?? "",
        body.clientType ?? "guest",
        gross,
        stripeFee,
        mollureFee,
        net,
        isOnline ? "Online – direct" : "Offline – direct",
        isOnline ? "iDeal" : "",
        isOnline ? "Pending" : "Paid",
        JSON.stringify({
          documentNumber: `INV-RPL-${entryNum}`,
          serviceDate: today,
          invoiceDate: today,
          dueDate: today,
          totalPrice: formatEuro(gross),
          replacedTransactionId: id,
        }),
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Transaction replaced.",
      data: mapTransactionRow(result.rows[0]),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const processFinanceInvoiceReissues = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const created = await processOverdueInvoiceReissues(profile.id);
    return res.status(200).json({
      success: true,
      message: `Processed ${created} overdue invoice reissue(s).`,
      data: { created },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

/**
 * Professional reissues invoice / extends due date for a booking.
 * Updates finance transaction, then notifies client in-app + by email.
 */
export const reissueFinanceInvoiceForBooking = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    const body = req.body ?? {};
    const dueDate = toIsoDate(body.dueDate);
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "dueDate is required (YYYY-MM-DD).",
        data: null,
      });
    }

    const bookingId = await resolveBookingIdFromRequest(body);
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId or bookingRef is required.",
        data: null,
      });
    }

    const bookingLookup = await query(
      `SELECT
         b.id,
         b.unique_code,
         b.total_price,
         b.customer_id,
         u.email AS customer_email,
         COALESCE(
           NULLIF(TRIM(COALESCE(ip.display_name, ip.first_name || ' ' || ip.last_name)), ''),
           u.email,
           'Client'
         ) AS customer_name
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       LEFT JOIN users u ON u.id = b.customer_id
       LEFT JOIN individual_profiles ip ON ip.user_id = u.id
       WHERE b.id = $1
         AND bs.professional_profile_id = $2
       LIMIT 1`,
      [bookingId, profile.id],
    );

    const booking = bookingLookup.rows[0];
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found for this professional.",
        data: null,
      });
    }

    const bookingRef = booking.unique_code;
    const penaltyAmount = Number(body.penaltyAmount) || 0;
    const totalOverride =
      body.totalPrice != null && body.totalPrice !== ""
        ? Number(body.totalPrice)
        : null;

    let txId = null;
    const existingTx = await query(
      `SELECT id, document, net_amount, gross_amount, status, client_email, client_name
       FROM finance_transactions
       WHERE professional_profile_id = $1
         AND booking_id = $2
         AND status NOT IN ('Paid', 'Refunded', 'Voided', 'Prepaid')
       ORDER BY
         CASE WHEN status IN ('Payment due', 'Overdue', 'Pending') THEN 0 ELSE 1 END,
         updated_at DESC NULLS LAST,
         created_at DESC NULLS LAST
       LIMIT 1`,
      [profile.id, bookingRef],
    );

    if (existingTx.rows[0]) {
      txId = existingTx.rows[0].id;
    } else {
      txId = await syncBookingToFinanceTransaction(bookingId, {
        paymentPhase: "full",
        paymentMethod: body.paymentMethod || "onlineNonDirect",
        amountOverride:
          totalOverride != null && Number.isFinite(totalOverride)
            ? totalOverride
            : null,
        statusOverride: "Payment due",
      });
    }

    if (!txId) {
      return res.status(404).json({
        success: false,
        message: "Unable to find or create a finance transaction for this booking.",
        data: null,
      });
    }

    const current = await query(`SELECT * FROM finance_transactions WHERE id = $1`, [txId]);
    const row = current.rows[0];
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Finance transaction not found.",
        data: null,
      });
    }

    const doc = row.document && typeof row.document === "object" ? { ...row.document } : {};
    const prevNumber = doc.documentNumber || `INV-${bookingRef}`;
    const reissueNumber = String(prevNumber).includes("-R")
      ? prevNumber
      : `${prevNumber}-R${Date.now().toString().slice(-4)}`;

    const baseAmount =
      totalOverride != null && Number.isFinite(totalOverride)
        ? totalOverride
        : Number(row.net_amount ?? row.gross_amount ?? booking.total_price ?? 0) || 0;
    const nextAmount = Math.round((baseAmount + (Number.isFinite(penaltyAmount) ? penaltyAmount : 0)) * 100) / 100;

    const nextDoc = {
      ...doc,
      documentNumber: reissueNumber,
      invoiceDate: toIsoDate(new Date()),
      dueDate,
      totalPrice: formatEuro(nextAmount),
      reissuedAt: new Date().toISOString(),
      ...(penaltyAmount > 0 ? { penaltyAmount } : {}),
    };

    const clientEmail =
      String(body.clientEmail ?? "").trim() ||
      String(row.client_email ?? "").trim() ||
      String(booking.customer_email ?? "").trim() ||
      "";
    const clientName =
      String(body.clientName ?? "").trim() ||
      String(row.client_name ?? "").trim() ||
      String(booking.customer_name ?? "").trim() ||
      "Client";

    const updated = await query(
      `UPDATE finance_transactions
       SET status = 'Payment due',
           status_detail = $2,
           document = $3::jsonb,
           gross_amount = $4,
           net_amount = $4,
           client_email = CASE WHEN $5 = '' THEN client_email ELSE $5 END,
           client_name = CASE WHEN $6 = '' THEN client_name ELSE $6 END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        txId,
        `Reissue of ${prevNumber}`,
        JSON.stringify(nextDoc),
        nextAmount,
        clientEmail,
        clientName,
      ],
    );

    const dueDateLabel = dueDate.split("-").reverse().join("/");
    const notification = await dispatchInvoiceReissuedNotification(txId, dueDateLabel);
    const email = await sendFinanceClientEmail(txId, FINANCE_EMAIL_TYPES.INVOICE_REISSUED, {
      forceKey: dueDate,
    });

    return res.status(200).json({
      success: true,
      message: "Invoice reissued. Client notified.",
      data: {
        transaction: mapTransactionRow(updated.rows[0]),
        notificationSent: Boolean(notification),
        emailSent: Boolean(email?.sent),
        emailTo: email?.to ?? null,
        emailReason: email?.reason ?? null,
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const getPublicInvoiceSettings = async (req, res) => {
  try {
    const businessSetupId = parseUuid(req.params.businessSetupId);
    if (!businessSetupId) {
      return res.status(400).json({ success: false, message: "Invalid business setup id.", data: null });
    }

    const result = await query(
      `SELECT pfs.invoice_settings
       FROM business_setups bs
       INNER JOIN professional_finance_settings pfs ON pfs.professional_profile_id = bs.professional_profile_id
       WHERE bs.id = $1`,
      [businessSetupId],
    );

    const invoiceSettings = mergeInvoiceSettings(result.rows[0]?.invoice_settings);
    return res.status(200).json({
      success: true,
      message: "Invoice settings loaded.",
      data: invoiceSettings,
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const getPublicTransactionOptions = async (req, res) => {
  try {
    const businessSetupId = parseUuid(req.params.businessSetupId);
    if (!businessSetupId) {
      return res.status(400).json({ success: false, message: "Invalid business setup id.", data: null });
    }

    const result = await query(
      `SELECT pfs.transaction_options
       FROM business_setups bs
       INNER JOIN professional_finance_settings pfs ON pfs.professional_profile_id = bs.professional_profile_id
       WHERE bs.id = $1`,
      [businessSetupId],
    );

    const options = result.rows[0]?.transaction_options ?? DEFAULT_TRANSACTION_OPTIONS;
    return res.status(200).json({
      success: true,
      message: "Transaction options loaded.",
      data: { ...DEFAULT_TRANSACTION_OPTIONS, ...options },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};

export const createStripeConnectOnboardingLink = async (req, res) => {
  try {
    const profile = await requireProfessional(req, res);
    if (!profile) return;

    await ensureFinanceSettings(profile.id);

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      await query(
        `UPDATE professional_finance_settings
         SET stripe_connect_status = 'connected', subscription_status = 'active', updated_at = NOW()
         WHERE professional_profile_id = $1`,
        [profile.id],
      );
      return res.status(200).json({
        success: true,
        message: "Stripe simulated (no STRIPE_SECRET_KEY). Marked as connected.",
        data: { url: null, simulated: true },
      });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    let accountId = req.body?.accountId;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;
    }

    const refreshUrl =
      req.body?.refreshUrl ??
      `${process.env.FRONTEND_URL ?? "https://web--mollure-backend--sc4tt92szkkg.code.run"}/professionals/finance/setting`;
    const returnUrl = req.body?.returnUrl ?? refreshUrl;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    await query(
      `UPDATE professional_finance_settings
       SET stripe_connect_status = 'onboarding', subscription_status = 'active', updated_at = NOW()
       WHERE professional_profile_id = $1`,
      [profile.id],
    );

    return res.status(200).json({
      success: true,
      message: "Stripe onboarding link created.",
      data: { url: link.url, accountId, simulated: false },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Request failed." });
  }
};
