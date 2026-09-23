import { query } from "../db/index.js";
import {
  addDaysIso,
  computePenaltyAmount,
  durationToDays,
  isAutomaticTrigger,
  mergeInvoiceSettings,
  toIsoDateOnly,
} from "../helpers/financeInvoiceSettings.js";
import {
  FINANCE_EMAIL_TYPES,
  sendFinanceClientEmail,
} from "./financeEmail.service.js";
import { dispatchInvoiceReissuedNotification } from "./bookingNotification.service.js";

const formatEuro = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "€0";
  const rounded = Math.round(n * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `€${text}`;
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toIsoDate = (value) => toIsoDateOnly(value);

/** Stale payment link / Cancel Sales race: money landed after sale was voided. */
export const PAYMENT_AFTER_CANCEL_DETAIL =
  "Payment received after cancel — review required";
export const PAYMENT_AFTER_CANCEL_FLAG = "payment_after_cancel";

export function isSettledFinanceStatus(status) {
  return status === "Paid" || status === "Prepaid";
}

export function shouldFlagPaymentAfterCancel(intendedStatus, hasPriorVoidedSibling) {
  return isSettledFinanceStatus(intendedStatus) && Boolean(hasPriorVoidedSibling);
}

export function buildPaymentAfterCancelDocumentPatch({ intendedStatus, amount }) {
  return {
    safetyFlag: PAYMENT_AFTER_CANCEL_FLAG,
    needsReview: true,
    paymentReceivedStatus: intendedStatus,
    paymentReceivedAt: new Date().toISOString(),
    paymentReceivedAmount: roundMoney(amount),
  };
}

/** Keep Voided; stamp review flag + status_detail (visible in finance table). */
export async function flagFinancePaymentAfterCancel(txId, { intendedStatus, amount }) {
  const patch = buildPaymentAfterCancelDocumentPatch({ intendedStatus, amount });
  const result = await query(
    `UPDATE finance_transactions
     SET status_detail = $2,
         document = COALESCE(document, '{}'::jsonb) || $3::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [txId, PAYMENT_AFTER_CANCEL_DETAIL, JSON.stringify(patch)],
  );
  console.warn(
    `[finance-safety] ${PAYMENT_AFTER_CANCEL_FLAG} on finance_transactions.id=${txId}`,
  );
  return result.rows[0] ?? null;
}

async function loadInvoiceSettingsForProfessional(professionalProfileId) {
  const result = await query(
    `SELECT invoice_settings
     FROM professional_finance_settings
     WHERE professional_profile_id = $1
     LIMIT 1`,
    [professionalProfileId],
  );
  return mergeInvoiceSettings(result.rows[0]?.invoice_settings);
}

function resolveOriginalDueDate(invoiceDate, paymentTerms) {
  const days =
    durationToDays(paymentTerms?.originalDueValue, paymentTerms?.originalDueUnit) ?? 14;
  return addDaysIso(invoiceDate, days);
}

function parseBookingNotes(notes) {
  if (!notes || typeof notes !== "string") return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function getBookingContext(bookingId) {
  const result = await query(
    `SELECT b.*,
            bs.professional_profile_id,
            u.email AS customer_email,
            COALESCE(ip.display_name, ip.first_name || ' ' || ip.last_name, u.email) AS customer_name,
            s.title AS service_title
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN subcategories s ON s.id = b.service_id
     WHERE b.id = $1`,
    [bookingId],
  );
  return result.rows[0] || null;
}

function resolveClientType(userEmail) {
  if (!userEmail) return "guest";
  if (userEmail.endsWith("@mollure.dev") || userEmail.includes("mollure")) return "mollure";
  return "nonMollure";
}

function resolveTransactionStatus(booking, paymentPhase = "full") {
  if (booking.prepayment_status === "paid" && paymentPhase === "prepay") return "Prepaid";
  if (booking.status === "completed") return "Paid";
  if (booking.status === "confirmed") {
    return booking.prepayment_status === "paid" ? "Prepaid" : "Pending";
  }
  if (booking.status === "cancelled") return "Voided";
  if (booking.prepayment_status === "failed") return "Failed";
  return "Pending";
}

function resolveMethod(booking, paymentMethod = "onlineDirect") {
  const isOffline = booking.booking_type === "offline";
  if (paymentMethod === "onlineInvoice") {
    return {
      methodTitle: isOffline ? "Offline – invoice with due date" : "Online – invoice with due date",
      methodDetail: "Due date: pending",
    };
  }
  if (isOffline || paymentMethod === "offlineDirect") {
    return { methodTitle: "Offline – direct", methodDetail: "" };
  }
  return { methodTitle: "Online – direct", methodDetail: "iDeal" };
}

function isPlanningPerson(person) {
  return person?.participantType === "planning" || person?.name === "Planning";
}

/**
 * Build split bill payers from booking notes (clientSnapshot / guests).
 * Prepayment is always charged to the main client against the full booking total %.
 */
function resolveSplitPayers(booking, meta) {
  const total = roundMoney(Number(booking.total_price ?? 0));
  const prepaymentPercent = Number(meta.prepaymentPercent ?? meta.prepayment_percentage ?? 0);
  const showPrepayment = Boolean(meta.showPrepayment) || String(booking.prepayment_status ?? "").toLowerCase() === "paid";
  const prepaidAmount =
    showPrepayment && prepaymentPercent > 0
      ? roundMoney((total * prepaymentPercent) / 100)
      : showPrepayment && String(booking.prepayment_status ?? "").toLowerCase() === "paid"
        ? roundMoney(total * 0.25)
        : 0;

  if (meta.splitBill?.payers?.length) {
    return {
      prepaidAmount: roundMoney(Number(meta.splitBill.prepaidAmount ?? prepaidAmount)),
      payers: meta.splitBill.payers.map((p) => ({
        key: String(p.key),
        role: p.role || "guest",
        label: p.label || (p.role === "model" ? "Model" : p.role === "main_client" ? booking.customer_name : "Guest"),
        displayName: p.displayName || p.label || "Guest",
        subtotal: roundMoney(Number(p.subtotal ?? 0)),
        paymentAmount: roundMoney(Number(p.paymentAmount ?? 0)),
        lineItems: Array.isArray(p.lineItems) ? p.lineItems : [],
      })),
    };
  }

  const snapshot = meta.clientSnapshot;
  const people = Array.isArray(snapshot?.people) ? snapshot.people : [];
  const services = Array.isArray(snapshot?.services) ? snapshot.services : [];

  if (people.length && services.length) {
    const requester = people.find((p) => p.isRequester) ?? people[0];
    const groups = new Map();

    for (const service of services) {
      const assigneeId = String(service.guestId || requester.id);
      const prev = groups.get(assigneeId) ?? [];
      prev.push({
        description: service.name || "Service",
        quantity: "1",
        vat: "21%",
        pricePerUnit: formatEuro(service.price),
        totalPrice: formatEuro(service.price),
        amount: roundMoney(Number(service.price) || 0),
      });
      groups.set(assigneeId, prev);
    }

    const payers = [];
    let modelOrdinal = 0;
    let guestOrdinal = 0;

    for (const person of people) {
      if (isPlanningPerson(person)) continue;
      const lines = groups.get(person.id) ?? [];
      if (!lines.length && !person.isRequester) continue;

      const trimmed = String(person.name || "").trim();
      let role = "guest";
      let label = "Guest";
      let displayName = trimmed || "Guest";

      if (person.isRequester || person.id === requester.id) {
        role = "main_client";
        label = booking.customer_name || "Client";
        displayName = label;
      } else if (person.participantType === "model") {
        role = "model";
        modelOrdinal += 1;
        label = "Model";
        displayName = trimmed && trimmed.toLowerCase() !== "model" ? trimmed : `Model ${modelOrdinal}`;
      } else {
        role = "guest";
        guestOrdinal += 1;
        label = "Guest";
        displayName = trimmed && trimmed.toLowerCase() !== "guest" ? trimmed : `Guest ${guestOrdinal}`;
      }

      const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
      const paymentAmount =
        role === "main_client"
          ? roundMoney(Math.max(0, subtotal - prepaidAmount))
          : subtotal;

      payers.push({
        key: String(person.id),
        role,
        label,
        displayName,
        subtotal,
        paymentAmount,
        lineItems: lines.map(({ amount: _a, ...docLine }) => docLine),
      });
    }

    if (payers.length) return { prepaidAmount, payers };
  }

  const guests = Array.isArray(meta.guests) ? meta.guests : [];
  if (guests.length) {
    const payers = [];
    let assigned = 0;
    let modelOrdinal = 0;
    let guestOrdinal = 0;

    for (const guest of guests) {
      const guestServices = Array.isArray(guest.services) ? guest.services : [];
      const guestProducts = Array.isArray(guest.products) ? guest.products : [];
      const lines = [
        ...guestServices.map((s) => ({
          description: s.name || "Service",
          quantity: "1",
          vat: "21%",
          pricePerUnit: formatEuro(s.price),
          totalPrice: formatEuro(s.price),
          amount: roundMoney(Number(s.price) || 0),
        })),
        ...guestProducts.map((p) => ({
          description: p.name || "Product",
          quantity: String(p.quantity || 1),
          vat: "21%",
          pricePerUnit: formatEuro(p.unitPrice ?? p.price),
          totalPrice: formatEuro(p.price),
          amount: roundMoney(Number(p.price) || 0),
        })),
      ];
      if (!lines.length) continue;
      assigned += lines.reduce((sum, line) => sum + line.amount, 0);
      const isModel = guest.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;
      const trimmed = String(guest.name || "").trim();
      const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
      payers.push({
        key: String(guest.id),
        role: isModel ? "model" : "guest",
        label: isModel ? "Model" : "Guest",
        displayName: isModel
          ? trimmed && trimmed.toLowerCase() !== "model"
            ? trimmed
            : `Model ${modelOrdinal}`
          : trimmed && trimmed.toLowerCase() !== "guest"
            ? trimmed
            : `Guest ${guestOrdinal}`,
        subtotal,
        paymentAmount: subtotal,
        lineItems: lines.map(({ amount: _a, ...docLine }) => docLine),
      });
    }

    const mainSubtotal = roundMoney(Math.max(0, total - assigned));
    payers.unshift({
      key: "main-client",
      role: "main_client",
      label: booking.customer_name || "Client",
      displayName: booking.customer_name || "Client",
      subtotal: mainSubtotal,
      paymentAmount: roundMoney(Math.max(0, mainSubtotal - prepaidAmount)),
      lineItems: booking.service_title
        ? [
            {
              description: booking.service_title,
              quantity: "1",
              vat: "21%",
              pricePerUnit: formatEuro(mainSubtotal),
              totalPrice: formatEuro(mainSubtotal),
            },
          ]
        : [],
    });

    return { prepaidAmount, payers };
  }

  return {
    prepaidAmount,
    payers: [
      {
        key: "main-client",
        role: "main_client",
        label: booking.customer_name || "Client",
        displayName: booking.customer_name || "Client",
        subtotal: total,
        paymentAmount: roundMoney(Math.max(0, total - prepaidAmount)),
        lineItems: booking.service_title
          ? [
              {
                description: booking.service_title,
                quantity: "1",
                vat: "21%",
                pricePerUnit: formatEuro(total),
                totalPrice: formatEuro(total),
              },
            ]
          : [],
      },
    ],
  };
}

async function insertFinanceTransaction({
  booking,
  paymentPhase,
  paymentMethod,
  amount,
  status,
  clientName,
  clientEmail,
  clientType,
  payerKey,
  payerRole,
  payerLabel,
  lineItems,
  docSuffix,
  entryLabel,
}) {
  const gross = roundMoney(amount);
  // Open (unresolved) invoice for this booking/phase — replace when amount changes
  // so pre-resolution edits do not leave a stale payment link / prepayment row.
  const openExisting = await query(
    `SELECT id, gross_amount, status FROM finance_transactions
     WHERE professional_profile_id = $1
       AND booking_id = $2
       AND COALESCE(document->>'payerKey', '') = $3
       AND COALESCE(document->>'paymentPhase', '') = $4
       AND status NOT IN ('Paid', 'Prepaid', 'Refunded', 'Voided')
     ORDER BY updated_at DESC NULLS LAST
     LIMIT 1`,
    [
      booking.professional_profile_id,
      booking.unique_code,
      payerKey || "",
      paymentPhase || "",
    ],
  );
  const openRow = openExisting.rows[0];
  /** Exclude rows we just voided for amount/status supersede — those are not Cancel Sales. */
  let supersededOpenId = null;
  if (openRow) {
    const prevGross = roundMoney(openRow.gross_amount);
    if (prevGross === gross && String(openRow.status) === String(status)) {
      return openRow.id;
    }
    // Amount or open-status drift → void old (Cancel Sales / deactivate link) then insert fresh.
    supersededOpenId = openRow.id;
    await query(
      `UPDATE finance_transactions
       SET status = 'Voided', updated_at = NOW()
       WHERE id = $1`,
      [openRow.id],
    );
  } else {
    const exact = await query(
      `SELECT id FROM finance_transactions
       WHERE professional_profile_id = $1
         AND booking_id = $2
         AND status = $3
         AND COALESCE(document->>'payerKey', '') = $4
         AND COALESCE(document->>'paymentPhase', '') = $5
       LIMIT 1`,
      [
        booking.professional_profile_id,
        booking.unique_code,
        status,
        payerKey || "",
        paymentPhase || "",
      ],
    );
    if (exact.rows[0]) return exact.rows[0].id;
  }

  // Stale Stripe / payment-link race: Cancel Sales already Voided this phase, but payment still landed.
  if (isSettledFinanceStatus(status)) {
    const voidedSibling = await query(
      `SELECT id FROM finance_transactions
       WHERE professional_profile_id = $1
         AND booking_id = $2
         AND status = 'Voided'
         AND COALESCE(document->>'payerKey', '') = $3
         AND COALESCE(document->>'paymentPhase', '') = $4
         AND ($5::uuid IS NULL OR id <> $5)
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1`,
      [
        booking.professional_profile_id,
        booking.unique_code,
        payerKey || "",
        paymentPhase || "",
        supersededOpenId,
      ],
    );
    const priorVoidedId = voidedSibling.rows[0]?.id ?? null;
    if (shouldFlagPaymentAfterCancel(status, Boolean(priorVoidedId))) {
      await flagFinancePaymentAfterCancel(priorVoidedId, {
        intendedStatus: status,
        amount: gross,
      });
      return priorVoidedId;
    }
  }

  if (gross <= 0 && paymentPhase !== "prepay") return null;

  const isOnline = paymentMethod.startsWith("online") && booking.booking_type !== "offline";
  const stripeFee = isOnline ? Math.round(gross * 0.029 * 100) / 100 : null;
  const mollureFee = isOnline ? Math.round(gross * 0.01 * 100) / 100 : null;
  const net = gross - (stripeFee ?? 0) - (mollureFee ?? 0);
  const { methodTitle, methodDetail } = resolveMethod(booking, paymentMethod);
  const entryId = booking.unique_code || null;
  const docNumber = `INV-${booking.unique_code}${docSuffix || ""}`;
  const invoiceDate = toIsoDate(new Date());
  const invoiceSettings = await loadInvoiceSettingsForProfessional(
    booking.professional_profile_id,
  );
  const dueDate =
    status === "Payment due" || status === "Pending" || status === "Overdue"
      ? resolveOriginalDueDate(invoiceDate, invoiceSettings.paymentTerms)
      : toIsoDate(booking.booking_date);

  const document = {
    documentNumber: docNumber,
    receiptNumber:
      status === "Paid" || status === "Prepaid" ? `RCP-${booking.unique_code}${docSuffix || ""}` : undefined,
    serviceDate: toIsoDate(booking.booking_date),
    invoiceDate,
    dueDate,
    reissueLevel: 0,
    paymentPhase,
    payerKey: payerKey || "",
    payerRole: payerRole || "main_client",
    payerLabel: payerLabel || clientName,
    client: {
      legalName: clientName,
      email: clientEmail || "",
    },
    lineItems: lineItems?.length
      ? lineItems
      : booking.service_title
        ? [
            {
              description: booking.service_title,
              quantity: "1",
              vat: "21%",
              pricePerUnit: formatEuro(gross),
              totalPrice: formatEuro(gross),
            },
          ]
        : [],
    totalPrice: formatEuro(gross),
  };

  const inserted = await query(
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
    ) RETURNING id`,
    [
      booking.professional_profile_id,
      booking.booking_type === "offline" ? "offlineBooking" : "onlineBooking",
      entryId,
      toIsoDate(booking.booking_date),
      entryLabel || null,
      clientName,
      clientEmail ?? "",
      clientType,
      gross,
      stripeFee,
      mollureFee,
      net,
      methodTitle,
      methodDetail,
      status,
      paymentPhase === "prepay" ? "Pay within 15 min" : payerRole === "guest" || payerRole === "model" ? `${payerLabel}: ${clientName}` : null,
      booking.unique_code,
      JSON.stringify(document),
    ],
  );

  return inserted.rows[0]?.id ?? null;
}

export async function syncBookingToFinanceTransaction(bookingId, options = {}) {
  const booking = await getBookingContext(bookingId);
  if (!booking) return null;

  const {
    paymentPhase: requestedPhase = null,
    paymentMethod = "onlineDirect",
    amountOverride = null,
    statusOverride = null,
  } = options;

  const meta = parseBookingNotes(booking.notes);
  const { prepaidAmount, payers } = resolveSplitPayers(booking, meta);
  const prepayStatus = String(booking.prepayment_status ?? "").toLowerCase();
  const isCompleted = String(booking.status ?? "").toLowerCase() === "completed";

  // Explicit single-phase sync (legacy callers / amount override)
  if (requestedPhase === "prepay" || (amountOverride != null && requestedPhase !== "full")) {
    const phase = requestedPhase || "prepay";
    const status = statusOverride ?? resolveTransactionStatus(booking, phase);
    return insertFinanceTransaction({
      booking,
      paymentPhase: phase,
      paymentMethod,
      amount: amountOverride ?? (phase === "prepay" ? prepaidAmount : Number(booking.total_price ?? 0)),
      status,
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking.customer_email),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: [],
      docSuffix: phase === "prepay" ? "-PRE" : "",
      entryLabel: phase === "prepay" ? "Prepayment" : null,
    });
  }

  const createdIds = [];

  // Prepayment always from main client (full booking %)
  if (prepayStatus === "paid" && prepaidAmount > 0) {
    const id = await insertFinanceTransaction({
      booking,
      paymentPhase: "prepay",
      paymentMethod,
      amount: prepaidAmount,
      status: "Prepaid",
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking.customer_email),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: [],
      docSuffix: "-PRE",
      entryLabel: "Prepayment",
    });
    if (id) createdIds.push(id);
  }

  // After-treatment split: main client + each guest/model
  if (isCompleted || requestedPhase === "full") {
    for (const payer of payers) {
      const amount =
        amountOverride != null && payer.role === "main_client"
          ? amountOverride
          : payer.paymentAmount;
      if (amount <= 0 && payers.length > 1 && payer.role === "main_client") {
        // Still record a €0? Skip zero payments for split guests; main may be covered by prepaid.
        continue;
      }
      if (amount <= 0) continue;

      const isMain = payer.role === "main_client";
      const payerMethod =
        isMain || booking.booking_type !== "offline" ? paymentMethod : "offlineDirect";
      const suffix =
        isMain
          ? "-AT"
          : payer.role === "model"
            ? `-M-${String(payer.key).slice(0, 8)}`
            : `-G-${String(payer.key).slice(0, 8)}`;

      const id = await insertFinanceTransaction({
        booking,
        paymentPhase: "full",
        paymentMethod: payerMethod,
        amount,
        status: statusOverride ?? "Paid",
        clientName: isMain ? booking.customer_name : payer.displayName,
        clientEmail: isMain ? booking.customer_email : "",
        clientType: isMain ? resolveClientType(booking.customer_email) : "guest",
        payerKey: payer.key,
        payerRole: payer.role,
        payerLabel: payer.label,
        lineItems: payer.lineItems,
        docSuffix: suffix,
        entryLabel: isMain
          ? "After treatment · Main Client"
          : `After treatment · ${payer.label} · ${payer.displayName}`,
      });
      if (id) createdIds.push(id);
    }
  }

  // Fallback: no split / not completed — single pending/prepaid row for confirmed bookings
  if (!createdIds.length && !isCompleted) {
    const phase = prepayStatus === "paid" ? "prepay" : "full";
    const status = statusOverride ?? resolveTransactionStatus(booking, phase);
    const id = await insertFinanceTransaction({
      booking,
      paymentPhase: phase,
      paymentMethod,
      amount: amountOverride ?? (phase === "prepay" ? prepaidAmount : Number(booking.total_price ?? 0)),
      status,
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking.customer_email),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: [],
      docSuffix: phase === "prepay" ? "-PRE" : "",
      entryLabel: phase === "prepay" ? "Prepayment" : null,
    });
    return id;
  }

  return createdIds[0] ?? null;
}

