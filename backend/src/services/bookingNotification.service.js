import { query } from "../db/index.js";
import { emitNotificationChanged } from "../messaging/messagingSocket.js";
import {
  BOOKING_EMAIL_TYPES,
  sendInAppNotificationEmail,
} from "./bookingEmail.service.js";
import {
  FINANCE_EMAIL_TYPES,
  sendFinanceClientEmail,
} from "./financeEmail.service.js";

export const NOTIFICATION_TYPES = {
  PRO_BR_INCOMING: "pro.br.incoming",
  PRO_BR_ACCEPTED: "pro.br.accepted",
  PRO_BR_REJECTED: "pro.br.rejected",
  PRO_BR_EBR_DISCARDED: "pro.br.ebr_discarded",
  PRO_BOOKING_CANCELLED: "pro.booking.cancelled",
  PRO_BOOKING_CONFIRMED: "pro.booking.confirmed",
  PRO_BOOKING_COMPLETED: "pro.booking.completed",
  PRO_BOOKING_IN_PROGRESS: "pro.booking.in_progress",
  PRO_BOOKING_NO_SHOW: "pro.booking.no_show",
  PRO_BOOKING_DATE_CHANGED: "pro.booking.date_changed",
  PRO_BOOKING_TIME_CHANGED: "pro.booking.time_changed",
  PRO_BOOKING_SERVICE_EDITED: "pro.booking.service_edited",
  PRO_BOOKING_UNIQUE_ITEM_EDITED: "pro.booking.unique_item_edited",
  PRO_PREPAYMENT_RECEIVED: "pro.payment.prepayment_received",
  PRO_ER_INCOMING: "pro.er.incoming",
  PRO_ER_ACCEPTED: "pro.er.accepted",
  PRO_ER_REJECTED: "pro.er.rejected",
  PRO_REMINDER_RESPOND: "pro.reminder.respond_request",
  CLIENT_BR_ACCEPTED: "client.br.accepted",
  CLIENT_BR_REJECTED: "client.br.rejected",
  CLIENT_BR_EBR_DISCARDED: "client.br.ebr_discarded",
  CLIENT_BR_INCOMING: "client.br.incoming",
  CLIENT_BR_SENT: "client.br.sent",
  CLIENT_BOOKING_CONFIRMED: "client.booking.confirmed",
  CLIENT_BOOKING_CANCELLED: "client.booking.cancelled",
  CLIENT_BOOKING_COMPLETED: "client.booking.completed",
  CLIENT_BOOKING_IN_PROGRESS: "client.booking.in_progress",
  CLIENT_BOOKING_NO_SHOW: "client.booking.no_show",
  CLIENT_BOOKING_DATE_CHANGED: "client.booking.date_changed",
  CLIENT_BOOKING_TIME_CHANGED: "client.booking.time_changed",
  CLIENT_BOOKING_SERVICE_EDITED: "client.booking.service_edited",
  CLIENT_BOOKING_UNIQUE_ITEM_EDITED: "client.booking.unique_item_edited",
  CLIENT_PREPAYMENT_RECEIVED: "client.payment.prepayment_received",
  CLIENT_PAYMENT_DUE_SET: "client.payment.due_set",
  CLIENT_PAYMENT_DUE: "client.payment.due",
  CLIENT_PAYMENT_OVERDUE: "client.payment.overdue",
  CLIENT_INVOICE_REISSUED: "client.invoice.reissued",
  CLIENT_INVOICE_REMINDER_1: "client.invoice.reminder_1",
  CLIENT_INVOICE_REMINDER_2: "client.invoice.reminder_2",
  CLIENT_ER_INCOMING: "client.er.incoming",
  CLIENT_ER_SUGGESTED: "client.er.suggested",
  CLIENT_ER_ACCEPTED: "client.er.accepted",
  CLIENT_ER_REJECTED: "client.er.rejected",
  CLIENT_REMINDER_APPOINTMENT: "client.reminder.appointment",
};

export const BOOKING_NOTIFICATION_EVENTS = {
  SUGGEST_FOR_CHANGE: "suggest_for_change",
  EDIT_REQUEST_OUTGOING: "edit_request_outgoing",
  BOOKING_DATE_CHANGED: "booking_date_changed",
  TIME_CHANGED: "time_changed",
  SERVICE_EDITED: "service_edited",
  UNIQUE_ITEM_EDITED: "unique_item_edited",
  EBR_DISCARDED: "ebr_discarded",
  INCOMING_ER: "incoming_er",
  ER_ACCEPTED: "er_accepted",
  ER_REJECTED: "er_rejected",
  PAYMENT_DUE_SET: "payment_due_set",
};

