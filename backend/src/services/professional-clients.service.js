import { query } from "../db/index.js";

const ELIGIBLE_BOOKING_STATUSES = ["confirmed", "completed"];
const ELIGIBLE_CLIENT_TYPES = ["individual", "company"];
const SALES_BOOKING_STATUSES = ["confirmed", "completed", "in_progress"];

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const CLIENT_BOOKING_MATCH_SQL = `
  (
    (pc.mollure_user_id IS NOT NULL AND b.customer_id = pc.mollure_user_id)
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = b.customer_id
        AND LOWER(TRIM(u.email)) = LOWER(TRIM(pc.email))
    )
  )
`;

const formatBusinessAddress = (row) => {
  const parts = [
    row.street,
    row.street_number,
    row.postal_code,
    row.municipality,
    row.province,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

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
       cp.phone AS company_phone,
       cp.ccc_number,
       cp.vat_number,
       cp.street,
       cp.street_number,
       cp.postal_code,
       cp.municipality,
       cp.province
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
  const businessAddress = isCompany ? formatBusinessAddress(row) : null;
  const coc = isCompany ? String(row.ccc_number ?? "").trim() || null : null;
  const vat = isCompany ? String(row.vat_number ?? "").trim() || null : null;

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
           phone = COALESCE(NULLIF(NULLIF(TRIM(phone), ''), '—'), $4),
           gender = COALESCE(NULLIF(TRIM(gender), ''), $5),
           legal_name = COALESCE(NULLIF(TRIM(legal_name), ''), $6),
           contact_person_name = COALESCE(NULLIF(TRIM(contact_person_name), ''), $7),
           coc = COALESCE(NULLIF(TRIM(coc), ''), $8),
           vat = COALESCE(NULLIF(TRIM(vat), ''), $9),
           business_address = COALESCE(NULLIF(TRIM(business_address), ''), $10),
           updated_at = NOW()
       WHERE id = $1`,
      [
        existing.rows[0].id,
        row.booking_date ?? null,
        row.customer_id,
        phone || null,
        row.gender || null,
        isCompany ? row.legal_name || null : null,
        contactPersonName,
        coc,
        vat,
        businessAddress,
      ],
    );
    await refreshProfessionalClientSalesStats(row.professional_profile_id, existing.rows[0].id);
    return existing.rows[0];
  }

  const inserted = await query(
    `INSERT INTO professional_clients (
       professional_profile_id, mollure_user_id, client_kind, is_mollure,
       display_name, email, phone, first_name, last_name, gender, date_of_birth,
       legal_name, contact_person_name, coc, vat, business_address,
       last_booking_date, detail_email
     )
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $5)
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
      coc,
      vat,
      businessAddress,
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

  try {
    await refreshProfessionalClientBookingInsights(professionalProfileId, clientId);
  } catch {
    // Sales totals remain valid even if insight refresh fails.
  }

  return result.rowCount ?? 0;
};

/**
 * Fill missing Mollure client profile fields from the linked user profile.
 */
export const syncProfessionalClientProfilesFromMollure = async (professionalProfileId) => {
  if (!professionalProfileId) return 0;

  const result = await query(
    `UPDATE professional_clients pc
     SET
       phone = CASE
         WHEN NULLIF(NULLIF(TRIM(pc.phone), ''), '—') IS NULL
           THEN COALESCE(NULLIF(TRIM(ip.phone), ''), NULLIF(TRIM(cp.phone), ''), pc.phone)
         ELSE pc.phone
       END,
       gender = COALESCE(NULLIF(TRIM(pc.gender), ''), NULLIF(TRIM(ip.gender), ''), pc.gender),
       date_of_birth = COALESCE(pc.date_of_birth, ip.date_of_birth),
       first_name = COALESCE(NULLIF(TRIM(pc.first_name), ''), NULLIF(TRIM(ip.first_name), ''), pc.first_name),
       last_name = COALESCE(NULLIF(TRIM(pc.last_name), ''), NULLIF(TRIM(ip.last_name), ''), pc.last_name),
       legal_name = COALESCE(NULLIF(TRIM(pc.legal_name), ''), NULLIF(TRIM(cp.legal_name), ''), pc.legal_name),
       coc = COALESCE(NULLIF(TRIM(pc.coc), ''), NULLIF(TRIM(cp.ccc_number), ''), pc.coc),
       vat = COALESCE(NULLIF(TRIM(pc.vat), ''), NULLIF(TRIM(cp.vat_number), ''), pc.vat),
       contact_person_name = COALESCE(
         NULLIF(TRIM(pc.contact_person_name), ''),
         NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
         pc.contact_person_name
       ),
       business_address = COALESCE(
         NULLIF(TRIM(pc.business_address), ''),
         NULLIF(TRIM(CONCAT_WS(', ',
           NULLIF(TRIM(cp.street), ''),
           NULLIF(TRIM(cp.street_number), ''),
           NULLIF(TRIM(cp.postal_code), ''),
           NULLIF(TRIM(cp.municipality), ''),
           NULLIF(TRIM(cp.province), '')
         )), ''),
         pc.business_address
       ),
       updated_at = NOW()
     FROM users u
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE pc.mollure_user_id = u.id
       AND pc.is_mollure = true
       AND pc.professional_profile_id = $1`,
    [professionalProfileId],
  );

  return result.rowCount ?? 0;
};

