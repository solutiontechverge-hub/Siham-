import { query } from "../db/index.js";
import { MESSAGE_RETENTION_INTERVAL } from "./messaging.constants.js";
import { mapDraftProfessionalThread, mapMessageRow, mapThreadRow } from "./messaging.mapper.js";

const THREAD_SELECT = `
  SELECT
    t.*,
    cu.email AS client_email,
    pu.email AS professional_email,
    COALESCE(
      NULLIF(TRIM(ip.display_name), ''),
      NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
      NULLIF(TRIM(cp.legal_name), ''),
      NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
      t.peer_display_name
    ) AS client_display_name,
    COALESCE(
      NULLIF(TRIM(bs.business_name), ''),
      NULLIF(TRIM(bs.salon_name), ''),
      NULLIF(TRIM(pp.legal_name), ''),
      NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
      t.peer_display_name
    ) AS professional_display_name,
    ip.user_id::text AS client_profile_id,
    pp.id::text AS professional_profile_id,
    bs.id::text AS business_setup_id,
    lm.body AS last_message_preview,
    lm.created_at AS last_message_at,
    lm.sender_role AS last_message_sender_role,
    lm.sender_display_name AS last_message_sender_name,
    lb.linked_booking_id,
    lb.linked_booking_code,
    lb.linked_booking_status
  FROM messaging_threads t
  JOIN users cu ON cu.id = t.client_user_id
  JOIN users pu ON pu.id = t.professional_user_id
  LEFT JOIN individual_profiles ip ON ip.user_id = t.client_user_id
  LEFT JOIN company_profiles cp ON cp.user_id = t.client_user_id
  LEFT JOIN professional_profiles pp ON pp.user_id = t.professional_user_id
  LEFT JOIN LATERAL (
    SELECT id, business_name, salon_name
    FROM business_setups
    WHERE professional_profile_id = pp.id AND is_active = true
    ORDER BY
      CASE
        WHEN t.peer_profile_id IS NOT NULL
          AND id::text = t.peer_profile_id::text THEN 0
        ELSE 1
      END,
      id ASC
    LIMIT 1
  ) bs ON true
  LEFT JOIN LATERAL (
    SELECT
      m.body,
      m.created_at,
      m.sender_role,
      COALESCE(
        NULLIF(TRIM(ip.display_name), ''),
        NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
        NULLIF(TRIM(cp.legal_name), ''),
        NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
        NULLIF(TRIM(pp.legal_name), ''),
        NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
        u.email
      ) AS sender_display_name
    FROM messaging_messages m
    JOIN users u ON u.id = m.sender_user_id
    LEFT JOIN individual_profiles ip ON ip.user_id = m.sender_user_id
    LEFT JOIN company_profiles cp ON cp.user_id = m.sender_user_id
    LEFT JOIN professional_profiles pp ON pp.user_id = m.sender_user_id
    WHERE m.thread_id = t.id
      AND m.deleted_for_everyone = false
      AND m.created_at >= NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT
      b.id::text AS linked_booking_id,
      b.unique_code AS linked_booking_code,
      b.status AS linked_booking_status
    FROM bookings b
    JOIN business_setups bs ON bs.id = b.business_setup_id
    JOIN professional_profiles bpp ON bpp.id = bs.professional_profile_id
    WHERE b.customer_id = t.client_user_id
      AND bpp.user_id = t.professional_user_id
      AND b.status IN ('requested', 'confirmed', 'completed', 'in_progress')
    ORDER BY COALESCE(b.start_time, b.created_at) DESC
    LIMIT 1
  ) lb ON true
`;

export async function purgeExpiredMessages() {
  await query(
    `DELETE FROM messaging_messages
     WHERE created_at < NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'`,
  );
}

