import bcrypt from "bcrypt";
import { query } from "../db/index.js";
import { LISTING_RANKING_WEIGHTS } from "./listing-ranking.service.js";
import { replyToContactMessage } from "./contact.service.js";

const CATEGORY_FALLBACK = "Hair & Beauty";
const SALT_ROUNDS = 10;

const initialsFrom = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const toDateOnly = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const toTimeLabel = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const mapServiceMode = (row) => {
  const mode = String(row.service_location_mode || "").toLowerCase();
  if (mode.includes("desired") || mode === "dl") {
    return row.has_project ? "DL Project" : "DL";
  }
  return "FL";
};

const mapAccountStatus = (row) => {
  if (row.is_active === false) return "disabled";
  if (!row.has_setup) return "awaiting_setup";
  if (row.setup_active === false) return "suspended";
  return "active";
};

const mapValidation = (value) => {
  const v = String(value || "pending").toLowerCase();
  if (v === "validated" || v === "not_validated" || v === "pending") return v;
  return "pending";
};

export async function listAdminProfessionals() {
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.is_active,
       u.created_at,
       COALESCE(
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT_WS(' ', pp.contact_first_name, pp.contact_last_name)), ''),
         split_part(u.email, '@', 1)
       ) AS brand_name,
       COALESCE(pp.legal_name, '') AS legal_name,
       COALESCE(pp.phone, '') AS phone,
       COALESCE(pp.validation_status, 'pending') AS validation_status,
       pp.service_location_mode,
       COALESCE(bs.fixed_location_province, pp.province, '') AS province,
       bs.id AS setup_id,
       bs.is_active AS setup_active,
       (bs.id IS NOT NULL) AS has_setup,
       EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.business_setup_id = bs.id AND b.booking_type = 'project'
       ) AS has_project,
       COALESCE((
         SELECT COUNT(*)::int FROM bookings b
         WHERE b.business_setup_id = bs.id
           AND COALESCE(b.booking_type, 'online') IN ('online', 'request', 'project')
       ), 0) AS online_bookings,
       COALESCE((
         SELECT COUNT(*)::int FROM bookings b
         WHERE b.business_setup_id = bs.id AND COALESCE(b.booking_type, '') = 'offline'
       ), 0) AS offline_bookings,
       COALESCE((
         SELECT COUNT(*)::int FROM finance_transactions ft
         WHERE ft.professional_profile_id = pp.id
           AND ft.entry_type = 'onlineBooking'
           AND LOWER(COALESCE(ft.status, '')) NOT IN ('void', 'cancelled', 'refunded')
       ), 0) AS online_transactions,
       COALESCE((
         SELECT COUNT(*)::int FROM finance_transactions ft
         WHERE ft.professional_profile_id = pp.id
           AND ft.entry_type IN ('offlineBooking', 'manualEntry')
           AND LOWER(COALESCE(ft.status, '')) NOT IN ('void', 'cancelled', 'refunded')
       ), 0) AS offline_transactions,
       COALESCE((
         SELECT ROUND(AVG(r.rating)::numeric, 1)
         FROM reviews r
         WHERE r.business_setup_id = bs.id
           AND r.submitted_at IS NOT NULL
           AND COALESCE(r.is_hidden, FALSE) = FALSE
           AND r.rating IS NOT NULL
       ), 0) AS avg_rating,
       COALESCE((
         SELECT COUNT(*)::int FROM reviews r
         WHERE r.business_setup_id = bs.id
           AND r.submitted_at IS NOT NULL
           AND COALESCE(r.is_hidden, FALSE) = FALSE
       ), 0) AS total_reviews,
       COALESCE((
         SELECT MAX(b.booking_date)::text FROM bookings b WHERE b.business_setup_id = bs.id
       ), '') AS last_booking,
       COALESCE(pp.business_type, '') AS business_type
     FROM users u
     INNER JOIN professional_profiles pp ON pp.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT *
       FROM business_setups bs2
       WHERE bs2.professional_profile_id = pp.id
       ORDER BY bs2.updated_at DESC NULLS LAST, bs2.created_at DESC
       LIMIT 1
     ) bs ON TRUE
     WHERE u.user_type = 'professional'
     ORDER BY u.created_at DESC`,
  );

  const items = result.rows.map((row, index) => {
    const primaryCategory = row.business_type
      ? String(row.business_type).replace(/\b\w/g, (c) => c.toUpperCase())
      : CATEGORY_FALLBACK;
    return {
      id: String(row.id),
      registrationDate: toDateOnly(row.created_at),
      brandName: row.brand_name || "Professional",
      legalName: row.legal_name || row.brand_name || "",
      email: row.email,
      phone: row.phone || "—",
      serviceMode: mapServiceMode(row),
      validationStatus: mapValidation(row.validation_status),
      accountStatus: mapAccountStatus(row),
      primaryCategory,
      categories: [primaryCategory],
      onlineBookings: Number(row.online_bookings) || 0,
      offlineBookings: Number(row.offline_bookings) || 0,
      onlineTransactions: Number(row.online_transactions) || 0,
      offlineTransactions: Number(row.offline_transactions) || 0,
      avgRating: Number(row.avg_rating) || 0,
      totalReviews: Number(row.total_reviews) || 0,
      ranking: index + 1,
      lastBooking: row.last_booking || "",
      province: row.province || "",
    };
  });

  const summary = {
    total: items.length,
    verified: items.filter((i) => i.validationStatus === "validated").length,
    pending: items.filter((i) => i.validationStatus === "pending").length,
    rejected: items.filter((i) => i.validationStatus === "not_validated").length,
    inactive: items.filter((i) => i.accountStatus === "disabled" || i.accountStatus === "suspended").length,
    growthTrend: 0,
  };

  return { items, summary };
}

export async function updateAdminProfessional(userId, patch = {}) {
  const existing = await query(
    `SELECT u.id, u.is_active, pp.validation_status
     FROM users u
     INNER JOIN professional_profiles pp ON pp.user_id = u.id
     WHERE u.id = $1 AND u.user_type = 'professional'`,
    [userId],
  );
  if (!existing.rows.length) return null;

  if (patch.validationStatus) {
    await query(
      `UPDATE professional_profiles
       SET validation_status = $2
       WHERE user_id = $1`,
      [userId, mapValidation(patch.validationStatus)],
    );
  }

  if (patch.accountStatus === "disabled") {
    await query(`UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [userId]);
  } else if (patch.accountStatus === "active" || patch.accountStatus === "awaiting_setup") {
    await query(`UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1`, [userId]);
    if (patch.accountStatus === "active") {
      await query(
        `UPDATE business_setups bs
         SET is_active = TRUE, updated_at = NOW()
         FROM professional_profiles pp
         WHERE bs.professional_profile_id = pp.id AND pp.user_id = $1`,
        [userId],
      );
    }
  } else if (patch.accountStatus === "suspended") {
    await query(
      `UPDATE business_setups bs
       SET is_active = FALSE, updated_at = NOW()
       FROM professional_profiles pp
       WHERE bs.professional_profile_id = pp.id AND pp.user_id = $1`,
      [userId],
    );
  }

  const { items } = await listAdminProfessionals();
  return items.find((item) => item.id === String(userId)) || null;
}

