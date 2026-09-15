import { query } from "../db/index.js";
import {
  getAdminActivitySummary,
  listAdminActivities,
  logAdminActivityFromRequest,
} from "../services/adminActivity.service.js";
import { buildPaginationMeta, parseListPagination } from "../utils/pagination.js";
import { sendCaughtError } from "../utils/httpError.js";

const PRESETS = new Set(["today", "7d", "30d", "year", "custom"]);

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetweenInclusive = (start, end) => {
  const s = new Date(`${start}T12:00:00.000Z`);
  const e = new Date(`${end}T12:00:00.000Z`);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
};

const pctChange = (current, previous) => {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

const formatMoney = (amount) => {
  const value = Number(amount) || 0;
  return `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatCount = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatActivityTimestamp = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
};

export const resolveDashboardRange = (queryParams = {}) => {
  const presetRaw = String(queryParams.preset || queryParams.range || "7d").toLowerCase();
  const preset = PRESETS.has(presetRaw) ? presetRaw : "7d";
  const today = toDateOnly(new Date()) || new Date().toISOString().slice(0, 10);

  let start;
  let end;

  if (preset === "today") {
    start = today;
    end = today;
  } else if (preset === "7d") {
    end = today;
    start = addDays(today, -6);
  } else if (preset === "30d") {
    end = today;
    start = addDays(today, -29);
  } else if (preset === "year") {
    end = today;
    start = `${today.slice(0, 4)}-01-01`;
  } else {
    start = toDateOnly(queryParams.from || queryParams.start) || addDays(today, -13);
    end = toDateOnly(queryParams.to || queryParams.end) || today;
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }
  }

  const length = daysBetweenInclusive(start, end);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(length - 1));

  return { preset, start, end, prevStart, prevEnd, length };
};

const countUsersInRange = async (userType, start, end) => {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM users
     WHERE user_type = $1
       AND created_at::date BETWEEN $2::date AND $3::date`,
    [userType, start, end],
  );
  return result.rows[0]?.count ?? 0;
};

/** Client flow saves fixed BRs as `request` and desired as `project`; treat both as online. */
const ONLINE_BOOKING_TYPES = ["online", "request", "project"];

