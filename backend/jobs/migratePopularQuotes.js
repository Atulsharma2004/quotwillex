/**
 * One-time migration: move Quote docs with isPopular:true into PopularQuote
 * collection, preserving _id so likes/comments/QOTD refs keep working.
 *
 * Run: node jobs/migratePopularQuotes.js
 * (from backend/, with MONGO_URL set)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";

dotenv.config();

const migrate = async () => {
  await connectDB();

  const popular = await Quote.find({ isPopular: true }).lean();
  console.log(`[migrate] Found ${popular.length} popular quote(s) in Quote collection`);

  let moved = 0;
  let skipped = 0;

  for (const doc of popular) {
    const exists = await PopularQuote.exists({ _id: doc._id });
    if (exists) {
      await Quote.deleteOne({ _id: doc._id });
      skipped += 1;
      continue;
    }

    const { isPopular, ...rest } = doc;
    if (!rest.attributedTo) {
      rest.attributedTo = "Unknown";
    }

    await PopularQuote.create({
      ...rest,
      _id: doc._id,
    });
    await Quote.deleteOne({ _id: doc._id });
    moved += 1;
  }

  // Strip legacy popular fields from remaining community quotes if present
  await Quote.updateMany(
    {},
    { $unset: { isPopular: "", attributedTo: "", sourceWork: "" } }
  );

  console.log(
    `[migrate] Moved ${moved}, already-present ${skipped}. Community Quote collection cleaned.`
  );
  await mongoose.connection.close();
};

migrate().catch(async (error) => {
  console.error("[migrate] Failed:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
