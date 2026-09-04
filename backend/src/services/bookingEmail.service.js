import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import { DEFAULT_RESPONSE_WINDOW_MINUTES } from "../utils/bookingResponseWindow.js";
import {
  buildAppointmentReminderEmail,
  buildBookingCancelledEmail,
  buildBookingConfirmedEmail,
  buildIncomingErEmail,
  buildBookingRequestSentEmail,
  buildNewBookingRequestEmail,
  buildNotificationCompanionEmail,
  buildPostTreatmentPaymentEmail,
  buildPrepaymentReceivedEmail,
  buildProfessionalActionEmail,
  buildReviewInviteEmail,
} from "../helpers/bookingEmailTemplates.js";
import { buildRespondToRequestReminderEmail } from "../helpers/financeEmailTemplates.js";
import { formatBookingId, formatStartTime } from "../helpers/bookingEmailTemplates.js";
import { createReviewInviteForBooking } from "./review.service.js";
import { getFrontendBaseUrl } from "../helpers/emailLayout.js";

export const BOOKING_EMAIL_TYPES = {
  CONFIRMED: "booking_confirmed",
  INCOMING_ER: "incoming_er",
  CANCELLED: "booking_cancelled",
  POST_TREATMENT_PAYMENT: "post_treatment_payment",
  REVIEW_INVITE: "review_invite",
  APPOINTMENT_REMINDER: "appointment_reminder",
  PROFESSIONAL_ACTION: "professional_action",
  RESPOND_REQUEST_REMINDER: "respond_request_reminder",
  NEW_BOOKING_REQUEST: "new_booking_request",
  CLIENT_BR_SENT: "client_br_sent",
  PREPAYMENT_RECEIVED: "prepayment_received",
  /** Generic companion email for any in-app notification. */
  NOTIFICATION_COMPANION: "notification_companion",
};

const CALENDAR_CLIENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/** Pull client email from calendar notes meta or an email-shaped client_name. */
export const extractCalendarClientEmail = (clientName, notes) => {
  const fromName = String(clientName ?? "").trim();
  if (CALENDAR_CLIENT_EMAIL_RE.test(fromName)) return fromName.toLowerCase();

  const raw = String(notes ?? "");
  const metaPart = raw.includes("---mollure-meta---")
    ? raw.split("---mollure-meta---").slice(1).join("---mollure-meta---").trim()
    : "";
  if (metaPart) {
    try {
      const meta = JSON.parse(metaPart);
      const fromMeta = String(meta?.clientEmail ?? "").trim();
      if (CALENDAR_CLIENT_EMAIL_RE.test(fromMeta)) return fromMeta.toLowerCase();
    } catch {
      // ignore malformed meta
    }
  }
  return null;
};

const EMAIL_BUILDERS = {
  [BOOKING_EMAIL_TYPES.CONFIRMED]: {
    subject: "Booking confirmed",
    build: buildBookingConfirmedEmail,
  },
  [BOOKING_EMAIL_TYPES.INCOMING_ER]: {
    subject: "Incoming edit request",
    build: buildIncomingErEmail,
  },
  [BOOKING_EMAIL_TYPES.CANCELLED]: {
    subject: "Booking cancelled",
    build: buildBookingCancelledEmail,
  },
  [BOOKING_EMAIL_TYPES.POST_TREATMENT_PAYMENT]: {
    subject: "After treatment payment",
    build: buildPostTreatmentPaymentEmail,
  },
  [BOOKING_EMAIL_TYPES.REVIEW_INVITE]: {
    subject: "Write a review for your visit",
    build: buildReviewInviteEmail,
  },
  [BOOKING_EMAIL_TYPES.APPOINTMENT_REMINDER]: {
    subject: "Appointment reminder",
    build: buildAppointmentReminderEmail,
  },
  [BOOKING_EMAIL_TYPES.PROFESSIONAL_ACTION]: {
    subject: "Booking update from your professional",
    build: buildProfessionalActionEmail,
  },
  [BOOKING_EMAIL_TYPES.NEW_BOOKING_REQUEST]: {
    subject: "New booking request",
    build: buildNewBookingRequestEmail,
  },
  [BOOKING_EMAIL_TYPES.CLIENT_BR_SENT]: {
    subject: "Your booking request was sent",
    build: buildBookingRequestSentEmail,
  },
  [BOOKING_EMAIL_TYPES.PREPAYMENT_RECEIVED]: {
    subject: "Prepayment received",
    build: buildPrepaymentReceivedEmail,
  },
};

