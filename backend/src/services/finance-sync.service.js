import { query } from "../db/index.js";

const formatEuro = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "€0";
  const rounded = Math.round(n * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `€${text}`;
};

const toIsoDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

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

export async function syncBookingToFinanceTransaction(bookingId, options = {}) {
  const booking = await getBookingContext(bookingId);
  if (!booking) return null;

  const {
    paymentPhase = "full",
    paymentMethod = "onlineDirect",
    amountOverride = null,
    statusOverride = null,
  } = options;

  const entryType = booking.booking_type === "offline" ? "offlineBooking" : "onlineBooking";
  const gross = amountOverride ?? Number(booking.total_price ?? 0);
  const isOnline = paymentMethod.startsWith("online") && booking.booking_type !== "offline";
  const stripeFee = isOnline ? Math.round(gross * 0.029 * 100) / 100 : null;
  const mollureFee = isOnline ? Math.round(gross * 0.01 * 100) / 100 : null;
  const net = gross - (stripeFee ?? 0) - (mollureFee ?? 0);
  const status = statusOverride ?? resolveTransactionStatus(booking, paymentPhase);
  const { methodTitle, methodDetail } = resolveMethod(booking, paymentMethod);
  const entryId = booking.unique_code?.replace(/\D/g, "") || null;
  const invoiceSuffix = paymentPhase === "prepay" ? "-PRE" : "";
  const docNumber = `INV-${booking.unique_code}${invoiceSuffix}`;

  const existing = await query(
    `SELECT id FROM finance_transactions
     WHERE professional_profile_id = $1
       AND booking_id = $2
       AND status = $3
     LIMIT 1`,
    [booking.professional_profile_id, booking.unique_code, status],
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const document = {
    documentNumber: docNumber,
    receiptNumber: status === "Paid" || status === "Prepaid" ? `RCP-${booking.unique_code}${invoiceSuffix}` : undefined,
    serviceDate: toIsoDate(booking.booking_date),
    invoiceDate: toIsoDate(new Date()),
    dueDate: toIsoDate(booking.booking_date),
    client: {
      legalName: booking.customer_name,
      email: booking.customer_email,
    },
    lineItems: booking.service_title
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
      $1, $2, $3, $4::date, NULL,
      $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17::jsonb
    ) RETURNING id`,
    [
      booking.professional_profile_id,
      entryType,
      entryId,
      toIsoDate(booking.booking_date),
      booking.customer_name,
      booking.customer_email ?? "",
      resolveClientType(booking.customer_email),
      gross,
      stripeFee,
      mollureFee,
      net,
      methodTitle,
      methodDetail,
      status,
      paymentPhase === "prepay" ? "Pay within 15 min" : null,
      booking.unique_code,
      JSON.stringify(document),
    ],
  );

  return inserted.rows[0]?.id ?? null;
}

export async function processOverdueInvoiceReissues(professionalProfileId) {
  const overdue = await query(
    `SELECT * FROM finance_transactions
     WHERE professional_profile_id = $1
       AND status IN ('Payment due', 'Overdue')
       AND transaction_date < NOW() - INTERVAL '7 days'`,
    [professionalProfileId],
  );

  let created = 0;
  for (const row of overdue.rows) {
    const doc = row.document ?? {};
    const prevNumber = doc.documentNumber ?? "INV-UNKNOWN";
    const reissueNumber = `${prevNumber}-R${Date.now().toString().slice(-4)}`;
    const gross = Number(row.net_amount ?? 0) * 1.1;

    await query(
      `INSERT INTO finance_transactions (
        professional_profile_id, entry_type, entry_id, transaction_date,
        client_name, client_email, client_type,
        gross_amount, net_amount, method_title, method_detail,
        status, status_detail, booking_id, document
      ) VALUES (
        $1, $2, NULL, CURRENT_DATE,
        $3, $4, $5,
        $6, $6, $7, $8,
        'Payment due', $9, $10, $11::jsonb
      )`,
      [
        professionalProfileId,
        row.entry_type,
        row.client_name,
        row.client_email,
        row.client_type,
        gross,
        row.method_title,
        "Re-issued invoice",
        `Re-issued from ${prevNumber}`,
        row.booking_id,
        JSON.stringify({
          ...doc,
          documentNumber: reissueNumber,
          reissuedFrom: prevNumber,
          invoiceDate: toIsoDate(new Date()),
          dueDate: toIsoDate(new Date(Date.now() + 14 * 86400000)),
          totalPrice: formatEuro(gross),
        }),
      ],
    );

    await query(
      `UPDATE finance_transactions SET status = 'Overdue', updated_at = NOW() WHERE id = $1`,
      [row.id],
    );
    created += 1;
  }

  return created;
}
