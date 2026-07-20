import { parseUuid } from "../utils/uuid.js";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  mapNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/bookingNotification.service.js";
import { listResponse, parseListPagination } from "../utils/pagination.js";
import { query } from "../db/index.js";

export const listMyNotifications = async (req, res) => {
  try {
    const pagination = parseListPagination(req.query, { defaultLimit: 50 });

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM in_app_notifications
       WHERE recipient_user_id = $1`,
      [req.user.id],
    );
    const total = countResult.rows[0]?.total ?? 0;

    const rows = await listNotificationsForUser(req.user.id, {
      limit: pagination.paginate ? pagination.limit : Math.max(total, 50),
      offset: pagination.paginate ? pagination.offset : 0,
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
    const count = await countUnreadNotifications(req.user.id);
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
    await markAllNotificationsRead(req.user.id);
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
