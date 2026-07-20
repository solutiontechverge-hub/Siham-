import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import {
  buildAppointmentReminderEmail,
  buildBookingCancelledEmail,
  buildBookingConfirmedEmail,
  buildIncomingErEmail,
  buildNewBookingRequestEmail,
  buildPostTreatmentPaymentEmail,
  buildPrepaymentReceivedEmail,
  buildProfessionalActionEmail,
} from "../helpers/bookingEmailTemplates.js";
import { buildRespondToRequestReminderEmail } from "../helpers/financeEmailTemplates.js";
import { formatBookingId, formatStartTime } from "../helpers/bookingEmailTemplates.js";

export const BOOKING_EMAIL_TYPES = {
  CONFIRMED: "booking_confirmed",
  INCOMING_ER: "incoming_er",
  CANCELLED: "booking_cancelled",
  POST_TREATMENT_PAYMENT: "post_treatment_payment",
  APPOINTMENT_REMINDER: "appointment_reminder",
  PROFESSIONAL_ACTION: "professional_action",
  RESPOND_REQUEST_REMINDER: "respond_request_reminder",
  NEW_BOOKING_REQUEST: "new_booking_request",
  PREPAYMENT_RECEIVED: "prepayment_received",
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
       COALESCE(NULLIF(tm.full_name, ''), 'Your professional') AS professional_name,
       COALESCE(NULLIF(sc.title, ''), 'Service') AS service_name
     FROM bookings b
     INNER JOIN users u ON u.id = b.customer_id
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
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
         NULLIF(TRIM(COALESCE(ip.display_name, ip.first_name || ' ' || ip.last_name)), ''),
         pu.email
       ) AS client_name
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     INNER JOIN users pu ON pu.id = pp.user_id
     LEFT JOIN users cu ON cu.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = cu.id
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
    subject: config.subject,
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

export const notifyBookingConfirmed = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.CONFIRMED);

export const notifyIncomingEditRequest = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.INCOMING_ER);

export const notifyBookingCancelled = (bookingId) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.CANCELLED);

export const notifyPostTreatmentPayment = (bookingId, extras) =>
  sendBookingClientEmailOnce(bookingId, BOOKING_EMAIL_TYPES.POST_TREATMENT_PAYMENT, extras);

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

    const { html, text } = buildRespondToRequestReminderEmail(ctx);
    await sendMail({
      to: ctx.professionalEmail,
      subject: "Incoming booking request",
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
    return;
  }

  await notifyProfessionalAction(bookingId);
};

const REMINDER_WINDOW_MINUTES = Number(process.env.BOOKING_REMINDER_WINDOW_MINUTES || 5);
const REMINDER_HOURS_BEFORE = Number(process.env.BOOKING_REMINDER_HOURS_BEFORE || 2);
const RESPOND_REMINDER_HOURS = Number(process.env.BOOKING_RESPOND_REMINDER_HOURS || 24);

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
       AND b.created_at <= NOW() - ($1::int || ' hours')::interval
       AND NOT EXISTS (
         SELECT 1
         FROM booking_email_notifications n
         WHERE n.booking_id = b.id
           AND n.email_type = $2
       )`,
    [RESPOND_REMINDER_HOURS, BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER],
  );

  const outcomes = [];
  for (const row of result.rows) {
    const outcome = await notifyRespondToRequestReminder(row.id);
    outcomes.push({ bookingId: row.id, ...outcome });
  }

  return outcomes;
};
