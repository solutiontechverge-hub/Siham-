import { query } from "../db/index.js";
import {
  addDaysIso,
  computePenaltyAmount,
  durationToDays,
  isAutomaticTrigger,
  mergeInvoiceSettings,
  resolveDocumentPaymentTerms,
  resolveOverdueReissueAction,
  toIsoDateOnly,
} from "../helpers/financeInvoiceSettings.js";
import {
  vatFieldsForProduct,
  vatFieldsForService,
} from "../helpers/financeVat.js";
import {
  FINANCE_EMAIL_TYPES,
  sendFinanceClientEmail,
} from "./financeEmail.service.js";
import { dispatchInvoiceReissuedNotification } from "./bookingNotification.service.js";
import { computeFinanceFees } from "../utils/financeFees.js";
import { normalizeMoneyJson, parseMoney, roundMoney } from "../utils/money.js";
import {
  protectiveFeeNetsPrepaid,
  settleProtectiveFee,
} from "../utils/protectiveFeeSettlement.js";
import {
  resolveResponseWindowMinutes,
  responseDeadlineAtFromNotes,
} from "../utils/bookingResponseWindow.js";

const toIsoDate = (value) => toIsoDateOnly(value);

/** Stale payment link / Cancel Sales race: money landed after sale was voided. */
export const PAYMENT_AFTER_CANCEL_DETAIL =
  "Payment received after cancel — review required";
export const PAYMENT_AFTER_CANCEL_FLAG = "payment_after_cancel";

export function isSettledFinanceStatus(status) {
  return status === "Paid" || status === "Prepaid";
}

/** Receipt / credit-note numbers only for settled money movement. */
export function isReceiptEligibleStatus(status) {
  return status === "Paid" || status === "Prepaid" || status === "Refunded";
}

/** Mint `RCP-{code}` only when status is Prepaid|Paid|Refunded. Voided never mints. */
export function mintReceiptNumber(status, code) {
  if (!isReceiptEligibleStatus(status)) return undefined;
  const trimmed = String(code ?? "").trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("RCP-") ? trimmed : `RCP-${trimmed}`;
}

export function shouldFlagPaymentAfterCancel(intendedStatus, hasPriorVoidedSibling) {
  return isSettledFinanceStatus(intendedStatus) && Boolean(hasPriorVoidedSibling);
}

