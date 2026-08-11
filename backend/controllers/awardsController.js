import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import QuoteLike from "../models/QuoteLike.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { AUTHOR_SELECT } from "../utils/quoteSerializer.js";
import { findQuoteDocById } from "../utils/quoteDocuments.js";
import {
  getQuoteOfTheDay,
  syncQotdStarsFromHistory,
} from "../jobs/selectQuoteOfTheDay.js";

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

const serializeQuoteAward = (quote, metricCount, isPopular = false) => {
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
    isPopular: Boolean(isPopular),
    attributedTo: isPopular ? quote.attributedTo || "" : "",
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

const fetchTopFromModel = async (Model, metricField, isPopular, authorSelect) => {
  const withMetric = await Model.find({ [metricField]: { $gt: 0 } })
    .sort({ [metricField]: -1, createdAt: 1 })
    .limit(60)
    .populate("author", authorSelect)
    .lean();

  if (withMetric.length) {
    return withMetric.map((quote) =>
      serializeQuoteAward(quote, quote[metricField] || 0, isPopular)
    );
  }

  const any = await Model.find({})
    .sort({ [metricField]: -1, createdAt: 1 })
    .limit(60)
    .populate("author", authorSelect)
    .lean();

  return any.map((quote) =>
    serializeQuoteAward(quote, quote[metricField] || 0, isPopular)
  );
};

/** Popular boards only when the community Quote collection is empty. */
const hasAnyCommunityQuote = async () => Boolean(await Quote.exists({}));

/**
 * Overall: community quotes only when any exist; popular only as empty-community fallback.
 */
const loadOverallQuoteBoard = async (metricField) => {
  const authorSelect = `${AUTHOR_SELECT} qotdStars`;
  const usePopularFallback = !(await hasAnyCommunityQuote());

  if (!usePopularFallback) {
    return uniqueAuthorsTopQuotes(
      await fetchTopFromModel(Quote, metricField, false, authorSelect)
    );
  }

  return uniqueAuthorsTopQuotes(
    await fetchTopFromModel(PopularQuote, metricField, true, authorSelect)
  );
};

/**
 * Today: likes/comments on community quotes only when any community quotes exist;
 * otherwise allow popular.
 */
const loadTodayQuoteBoard = async (EdgeModel) => {
  const { start, end } = localDayBounds();
  const usePopularFallback = !(await hasAnyCommunityQuote());

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

  const ranked = [];
  for (const row of grouped) {
    const found = await findQuoteDocById(row._id, { lean: true });
    if (!found?.doc) continue;
    if (!usePopularFallback && found.isPopular) continue;
    if (usePopularFallback && !found.isPopular) continue;
    ranked.push(
      serializeQuoteAward(found.doc, row.count, found.isPopular)
    );
  }
  return uniqueAuthorsTopQuotes(ranked);
};

/** Stars = times a creator’s quote (community or popular) was Quote of the Day. */
const loadStarLeaders = async () => {
  let users = await User.find({ qotdStars: { $gt: 0 } })
    .sort({ qotdStars: -1, createdAt: 1 })
    .limit(LEADERBOARD_LIMIT)
    .select("name username profilePicture qotdStars bio")
    .lean();

  // Older popular QOTDs were saved without awarding stars — rebuild once.
  if (!users.length) {
    await syncQotdStarsFromHistory();
    users = await User.find({ qotdStars: { $gt: 0 } })
      .sort({ qotdStars: -1, createdAt: 1 })
      .limit(LEADERBOARD_LIMIT)
      .select("name username profilePicture qotdStars bio")
      .lean();
  }

  return users.map((user, index) => serializePerson(user, index + 1));
};

const packQuoteBoard = (leaderboard) => ({
  champion: leaderboard[0] || null,
  leaderboard,
});

const serializeTodayQotd = (doc) => {
  if (!doc?.quote) return null;
  const q = doc.quote;
  return {
    date: doc.date,
    sourceDate: doc.sourceDate,
    usedPopular: Boolean(doc.usedPopular || q.isPopular),
    score: doc.score || 0,
    quote: {
      _id: q._id,
      text: q.text,
      category: q.category || "",
      language: q.language || "english",
      likesCount: q.likesCount || 0,
      commentsCount: q.commentsCount || 0,
      isPopular: Boolean(q.isPopular),
      attributedTo: q.attributedTo || "",
      author: q.author
        ? {
            _id: q.author._id,
            name: q.author.name,
            username: q.author.username,
            profilePicture: q.author.profilePicture,
            qotdStars: q.author.qotdStars || 0,
          }
        : null,
    },
  };
};

/**
 * Public awards leaderboard (top 3 only).
 * Response includes today + overall quote boards, QOTD stars, and today's QOTD.
 */
export const loadAwardsLeaderboard = async (_req, res) => {
  try {
    const [
      overallLiked,
      overallCommented,
      todayLiked,
      todayCommented,
      stars,
      qotdDoc,
    ] = await Promise.all([
      loadOverallQuoteBoard("likesCount"),
      loadOverallQuoteBoard("commentsCount"),
      loadTodayQuoteBoard(QuoteLike),
      loadTodayQuoteBoard(Comment),
      loadStarLeaders(),
      getQuoteOfTheDay(),
    ]);

    res.json({
      quoteOfTheDay: serializeTodayQotd(qotdDoc),
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
