import mongoose from "mongoose";

const QuoteLikeSchema = new mongoose.Schema(
  {
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

QuoteLikeSchema.index({ quote: 1, user: 1 }, { unique: true });
QuoteLikeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("QuoteLike", QuoteLikeSchema);
