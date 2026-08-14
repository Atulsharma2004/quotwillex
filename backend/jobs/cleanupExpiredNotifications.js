import Notification, { notificationCutoffDate } from "../models/Notification.js";

/**
 * Permanently delete in-app notifications older than 5 days.
 */
export const cleanupExpiredNotifications = async () => {
  const cutoff = notificationCutoffDate();
  const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });
  const deleted = result.deletedCount || 0;
  if (deleted) {
    console.log(`[notifications] Deleted ${deleted} older than 5 days`);
  }
  return deleted;
};