export async function listAdminClients() {
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.is_active,
       u.created_at,
       u.user_type,
       CASE
         WHEN u.user_type = 'company' THEN COALESCE(
           NULLIF(TRIM(cp.legal_name), ''),
           NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
           split_part(u.email, '@', 1)
         )
         ELSE COALESCE(
           NULLIF(TRIM(ip.display_name), ''),
           NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), ''),
           split_part(u.email, '@', 1)
         )
       END AS name,
       CASE
         WHEN u.user_type = 'company' THEN COALESCE(cp.phone, '')
         ELSE COALESCE(ip.phone, '')
       END AS phone,
       CASE WHEN u.user_type = 'company' THEN NULL ELSE ip.date_of_birth END AS birthdate,
       CASE WHEN u.user_type = 'company' THEN NULL ELSE ip.gender END AS gender,
       CASE
         WHEN u.user_type = 'company' THEN NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), '')
         ELSE NULL
       END AS contact_person,
       CASE WHEN u.user_type = 'company' THEN cp.logo ELSE ip.profile_picture END AS avatar_url,
       u.admin_notes AS admin_note,
       u.deleted_at,
       COALESCE((
         SELECT MAX(b.booking_date)
         FROM bookings b
         WHERE b.customer_id = u.id
       ), NULL) AS last_booking_date,
       COALESCE((
         SELECT COUNT(*)::int FROM bookings b WHERE b.customer_id = u.id
       ), 0) AS booking_count
     FROM users u
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE u.user_type IN ('individual', 'company')
       AND u.deleted_at IS NULL
     ORDER BY u.created_at DESC`,
  );

  const items = result.rows.map((row) => {
    const note = row.admin_note ? String(row.admin_note) : "";
    return {
      id: String(row.id),
      registrationDate: toDateOnly(row.created_at),
      registrationTime: toTimeLabel(row.created_at),
      name: row.name || "Client",
      email: row.email,
      phone: row.phone || "—",
      type: row.user_type === "company" ? "CC" : "IC",
      lastBookingDate: row.last_booking_date ? toDateOnly(row.last_booking_date) : "",
      lastBookingTime: "",
      accountStatus: row.is_active === false ? "disabled" : "active",
      hasNotes: Boolean(note.trim()),
      note: note || undefined,
      avatarUrl: row.avatar_url || undefined,
      birthdate: row.birthdate ? toDateOnly(row.birthdate) : undefined,
      gender: row.gender || undefined,
      contactPerson: row.contact_person || undefined,
      _bookingCount: Number(row.booking_count) || 0,
    };
  });

  const totalIC = items.filter((i) => i.type === "IC").length;
  const totalCC = items.filter((i) => i.type === "CC").length;
  const totalBookings = items.reduce((sum, i) => sum + (i._bookingCount || 0), 0);

  return {
    items: items.map(({ _bookingCount, ...rest }) => rest),
    summary: {
      totalIC,
      totalCC,
      totalClients: items.length,
      totalBookings,
    },
  };
}

export async function updateAdminClient(userId, patch = {}) {
  const existing = await query(
    `SELECT id, is_active FROM users WHERE id = $1 AND user_type IN ('individual', 'company')`,
    [userId],
  );
  if (!existing.rows.length) return null;

  if (patch.accountStatus === "disabled") {
    await query(`UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [userId]);
  } else if (patch.accountStatus === "active") {
    await query(`UPDATE users SET is_active = TRUE, deleted_at = NULL, updated_at = NOW() WHERE id = $1`, [userId]);
  }

  if (typeof patch.note === "string") {
    await query(
      `UPDATE users
       SET admin_notes = $2, updated_at = NOW()
       WHERE id = $1 AND user_type IN ('individual', 'company')`,
      [userId, patch.note],
    );
  }

  if (patch.delete === true || patch.accountStatus === "deleted") {
    await query(
      `UPDATE users
       SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_type IN ('individual', 'company')`,
      [userId],
    );
    return { deleted: true, id: String(userId) };
  }

  const { items } = await listAdminClients();
  return items.find((item) => item.id === String(userId)) || null;
}

