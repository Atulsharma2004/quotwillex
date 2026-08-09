import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
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
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

CommentSchema.index({ quote: 1, createdAt: -1 });
CommentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Comment", CommentSchema);
