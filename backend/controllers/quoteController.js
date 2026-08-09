import Quote from "../models/Quote.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import QuoteLike from "../models/QuoteLike.js";
import QuoteDislike from "../models/QuoteDislike.js";
import { normalizeCategory } from "../constants/quoteCategories.js";
import {
  moderateText,
  getAbuseRejectionMessage,
} from "../utils/contentModeration.js";
import { getQuoteOfTheDay } from "../jobs/selectQuoteOfTheDay.js";
import {
  parsePagination,
  paginatedResponse,
  buildDateRangeFilter,
  escapeRegex,
} from "../utils/pagination.js";
import {
  AUTHOR_SELECT,
  formatQuoteWithAuthor,
  serializeQuotesForViewer,
} from "../utils/quoteSerializer.js";
import { recordAbuseStrike } from "../utils/abuseStrikes.js";

const isAuthorized = (resourceUserId, reqUser) =>
  resourceUserId.toString() === reqUser.id || reqUser.role === "admin";

const normalizeLanguage = (language) =>
  String(language || "english").trim().toLowerCase();
const isValidLanguage = (language) => ["english", "hindi"].includes(language);

const parseCategory = (category) => {
  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) return { ok: true, category: "" };
  if (normalizedCategory === "other") {
    return {
      ok: false,
      error: "Please enter a custom category when selecting Other",
    };
  }
  if (/[<>{}[\]\\|`~^]/.test(normalizedCategory)) {
    return {
      ok: false,
      error: "Category contains invalid characters",
    };
  }
  return { ok: true, category: normalizedCategory };
};

const rejectIfAbusive = async (text, language = "english", userId = null) => {
  const moderation = await moderateText(text, language);
  if (!moderation.blocked) return null;
  if (userId) {
    await recordAbuseStrike(userId, {
      sampleText: text,
      words: moderation.words || [],
    });
  }
  return (
    moderation.message || getAbuseRejectionMessage(moderation.words, language)
  );
};

const buildQuoteListFilter = async (query, { popular } = {}) => {
  const filter = {};
  if (popular === true) filter.isPopular = true;
  if (popular === false) filter.isPopular = { $ne: true };

  if (query.category && query.category !== "all") {
    const cat = String(query.category).trim().toLowerCase().slice(0, 40);
    if (cat) filter.category = new RegExp(escapeRegex(cat), "i");
  }
  if (query.language && query.language !== "all") {
    filter.language = normalizeLanguage(String(query.language));
  }
  if (query.author) {
    const authorId = String(query.author).trim();
    if (/^[a-f0-9]{24}$/i.test(authorId)) {
      filter.author = authorId;
    }
  }
  const dateRange = buildDateRangeFilter(query.dateFrom, query.dateTo);
  if (dateRange) filter.createdAt = dateRange;

  const search = String(query.search || query.q || "")
    .trim()
    .replace(/^@/, "")
    .slice(0, 100);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const authorIds = await User.find({
      $or: [{ name: regex }, { username: regex }],
    })
      .limit(40)
      .distinct("_id");
    filter.$or = [
      { text: regex },
      { attributedTo: regex },
      ...(authorIds.length ? [{ author: { $in: authorIds } }] : []),
    ];
  }
  return filter;
};

const buildSort = (sortBy = "newest") => {
  switch (sortBy) {
    case "oldest":
      return { createdAt: 1 };
    case "mostLiked":
      return { likesCount: -1, createdAt: -1 };
    case "mostCommented":
      return { commentsCount: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

const listQuotes = async (req, res, { popular }) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = await buildQuoteListFilter(req.query, { popular });
    const sort = buildSort(req.query.sortBy);

    const [total, quotes] = await Promise.all([
      Quote.countDocuments(filter),
      Quote.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", AUTHOR_SELECT)
        .lean(),
    ]);

    const serialized = await serializeQuotesForViewer(quotes, req.user?.id);
    res.json(paginatedResponse("quotes", serialized, total, page, limit));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const createQuote = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    const { text, category, language } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: "Quote text is required" });
    }

    const abuseError = await rejectIfAbusive(
      text,
      normalizeLanguage(language),
      req.user.id
    );
    if (abuseError) {
      return res.status(400).json({ error: abuseError });
    }

    const categoryResult = parseCategory(category);
    if (!categoryResult.ok) {
      return res.status(400).json({ error: categoryResult.error });
    }
    const normalizedLanguage = normalizeLanguage(language);
    if (!isValidLanguage(normalizedLanguage)) {
      return res
        .status(400)
        .json({ error: "Quote language must be English or Hindi" });
    }

    const newQuote = await Quote.create({
      text: text.trim(),
      ...(categoryResult.category ? { category: categoryResult.category } : {}),
      language: normalizedLanguage,
      author: req.user.id,
      likesCount: 0,
      dislikesCount: 0,
      commentsCount: 0,
    });

    await User.updateOne({ _id: req.user.id }, { $inc: { postCount: 1 } });
    await newQuote.populate("author", AUTHOR_SELECT);

    const [serialized] = await serializeQuotesForViewer(
      [newQuote.toObject()],
      req.user.id
    );
    res.status(201).json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const createPopularQuote = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User is not authenticated" });
    }
    // requireAdmin on the route is the primary gate; keep a second check here.
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can publish popular quotes" });
    }

    const { text, attributedTo, sourceWork, category, language } = req.body;
    if (!text?.trim() || !attributedTo?.trim()) {
      return res
        .status(400)
        .json({ error: "Quote text and attributedTo are required" });
    }

    const abuseError = await rejectIfAbusive(
      text,
      normalizeLanguage(language),
      req.user.id
    );
    if (abuseError) {
      return res.status(400).json({ error: abuseError });
    }

    const categoryResult = parseCategory(category);
    if (!categoryResult.ok) {
      return res.status(400).json({ error: categoryResult.error });
    }
    const normalizedLanguage = normalizeLanguage(language);
    if (!isValidLanguage(normalizedLanguage)) {
      return res
        .status(400)
        .json({ error: "Quote language must be English or Hindi" });
    }

    const quote = await Quote.create({
      text: text.trim(),
      attributedTo: attributedTo.trim(),
      sourceWork: String(sourceWork || "").trim(),
      isPopular: true,
      ...(categoryResult.category ? { category: categoryResult.category } : {}),
      language: normalizedLanguage,
      author: req.user.id,
      likesCount: 0,
      dislikesCount: 0,
      commentsCount: 0,
    });

    await User.updateOne({ _id: req.user.id }, { $inc: { postCount: 1 } });
    await quote.populate("author", AUTHOR_SELECT);
    const [serialized] = await serializeQuotesForViewer(
      [quote.toObject()],
      req.user.id
    );
    res.status(201).json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const loadQuotes = (req, res) => listQuotes(req, res, { popular: false });
export const loadPopularQuotes = (req, res) =>
  listQuotes(req, res, { popular: true });

const GUEST_QUOTE_LIMIT = 100;

/** Public preview: up to 100 random quotes mixing popular + community. */
export const loadGuestQuotes = async (req, res) => {
  try {
    const filter = await buildQuoteListFilter(req.query, {});
    const half = Math.ceil(GUEST_QUOTE_LIMIT / 2);
    const popularMatch = { ...filter, isPopular: true };
    const communityMatch = { ...filter, isPopular: { $ne: true } };

    const [popularSample, communitySample] = await Promise.all([
      Quote.aggregate([{ $match: popularMatch }, { $sample: { size: half } }]),
      Quote.aggregate([
        { $match: communityMatch },
        { $sample: { size: half } },
      ]),
    ]);

    const mixedIds = [];
    const maxLen = Math.max(popularSample.length, communitySample.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (popularSample[i]?._id) mixedIds.push(popularSample[i]._id);
      if (communitySample[i]?._id) mixedIds.push(communitySample[i]._id);
    }
    const limitedIds = mixedIds.slice(0, GUEST_QUOTE_LIMIT);

    const quotes = await Quote.find({ _id: { $in: limitedIds } })
      .populate("author", AUTHOR_SELECT)
      .lean();
    const byId = new Map(quotes.map((q) => [q._id.toString(), q]));
    const ordered = limitedIds
      .map((id) => byId.get(id.toString()))
      .filter(Boolean);

    const serialized = await serializeQuotesForViewer(ordered, null);
    res.json(
      paginatedResponse(
        "quotes",
        serialized,
        serialized.length,
        1,
        Math.max(serialized.length, 1)
      )
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const loadHomeShowcase = async (_req, res) => {
  try {
    const [community, popular] = await Promise.all([
      Quote.find({ isPopular: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(24)
        .select("text attributedTo isPopular author createdAt")
        .populate("author", "name username")
        .lean(),
      Quote.find({ isPopular: true })
        .sort({ createdAt: -1 })
        .limit(24)
        .select("text attributedTo isPopular author createdAt")
        .populate("author", "name username")
        .lean(),
    ]);

    const mixed = [];
    const maxLen = Math.max(community.length, popular.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (community[i]) mixed.push(community[i]);
      if (popular[i]) mixed.push(popular[i]);
    }

    res.status(200).json(
      mixed.slice(0, 36).map((quote) => ({
        _id: quote._id,
        text: quote.text,
        isPopular: Boolean(quote.isPopular),
        attributedTo: quote.attributedTo || "",
        authorName:
          quote.author?.username ||
          quote.author?.name ||
          quote.attributedTo ||
          "Community",
      }))
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const likeQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).select("_id likesCount dislikesCount");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    const userId = req.user.id;
    const existing = await QuoteLike.findOne({ quote: quote._id, user: userId });

    if (existing) {
      await existing.deleteOne();
      await Quote.updateOne(
        { _id: quote._id, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } }
      );
    } else {
      await QuoteLike.create({ quote: quote._id, user: userId });
      await Quote.updateOne({ _id: quote._id }, { $inc: { likesCount: 1 } });
      const disliked = await QuoteDislike.findOneAndDelete({
        quote: quote._id,
        user: userId,
      });
      if (disliked) {
        await Quote.updateOne(
          { _id: quote._id, dislikesCount: { $gt: 0 } },
          { $inc: { dislikesCount: -1 } }
        );
      }
    }

    const serialized = await formatQuoteWithAuthor(quote._id, userId);
    res.json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const dislikeQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).select("_id likesCount dislikesCount");
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    const userId = req.user.id;
    const existing = await QuoteDislike.findOne({
      quote: quote._id,
      user: userId,
    });

    if (existing) {
      await existing.deleteOne();
      await Quote.updateOne(
        { _id: quote._id, dislikesCount: { $gt: 0 } },
        { $inc: { dislikesCount: -1 } }
      );
    } else {
      await QuoteDislike.create({ quote: quote._id, user: userId });
      await Quote.updateOne({ _id: quote._id }, { $inc: { dislikesCount: 1 } });
      const liked = await QuoteLike.findOneAndDelete({
        quote: quote._id,
        user: userId,
      });
      if (liked) {
        await Quote.updateOne(
          { _id: quote._id, likesCount: { $gt: 0 } },
          { $inc: { likesCount: -1 } }
        );
      }
    }

    const serialized = await formatQuoteWithAuthor(quote._id, userId);
    res.json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const commentQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).select("_id");
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const language = normalizeLanguage(req.body.language || "english");
    const abuseError = await rejectIfAbusive(text, language, req.user.id);
    if (abuseError) return res.status(400).json({ error: abuseError });

    await Comment.create({
      quote: quote._id,
      user: req.user.id,
      text,
    });
    await Quote.updateOne({ _id: quote._id }, { $inc: { commentsCount: 1 } });

    const serialized = await formatQuoteWithAuthor(quote._id, req.user.id);
    res.json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const editComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || comment.quote.toString() !== req.params.id) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (!isAuthorized(comment.user, req.user)) {
      return res.status(403).json({ error: "Not authorized to edit this comment" });
    }

    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const abuseError = await rejectIfAbusive(text, "english", req.user.id);
    if (abuseError) return res.status(400).json({ error: abuseError });

    comment.text = text;
    await comment.save();

    const serialized = await formatQuoteWithAuthor(req.params.id, req.user.id);
    res.json(serialized);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || comment.quote.toString() !== req.params.id) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (!isAuthorized(comment.user, req.user)) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    await Quote.updateOne(
      { _id: req.params.id, commentsCount: { $gt: 0 } },
      { $inc: { commentsCount: -1 } }
    );

    const updatedQuote = await formatQuoteWithAuthor(req.params.id, req.user.id);
    res.status(200).json({
      message: "Comment deleted successfully",
      quoteId: req.params.id,
      commentId: req.params.commentId,
      updatedQuote,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    if (!isAuthorized(quote.author, req.user)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { text, category, language, sourceWork } = req.body;
    if (text !== undefined) {
      if (!String(text).trim()) {
        return res.status(400).json({ error: "Quote text is required" });
      }
      const abuseError = await rejectIfAbusive(
        text,
        normalizeLanguage(language || quote.language),
        req.user.id
      );
      if (abuseError) return res.status(400).json({ error: abuseError });
      quote.text = String(text).trim();
    }
    if (category !== undefined) {
      const categoryResult = parseCategory(category);
      if (!categoryResult.ok) {
        return res.status(400).json({ error: categoryResult.error });
      }
      quote.category = categoryResult.category || undefined;
    }
    if (language !== undefined) {
      const normalizedLanguage = normalizeLanguage(language);
      if (!isValidLanguage(normalizedLanguage)) {
        return res
          .status(400)
          .json({ error: "Quote language must be English or Hindi" });
      }
      quote.language = normalizedLanguage;
    }
    if (sourceWork !== undefined) {
      quote.sourceWork = String(sourceWork || "").trim();
    }

    await quote.save();
    const serialized = await formatQuoteWithAuthor(quote._id, req.user.id);
    res.json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    if (!isAuthorized(quote.author, req.user)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const quoteId = quote._id;
    const authorId = quote.author;
    await Promise.all([
      quote.deleteOne(),
      QuoteLike.deleteMany({ quote: quoteId }),
      QuoteDislike.deleteMany({ quote: quoteId }),
      Comment.deleteMany({ quote: quoteId }),
      User.updateOne(
        { _id: authorId, postCount: { $gt: 0 } },
        { $inc: { postCount: -1 } }
      ),
    ]);

    res.json({ message: "Quote deleted", id: quoteId.toString() });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const loadQuoteOfTheDay = async (_req, res) => {
  try {
    const doc = await getQuoteOfTheDay();
    if (!doc?.quote) return res.status(200).json(null);

    const quote = doc.quote;
    const expectedSource = (() => {
      if (!doc.date) return null;
      const [y, m, d] = doc.date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    })();

    res.status(200).json({
      date: doc.date,
      sourceDate: doc.sourceDate,
      score: doc.score,
      method: doc.method,
      selectedAt: doc.selectedAt,
      usedPopular: Boolean(doc.usedPopular),
      isFallbackDay: Boolean(
        doc.usedPopular ||
          (doc.sourceDate &&
            expectedSource &&
            doc.sourceDate !== expectedSource)
      ),
      quote: {
        _id: quote._id,
        text: quote.text,
        category: quote.category,
        language: quote.language,
        attributedTo: quote.attributedTo,
        likesCount: quote.likesCount || 0,
        commentsCount: quote.commentsCount || 0,
        author: quote.author,
        createdAt: quote.createdAt,
        isPopular: Boolean(quote.isPopular),
      },
    });
  } catch (error) {
    console.error("[qotd] load failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