export async function listAdminReviews() {
  const [reviewsResult, keywordsResult, rangesResult] = await Promise.all([
    query(
      `SELECT
         r.id,
         r.rating,
         r.body,
         r.submitted_at,
         r.created_at,
         COALESCE(
           NULLIF(TRIM(pp.legal_name), ''),
           NULLIF(TRIM(CONCAT_WS(' ', pp.contact_first_name, pp.contact_last_name)), ''),
           'Professional'
         ) AS professional,
         COALESCE(NULLIF(TRIM(pp.business_type), ''), 'Hair & Beauty') AS professional_category,
         COALESCE(
           r.reviewer_display_name,
           NULLIF(TRIM(ip.display_name), ''),
           NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), ''),
           NULLIF(TRIM(cp.legal_name), ''),
           cu.email,
           'Client'
         ) AS client,
         CASE WHEN cu.user_type = 'company' THEN 'Company Client' ELSE 'Individual Client' END AS client_type
       FROM reviews r
       INNER JOIN business_setups bs ON bs.id = r.business_setup_id
       INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
       INNER JOIN users cu ON cu.id = r.client_user_id
       LEFT JOIN individual_profiles ip ON ip.user_id = cu.id
       LEFT JOIN company_profiles cp ON cp.user_id = cu.id
       WHERE r.submitted_at IS NOT NULL
         AND COALESCE(r.is_hidden, FALSE) = FALSE
       ORDER BY r.submitted_at DESC`,
    ),
    query(`SELECT keyword FROM admin_flagged_keywords ORDER BY keyword ASC`),
    query(`SELECT id, label, min_rating, max_rating FROM admin_rating_category_settings ORDER BY min_rating DESC`),
  ]);

  const keywords = keywordsResult.rows.map((row) => String(row.keyword).toLowerCase());
  const keywordSet = keywords;

  const flagged = reviewsResult.rows
    .map((row) => {
      const text = row.body || "";
      const lower = text.toLowerCase();
      const matched = keywordSet.some((kw) => lower.includes(kw));
      const lowRating = Number(row.rating) <= 2;
      if (!matched && !lowRating) return null;
      return {
        id: String(row.id),
        professional: row.professional,
        professionalCategory: row.professional_category || CATEGORY_FALLBACK,
        professionalInitials: initialsFrom(row.professional),
        client: row.client,
        clientType: row.client_type,
        clientInitials: initialsFrom(row.client),
        rating: Number(row.rating) || 0,
        text,
        date: toDateOnly(row.submitted_at || row.created_at),
        time: toTimeLabel(row.submitted_at || row.created_at),
      };
    })
    .filter(Boolean);

  const ranges = {};
  for (const row of rangesResult.rows) {
    ranges[row.id] = {
      label: row.label,
      min: Number(row.min_rating),
      max: Number(row.max_rating),
    };
  }

  return { items: flagged, keywords, ranges };
}

