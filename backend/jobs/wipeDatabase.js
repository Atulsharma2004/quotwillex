/**
 * Wipe all Quotwellix application data from MongoDB.
 * Usage (from backend/):  CONFIRM_WIPE=YES node jobs/wipeDatabase.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const CONFIRM = process.env.CONFIRM_WIPE === "YES";

const KNOWN_COLLECTIONS = [
  "users",
  "quotes",
  "popularquotes",
  "follows",
  "followrequests",
  "notifications",
  "comments",
  "quotelikes",
  "quotedislikes",
  "quoteofthedays",
];

const wipe = async () => {
  if (!CONFIRM) {
    console.error(
      'Refusing to wipe. Re-run with CONFIRM_WIPE=YES to delete all data.'
    );
    process.exit(1);
  }

  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL is not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log(`[wipe] Connected to database: ${dbName}`);

  const existing = await db.listCollections().toArray();
  const names = existing.map((c) => c.name);
  console.log(`[wipe] Collections found: ${names.join(", ") || "(none)"}`);

  const targets = new Set([...KNOWN_COLLECTIONS, ...names]);
  let totalDeleted = 0;

  for (const name of targets) {
    if (!names.includes(name)) continue;
    // Keep system collections
    if (name.startsWith("system.")) continue;
    const result = await db.collection(name).deleteMany({});
    totalDeleted += result.deletedCount || 0;
    console.log(`[wipe] ${name}: deleted ${result.deletedCount} documents`);
  }

  console.log(`[wipe] Done. Removed ${totalDeleted} documents from ${dbName}.`);
  await mongoose.disconnect();
};

wipe().catch(async (err) => {
  console.error("[wipe] Failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
