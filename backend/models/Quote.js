import mongoose from "mongoose";

const QuoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    isPopular: { type: Boolean, default: false },
    attributedTo: { type: String, trim: true, default: "", maxlength: 120 },
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
    /** Denormalized counts — reactions/comments live in separate collections. */
    likesCount: { type: Number, default: 0, min: 0 },
    dislikesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

QuoteSchema.index({ isPopular: 1, createdAt: -1 });
QuoteSchema.index({ author: 1, createdAt: -1 });
QuoteSchema.index({ category: 1, createdAt: -1 });
QuoteSchema.index({ language: 1, createdAt: -1 });
QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ likesCount: -1, createdAt: -1 });
QuoteSchema.index({ commentsCount: -1, createdAt: -1 });
QuoteSchema.index({ text: "text", attributedTo: "text" });

export default mongoose.model("Quote", QuoteSchema);
