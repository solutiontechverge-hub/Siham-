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
import { roundMoney } from "../utils/money.js";

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
    `SELECT legal_name, ccc_number, vat_number, street, street_number,
            postal_code, province, municipality, phone
     FROM professional_profiles
     WHERE id = $1`,
    [professionalProfileId],
  );
  const profile = result.rows[0] ?? {};
  return {
    legalName: profile.legal_name ?? null,
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
            pc.id AS professional_client_id,
            pc.client_kind AS pc_client_kind,
            pc.is_mollure AS pc_is_mollure,
            pc.vat AS pc_vat,
            pc.coc AS pc_coc,
            pc.legal_name AS pc_legal_name,
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
        OR lower(pc.email) = lower(u.email)
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
  const isMollure =
    booking.pc_is_mollure === true ||
    (booking.pc_is_mollure !== false && Boolean(booking.customer_id));
  return {
    legalName,
    email: clientEmail || "",
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

function isProtectiveFeeEntryLabel(label) {
  const value = String(label ?? "").trim();
  return (
    value === "Late Cancellation Booking Fee" ||
    value === "Late Rescheduling Fee" ||
    value === "No-show fee"
  );
}

function isPlanningPerson(person) {
  return person?.participantType === "planning" || person?.name === "Planning";
}

/**
 * Build split bill payers from booking notes (clientSnapshot / guests).
 * Prepayment is always charged to the main client against the full booking total %.
 */
function resolveSplitPayers(booking, meta) {
  const total = roundMoney(booking.total_price);
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
      prepaidAmount: roundMoney(meta.splitBill.prepaidAmount ?? prepaidAmount),
      payers: meta.splitBill.payers.map((p) => ({
        key: String(p.key),
        role: p.role || "guest",
        label: p.label || (p.role === "model" ? "Model" : p.role === "main_client" ? booking.customer_name : "Guest"),
        displayName: p.displayName || p.label || "Guest",
        subtotal: roundMoney(p.subtotal),
        paymentAmount: roundMoney(p.paymentAmount),
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
      if (!service.id && !service.serviceId) continue;
      const assigneeId = String(service.guestId || requester.id);
      const prev = groups.get(assigneeId) ?? [];
      prev.push({
        description: service.name || "Service",
        sourceReference: service.id || service.serviceId,
        sourceType: "serviceId",
        quantity: "1",
        vat: "21%",
        vatRate: 21,
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
          sourceReference: s.id || s.serviceId,
          sourceType: "serviceId",
          quantity: "1",
          vat: "21%",
          vatRate: 21,
          pricePerUnit: roundMoney(s.price),
          totalPrice: roundMoney(s.price),
          amount: roundMoney(s.price),
        })),
        ...guestProducts.map((p) => ({
          description: p.name || "Product",
          sourceReference: p.id || p.productId,
          sourceType: "productId",
          quantity: String(p.quantity || 1),
          vat: "21%",
          vatRate: 21,
          pricePerUnit: roundMoney(p.unitPrice ?? p.price),
          totalPrice: roundMoney(p.price),
          amount: roundMoney(p.price),
        })),
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
            quantity: "1",
            vat: "0%",
            vatRate: 0,
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
              quantity: "1",
              vat: "0%",
              vatRate: 0,
              pricePerUnit: roundMoney(total),
              totalPrice: roundMoney(total),
            }]
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
  const labelKey = entryLabel || "";
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
      sameLabel &&
      prevGross === gross &&
      String(openRow.status) === String(status)
    ) {
      return openRow.id;
    }
    // Amount/label drift → void old (Cancel Sales / deactivate link) then insert fresh.
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
    if (exact.rows[0]) return exact.rows[0].id;
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
  const professionalBusiness = await loadProfessionalDocumentSnapshot(
    booking.professional_profile_id,
  );
  const dueDate =
    status === "Payment due" || status === "Pending" || status === "Overdue"
      ? resolveOriginalDueDate(invoiceDate, invoiceSettings.paymentTerms)
      : toIsoDate(booking.booking_date);

  const isPrepaymentDocument = paymentPhase === "prepay";
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
    lineItems: Array.isArray(lineItems) ? lineItems : [],
    totalPrice: roundMoney(
      isPrepaymentDocument ? roundMoney(booking.total_price ?? gross) : gross,
    ),
    ...(isPrepaymentDocument ? { prepaymentAmount: roundMoney(gross) } : {}),
    paidAmount: roundMoney(gross),
    issuedSnapshot: {
      // BC rows must freeze company layout even when defaultInvoiceType is individual.
      templateType:
        clientType === "business" || invoiceSettings.defaultInvoiceType === "company"
          ? "company"
          : "individual",
      layout:
        clientType === "business" || invoiceSettings.defaultInvoiceType === "company"
          ? "itemized"
          : "simplified",
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
      paymentPhase === "prepay" ? "Pay within 15 min" : payerRole === "guest" || payerRole === "model" ? `${payerLabel}: ${clientName}` : null,
      booking.unique_code,
      JSON.stringify(document),
      isPrepaymentDocument ? gross : 0,
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
  }

  return newId;
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
  const fallbackBookingLineItems = booking.service_id
    ? [{
        description: booking.service_title || "Professional Service",
        sourceReference: String(booking.service_id),
        sourceType: "serviceId",
        quantity: "1",
        vat: "21%",
        vatRate: 21,
        pricePerUnit: roundMoney(booking.total_price),
        totalPrice: roundMoney(booking.total_price),
      }]
    : [];

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
    if (showLateCancellation && percent > 0) {
      const serviceBase = snapshotServiceSubtotal(meta, booking);
      // Fee checkout may already have replaced total_price with the fee amount.
      const computedFee = roundMoney((serviceBase * percent) / 100);
      const dueFee = roundMoney(
        amountOverride != null && Number.isFinite(Number(amountOverride))
          ? Math.max(0, Number(amountOverride))
          : computedFee > 0
            ? computedFee
            : Math.max(0, Number(booking.total_price ?? 0)),
      );
      if (dueFee <= 0) return null;
      const baseForLabel =
        computedFee > 0 && Math.abs(dueFee - computedFee) < 0.02
          ? serviceBase
          : percent > 0
            ? roundMoney(dueFee / (percent / 100))
            : serviceBase;
      // Keep prepaid receipt when it was collected before cancel (fee sync returns early).
      if (prepayStatus === "paid" && prepaidAmount > 0) {
        await insertFinanceTransaction({
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
    // Paid fee sync when stamp is partial (show flag XOR percent) but amount was paid.
    const overrideFee = roundMoney(Number(amountOverride));
    if (
      (showLateCancellation || percent > 0) &&
      overrideFee > 0 &&
      isSettledFinanceStatus(statusOverride || "")
    ) {
      return insertFinanceTransaction({
        booking,
        paymentPhase: "full",
        paymentMethod,
        amount: overrideFee,
        status: statusOverride,
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
      lineItems: [],
      docSuffix: phase === "prepay" ? "-PRE" : "",
      entryLabel: phase === "prepay" ? "Prepayment" : null,
    });
  }

  const createdIds = [];

  // Prepayment always from main client (full booking %)
  if (prepayStatus === "paid" && prepaidAmount > 0) {
    const mainPayer = payers.find((payer) => payer.role === "main_client");
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
      lineItems:
        mainPayer?.lineItems?.length ? mainPayer.lineItems : fallbackBookingLineItems,
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
        clientType: resolveClientType(booking, payer.role),
        payerKey: payer.key,
        payerRole: payer.role,
        payerLabel: payer.label,
        lineItems: withLateRescheduleFeeLine(payer.lineItems),
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
    [row.id, `Reissue of ${prevNumber}`, JSON.stringify(nextDoc), nextAmount, dueDate],
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
    const paymentTerms = doc.issuedSnapshot?.invoiceSettings?.paymentTerms ?? settings.paymentTerms;
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
    if (level >= 2) continue;

    const nextLevel = level + 1;
    const result = await applySettingsBasedReissue(row, settings.paymentTerms, nextLevel, { notify: false });
    outcomes.push(result);
  }

  return outcomes;
}
