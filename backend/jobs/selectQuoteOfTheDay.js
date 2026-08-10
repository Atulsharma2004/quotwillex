import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import QuoteOfTheDay from "../models/QuoteOfTheDay.js";
import User from "../models/User.js";
import { findQuoteDocByIdRaw } from "../utils/quoteDocuments.js";

/** Local calendar day YYYY-MM-DD (matches node-cron local midnight). */
const toDayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (dayKey, delta) => {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toDayKey(dt);
};

const previousDayKey = (dayKey) => addDays(dayKey, -1);

const dayBounds = (dayKey) => {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
};

const scoreQuote = (quote) => {
  const likes = quote.likesCount || 0;
  const dislikes = quote.dislikesCount || 0;
  const comments = quote.commentsCount || 0;
  const words = String(quote.text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const lengthBonus = words >= 8 && words <= 35 ? 12 : words >= 5 ? 6 : 1;
  return likes * 3.5 + comments * 4.5 - dislikes * 2 + lengthBonus;
};

const loadQuotesForDay = async (dayKey, { popularOnly = false } = {}) => {
  const { start, end } = dayBounds(dayKey);
  const filter = {
    createdAt: { $gte: start, $lte: end },
  };
  const Model = popularOnly ? PopularQuote : Quote;
  return Model.find(filter)
    .select(
      "text likesCount dislikesCount commentsCount category language createdAt author attributedTo"
    )
    .lean();
};

/** Latest calendar day strictly before `beforeDayKey` that has community posts. */
const findLatestCommunityDay = async (beforeDayKey) => {
  const before = dayBounds(beforeDayKey).start;
  const latest = await Quote.findOne({
    createdAt: { $lt: before },
  })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();

  if (!latest?.createdAt) return null;
  return toDayKey(new Date(latest.createdAt));
};

/**
 * True when there are zero community posts in the last 3
 * calendar days ending yesterday (relative to the display day).
 */
const hasNoCommunityPostsInLast3Days = async (displayDayKey) => {
  const rangeStart = dayBounds(addDays(displayDayKey, -3)).start;
  const rangeEnd = dayBounds(previousDayKey(displayDayKey)).end;
  const count = await Quote.countDocuments({
    createdAt: { $gte: rangeStart, $lte: rangeEnd },
  });
  return count === 0;
};

const loadRecentPopularQuotes = async (displayDayKey, limit = 40) => {
  const until = dayBounds(previousDayKey(displayDayKey)).end;
  return PopularQuote.find({
    createdAt: { $lte: until },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "text likesCount dislikesCount commentsCount category language createdAt author attributedTo"
    )
    .lean();
};

const pickWinner = async (_displayDayKey, quotes) => {
  const ranked = [...quotes].sort((a, b) => {
    const diff = scoreQuote(b) - scoreQuote(a);
    if (diff !== 0) return diff;
    return String(b._id).localeCompare(String(a._id));
  });
  const top = ranked[0];
  return {
    winner: {
      id: top._id.toString(),
      score: scoreQuote(top),
    },
    method: "node",
  };
};

const hydrateQotdDoc = async (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const quoteId = plain.quote?._id || plain.quote;
  if (!quoteId) return plain;

  const found = await findQuoteDocByIdRaw(quoteId);
  if (!found) {
    plain.quote = null;
    return plain;
  }

  await found.doc.populate({
    path: "author",
    select: "name username profilePicture qotdStars",
  });
  const quoteObj = found.doc.toObject ? found.doc.toObject() : found.doc;
  plain.quote = {
    ...quoteObj,
    isPopular: found.isPopular,
  };
  if (found.isPopular) plain.usedPopular = true;
  return plain;
};

/**
 * At local midnight, select today's Quote of the Day from yesterday's posts.
 * Display day = today (shown until 11:59 PM). Source day = previous day.
 *
 * Popular quotes are excluded unless there were no community posts in the
 * last 3 days — then popular quotes may be used as a last resort.
 */
export const selectQuoteOfTheDay = async (targetDate = new Date()) => {
  const displayDayKey = toDayKey(targetDate);
  const expectedSourceDay = previousDayKey(displayDayKey);

  let sourceDate = expectedSourceDay;
  let usedPopular = false;
  let quotes = await loadQuotesForDay(sourceDate, { popularOnly: false });

  if (!quotes.length) {
    const olderDay = await findLatestCommunityDay(expectedSourceDay);
    if (olderDay) {
      sourceDate = olderDay;
      quotes = await loadQuotesForDay(sourceDate, { popularOnly: false });
    }
  }

  if (!quotes.length) {
    const allowPopular = await hasNoCommunityPostsInLast3Days(displayDayKey);
    if (allowPopular) {
      quotes = await loadQuotesForDay(expectedSourceDay, { popularOnly: true });
      if (!quotes.length) {
        quotes = await loadRecentPopularQuotes(displayDayKey);
      }
      if (quotes.length) {
        usedPopular = true;
        sourceDate = toDayKey(new Date(quotes[0].createdAt));
      }
    }
  }

  if (!quotes.length) {
    return null;
  }

  const { winner, method } = await pickWinner(displayDayKey, quotes);

  const previous = await QuoteOfTheDay.findOne({ date: displayDayKey })
    .select("starAwarded quote")
    .lean();

  const rawDoc = await QuoteOfTheDay.findOneAndUpdate(
    { date: displayDayKey },
    {
      date: displayDayKey,
      sourceDate,
      quote: winner.id,
      score: winner.score || 0,
      method,
      usedPopular,
      selectedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const doc = await hydrateQotdDoc(rawDoc);

  if (!previous?.starAwarded) {
    const isPopularWinner = Boolean(doc?.quote?.isPopular || usedPopular);
    const authorId = doc?.quote?.author?._id || doc?.quote?.author;
    if (authorId && !isPopularWinner) {
      await User.updateOne({ _id: authorId }, { $inc: { qotdStars: 1 } });
    }
    await QuoteOfTheDay.updateOne(
      { _id: rawDoc._id },
      { $set: { starAwarded: true } }
    );
    if (doc) doc.starAwarded = true;
  }

  return doc;
};

/** Rebuild user qotdStars from QuoteOfTheDay history (idempotent). */
export const syncQotdStarsFromHistory = async () => {
  const rows = await QuoteOfTheDay.find()
    .select("quote starAwarded usedPopular")
    .lean();

  const counts = new Map();
  for (const row of rows) {
    if (row.usedPopular) continue;
    const found = await findQuoteDocByIdRaw(row.quote);
    if (!found || found.isPopular) continue;
    const authorId = found.doc.author?.toString();
    if (!authorId) continue;
    counts.set(authorId, (counts.get(authorId) || 0) + 1);
  }

  await User.updateMany({}, { $set: { qotdStars: 0 } });
  for (const [authorId, stars] of counts.entries()) {
    await User.updateOne({ _id: authorId }, { $set: { qotdStars: stars } });
  }
  await QuoteOfTheDay.updateMany({}, { $set: { starAwarded: true } });

  return { authors: counts.size, selections: rows.length };
};

/** Current day's selection (chosen at midnight from the previous day). */
export const getQuoteOfTheDay = async (targetDate = new Date()) => {
  const displayDayKey = toDayKey(targetDate);
  let raw = await QuoteOfTheDay.findOne({ date: displayDayKey });
  let doc = await hydrateQotdDoc(raw);

  if (!doc?.quote) {
    doc = await selectQuoteOfTheDay(targetDate);
  }

  if (!doc?.quote) {
    raw = await QuoteOfTheDay.findOne().sort({ date: -1 });
    doc = await hydrateQotdDoc(raw);
  }

  return doc;
};

export { toDayKey, previousDayKey };
