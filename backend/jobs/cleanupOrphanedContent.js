import User from "../models/User.js";
import Quote from "../models/Quote.js";
import Follow from "../models/Follow.js";
import QuoteLike from "../models/QuoteLike.js";
import QuoteDislike from "../models/QuoteDislike.js";
import Comment from "../models/Comment.js";

/**
 * Removes posts by deleted users and orphaned edges in split collections.
 * Uses batched deletes — never loads full quote documents into memory.
 */
export const cleanupOrphanedContent = async () => {
  const existingUserIds = await User.find({}).distinct("_id");

  const orphanQuotes = await Quote.find({
    author: { $nin: existingUserIds },
  })
    .select("_id")
    .lean();
  const orphanQuoteIds = orphanQuotes.map((q) => q._id);

  if (orphanQuoteIds.length) {
    await Promise.all([
      Quote.deleteMany({ _id: { $in: orphanQuoteIds } }),
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
