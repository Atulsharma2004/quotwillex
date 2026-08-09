import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import Quote from "../models/Quote.js";
import QuoteDislike from "../models/QuoteDislike.js";
import QuoteLike from "../models/QuoteLike.js";
import User from "../models/User.js";
import { isPrivateProfileIncomplete } from "./privateProfile.js";
import { resolveEffectiveRole } from "./adminAccess.js";

const AUTHOR_SELECT = "name username profilePicture";
const USER_CARD_SELECT = "name username profilePicture";

/**
 * Attach viewer reaction flags + latest comments without hydrating full graphs.
 */
export const serializeQuotesForViewer = async (quotes, viewerId, options = {}) => {
  const commentLimit = options.commentLimit ?? 5;
  const list = Array.isArray(quotes) ? quotes : [];
  if (!list.length) return [];

  const ids = list.map((q) => q._id);
  const viewer = viewerId?.toString();

  const authorIds = [
    ...new Set(
      list
        .map((q) => q.author?._id || q.author)
        .filter(Boolean)
        .map((id) => id.toString())
    ),
  ];

  const [likedSet, dislikedSet, followedAuthors, commentGroups] =
    await Promise.all([
      viewer
        ? QuoteLike.find({ quote: { $in: ids }, user: viewer })
            .select("quote")
            .lean()
            .then((rows) => new Set(rows.map((r) => r.quote.toString())))
        : Promise.resolve(new Set()),
      viewer
        ? QuoteDislike.find({ quote: { $in: ids }, user: viewer })
            .select("quote")
            .lean()
            .then((rows) => new Set(rows.map((r) => r.quote.toString())))
        : Promise.resolve(new Set()),
      viewer && authorIds.length
        ? Follow.find({
            follower: viewer,
            following: { $in: authorIds },
          })
            .select("following")
            .lean()
            .then((rows) => new Set(rows.map((r) => r.following.toString())))
        : Promise.resolve(new Set()),
      Comment.aggregate([
        { $match: { quote: { $in: ids } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$quote",
            comments: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            comments: { $slice: ["$comments", commentLimit] },
          },
        },
      ]),
    ]);

  const commentUserIds = [
    ...new Set(
      commentGroups.flatMap((g) =>
        (g.comments || []).map((c) => c.user?.toString()).filter(Boolean)
      )
    ),
  ];
  const commentUsers = commentUserIds.length
    ? await User.find({ _id: { $in: commentUserIds } })
        .select(USER_CARD_SELECT)
        .lean()
    : [];
  const commentUserMap = new Map(
    commentUsers.map((u) => [u._id.toString(), u])
  );

  const commentsByQuote = new Map();
  for (const group of commentGroups) {
    const key = group._id.toString();
    const recent = (group.comments || [])
      .map((c) => ({
        ...c,
        user: commentUserMap.get(c.user?.toString()) || c.user,
      }))
      .reverse();
    commentsByQuote.set(key, recent);
  }

  return list.map((quote) => {
    const id = quote._id.toString();
    const authorId = (quote.author?._id || quote.author)?.toString();
    const recent = commentsByQuote.get(id) || [];
    const likedByMe = likedSet.has(id);
    const dislikedByMe = dislikedSet.has(id);
    const followedByMe = authorId ? followedAuthors.has(authorId) : false;
    return {
      ...quote,
      likesCount: quote.likesCount || 0,
      dislikesCount: quote.dislikesCount || 0,
      commentsCount: quote.commentsCount || 0,
      likedByMe,
      dislikedByMe,
      followedByMe,
      // Compat arrays for older UI paths (IDs only, tiny)
      likes: likedByMe && viewer ? [viewer] : [],
      dislikes: dislikedByMe && viewer ? [viewer] : [],
      comments: recent,
    };
  });
};

export const getFollowingIds = async (userId) => {
  if (!userId) return [];
  return Follow.find({ follower: userId }).distinct("following");
};

export const buildAuthUserPayload = async (userDoc, options = {}) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.googleId;
  delete user.emailVerifyTokenHash;
  delete user.emailVerifyExpires;
  delete user.passwordResetTokenHash;
  delete user.passwordResetExpires;

  const skipFollowing = options.skipFollowing === true;
  const followingIds = skipFollowing
    ? null
    : await getFollowingIds(user._id);

  return {
    ...user,
    authProvider: user.authProvider || "local",
    canChangePassword: (user.authProvider || "local") !== "google",
    role: resolveEffectiveRole(user.email),
    followerCount: user.followerCount || 0,
    followingCount:
      followingIds != null
        ? followingIds.length
        : user.followingCount || 0,
    following: followingIds != null ? followingIds : undefined,
    followers: [],
    needsProfileDetails: isPrivateProfileIncomplete(user),
    needsUsername: !user.username,
  };
};

export const loadLatestComments = async (quoteId, limit = 20) => {
  const comments = await Comment.find({ quote: quoteId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", USER_CARD_SELECT)
    .lean();
  return comments.reverse();
};

export const formatQuoteWithAuthor = async (quoteId, viewerId) => {
  const quote = await Quote.findById(quoteId)
    .populate("author", AUTHOR_SELECT)
    .lean();
  if (!quote) return null;
  const [serialized] = await serializeQuotesForViewer([quote], viewerId, {
    commentLimit: 20,
  });
  return serialized;
};

export { AUTHOR_SELECT, USER_CARD_SELECT };
