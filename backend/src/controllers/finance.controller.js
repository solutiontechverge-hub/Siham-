import { query } from "../db/index.js";
import { dispatchPaymentDueSetNotification } from "../services/bookingNotification.service.js";
import { parseUuid } from "../utils/uuid.js";
import {
  processOverdueInvoiceReissues,
  syncBookingToFinanceTransaction,
} from "../services/finance-sync.service.js";

const DEFAULT_TRANSACTION_OPTIONS = {
  onlineImmediate: true,
  onlineInvoiceDueDate: true,
  offlineImmediate: true,
  offlineInvoiceDueDate: false,
};

const DEFAULT_INVOICE_SETTINGS = {
  logoDataUrl: null,
  defaultInvoiceType: "individual",
  products: [
    { id: "p1", name: "Shampoo", price: "30EUR", vat: "21%" },
    { id: "p2", name: "Eye Lashes", price: "50EUR", vat: "21%" },
  ],
  services: [
    { id: "s1", category: "Hair", service: "Dye", vat: "21%" },
    { id: "s2", category: "Makeup", service: "Eye Makeup", vat: "9%" },
  ],
  paymentTerms: {
    originalDueValue: "2",
    originalDueUnit: "Weeks",
    originalPenaltyValue: "10",
    originalPenaltyUnit: "%",
    firstReissueTrigger: "Automatic",
    firstReissueDueValue: "2",
    firstReissueDueUnit: "Weeks",
    firstReissuePenaltyValue: "20",
    firstReissuePenaltyUnit: "%",
    secondReissueTrigger: "Automatic",
    secondReissueDueValue: "2",
    secondReissueDueUnit: "Weeks",
    secondReissuePenaltyValue: "20",
    secondReissuePenaltyUnit: "%",
  },
  reminders: {
    reminder1Value: "1",
    reminder1Unit: "Weeks",
    reminder2Value: "3",
    reminder2Unit: "Days",
  },
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

const mergeInvoiceSettings = (raw) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_INVOICE_SETTINGS };
  return {
    ...DEFAULT_INVOICE_SETTINGS,
    ...raw,
    paymentTerms: { ...DEFAULT_INVOICE_SETTINGS.paymentTerms, ...(raw.paymentTerms ?? {}) },
    reminders: { ...DEFAULT_INVOICE_SETTINGS.reminders, ...(raw.reminders ?? {}) },
    products: Array.isArray(raw.products) ? raw.products : DEFAULT_INVOICE_SETTINGS.products,
    services: Array.isArray(raw.services) ? raw.services : DEFAULT_INVOICE_SETTINGS.services,
  };
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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

    return res.status(200).json({
      success: true,
      message: "Invoice settings updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
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

    return res.status(200).json({
      success: true,
      message: "Transaction options updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
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

    return res.status(200).json({
      success: true,
      message: "Stripe status updated.",
      data: mapSettingsRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
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

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const result = await query(
      `SELECT * FROM finance_transactions
       WHERE professional_profile_id = $1
       ${where}
       ORDER BY COALESCE(transaction_date, created_at::date) DESC, created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [profile.id, ...values],
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM finance_transactions
       WHERE professional_profile_id = $1 ${where}`,
      [profile.id, ...values],
    );

    return res.status(200).json({
      success: true,
      message: "Transactions loaded.",
      data: {
        rows: result.rows.map(mapTransactionRow),
        total: countResult.rows[0]?.total ?? 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    };

    const result = await query(
      `INSERT INTO finance_transactions (
        professional_profile_id, entry_type, entry_id, transaction_date, entry_label,
        client_name, client_email, client_type,
        gross_amount, stripe_fee, mollure_fee, net_amount,
        method_title, method_detail, status, status_detail, document
      ) VALUES (
        $1, 'manualEntry', $2, $3::date, 'Manual entry',
        $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15::jsonb
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
        isOnline ? "Pay within 15 min" : null,
        JSON.stringify(document),
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Transaction created.",
      data: mapTransactionRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
    return res.status(500).json({ success: false, message: error.message, data: null });
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
      `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/professionals/finance/setting`;
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
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};