const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.PRO_BR_INCOMING]: {
    title: "New Booking Request",
    statusType: "pending",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BR_ACCEPTED]: {
    title: "Booking Request Accepted",
    statusType: "accepted",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BR_REJECTED]: {
    title: "Booking Request Rejected",
    statusType: "rejected",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BR_EBR_DISCARDED]: {
    title: "EBR Discarded",
    statusType: "rejected",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_ER_INCOMING]: {
    title: "Incoming Edit Request",
    statusType: "pending",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_ER_ACCEPTED]: {
    title: "Edit Request Accepted",
    statusType: "accepted",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_ER_REJECTED]: {
    title: "Edit Request Rejected",
    statusType: "rejected",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_DATE_CHANGED]: {
    title: "Booking Date Changed",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_TIME_CHANGED]: {
    title: "Time Changed by Client",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_SERVICE_EDITED]: {
    title: "Service Edited by Client",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_UNIQUE_ITEM_EDITED]: {
    title: "Unique Item Edited by Client",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_CANCELLED]: {
    title: "Booking Cancelled",
    statusType: "rejected",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_CONFIRMED]: {
    title: "Booking Confirmed",
    statusType: "accepted",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_COMPLETED]: {
    title: "Booking Completed",
    statusType: "accepted",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_IN_PROGRESS]: {
    title: "Booking In Progress",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_BOOKING_NO_SHOW]: {
    title: "No Show Marked",
    statusType: "updated",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_PREPAYMENT_RECEIVED]: {
    title: "Prepayment Received",
    statusType: "accepted",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.PRO_REMINDER_RESPOND]: {
    title: "Respond to Booking Request",
    statusType: "pending",
    audience: "professional",
  },
  [NOTIFICATION_TYPES.CLIENT_BR_ACCEPTED]: {
    title: "Booking Request Accepted",
    statusType: "accepted",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BR_REJECTED]: {
    title: "Booking Request Rejected",
    statusType: "rejected",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BR_EBR_DISCARDED]: {
    title: "EBR Discarded",
    statusType: "rejected",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BR_INCOMING]: {
    title: "New Booking Request",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BR_SENT]: {
    title: "Booking Request Sent",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_ER_SUGGESTED]: {
    title: "Suggest for Change",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_ER_ACCEPTED]: {
    title: "Edit Request Accepted",
    statusType: "accepted",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_ER_REJECTED]: {
    title: "Edit Request Rejected",
    statusType: "rejected",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_DATE_CHANGED]: {
    title: "Booking Date Changed",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_TIME_CHANGED]: {
    title: "Time Changed by Professional",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_SERVICE_EDITED]: {
    title: "Service Edited by Professional",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_UNIQUE_ITEM_EDITED]: {
    title: "Unique Item Edited by Professional",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE_SET]: {
    title: "Payment Due Date Set",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE]: {
    title: "Payment Due",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_PAYMENT_OVERDUE]: {
    title: "Payment Overdue",
    statusType: "rejected",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_INVOICE_REISSUED]: {
    title: "Invoice Reissued",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_INVOICE_REMINDER_1]: {
    title: "Invoice Payment Reminder",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_INVOICE_REMINDER_2]: {
    title: "Invoice Payment Reminder",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_CONFIRMED]: {
    title: "Booking Confirmed",
    statusType: "accepted",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_CANCELLED]: {
    title: "Booking Cancelled",
    statusType: "rejected",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_COMPLETED]: {
    title: "Booking Completed",
    statusType: "accepted",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_IN_PROGRESS]: {
    title: "Booking In Progress",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_BOOKING_NO_SHOW]: {
    title: "No Show Marked",
    statusType: "updated",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_PREPAYMENT_RECEIVED]: {
    title: "Prepayment Made Successfully",
    statusType: "accepted",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_ER_INCOMING]: {
    title: "Incoming Edit Request",
    statusType: "pending",
    audience: "client",
  },
  [NOTIFICATION_TYPES.CLIENT_REMINDER_APPOINTMENT]: {
    title: "Appointment Reminder",
    statusType: "updated",
    audience: "client",
  },
};

const formatBookingRefLabel = (uniqueCode) => {
  const code = String(uniqueCode ?? "").trim();
  if (!code) return "Booking";
  return code.toUpperCase().startsWith("BK-") ? code : `#${code}`;
};

