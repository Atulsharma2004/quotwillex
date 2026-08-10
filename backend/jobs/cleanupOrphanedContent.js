import User from "../models/User.js";
import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import Follow from "../models/Follow.js";
import QuoteLike from "../models/QuoteLike.js";
import QuoteDislike from "../models/QuoteDislike.js";
import Comment from "../models/Comment.js";

/**
 * Removes posts by deleted users and orphaned edges in split collections.
 */
export const cleanupOrphanedContent = async () => {
  const existingUserIds = await User.find({}).distinct("_id");

  const [orphanCommunity, orphanPopular] = await Promise.all([
    Quote.find({ author: { $nin: existingUserIds } }).select("_id").lean(),
    PopularQuote.find({ author: { $nin: existingUserIds } })
      .select("_id")
      .lean(),
  ]);
  const orphanQuoteIds = [
    ...orphanCommunity.map((q) => q._id),
    ...orphanPopular.map((q) => q._id),
  ];

  if (orphanQuoteIds.length) {
    await Promise.all([
      Quote.deleteMany({ _id: { $in: orphanQuoteIds } }),
      PopularQuote.deleteMany({ _id: { $in: orphanQuoteIds } }),
      QuoteLike.deleteMany({ quote: { $in: orphanQuoteIds } }),
      QuoteDislike.deleteMany({ quote: { $in: orphanQuoteIds } }),
      Comment.deleteMany({ quote: { $in: orphanQuoteIds } }),
    ]);
  }

  await Promise.all([
    Follow.deleteMany({
      $or: [
        { follower: { $nin: existingUserIds } },
        { following: { $nin: existingUserIds } },
      ],
    }),
    QuoteLike.deleteMany({ user: { $nin: existingUserIds } }),
    QuoteDislike.deleteMany({ user: { $nin: existingUserIds } }),
    Comment.deleteMany({ user: { $nin: existingUserIds } }),
  ]);

  if (orphanQuoteIds.length) {
    console.log(
      `[cleanup] Removed ${orphanQuoteIds.length} orphan posts and related edges`
    );
  }

  return { deletedPosts: orphanQuoteIds.length };
};
