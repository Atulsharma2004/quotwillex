import cron from "node-cron";
import { cleanupOrphanedContent } from "./cleanupOrphanedContent.js";
import { cleanupAbusiveContent } from "./cleanupAbusiveContent.js";
import { selectQuoteOfTheDay } from "./selectQuoteOfTheDay.js";
import { cleanupExpiredNotifications } from "./cleanupExpiredNotifications.js";

/**
 * Schedules:
 * - orphan cleanup every 5 days at 03:00 (+ short startup run)
 * - abusive content cleanup every day at 00:00 (+ short startup run)
 * - quote of the day at 00:00 from previous day's quotes (shown until 23:59)
 * - notifications older than 5 days deleted daily at 00:05 (+ startup run)
 */
export const startSchedulers = () => {
  // Every 5 days at 03:00
  cron.schedule("0 3 */5 * *", () => {
    cleanupOrphanedContent().catch((error) => {
      console.error("[cleanup] Scheduled run failed:", error.message);
    });
  });

  // Every day at local midnight
  cron.schedule("0 0 * * *", () => {
    cleanupAbusiveContent().catch((error) => {
      console.error("[moderation] Scheduled run failed:", error.message);
    });
    // Pick today's featured quote from yesterday's posts
    selectQuoteOfTheDay().catch((error) => {
      console.error("[qotd] Scheduled run failed:", error.message);
    });
  });

  cron.schedule("5 0 * * *", () => {
    cleanupExpiredNotifications().catch((error) => {
      console.error("[notifications] Scheduled run failed:", error.message);
    });
  });

  setTimeout(() => {
    cleanupOrphanedContent().catch((error) => {
      console.error("[cleanup] Startup run failed:", error.message);
    });
    cleanupAbusiveContent().catch((error) => {
      console.error("[moderation] Startup run failed:", error.message);
    });
    selectQuoteOfTheDay().catch((error) => {
      console.error("[qotd] Startup run failed:", error.message);
    });
    cleanupExpiredNotifications().catch((error) => {
      console.error("[notifications] Startup run failed:", error.message);
    });
  }, 20_000);
};
