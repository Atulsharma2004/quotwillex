import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import QuoteLike from "../models/QuoteLike.js";
import QuoteDislike from "../models/QuoteDislike.js";
import { normalizeCategory } from "../constants/quoteCategories.js";
import {
  findAbusiveWordsLocal,
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
import { findQuoteDocByIdRaw } from "../utils/quoteDocuments.js";

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
  const words = findAbusiveWordsLocal(text);
  if (!words.length) return null;
  if (userId) {
    await recordAbuseStrike(userId, {
      sampleText: text,
      words,
    });
  }
  return getAbuseRejectionMessage(words, language);
};

const buildQuoteListFilter = async (query) => {
  const filter = {};

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

const buildCommunityListFilter = async (query) => {
  const filter = await buildQuoteListFilter(query);
  // Community Quote has no attributedTo — drop that branch from $or
  if (filter.$or) {
    filter.$or = filter.$or.filter((clause) => !("attributedTo" in clause));
    if (!filter.$or.length) delete filter.$or;
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
    const Model = popular ? PopularQuote : Quote;
    const kind = popular ? "popular" : "community";
    const { page, limit, skip } = parsePagination(req.query);
    const filter = popular
      ? await buildQuoteListFilter(req.query)
      : await buildCommunityListFilter(req.query);
    const sort = buildSort(req.query.sortBy);

    const [total, quotes] = await Promise.all([
      Model.countDocuments(filter),
      Model.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", AUTHOR_SELECT)
        .lean(),
    ]);

    const serialized = await serializeQuotesForViewer(quotes, req.user?.id, {
      kind,
    });
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
      req.user.id,
      { kind: "community" }
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

    const quote = await PopularQuote.create({
      text: text.trim(),
      attributedTo: attributedTo.trim(),
      sourceWork: String(sourceWork || "").trim(),
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
      req.user.id,
      { kind: "popular" }
    );
    res.status(201).json(serialized);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

const MAX_BULK_POPULAR = 30;

const mapBulkPopularItem = (raw = {}, index = 0) => {
  const item = raw && typeof raw === "object" ? raw : {};
  const text = String(item.quote ?? item.text ?? "").trim();
  const attributedTo = String(item.writer ?? item.attributedTo ?? "").trim();
  const sourceWork = String(item.source ?? item.sourceWork ?? "").trim();
  const language = normalizeLanguage(item.language);
  const rawCategory = String(item.category ?? "").trim();
  const otherCategory = String(
    item.other ?? item.customCategory ?? item.custom_category ?? ""
  ).trim();

  if (!text) {
    return { ok: false, index, error: "quote is required" };
  }
  if (!attributedTo) {
    return { ok: false, index, error: "writer is required" };
  }
  if (!isValidLanguage(language)) {
    return {
      ok: false,
      index,
      error: "language must be english or hindi",
    };
  }

  let categoryInput = rawCategory;
  if (normalizeCategory(rawCategory) === "other") {
    if (!otherCategory) {
      return {
        ok: false,
        index,
        error: 'When category is "other", provide a custom value in "other"',
      };
    }
    categoryInput = otherCategory;
  }

  const categoryResult = parseCategory(categoryInput);
  if (!categoryResult.ok) {
    return { ok: false, index, error: categoryResult.error };
  }

  const abuseWords = findAbusiveWordsLocal(text);
  if (abuseWords.length) {
    return {
      ok: false,
      index,
      error: getAbuseRejectionMessage(abuseWords, language),
    };
  }

  return {
    ok: true,
    index,
    doc: {
      text,
      attributedTo,
      sourceWork,
      ...(categoryResult.category ? { category: categoryResult.category } : {}),
      language,
      author: null, // filled later
      likesCount: 0,
      dislikesCount: 0,
      commentsCount: 0,
    },
  };
};

/** Admin-only: create up to 30 popular quotes from a JSON array. */
export const bulkCreatePopularQuotes = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User is not authenticated" });
    }
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can bulk publish popular quotes" });
    }

    const body = req.body;
    let items = [];
    if (Array.isArray(body)) {
      items = body;
    } else if (Array.isArray(body?.quotes)) {
      items = body.quotes;
    } else if (body && typeof body === "object" && (body.quote || body.text)) {
      items = [body];
    }

    if (!items.length) {
      return res.status(400).json({
        error:
          "Provide a JSON array of quotes, or { \"quotes\": [ ... ] }. Max 30 items.",
      });
    }
    if (items.length > MAX_BULK_POPULAR) {
      return res.status(400).json({
        error: `You can upload at most ${MAX_BULK_POPULAR} quotes at a time.`,
      });
    }

    const failed = [];
    const docs = [];
    for (let i = 0; i < items.length; i += 1) {
      const mapped = mapBulkPopularItem(items[i], i);
      if (!mapped.ok) {
        failed.push({ index: i + 1, error: mapped.error });
        continue;
      }
      docs.push({ ...mapped.doc, author: req.user.id });
    }

    if (!docs.length) {
      return res.status(400).json({
        error: "No valid quotes to publish.",
        createdCount: 0,
        failedCount: failed.length,
        failed,
      });
    }

    const inserted = await PopularQuote.insertMany(docs, { ordered: false });
    await User.updateOne(
      { _id: req.user.id },
      { $inc: { postCount: inserted.length } }
    );

    const lean = inserted.map((q) => q.toObject());
    const serialized = await serializeQuotesForViewer(lean, req.user.id, {
      kind: "popular",
    });

    res.status(201).json({
      created: serialized,
      createdCount: serialized.length,
      failedCount: failed.length,
      failed,
      message:
        failed.length === 0
          ? `Published ${serialized.length} popular quote(s) successfully.`
          : `Published ${serialized.length} quote(s); ${failed.length} skipped.`,
    });
  } catch (error) {
    console.error("[bulk-popular]", error.message);
    res.status(500).json({
      message: "Request failed",
      error: error.message || "Bulk upload failed",
    });
  }
};