/**
 * Apply one automatic reissue step to an overdue unpaid invoice using
 * professional payment-term settings (updates in place, like manual reissue).
 */
async function applySettingsBasedReissue(row, paymentTerms, level) {
  const terms = paymentTerms ?? {};
  const prefix = level === 1 ? "first" : "second";
  const trigger = terms[`${prefix}ReissueTrigger`];
  if (!isAutomaticTrigger(trigger)) {
    return { applied: false, reason: "trigger_not_automatic" };
  }

  const dueDays =
    durationToDays(terms[`${prefix}ReissueDueValue`], terms[`${prefix}ReissueDueUnit`]) ?? 14;
  const dueDate = addDaysIso(toIsoDate(new Date()), dueDays);
  const baseAmount = Number(row.net_amount ?? row.gross_amount ?? 0) || 0;
  const penaltyAmount = computePenaltyAmount(
    baseAmount,
    terms[`${prefix}ReissuePenaltyValue`],
    terms[`${prefix}ReissuePenaltyUnit`],
  );
  const nextAmount = Math.round((baseAmount + penaltyAmount) * 100) / 100;

  const doc = row.document && typeof row.document === "object" ? { ...row.document } : {};
  const prevNumber = doc.documentNumber || `INV-${row.booking_id || row.id}`;
  const reissueNumber = String(prevNumber).includes("-R")
    ? prevNumber
    : `${prevNumber}-R${Date.now().toString().slice(-4)}`;

  const nextDoc = {
    ...doc,
    documentNumber: reissueNumber,
    invoiceDate: toIsoDate(new Date()),
    dueDate,
    totalPrice: formatEuro(nextAmount),
    reissuedAt: new Date().toISOString(),
    reissueLevel: level,
    ...(penaltyAmount > 0 ? { penaltyAmount } : {}),
  };

  await query(
    `UPDATE finance_transactions
     SET status = 'Payment due',
         status_detail = $2,
         document = $3::jsonb,
         gross_amount = $4,
         net_amount = $4,
         updated_at = NOW()
     WHERE id = $1`,
    [row.id, `Reissue of ${prevNumber}`, JSON.stringify(nextDoc), nextAmount],
  );

  const dueDateLabel = dueDate.split("-").reverse().join("/");
  await dispatchInvoiceReissuedNotification(row.id, dueDateLabel);
  await sendFinanceClientEmail(row.id, FINANCE_EMAIL_TYPES.INVOICE_REISSUED, {
    forceKey: dueDate,
  });

  return { applied: true, transactionId: row.id, dueDate, level };
}

