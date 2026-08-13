import { parseUuid } from "../utils/uuid.js";
import {
  countNotificationsForUser,
  countUnreadNotifications,
  listNotificationsForUser,
  mapNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
  resolveNotificationAudience,
} from "../services/bookingNotification.service.js";
import { listResponse, parseListPagination } from "../utils/pagination.js";

const audienceFromRequest = (req) => {
  const fromQuery = resolveNotificationAudience(req.query?.audience);
  if (fromQuery) return fromQuery;
  return resolveNotificationAudience(req.user?.user_type) ?? "client";
};

export const listMyNotifications = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query, { defaultLimit: 50 });
    const audience = audienceFromRequest(req);

    const total = await countNotificationsForUser(req.user.id, { audience });

    const rows = await listNotificationsForUser(req.user.id, {
      limit: pagination.paginate ? pagination.limit : Math.max(total, 50),
      offset: pagination.paginate ? pagination.offset : 0,
      audience,
    });

    return res.status(200).json(
      listResponse({
        message: "Notifications fetched successfully.",
        data: rows.map(mapNotificationRow),
        page: pagination.page,
        limit: pagination.limit,
        total,
        paginate: pagination.paginate,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      data: { error: error.message },
    });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const audience = audienceFromRequest(req);
    const count = await countUnreadNotifications(req.user.id, { audience });
    return res.status(200).json({
      success: true,
      message: "Unread count fetched successfully.",
      data: { count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count.",
      data: { error: error.message },
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = parseUuid(req.params.id);
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id.",
        data: null,
      });
    }

    const row = await markNotificationRead(req.user.id, notificationId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: mapNotificationRow(row),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      data: { error: error.message },
    });
  }
};

export const markAllMyNotificationsRead = async (req, res) => {
  try {
    const audience = audienceFromRequest(req);
    await markAllNotificationsRead(req.user.id, { audience });
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      data: { error: error.message },
    });
  }
};
