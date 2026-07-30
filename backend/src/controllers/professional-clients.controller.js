import { query } from "../db/index.js";
import { parseUuid } from "../utils/uuid.js";
import {
  listResponse,
  paginateItems,
  parseListPagination,
  sqlLimitOffset,
  withPaginationParams,
} from "../utils/pagination.js";

const getProfessionalProfile = async (userId) => {
  const result = await query(
    `SELECT id, user_id FROM professional_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

const formatEuro = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "€0";
  return `€${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const formatDmy = (value) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatAddedOn = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const formatStatsDate = (value) => {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const mapClientRow = (row) => ({
  id: row.id,
  client_kind: row.client_kind,
  is_mollure: row.is_mollure,
  mollure_user_id: row.mollure_user_id,
  display_name: row.display_name,
  email: row.email,
  phone: row.phone ?? "—",
  technical_note: row.technical_note,
  is_blocked: row.is_blocked,
  has_no_show: row.has_no_show,
  total_sales: Number(row.total_sales ?? 0),
  total_sales_label: formatEuro(row.total_sales),
  last_booking_date: row.last_booking_date,
  last_booking_label: formatDmy(row.last_booking_date),
  stats_last_booking: formatStatsDate(row.last_booking_date),
  bookings_completed: Number(row.bookings_completed ?? 0),
  average_booking_value: Number(row.average_booking_value ?? 0),
  average_booking_value_label: formatEuro(row.average_booking_value),
  recent_services: Array.isArray(row.recent_services) ? row.recent_services : [],
  booking_history: Array.isArray(row.booking_history) ? row.booking_history : [],
  first_name: row.first_name,
  last_name: row.last_name,
  gender: row.gender,
  date_of_birth: row.date_of_birth ? formatDmy(row.date_of_birth) : null,
  residential_address: row.residential_address,
  legal_name: row.legal_name,
  coc: row.coc,
  vat: row.vat,
  contact_person_name: row.contact_person_name,
  business_address: row.business_address,
  detail_email: row.detail_email,
  added_on: formatAddedOn(row.created_at),
  created_at: row.created_at,
});

export const listProfessionalClients = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can access clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const pagination = parseListPagination(req.query);
    const { clause: limitClause } = sqlLimitOffset(2);

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM professional_clients
       WHERE professional_profile_id = $1`,
      [profile.id],
    );
    const total = countResult.rows[0]?.total ?? 0;

    const result = await query(
      `SELECT * FROM professional_clients
       WHERE professional_profile_id = $1
       ORDER BY created_at DESC
       ${pagination.paginate ? limitClause : ""}`,
      withPaginationParams([profile.id], pagination),
    );

    return res.status(200).json(
      listResponse({
        message: "Clients fetched successfully.",
        data: result.rows.map(mapClientRow),
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients.",
      data: { error: error.message },
    });
  }
};

/**
 * Lookup any registered Mollure client (individual/company) by exact email.
 * Used by calendar "Add from Mollure platform" — no prior booking required.
 */
export const lookupMollureClientByEmail = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Only professionals can look up Mollure clients.",
        data: null,
      });
    }

    const email = String(req.query.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required.",
        data: null,
      });
    }

    const result = await query(
      `SELECT
         u.id,
         u.email,
         COALESCE(
           NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
           NULLIF(TRIM(ip.display_name), ''),
           NULLIF(TRIM(cp.legal_name), ''),
           NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
           u.email
         ) AS name
       FROM users u
       LEFT JOIN individual_profiles ip ON ip.user_id = u.id
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       WHERE LOWER(TRIM(u.email)) = $1
         AND u.user_type IN ('individual', 'company')
         AND COALESCE(u.is_active, true) = true
       LIMIT 1`,
      [email],
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "User is not a Mollure client",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mollure client found.",
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to look up Mollure client.",
      data: { error: error.message },
    });
  }
};

export const listMollureClientDirectory = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can access directory.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const q = String(req.query.q ?? "").trim().toLowerCase();

    const result = await query(
      `SELECT DISTINCT ON (u.id)
         u.id,
         COALESCE(ip.display_name, NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''), u.email) AS name,
         u.email,
         BOOL_OR(b.status IN ('confirmed', 'completed')) AS has_eligible_booking
       FROM users u
       INNER JOIN bookings b ON b.customer_id = u.id
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       LEFT JOIN individual_profiles ip ON ip.user_id = u.id
       WHERE bs.professional_profile_id = $1
         AND u.user_type IN ('individual', 'company')
         AND b.status IN ('confirmed', 'completed')
         AND NOT EXISTS (
           SELECT 1 FROM professional_clients pc
           WHERE pc.professional_profile_id = $1
             AND pc.mollure_user_id = u.id
         )
       GROUP BY u.id, ip.display_name, ip.first_name, ip.last_name, u.email
       ORDER BY u.id, MAX(b.created_at) DESC`,
      [profile.id],
    );

    let rows = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      has_eligible_booking: Boolean(row.has_eligible_booking),
    }));

    if (q) {
      rows = rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(q));
    }

    const pagination = parseListPagination(req.query);
    const paged = paginateItems(rows, pagination);

    return res.status(200).json(
      listResponse({
        message: "Mollure client directory fetched successfully.",
        data: paged.items,
        page: pagination.page,
        limit: pagination.limit,
        total: paged.pagination.total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Mollure client directory.",
      data: { error: error.message },
    });
  }
};

export const createProfessionalClient = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can add clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const mollureUserId = req.body.mollure_user_id ? parseUuid(req.body.mollure_user_id, "mollure_user_id") : null;

    if (mollureUserId) {
      const userResult = await query(
        `SELECT u.id, u.email, u.user_type,
                ip.first_name, ip.last_name, ip.display_name, ip.phone, ip.gender, ip.date_of_birth, ip.country_code,
                cp.legal_name, cp.contact_first_name, cp.contact_last_name, cp.phone AS company_phone
         FROM users u
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id
         LEFT JOIN company_profiles cp ON cp.user_id = u.id
         WHERE u.id = $1`,
        [mollureUserId],
      );
      const user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({ success: false, message: "Mollure user not found.", data: null });
      }

      const bookingCheck = await query(
        `SELECT 1
         FROM bookings b
         INNER JOIN business_setups bs ON bs.id = b.business_setup_id
         WHERE bs.professional_profile_id = $1
           AND b.customer_id = $2
           AND b.status IN ('confirmed', 'completed')
         LIMIT 1`,
        [profile.id, mollureUserId],
      );

      if (!bookingCheck.rowCount) {
        return res.status(400).json({
          success: false,
          message: "Client must have a confirmed or completed booking before being added.",
          data: null,
        });
      }

      const isCompany = user.user_type === "company";
      const displayName = isCompany
        ? user.legal_name || user.email
        : user.display_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
      const phone = isCompany ? user.company_phone : user.phone;

      const insert = await query(
        `INSERT INTO professional_clients (
           professional_profile_id, mollure_user_id, client_kind, is_mollure,
           display_name, email, phone, first_name, last_name, gender, date_of_birth,
           legal_name, contact_person_name
         )
         VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          profile.id,
          mollureUserId,
          isCompany ? "company" : "individual",
          displayName,
          user.email,
          phone,
          user.first_name,
          user.last_name,
          user.gender,
          user.date_of_birth,
          isCompany ? user.legal_name : null,
          isCompany ? `${user.contact_first_name ?? ""} ${user.contact_last_name ?? ""}`.trim() : null,
        ],
      );

      return res.status(201).json({
        success: true,
        message: "Client added successfully.",
        data: mapClientRow(insert.rows[0]),
      });
    }

    const clientKind = req.body.client_kind === "company" ? "company" : "individual";
    const email = String(req.body.email ?? "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required.", data: null });
    }

    const displayName =
      clientKind === "company"
        ? String(req.body.legal_name ?? "").trim()
        : `${String(req.body.first_name ?? "").trim()} ${String(req.body.last_name ?? "").trim()}`.trim();

    if (!displayName) {
      return res.status(400).json({ success: false, message: "Client name is required.", data: null });
    }

    const phone = [req.body.country_code, req.body.phone].filter(Boolean).join(" ").trim() || null;

    const insert = await query(
      `INSERT INTO professional_clients (
         professional_profile_id, client_kind, is_mollure, display_name, email, phone, technical_note,
         first_name, last_name, gender, date_of_birth, residential_address,
         legal_name, coc, vat, contact_person_name, business_address, detail_email
       )
       VALUES ($1, $2, false, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        profile.id,
        clientKind,
        displayName,
        email,
        phone,
        req.body.technical_note?.trim() || null,
        req.body.first_name?.trim() || null,
        req.body.last_name?.trim() || null,
        req.body.gender || null,
        req.body.date_of_birth || null,
        req.body.residential_address?.trim() || null,
        req.body.legal_name?.trim() || null,
        req.body.coc?.trim() || null,
        req.body.vat?.trim() || null,
        req.body.contact_person_name?.trim() || null,
        req.body.business_address?.trim() || null,
        req.body.detail_email?.trim() || email,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Client added successfully.",
      data: mapClientRow(insert.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "This client is already in your list.", data: null });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to add client.",
      data: { error: error.message },
    });
  }
};

export const updateProfessionalClient = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can update clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const clientId = parseUuid(req.params.id, "client id");
    const existing = await query(
      `SELECT * FROM professional_clients WHERE id = $1 AND professional_profile_id = $2`,
      [clientId, profile.id],
    );
    if (!existing.rowCount) {
      return res.status(404).json({ success: false, message: "Client not found.", data: null });
    }

    if (existing.rows[0].is_mollure) {
      return res.status(400).json({
        success: false,
        message: "Mollure clients manage their own profile. Only the technical note can be updated here.",
        data: null,
      });
    }

    const row = existing.rows[0];
    const clientKind = row.client_kind;
    const email = String(req.body.email ?? row.email).trim().toLowerCase();
    const phone = [req.body.country_code, req.body.phone].filter(Boolean).join(" ").trim() || row.phone;

    const displayName =
      clientKind === "company"
        ? String(req.body.legal_name ?? row.legal_name ?? row.display_name).trim()
        : `${String(req.body.first_name ?? row.first_name ?? "").trim()} ${String(req.body.last_name ?? row.last_name ?? "").trim()}`.trim();

    const updated = await query(
      `UPDATE professional_clients SET
         display_name = $3,
         email = $4,
         phone = $5,
         technical_note = COALESCE($6, technical_note),
         first_name = $7,
         last_name = $8,
         gender = $9,
         date_of_birth = COALESCE($10::date, date_of_birth),
         residential_address = $11,
         legal_name = $12,
         coc = $13,
         vat = $14,
         contact_person_name = $15,
         business_address = $16,
         detail_email = $17,
         updated_at = NOW()
       WHERE id = $1 AND professional_profile_id = $2
       RETURNING *`,
      [
        clientId,
        profile.id,
        displayName || row.display_name,
        email,
        phone,
        req.body.technical_note?.trim() ?? row.technical_note,
        req.body.first_name?.trim() ?? row.first_name,
        req.body.last_name?.trim() ?? row.last_name,
        req.body.gender ?? row.gender,
        req.body.date_of_birth || null,
        req.body.residential_address?.trim() ?? row.residential_address,
        req.body.legal_name?.trim() ?? row.legal_name,
        req.body.coc?.trim() ?? row.coc,
        req.body.vat?.trim() ?? row.vat,
        req.body.contact_person_name?.trim() ?? row.contact_person_name,
        req.body.business_address?.trim() ?? row.business_address,
        req.body.detail_email?.trim() ?? row.detail_email,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Client updated successfully.",
      data: mapClientRow(updated.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update client.",
      data: { error: error.message },
    });
  }
};

export const updateProfessionalClientTechnicalNote = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can update clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const clientId = parseUuid(req.params.id, "client id");
    const note = String(req.body.technical_note ?? "").trim();

    const updated = await query(
      `UPDATE professional_clients
       SET technical_note = NULLIF($3, ''), updated_at = NOW()
       WHERE id = $1 AND professional_profile_id = $2
       RETURNING *`,
      [clientId, profile.id, note],
    );

    if (!updated.rowCount) {
      return res.status(404).json({ success: false, message: "Client not found.", data: null });
    }

    return res.status(200).json({
      success: true,
      message: "Technical note saved.",
      data: mapClientRow(updated.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save technical note.",
      data: { error: error.message },
    });
  }
};

export const setProfessionalClientBlocked = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can block clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const clientId = parseUuid(req.params.id, "client id");
    const isBlocked = Boolean(req.body.is_blocked);

    const updated = await query(
      `UPDATE professional_clients
       SET is_blocked = $3, updated_at = NOW()
       WHERE id = $1 AND professional_profile_id = $2
       RETURNING *`,
      [clientId, profile.id, isBlocked],
    );

    if (!updated.rowCount) {
      return res.status(404).json({ success: false, message: "Client not found.", data: null });
    }

    return res.status(200).json({
      success: true,
      message: isBlocked ? "Client blocked." : "Client unblocked.",
      data: mapClientRow(updated.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update block status.",
      data: { error: error.message },
    });
  }
};

export const deleteProfessionalClient = async (req, res) => {
  try {
    if (req.user.user_type !== "professional") {
      return res.status(403).json({ success: false, message: "Only professionals can delete clients.", data: null });
    }

    const profile = await getProfessionalProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Professional profile not found.", data: null });
    }

    const clientId = parseUuid(req.params.id, "client id");
    const deleted = await query(
      `DELETE FROM professional_clients WHERE id = $1 AND professional_profile_id = $2 RETURNING id`,
      [clientId, profile.id],
    );

    if (!deleted.rowCount) {
      return res.status(404).json({ success: false, message: "Client not found.", data: null });
    }

    return res.status(200).json({
      success: true,
      message: "Client deleted.",
      data: { id: deleted.rows[0].id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete client.",
      data: { error: error.message },
    });
  }
};
