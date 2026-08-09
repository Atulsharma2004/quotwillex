import User from "../models/User.js";
import { sendAbuseAlertEmails, isTransactionalMailConfigured } from "./mail.js";

export const ABUSE_STRIKE_LIMIT = 10;

/**
 * Increment abuse strikes when a user tries to post blocked content.
 * On reaching ABUSE_STRIKE_LIMIT, send Brevo alerts (admin + user) once.
 */
export const recordAbuseStrike = async (
  userId,
  { sampleText = "", words = [] } = {}
) => {
  if (!userId) return null;

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { abuseStrikeCount: 1 } },
    { new: true }
  ).select("name email username abuseStrikeCount abuseAlertSentAt");

  if (!user) return null;

  const count = user.abuseStrikeCount || 0;
  if (
    count >= ABUSE_STRIKE_LIMIT &&
    !user.abuseAlertSentAt &&
    isTransactionalMailConfigured()
  ) {
    try {
      await sendAbuseAlertEmails({
        user,
        strikeCount: count,
        sampleText,
        words,
      });
      user.abuseAlertSentAt = new Date();
      await user.save();
    } catch (err) {
      console.error("[abuse-alert]", err.message);
    }
  }

  return {
    strikeCount: count,
    limit: ABUSE_STRIKE_LIMIT,
    alertSent: Boolean(user.abuseAlertSentAt),
  };
};
