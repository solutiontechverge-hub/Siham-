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
      NULLIF(TRIM(pp.legal_name), ''),
      NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
      t.peer_display_name
    ) AS professional_display_name,
    ip.user_id::text AS client_profile_id,
    pp.id::text AS professional_profile_id,
    lm.body AS last_message_preview,
    lm.created_at AS last_message_at
  FROM messaging_threads t
  JOIN users cu ON cu.id = t.client_user_id
  JOIN users pu ON pu.id = t.professional_user_id
  LEFT JOIN individual_profiles ip ON ip.user_id = t.client_user_id
  LEFT JOIN company_profiles cp ON cp.user_id = t.client_user_id
  LEFT JOIN professional_profiles pp ON pp.user_id = t.professional_user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at
    FROM messaging_messages m
    WHERE m.thread_id = t.id
      AND m.deleted_for_everyone = false
      AND m.created_at >= NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
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
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(pp.contact_first_name, ' ', pp.contact_last_name)), ''),
         u.email
       ) AS display_name,
       pp.service_location_mode
     FROM users u
     JOIN professional_profiles pp ON pp.user_id = u.id
     JOIN business_setups bs ON bs.professional_profile_id = pp.id
     WHERE u.id = $1`,
    [professionalUserId],
  );

  const proRow = pro.rows[0];
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

  for (const thread of threads) {
    messagesByThreadId[thread.id] = await getThreadMessages(thread.id, userId, { skipPurge: true });
  }

  return { threads, messagesByThreadId };
}

export async function getThreadMessages(threadId, userId, options = {}) {
  if (String(threadId).startsWith("draft:")) {
    return [];
  }
  if (!options.skipPurge) {
    await purgeExpiredMessages();
  }
  await assertThreadAccess(threadId, userId);

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

  return result.rows.map((row) => mapMessageRow(row, userId));
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

  const row = result.rows[0];
  row.sender_display_name = "You";
  row.sender_avatar_seed = senderRole === "client" ? "client" : "pro";

  const message = mapMessageRow(row, userId);
  return { threadId: resolvedThreadId, message };
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
    `SELECT m.*, u.email AS sender_display_name, m.sender_role AS sender_avatar_seed
     FROM messaging_messages m
     JOIN users u ON u.id = m.sender_user_id
     WHERE m.thread_id = $1
       AND m.created_at >= NOW() - INTERVAL '${MESSAGE_RETENTION_INTERVAL}'
     ORDER BY m.created_at ASC`,
    [threadId],
  );
  return result.rows.map((row) => ({
    id: row.client_message_id || row.id,
    senderRole: row.sender_role,
    senderName: row.sender_display_name,
    senderAvatarSeed: row.sender_role,
    timeLabel: row.created_at,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    body: row.deleted_for_everyone ? "" : row.body,
    attachments: row.deleted_for_everyone ? undefined : row.attachments,
    dateKey: row.created_at.toISOString().slice(0, 10),
    deletedForEveryone: Boolean(row.deleted_for_everyone),
  }));
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