const countBookingsInRange = async (bookingType, start, end) => {
  const types =
    bookingType === "online" ? ONLINE_BOOKING_TYPES : [bookingType];
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM bookings
     WHERE booking_type = ANY($1::text[])
       AND booking_date BETWEEN $2::date AND $3::date
       AND status <> 'cancelled'`,
    [types, start, end],
  );
  return result.rows[0]?.count ?? 0;
};

const buildKpis = async (range) => {
  const [
    newProfessionals,
    prevProfessionals,
    newIC,
    prevIC,
    newCC,
    prevCC,
    onlineBookings,
    prevOnline,
    offlineBookings,
    prevOffline,
  ] = await Promise.all([
    countUsersInRange("professional", range.start, range.end),
    countUsersInRange("professional", range.prevStart, range.prevEnd),
    countUsersInRange("individual", range.start, range.end),
    countUsersInRange("individual", range.prevStart, range.prevEnd),
    countUsersInRange("company", range.start, range.end),
    countUsersInRange("company", range.prevStart, range.prevEnd),
    countBookingsInRange("online", range.start, range.end),
    countBookingsInRange("online", range.prevStart, range.prevEnd),
    countBookingsInRange("offline", range.start, range.end),
    countBookingsInRange("offline", range.prevStart, range.prevEnd),
  ]);

  const newClients = newIC + newCC;
  const prevClients = prevIC + prevCC;

  return [
    {
      key: "newProfessionals",
      label: "New Professionals",
      value: newProfessionals,
      trend: pctChange(newProfessionals, prevProfessionals),
      icon: "business",
    },
    {
      key: "newClients",
      label: "New Clients",
      value: newClients,
      trend: pctChange(newClients, prevClients),
      icon: "people",
    },
    {
      key: "newIC",
      label: "New Individual Clients (IC)",
      value: newIC,
      trend: pctChange(newIC, prevIC),
      icon: "person",
    },
    {
      key: "newCC",
      label: "New Company Clients (CC)",
      value: newCC,
      trend: pctChange(newCC, prevCC),
      icon: "company",
    },
    {
      key: "onlineBookings",
      label: "Total Online Bookings",
      value: onlineBookings,
      trend: pctChange(onlineBookings, prevOnline),
      icon: "online",
    },
    {
      key: "offlineBookings",
      label: "Total Offline Bookings",
      value: offlineBookings,
      trend: pctChange(offlineBookings, prevOffline),
      icon: "offline",
    },
  ];
};

const buildBookingsChart = async (range) => {
  const { preset, start, end, length } = range;

  if (preset === "year" || length > 60) {
    const result = await query(
      `SELECT TO_CHAR(booking_date, 'Mon') AS label,
              EXTRACT(MONTH FROM booking_date)::int AS month_num,
              COUNT(*) FILTER (WHERE booking_type = ANY($3::text[]))::int AS online,
              COUNT(*) FILTER (WHERE booking_type = 'offline')::int AS offline
       FROM bookings
       WHERE booking_date BETWEEN $1::date AND $2::date
         AND status <> 'cancelled'
         AND booking_type IN ('online', 'offline', 'request', 'project')
       GROUP BY 1, 2
       ORDER BY month_num`,
      [start, end, ONLINE_BOOKING_TYPES],
    );
    return result.rows.map((row) => ({
      date: row.label,
      online: row.online,
      offline: row.offline,
    }));
  }

  if (preset === "30d" || (preset === "custom" && length > 14)) {
    const result = await query(
      `SELECT CONCAT('Week ', GREATEST(1, CEIL((booking_date - $1::date + 1) / 7.0)::int)) AS label,
              GREATEST(1, CEIL((booking_date - $1::date + 1) / 7.0)::int) AS week_num,
              COUNT(*) FILTER (WHERE booking_type = ANY($3::text[]))::int AS online,
              COUNT(*) FILTER (WHERE booking_type = 'offline')::int AS offline
       FROM bookings
       WHERE booking_date BETWEEN $1::date AND $2::date
         AND status <> 'cancelled'
         AND booking_type IN ('online', 'offline', 'request', 'project')
       GROUP BY 1, 2
       ORDER BY week_num`,
      [start, end, ONLINE_BOOKING_TYPES],
    );
    return result.rows.map((row) => ({
      date: row.label,
      online: row.online,
      offline: row.offline,
    }));
  }

  const result = await query(
    `SELECT booking_date::text AS day,
            COUNT(*) FILTER (WHERE booking_type = ANY($3::text[]))::int AS online,
            COUNT(*) FILTER (WHERE booking_type = 'offline')::int AS offline
     FROM bookings
     WHERE booking_date BETWEEN $1::date AND $2::date
       AND status <> 'cancelled'
       AND booking_type IN ('online', 'offline', 'request', 'project')
     GROUP BY booking_date
     ORDER BY booking_date`,
    [start, end, ONLINE_BOOKING_TYPES],
  );

  const byDay = new Map(result.rows.map((row) => [row.day, row]));
  const points = [];
  for (let i = 0; i < length; i += 1) {
    const day = addDays(start, i);
    const row = byDay.get(day);
    const labelDate = new Date(`${day}T12:00:00.000Z`);
    points.push({
      date: labelDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      online: row?.online ?? 0,
      offline: row?.offline ?? 0,
    });
  }
  return points;
};

const buildTopProfessionals = async (range, limit = 4) => {
  const result = await query(
    `SELECT bs.id::text AS id,
            COALESCE(NULLIF(bs.business_name, ''), NULLIF(pp.legal_name, ''), 'Professional') AS name,
            COALESCE(
              NULLIF(bs.fixed_location_municipality, ''),
              NULLIF(pp.municipality, ''),
              '—'
            ) AS city,
            COALESCE(
              NULLIF(bs.fixed_location_province, ''),
              NULLIF(pp.province, ''),
              '—'
            ) AS province,
            COUNT(*)::int AS bookings
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE b.booking_type = ANY($3::text[])
       AND b.status <> 'cancelled'
       AND b.booking_date BETWEEN $1::date AND $2::date
     GROUP BY bs.id, bs.business_name, pp.legal_name, bs.fixed_location_municipality,
              pp.municipality, bs.fixed_location_province, pp.province
     ORDER BY bookings DESC, name ASC
     LIMIT $4`,
    [range.start, range.end, ONLINE_BOOKING_TYPES, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    province: row.province,
    bookings: row.bookings,
  }));
};

const buildRecentActivity = async (limit = 3) => {
  const result = await query(
    `SELECT id::text AS id,
            COALESCE(NULLIF(actor_name, ''), actor_email) AS admin,
            action,
            COALESCE(detail, '') AS detail,
            color,
            created_at
     FROM admin_activity_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    admin: row.admin,
    action: row.action,
    detail: row.detail,
    color: row.color,
    timestamp: formatActivityTimestamp(row.created_at),
  }));
};

