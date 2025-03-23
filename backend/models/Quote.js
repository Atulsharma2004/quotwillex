import mongoose from "mongoose";

const QuoteSchema = new mongoose.Schema(
    {
      text: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      comments: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          text: String,
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now }
        },
      ],
    },
    { timestamps: true }
  );
  
  export default mongoose.model("Quote", QuoteSchema);