/**
 * Rebuild recent services and monthly booking history from bookings.
 */
export const refreshProfessionalClientBookingInsights = async (
  professionalProfileId,
  clientId = null,
) => {
  if (!professionalProfileId) return 0;

  const clientFilter = clientId ? "AND pc.id = $3" : "";
  const queryParams = clientId
    ? [SALES_BOOKING_STATUSES, professionalProfileId, clientId]
    : [SALES_BOOKING_STATUSES, professionalProfileId];

  const recentResult = await query(
    `WITH ranked_bookings AS (
       SELECT
         pc.id AS client_id,
         COALESCE(NULLIF(TRIM(sc.title), ''), 'Service') AS service_name,
         b.total_price,
         b.booking_date,
         b.created_at,
         ROW_NUMBER() OVER (
           PARTITION BY pc.id
           ORDER BY b.booking_date DESC, b.created_at DESC
         ) AS rn
       FROM professional_clients pc
       INNER JOIN business_setups bs
         ON bs.professional_profile_id = pc.professional_profile_id
       INNER JOIN bookings b
         ON b.business_setup_id = bs.id
        AND b.status = ANY($1::text[])
        AND ${CLIENT_BOOKING_MATCH_SQL}
       LEFT JOIN subcategories sc ON sc.id = b.service_id
       WHERE pc.professional_profile_id = $2
         ${clientFilter}
     ),
     recent AS (
       SELECT
         client_id,
         jsonb_agg(
           jsonb_build_object(
             'name', service_name,
             'price',
             CASE
               WHEN MOD(COALESCE(total_price, 0)::numeric, 1) = 0
                 THEN '€' || TO_CHAR(COALESCE(total_price, 0)::numeric, 'FM999,999,999')
               ELSE '€' || TO_CHAR(ROUND(COALESCE(total_price, 0)::numeric, 2), 'FM999,999,990.00')
             END
           )
           ORDER BY booking_date DESC, created_at DESC
         ) AS recent_services
       FROM ranked_bookings
       WHERE rn <= 3
       GROUP BY client_id
     ),
     targets AS (
       SELECT pc.id
       FROM professional_clients pc
       WHERE pc.professional_profile_id = $2
         ${clientFilter}
     )
     UPDATE professional_clients pc
     SET recent_services = COALESCE(recent.recent_services, '[]'::jsonb),
         updated_at = NOW()
     FROM targets t
     LEFT JOIN recent ON recent.client_id = t.id
     WHERE pc.id = t.id`,
    queryParams,
  );

  const historyResult = await query(
    `WITH monthly AS (
       SELECT
         pc.id AS client_id,
         TRIM(TO_CHAR(b.booking_date, 'Month YYYY')) AS period,
         DATE_TRUNC('month', b.booking_date::timestamp) AS month_start,
         COUNT(*)::int AS bookings
       FROM professional_clients pc
       INNER JOIN business_setups bs
         ON bs.professional_profile_id = pc.professional_profile_id
       INNER JOIN bookings b
         ON b.business_setup_id = bs.id
        AND b.status = ANY($1::text[])
        AND ${CLIENT_BOOKING_MATCH_SQL}
       WHERE pc.professional_profile_id = $2
         ${clientFilter}
       GROUP BY pc.id, DATE_TRUNC('month', b.booking_date::timestamp)
     ),
     ranked_months AS (
       SELECT
         client_id,
         period,
         month_start,
         bookings,
         ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY month_start DESC) AS rn
       FROM monthly
     ),
     history AS (
       SELECT
         client_id,
         jsonb_agg(
           jsonb_build_object('period', period, 'bookings', bookings)
           ORDER BY month_start DESC
         ) AS booking_history
       FROM ranked_months
       WHERE rn <= 6
       GROUP BY client_id
     ),
     targets AS (
       SELECT pc.id
       FROM professional_clients pc
       WHERE pc.professional_profile_id = $2
         ${clientFilter}
     )
     UPDATE professional_clients pc
     SET booking_history = COALESCE(history.booking_history, '[]'::jsonb),
         updated_at = NOW()
     FROM targets t
     LEFT JOIN history ON history.client_id = t.id
     WHERE pc.id = t.id`,
    queryParams,
  );

  return (recentResult.rowCount ?? 0) + (historyResult.rowCount ?? 0);
};