const buildSummaryOverview = async () => {
  const professionals = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (
         WHERE COALESCE(NULLIF(bs.project, ''), '') = ''
           AND COALESCE(bs.location_mode, pp.service_location_mode, 'fixed') IN ('fixed', 'both')
       )::int AS fl,
       COUNT(*) FILTER (
         WHERE COALESCE(NULLIF(bs.project, ''), '') = ''
           AND COALESCE(bs.location_mode, pp.service_location_mode, 'fixed') = 'desired'
       )::int AS dl_normal,
       COUNT(*) FILTER (
         WHERE COALESCE(NULLIF(bs.project, ''), '') <> ''
       )::int AS dl_project
     FROM professional_profiles pp
     LEFT JOIN business_setups bs ON bs.professional_profile_id = pp.id`,
  );

  const bookings = await query(
    `SELECT
       COUNT(*) FILTER (WHERE booking_type IN ('online', 'request', 'project'))::int AS online_total,
       COUNT(*) FILTER (
         WHERE booking_type IN ('online', 'request')
           AND COALESCE(location_type, 'fixed') = 'fixed'
       )::int AS online_fl,
       COUNT(*) FILTER (
         WHERE booking_type IN ('online', 'request')
           AND COALESCE(location_type, 'fixed') = 'desired'
       )::int AS online_dl_normal,
       COUNT(*) FILTER (WHERE booking_type = 'project')::int AS online_dl_project,
       COUNT(*) FILTER (WHERE booking_type = 'offline')::int AS offline_total,
       COUNT(*) FILTER (
         WHERE booking_type = 'offline' AND COALESCE(location_type, 'fixed') = 'fixed'
       )::int AS offline_fl,
       COUNT(*) FILTER (
         WHERE booking_type = 'offline'
           AND COALESCE(location_type, 'fixed') = 'desired'
       )::int AS offline_dl_normal,
       0::int AS offline_dl_project
     FROM bookings
     WHERE status <> 'cancelled'`,
  );

  const transactions = await query(
    `SELECT
       COALESCE(SUM(net_amount) FILTER (WHERE entry_type = 'onlineBooking'), 0)::numeric AS online_total,
       COALESCE(SUM(net_amount) FILTER (
         WHERE entry_type = 'onlineBooking' AND method_title ILIKE '%direct%'
       ), 0)::numeric AS online_direct,
       COALESCE(SUM(net_amount) FILTER (
         WHERE entry_type = 'onlineBooking' AND method_title NOT ILIKE '%direct%'
       ), 0)::numeric AS online_nondirect,
       COALESCE(SUM(net_amount) FILTER (WHERE entry_type = 'offlineBooking'), 0)::numeric AS offline_total,
       COALESCE(SUM(net_amount) FILTER (
         WHERE entry_type = 'offlineBooking' AND method_title ILIKE '%direct%'
       ), 0)::numeric AS offline_direct,
       COALESCE(SUM(net_amount) FILTER (
         WHERE entry_type = 'offlineBooking' AND method_title NOT ILIKE '%direct%'
       ), 0)::numeric AS offline_nondirect
     FROM finance_transactions
     WHERE LOWER(COALESCE(status, '')) NOT IN ('void', 'cancelled', 'refunded')`,
  );

  const pro = professionals.rows[0] || {};
  const book = bookings.rows[0] || {};
  const tx = transactions.rows[0] || {};

  // Project bookings counted under online DL (Project); keep offline DL project at 0 unless needed
  const onlineDlProject = Number(book.online_dl_project) || 0;

  return [
    {
      label: "Total Professionals",
      value: formatCount(pro.total),
      breakdown: `FL: ${formatCount(pro.fl)} · DL (Normal): ${formatCount(pro.dl_normal)} · DL (Project): ${formatCount(pro.dl_project)}`,
    },
    {
      label: "Total Online Bookings",
      value: formatCount(book.online_total),
      breakdown: `FL: ${formatCount(book.online_fl)} · DL (Normal): ${formatCount(book.online_dl_normal)} · DL (Project): ${formatCount(onlineDlProject)}`,
    },
    {
      label: "Total Offline Bookings",
      value: formatCount(book.offline_total),
      breakdown: `FL: ${formatCount(book.offline_fl)} · DL (Normal): ${formatCount(book.offline_dl_normal)} · DL (Project): ${formatCount(book.offline_dl_project)}`,
    },
    {
      label: "Total Online Transactions",
      value: formatMoney(tx.online_total),
      breakdown: `Direct: ${formatMoney(tx.online_direct)} · Non-direct: ${formatMoney(tx.online_nondirect)}`,
    },
    {
      label: "Total Offline Transactions",
      value: formatMoney(tx.offline_total),
      breakdown: `Direct: ${formatMoney(tx.offline_direct)} · Non-direct: ${formatMoney(tx.offline_nondirect)}`,
    },
  ];
};

const buildSystemStatus = async () => {
  let database = "Operational";
  try {
    await query("SELECT 1");
  } catch {
    database = "Degraded";
  }

  const emailReady = Boolean(process.env.SMTP_HOST && (process.env.SMTP_USER || process.env.RESEND_API_KEY));
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

  return [
    { label: "Website", status: "Operational" },
    { label: "Database", status: database },
    { label: "Email Service", status: emailReady ? "Operational" : "Not configured" },
    { label: "Stripe", status: stripeReady ? "Operational" : "Not configured" },
  ];
};

export const getAdminDashboard = async (req, res) => {
  try {
    const range = resolveDashboardRange(req.query);

    const [kpis, bookingsChart, topProfessionals, recentActivity, summaryOverview, systemStatus] =
      await Promise.all([
        buildKpis(range),
        buildBookingsChart(range),
        buildTopProfessionals(range),
        buildRecentActivity(3),
        buildSummaryOverview(),
        buildSystemStatus(),
      ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data loaded.",
      data: {
        range: {
          preset: range.preset,
          start: range.start,
          end: range.end,
          previousStart: range.prevStart,
          previousEnd: range.prevEnd,
        },
        kpis,
        bookingsChart,
        topProfessionals,
        recentActivity,
        summaryOverview,
        systemStatus,
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to load admin dashboard." });
  }
};

export const getAdminActivityLog = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query, {
      defaultLimit: 50,
      maxLimit: 200,
      force: true,
    });
    const [list, summary] = await Promise.all([
      listAdminActivities({
        limit: pagination.limit,
        offset: pagination.offset,
        search: req.query.search || "",
        actionType: req.query.action || null,
        module: req.query.module || null,
        actorEmail: req.query.user || null,
        from: req.query.from || null,
        to: req.query.to || null,
      }),
      getAdminActivitySummary(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin activity log loaded.",
      data: {
        summary,
        total: list.total,
        items: list.items,
      },
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: list.total ?? 0,
        paginate: true,
      }),
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to load admin activity log." });
  }
};

export const createAdminActivityLog = async (req, res) => {
  try {
    const {
      action,
      detail,
      color,
      module,
      action_type: actionType,
      actor_email: actorEmail,
      actor_name: actorName,
    } = req.body || {};

    if (!action || !String(action).trim()) {
      return res.status(400).json({
        success: false,
        message: "action is required.",
        data: null,
      });
    }

    const row = await logAdminActivityFromRequest(req, {
      action: String(action).trim(),
      detail: detail ? String(detail).trim() : null,
      color,
      module: module || null,
      actionType: actionType || null,
      actorEmail: actorEmail || undefined,
      actorName: actorName || undefined,
    });

    if (!row) {
      return res.status(500).json({
        success: false,
        message: "Failed to save admin activity.",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Admin activity recorded.",
      data: {
        id: row.id,
        action: row.action,
        detail: row.detail,
        color: row.color,
        created_at: row.created_at,
      },
    });
  } catch (error) {
    return sendCaughtError(res, error, { fallbackMessage: "Failed to record admin activity." });
  }
};
