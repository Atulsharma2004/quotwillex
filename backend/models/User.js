import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      profilePicture: { type: String },
      bio: { type: String },
      role: { type: String, enum: ["user", "admin"], default: "user" },
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      postCount: { type: Number, default: 0 }, // ✅ New field for post count 
    },
    { timestamps: true }
  );

export default mongoose.model("User", UserSchema);