const loadBookingEmailContext = async (bookingId) => {
  const result = await query(
    `SELECT
       b.id,
       b.unique_code,
       b.start_time,
       b.status,
       u.email AS customer_email,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Your salon') AS salon_name,
       COALESCE(
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(bs.business_name), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(COALESCE(pp.contact_first_name, ''), ' ', COALESCE(pp.contact_last_name, ''))), ''),
         'Professional'
       ) AS professional_name,
       COALESCE(NULLIF(sc.title, ''), 'Service') AS service_name
     FROM bookings b
     INNER JOIN users u ON u.id = b.customer_id
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     LEFT JOIN subcategories sc ON sc.id = b.service_id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );

  if (!result.rows.length) {
    return null;
  }

  const row = result.rows[0];
  return {
    bookingId: row.id,
    uniqueCode: row.unique_code,
    startTime: row.start_time,
    status: row.status,
    customerEmail: row.customer_email,
    salonName: row.salon_name,
    professionalName: row.professional_name,
    serviceName: row.service_name,
  };
};

const loadProfessionalEmailContext = async (bookingId) => {
  const result = await query(
    `SELECT
       b.unique_code,
       b.start_time,
       b.status,
       pu.email AS professional_email,
       COALESCE(
         CASE
           WHEN cu.user_type = 'company' THEN NULLIF(TRIM(cp.legal_name), '')
           ELSE NULLIF(TRIM(CONCAT_WS(' ', cu_ip.first_name, cu_ip.last_name)), '')
         END,
         NULLIF(TRIM(cu_ip.display_name), ''),
         NULLIF(TRIM(cp.legal_name), ''),
         NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
         cu.email,
         'Client'
       ) AS client_name
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     INNER JOIN users pu ON pu.id = pp.user_id
     LEFT JOIN users cu ON cu.id = b.customer_id
     LEFT JOIN individual_profiles cu_ip ON cu_ip.user_id = cu.id
     LEFT JOIN company_profiles cp ON cp.user_id = cu.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );

  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    professionalEmail: row.professional_email,
    bookingId: formatBookingId(row.unique_code),
    startTime: formatStartTime(row.start_time),
    status: row.status,
    clientName: row.client_name,
  };
};

const hasSentEmail = async (bookingId, emailType) => {
  const result = await query(
    `SELECT 1
     FROM booking_email_notifications
     WHERE booking_id = $1 AND email_type = $2
     LIMIT 1`,
    [bookingId, emailType],
  );
  return result.rowCount > 0;
};

const markEmailSent = async (bookingId, emailType) => {
  await query(
    `INSERT INTO booking_email_notifications (booking_id, email_type)
     VALUES ($1, $2)
     ON CONFLICT (booking_id, email_type) DO NOTHING`,
    [bookingId, emailType],
  );
};

export const sendBookingClientEmail = async (bookingId, emailType, extras = {}) => {
  const config = EMAIL_BUILDERS[emailType];
  if (!config) {
    throw new Error(`Unknown booking email type: ${emailType}`);
  }

  const ctx = await loadBookingEmailContext(bookingId);
  if (!ctx?.customerEmail) {
    return { sent: false, reason: "booking_or_email_not_found" };
  }

  const { html, text } = config.build({ ...ctx, ...extras });
  await sendMail({
    to: ctx.customerEmail,
    subject: extras.title || config.subject,
    html,
    text,
  });

  return { sent: true, to: ctx.customerEmail };
};