const loadBookingNotificationContext = async (bookingId) => {
  const result = await query(
    `SELECT
       b.id,
       b.unique_code,
       b.status,
       b.prepayment_status,
       b.customer_id,
       b.business_setup_id,
       pp.user_id AS professional_user_id,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Salon') AS salon_name,
       COALESCE(
         NULLIF(TRIM(pp.legal_name), ''),
         NULLIF(TRIM(CONCAT(COALESCE(pp.contact_first_name, ''), ' ', COALESCE(pp.contact_last_name, ''))), ''),
         NULLIF(bs.salon_name, ''),
         NULLIF(bs.business_name, ''),
         'Professional'
       ) AS professional_name,
       COALESCE(NULLIF(tm.full_name, ''), NULL) AS team_member_name,
       COALESCE(
         CASE
           WHEN cu.user_type = 'company' THEN NULLIF(TRIM(cp.legal_name), '')
           ELSE NULLIF(TRIM(CONCAT_WS(' ', ip.first_name, ip.last_name)), '')
         END,
         NULLIF(TRIM(ip.display_name), ''),
         NULLIF(TRIM(cp.legal_name), ''),
         NULLIF(TRIM(CONCAT_WS(' ', cp.contact_first_name, cp.contact_last_name)), ''),
         cu.email,
         'Client'
       ) AS client_name
     FROM bookings b
     INNER JOIN business_setups bs ON bs.id = b.business_setup_id
     INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
     LEFT JOIN business_team_members tm ON tm.id = b.team_member_id
     LEFT JOIN users cu ON cu.id = b.customer_id
     LEFT JOIN individual_profiles ip ON ip.user_id = cu.id
     LEFT JOIN company_profiles cp ON cp.user_id = cu.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId],
  );
  return result.rows[0] ?? null;
};

export const createInAppNotification = async ({
  recipientUserId,
  notificationType,
  bookingId = null,
  bookingRef = null,
  actorName = null,
  message = null,
  href = null,
  skipEmail = false,
}) => {
  const meta = NOTIFICATION_META[notificationType];
  if (!meta || !recipientUserId) return null;

  const result = await query(
    `INSERT INTO in_app_notifications (
       recipient_user_id,
       audience,
       notification_type,
       title,
       message,
       status_type,
       booking_id,
       booking_ref,
       actor_name,
       href
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      recipientUserId,
      meta.audience,
      notificationType,
      meta.title,
      message,
      meta.statusType,
      bookingId,
      bookingRef,
      actorName,
      href,
    ],
  );

  const row = result.rows[0];
  emitNotificationChanged(recipientUserId);

  if (!skipEmail) {
    void sendInAppNotificationEmail({
      recipientUserId,
      notificationType,
      title: meta.title,
      message,
      bookingId,
      bookingRef,
      href,
      actorName,
      audience: meta.audience,
    });
  }

  return row;
};

const clientHref = (uniqueCode) =>
  `/clients/booking/checkout?ref=${encodeURIComponent(String(uniqueCode ?? ""))}`;

const proHref = (uniqueCode) => {
  const code = String(uniqueCode ?? "").trim();
  if (!code) return "/professionals/calendar";
  return `/professionals/calendar?bookingRef=${encodeURIComponent(code)}&open=1`;
};
async function notifyClientInApp(ctx, notificationType, actorName, extras = {}) {
  if (!ctx?.customer_id) return;
  await createInAppNotification({
    recipientUserId: ctx.customer_id,
    notificationType,
    bookingId: ctx.id,
    bookingRef: ctx.unique_code,
    actorName: actorName ?? ctx.professional_name,
    message: extras.message ?? null,
    href: clientHref(ctx.unique_code),
    skipEmail: extras.skipEmail === true,
  });
}

async function notifyProfessionalInApp(ctx, notificationType, actorName, extras = {}) {
  if (!ctx?.professional_user_id) return;
  await createInAppNotification({
    recipientUserId: ctx.professional_user_id,
    notificationType,
    bookingId: ctx.id,
    bookingRef: ctx.unique_code,
    actorName: actorName ?? ctx.client_name,
    message: extras.message ?? null,
    href: proHref(ctx.unique_code),
    skipEmail: extras.skipEmail === true,
  });
}

const resolveInitiatedBy = (initiatedBy, fallback = "professional") => {
  const value = String(initiatedBy ?? fallback).trim().toLowerCase();
  return value === "client" ? "client" : "professional";
};

/** Map auth user_type / query to in-app notification audience. */
export const resolveNotificationAudience = (userTypeOrAudience) => {
  const value = String(userTypeOrAudience ?? "").trim().toLowerCase();
  if (value === "professional") return "professional";
  if (value === "client" || value === "individual" || value === "company") return "client";
  return null;
};