async function assertThreadAccess(threadId, userId) {
  if (String(threadId).startsWith("draft:")) {
    const error = new Error("Conversation not started yet.");
    error.statusCode = 404;
    throw error;
  }
  const result = await query(
    `SELECT id, client_user_id, professional_user_id
     FROM messaging_threads
     WHERE id = $1
       AND ($2::uuid = client_user_id OR $2::uuid = professional_user_id)`,
    [threadId, userId],
  );
  if (result.rowCount === 0) {
    const error = new Error("Conversation not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

async function listActiveProfessionals({ offset = 0, limit = 50, search = "" } = {}) {
  const params = [];
  let searchClause = "";
  if (search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    searchClause = `AND (
      LOWER(COALESCE(pp.legal_name, '')) LIKE $${params.length}
      OR LOWER(COALESCE(pp.contact_first_name, '')) LIKE $${params.length}
      OR LOWER(COALESCE(pp.contact_last_name, '')) LIKE $${params.length}
      OR LOWER(u.email) LIKE $${params.length}
      OR LOWER(COALESCE(bs.business_name, '')) LIKE $${params.length}
      OR LOWER(COALESCE(bs.salon_name, '')) LIKE $${params.length}
    )`;
  }

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM business_setups bs
     JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     JOIN users u ON u.id = pp.user_id
     WHERE bs.is_active = true
     ${searchClause}`,
    params,
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT
       u.id AS professional_user_id,
       bs.id AS business_setup_id,
       COALESCE(
         NULLIF(TRIM(bs.business_name), ''),
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS display_name,
       u.email,
       pp.service_location_mode
     FROM business_setups bs
     JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     JOIN users u ON u.id = pp.user_id
     WHERE bs.is_active = true
     ${searchClause}
     ORDER BY display_name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    total: countResult.rows[0]?.total ?? 0,
    rows: result.rows,
  };
}

export async function listProfessionalsForClient({ offset = 0, limit = 5, search = "" } = {}) {
  const { total, rows } = await listActiveProfessionals({ offset, limit, search });
  const professionals = rows.map((row) => ({
    id: row.business_setup_id,
    professionalUserId: row.professional_user_id,
    businessSetupId: row.business_setup_id,
    name: row.display_name || row.email || "Professional",
    email: row.email,
    locationType: row.service_location_mode === "desired" ? "desired" : "fixed",
    avatarSeed: row.business_setup_id || "pro",
  }));
  return {
    professionals,
    total,
    hasMore: offset + professionals.length < total,
  };
}

export async function createOrGetThread(clientUserId, professionalUserId) {
  const proCheck = await query(
    `SELECT u.id
     FROM users u
     JOIN professional_profiles pp ON pp.user_id = u.id
     JOIN business_setups bs ON bs.professional_profile_id = pp.id
     WHERE u.id = $1 AND u.user_type = 'professional' AND bs.is_active = true`,
    [professionalUserId],
  );
  if (proCheck.rowCount === 0) {
    const error = new Error("Professional not found.");
    error.statusCode = 404;
    throw error;
  }

  const clientCheck = await query(
    `SELECT id FROM users WHERE id = $1 AND user_type IN ('individual', 'company')`,
    [clientUserId],
  );
  if (clientCheck.rowCount === 0) {
    const error = new Error("Only clients can start a conversation with a professional.");
    error.statusCode = 403;
    throw error;
  }

  const existing = await query(
    `SELECT id FROM messaging_threads WHERE client_user_id = $1 AND professional_user_id = $2`,
    [clientUserId, professionalUserId],
  );
  if (existing.rowCount > 0) return existing.rows[0].id;

  const pro = await query(
    `SELECT
       u.id,
       u.email,
       bs.id AS business_setup_id,
       COALESCE(
         NULLIF(TRIM(bs.business_name), ''),
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS display_name,
       pp.service_location_mode
     FROM users u
     JOIN professional_profiles pp ON pp.user_id = u.id
     JOIN business_setups bs ON bs.professional_profile_id = pp.id AND bs.is_active = true
     WHERE u.id = $1
     ORDER BY bs.id ASC
     LIMIT 1`,
    [professionalUserId],
  );

  const proRow = pro.rows[0];
  if (!proRow) {
    const error = new Error("Professional not found.");
    error.statusCode = 404;
    throw error;
  }
  const insert = await query(
    `INSERT INTO messaging_threads (
       client_user_id,
       professional_user_id,
       peer_display_name,
       peer_email,
       peer_profile_id,
       location_type,
       unlinked,
       avatar_seed
     ) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
     RETURNING id`,
    [
      clientUserId,
      professionalUserId,
      proRow.display_name,
      proRow.email,
      proRow.business_setup_id,
      proRow.service_location_mode === "desired" ? "desired" : "fixed",
      proRow.business_setup_id || "pro",
    ],
  );

  return insert.rows[0].id;
}

export async function resolveThreadId(threadId, userId) {
  const raw = String(threadId);
  if (raw.startsWith("draft:setup-")) {
    const setupId = raw.slice("draft:setup-".length);
    return createOrGetThreadByBusinessSetup(userId, setupId);
  }
  if (raw.startsWith("draft:")) {
    return createOrGetThread(userId, raw.slice("draft:".length));
  }
  return threadId;
}

export async function createOrGetThreadByBusinessSetup(clientUserId, businessSetupId) {
  const result = await query(
    `SELECT pp.user_id AS professional_user_id
     FROM business_setups bs
     JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE bs.id = $1 AND bs.is_active = true`,
    [businessSetupId],
  );
  if (result.rowCount === 0) {
    const error = new Error("Professional business not found.");
    error.statusCode = 404;
    throw error;
  }
  return createOrGetThread(clientUserId, result.rows[0].professional_user_id);
}

function normalizeMessagingBookingRef(raw) {
  let value = String(raw || "").trim().replace(/^#/, "");
  if (/^b-/i.test(value)) value = value.slice(2);
  if (/^ce-/i.test(value)) value = value.slice(3);
  value = value.replace(/::segment-\d+$/i, "").trim();
  return value;
}

function customerIdFromCalendarNotes(notes) {
  if (!notes) return "";
  try {
    const parsed = typeof notes === "string" ? JSON.parse(notes) : notes;
    return String(parsed?.customerId ?? parsed?.customer_id ?? "").trim();
  } catch {
    return "";
  }
}

async function findMollureClientForCalendarEntry(entry) {
  const fromNotes = customerIdFromCalendarNotes(entry.notes);
  if (fromNotes) return fromNotes;
  const name = String(entry.client_name || "").trim();
  if (!name || !entry.professional_profile_id) return "";
  const result = await query(
    `SELECT mollure_user_id
     FROM professional_clients
     WHERE professional_profile_id = $1
       AND mollure_user_id IS NOT NULL
       AND LOWER(TRIM(COALESCE(display_name, ''))) = LOWER($2)
     LIMIT 1`,
    [entry.professional_profile_id, name],
  );
  return String(result.rows[0]?.mollure_user_id ?? "").trim();
}

async function loadBookingForMessaging(normalized) {
  const codeBare = normalized.replace(/^bk-?/i, "").replace(/^b/i, "");
  const bookingResult = await query(
    `SELECT
       b.id,
       b.unique_code,
       b.status,
       b.location_type,
       b.customer_id,
       b.business_setup_id,
       pp.user_id AS professional_user_id,
       COALESCE(
         NULLIF(TRIM(bs.business_name), ''),
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         pu.email
       ) AS professional_display_name
     FROM bookings b
     JOIN business_setups bs ON bs.id = b.business_setup_id
     JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     JOIN users pu ON pu.id = pp.user_id
     WHERE b.status <> 'blocked'
       AND (
         b.id::text = $1
         OR LOWER(COALESCE(b.unique_code, '')) = LOWER($1)
         OR LOWER(REGEXP_REPLACE(COALESCE(b.unique_code, ''), '^[Bb]', '')) = LOWER($2)
         OR LOWER(COALESCE(b.unique_code, '')) = LOWER('B' || $2)
       )
     LIMIT 1`,
    [normalized, codeBare],
  );
  return bookingResult.rows[0] ?? null;
}

async function loadCalendarEntryForMessaging(normalized) {
  const result = await query(
    `SELECT
       ce.id,
       ce.unique_code,
       ce.status,
       ce.location_type,
       ce.notes,
       ce.client_name,
       ce.professional_profile_id,
       pp.user_id AS professional_user_id,
       bs.id AS business_setup_id,
       COALESCE(
         NULLIF(TRIM(bs.business_name), ''),
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         pu.email
       ) AS professional_display_name
     FROM calendar_entries ce
     JOIN professional_profiles pp ON pp.id = ce.professional_profile_id
     JOIN users pu ON pu.id = pp.user_id
     LEFT JOIN LATERAL (
       SELECT id, business_name, salon_name
       FROM business_setups
       WHERE professional_profile_id = pp.id AND is_active = true
       ORDER BY id ASC
       LIMIT 1
     ) bs ON true
     WHERE ce.status <> 'blocked'
       AND (
         ce.id::text = $1
         OR LOWER(COALESCE(ce.unique_code, '')) = LOWER($1)
       )
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] ?? null;
}

/**
 * Open (create-or-get) the messaging thread for a booking from live DB data.
 * Works for both the booking client and the booking professional.
 * Also opens chat for Mollure clients on calendar-only (offline) entries.
 */
export async function openThreadForBooking(userId, bookingRef, options = {}) {
  const raw = String(bookingRef || "").trim();
  if (!raw) {
    const error = new Error("Booking reference is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalized = normalizeMessagingBookingRef(raw);
  const hintedCustomerId = String(options.customerId || "").trim();

  let booking = await loadBookingForMessaging(normalized);
  if (!booking) {
    const entry = await loadCalendarEntryForMessaging(normalized);
    if (entry) {
      booking = {
        id: entry.id,
        unique_code: entry.unique_code,
        status: entry.status,
        location_type: entry.location_type,
        customer_id:
          hintedCustomerId || (await findMollureClientForCalendarEntry(entry)),
        business_setup_id: entry.business_setup_id,
        professional_user_id: entry.professional_user_id,
        professional_display_name: entry.professional_display_name,
      };
    }
  }

  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }

  const customerId = String(booking.customer_id || hintedCustomerId || "").trim();
  if (!customerId) {
    const error = new Error("This booking has no Mollure client to chat with.");
    error.statusCode = 400;
    throw error;
  }

  const isClient = String(customerId) === String(userId);
  const isProfessional = String(booking.professional_user_id) === String(userId);
  if (!isClient && !isProfessional) {
    const error = new Error("You do not have access to this booking conversation.");
    error.statusCode = 403;
    throw error;
  }

  const threadId = await createOrGetThread(customerId, booking.professional_user_id);

  const code = booking.unique_code || String(booking.id);
  const bookingMeta = buildBookingMeta(code, booking.status, booking.location_type);

  await query(
    `UPDATE messaging_threads
     SET peer_display_name = $1,
         peer_profile_id = $2,
         booking_id = $3,
         booking_meta = $4,
         booking_status = $5,
         unlinked = false,
         updated_at = NOW()
     WHERE id = $6`,
    [
      booking.professional_display_name,
      booking.business_setup_id,
      code,
      bookingMeta,
      booking.status || "requested",
      threadId,
    ],
  );

  const threadResult = await query(`${THREAD_SELECT} WHERE t.id = $1`, [threadId]);
  if (threadResult.rowCount === 0) {
    const error = new Error("Conversation not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    threadId,
    thread: mapThreadRow(threadResult.rows[0], userId),
    bookingRef: code,
    businessSetupId: String(booking.business_setup_id || ""),
  };
}

export async function getInboxForUser(userId, userType) {
  await purgeExpiredMessages();

  const result = await query(
    `${THREAD_SELECT}
     WHERE t.client_user_id = $1 OR t.professional_user_id = $1
     ORDER BY COALESCE(lm.created_at, t.updated_at) DESC`,
    [userId],
  );

  const threads = result.rows.map((row) => mapThreadRow(row, userId));
  const messagesByThreadId = {};
  const peerLastReadAtByThreadId = {};

  for (const thread of threads) {
    messagesByThreadId[thread.id] = await getThreadMessages(thread.id, userId, { skipPurge: true });
    const row = result.rows.find((item) => item.id === thread.id);
    if (!row) continue;
    const peerUserId =
      row.client_user_id === userId ? row.professional_user_id : row.client_user_id;
    const peerRead = await getThreadReadState(thread.id, peerUserId);
    if (peerRead?.last_read_at) {
      peerLastReadAtByThreadId[thread.id] =
        peerRead.last_read_at instanceof Date
          ? peerRead.last_read_at.toISOString()
          : String(peerRead.last_read_at);
    }
  }

  return { threads, messagesByThreadId, peerLastReadAtByThreadId };
}

export async function getThreadMessages(threadId, userId, options = {}) {
  if (String(threadId).startsWith("draft:")) {
    return [];
  }
  if (!options.skipPurge) {
    await purgeExpiredMessages();
  }
  await assertThreadAccess(threadId, userId);
  const thread = await query(
    `SELECT client_user_id, professional_user_id
     FROM messaging_threads
     WHERE id = $1`,
    [threadId],
  );
  const threadRow = thread.rows[0];

  const result = await query(
    `SELECT
       m.*,
       COALESCE(
         NULLIF(TRIM(ip.display_name), ''),
         NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
         NULLIF(TRIM(cp.legal_name), ''),
         NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS sender_display_name,
       CASE
         WHEN m.sender_role = 'client' THEN COALESCE(ip.user_id::text, 'client')
         ELSE COALESCE(pp.id::text, 'pro')
       END AS sender_avatar_seed
     FROM messaging_messages m
     JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN individual_profiles ip ON ip.user_id = m.sender_user_id
     LEFT JOIN company_profiles cp ON cp.user_id = m.sender_user_id
     LEFT JOIN professional_profiles pp ON pp.user_id = m.sender_user_id
     WHERE m.thread_id = $1
       AND m.created_at >= NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'
       AND (
         m.deleted_for_everyone = true
         OR NOT EXISTS (
           SELECT 1 FROM messaging_message_hides h
           WHERE h.message_id = m.id AND h.user_id = $2
         )
       )
     ORDER BY m.created_at ASC`,
    [threadId, userId],
  );

  const messages = result.rows.map((row) => mapMessageRow(row, userId));
  if (!threadRow) return messages;

  const peerUserId =
    threadRow.client_user_id === userId ? threadRow.professional_user_id : threadRow.client_user_id;
  const peerRead = await getThreadReadState(threadId, peerUserId);
  return applyReadReceiptsToMessages(messages, peerRead?.last_read_at ?? null);
}

async function getThreadReadState(threadId, userId) {
  const result = await query(
    `SELECT last_read_message_id, last_read_at
     FROM messaging_thread_reads
     WHERE thread_id = $1 AND user_id = $2`,
    [threadId, userId],
  );
  return result.rows[0] ?? null;
}

export async function getPeerUserIdForThread(threadId, viewerUserId) {
  const thread = await assertThreadAccess(threadId, viewerUserId);
  return thread.client_user_id === viewerUserId ? thread.professional_user_id : thread.client_user_id;
}

function applyReadReceiptsToMessages(messages, peerReadAt) {
  if (!peerReadAt) {
    return messages.map((message) =>
      message.senderSide === "self" ? { ...message, readByPeer: false } : message,
    );
  }

  const readThroughMs = new Date(peerReadAt).getTime();
  if (Number.isNaN(readThroughMs)) {
    return messages.map((message) =>
      message.senderSide === "self" ? { ...message, readByPeer: false } : message,
    );
  }

  return messages.map((message) => {
    if (message.senderSide !== "self") return message;
    const messageMs = new Date(message.createdAt).getTime();
    if (Number.isNaN(messageMs)) return { ...message, readByPeer: false };
    return { ...message, readByPeer: messageMs <= readThroughMs };
  });
}

export async function getPeerReadAt(threadId, viewerUserId) {
  const thread = await assertThreadAccess(threadId, viewerUserId);
  const peerUserId =
    thread.client_user_id === viewerUserId ? thread.professional_user_id : thread.client_user_id;
  const state = await getThreadReadState(threadId, peerUserId);
  if (!state?.last_read_at) return null;
  return state.last_read_at instanceof Date ? state.last_read_at.toISOString() : String(state.last_read_at);
}

export async function markThreadRead(threadId, userId, messageRef) {
  await purgeExpiredMessages();
  const resolvedThreadId = await resolveThreadId(threadId, userId);
  await assertThreadAccess(resolvedThreadId, userId);

  let messageRow = null;
  if (messageRef) {
    const result = await query(
      `SELECT id, client_message_id, created_at
       FROM messaging_messages
       WHERE thread_id = $1
         AND deleted_for_everyone = false
         AND (id::text = $2 OR client_message_id = $2)
       ORDER BY created_at DESC
       LIMIT 1`,
      [resolvedThreadId, messageRef],
    );
    messageRow = result.rows[0] ?? null;
  }

  if (!messageRow) {
    const result = await query(
      `SELECT id, client_message_id, created_at
       FROM messaging_messages
       WHERE thread_id = $1 AND deleted_for_everyone = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [resolvedThreadId],
    );
    messageRow = result.rows[0] ?? null;
  }

  if (!messageRow) {
    return {
      threadId: resolvedThreadId,
      lastReadMessageId: null,
      lastReadAt: null,
      userId,
    };
  }

  const readAt =
    messageRow.created_at instanceof Date ? messageRow.created_at : new Date(messageRow.created_at);

  await query(
    `INSERT INTO messaging_thread_reads (thread_id, user_id, last_read_message_id, last_read_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (thread_id, user_id) DO UPDATE
       SET last_read_message_id = EXCLUDED.last_read_message_id,
           last_read_at = GREATEST(messaging_thread_reads.last_read_at, EXCLUDED.last_read_at)`,
    [resolvedThreadId, userId, messageRow.id, readAt],
  );

  return {
    threadId: resolvedThreadId,
    lastReadMessageId: messageRow.client_message_id || messageRow.id,
    lastReadAt: readAt.toISOString(),
    userId,
  };
}

export async function appendThreadMessage(threadId, userId, payload = {}) {
  await purgeExpiredMessages();
  const resolvedThreadId = await resolveThreadId(threadId, userId);
  const thread = await assertThreadAccess(resolvedThreadId, userId);

  const senderRole = thread.client_user_id === userId ? "client" : "professional";
  const body = String(payload.body ?? "").trim();
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  if (!body && attachments.length === 0) {
    const error = new Error("Message body or attachment is required.");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO messaging_messages (
       thread_id,
       sender_user_id,
       sender_role,
       body,
       attachments,
       client_message_id
     ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING *`,
    [resolvedThreadId, userId, senderRole, body, JSON.stringify(attachments), payload.clientMessageId || null],
  );

  await query(`UPDATE messaging_threads SET updated_at = NOW() WHERE id = $1`, [resolvedThreadId]);

  const enriched = await query(
    `SELECT
       m.*,
       COALESCE(
         NULLIF(TRIM(ip.display_name), ''),
         NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
         NULLIF(TRIM(cp.legal_name), ''),
         NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS sender_display_name,
       CASE
         WHEN m.sender_role = 'client' THEN COALESCE(ip.user_id::text, 'client')
         ELSE COALESCE(pp.id::text, 'pro')
       END AS sender_avatar_seed
     FROM messaging_messages m
     JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN individual_profiles ip ON ip.user_id = m.sender_user_id
     LEFT JOIN company_profiles cp ON cp.user_id = m.sender_user_id
     LEFT JOIN professional_profiles pp ON pp.user_id = m.sender_user_id
     WHERE m.id = $1
     LIMIT 1`,
    [result.rows[0].id],
  );

  const message = mapMessageRow(enriched.rows[0], userId);
  const peerUserId =
    thread.client_user_id === userId ? thread.professional_user_id : thread.client_user_id;
  return { threadId: resolvedThreadId, message, peerUserId };
}

export async function deleteMessage(threadId, messageRef, userId, scope) {
  await purgeExpiredMessages();
  const resolvedThreadId = await resolveThreadId(threadId, userId);
  await assertThreadAccess(resolvedThreadId, userId);

  const msgResult = await query(
    `SELECT id, sender_user_id, deleted_for_everyone, client_message_id
     FROM messaging_messages
     WHERE thread_id = $1 AND (id::text = $2 OR client_message_id = $2)`,
    [resolvedThreadId, messageRef],
  );
  if (msgResult.rowCount === 0) {
    const error = new Error("Message not found.");
    error.statusCode = 404;
    throw error;
  }

  const msg = msgResult.rows[0];
  if (msg.deleted_for_everyone) {
    return {
      threadId: resolvedThreadId,
      messageId: msg.client_message_id || msg.id,
      scope,
      deletedForEveryone: true,
    };
  }

  if (scope === "everyone") {
    if (msg.sender_user_id !== userId) {
      const error = new Error("You can only delete your own messages for everyone.");
      error.statusCode = 403;
      throw error;
    }
    await query(
      `UPDATE messaging_messages
       SET deleted_for_everyone = true, body = '', attachments = '[]'::jsonb
       WHERE id = $1`,
      [msg.id],
    );
    return {
      threadId: resolvedThreadId,
      messageId: msg.client_message_id || msg.id,
      scope: "everyone",
      deletedForEveryone: true,
    };
  }

  await query(
    `INSERT INTO messaging_message_hides (message_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [msg.id, userId],
  );

  return {
    threadId: resolvedThreadId,
    messageId: msg.client_message_id || msg.id,
    scope: "me",
    deletedForEveryone: false,
  };
}

export async function clearThreadMessages(threadId, userId, scope) {
  await purgeExpiredMessages();
  const resolvedThreadId = await resolveThreadId(threadId, userId);
  await assertThreadAccess(resolvedThreadId, userId);

  if (scope === "everyone") {
    await query(
      `UPDATE messaging_messages
       SET deleted_for_everyone = true, body = '', attachments = '[]'::jsonb
       WHERE thread_id = $1`,
      [resolvedThreadId],
    );
    return { threadId: resolvedThreadId, scope: "everyone", cleared: true };
  }

  await query(
    `INSERT INTO messaging_message_hides (message_id, user_id)
     SELECT m.id, $2
     FROM messaging_messages m
     WHERE m.thread_id = $1
     ON CONFLICT DO NOTHING`,
    [resolvedThreadId, userId],
  );

  return { threadId: resolvedThreadId, scope: "me", cleared: true };
}

/** Backwards-compatible export for socket layer. */
export async function getThreadMessagesLegacy(threadId) {
  await purgeExpiredMessages();
  const result = await query(
    `SELECT
       m.*,
       COALESCE(
         NULLIF(TRIM(ip.display_name), ''),
         NULLIF(TRIM(CONCAT(ip.first_name, ' ', ip.last_name)), ''),
         NULLIF(TRIM(cp.legal_name), ''),
         NULLIF(TRIM(CONCAT(cp.contact_first_name, ' ', cp.contact_last_name)), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS sender_display_name,
       CASE
         WHEN m.sender_role = 'client' THEN COALESCE(ip.user_id::text, 'client')
         ELSE COALESCE(pp.id::text, 'pro')
       END AS sender_avatar_seed
     FROM messaging_messages m
     JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN individual_profiles ip ON ip.user_id = m.sender_user_id
     LEFT JOIN company_profiles cp ON cp.user_id = m.sender_user_id
     LEFT JOIN professional_profiles pp ON pp.user_id = m.sender_user_id
     WHERE m.thread_id = $1
       AND m.created_at >= NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'
     ORDER BY m.created_at ASC`,
    [threadId],
  );
  return result.rows.map((row) => {
    const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
    const senderName = row.sender_display_name || "User";
    return {
      id: row.client_message_id || row.id,
      senderRole: row.sender_role,
      senderName,
      senderAvatarSeed: row.sender_avatar_seed || senderName,
      timeLabel: createdAt,
      createdAt,
      body: row.deleted_for_everyone ? "" : row.body,
      attachments: row.deleted_for_everyone ? undefined : row.attachments,
      dateKey: createdAt.slice(0, 10),
      deletedForEveryone: Boolean(row.deleted_for_everyone),
    };
  });
}

export async function appendThreadMessageLegacy(threadId, message) {
  await purgeExpiredMessages();
  const threadResult = await query(`SELECT client_user_id, professional_user_id FROM messaging_threads WHERE id = $1`, [
    threadId,
  ]);
  if (threadResult.rowCount === 0) return getThreadMessagesLegacy(threadId);

  const senderRole = message.senderRole || "client";
  const senderUserId =
    senderRole === "professional" ? threadResult.rows[0].professional_user_id : threadResult.rows[0].client_user_id;

  if (message.id) {
    const existing = await query(
      `SELECT 1 FROM messaging_messages WHERE thread_id = $1 AND client_message_id = $2`,
      [threadId, message.id],
    );
    if (existing.rowCount > 0) {
      return getThreadMessagesLegacy(threadId);
    }
  }

  await query(
    `INSERT INTO messaging_messages (thread_id, sender_user_id, sender_role, body, attachments, client_message_id, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, COALESCE($7::timestamptz, NOW()))`,
    [
      threadId,
      senderUserId,
      senderRole,
      message.body || "",
      JSON.stringify(message.attachments || []),
      message.id,
      message.createdAt || null,
    ],
  );

  return getThreadMessagesLegacy(threadId);
}

const PAST_BOOKING_STATUSES = new Set(["completed", "cancelled", "no_show"]);
const LINKABLE_PAST_LIMIT = 3;

async function resolveThreadPair(threadId, userId) {
  const raw = String(threadId || "");

  if (raw.startsWith("draft:setup-")) {
    const setupId = raw.slice("draft:setup-".length);
    const result = await query(
      `SELECT pp.user_id AS professional_user_id
       FROM business_setups bs
       JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
       WHERE bs.id = $1 AND bs.is_active = true`,
      [setupId],
    );
    if (result.rowCount === 0) {
      const error = new Error("Professional business not found.");
      error.statusCode = 404;
      throw error;
    }
    return {
      threadId: null,
      clientUserId: userId,
      professionalUserId: result.rows[0].professional_user_id,
    };
  }

  if (raw.startsWith("draft:")) {
    return {
      threadId: null,
      clientUserId: userId,
      professionalUserId: raw.slice("draft:".length),
    };
  }

  const thread = await assertThreadAccess(raw, userId);
  return {
    threadId: thread.id,
    clientUserId: thread.client_user_id,
    professionalUserId: thread.professional_user_id,
  };
}

function isPastBookingRow(row) {
  const status = String(row.status || "").toLowerCase();
  return PAST_BOOKING_STATUSES.has(status);
}

function formatBookingDateLabel(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]}, ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

function formatBookingTimeLabel(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes}`;
}

function formatBookingTimeRange(start, end) {
  const startLabel = start ? formatBookingTimeLabel(start) : "";
  const endLabel = end ? formatBookingTimeLabel(end) : "";
  if (startLabel && endLabel) return `${startLabel}-${endLabel}`;
  return startLabel || endLabel || "";
}

function mapLinkableBooking(row, closed) {
  const code = row.unique_code || String(row.id);
  const dateSource = row.start_time || row.booking_date || row.created_at;
  return {
    id: String(row.id),
    bookingId: code,
    label: code,
    dateLabel: formatBookingDateLabel(dateSource),
    timeRange: formatBookingTimeRange(row.start_time, row.end_time),
    status: row.status || "",
    closed: Boolean(closed),
  };
}

function buildBookingMeta(code, status, locationType) {
  const statusLabel = String(status || "requested")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const loc = locationType === "desired" ? "DL" : "FL";
  return `${String(code).replace(/^B/i, "")} - ${statusLabel} - ${loc}`;
}

async function listPeerBookings(clientUserId, professionalUserId) {
  const result = await query(
    `SELECT
       b.id,
       b.unique_code,
       b.status,
       b.location_type,
       b.booking_date,
       b.start_time,
       b.end_time,
       b.created_at
     FROM bookings b
     JOIN business_setups bs ON bs.id = b.business_setup_id
     JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     WHERE b.customer_id = $1
       AND pp.user_id = $2
       AND b.status <> 'blocked'
     ORDER BY COALESCE(b.start_time, b.created_at) DESC`,
    [clientUserId, professionalUserId],
  );
  return result.rows;
}

function pickLinkableBookings(rows) {
  const now = new Date();
  const active = [];
  const past = [];

  for (const row of rows) {
    if (isPastBookingRow(row, now)) past.push(row);
    else active.push(row);
  }

  // Active: soonest first. Past: most recent first, cap at last 3.
  active.sort((a, b) => {
    const aMs = new Date(a.start_time || a.created_at).getTime();
    const bMs = new Date(b.start_time || b.created_at).getTime();
    return aMs - bMs;
  });
  past.sort((a, b) => {
    const aMs = new Date(a.end_time || a.start_time || a.created_at).getTime();
    const bMs = new Date(b.end_time || b.start_time || b.created_at).getTime();
    return bMs - aMs;
  });

  const selectedPast = past.slice(0, LINKABLE_PAST_LIMIT);
  return [
    ...active.map((row) => mapLinkableBooking(row, false)),
    ...selectedPast.map((row) => mapLinkableBooking(row, true)),
  ];
}

export async function listLinkableBookingsForThread(threadId, userId) {
  const pair = await resolveThreadPair(threadId, userId);
  const rows = await listPeerBookings(pair.clientUserId, pair.professionalUserId);
  return {
    bookings: pickLinkableBookings(rows),
    clientUserId: pair.clientUserId,
    professionalUserId: pair.professionalUserId,
  };
}

export async function linkThreadToBooking(threadId, userId, bookingRef) {
  const ref = String(bookingRef || "").trim();
  if (!ref) {
    const error = new Error("Booking is required.");
    error.statusCode = 400;
    throw error;
  }

  const pair = await resolveThreadPair(threadId, userId);
  const rows = await listPeerBookings(pair.clientUserId, pair.professionalUserId);
  const linkable = pickLinkableBookings(rows);
  const normalizedRef = ref.replace(/^#/, "").trim().toLowerCase();
  const normalizedCode = normalizedRef.replace(/^b/i, "");

  const matched = rows.find((row) => {
    const id = String(row.id).toLowerCase();
    const code = String(row.unique_code || "").toLowerCase();
    const codeBare = code.replace(/^b/i, "");
    return (
      id === normalizedRef ||
      code === normalizedRef ||
      codeBare === normalizedCode ||
      code === `b${normalizedCode}`
    );
  });

  if (!matched) {
    const error = new Error("Booking not found for this conversation.");
    error.statusCode = 404;
    throw error;
  }

  const allowed = linkable.some(
    (item) => item.id === String(matched.id) || item.bookingId === (matched.unique_code || String(matched.id)),
  );
  if (!allowed) {
    const error = new Error("Only upcoming bookings or the last 3 past bookings can be linked.");
    error.statusCode = 400;
    throw error;
  }

  const resolvedThreadId = await resolveThreadId(threadId, userId);
  const code = matched.unique_code || String(matched.id);
  const bookingMeta = buildBookingMeta(code, matched.status, matched.location_type);

  await query(
    `UPDATE messaging_threads
     SET booking_id = $1,
         booking_meta = $2,
         booking_status = $3,
         unlinked = false,
         updated_at = NOW()
     WHERE id = $4`,
    [code, bookingMeta, matched.status || "requested", resolvedThreadId],
  );

  const threadResult = await query(`${THREAD_SELECT} WHERE t.id = $1`, [resolvedThreadId]);
  if (threadResult.rowCount === 0) {
    const error = new Error("Conversation not found after linking.");
    error.statusCode = 404;
    throw error;
  }

  return {
    threadId: resolvedThreadId,
    thread: mapThreadRow(threadResult.rows[0], userId),
    booking: mapLinkableBooking(matched, isPastBookingRow(matched)),
  };
}
