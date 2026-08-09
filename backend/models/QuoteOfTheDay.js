import mongoose from "mongoose";

const QuoteOfTheDaySchema = new mongoose.Schema(
  {
    /** Calendar day this selection is shown for (YYYY-MM-DD, UTC). */
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    /** Day the candidate quotes were posted on (may differ on fallback). */
    sourceDate: {
      type: String,
      required: true,
      trim: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },
    score: { type: Number, default: 0 },
    method: {
      type: String,
      enum: ["python", "node-fallback"],
      default: "python",
    },
    selectedAt: { type: Date, default: Date.now },
    /** True when selection had to use popular quotes (no community posts in 3 days). */
    usedPopular: { type: Boolean, default: false },
    /** Ensures the author receives at most one QOTD star per display day. */
    starAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("QuoteOfTheDay", QuoteOfTheDaySchema);
