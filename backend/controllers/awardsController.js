import Quote from "../models/Quote.js";
import QuoteLike from "../models/QuoteLike.js";
import Comment from "../models/Comment.js";
import QuoteOfTheDay from "../models/QuoteOfTheDay.js";
import User from "../models/User.js";
import { AUTHOR_SELECT } from "../utils/quoteSerializer.js";

const LEADERBOARD_LIMIT = 3;

const localDayBounds = (date = new Date()) => {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
};

const serializeQuoteAward = (quote, metricCount) => {
  if (!quote) return null;
  return {
    _id: quote._id,
    text: quote.text,
    category: quote.category || "",
    language: quote.language || "english",
    likesCount: quote.likesCount || 0,
    commentsCount: quote.commentsCount || 0,
    metricCount: metricCount ?? 0,
    createdAt: quote.createdAt,
    isPopular: false,
    author: quote.author
      ? {
          _id: quote.author._id,
          name: quote.author.name,
          username: quote.author.username,
          profilePicture: quote.author.profilePicture,
          qotdStars: quote.author.qotdStars || 0,
        }
      : null,
  };
};

const serializePerson = (user, rank) => ({
  rank,
  _id: user._id,
  name: user.name,
  username: user.username,
  profilePicture: user.profilePicture,
  qotdStars: user.qotdStars || 0,
  bio: user.bio || "",
});

/**
 * Keep at most one podium seat per author (best quote only),
 * then fill remaining ranks with other people.
 */
const uniqueAuthorsTopQuotes = (rows, limit = LEADERBOARD_LIMIT) => {
  const seenAuthors = new Set();
  const board = [];
  for (const row of rows) {
    const authorId = (row.author?._id || row.author)?.toString();
    if (!authorId || seenAuthors.has(authorId)) continue;
    seenAuthors.add(authorId);
    board.push(row);
    if (board.length >= limit) break;
  }
  return board;
};

/** Overall: denormalized counts; ties → earlier quote wins; one seat per person. */
const loadOverallQuoteBoard = async (metricField) => {
  const authorSelect = `${AUTHOR_SELECT} qotdStars`;
  const filter = {
    [metricField]: { $gt: 0 },
  };

  // Pull a wider pool so we can skip duplicate authors and still fill top 3.
  let quotes = await Quote.find(filter)
    .sort({ [metricField]: -1, createdAt: 1 })
    .limit(60)
    .populate("author", authorSelect)
    .lean();

  if (!quotes.length) {
    quotes = await Quote.find({})
      .sort({ [metricField]: -1, createdAt: 1 })
      .limit(60)
      .populate("author", authorSelect)
      .lean();
  }

  const ranked = quotes.map((quote) =>
    serializeQuoteAward(quote, quote[metricField] || 0)
  );
  return uniqueAuthorsTopQuotes(ranked);
};

/**
 * Today: count likes/comments created today.
 * Ties → earlier activity wins; one seat per person.
 */
const loadTodayQuoteBoard = async (EdgeModel) => {
  const { start, end } = localDayBounds();
  const authorSelect = `${AUTHOR_SELECT} qotdStars`;

  const grouped = await EdgeModel.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$quote",
        count: { $sum: 1 },
        firstAt: { $min: "$createdAt" },
      },
    },
    { $sort: { count: -1, firstAt: 1 } },
    { $limit: 80 },
  ]);

  if (!grouped.length) return [];

  const ids = grouped.map((row) => row._id);
  const quotes = await Quote.find({
    _id: { $in: ids },
  })
    .populate("author", authorSelect)
    .lean();

  const quoteMap = new Map(quotes.map((q) => [q._id.toString(), q]));
  const ranked = [];
  for (const row of grouped) {
    const quote = quoteMap.get(row._id.toString());
    if (!quote) continue;
    ranked.push(serializeQuoteAward(quote, row.count));
  }
  return uniqueAuthorsTopQuotes(ranked);
};

/** Stars are always lifetime; ties → earlier first QOTD win. */
const loadStarLeaders = async () => {
  const rows = await QuoteOfTheDay.aggregate([
    {
      $lookup: {
        from: "quotes",
        localField: "quote",
        foreignField: "_id",
        as: "quoteDoc",
      },
    },
    { $unwind: "$quoteDoc" },
    {
      $match: {
        usedPopular: { $ne: true },
      },
    },
    {
      $group: {
        _id: "$quoteDoc.author",
        stars: { $sum: 1 },
        firstAt: { $min: "$selectedAt" },
      },
    },
    { $match: { stars: { $gt: 0 } } },
    { $sort: { stars: -1, firstAt: 1 } },
    { $limit: LEADERBOARD_LIMIT },
  ]);

  if (!rows.length) return [];

  const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
    .select("name username profilePicture qotdStars bio")
    .lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return rows
    .map((row, index) => {
      const user = userMap.get(row._id.toString());
      if (!user) return null;
      return serializePerson({ ...user, qotdStars: row.stars }, index + 1);
    })
    .filter(Boolean);
};

const packQuoteBoard = (leaderboard) => ({
  champion: leaderboard[0] || null,
  leaderboard,
});

/**
 * Public awards leaderboard (top 3 only).
 * Response includes both today + overall quote boards; stars are lifetime.
 */
export const loadAwardsLeaderboard = async (_req, res) => {
  try {
    const [overallLiked, overallCommented, todayLiked, todayCommented, stars] =
      await Promise.all([
        loadOverallQuoteBoard("likesCount"),
        loadOverallQuoteBoard("commentsCount"),
        loadTodayQuoteBoard(QuoteLike),
        loadTodayQuoteBoard(Comment),
        loadStarLeaders(),
      ]);

    res.json({
      overall: {
        mostLiked: packQuoteBoard(overallLiked),
        mostCommented: packQuoteBoard(overallCommented),
      },
      today: {
        mostLiked: packQuoteBoard(todayLiked),
        mostCommented: packQuoteBoard(todayCommented),
      },
      qotdStars: {
        champion: stars[0] || null,
        leaderboard: stars,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