export const loadQuotes = (req, res) => listQuotes(req, res, { popular: false });
export const loadPopularQuotes = (req, res) =>
  listQuotes(req, res, { popular: true });

const GUEST_QUOTE_LIMIT = 100;

/** Public preview: up to 100 random quotes mixing popular + community. */
export const loadGuestQuotes = async (req, res) => {
  try {
    const popularFilter = await buildQuoteListFilter(req.query);
    const communityFilter = await buildCommunityListFilter(req.query);
    const half = Math.ceil(GUEST_QUOTE_LIMIT / 2);

    const [popularSample, communitySample] = await Promise.all([
      PopularQuote.aggregate([
        { $match: popularFilter },
        { $sample: { size: half } },
      ]),
      Quote.aggregate([
        { $match: communityFilter },
        { $sample: { size: half } },
      ]),
    ]);

    const mixed = [];
    const maxLen = Math.max(popularSample.length, communitySample.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (communitySample[i]) {
        mixed.push({ ...communitySample[i], __kind: "community" });
      }
      if (popularSample[i]) {
        mixed.push({ ...popularSample[i], __kind: "popular" });
      }
    }
    const limited = mixed.slice(0, GUEST_QUOTE_LIMIT);
    const ids = limited.map((q) => q._id);

    const [communityDocs, popularDocs] = await Promise.all([
      Quote.find({ _id: { $in: ids } })
        .populate("author", AUTHOR_SELECT)
        .lean(),
      PopularQuote.find({ _id: { $in: ids } })
        .populate("author", AUTHOR_SELECT)
        .lean(),
    ]);
    const byId = new Map([
      ...communityDocs.map((q) => [q._id.toString(), { ...q, __kind: "community" }]),
      ...popularDocs.map((q) => [q._id.toString(), { ...q, __kind: "popular" }]),
    ]);
    const ordered = limited
      .map((row) => byId.get(row._id.toString()))
      .filter(Boolean);

    const communitySerialized = await serializeQuotesForViewer(
      ordered.filter((q) => q.__kind === "community"),
      null,
      { kind: "community" }
    );
    const popularSerialized = await serializeQuotesForViewer(
      ordered.filter((q) => q.__kind === "popular"),
      null,
      { kind: "popular" }
    );
    const communityMap = new Map(
      communitySerialized.map((q) => [q._id.toString(), q])
    );
    const popularMap = new Map(
      popularSerialized.map((q) => [q._id.toString(), q])
    );
    const serialized = ordered
      .map((q) =>
        q.__kind === "popular"
          ? popularMap.get(q._id.toString())
          : communityMap.get(q._id.toString())
      )
      .filter(Boolean);

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
      Quote.find({})
        .sort({ createdAt: -1 })
        .limit(24)
        .select("text author createdAt")
        .populate("author", "name username")
        .lean(),
      PopularQuote.find({})
        .sort({ createdAt: -1 })
        .limit(24)
        .select("text attributedTo author createdAt")
        .populate("author", "name username")
        .lean(),
    ]);

    const mixed = [];
    const maxLen = Math.max(community.length, popular.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (community[i]) mixed.push({ ...community[i], isPopular: false });
      if (popular[i]) mixed.push({ ...popular[i], isPopular: true });
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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (!found) return res.status(404).json({ message: "Quote not found" });
    const { doc: quote, Model } = found;

    const userId = req.user.id;
    const existing = await QuoteLike.findOne({ quote: quote._id, user: userId });

    if (existing) {
      await existing.deleteOne();
      await Model.updateOne(
        { _id: quote._id, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } }
      );
    } else {
      await QuoteLike.create({ quote: quote._id, user: userId });
      await Model.updateOne({ _id: quote._id }, { $inc: { likesCount: 1 } });
      const disliked = await QuoteDislike.findOneAndDelete({
        quote: quote._id,
        user: userId,
      });
      if (disliked) {
        await Model.updateOne(
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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (!found) return res.status(404).json({ message: "Quote not found" });
    const { doc: quote, Model } = found;

    const userId = req.user.id;
    const existing = await QuoteDislike.findOne({
      quote: quote._id,
      user: userId,
    });

    if (existing) {
      await existing.deleteOne();
      await Model.updateOne(
        { _id: quote._id, dislikesCount: { $gt: 0 } },
        { $inc: { dislikesCount: -1 } }
      );
    } else {
      await QuoteDislike.create({ quote: quote._id, user: userId });
      await Model.updateOne({ _id: quote._id }, { $inc: { dislikesCount: 1 } });
      const liked = await QuoteLike.findOneAndDelete({
        quote: quote._id,
        user: userId,
      });
      if (liked) {
        await Model.updateOne(
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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (!found) return res.status(404).json({ error: "Quote not found" });
    const { doc: quote, Model } = found;

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
    await Model.updateOne({ _id: quote._id }, { $inc: { commentsCount: 1 } });

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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (found) {
      await found.Model.updateOne(
        { _id: req.params.id, commentsCount: { $gt: 0 } },
        { $inc: { commentsCount: -1 } }
      );
    }

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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (!found) return res.status(404).json({ error: "Quote not found" });
    const { doc: quote, isPopular } = found;
    if (!isAuthorized(quote.author, req.user)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { text, category, language, sourceWork, attributedTo } = req.body;
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
    if (isPopular && sourceWork !== undefined) {
      quote.sourceWork = String(sourceWork || "").trim();
    }
    if (isPopular && attributedTo !== undefined) {
      const writer = String(attributedTo || "").trim();
      if (!writer) {
        return res.status(400).json({ error: "Writer / attributedTo is required" });
      }
      quote.attributedTo = writer;
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
    const found = await findQuoteDocByIdRaw(req.params.id);
    if (!found) return res.status(404).json({ error: "Quote not found" });
    const { doc: quote } = found;
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

    const isPopular = Boolean(doc.usedPopular || quote.attributedTo);

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
        attributedTo: quote.attributedTo || "",
        likesCount: quote.likesCount || 0,
        commentsCount: quote.commentsCount || 0,
        author: quote.author,
        createdAt: quote.createdAt,
        isPopular,
      },
    });
  } catch (error) {
    console.error("[qotd] load failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