export const sendBookingClientEmailOnce = async (bookingId, emailType, extras = {}) => {
  try {
    const alreadySent = await hasSentEmail(bookingId, emailType);
    if (alreadySent) {
      return { sent: false, reason: "already_sent" };
    }

    const result = await sendBookingClientEmail(bookingId, emailType, extras);
    if (result.sent) {
      await markEmailSent(bookingId, emailType);
    }
    return result;
  } catch (error) {
    console.error(`[booking-email] Failed to send ${emailType} for booking ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

/**
 * Companion email for every in-app notification.
 * Uses richer booking templates when the notification type maps to one.
 */
export const sendInAppNotificationEmail = async ({
  recipientUserId,
  notificationType,
  title,
  message = null,
  bookingId = null,
  bookingRef = null,
  href = null,
  actorName = null,
  audience = "client",
}) => {
  try {
    const userResult = await query(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [recipientUserId]);
    const to = userResult.rows[0]?.email;
    if (!to) return { sent: false, reason: "recipient_email_not_found" };

    const isProfessional = audience === "professional";
    const richType = mapNotificationTypeToEmailType(notificationType, isProfessional);

    // Professional-targeted helpers (not in EMAIL_BUILDERS)
    if (bookingId && richType === BOOKING_EMAIL_TYPES.NEW_BOOKING_REQUEST) {
      // Always email on BR (re)send — not once-only.
      return notifyIncomingBookingRequest(bookingId);
    }
    if (bookingId && richType === BOOKING_EMAIL_TYPES.PREPAYMENT_RECEIVED) {
      return notifyPrepaymentReceived(bookingId);
    }
    if (bookingId && richType === BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER) {
      return notifyRespondToRequestReminder(bookingId);
    }

    if (bookingId && richType && EMAIL_BUILDERS[richType]) {
      const result = await sendBookingClientEmail(bookingId, richType, {
        title,
        message,
      });
      if (result.sent) {
        await markEmailSent(bookingId, `${richType}:${notificationType}`).catch(() => {});
        if (
          richType === BOOKING_EMAIL_TYPES.APPOINTMENT_REMINDER ||
          richType === BOOKING_EMAIL_TYPES.CONFIRMED ||
          richType === BOOKING_EMAIL_TYPES.CANCELLED ||
          richType === BOOKING_EMAIL_TYPES.POST_TREATMENT_PAYMENT ||
          richType === BOOKING_EMAIL_TYPES.REVIEW_INVITE ||
          richType === BOOKING_EMAIL_TYPES.INCOMING_ER
        ) {
          await markEmailSent(bookingId, richType).catch(() => {});
        }
      }
      return result;
    }

    const { html, text } = buildNotificationCompanionEmail({
      title: title || "Mollure update",
      message:
        message ||
        (actorName ? `${actorName} sent you an update.` : "You have a new update on Mollure."),
      actorName,
      bookingRef,
      href: href || (isProfessional ? "/professionals/calendar" : "/clients/booking"),
      ctaLabel: isProfessional ? "Open calendar" : "View booking",
      iconType: "info",
    });

    await sendMail({
      to,
      subject: title || "Mollure update",
      html,
      text,
    });

    if (bookingId) {
      await markEmailSent(
        bookingId,
        `${BOOKING_EMAIL_TYPES.NOTIFICATION_COMPANION}:${notificationType}`,
      ).catch(() => {});
    }

    return { sent: true, to };
  } catch (error) {
    console.error(
      `[booking-email] Companion email failed for notification ${notificationType}:`,
      error.message,
    );
    return { sent: false, reason: "error", error: error.message };
  }
};

function mapNotificationTypeToEmailType(notificationType, isProfessional) {
  const type = String(notificationType || "");

  // Professional-only rich emails — never send client templates to pros.
  if (isProfessional || type.startsWith("pro.")) {
    if (type === "pro.br.incoming") return BOOKING_EMAIL_TYPES.NEW_BOOKING_REQUEST;
    if (type === "pro.payment.prepayment_received") return BOOKING_EMAIL_TYPES.PREPAYMENT_RECEIVED;
    if (type === "pro.reminder.respond_request") return BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER;
    return null; // companion email with pro CTA
  }

  // Client-only rich emails
  if (type === "client.br.sent") {
    return BOOKING_EMAIL_TYPES.CLIENT_BR_SENT;
  }
  if (type === "client.booking.confirmed" || type === "client.br.accepted") {
    return BOOKING_EMAIL_TYPES.CONFIRMED;
  }
  if (type === "client.booking.cancelled") {
    return BOOKING_EMAIL_TYPES.CANCELLED;
  }
  if (type === "client.booking.completed") return BOOKING_EMAIL_TYPES.POST_TREATMENT_PAYMENT;
  if (type === "client.er.incoming" || type === "client.er.suggested") {
    return BOOKING_EMAIL_TYPES.INCOMING_ER;
  }
  if (type === "client.reminder.appointment") return BOOKING_EMAIL_TYPES.APPOINTMENT_REMINDER;
  // All other client booking / BR / ER / payment updates → booking card email.
  if (
    type.startsWith("client.booking.") ||
    type.startsWith("client.br.") ||
    type.startsWith("client.er.") ||
    type.startsWith("client.payment.") ||
    type.startsWith("client.invoice.")
  ) {
    return BOOKING_EMAIL_TYPES.PROFESSIONAL_ACTION;
  }
  return null;
}

export const notifyBookingConfirmed = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.CONFIRMED);

export const notifyIncomingEditRequest = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.INCOMING_ER);

export const notifyBookingCancelled = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.CANCELLED);

export const notifyPostTreatmentPayment = (bookingId, extras) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.POST_TREATMENT_PAYMENT, extras);

export const notifyReviewInvite = async (bookingId) => {
  try {
    const invite = await createReviewInviteForBooking(bookingId);
    if (!invite?.invite_token) {
      return { sent: false, reason: "invite_not_created" };
    }
    if (invite.submitted_at) {
      return { sent: false, reason: "already_submitted" };
    }

    const reviewUrl = `${getFrontendBaseUrl()}/reviews/write?token=${encodeURIComponent(invite.invite_token)}`;
    return sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.REVIEW_INVITE, {
      inviteToken: invite.invite_token,
      reviewUrl,
    });
  } catch (error) {
    console.error(`[booking-email] Failed review invite for booking ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

export const notifyAppointmentReminder = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.APPOINTMENT_REMINDER);

export const notifyProfessionalAction = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.PROFESSIONAL_ACTION);

export const notifyNewBookingRequest = async (bookingId) => {
  try {
    const alreadySent = await hasSentEmail(bookingId, BOOKING_EMAIL_TYPES.NEW_BOOKING_REQUEST);
    if (alreadySent) return { sent: false, reason: "already_sent" };

    const ctx = await loadProfessionalEmailContext(bookingId);
    if (!ctx?.professionalEmail) {
      return { sent: false, reason: "professional_email_not_found" };
    }

    const clientCtx = await loadBookingEmailContext(bookingId);
    const { html, text } = buildNewBookingRequestEmail({
      ...clientCtx,
      clientName: ctx.clientName,
    });
    await sendMail({
      to: ctx.professionalEmail,
      subject: "New booking request",
      html,
      text,
    });
    await markEmailSent(bookingId, BOOKING_EMAIL_TYPES.NEW_BOOKING_REQUEST);
    return { sent: true, to: ctx.professionalEmail };
  } catch (error) {
    console.error(`[booking-email] Failed new booking request for ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

export const notifyPrepaymentReceived = async (bookingId) => {
  try {
    const alreadySent = await hasSentEmail(bookingId, BOOKING_EMAIL_TYPES.PREPAYMENT_RECEIVED);
    if (alreadySent) return { sent: false, reason: "already_sent" };

    const ctx = await loadProfessionalEmailContext(bookingId);
    if (!ctx?.professionalEmail) {
      return { sent: false, reason: "professional_email_not_found" };
    }

    const clientCtx = await loadBookingEmailContext(bookingId);
    const { html, text } = buildPrepaymentReceivedEmail({
      ...clientCtx,
      clientName: ctx.clientName,
    });
    await sendMail({
      to: ctx.professionalEmail,
      subject: "Prepayment received",
      html,
      text,
    });
    await markEmailSent(bookingId, BOOKING_EMAIL_TYPES.PREPAYMENT_RECEIVED);
    return { sent: true, to: ctx.professionalEmail };
  } catch (error) {
    console.error(`[booking-email] Failed prepayment email for ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

export const notifyRespondToRequestReminder = async (bookingId) => {
  try {
    const alreadySent = await hasSentEmail(bookingId, BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER);
    if (alreadySent) {
      return { sent: false, reason: "already_sent" };
    }

    const ctx = await loadProfessionalEmailContext(bookingId);
    if (!ctx?.professionalEmail) {
      return { sent: false, reason: "professional_email_not_found" };
    }

    const { html, text } = buildRespondToRequestReminderEmail(ctx);
    await sendMail({
      to: ctx.professionalEmail,
      subject: "Reminder: respond to booking request",
      html,
      text,
    });

    await markEmailSent(bookingId, BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER);
    return { sent: true, to: ctx.professionalEmail };
  } catch (error) {
    console.error(`[booking-email] Failed respond reminder for booking ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

/** Email the professional when a client (re)sends a booking request. */
export const notifyIncomingBookingRequest = async (bookingId) => {
  try {
    const ctx = await loadProfessionalEmailContext(bookingId);
    if (!ctx?.professionalEmail) {
      return { sent: false, reason: "professional_email_not_found" };
    }

    const clientCtx = await loadBookingEmailContext(bookingId);
    const { html, text } = buildNewBookingRequestEmail({
      ...clientCtx,
      clientName: ctx.clientName,
    });
    await sendMail({
      to: ctx.professionalEmail,
      subject: "New booking request",
      html,
      text,
    });

    return { sent: true, to: ctx.professionalEmail };
  } catch (error) {
    console.error(`[booking-email] Failed incoming booking request for booking ${bookingId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

export const notifyBookingStatusChange = async (bookingId, previousStatus, nextStatus) => {
  if (previousStatus === nextStatus) return;

  if (nextStatus === "confirmed") {
    await notifyBookingConfirmed(bookingId);
    return;
  }

  if (nextStatus === "cancelled") {
    await notifyBookingCancelled(bookingId);
    return;
  }

  if (nextStatus === "completed") {
    await notifyPostTreatmentPayment(bookingId);
    await notifyReviewInvite(bookingId);
    return;
  }

  await notifyProfessionalAction(bookingId);
};

const REMINDER_WINDOW_MINUTES = Number(process.env.BOOKING_REMINDER_WINDOW_MINUTES || 5);
const REMINDER_HOURS_BEFORE = Number(process.env.BOOKING_REMINDER_HOURS_BEFORE || 2);

export const processAppointmentReminders = async () => {
  const windowMs = REMINDER_WINDOW_MINUTES * 60 * 1000;
  const targetMs = REMINDER_HOURS_BEFORE * 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = new Date(now + targetMs - windowMs);
  const windowEnd = new Date(now + targetMs + windowMs);

  const result = await query(
    `SELECT b.id
     FROM bookings b
     WHERE b.status = 'confirmed'
       AND b.start_time IS NOT NULL
       AND b.start_time >= $1
       AND b.start_time <= $2
       AND NOT EXISTS (
         SELECT 1
         FROM booking_email_notifications n
         WHERE n.booking_id = b.id
           AND n.email_type = $3
       )`,
    [windowStart.toISOString(), windowEnd.toISOString(), BOOKING_EMAIL_TYPES.APPOINTMENT_REMINDER],
  );

  const outcomes = [];
  for (const row of result.rows) {
    const outcome = await notifyAppointmentReminder(row.id);
    outcomes.push({ bookingId: row.id, ...outcome });
  }

  return outcomes;
};

export const processRespondToRequestReminders = async () => {
  const result = await query(
    `SELECT b.id
     FROM bookings b
     WHERE b.status = 'requested'
       AND b.created_at <= NOW() - ($1::int || ' minutes')::interval
       AND NOT EXISTS (
         SELECT 1
         FROM booking_email_notifications n
         WHERE n.booking_id = b.id
           AND n.email_type = $2
       )`,
    [DEFAULT_RESPONSE_WINDOW_MINUTES, BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER],
  );

  const outcomes = [];
  for (const row of result.rows) {
    const outcome = await notifyRespondToRequestReminder(row.id);
    outcomes.push({ bookingId: row.id, ...outcome });
  }

  return outcomes;
};

const sameCalendarInstant = (left, right) => {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return new Date(left).getTime() === new Date(right).getTime();
};

const loadCalendarEntryEmailContext = async (entry) => {
  const customerEmail = extractCalendarClientEmail(entry?.client_name, entry?.notes);
  if (!customerEmail) return null;

  const result = await query(
    `SELECT
       ce.id,
       ce.unique_code,
       ce.start_time,
       ce.status,
       ce.title,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Your salon') AS salon_name,
       COALESCE(
         NULLIF(TRIM(CONCAT(COALESCE(pp.contact_first_name, ''), ' ', COALESCE(pp.contact_last_name, ''))), ''),
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(bs.salon_name), ''),
         NULLIF(TRIM(bs.business_name), ''),
         'Professional'
       ) AS professional_name
     FROM calendar_entries ce
     INNER JOIN professional_profiles pp ON pp.id = ce.professional_profile_id
     LEFT JOIN LATERAL (
       SELECT salon_name, business_name
       FROM business_setups
       WHERE professional_profile_id = pp.id
       ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
       LIMIT 1
     ) bs ON true
     WHERE ce.id = $1
     LIMIT 1`,
    [entry.id],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    uniqueCode: row.unique_code,
    startTime: row.start_time,
    status: row.status,
    salonName: row.salon_name,
    professionalName: row.professional_name,
    serviceName: row.title || "Service",
    customerEmail,
    hideCta: true,
  };
};

const calendarEntryHasMollureBooking = async (uniqueCode) => {
  const code = String(uniqueCode ?? "").trim();
  if (!code) return false;
  const result = await query(
    `SELECT 1
     FROM bookings
     WHERE unique_code = $1
       AND customer_id IS NOT NULL
     LIMIT 1`,
    [code],
  );
  return result.rowCount > 0;
};

/**
 * Email non-Mollure calendar clients (offline / confirmed bookings without a
 * Mollure user). Mollure clients already receive mail via `bookings.customer_id`.
 */
export const notifyNonMollureCalendarClient = async (entry, options = {}) => {
  try {
    if (!entry?.id) return { sent: false, reason: "missing_entry" };

    const status = String(entry.status ?? "").toLowerCase();
    if (status === "blocked" || status === "requested") {
      return { sent: false, reason: "not_applicable" };
    }

    if (await calendarEntryHasMollureBooking(entry.unique_code)) {
      return { sent: false, reason: "mollure_booking_exists" };
    }

    const ctx = await loadCalendarEntryEmailContext(entry);
    if (!ctx?.customerEmail) {
      return { sent: false, reason: "client_email_not_found" };
    }

    const previous = options.previousEntry ?? null;
    const previousStatus = String(
      options.previousStatus ?? previous?.status ?? "",
    ).toLowerCase();
    const kind = String(options.kind ?? "created").toLowerCase();

    const statusChanged = Boolean(previousStatus) && previousStatus !== status;
    const scheduleChanged = previous
      ? !sameCalendarInstant(previous.start_time, entry.start_time) ||
        !sameCalendarInstant(previous.end_time, entry.end_time) ||
        !sameCalendarInstant(previous.start_date, entry.start_date)
      : false;

    let emailType = null;
    const extras = {};

    if (kind === "created") {
      emailType =
        status === "cancelled"
          ? BOOKING_EMAIL_TYPES.CANCELLED
          : BOOKING_EMAIL_TYPES.CONFIRMED;
      extras.message =
        status === "cancelled"
          ? `${ctx.professionalName} cancelled your appointment.`
          : `${ctx.professionalName} booked an appointment for you.`;
    } else if (status === "cancelled" && statusChanged) {
      emailType = BOOKING_EMAIL_TYPES.CANCELLED;
      extras.message = `${ctx.professionalName} cancelled your appointment.`;
    } else if (statusChanged) {
      emailType = BOOKING_EMAIL_TYPES.PROFESSIONAL_ACTION;
      extras.title = "Booking update from your professional";
      extras.message = `${ctx.professionalName} updated your appointment status.`;
    } else if (scheduleChanged) {
      emailType = BOOKING_EMAIL_TYPES.PROFESSIONAL_ACTION;
      extras.title = "Your appointment time was updated";
      extras.message = `${ctx.professionalName} changed the time of your appointment.`;
    } else {
      return { sent: false, reason: "no_client_visible_change" };
    }

    const config = EMAIL_BUILDERS[emailType];
    if (!config) {
      return { sent: false, reason: "unknown_email_type" };
    }

    const { html, text } = config.build({ ...ctx, ...extras });
    await sendMail({
      to: ctx.customerEmail,
      subject: extras.title || config.subject,
      html,
      text,
    });

    return { sent: true, to: ctx.customerEmail };
  } catch (error) {
    console.error(
      `[booking-email] Non-Mollure calendar email failed for ${entry?.id}:`,
      error.message,
    );
    return { sent: false, reason: "error", error: error.message };
  }
};