/**
 * Process overdue invoice reissues for one professional using their
 * Payments & Reminders settings (first/second Automatic triggers).
 */
export async function processOverdueInvoiceReissues(professionalProfileId) {
  const settings = await loadInvoiceSettingsForProfessional(professionalProfileId);
  const paymentTerms = settings.paymentTerms;

  const overdue = await query(
    `SELECT *
     FROM finance_transactions
     WHERE professional_profile_id = $1
       AND status IN ('Payment due', 'Overdue')
       AND NULLIF(document->>'dueDate', '') IS NOT NULL
       AND (document->>'dueDate')::date < CURRENT_DATE`,
    [professionalProfileId],
  );

  let created = 0;
  for (const row of overdue.rows) {
    const doc = row.document ?? {};
    const level = Number(doc.reissueLevel) || 0;
    if (level >= 2) continue;

    const nextLevel = level + 1;
    const result = await applySettingsBasedReissue(row, paymentTerms, nextLevel);
    if (result.applied) created += 1;
  }

  return created;
}

/**
 * Run settings-based automatic reissues across all professionals.
 * Called by the email reminder job.
 */
export async function processAutomaticInvoiceReissues() {
  const overdue = await query(
    `SELECT
       ft.*,
       COALESCE(pfs.invoice_settings, '{}'::jsonb) AS invoice_settings
     FROM finance_transactions ft
     LEFT JOIN professional_finance_settings pfs
       ON pfs.professional_profile_id = ft.professional_profile_id
     WHERE ft.status IN ('Payment due', 'Overdue')
       AND NULLIF(ft.document->>'dueDate', '') IS NOT NULL
       AND (ft.document->>'dueDate')::date < CURRENT_DATE`,
  );

  const outcomes = [];
  for (const row of overdue.rows) {
    const settings = mergeInvoiceSettings(row.invoice_settings);
    const doc = row.document ?? {};
    const level = Number(doc.reissueLevel) || 0;
    if (level >= 2) continue;

    const nextLevel = level + 1;
    const result = await applySettingsBasedReissue(row, settings.paymentTerms, nextLevel);
    outcomes.push(result);
  }

  return outcomes;
}
