import { query } from "../db/index.js";

const ALLOWED_COLORS = new Set(["teal", "navy", "warning", "mint"]);

const ACTION_TYPE_COLORS = {
  created: "teal",
  updated: "navy",
  deleted: "warning",
  changed_status: "warning",
  logged_in: "mint",
  logged_out: "navy",
  system: "mint",
};

const MODULE_LABELS = {
  professional: "Professional",
  client: "Client",
  authentication: "Authentication",
  review: "Review",
  listing: "Listing",
  system: "System",
  booking: "Booking",
  email: "Email",
  report: "Report",
  access: "Access",
};

const ACTION_LABELS = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  changed_status: "Changed Status",
  logged_in: "Logged In",
  logged_out: "Logged Out",
  system: "System",
};

const initialsFromName = (name, email) => {
  const source = String(name || email || "A").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "AD";
};

export const getRequestIp = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req?.ip || req?.socket?.remoteAddress || null;
};

export const resolveAdminActor = (req, extras = {}) => {
  const user = req?.user;
  const email =
    extras.actorEmail ||
    user?.email ||
    req?.headers?.["x-admin-email"] ||
    process.env.ADMIN_ACTOR_EMAIL ||
    "admin@mollure.dev";
  const name =
    extras.actorName ||
    req?.headers?.["x-admin-name"] ||
    process.env.ADMIN_ACTOR_NAME ||
    (email === "admin@mollure.dev" ? "Admin User" : email.split("@")[0]);

  return {
    actorEmail: String(email).trim().toLowerCase(),
    actorName: String(name).trim(),
    actorUserId: extras.actorUserId || user?.id || null,
  };
};

/**
 * Persist an admin activity row. Failures are logged but do not throw by default
 * so product flows are not blocked by audit write issues.
 */
export const logAdminActivity = async (
  {
    actorEmail,
    actorName,
    actorUserId = null,
    action,
    detail = null,
    color = "teal",
    module = null,
    actionType = null,
    ipAddress = null,
  },
  { throwOnError = false } = {},
) => {
  try {
    if (!action || !actorEmail) {
      throw new Error("action and actorEmail are required to log admin activity.");
    }

    const resolvedColor = ALLOWED_COLORS.has(color)
      ? color
      : ACTION_TYPE_COLORS[actionType] || "teal";

    const result = await query(
      `INSERT INTO admin_activity_logs
         (actor_email, actor_name, actor_user_id, action, detail, color, module, action_type, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, actor_email, actor_name, action, detail, color, module, action_type, ip_address, created_at`,
      [
        actorEmail,
        actorName || null,
        actorUserId,
        action,
        detail,
        resolvedColor,
        module,
        actionType,
        ipAddress,
      ],
    );

    return result.rows[0];
  } catch (error) {
    console.error("[admin-activity] Failed to log activity:", error.message);
    if (throwOnError) throw error;
    return null;
  }
};

export const logAdminActivityFromRequest = async (req, payload = {}) => {
  const actor = resolveAdminActor(req, payload);
  return logAdminActivity({
    ...actor,
    action: payload.action,
    detail: payload.detail ?? null,
    color: payload.color,
    module: payload.module ?? null,
    actionType: payload.actionType ?? null,
    ipAddress: payload.ipAddress ?? getRequestIp(req),
  });
};

const mapActivityRow = (row) => {
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  const name = row.actor_name || row.actor_email;
  const actionType = row.action_type || "system";
  const module = row.module || "system";

  return {
    id: String(row.id),
    date: createdAt.toISOString().slice(0, 10),
    time: createdAt.toISOString().slice(11, 16),
    createdAt: createdAt.toISOString(),
    user: {
      name,
      email: row.actor_email,
      initials: initialsFromName(name, row.actor_email),
    },
    action: actionType,
    actionLabel: ACTION_LABELS[actionType] || row.action,
    module,
    moduleLabel: MODULE_LABELS[module] || module,
    details: row.detail || row.action,
    ipAddress: row.ip_address || "—",
    color: row.color,
    // Dashboard-friendly fields
    admin: name,
    actionTitle: row.action,
    detail: row.detail || "",
    timestamp: createdAt.toISOString(),
  };
};

export const listAdminActivities = async ({
  limit = 50,
  offset = 0,
  search = "",
  actionType = null,
  module = null,
  actorEmail = null,
  from = null,
  to = null,
} = {}) => {
  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    clauses.push(
      `(actor_email ILIKE $${params.length} OR COALESCE(actor_name, '') ILIKE $${params.length} OR action ILIKE $${params.length} OR COALESCE(detail, '') ILIKE $${params.length})`,
    );
  }
  if (actionType && actionType !== "all") {
    params.push(actionType);
    clauses.push(`action_type = $${params.length}`);
  }
  if (module && module !== "all") {
    params.push(module);
    clauses.push(`module = $${params.length}`);
  }
  if (actorEmail && actorEmail !== "all") {
    params.push(actorEmail);
    clauses.push(`actor_email = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`created_at::date >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    clauses.push(`created_at::date <= $${params.length}::date`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM admin_activity_logs ${where}`,
    params,
  );

  params.push(Math.min(Math.max(Number(limit) || 50, 1), 200));
  params.push(Math.max(Number(offset) || 0, 0));

  const result = await query(
    `SELECT id, actor_email, actor_name, action, detail, color, module, action_type, ip_address, created_at
     FROM admin_activity_logs
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );

  return {
    total: countResult.rows[0]?.total || 0,
    items: result.rows.map(mapActivityRow),
  };
};

export const getAdminActivitySummary = async () => {
  const result = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS today,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))::int AS this_week,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS this_month
     FROM admin_activity_logs`,
  );
  const row = result.rows[0] || {};
  return {
    total: row.total || 0,
    today: row.today || 0,
    thisWeek: row.this_week || 0,
    thisMonth: row.this_month || 0,
  };
};