export async function dispatchBookingEventNotification(bookingId, event, options = {}) {
  if (!bookingId || !event) return;
  const ctx = await loadBookingNotificationContext(bookingId);
  if (!ctx) return;

  const initiatedBy = resolveInitiatedBy(options.initiatedBy);
  const normalizedEvent = String(event).trim().toLowerCase();

  switch (normalizedEvent) {
    case BOOKING_NOTIFICATION_EVENTS.SUGGEST_FOR_CHANGE:
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_ER_SUGGESTED, ctx.professional_name);
      break;
    case BOOKING_NOTIFICATION_EVENTS.EDIT_REQUEST_OUTGOING:
      await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_ER_INCOMING, ctx.client_name);
      break;
    case BOOKING_NOTIFICATION_EVENTS.BOOKING_DATE_CHANGED:
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_DATE_CHANGED, ctx.client_name);
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_DATE_CHANGED, ctx.professional_name);
      }
      break;
    case BOOKING_NOTIFICATION_EVENTS.TIME_CHANGED:
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_TIME_CHANGED, ctx.client_name);
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_TIME_CHANGED, ctx.professional_name);
      }
      break;
    case BOOKING_NOTIFICATION_EVENTS.SERVICE_EDITED:
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_SERVICE_EDITED, ctx.client_name);
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_SERVICE_EDITED, ctx.professional_name);
      }
      break;
    case BOOKING_NOTIFICATION_EVENTS.UNIQUE_ITEM_EDITED:
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_UNIQUE_ITEM_EDITED, ctx.client_name);
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_UNIQUE_ITEM_EDITED, ctx.professional_name);
      }
      break;
    case BOOKING_NOTIFICATION_EVENTS.EBR_DISCARDED:
      // Notify the other party only — initiator already knows they discarded.
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_EBR_DISCARDED, ctx.client_name, {
          message: `${ctx.client_name} discarded the edit booking request.`,
        });
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_EBR_DISCARDED, ctx.professional_name, {
          message: `${ctx.professional_name} discarded the edit booking request.`,
        });
      }
      break;
    case BOOKING_NOTIFICATION_EVENTS.INCOMING_ER:
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_ER_INCOMING, ctx.professional_name, {
        message: `${ctx.professional_name} sent an edit request.`,
      });
      break;
    case BOOKING_NOTIFICATION_EVENTS.ER_ACCEPTED: {
      // Notify the ER sender only — responder already accepted.
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_ER_ACCEPTED, ctx.client_name, {
          message: `${ctx.client_name} accepted your edit request.`,
        });
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_ER_ACCEPTED, ctx.professional_name, {
          message: `${ctx.professional_name} accepted your edit request.`,
        });
      }
      break;
    }
    case BOOKING_NOTIFICATION_EVENTS.ER_REJECTED: {
      // Notify the ER sender only — responder already rejected.
      if (initiatedBy === "client") {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_ER_REJECTED, ctx.client_name, {
          message: `${ctx.client_name} rejected your edit request.`,
        });
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_ER_REJECTED, ctx.professional_name, {
          message: `${ctx.professional_name} rejected your edit request.`,
        });
      }
      break;
    }
    case BOOKING_NOTIFICATION_EVENTS.PAYMENT_DUE_SET:
      if (ctx.customer_id) {
        await createInAppNotification({
          recipientUserId: ctx.customer_id,
          notificationType: NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE_SET,
          bookingId: ctx.id,
          bookingRef: ctx.unique_code,
          actorName: ctx.professional_name,
          message: options.message ?? null,
          href: clientHref(ctx.unique_code),
        });
      }
      break;
    default:
      break;
  }
}

export async function dispatchBookingCreatedNotifications(booking, options = {}) {
  if (!booking?.id) return;
  const ctx = await loadBookingNotificationContext(booking.id);
  if (!ctx) {
    console.error("[booking-notification] missing context for booking", booking.id);
    return;
  }

  if (booking.status === "requested") {
    // Professional → client BR (calendar "Add from Mollure platform")
    if (options.fromProfessional) {
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_INCOMING, ctx.professional_name, {
        message: `${ctx.professional_name} sent you a booking request.`,
      });
      return;
    }
    // Client → professional BR
    await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_INCOMING, ctx.client_name, {
      message: `${ctx.client_name} sent you a booking request.`,
    });
    await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_SENT, ctx.professional_name, {
      message: `Your booking request was sent to ${ctx.professional_name}.`,
    });
  }

  if (booking.status === "confirmed") {
    await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_CONFIRMED, ctx.professional_name, {
      message: `Your booking with ${ctx.professional_name} is confirmed.`,
    });
    await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_CONFIRMED, ctx.client_name, {
      message: `Booking with ${ctx.client_name} is confirmed.`,
    });
  }
}

