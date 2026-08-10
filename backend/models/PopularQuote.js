import mongoose from "mongoose";

/**
 * Admin / classics feed — separate collection from community Quote.
 */
const PopularQuoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    attributedTo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sourceWork: { type: String, trim: true, default: "", maxlength: 200 },
    language: {
      type: String,
      enum: ["english", "hindi"],
      default: "english",
      lowercase: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likesCount: { type: Number, default: 0, min: 0 },
    dislikesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

PopularQuoteSchema.index({ createdAt: -1 });
PopularQuoteSchema.index({ author: 1, createdAt: -1 });
PopularQuoteSchema.index({ category: 1, createdAt: -1 });
PopularQuoteSchema.index({ language: 1, createdAt: -1 });
PopularQuoteSchema.index({ likesCount: -1, createdAt: -1 });
PopularQuoteSchema.index({ commentsCount: -1, createdAt: -1 });
// language_override must NOT be our app "language" field (english/hindi),
// or MongoDB text index rejects hindi docs: "language override unsupported".
PopularQuoteSchema.index(
  { text: "text", attributedTo: "text" },
  { default_language: "none", language_override: "unusedLanguageOverride" }
);

export default mongoose.model("PopularQuote", PopularQuoteSchema);
