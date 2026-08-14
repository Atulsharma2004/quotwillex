import mongoose from "mongoose";

/**
 * In-app notifications (currently follow requests + outcomes).
 */
const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["follow_request", "follow_accepted", "follow_back"],
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FollowRequest",
      default: null,
    },
    /** For follow_request: pending | accepted | rejected | cancelled | followed_back */
    actionState: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "followed_back",
        "none",
      ],
      default: "none",
    },
    message: { type: String, default: "", trim: true, maxlength: 240 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
/** MongoDB drops documents ~5 days after createdAt. */
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 5 * 24 * 60 * 60 }
);

export const NOTIFICATION_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export const notificationCutoffDate = () =>
  new Date(Date.now() - NOTIFICATION_TTL_MS);

export default mongoose.model("Notification", NotificationSchema);