export async function hideAdminReview(reviewId) {
  const result = await query(
    `UPDATE reviews SET is_hidden = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [reviewId],
  );
  return result.rows[0] || null;
}

export async function addAdminKeyword(keyword) {
  const normalized = String(keyword || "").trim().toLowerCase();
  if (!normalized) return null;
  const result = await query(
    `INSERT INTO admin_flagged_keywords (keyword)
     VALUES ($1)
     ON CONFLICT (keyword) DO UPDATE SET keyword = EXCLUDED.keyword
     RETURNING keyword`,
    [normalized],
  );
  return result.rows[0]?.keyword || normalized;
}

export async function removeAdminKeyword(keyword) {
  const normalized = String(keyword || "").trim().toLowerCase();
  await query(`DELETE FROM admin_flagged_keywords WHERE keyword = $1`, [normalized]);
  return { deleted: true, keyword: normalized };
}

export async function updateAdminRatingRanges(ranges = {}) {
  for (const [id, value] of Object.entries(ranges)) {
    if (!value || typeof value !== "object") continue;
    await query(
      `UPDATE admin_rating_category_settings
       SET label = COALESCE($2, label),
           min_rating = COALESCE($3, min_rating),
           max_rating = COALESCE($4, max_rating),
           updated_at = NOW()
       WHERE id = $1`,
      [id, value.label ?? null, value.min ?? null, value.max ?? null],
    );
  }
  const { ranges: next } = await listAdminReviews();
  return next;
}

export async function listAdminReports() {
  const result = await query(
    `SELECT * FROM platform_reports ORDER BY created_at DESC`,
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    reportId: row.report_code,
    reporter: {
      name: row.reporter_name,
      email: row.reporter_email,
      phone: row.reporter_phone,
      initials: initialsFrom(row.reporter_name),
      type: row.reporter_type,
    },
    reported: {
      name: row.reported_name,
      email: row.reported_email,
      phone: row.reported_phone,
      initials: initialsFrom(row.reported_name),
      type: row.reported_type,
    },
    reasonCategory: row.reason_category,
    reasonDescription: row.reason_description,
    additionalDetails: row.additional_details,
    date: toDateOnly(row.created_at),
    time: toTimeLabel(row.created_at),
    status: row.status === "viewed" ? "viewed" : "new",
  }));
}

export async function updateAdminReport(reportId, patch = {}) {
  if (patch.delete === true) {
    await query(`DELETE FROM platform_reports WHERE id = $1`, [reportId]);
    return { deleted: true, id: String(reportId) };
  }
  if (patch.status) {
    await query(
      `UPDATE platform_reports SET status = $2, updated_at = NOW() WHERE id = $1`,
      [reportId, patch.status === "viewed" ? "viewed" : "new"],
    );
  }
  const items = await listAdminReports();
  return items.find((item) => item.id === String(reportId)) || null;
}

export async function listAdminContactMessages() {
  const result = await query(
    `SELECT id, name, email, subject, message, status, created_at
     FROM contact_messages
     ORDER BY created_at DESC`,
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    date: toDateOnly(row.created_at),
    status: row.status === "open" ? "new" : "replied",
    body: row.message,
  }));
}

export async function replyAdminContactMessage(messageId, replyMessage) {
  return replyToContactMessage(messageId, replyMessage);
}

export async function deleteAdminContactMessage(messageId) {
  const result = await query(
    `DELETE FROM contact_messages WHERE id = $1 RETURNING id`,
    [messageId],
  );
  return result.rows[0] || null;
}

async function resolveRoleId(roleSlugOrId) {
  const value = String(roleSlugOrId || "super_admin").trim();
  const bySlug = await query(`SELECT id, slug FROM admin_roles WHERE slug = $1 LIMIT 1`, [value]);
  if (bySlug.rows[0]) return bySlug.rows[0];
  const byId = await query(`SELECT id, slug FROM admin_roles WHERE id::text = $1 LIMIT 1`, [value]);
  return byId.rows[0] || null;
}

export async function listAdminUsers() {
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.is_active,
       COALESCE(u.display_name, split_part(u.email, '@', 1)) AS name,
       COALESCE(r.slug, 'super_admin') AS role
     FROM users u
     LEFT JOIN admin_roles r ON r.id = u.admin_role_id
     WHERE u.user_type = 'admin'
     ORDER BY u.created_at ASC`,
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.is_active === false ? "disabled" : "active",
  }));
}

