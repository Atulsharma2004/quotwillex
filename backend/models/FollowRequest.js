import mongoose from "mongoose";

/**
 * Pending / resolved follow requests (Instagram-style).
 * Accepted requests also create a Follow edge.
 */
const FollowRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

FollowRequestSchema.index({ from: 1, to: 1 }, { unique: true });
FollowRequestSchema.index({ to: 1, status: 1, createdAt: -1 });
FollowRequestSchema.index({ from: 1, status: 1, createdAt: -1 });

export default mongoose.model("FollowRequest", FollowRequestSchema);