/** Open-row reuse vs void/replace. Negotiation resend always replaces. */
export function shouldReuseOpenFinanceRow({
  forceReplace = false,
  sameLabel,
  prevGross,
  nextGross,
  prevStatus,
  nextStatus,
}) {
  if (forceReplace) return false;
  return (
    Boolean(sameLabel) &&
    prevGross === nextGross &&
    String(prevStatus) === String(nextStatus)
  );
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

async function loadProfessionalDocumentSnapshot(professionalProfileId) {
  const result = await query(
    `SELECT pp.legal_name, pp.ccc_number, pp.vat_number, pp.street, pp.street_number,
            pp.postal_code, pp.province, pp.municipality, pp.phone,
            bs.salon_name, bs.business_name
     FROM professional_profiles pp
     LEFT JOIN business_setups bs ON bs.professional_profile_id = pp.id
     WHERE pp.id = $1
     ORDER BY bs.updated_at DESC NULLS LAST
     LIMIT 1`,
    [professionalProfileId],
  );
  const profile = result.rows[0] ?? {};
  return {
    legalName: profile.legal_name ?? null,
    shopName:
      profile.salon_name || profile.business_name || profile.legal_name || null,
    cocNumber: profile.ccc_number ?? null,
    vatNumber: profile.vat_number ?? null,
    address: [profile.street, profile.street_number, profile.postal_code, profile.municipality, profile.province]
      .filter(Boolean)
      .join(", "),
    phone: profile.phone ?? null,
  };
}

function resolveOriginalDueDate(invoiceDate, paymentTerms) {
  const days =
    durationToDays(paymentTerms?.originalDueValue, paymentTerms?.originalDueUnit) ?? 14;
  return addDaysIso(invoiceDate, days);
}

const NOTES_META_PREFIX = "---mollure-meta---";

function parseBookingNotes(notes) {
  if (!notes || typeof notes !== "string") return {};
  const markerIndex = notes.indexOf(NOTES_META_PREFIX);
  const raw =
    markerIndex === -1
      ? notes.trim()
      : notes.slice(markerIndex + NOTES_META_PREFIX.length).trim();
  if (!raw.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function joinBookingNotes(human, meta) {
  const prefix = human?.trim() ? `${human.trim()}\n` : "";
  return `${prefix}${NOTES_META_PREFIX}\n${JSON.stringify(meta)}`;
}

function splitBookingNotes(raw) {
  const text = String(raw ?? "");
  const markerIndex = text.indexOf(NOTES_META_PREFIX);
  if (markerIndex === -1) {
    return { human: text.trim(), meta: parseBookingNotes(text) };
  }
  return {
    human: text.slice(0, markerIndex).trim(),
    meta: parseBookingNotes(text),
  };
}

async function getBookingContext(bookingId) {
  const result = await query(
    `SELECT b.*,
            bs.professional_profile_id,
            bs.no_show_fee_percentage,
            u.email AS customer_email,
            u.user_type AS customer_user_type,
            COALESCE(
              NULLIF(TRIM(cp.legal_name), ''),
              NULLIF(TRIM(ip.display_name), ''),
              NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
              u.email
            ) AS customer_name,
            cp.legal_name AS customer_legal_name,
            cp.vat_number AS customer_vat,
            cp.ccc_number AS customer_coc,
            cp.street AS customer_street,
            cp.street_number AS customer_street_number,
            cp.postal_code AS customer_postal_code,
            cp.municipality AS customer_municipality,
            cp.province AS customer_province,
            pc.id AS professional_client_id,
            pc.client_kind AS pc_client_kind,
            pc.is_mollure AS pc_is_mollure,
            pc.vat AS pc_vat,
            pc.coc AS pc_coc,
            pc.legal_name AS pc_legal_name,
            pc.business_address AS pc_business_address,
            s.title AS service_title
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     LEFT JOIN professional_clients pc
       ON pc.professional_profile_id = bs.professional_profile_id
      AND (
        pc.mollure_user_id = u.id
        OR (pc.is_mollure = true AND lower(pc.email) = lower(u.email))
      )
     LEFT JOIN subcategories s ON s.id = b.service_id
     WHERE b.id = $1
     ORDER BY
       CASE WHEN pc.mollure_user_id = u.id THEN 0 ELSE 1 END,
       pc.updated_at DESC NULLS LAST
     LIMIT 1`,
    [bookingId],
  );
  return result.rows[0] || null;
}

/** Main booking payer → mollure / business / nonMollure; split guests stay guest. */
function resolveClientType(booking, payerRole = "main_client") {
  if (payerRole === "guest" || payerRole === "model") return "guest";
  if (!booking?.customer_id) return "guest";
  const isCompany =
    booking.customer_user_type === "company" ||
    booking.pc_client_kind === "company";
  if (isCompany) return "business";
  if (booking.pc_is_mollure === false) return "nonMollure";
  return "mollure";
}

function buildFinanceClientParty(booking, { clientName, clientEmail, payerRole }) {
  if (payerRole === "guest" || payerRole === "model") {
    return {
      legalName: clientName,
      email: clientEmail || "",
    };
  }
  const vat = booking.pc_vat || booking.customer_vat || null;
  const coc = booking.pc_coc || booking.customer_coc || null;
  const isCompany =
    booking.customer_user_type === "company" ||
    booking.pc_client_kind === "company" ||
    Boolean(vat || coc);
  const legalName =
    (isCompany
      ? booking.pc_legal_name || booking.customer_legal_name
      : null) || clientName;
  const address =
    booking.pc_business_address ||
    [booking.customer_street, booking.customer_street_number, booking.customer_postal_code, booking.customer_municipality, booking.customer_province]
      .filter(Boolean)
      .join(", ") ||
    null;
  // Explicit Non-Mollure PC wins; otherwise platform customer_id ⇒ Mollure.
  const isMollure =
    booking.pc_is_mollure === true ||
    (booking.pc_is_mollure !== false && Boolean(booking.customer_id));
  return {
    legalName,
    email: clientEmail || "",
    ...(address ? { address } : {}),
    ...(vat ? { vatNumber: vat } : {}),
    ...(coc ? { cocNumber: coc } : {}),
    ...(booking.customer_id ? { customerId: booking.customer_id } : {}),
    ...(booking.professional_client_id
      ? { clientId: booking.professional_client_id }
      : {}),
    ...(isMollure ? { isMollure: true } : {}),
  };
}

function resolveTransactionStatus(booking, paymentPhase = "full") {
  const prepay = String(booking.prepayment_status ?? "").toLowerCase();
  if (prepay === "paid" && paymentPhase === "prepay") return "Prepaid";
  if (paymentPhase === "prepay" && (prepay === "pending" || prepay === "required")) {
    return "Prepayment due";
  }
  if (booking.status === "completed") return "Paid";
  if (booking.status === "confirmed") {
    return prepay === "paid" ? "Prepaid" : "Pending";
  }
  if (booking.status === "cancelled") return "Voided";
  if (prepay === "failed") return "Failed";
  return "Pending";
}

function resolvePrepaymentResponseDeadlineIso(booking) {
  if (booking?.response_deadline_at) {
    const ms = new Date(booking.response_deadline_at).getTime();
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  return responseDeadlineAtFromNotes(booking?.notes);
}

function prepaymentStatusDetail(status) {
  if (status === "Overdue response") return "Past response time";
  if (status === "Prepayment due") return "Within response time";
  return "Pay within 15 min";
}

function resolveMethod(booking, paymentMethod = "onlineDirect") {
  const isOffline = booking.booking_type === "offline";
  const method = String(paymentMethod ?? "");
  if (
    method === "onlineInvoice" ||
    method === "onlineNonDirect" ||
    method === "offlineInvoice" ||
    method === "offlineNonDirect"
  ) {
    const offlineInvoice =
      isOffline || method === "offlineInvoice" || method === "offlineNonDirect";
    return {
      methodTitle: offlineInvoice
        ? "Offline – invoice with due date"
        : "Online – invoice with due date",
      methodDetail: "Due date: pending",
    };
  }
  if (isOffline || method === "offlineDirect") {
    return { methodTitle: "Offline – direct", methodDetail: "" };
  }
  const gatewayMethod = [booking.gateway_payment_method, booking.payment_method, booking.payment_method_type, booking.card_brand]
    .find((value) => String(value ?? "").trim());
  return { methodTitle: "Online – direct", methodDetail: gatewayMethod ? String(gatewayMethod).trim() : "" };
}

function snapshotServiceSubtotal(meta, booking) {
  const services = Array.isArray(meta?.clientSnapshot?.services) ? meta.clientSnapshot.services : [];
  if (services.length) {
    return roundMoney(services.reduce((sum, row) => sum + (Number(row.price) || 0), 0));
  }
  const guests = Array.isArray(meta?.guests) ? meta.guests : [];
  let guestTotal = 0;
  for (const guest of guests) {
    for (const service of guest.services ?? []) guestTotal += Number(service.price) || 0;
    for (const product of guest.products ?? []) guestTotal += Number(product.price) || 0;
  }
  if (guestTotal > 0) return roundMoney(guestTotal);
  return roundMoney(Number(booking.total_price ?? 0));
}

/** Frontend splitBill stores composite line ids (`serviceId::guest::index`). */
export function catalogRefFromLineId(lineId) {
  const raw = String(lineId ?? "").trim();
  if (!raw) return "";
  return raw.split("::")[0] || raw;
}

function isCatalogLinkedLine(line) {
  const type = String(line?.sourceType ?? "");
  const ref = String(line?.sourceReference ?? "").trim();
  return Boolean(ref) && ["serviceId", "productId", "uniqueItemCode"].includes(type);
}

function applyCatalogVat(line, invoiceSettings) {
  if (!isCatalogLinkedLine(line)) return line;
  const type = String(line.sourceType);
  if (type === "serviceId") {
    return { ...line, ...vatFieldsForService(line.sourceReference, invoiceSettings) };
  }
  if (type === "productId" || type === "uniqueItemCode") {
    return { ...line, ...vatFieldsForProduct(line.sourceReference, invoiceSettings) };
  }
  return line;
}

/**
 * Catalog-backed document lines from booking notes — prefer full snapshot/guest
 * arrays over collapsing to a single booking.service_id row.
 */
function buildFallbackLineItems(booking, meta, invoiceSettings) {
  const snapshotServices = Array.isArray(meta?.clientSnapshot?.services)
    ? meta.clientSnapshot.services
    : [];
  if (snapshotServices.length) {
    return snapshotServices
      .filter((service) => service?.id || service?.serviceId)
      .map((service) => {
        const sourceReference = String(service.id || service.serviceId);
        return {
          description: service.name || "Service",
          sourceReference,
          sourceType: "serviceId",
          quantity: 1,
          ...vatFieldsForService(sourceReference, invoiceSettings),
          pricePerUnit: roundMoney(service.price),
          totalPrice: roundMoney(service.price),
        };
      });
  }

  const guests = Array.isArray(meta?.guests) ? meta.guests : [];
  const fromGuests = [];
  for (const guest of guests) {
    for (const service of guest.services ?? []) {
      if (!service?.id && !service?.serviceId) continue;
      const sourceReference = String(service.id || service.serviceId);
      fromGuests.push({
        description: service.name || "Service",
        sourceReference,
        sourceType: "serviceId",
        quantity: 1,
        ...vatFieldsForService(sourceReference, invoiceSettings),
        pricePerUnit: roundMoney(service.price),
        totalPrice: roundMoney(service.price),
      });
    }
    for (const product of guest.products ?? []) {
      if (!product?.id && !product?.productId) continue;
      const sourceReference = String(product.id || product.productId);
      fromGuests.push({
        description: product.name || "Product",
        sourceReference,
        sourceType: "productId",
        quantity: parseMoney(product.quantity || 1, 1),
        ...vatFieldsForProduct(sourceReference, invoiceSettings),
        pricePerUnit: roundMoney(product.unitPrice ?? product.price),
        totalPrice: roundMoney(product.price),
      });
    }
  }
  if (fromGuests.length) return fromGuests;

  if (booking.service_id) {
    const sourceReference = String(booking.service_id);
    return [{
      description: booking.service_title || "Professional Service",
      sourceReference,
      sourceType: "serviceId",
      quantity: 1,
      ...vatFieldsForService(sourceReference, invoiceSettings),
      pricePerUnit: roundMoney(booking.total_price),
      totalPrice: roundMoney(booking.total_price),
    }];
  }
  return [];
}

function formatProtectiveFeeBase(baseAmount) {
  const base = Number.isFinite(baseAmount) ? Math.max(0, baseAmount) : 0;
  // Design: "10% Of €230" (no trailing .00 for whole euros).
  return Number.isInteger(base) || Math.abs(base - Math.round(base)) < 0.005
    ? String(Math.round(base))
    : base.toFixed(2);
}

function formatProtectiveFeeDescription(kind, percent, baseAmount) {
  const name =
    kind === "lateCancellation"
      ? "Late Cancellation Booking Fee"
      : "Late Rescheduling Fee";
  const pct = Number(percent) || 0;
  return `${name} (${pct}% Of €${formatProtectiveFeeBase(baseAmount)})`;
}

function clampFeePercent(value, ceiling) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const max = Number(ceiling);
  return Number.isFinite(max) && max > 0 ? Math.min(pct, max) : pct;
}

/** Stamped late reschedule fine + Rule A/B (persisted `lateRescheduleAppointmentPassed`). */
function resolveLateRescheduleFee(meta, booking) {
  if (!meta?.showLateRescheduling && !(Number(meta?.outstandingRescheduleFee) > 0)) {
    return null;
  }
  const percent = clampFeePercent(
    meta.lateRescheduleFeePercent,
    meta.lateRescheduleFeePercentCeiling,
  );
  const base = snapshotServiceSubtotal(meta, booking);
  const stamped = roundMoney(Number(meta?.outstandingRescheduleFee) || 0);
  const fromPercent = percent > 0 ? roundMoney((base * percent) / 100) : 0;
  const amount = stamped > 0 ? stamped : fromPercent;
  if (amount <= 0) return null;
  const labelPercent =
    percent > 0
      ? percent
      : base > 0
        ? roundMoney((amount / base) * 100)
        : 0;
  return {
    amount,
    netsPrepaid: protectiveFeeNetsPrepaid(
      "lateReschedule",
      meta.lateRescheduleAppointmentPassed === true,
    ),
    line: {
      description:
        labelPercent > 0
          ? formatProtectiveFeeDescription("lateRescheduling", labelPercent, base)
          : "Late Rescheduling Fee",
      sourceType: "uniqueItemCode",
      sourceReference: "late-reschedule-fee",
      quantity: 1,
      vat: "0%",
      vatRate: 0,
      pricePerUnit: amount,
      totalPrice: amount,
      ...(labelPercent > 0
        ? { feePercent: labelPercent, feeBaseAmount: base }
        : {}),
    },
  };
}

async function hasSettledFeeRow(booking, entryLabel) {
  const found = await query(
    `SELECT 1 FROM finance_transactions
     WHERE professional_profile_id = $1
       AND booking_id = $2
       AND entry_label = $3
       AND status IN ('Paid', 'Prepaid')
     LIMIT 1`,
    [booking.professional_profile_id, booking.unique_code, entryLabel],
  );
  return Boolean(found.rows[0]);
}

function isProtectiveFeeEntryLabel(label) {
  const value = String(label ?? "").trim();
  return (
    value === "Late Cancellation Booking Fee" ||
    value === "Late Rescheduling Fee" ||
    value === "No-show fee"
  );
}

/** Map finance paymentPhase → sales_card_metadata.card_kind (frontend Sales Overview). */
export function salesCardKindForPaymentPhase(paymentPhase) {
  switch (String(paymentPhase ?? "")) {
    case "prepay":
      return "prepayment";
    case "full":
      return "after_treatment";
    case "addon":
      return "addon";
    case "refund":
      return "refund";
    default:
      return null;
  }
}

/** Map refund drawer method → sales-card paymentMethod. */
export function salesPaymentMethodFromRefundMethod(refundMethod) {
  const value = String(refundMethod ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (value === "online-non-direct" || value === "onlinenondirect") {
    return "onlineNonDirect";
  }
  if (value === "offline-direct" || value === "offlinedirect") {
    return "offlineDirect";
  }
  if (value === "offline-non-direct" || value === "offlinenondirect") {
    return "offlineNonDirect";
  }
  if (value.startsWith("offline")) return "offlineDirect";
  return "onlineDirect";
}

/**
 * Mark booking notes.refunded when no Paid/Prepaid finance rows remain.
 * Display Status chip reads details.refunded → "Refunded".
 */
export async function markBookingRefundedIfSettled({
  professionalProfileId,
  bookingRef,
}) {
  const ref = String(bookingRef ?? "").trim();
  if (!professionalProfileId || !ref) return false;

  const booking = await query(
    `SELECT id, notes, unique_code
       FROM bookings
      WHERE id::text = $1 OR unique_code = $1
      LIMIT 1`,
    [ref],
  );
  const row = booking.rows[0];
  if (!row) return false;

  const remaining = await query(
    `SELECT COUNT(*)::int AS n
       FROM finance_transactions
      WHERE professional_profile_id = $1
        AND status IN ('Paid', 'Prepaid')
        AND (
          booking_id = $2
          OR booking_id = $3
          OR booking_id = $4
        )`,
    [
      professionalProfileId,
      String(row.id),
      String(row.unique_code || ""),
      ref,
    ],
  );
  if ((remaining.rows[0]?.n ?? 0) > 0) return false;

  const { human, meta } = splitBookingNotes(row.notes);
  if (meta.refunded) return true;
  const nextNotes = joinBookingNotes(human, {
    ...meta,
    refunded: true,
    waitingForPayment: false,
  });
  await query(
    `UPDATE bookings SET notes = $1, updated_at = NOW() WHERE id = $2`,
    [nextNotes, row.id],
  );
  return true;
}

/** Separate Refund Summary sales card (credit-note details), linked to refunded tx. */
export async function ensureRefundSalesCardMetadata({
  professionalProfileId,
  bookingId,
  financeTransactionId,
  refundMode,
  refundMethod,
  refundReason,
  refundItems,
  refundAmount,
  clientName,
  clientEmail,
}) {
  if (!professionalProfileId || !bookingId || !financeTransactionId) return null;
  const booking = await query(
    `SELECT id, unique_code FROM bookings
      WHERE id::text = $1 OR unique_code = $1
      LIMIT 1`,
    [String(bookingId)],
  );
  const bookingUuid = booking.rows[0]?.id
    ? String(booking.rows[0].id)
    : String(bookingId);
  const bookingCode = booking.rows[0]?.unique_code
    ? String(booking.rows[0].unique_code)
    : String(bookingId);
  const cardId = `${bookingUuid}-refund-${financeTransactionId}`;
  const lines = Array.isArray(refundItems)
    ? refundItems
        .map((item, index) => ({
          id: String(item?.id || `refund-line-${index}`),
          name: String(item?.name || item?.label || item?.description || "Item").trim(),
          quantity: 1,
          unitPrice: roundMoney(Number(item?.amount ?? item?.totalPrice ?? 0) || 0),
        }))
        .filter((line) => line.name)
    : [];
  const amount = roundMoney(
    Number(refundAmount) ||
      lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const metadata = {
    refunded: true,
    refundMode: refundMode === "item" || refundMode === "amount" ? refundMode : null,
    refundMethod: refundMethod ? String(refundMethod).trim() : null,
    refundReason: refundReason ? String(refundReason).trim() : null,
    paymentMethod: salesPaymentMethodFromRefundMethod(refundMethod),
    bookingCode,
    editedLines: lines.length
      ? lines
      : amount > 0
        ? [{ id: "refund-amount", name: "Refund", quantity: 1, unitPrice: amount }]
        : [],
    totalPrice: amount,
    clientName: clientName || undefined,
    clientEmail: clientEmail || undefined,
    paymentPhase: "refund",
  };
  const result = await query(
    `INSERT INTO sales_card_metadata (
       professional_profile_id, card_id, booking_id, card_kind, metadata, finance_transaction_id
     ) VALUES ($1, $2, $3, 'refund', $4::jsonb, $5)
     ON CONFLICT (professional_profile_id, card_id)
     DO UPDATE SET booking_id = EXCLUDED.booking_id,
                   card_kind = 'refund',
                   metadata = sales_card_metadata.metadata || EXCLUDED.metadata,
                   finance_transaction_id = EXCLUDED.finance_transaction_id,
                   updated_at = NOW()
     RETURNING card_id, booking_id, card_kind, finance_transaction_id`,
    [
      professionalProfileId,
      cardId,
      bookingUuid,
      JSON.stringify(metadata),
      financeTransactionId,
    ],
  );
  return result.rows[0] ?? null;
}

/**
 * Card ids must match frontend buildSalesOverviewCards / bookingCheckout conventions
 * so Sales Overview meta and finance rows stay one row per sale.
 */
export function resolveSalesCardId({
  bookingId,
  paymentPhase,
  payerKey = "",
  payerRole = "main_client",
  entryLabel = "",
}) {
  const id = String(bookingId ?? "").trim();
  if (!id) return null;
  const label = String(entryLabel ?? "").trim();
  if (label === "Late Cancellation Booking Fee") return `late-cancellation-${id}`;
  if (label === "No-show fee") return `no-show-${id}`;
  if (label === "Late Rescheduling Fee") return `late-reschedule-${id}`;

  const kind = salesCardKindForPaymentPhase(paymentPhase);
  if (kind === "prepayment") return `${id}-prepayment`;
  if (kind === "after_treatment") {
    const isMain =
      payerRole === "main_client" ||
      !payerKey ||
      payerKey === "main-client";
    return isMain ? `${id}-after-treatment` : `${id}-after-treatment-sub-${payerKey}`;
  }
  return null;
}

/** Persist sales_card_metadata linking booking UUID ↔ finance_transactions.id. */
export async function ensureSalesCardMetadataForFinanceRow({
  professionalProfileId,
  bookingId,
  paymentPhase,
  payerKey = "main-client",
  payerRole = "main_client",
  entryLabel = "",
  financeTransactionId,
  metadata = {},
}) {
  if (!professionalProfileId || !bookingId || !financeTransactionId) return null;
  const cardKind =
    salesCardKindForPaymentPhase(paymentPhase) ||
    (isProtectiveFeeEntryLabel(entryLabel) ? "after_treatment" : null);
  if (!cardKind || cardKind === "addon") return null;
  const cardId = resolveSalesCardId({
    bookingId,
    paymentPhase: paymentPhase || "full",
    payerKey,
    payerRole,
    entryLabel,
  });
  if (!cardId) return null;
  const result = await query(
    `INSERT INTO sales_card_metadata (
       professional_profile_id, card_id, booking_id, card_kind, metadata, finance_transaction_id
     ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     ON CONFLICT (professional_profile_id, card_id)
     DO UPDATE SET booking_id = EXCLUDED.booking_id,
                   card_kind = EXCLUDED.card_kind,
                   metadata = sales_card_metadata.metadata || EXCLUDED.metadata,
                   finance_transaction_id = COALESCE(
                     EXCLUDED.finance_transaction_id,
                     sales_card_metadata.finance_transaction_id
                   ),
                   updated_at = NOW()
     RETURNING card_id, booking_id, card_kind, finance_transaction_id`,
    [
      professionalProfileId,
      cardId,
      String(bookingId),
      cardKind,
      JSON.stringify({
        paymentPhase: paymentPhase || null,
        payerKey: payerKey || "main-client",
        ...metadata,
      }),
      financeTransactionId,
    ],
  );
  return result.rows[0] ?? null;
}

function isPlanningPerson(person) {
  return person?.participantType === "planning" || person?.name === "Planning";
}

/**
 * Build split bill payers from booking notes (clientSnapshot / guests).
 * Prepayment is always charged to the main client against the full booking total %.
 */
function resolveSplitPayers(booking, meta, invoiceSettings) {
  // Snapshot services beat total_price (fee checkout may replace total with LCF only).
  const total = roundMoney(
    Math.max(snapshotServiceSubtotal(meta, booking), Number(booking.total_price) || 0),
  );
  const prepaymentPercent = Number(
    meta.prepaymentPercent ??
      meta.prepayment_percentage ??
      booking.prepayment_percentage ??
      0,
  );
  const prepayStatus = String(booking.prepayment_status ?? "").toLowerCase();
  const showPrepayment =
    Boolean(meta.showPrepayment) ||
    prepayStatus === "paid" ||
    prepayStatus === "pending" ||
    prepayStatus === "required";
  const prepaidAmount =
    showPrepayment && prepaymentPercent > 0
      ? roundMoney((total * prepaymentPercent) / 100)
      : showPrepayment && prepayStatus === "paid"
        ? roundMoney(total * 0.25)
        : 0;

  if (meta.splitBill?.payers?.length) {
    // Frontend persists lineIds (not lineItems). Resolve catalog rows from the
    // booking snapshot / service_id so finance documents keep source references.
    const catalogLines = buildFallbackLineItems(booking, meta, invoiceSettings);
    const byRef = new Map(
      catalogLines
        .filter(isCatalogLinkedLine)
        .map((line) => [String(line.sourceReference), line]),
    );
    return {
      prepaidAmount: roundMoney(meta.splitBill.prepaidAmount ?? prepaidAmount),
      payers: meta.splitBill.payers.map((p) => {
        const role = p.role || "guest";
        let lineItems = Array.isArray(p.lineItems)
          ? p.lineItems.filter(isCatalogLinkedLine)
          : [];
        if (!lineItems.length && Array.isArray(p.lineIds)) {
          lineItems = p.lineIds
            .map((id) => byRef.get(catalogRefFromLineId(id)))
            .filter(Boolean);
        }
        if (
          !lineItems.length &&
          (role === "main_client" || String(p.key) === "main-client")
        ) {
          lineItems = catalogLines.filter(isCatalogLinkedLine);
        }
        lineItems = lineItems.map((line) => applyCatalogVat(line, invoiceSettings));
        return {
          key: String(p.key),
          role,
          label: p.label || (role === "model" ? "Model" : role === "main_client" ? booking.customer_name : "Guest"),
          displayName: p.displayName || p.label || "Guest",
          subtotal: roundMoney(p.subtotal),
          paymentAmount: roundMoney(p.paymentAmount),
          lineItems,
        };
      }),
    };
  }

  const snapshot = meta.clientSnapshot;
  const people = Array.isArray(snapshot?.people) ? snapshot.people : [];
  const services = Array.isArray(snapshot?.services) ? snapshot.services : [];

  if (people.length && services.length) {
    const requester = people.find((p) => p.isRequester) ?? people[0];
    const groups = new Map();

    for (const service of services) {
      if (!service.id && !service.serviceId) continue;
      const assigneeId = String(service.guestId || requester.id);
      const prev = groups.get(assigneeId) ?? [];
      const sourceReference = service.id || service.serviceId;
      prev.push({
        description: service.name || "Service",
        sourceReference,
        sourceType: "serviceId",
        quantity: 1,
        ...vatFieldsForService(sourceReference, invoiceSettings),
        pricePerUnit: roundMoney(service.price),
        totalPrice: roundMoney(service.price),
        amount: roundMoney(service.price),
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

    // If snapshot people exist but no catalog-linked lines resolved, fall through
    // to guests / booking.service_id instead of persisting empty lineItems.
    if (payers.length && payers.some((payer) => payer.lineItems?.length)) {
      return { prepaidAmount, payers };
    }
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
        ...guestServices.map((s) => {
          const sourceReference = s.id || s.serviceId;
          return {
            description: s.name || "Service",
            sourceReference,
            sourceType: "serviceId",
            quantity: 1,
            ...vatFieldsForService(sourceReference, invoiceSettings),
            pricePerUnit: roundMoney(s.price),
            totalPrice: roundMoney(s.price),
            amount: roundMoney(s.price),
          };
        }),
        ...guestProducts.map((p) => {
          const sourceReference = p.id || p.productId;
          return {
            description: p.name || "Product",
            sourceReference,
            sourceType: "productId",
            quantity: parseMoney(p.quantity || 1, 1),
            ...vatFieldsForProduct(sourceReference, invoiceSettings),
            pricePerUnit: roundMoney(p.unitPrice ?? p.price),
            totalPrice: roundMoney(p.price),
            amount: roundMoney(p.price),
          };
        }),
      ].filter((line) => Boolean(line.sourceReference));
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
      // No-ref generic filler is forbidden — only persist catalog-backed lines.
      lineItems: booking.service_id
        ? [{
            description: booking.service_title || "Service",
            sourceReference: String(booking.service_id),
            sourceType: "serviceId",
            quantity: 1,
            ...vatFieldsForService(booking.service_id, invoiceSettings),
            pricePerUnit: roundMoney(mainSubtotal),
            totalPrice: roundMoney(mainSubtotal),
          }]
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
        lineItems: booking.service_id
          ? [{
              description: booking.service_title || "Service",
              sourceReference: String(booking.service_id),
              sourceType: "serviceId",
              quantity: 1,
              ...vatFieldsForService(booking.service_id, invoiceSettings),
              pricePerUnit: roundMoney(total),
              totalPrice: roundMoney(total),
            }]
          : [],
      },
    ],
  };
}

/** Fill empty document.lineItems on an existing tx when newer sync has catalog refs. */
async function healEmptyDocumentLineItems(financeTransactionId, lineItems) {
  const catalog = (Array.isArray(lineItems) ? lineItems : []).filter(isCatalogLinkedLine);
  if (!financeTransactionId || !catalog.length) return;
  await query(
    `UPDATE finance_transactions
     SET document = CASE
           WHEN jsonb_array_length(COALESCE(document->'lineItems', '[]'::jsonb)) = 0
           THEN jsonb_set(COALESCE(document, '{}'::jsonb), '{lineItems}', $2::jsonb)
           ELSE document
         END,
         issued_document = CASE
           WHEN issued_document IS NULL THEN issued_document
           WHEN jsonb_array_length(COALESCE(issued_document->'lineItems', '[]'::jsonb)) = 0
           THEN jsonb_set(issued_document, '{lineItems}', $2::jsonb)
           ELSE issued_document
         END,
         updated_at = NOW()
     WHERE id = $1
       AND jsonb_array_length(COALESCE(document->'lineItems', '[]'::jsonb)) = 0`,
    [financeTransactionId, JSON.stringify(normalizeMoneyJson(catalog))],
  );
}

async function linkSalesCardForInsertedTx(
  booking,
  fields,
  financeTransactionId,
  lineItems = [],
) {
  if (!financeTransactionId || !booking?.id) return financeTransactionId;
  try {
    await healEmptyDocumentLineItems(financeTransactionId, lineItems);
    await ensureSalesCardMetadataForFinanceRow({
      professionalProfileId: booking.professional_profile_id,
      bookingId: booking.id,
      paymentPhase: fields.paymentPhase,
      payerKey: fields.payerKey || "main-client",
      payerRole: fields.payerRole || "main_client",
      entryLabel: fields.entryLabel || "",
      financeTransactionId,
    });
  } catch {
    // sales card link is best-effort; finance row remains authoritative
  }
  void observeLedgerVsLegacy(booking);
  return financeTransactionId;
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
  forceReplace = false,
  /** Optional live fees from Stripe webhook / PaymentIntent retrieve. */
  liveStripeFee = null,
  liveMollureFee = null,
  /** LCF/LRF/NS: `{ feeTotal, prepaidApplied }` — `amount` is the remainder actually charged. */
  feeSettlement = null,
}) {
  const gross = roundMoney(amount);
  const feeTotal = feeSettlement ? roundMoney(feeSettlement.feeTotal) : 0;
  const feePrepaidApplied = feeSettlement ? roundMoney(feeSettlement.prepaidApplied) : 0;
  const labelKey = entryLabel || "";
  const salesCardFields = { paymentPhase, payerKey, payerRole, entryLabel };
  // Open (unresolved) invoice for this booking/phase — replace when amount changes
  // so pre-resolution edits do not leave a stale payment link / prepayment row.
  // Protective fee inserts still void any open same-phase sale (service → LCF).
  const openExisting = await query(
    `SELECT id, gross_amount, status, entry_label FROM finance_transactions
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
    const sameLabel = String(openRow.entry_label || "") === labelKey;
    if (
      shouldReuseOpenFinanceRow({
        forceReplace,
        sameLabel,
        prevGross,
        nextGross: gross,
        prevStatus: openRow.status,
        nextStatus: status,
      })
    ) {
      return linkSalesCardForInsertedTx(
        booking,
        salesCardFields,
        openRow.id,
        lineItems,
      );
    }
    // Amount/label drift or negotiation resend → void old + deactivate link, insert fresh.
    supersededOpenId = openRow.id;
    await query(
      `UPDATE finance_transactions
       SET status = 'Voided', updated_at = NOW()
       WHERE id = $1`,
      [openRow.id],
    );
  } else {
    // Scope by entry_label so Paid LCF is not collapsed into Paid after-treatment.
    const exact = await query(
      `SELECT id FROM finance_transactions
       WHERE professional_profile_id = $1
         AND booking_id = $2
         AND status = $3
         AND COALESCE(document->>'payerKey', '') = $4
         AND COALESCE(document->>'paymentPhase', '') = $5
         AND COALESCE(entry_label, '') = $6
       LIMIT 1`,
      [
        booking.professional_profile_id,
        booking.unique_code,
        status,
        payerKey || "",
        paymentPhase || "",
        labelKey,
      ],
    );
    if (exact.rows[0]) {
      return linkSalesCardForInsertedTx(
        booking,
        salesCardFields,
        exact.rows[0].id,
        lineItems,
      );
    }
  }

  // Stale Stripe / payment-link race: Cancel Sales already Voided this phase, but payment still landed.
  // Do NOT treat intentional fee invoices (LCF/LRF/NS) as that race — voided service sales are expected.
  if (isSettledFinanceStatus(status) && !isProtectiveFeeEntryLabel(labelKey)) {
    const voidedSibling = await query(
      `SELECT id FROM finance_transactions
       WHERE professional_profile_id = $1
         AND booking_id = $2
         AND status = 'Voided'
         AND COALESCE(document->>'payerKey', '') = $3
         AND COALESCE(document->>'paymentPhase', '') = $4
         AND COALESCE(entry_label, '') = $5
         AND ($6::uuid IS NULL OR id <> $6)
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1`,
      [
        booking.professional_profile_id,
        booking.unique_code,
        payerKey || "",
        paymentPhase || "",
        labelKey,
        supersededOpenId,
      ],
    );
    const priorVoidedId = voidedSibling.rows[0]?.id ?? null;
    if (shouldFlagPaymentAfterCancel(status, Boolean(priorVoidedId))) {
      await flagFinancePaymentAfterCancel(priorVoidedId, {
        intendedStatus: status,
        amount: gross,
      });
      return linkSalesCardForInsertedTx(
        booking,
        salesCardFields,
        priorVoidedId,
        lineItems,
      );
    }
  }

  // Fee fully covered by prepaid still persists a €0 Paid row (Fee Summary + invoice).
  if (gross <= 0 && paymentPhase !== "prepay" && feeTotal <= 0) return null;

  const isOnline = paymentMethod.startsWith("online") && booking.booking_type !== "offline";
  const { stripeFee, mollureFee, net } = computeFinanceFees(gross, {
    isOnline,
    stripeFee: liveStripeFee,
    mollureFee: liveMollureFee,
  });
  const { methodTitle, methodDetail } = resolveMethod(booking, paymentMethod);
  const entryId = booking.unique_code || null;
  const docNumber = `INV-${booking.unique_code}${docSuffix || ""}`;
  const invoiceDate = toIsoDate(new Date());
  const invoiceSettings = await loadInvoiceSettingsForProfessional(
    booking.professional_profile_id,
  );
  const professionalBusiness = await loadProfessionalDocumentSnapshot(
    booking.professional_profile_id,
  );
  const prepayResponseDeadlineIso =
    paymentPhase === "prepay" ? resolvePrepaymentResponseDeadlineIso(booking) : null;
  const dueDate =
    status === "Prepayment due" || status === "Overdue response"
      ? toIsoDate(prepayResponseDeadlineIso || invoiceDate)
      : status === "Payment due" || status === "Pending" || status === "Overdue"
        ? resolveOriginalDueDate(invoiceDate, invoiceSettings.paymentTerms)
        : toIsoDate(booking.booking_date);

  const isPrepaymentDocument = paymentPhase === "prepay";
  // PRE: never persist LCF/LRF/NS lines — those belong on the fee invoice only.
  const rawLines = Array.isArray(lineItems) ? lineItems : [];
  const documentLines = isPrepaymentDocument
    ? rawLines.filter((line) => {
        const desc = String(line?.description ?? "");
        const ref = String(line?.sourceReference ?? "");
        if (isProtectiveFeeEntryLabel(desc)) return false;
        if (desc.startsWith("Late Cancellation Booking Fee")) return false;
        if (desc.startsWith("Late Rescheduling Fee")) return false;
        if (/^no-show fee/i.test(desc)) return false;
        if (/late-cancel|late-reschedule|no-show/i.test(ref)) return false;
        return true;
      })
    : rawLines;
  // PRE total = booking services (snapshot), not fee-replaced total_price.
  const notesMeta = (() => {
    try {
      return typeof booking.notes === "string"
        ? JSON.parse(booking.notes || "{}")
        : booking.notes || {};
    } catch {
      return {};
    }
  })();
  const prepayBookingTotal = isPrepaymentDocument
    ? roundMoney(
        Math.max(
          snapshotServiceSubtotal(notesMeta, booking),
          Number(booking.total_price) || 0,
          gross,
        ),
      )
    : gross;
  const document = {
    documentNumber: docNumber,
    receiptNumber: mintReceiptNumber(
      status,
      `${booking.unique_code}${docSuffix || ""}`,
    ),
    serviceDate: toIsoDate(booking.booking_date),
    invoiceDate,
    dueDate,
    reissueLevel: 0,
    paymentPhase,
    payerKey: payerKey || "",
    payerRole: payerRole || "main_client",
    payerLabel: payerLabel || clientName,
    client: buildFinanceClientParty(booking, {
      clientName,
      clientEmail,
      payerRole: payerRole || "main_client",
    }),
    // Keep the snapshot authoritative: an absent line list stays absent. The
    // frontend may display a generic summary, but it must not be persisted as
    // an orphan item without a sold-item reference.
    // A prepayment document still represents the complete booking. The paid
    // amount is kept separately so invoice remaining balance is not zeroed.
    lineItems: documentLines,
    totalPrice: roundMoney(
      isPrepaymentDocument ? prepayBookingTotal : feeSettlement ? feeTotal : gross,
    ),
    ...(isPrepaymentDocument ? { prepaymentAmount: roundMoney(gross) } : {}),
    // Fee docs: invoice renders Total (fee) → Prepaid → Remaining from these.
    ...(feeSettlement
      ? {
          prepaymentAmount: feePrepaidApplied,
          feeSettlement: {
            feeTotal,
            prepaidApplied: feePrepaidApplied,
            amountDue: gross,
          },
        }
      : {}),
    ...(prepayResponseDeadlineIso
      ? { responseDeadlineAt: prepayResponseDeadlineIso }
      : {}),
    paidAmount: roundMoney(gross),
    issuedSnapshot: {
      // Client type alone selects the template — never the pro's defaultInvoiceType.
      templateType: clientType === "business" ? "company" : "individual",
      layout: clientType === "business" ? "itemized" : "simplified",
      invoiceSettings,
      professionalBusiness,
    },
  };

  const inserted = await query(
    `INSERT INTO finance_transactions (
      professional_profile_id, entry_type, entry_id, transaction_date, payment_deadline, entry_label,
      client_name, client_email, client_type,
      gross_amount, stripe_fee, mollure_fee, net_amount,
      method_title, method_detail, status, status_detail, booking_id, document, issued_document, issued_at,
      prepayment_amount, paid_amount
    ) VALUES (
      $1, $2, $3, $4::date, $5::date, $6,
      $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19::jsonb, $19::jsonb, NOW(),
      $20, $21
    ) RETURNING id`,
    [
      booking.professional_profile_id,
      booking.booking_type === "offline" ? "offlineBooking" : "onlineBooking",
      entryId,
      toIsoDate(booking.booking_date),
      dueDate,
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
      paymentPhase === "prepay"
        ? prepaymentStatusDetail(status)
        : payerRole === "guest" || payerRole === "model"
          ? `${payerLabel}: ${clientName}`
          : null,
      booking.unique_code,
      JSON.stringify(normalizeMoneyJson(document)),
      isPrepaymentDocument ? gross : feePrepaidApplied,
      isSettledFinanceStatus(status) ? gross : 0,
    ],
  );

  // Replacement is lineage-preserving: the new checkout snapshot is the only
  // live record, while the superseded row remains auditable and its link is off.
  const newId = inserted.rows[0]?.id ?? null;
  if (newId && supersededOpenId) {
    await query(
      `UPDATE finance_transactions
          SET superseded_by = $2,
              payment_link_active = FALSE,
              updated_at = NOW()
        WHERE id = $1`,
      [supersededOpenId, newId],
    );
    try {
      const { voidLedgerForFinanceTransaction } = await import(
        "./bookingTransactionLedger.service.js"
      );
      await voidLedgerForFinanceTransaction(supersededOpenId);
    } catch {
      /* ledger dual-write is best-effort */
    }
  }

  if (newId && isSettledFinanceStatus(status)) {
    try {
      const {
        mirrorSettledFinanceToLedger,
        recalculateBookingFinancials,
      } = await import("./bookingTransactionLedger.service.js");
      await mirrorSettledFinanceToLedger({
        bookingId: booking.id,
        bookingRef: booking.unique_code,
        clientId: booking.customer_id ?? booking.professional_client_id ?? null,
        professionalProfileId: booking.professional_profile_id,
        financeTransactionId: newId,
        paymentPhase,
        entryLabel: entryLabel || null,
        status,
        amount: gross,
        metadata: { payerKey, payerRole },
      });
      await recalculateBookingFinancials(booking.id);
    } catch {
      /* ledger dual-write is best-effort */
    }
  }

  return linkSalesCardForInsertedTx(booking, salesCardFields, newId);
}

/** Observe-only: compare ledger aggregates vs mutable finance_transactions (debug). */
async function observeLedgerVsLegacy(booking) {
  if (!booking?.id) return;
  try {
    const { getBookingFinancialSnapshot } = await import(
      "./bookingTransactionLedger.service.js"
    );
    const legacy = await query(
      `SELECT COALESCE(SUM(paid_amount), 0) AS paid,
              COALESCE(SUM(prepayment_amount), 0) AS prepaid,
              COALESCE(SUM(refund_amount), 0) AS refunded,
              COALESCE(SUM(gross_amount), 0) AS gross,
              COUNT(*)::int AS row_count
         FROM finance_transactions
        WHERE professional_profile_id = $1
          AND booking_id IN ($2, $3)
          AND status <> 'Voided'`,
      [
        booking.professional_profile_id,
        booking.id,
        booking.unique_code,
      ],
    );
    const leg = legacy.rows[0] ?? {};
    await getBookingFinancialSnapshot(booking.id, {
      basePrice: booking.total_price,
      hasPendingPrepayment: ["pending", "required"].includes(
        String(booking.prepayment_status ?? "").toLowerCase(),
      ),
      hasFailedPayment: String(booking.prepayment_status ?? "").toLowerCase() === "failed",
      appointmentCompleted: String(booking.status ?? "").toLowerCase() === "completed",
      runId: "finance-sync-observe",
      legacyCompare: {
        booking_status: booking.status,
        prepayment_status: booking.prepayment_status,
        paid_amount_sum: Number(leg.paid) || 0,
        prepayment_amount_sum: Number(leg.prepaid) || 0,
        refund_amount_sum: Number(leg.refunded) || 0,
        gross_sum: Number(leg.gross) || 0,
        finance_row_count: leg.row_count ?? 0,
      },
    });
  } catch {
    // ledger table may be empty / missing mid-migrate — never block sync
  }
}

export async function syncBookingToFinanceTransaction(bookingId, options = {}) {
  const booking = await getBookingContext(bookingId);
  if (!booking) return null;

  const {
    paymentPhase: requestedPhase = null,
    paymentMethod = "onlineDirect",
    amountOverride = null,
    statusOverride = null,
    forceReplace = false,
  } = options;

  const meta = parseBookingNotes(booking.notes);
  const invoiceSettings = await loadInvoiceSettingsForProfessional(
    booking.professional_profile_id,
  );
  const { prepaidAmount, payers } = resolveSplitPayers(
    booking,
    meta,
    invoiceSettings,
  );
  const prepayStatus = String(booking.prepayment_status ?? "").toLowerCase();
  const isCompleted = String(booking.status ?? "").toLowerCase() === "completed";
  const fallbackBookingLineItems = buildFallbackLineItems(
    booking,
    meta,
    invoiceSettings,
  );

  const withLateRescheduleFeeLine = (lines) => {
    if (!meta.showLateRescheduling) return lines;
    const percent = Math.max(0, Math.min(100, Number(meta.lateRescheduleFeePercent) || 0));
    if (percent <= 0) return lines;
    const base = snapshotServiceSubtotal(meta, booking);
    const feeAmount = roundMoney((base * percent) / 100);
    if (feeAmount <= 0) return lines;
    const already = (lines ?? []).some(
      (line) => String(line?.sourceReference ?? "").startsWith("late-reschedule"),
    );
    if (already) return lines;
    return [
      ...(lines ?? []),
      {
        description: formatProtectiveFeeDescription("lateRescheduling", percent, base),
        sourceType: "uniqueItemCode",
        sourceReference: "late-reschedule-fee",
        quantity: 1,
        vat: "0%",
        vatRate: 0,
        pricePerUnit: feeAmount,
        totalPrice: feeAmount,
        feePercent: percent,
        feeBaseAmount: base,
      },
    ];
  };

  const bookingStatus = String(booking.status ?? "").toLowerCase();

  if (bookingStatus === "cancelled" || bookingStatus === "canceled") {
    const showLateCancellation = Boolean(meta.showLateCancellation);
    const percent = Math.max(0, Math.min(100, Number(meta.lateCancellationFeePercent) || 0));
    const feeStatus = statusOverride || "Payment due";
    let lastId = null;

    // Keep prepaid receipt when it was collected before cancel.
    if (prepayStatus === "paid" && prepaidAmount > 0) {
      lastId = await insertFinanceTransaction({
        booking,
        paymentPhase: "prepay",
        paymentMethod,
        amount: prepaidAmount,
        status: "Prepaid",
        clientName: booking.customer_name,
        clientEmail: booking.customer_email,
        clientType: resolveClientType(booking),
        payerKey: "main-client",
        payerRole: "main_client",
        payerLabel: booking.customer_name,
        lineItems: fallbackBookingLineItems,
        docSuffix: "-PRE",
        entryLabel: "Prepayment",
      });
    }

    if (showLateCancellation && percent > 0) {
      const serviceBase = snapshotServiceSubtotal(meta, booking);
      const computedFee = roundMoney((serviceBase * percent) / 100);
      const dueFee = roundMoney(
        amountOverride != null && Number.isFinite(Number(amountOverride))
          ? Math.max(0, Number(amountOverride))
          : computedFee > 0
            ? computedFee
            : Math.max(0, Number(booking.total_price ?? 0)),
      );
      if (dueFee > 0) {
        const baseForLabel =
          computedFee > 0 && Math.abs(dueFee - computedFee) < 0.02
            ? serviceBase
            : percent > 0
              ? roundMoney(dueFee / (percent / 100))
              : serviceBase;
        lastId = await insertFinanceTransaction({
          booking,
          paymentPhase: "full",
          paymentMethod,
          amount: dueFee,
          status: feeStatus,
          clientName: booking.customer_name,
          clientEmail: booking.customer_email,
          clientType: resolveClientType(booking),
          payerKey: "main-client",
          payerRole: "main_client",
          payerLabel: booking.customer_name,
          lineItems: [{
            description: formatProtectiveFeeDescription("lateCancellation", percent, baseForLabel),
            sourceType: "uniqueItemCode",
            sourceReference: "late-cancellation-fee",
            quantity: 1,
            vat: "0%",
            vatRate: 0,
            pricePerUnit: dueFee,
            totalPrice: dueFee,
            feePercent: percent,
            feeBaseAmount: baseForLabel,
          }],
          docSuffix: "-LCF",
          entryLabel: "Late Cancellation Booking Fee",
        });
      }
    } else {
      // Paid fee sync when stamp is partial (show flag XOR percent) but amount was paid.
      const overrideFee = roundMoney(Number(amountOverride));
      if (
        (showLateCancellation || percent > 0) &&
        overrideFee > 0 &&
        isSettledFinanceStatus(feeStatus)
      ) {
        lastId = await insertFinanceTransaction({
          booking,
          paymentPhase: "full",
          paymentMethod,
          amount: overrideFee,
          status: feeStatus,
          clientName: booking.customer_name,
          clientEmail: booking.customer_email,
          clientType: resolveClientType(booking),
          payerKey: "main-client",
          payerRole: "main_client",
          payerLabel: booking.customer_name,
          lineItems: [{
            description:
              percent > 0
                ? formatProtectiveFeeDescription(
                    "lateCancellation",
                    percent,
                    roundMoney(overrideFee / (percent / 100)),
                  )
                : "Late Cancellation Booking Fee",
            sourceType: "uniqueItemCode",
            sourceReference: "late-cancellation-fee",
            quantity: 1,
            vat: "0%",
            vatRate: 0,
            pricePerUnit: overrideFee,
            totalPrice: overrideFee,
            ...(percent > 0
              ? {
                  feePercent: percent,
                  feeBaseAmount: roundMoney(overrideFee / (percent / 100)),
                }
              : {}),
          }],
          docSuffix: "-LCF",
          entryLabel: "Late Cancellation Booking Fee",
        });
      }
    }

    // Outstanding LRF on cancel — separate Fee Summary row (desired + fixed).
    const lrf = resolveLateRescheduleFee(meta, booking);
    if (
      lrf &&
      lrf.amount > 0 &&
      !(await hasSettledFeeRow(booking, "Late Rescheduling Fee"))
    ) {
      lastId = await insertFinanceTransaction({
        booking,
        paymentPhase: "full",
        paymentMethod,
        amount: lrf.amount,
        status: feeStatus,
        clientName: booking.customer_name,
        clientEmail: booking.customer_email,
        clientType: resolveClientType(booking),
        payerKey: "main-client",
        payerRole: "main_client",
        payerLabel: booking.customer_name,
        lineItems: [lrf.line],
        docSuffix: "-LRF",
        entryLabel: "Late Rescheduling Fee",
      });
    }

    return lastId;
  }

  if (bookingStatus === "no_show") {
    const rate = Math.max(0, Math.min(100, Number(booking.no_show_fee_percentage) || 0));
    const grossFee = roundMoney(roundMoney(booking.total_price) * rate / 100);
    const dueFee = roundMoney(
      Number.isFinite(Number(booking.no_show_fee_due))
        ? Math.max(0, roundMoney(booking.no_show_fee_due))
        : Math.max(0, grossFee - prepaidAmount),
    );
    if (dueFee <= 0) return null;
    return insertFinanceTransaction({
      booking,
      paymentPhase: "full",
      paymentMethod,
      amount: dueFee,
      status: statusOverride || "Payment due",
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: [{ description: "No-show fee", sourceType: "uniqueItemCode", sourceReference: "no-show-fee", quantity: 1, vat: "0%", vatRate: 0, pricePerUnit: roundMoney(dueFee), totalPrice: roundMoney(dueFee) }],
      docSuffix: "-NS",
      entryLabel: "No-show fee",
    });
  }

  // Explicit single-phase sync (legacy callers / amount override)
  if (requestedPhase === "prepay" || (amountOverride != null && requestedPhase !== "full")) {
    const phase = requestedPhase || "prepay";
    const status = statusOverride ?? resolveTransactionStatus(booking, phase);
    const mainLines = payers.find((payer) => payer.role === "main_client")?.lineItems?.length
      ? payers.find((payer) => payer.role === "main_client").lineItems
      : fallbackBookingLineItems;
    return insertFinanceTransaction({
      booking,
      paymentPhase: phase,
      paymentMethod,
      amount: amountOverride ?? (phase === "prepay" ? prepaidAmount : roundMoney(booking.total_price)),
      status,
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: mainLines,
      docSuffix: phase === "prepay" ? "-PRE" : "",
      entryLabel: phase === "prepay" ? "Prepayment" : null,
      forceReplace,
    });
  }

  const createdIds = [];
  const mainPayer = payers.find((payer) => payer.role === "main_client");
  const mainPrepayLines =
    mainPayer?.lineItems?.length ? mainPayer.lineItems : fallbackBookingLineItems;

  // Unpaid required prepay → Prepayment due (response-window tracked).
  if (
    (prepayStatus === "pending" || prepayStatus === "required") &&
    prepaidAmount > 0 &&
    ["requested", "br_accepted", "confirmed"].includes(bookingStatus)
  ) {
    const id = await insertFinanceTransaction({
      booking,
      paymentPhase: "prepay",
      paymentMethod,
      amount: prepaidAmount,
      status: statusOverride || "Prepayment due",
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: mainPrepayLines,
      docSuffix: "-PRE",
      entryLabel: "Prepayment",
      forceReplace,
    });
    if (id) createdIds.push(id);
    // BR Accepted / requested prepay wait: Prepayment due is the live card.
    if (bookingStatus === "br_accepted" || bookingStatus === "requested") {
      return id;
    }
  }

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
      clientType: resolveClientType(booking),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: mainPrepayLines,
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

      // Online Direct/invoice stays unpaid until collected; only Offline Direct is cash-on-hand.
      const afterTreatmentStatus =
        statusOverride ??
        (payerMethod === "offlineDirect" || booking.booking_type === "offline"
          ? "Paid"
          : payerMethod === "onlineInvoice" ||
              payerMethod === "onlineNonDirect" ||
              payerMethod === "offlineInvoice" ||
              payerMethod === "offlineNonDirect"
            ? "Payment due"
            : "Pending");
      const id = await insertFinanceTransaction({
        booking,
        paymentPhase: "full",
        paymentMethod: payerMethod,
        amount,
        status: afterTreatmentStatus,
        clientName: isMain ? booking.customer_name : payer.displayName,
        clientEmail: isMain ? booking.customer_email : "",
        clientType: resolveClientType(booking, payer.role),
        payerKey: payer.key,
        payerRole: payer.role,
        payerLabel: payer.label,
        lineItems: withLateRescheduleFeeLine(
          payer.lineItems?.length
            ? payer.lineItems
            : isMain
              ? fallbackBookingLineItems
              : [],
        ),
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
    const mainLines = payers.find((payer) => payer.role === "main_client")?.lineItems?.length
      ? payers.find((payer) => payer.role === "main_client").lineItems
      : fallbackBookingLineItems;
    const fullLines = withLateRescheduleFeeLine(mainLines);
    // Fee-only late-reschedule invoice when sync amount matches just the fee line.
    const lateRescheduleOnly =
      phase === "full" &&
      fullLines.length === 1 &&
      String(fullLines[0]?.sourceReference ?? "").startsWith("late-reschedule");
    const id = await insertFinanceTransaction({
      booking,
      paymentPhase: phase,
      paymentMethod,
      amount: amountOverride ?? (phase === "prepay" ? prepaidAmount : roundMoney(booking.total_price)),
      status,
      clientName: booking.customer_name,
      clientEmail: booking.customer_email,
      clientType: resolveClientType(booking),
      payerKey: "main-client",
      payerRole: "main_client",
      payerLabel: booking.customer_name,
      lineItems: phase === "prepay" ? mainLines : fullLines,
      docSuffix: phase === "prepay" ? "-PRE" : lateRescheduleOnly ? "-LRF" : "",
      entryLabel:
        phase === "prepay"
          ? "Prepayment"
          : lateRescheduleOnly
            ? "Late Rescheduling Fee"
            : null,
    });
    return id;
  }

  return createdIds[0] ?? null;
}

/**
 * Apply one automatic reissue step to an overdue unpaid invoice using
 * professional payment-term settings (updates in place, like manual reissue).
 */
async function applySettingsBasedReissue(row, paymentTerms, level, options = {}) {
  const terms = paymentTerms ?? {};
  const prefix = level === 1 ? "first" : "second";
  const trigger = terms[`${prefix}ReissueTrigger`];
  if (!isAutomaticTrigger(trigger)) {
    return { applied: false, reason: "trigger_not_automatic" };
  }

  const dueDays =
    durationToDays(terms[`${prefix}ReissueDueValue`], terms[`${prefix}ReissueDueUnit`]) ?? 14;
  const dueDate = addDaysIso(toIsoDate(new Date()), dueDays);
  const baseAmount = roundMoney(row.net_amount ?? row.gross_amount);
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
    totalPrice: roundMoney(nextAmount),
    reissuedAt: new Date().toISOString(),
    reissueLevel: level,
    ...(penaltyAmount > 0 ? { penaltyAmount } : {}),
  };

  await query(
    `UPDATE finance_transactions
     SET status = 'Payment due',
         status_detail = $2,
         document = $3::jsonb,
         issued_document = $3::jsonb,
         issued_at = NOW(),
         gross_amount = $4,
         net_amount = $4,
         payment_deadline = $5::date,
         updated_at = NOW()
     WHERE id = $1`,
    [row.id, `Reissue of ${prevNumber}`, JSON.stringify(normalizeMoneyJson(nextDoc)), nextAmount, dueDate],
  );

  const dueDateLabel = dueDate.split("-").reverse().join("/");
  if (options.notify !== false) {
    await dispatchInvoiceReissuedNotification(row.id, dueDateLabel);
    await sendFinanceClientEmail(row.id, FINANCE_EMAIL_TYPES.INVOICE_REISSUED, {
      forceKey: dueDate,
    });
  }

  return { applied: true, transactionId: row.id, dueDate, level };
}

/**
 * Online overdue write-off after final reissue: Unpaid but keep checkout link live
 * so a later client payment can still flip to Paid (Voided deactivates links).
 */
async function autoCloseOnlineOverdueToUnpaid(row) {
  if (String(row.entry_type ?? "") !== "onlineBooking") {
    return { applied: false, reason: "not_online" };
  }
  const updated = await query(
    `UPDATE finance_transactions
     SET status = 'Unpaid',
         payment_link_active = TRUE,
         status_detail = 'Auto-closed after final reissue',
         updated_at = NOW()
     WHERE id = $1
       AND entry_type = 'onlineBooking'
       AND status IN ('Payment due', 'Overdue')
     RETURNING id`,
    [row.id],
  );
  return updated.rows[0]
    ? { applied: true, transactionId: row.id, reason: "auto_closed_unpaid" }
    : { applied: false, reason: "not_updated" };
}

/**
 * Process overdue invoice reissues for one professional using their
 * Payments & Reminders settings (first/second Automatic triggers).
 */
export async function processOverdueInvoiceReissues(professionalProfileId) {
  const settings = await loadInvoiceSettingsForProfessional(professionalProfileId);

  const overdue = await query(
    `SELECT *
     FROM finance_transactions
     WHERE professional_profile_id = $1
       AND status IN ('Payment due', 'Overdue')
       AND COALESCE(payment_deadline, NULLIF(document->>'dueDate', '')::date) IS NOT NULL
       AND COALESCE(payment_deadline, NULLIF(document->>'dueDate', '')::date) < CURRENT_DATE`,
    [professionalProfileId],
  );

  let created = 0;
  for (const row of overdue.rows) {
    const doc = row.document ?? {};
    const paymentTerms = resolveDocumentPaymentTerms(doc, settings.paymentTerms);
    const level = Number(doc.reissueLevel) || 0;
    const action = resolveOverdueReissueAction(level, paymentTerms);
    if (action === "close") {
      await autoCloseOnlineOverdueToUnpaid(row);
      continue;
    }
    if (action !== "automatic") continue;

    const result = await applySettingsBasedReissue(row, paymentTerms, level + 1);
    if (result.applied) created += 1;
  }

  return created;
}

/**
 * Flip Prepayment due → Overdue response when the frozen response deadline elapsed.
 * Uses document.responseDeadlineAt, else booking.response_deadline_at, else payment_deadline EOD.
 */
export async function processPrepaymentDueOverdueUpdates() {
  const result = await query(
    `SELECT
       ft.id,
       ft.document,
       ft.payment_deadline,
       b.response_deadline_at
     FROM finance_transactions ft
     LEFT JOIN bookings b ON b.unique_code = ft.booking_id
     WHERE ft.status = 'Prepayment due'
       AND COALESCE(ft.document->>'paymentPhase', '') = 'prepay'`,
  );

  const now = Date.now();
  let flipped = 0;

  for (const row of result.rows) {
    const doc =
      row.document && typeof row.document === "object" ? row.document : {};
    let dueMs = Date.parse(doc.responseDeadlineAt);
    if (!Number.isFinite(dueMs) && row.response_deadline_at) {
      dueMs = new Date(row.response_deadline_at).getTime();
    }
    if (!Number.isFinite(dueMs) && row.payment_deadline) {
      dueMs = new Date(`${String(row.payment_deadline).slice(0, 10)}T23:59:59.999Z`).getTime();
    }
    if (!Number.isFinite(dueMs) || now <= dueMs) continue;

    const updated = await query(
      `UPDATE finance_transactions
       SET status = 'Overdue response',
           status_detail = 'Past response time',
           updated_at = NOW()
       WHERE id = $1
         AND status = 'Prepayment due'
       RETURNING id`,
      [row.id],
    );
    if (updated.rows[0]) flipped += 1;
  }

  return flipped;
}

/**
 * Restart Prepayment Due clock: stamp a new respondBy on the booking, void the
 * open prepay row, and insert a fresh Prepayment due transaction (archive/replace).
 */
export async function restartPrepaymentDueForBooking(bookingId) {
  const booking = await getBookingContext(bookingId);
  if (!booking) return null;

  const setup = await query(
    `SELECT response_time_hours, response_time_minutes
     FROM business_setups
     WHERE id = $1
     LIMIT 1`,
    [booking.business_setup_id],
  );
  const windowMinutes = resolveResponseWindowMinutes(
    setup.rows[0]?.response_time_hours,
    setup.rows[0]?.response_time_minutes,
    null,
  );
  const startedAt = new Date();
  const respondBy = new Date(startedAt.getTime() + windowMinutes * 60_000);
  const { human, meta } = splitBookingNotes(booking.notes);
  const nextMeta = {
    ...meta,
    responseStartedAt: startedAt.toISOString(),
    respondBy: respondBy.toISOString(),
    responseWindowMinutes: windowMinutes,
  };
  delete nextMeta.responseStatus;
  const nextNotes = joinBookingNotes(human, nextMeta);

  await query(
    `UPDATE bookings
     SET notes = $1,
         response_deadline_at = $2::timestamptz,
         updated_at = NOW()
     WHERE id = $3`,
    [nextNotes, respondBy.toISOString(), bookingId],
  );

  await query(
    `UPDATE finance_transactions
     SET status = 'Voided',
         document = jsonb_set(COALESCE(document, '{}'::jsonb), '{status}', '"Voided"'::jsonb, true),
         updated_at = NOW()
     WHERE professional_profile_id = $1
       AND booking_id = $2
       AND COALESCE(document->>'paymentPhase', '') = 'prepay'
       AND status IN ('Prepayment due', 'Overdue response', 'Pending')`,
    [booking.professional_profile_id, booking.unique_code],
  );

  return syncBookingToFinanceTransaction(bookingId, {
    paymentPhase: "prepay",
    paymentMethod:
      booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
    statusOverride: "Prepayment due",
  });
}

/**
 * Run settings-based automatic reissues (+ online Unpaid auto-close after final)
 * across all professionals. Called by the email reminder job.
 */
export async function processAutomaticInvoiceReissues() {
  const overdue = await query(
    `SELECT
       ft.*,
       COALESCE(ft.document->'issuedSnapshot'->'invoiceSettings', pfs.invoice_settings, '{}'::jsonb) AS invoice_settings
     FROM finance_transactions ft
     LEFT JOIN professional_finance_settings pfs
       ON pfs.professional_profile_id = ft.professional_profile_id
     WHERE ft.status IN ('Payment due', 'Overdue')
       AND COALESCE(ft.payment_deadline, NULLIF(ft.document->>'dueDate', '')::date) IS NOT NULL
       AND COALESCE(ft.payment_deadline, NULLIF(ft.document->>'dueDate', '')::date) < CURRENT_DATE`,
  );

  const outcomes = [];
  for (const row of overdue.rows) {
    const settings = mergeInvoiceSettings(row.invoice_settings);
    const doc = row.document ?? {};
    const level = Number(doc.reissueLevel) || 0;
    const action = resolveOverdueReissueAction(level, settings.paymentTerms);
    if (action === "close") {
      outcomes.push(await autoCloseOnlineOverdueToUnpaid(row));
      continue;
    }
    if (action !== "automatic") {
      outcomes.push({ applied: false, reason: "trigger_not_automatic" });
      continue;
    }

    const result = await applySettingsBasedReissue(row, settings.paymentTerms, level + 1, {
      notify: false,
    });
    outcomes.push(result);
  }

  return outcomes;
}