export async function dispatchBookingUpdatedNotifications(booking, previousStatus, previousPrepayment, options = {}) {
  if (!booking?.id) return;
  const ctx = await loadBookingNotificationContext(booking.id);
  if (!ctx) return;

  const statusChanged = previousStatus !== booking.status;
  const prepaymentChanged = previousPrepayment !== booking.prepayment_status;
  const prepaymentPaid =
    prepaymentChanged && String(booking.prepayment_status ?? "").toLowerCase() === "paid";

  if (prepaymentPaid) {
    await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_PREPAYMENT_RECEIVED, ctx.professional_name, {
      message: "Prepayment made successfully.",
    });
    await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_PREPAYMENT_RECEIVED, ctx.client_name, {
      message: `Prepayment received from ${ctx.client_name}.`,
    });
  }

  if (statusChanged) {
    if (options.notificationEvent) {
      await dispatchBookingEventNotification(booking.id, options.notificationEvent, {
        initiatedBy: options.initiatedBy,
        message: options.message,
      });
      if (options.notificationEvent === BOOKING_NOTIFICATION_EVENTS.EBR_DISCARDED) {
        return;
      }
    }

    if (booking.status === "confirmed") {
      const initiatedBy = resolveInitiatedBy(options.initiatedBy);
      if (previousStatus === "requested") {
        // Notify the other party only — initiator already accepted.
        if (initiatedBy === "client") {
          await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_ACCEPTED, ctx.client_name, {
            message: `${ctx.client_name} accepted your booking request.`,
          });
          await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_CONFIRMED, ctx.client_name, {
            skipEmail: true,
          });
        } else {
          await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_ACCEPTED, ctx.professional_name, {
            message: `${ctx.professional_name} accepted your booking request.`,
            skipEmail: true,
          });
          await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_CONFIRMED, ctx.professional_name);
        }
      } else {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_CONFIRMED, ctx.professional_name);
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_CONFIRMED, ctx.client_name);
      }
      return;
    }

    // Professional (or client) reject of a pending BR sets status to `invalid`.
    // Older flows used `cancelled` — keep both so reject always notifies + emails.
    if (booking.status === "invalid") {
      if (
        previousStatus === "requested" &&
        options.notificationEvent !== BOOKING_NOTIFICATION_EVENTS.EBR_DISCARDED
      ) {
        const initiatedBy = resolveInitiatedBy(options.initiatedBy);
        // Notify the other party only — initiator already knows they rejected.
        if (initiatedBy === "client") {
          await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_REJECTED, ctx.client_name, {
            message: `${ctx.client_name} rejected your booking request.`,
          });
        } else {
          await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_REJECTED, ctx.professional_name, {
            message: `${ctx.professional_name} rejected your booking request.`,
          });
        }
      }
      return;
    }

    if (booking.status === "cancelled") {
      const initiatedBy = resolveInitiatedBy(options.initiatedBy);
      if (previousStatus === "requested" && options.notificationEvent !== BOOKING_NOTIFICATION_EVENTS.EBR_DISCARDED) {
        // Legacy reject path (requested → cancelled) — honor initiatedBy.
        if (initiatedBy === "client") {
          await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_REJECTED, ctx.client_name, {
            message: `${ctx.client_name} rejected your booking request.`,
          });
        } else {
          await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_REJECTED, ctx.professional_name, {
            message: `${ctx.professional_name} rejected your booking request.`,
          });
        }
      } else if (options.notificationEvent !== BOOKING_NOTIFICATION_EVENTS.EBR_DISCARDED) {
        // Notify the other party only — initiator already canceled.
        if (initiatedBy === "client") {
          await notifyProfessionalInApp(
            ctx,
            NOTIFICATION_TYPES.PRO_BOOKING_CANCELLED,
            ctx.client_name,
            {
              message: `${ctx.client_name} canceled the booking.`,
            },
          );
        } else {
          await notifyClientInApp(
            ctx,
            NOTIFICATION_TYPES.CLIENT_BOOKING_CANCELLED,
            ctx.professional_name,
            {
              message: `${ctx.professional_name} canceled the booking.`,
            },
          );
        }
      }
      return;
    }

    if (booking.status === "completed") {
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_COMPLETED, ctx.professional_name, {
        message: `Your booking with ${ctx.professional_name} is completed.`,
      });
      await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BOOKING_COMPLETED, ctx.client_name, {
        message: `Booking with ${ctx.client_name} is completed.`,
      });
      try {
        const { notifyReviewInvite } = await import("./bookingEmail.service.js");
        await notifyReviewInvite(booking.id);
      } catch (error) {
        console.error("[booking-notification] review invite failed:", error.message);
      }
      return;
    }

    if (booking.status === "in_progress") {
      // Professional marks in-progress — notify client.
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_IN_PROGRESS, ctx.professional_name, {
        message: `Your booking with ${ctx.professional_name} is now in progress.`,
      });
      return;
    }

    if (booking.status === "no_show") {
      // Professional marks no-show — notify client.
      await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BOOKING_NO_SHOW, ctx.professional_name, {
        message: `${ctx.professional_name} marked your booking as no-show.`,
      });
      return;
    }

    if (booking.status === "requested" && previousStatus !== "requested") {
      const initiatedBy = resolveInitiatedBy(options.initiatedBy);
      if (initiatedBy === "professional") {
        await notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_BR_INCOMING, ctx.professional_name, {
          message: `${ctx.professional_name} sent you a booking request.`,
        });
      } else {
        await notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_BR_INCOMING, ctx.client_name, {
          message: `${ctx.client_name} sent you a booking request.`,
        });
      }
      return;
    }
  }

  if (options.notifyIncomingEr) {
    await dispatchBookingEventNotification(booking.id, BOOKING_NOTIFICATION_EVENTS.INCOMING_ER, {
      initiatedBy: "professional",
    });
  }
}

