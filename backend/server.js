import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();


const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Handle base64 images
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/quotes", quoteRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