export async function createAdminUser({ name, email, role, status, password }) {
  const hash = await bcrypt.hash(password || "ChangeMe123!", SALT_ROUNDS);
  const roleRow = await resolveRoleId(role || "super_admin");
  const result = await query(
    `INSERT INTO users (email, password_hash, user_type, is_email_verified, is_active, admin_role_id, display_name)
     VALUES ($1, $2, 'admin', TRUE, $3, $4, $5)
     RETURNING id, email, is_active, display_name`,
    [email.trim().toLowerCase(), hash, status !== "disabled", roleRow?.id || null, name.trim()],
  );
  const row = result.rows[0];
  return {
    id: String(row.id),
    name: row.display_name || name,
    email: row.email,
    role: roleRow?.slug || role || "super_admin",
    status: row.is_active === false ? "disabled" : "active",
  };
}

export async function updateAdminUser(userId, patch = {}) {
  const fields = [];
  const values = [];
  let idx = 1;
  let roleSlug = null;

  if (typeof patch.name === "string") {
    fields.push(`display_name = $${idx++}`);
    values.push(patch.name.trim());
  }
  if (typeof patch.email === "string") {
    fields.push(`email = $${idx++}`);
    values.push(patch.email.trim().toLowerCase());
  }
  if (typeof patch.role === "string") {
    const roleRow = await resolveRoleId(patch.role);
    fields.push(`admin_role_id = $${idx++}`);
    values.push(roleRow?.id || null);
    roleSlug = roleRow?.slug || patch.role;
  }
  if (patch.status === "disabled") {
    fields.push(`is_active = FALSE`);
  } else if (patch.status === "active") {
    fields.push(`is_active = TRUE`);
  }

  if (!fields.length) {
    const users = await listAdminUsers();
    return users.find((u) => u.id === String(userId)) || null;
  }

  values.push(userId);
  await query(
    `UPDATE users SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${idx} AND user_type = 'admin'`,
    values,
  );

  const users = await listAdminUsers();
  const updated = users.find((u) => u.id === String(userId)) || null;
  if (updated && roleSlug) updated.role = roleSlug;
  return updated;
}