export async function dispatchAppointmentReminderNotification(bookingId) {
  const ctx = await loadBookingNotificationContext(bookingId);
  if (!ctx?.customer_id) return;
  return notifyClientInApp(ctx, NOTIFICATION_TYPES.CLIENT_REMINDER_APPOINTMENT, ctx.professional_name);
}

export async function dispatchRespondRequestReminderNotification(bookingId) {
  const ctx = await loadBookingNotificationContext(bookingId);
  if (!ctx?.professional_user_id) return;
  return notifyProfessionalInApp(ctx, NOTIFICATION_TYPES.PRO_REMINDER_RESPOND, ctx.client_name);
}

const REMINDER_WINDOW_MINUTES = Number(process.env.BOOKING_REMINDER_WINDOW_MINUTES || 5);
const REMINDER_HOURS_BEFORE = Number(process.env.BOOKING_REMINDER_HOURS_BEFORE || 2);
const RESPOND_REMINDER_HOURS = Number(process.env.BOOKING_RESPOND_REMINDER_HOURS || 24);

export async function processAppointmentReminderNotifications() {
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
    const outcome = await dispatchAppointmentReminderNotification(row.id);
    outcomes.push({ bookingId: row.id, ...outcome });
  }
  return outcomes;
}

export async function processRespondRequestReminderNotifications() {
  const result = await query(
    `SELECT
       b.id,
       b.created_at,
       b.notes,
       bs.response_time_hours,
       bs.response_time_minutes
     FROM bookings b
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     WHERE b.status = 'requested'
       AND NOT EXISTS (
         SELECT 1
         FROM booking_email_notifications n
         WHERE n.booking_id = b.id
           AND n.email_type = $1
       )`,
    [BOOKING_EMAIL_TYPES.RESPOND_REQUEST_REMINDER],
  );

  const now = Date.now();
  const outcomes = [];
  for (const row of result.rows) {
    let dueMs = null;
    const notes = String(row.notes ?? "");
    const marker = notes.indexOf("---mollure-meta---");
    if (marker !== -1) {
      try {
        const meta = JSON.parse(notes.slice(marker + "---mollure-meta---".length).trim() || "{}");
        if (meta?.respondBy) {
          const parsed = Date.parse(meta.respondBy);
          if (Number.isFinite(parsed)) dueMs = parsed;
        } else if (meta?.responseStartedAt && Number(meta.responseWindowMinutes) > 0) {
          const start = Date.parse(meta.responseStartedAt);
          if (Number.isFinite(start)) {
            dueMs = start + Number(meta.responseWindowMinutes) * 60_000;
          }
        }
      } catch {
        // fall through to setup / env window
      }
    }

    if (dueMs == null) {
      const hours = Number(row.response_time_hours);
      const minutes = Number(row.response_time_minutes);
      const windowMinutes =
        (Number.isFinite(hours) && hours > 0 ? hours * 60 : 0) +
        (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
      const effectiveMinutes =
        windowMinutes > 0 ? windowMinutes : RESPOND_REMINDER_HOURS * 60;
      const created = Date.parse(row.created_at);
      if (!Number.isFinite(created)) continue;
      dueMs = created + effectiveMinutes * 60_000;
    }

    // Fire reminder near the end of the window (same timing as overdue stamp).
    if (now < dueMs) continue;

    const outcome = await dispatchRespondRequestReminderNotification(row.id);
    outcomes.push({ bookingId: row.id, ...outcome });
  }
  return outcomes;
}

const loadFinanceNotificationContext = async (transactionId) => {
  const result = await query(
    `SELECT
       ft.id,
       ft.booking_id,
       ft.status,
       ft.document,
       b.id AS booking_uuid,
       b.customer_id,
       COALESCE(NULLIF(bs.salon_name, ''), NULLIF(bs.business_name, ''), 'Salon') AS salon_name
     FROM finance_transactions ft
     LEFT JOIN bookings b ON b.unique_code = ft.booking_id
     LEFT JOIN business_setups bs ON bs.id = b.business_setup_id
     WHERE ft.id = $1
     LIMIT 1`,
    [transactionId],
  );
  return result.rows[0] ?? null;
};

const hasInAppNotification = async (recipientUserId, notificationType, bookingRef) => {
  const result = await query(
    `SELECT 1
     FROM in_app_notifications
     WHERE recipient_user_id = $1
       AND notification_type = $2
       AND booking_ref IS NOT DISTINCT FROM $3
     LIMIT 1`,
    [recipientUserId, notificationType, bookingRef ?? null],
  );
  return result.rowCount > 0;
};

export async function dispatchPaymentDueSetNotification(transactionId, dueDateLabel) {
  const ctx = await loadFinanceNotificationContext(transactionId);
  if (!ctx?.customer_id || !ctx.booking_uuid) return;

  const alreadySent = await hasInAppNotification(
    ctx.customer_id,
    NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE_SET,
    ctx.booking_id,
  );
  if (alreadySent) return;

  await createInAppNotification({
    recipientUserId: ctx.customer_id,
    notificationType: NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE_SET,
    bookingId: ctx.booking_uuid,
    bookingRef: ctx.booking_id,
    actorName: ctx.salon_name,
    message: dueDateLabel ? `Due date: ${dueDateLabel}` : null,
    href: clientHref(ctx.booking_id),
  });
}

/** Always notify client when invoice is reissued / due date is extended. */
export async function dispatchInvoiceReissuedNotification(transactionId, dueDateLabel) {
  const ctx = await loadFinanceNotificationContext(transactionId);
  if (!ctx?.customer_id || !ctx.booking_uuid) return null;

  // Rich finance email is sent by the reissue controller — skip companion duplicate.
  return createInAppNotification({
    recipientUserId: ctx.customer_id,
    notificationType: NOTIFICATION_TYPES.CLIENT_INVOICE_REISSUED,
    bookingId: ctx.booking_uuid,
    bookingRef: ctx.booking_id,
    actorName: ctx.salon_name,
    message: dueDateLabel
      ? `Your invoice was reissued. New due date: ${dueDateLabel}`
      : "Your invoice was reissued with a new due date.",
    href: clientHref(ctx.booking_id),
    skipEmail: true,
  });
}

/**
 * In-app companion for settings-based Reminder 1 / Reminder 2 emails.
 * @param {"reminder1"|"reminder2"} reminderKey
 */
export async function dispatchInvoiceScheduledReminderNotification(
  transactionId,
  reminderKey,
  dueDateLabel,
) {
  const ctx = await loadFinanceNotificationContext(transactionId);
  if (!ctx?.customer_id || !ctx.booking_uuid) return null;

  const notificationType =
    reminderKey === "reminder2"
      ? NOTIFICATION_TYPES.CLIENT_INVOICE_REMINDER_2
      : NOTIFICATION_TYPES.CLIENT_INVOICE_REMINDER_1;

  const doc = ctx.document ?? {};
  const dueIso = doc.dueDate ? String(doc.dueDate).slice(0, 10) : "";
  const message = dueDateLabel
    ? `Payment reminder — due date: ${dueDateLabel}`
    : dueIso
      ? `Payment reminder — due date: ${dueIso.split("-").reverse().join("/")}`
      : "Your invoice payment is coming due soon.";

  // Allow the same reminder slot again after a reissue (new due date).
  const existing = await query(
    `SELECT 1
     FROM in_app_notifications
     WHERE recipient_user_id = $1
       AND notification_type = $2
       AND booking_ref IS NOT DISTINCT FROM $3
       AND message IS NOT DISTINCT FROM $4
     LIMIT 1`,
    [ctx.customer_id, notificationType, ctx.booking_id, message],
  );
  if (existing.rowCount > 0) return null;

  return createInAppNotification({
    recipientUserId: ctx.customer_id,
    notificationType,
    bookingId: ctx.booking_uuid,
    bookingRef: ctx.booking_id,
    actorName: ctx.salon_name,
    message,
    href: clientHref(ctx.booking_id),
    skipEmail: true,
  });
}

export async function processPaymentOverdueNotifications() {
  const overdueResult = await query(
    `UPDATE finance_transactions ft
     SET status = 'Overdue',
         updated_at = NOW()
     WHERE ft.status = 'Payment due'
       AND (ft.document->>'dueDate') IS NOT NULL
       AND (ft.document->>'dueDate')::date < CURRENT_DATE
     RETURNING ft.id, ft.booking_id`,
  );

  for (const row of overdueResult.rows) {
    const ctx = await loadFinanceNotificationContext(row.id);
    if (!ctx?.customer_id || !ctx.booking_uuid) continue;

    const alreadySent = await hasInAppNotification(
      ctx.customer_id,
      NOTIFICATION_TYPES.CLIENT_PAYMENT_OVERDUE,
      ctx.booking_id,
    );
    if (alreadySent) continue;

    await createInAppNotification({
      recipientUserId: ctx.customer_id,
      notificationType: NOTIFICATION_TYPES.CLIENT_PAYMENT_OVERDUE,
      bookingId: ctx.booking_uuid,
      bookingRef: ctx.booking_id,
      actorName: ctx.salon_name,
      message: "Your payment is now overdue.",
      href: clientHref(ctx.booking_id),
      skipEmail: true,
    });
    void sendFinanceClientEmail(row.id, FINANCE_EMAIL_TYPES.INVOICE_POST_DUE);
  }

  return overdueResult.rowCount;
}

export async function processPaymentDueReminders() {
  const dueTodayResult = await query(
    `SELECT ft.id
     FROM finance_transactions ft
     WHERE ft.status IN ('Payment due', 'Pending')
       AND (ft.document->>'dueDate') IS NOT NULL
       AND (ft.document->>'dueDate')::date = CURRENT_DATE`,
  );

  let sent = 0;
  for (const row of dueTodayResult.rows) {
    const ctx = await loadFinanceNotificationContext(row.id);
    if (!ctx?.customer_id || !ctx.booking_uuid) continue;

    const alreadySent = await hasInAppNotification(
      ctx.customer_id,
      NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE,
      ctx.booking_id,
    );
    if (alreadySent) continue;

    await createInAppNotification({
      recipientUserId: ctx.customer_id,
      notificationType: NOTIFICATION_TYPES.CLIENT_PAYMENT_DUE,
      bookingId: ctx.booking_uuid,
      bookingRef: ctx.booking_id,
      actorName: ctx.salon_name,
      message: "Payment is due today.",
      href: clientHref(ctx.booking_id),
      skipEmail: true,
    });
    void sendFinanceClientEmail(row.id, FINANCE_EMAIL_TYPES.INVOICE_PRE_DUE, {
      forceKey: "due_today",
    });
    sent += 1;
  }

  return sent;
}

export const listNotificationsForUser = async (
  userId,
  { limit = 50, offset = 0, audience = null } = {},
) => {
  const params = [userId];
  let audienceClause = "";
  if (audience === "client" || audience === "professional") {
    params.push(audience);
    audienceClause = ` AND audience = $${params.length}`;
  }
  params.push(limit, offset);
  const result = await query(
    `SELECT *
     FROM in_app_notifications
     WHERE recipient_user_id = $1${audienceClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
};

export const countNotificationsForUser = async (userId, { audience = null } = {}) => {
  const params = [userId];
  let audienceClause = "";
  if (audience === "client" || audience === "professional") {
    params.push(audience);
    audienceClause = ` AND audience = $${params.length}`;
  }
  const result = await query(
    `SELECT COUNT(*)::int AS total
     FROM in_app_notifications
     WHERE recipient_user_id = $1${audienceClause}`,
    params,
  );
  return result.rows[0]?.total ?? 0;
};

export const countUnreadNotifications = async (userId, { audience = null } = {}) => {
  const params = [userId];
  let audienceClause = "";
  if (audience === "client" || audience === "professional") {
    params.push(audience);
    audienceClause = ` AND audience = $${params.length}`;
  }
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM in_app_notifications
     WHERE recipient_user_id = $1
       AND read_at IS NULL${audienceClause}`,
    params,
  );
  return result.rows[0]?.count ?? 0;
};

export const markNotificationRead = async (userId, notificationId) => {
  const result = await query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE id = $1
       AND recipient_user_id = $2
       AND read_at IS NULL
     RETURNING *`,
    [notificationId, userId],
  );
  if (result.rows[0]) {
    emitNotificationChanged(userId);
    return result.rows[0];
  }

  const existing = await query(
    `SELECT *
     FROM in_app_notifications
     WHERE id = $1
       AND recipient_user_id = $2
     LIMIT 1`,
    [notificationId, userId],
  );
  return existing.rows[0] ?? null;
};

export const markAllNotificationsRead = async (userId, { audience = null } = {}) => {
  const params = [userId];
  let audienceClause = "";
  if (audience === "client" || audience === "professional") {
    params.push(audience);
    audienceClause = ` AND audience = $${params.length}`;
  }
  await query(
    `UPDATE in_app_notifications
     SET read_at = NOW()
     WHERE recipient_user_id = $1
       AND read_at IS NULL${audienceClause}`,
    params,
  );
  emitNotificationChanged(userId);
};

const resolveStoredNotificationTitle = (row) => {
  const type = String(row?.notification_type ?? "");
  if (type === NOTIFICATION_TYPES.CLIENT_PREPAYMENT_RECEIVED) {
    return "Prepayment Made Successfully";
  }
  if (type === NOTIFICATION_TYPES.PRO_PREPAYMENT_RECEIVED) {
    return "Prepayment Received";
  }
  return row?.title ?? "";
};

export const mapNotificationRow = (row) => ({
  id: row.id,
  audience: row.audience,
  notificationType: row.notification_type,
  title: resolveStoredNotificationTitle(row),
  message: row.message,
  statusType: row.status_type,
  bookingId: row.booking_id,
  bookingRef: row.booking_ref,
  actorName: row.actor_name,
  href: row.href,
  read: Boolean(row.read_at),
  createdAt: row.created_at,
  bookingIdLabel: row.booking_ref
    ? `Booking ID: ${formatBookingRefLabel(row.booking_ref)}`
    : row.booking_id
      ? `Booking ID: ${row.booking_id}`
      : null,
  timeLabel: row.created_at
    ? new Date(row.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "",
});
