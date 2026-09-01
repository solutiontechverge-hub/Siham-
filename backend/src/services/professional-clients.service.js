import { query } from "../db/index.js";

const ELIGIBLE_BOOKING_STATUSES = ["confirmed", "completed"];
const ELIGIBLE_CLIENT_TYPES = ["individual", "company"];
const SALES_BOOKING_STATUSES = ["confirmed", "completed", "in_progress"];

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const clientDisplayName = (row, email) => {
  if (row.user_type === "company") {
    return (
      String(row.legal_name ?? "").trim() ||
      `${String(row.contact_first_name ?? "").trim()} ${String(row.contact_last_name ?? "").trim()}`.trim() ||
      email
    );
  }
  return (
    String(row.display_name ?? "").trim() ||
    `${String(row.first_name ?? "").trim()} ${String(row.last_name ?? "").trim()}`.trim() ||
    email
  );
};

const loadEligibleBookingClient = async (bookingId) => {
  const result = await query(
    `SELECT
       b.id,
       b.status,
       b.customer_id,
       b.booking_date,
       bs.professional_profile_id,
       u.email,
       u.user_type,
       ip.first_name,
       ip.last_name,
       ip.display_name,
       ip.phone,
       ip.gender,
       ip.date_of_birth,
       cp.legal_name,
       cp.contact_first_name,
       cp.contact_last_name,
       cp.phone AS company_phone
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );
  return result.rows[0] || null;
};

/**
 * Add a Mollure IC/CC client to this professional's list when a booking is
 * confirmed (or completed). Duplicate emails for the same professional are skipped.
 * Fixed and desired location bookings both qualify. Each professional's list is isolated.
 */
export const ensureProfessionalClientFromBooking = async (bookingId) => {
  if (!bookingId) return null;

  const row = await loadEligibleBookingClient(bookingId);
  if (!row?.professional_profile_id || !row.customer_id) return null;
  if (!ELIGIBLE_BOOKING_STATUSES.includes(String(row.status ?? "").toLowerCase())) {
    return null;
  }
  if (!ELIGIBLE_CLIENT_TYPES.includes(row.user_type)) return null;

  const email = normalizeEmail(row.email);
  if (!email) return null;

  const isCompany = row.user_type === "company";
  const displayName = clientDisplayName(row, email);
  const phone = isCompany ? row.company_phone : row.phone;
  const contactPersonName = isCompany
    ? `${String(row.contact_first_name ?? "").trim()} ${String(row.contact_last_name ?? "").trim()}`.trim() || null
    : null;

  const existing = await query(
    `SELECT id, last_booking_date
     FROM professional_clients
     WHERE professional_profile_id = $1
       AND (
         mollure_user_id = $2
         OR LOWER(TRIM(email)) = $3
       )
     LIMIT 1`,
    [row.professional_profile_id, row.customer_id, email],
  );

  if (existing.rowCount) {
    await query(
      `UPDATE professional_clients
       SET last_booking_date = CASE
             WHEN $2::date IS NULL THEN last_booking_date
             WHEN last_booking_date IS NULL OR $2::date > last_booking_date THEN $2::date
             ELSE last_booking_date
           END,
           mollure_user_id = COALESCE(mollure_user_id, $3),
           is_mollure = true,
           updated_at = NOW()
       WHERE id = $1`,
      [existing.rows[0].id, row.booking_date ?? null, row.customer_id],
    );
    await refreshProfessionalClientSalesStats(row.professional_profile_id, existing.rows[0].id);
    return existing.rows[0];
  }

  const inserted = await query(
    `INSERT INTO professional_clients (
       professional_profile_id, mollure_user_id, client_kind, is_mollure,
       display_name, email, phone, first_name, last_name, gender, date_of_birth,
       legal_name, contact_person_name, last_booking_date, detail_email
     )
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $5)
     ON CONFLICT (professional_profile_id, email) DO NOTHING
     RETURNING id`,
    [
      row.professional_profile_id,
      row.customer_id,
      isCompany ? "company" : "individual",
      displayName,
      email,
      phone || null,
      row.first_name || null,
      row.last_name || null,
      row.gender || null,
      row.date_of_birth || null,
      isCompany ? row.legal_name || null : null,
      contactPersonName,
      row.booking_date || null,
    ],
  );

  const clientId = inserted.rows[0]?.id;
  if (clientId) {
    await refreshProfessionalClientSalesStats(row.professional_profile_id, clientId);
  }
  return inserted.rows[0] || null;
};

export const safeEnsureProfessionalClientFromBooking = async (bookingId) => {
  try {
    return await ensureProfessionalClientFromBooking(bookingId);
  } catch {
    return null;
  }
};

/**
 * Backfill clients from existing confirmed/completed bookings for one professional.
 * Skips emails (and Mollure user ids) already on that professional's list.
 */
export const syncProfessionalClientsFromConfirmedBookings = async (professionalProfileId) => {
  if (!professionalProfileId) return 0;

  const result = await query(
    `INSERT INTO professional_clients (
       professional_profile_id, mollure_user_id, client_kind, is_mollure,
       display_name, email, phone, first_name, last_name, gender, date_of_birth,
       legal_name, contact_person_name, last_booking_date, detail_email
     )
     SELECT DISTINCT ON (LOWER(TRIM(u.email)))
       $1,
       u.id,
       CASE WHEN u.user_type = 'company' THEN 'company' ELSE 'individual' END,
       true,
       COALESCE(
         CASE WHEN u.user_type = 'company' THEN NULLIF(TRIM(cp.legal_name), '') END,
         NULLIF(TRIM(ip.display_name), ''),
         NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
         NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
         u.email
       ),
       LOWER(TRIM(u.email)),
       COALESCE(NULLIF(TRIM(ip.phone), ''), NULLIF(TRIM(cp.phone), '')),
       ip.first_name,
       ip.last_name,
       ip.gender,
       ip.date_of_birth,
       CASE WHEN u.user_type = 'company' THEN cp.legal_name ELSE NULL END,
       CASE
         WHEN u.user_type = 'company'
           THEN NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), '')
         ELSE NULL
       END,
       b.booking_date,
       LOWER(TRIM(u.email))
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN users u ON u.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE bs.professional_profile_id = $1
       AND b.status IN ('confirmed', 'completed')
       AND u.user_type IN ('individual', 'company')
       AND NULLIF(TRIM(u.email), '') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM professional_clients pc
         WHERE pc.professional_profile_id = $1
           AND (
             pc.mollure_user_id = u.id
             OR LOWER(TRIM(pc.email)) = LOWER(TRIM(u.email))
           )
       )
     ORDER BY LOWER(TRIM(u.email)), b.booking_date DESC NULLS LAST
     ON CONFLICT (professional_profile_id, email) DO NOTHING`,
    [professionalProfileId],
  );

  return result.rowCount ?? 0;
};

/**
 * Recalculate total sales, completed count, and average from this
 * professional's confirmed / completed / in-progress bookings.
 * Total Sales = sum of those booking amounts for that client only.
 */
export const refreshProfessionalClientSalesStats = async (
  professionalProfileId,
  clientId = null,
) => {
  if (!professionalProfileId) return 0;

  const clientFilter = clientId ? "AND pc.id = $3" : "";
  const queryParams = clientId
    ? [SALES_BOOKING_STATUSES, professionalProfileId, clientId]
    : [SALES_BOOKING_STATUSES, professionalProfileId];

  const result = await query(
    `UPDATE professional_clients pc
     SET
       total_sales = s.total_sales,
       bookings_completed = s.bookings_completed,
       average_booking_value = s.average_booking_value,
       last_booking_date = COALESCE(s.last_booking_date, pc.last_booking_date),
       updated_at = NOW()
     FROM (
       SELECT
         pc.id,
         COALESCE(SUM(b.total_price), 0) AS total_sales,
         COUNT(*) FILTER (WHERE b.status = 'completed')::int AS bookings_completed,
         CASE
           WHEN COUNT(b.id) > 0
           THEN ROUND((SUM(b.total_price) / COUNT(b.id))::numeric, 2)
           ELSE 0
         END AS average_booking_value,
         MAX(b.booking_date) AS last_booking_date
       FROM professional_clients pc
       LEFT JOIN business_setups bs
         ON bs.professional_profile_id = pc.professional_profile_id
       LEFT JOIN bookings b
         ON b.business_setup_id = bs.id
        AND b.status = ANY($1::text[])
        AND (
          (pc.mollure_user_id IS NOT NULL AND b.customer_id = pc.mollure_user_id)
          OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = b.customer_id
              AND LOWER(TRIM(u.email)) = LOWER(TRIM(pc.email))
          )
        )
       WHERE pc.professional_profile_id = $2
         ${clientFilter}
       GROUP BY pc.id
     ) s
     WHERE pc.id = s.id`,
    queryParams,
  );

  return result.rowCount ?? 0;
};