export async function deleteAdminUser(userId) {
  const result = await query(
    `DELETE FROM users WHERE id = $1 AND user_type = 'admin' RETURNING id`,
    [userId],
  );
  return result.rows[0] || null;
}

export async function listAdminRoles() {
  const [rolesResult, countsResult] = await Promise.all([
    query(
      `SELECT id, slug, name, description, kind, icon, permissions
       FROM admin_roles
       ORDER BY created_at ASC`,
    ),
    query(
      `SELECT COALESCE(r.slug, 'super_admin') AS role_slug, COUNT(*)::int AS count
       FROM users u
       LEFT JOIN admin_roles r ON r.id = u.admin_role_id
       WHERE u.user_type = 'admin'
       GROUP BY COALESCE(r.slug, 'super_admin')`,
    ),
  ]);

  const counts = Object.fromEntries(
    countsResult.rows.map((row) => [row.role_slug, Number(row.count) || 0]),
  );

  return rolesResult.rows.map((row) => ({
    id: row.slug || String(row.id),
    name: row.name,
    description: row.description || "",
    kind: row.kind === "system" ? "system" : "custom",
    icon: row.icon || "content",
    adminCount: counts[row.slug] || 0,
    permissions: row.permissions || {},
  }));
}

export async function upsertAdminRole(role) {
  const slug = String(role.id || role.slug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!slug) return null;

  await query(
    `INSERT INTO admin_roles (slug, name, description, kind, icon, permissions, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
     ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           permissions = EXCLUDED.permissions,
           updated_at = NOW()`,
    [
      slug,
      role.name,
      role.description || "",
      role.kind === "system" ? "system" : "custom",
      role.icon || "content",
      JSON.stringify(role.permissions || {}),
    ],
  );
  const roles = await listAdminRoles();
  return roles.find((item) => item.id === slug) || null;
}

export async function deleteAdminRole(roleId) {
  await query(`DELETE FROM admin_roles WHERE slug = $1 AND kind = 'custom'`, [roleId]);
  return { deleted: true, id: roleId };
}

export function getListingRankingFactors() {
  const impactFor = (weight) => {
    if (weight >= 0.2) return "high";
    if (weight >= 0.1) return "medium";
    return "low";
  };

  const labels = {
    rating: {
      id: "avgRating",
      label: "Customer rating",
      description: "Average star rating from verified client reviews",
    },
    reviewCount: {
      id: "totalReviews",
      label: "Number of reviews",
      description: "Count of published reviews from clients",
    },
    totalSales: {
      id: "totalSales",
      label: "Total amount of sales",
      description: "Total net sales across all booking and manual entries",
    },
    onlineSales: {
      id: "onlineSales",
      label: "Total amount of sales (online)",
      description: "Net sales from completed online booking transactions",
    },
    onlineTransactionCount: {
      id: "onlineTransaction",
      label: "Number of online transactions",
      description: "Count of completed online payment transactions",
    },
    completedOnlineBookings: {
      id: "onlineBooking",
      label: "Number of completed online bookings",
      description: "Count of completed online, request, and project bookings",
    },
  };

  return Object.entries(LISTING_RANKING_WEIGHTS).map(([key, weight]) => ({
    id: labels[key]?.id || key,
    label: labels[key]?.label || key,
    description: labels[key]?.description || "",
    weight: Math.round(weight * 100),
    impact: impactFor(weight),
  }));
}
