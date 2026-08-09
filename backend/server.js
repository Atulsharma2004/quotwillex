import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import moderationRoutes from "./routes/moderationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { startSchedulers } from "./jobs/scheduler.js";
import { migrateNormalizedSocialData } from "./jobs/migrateNormalizedData.js";
import { sanitizeMongoInput } from "./middleware/sanitizeMongo.js";
import { warmModeration } from "./utils/contentModeration.js";

dotenv.config();

const WEAK_JWT_SECRETS = new Set([
  "",
  "replace_with_a_long_random_secret_at_least_32_chars",
  "your_jwt_secret_here",
  "helloatulthisismysecretkeyforquotewebsite",
]);

const jwtSecret = String(process.env.JWT_SECRET || "");
const jwtOk =
  jwtSecret.length >= 32 && !WEAK_JWT_SECRETS.has(jwtSecret);

if (!jwtOk) {
  const msg =
    "[security] JWT_SECRET must be a unique random string (32+ chars), not an example placeholder.";
  if (process.env.NODE_ENV === "production") {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeMongoInput);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/contact", contactRoutes);

app.use((err, _req, res, _next) => {
  if (
    err?.type === "entity.too.large" ||
    err?.status === 413 ||
    err?.statusCode === 413
  ) {
    return res.status(413).json({
      message:
        "Image is too large. Please use JPEG, PNG, WebP, or GIF under 500 KB.",
    });
  }
  console.error(err);
  res.status(err.status || 500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  try {
    warmModeration();
  } catch (error) {
    console.error("[moderation] Wordlist warm failed:", error.message);
  }
  try {
    await migrateNormalizedSocialData();
  } catch (error) {
    console.error("[migrate] Failed:", error.message);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  startSchedulers();
};

startServer();
