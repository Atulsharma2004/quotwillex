import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import Comment from "../models/Comment.js";
import QuoteLike from "../models/QuoteLike.js";
import QuoteDislike from "../models/QuoteDislike.js";
import User from "../models/User.js";
import { containsAbusiveContent } from "../utils/contentModeration.js";
import { findQuoteDocByIdRaw } from "../utils/quoteDocuments.js";

const BATCH = 200;

const purgeAbusiveFromModel = async (Model) => {
  let deleted = 0;
  let lastId = null;

  for (;;) {
    const filter = lastId ? { _id: { $gt: lastId } } : {};
    const batch = await Model.find(filter)
      .sort({ _id: 1 })
      .limit(BATCH)
      .select("_id text author")
      .lean();
    if (!batch.length) break;

    for (const quote of batch) {
      lastId = quote._id;
      if (!containsAbusiveContent(quote.text)) continue;

      await Promise.all([
        Model.deleteOne({ _id: quote._id }),
        QuoteLike.deleteMany({ quote: quote._id }),
        QuoteDislike.deleteMany({ quote: quote._id }),
        Comment.deleteMany({ quote: quote._id }),
        User.updateOne(
          { _id: quote.author, postCount: { $gt: 0 } },
          { $inc: { postCount: -1 } }
        ),
      ]);
      deleted += 1;
    }
  }

  return deleted;
};

/**
 * Deletes abusive posts/comments in batches (cursor-friendly).
 */
export const cleanupAbusiveContent = async () => {
  const deletedCommunity = await purgeAbusiveFromModel(Quote);
  const deletedPopular = await purgeAbusiveFromModel(PopularQuote);
  const deletedPosts = deletedCommunity + deletedPopular;
  let removedComments = 0;
  let lastId = null;

  for (;;) {
    const filter = lastId ? { _id: { $gt: lastId } } : {};
    const batch = await Comment.find(filter)
      .sort({ _id: 1 })
      .limit(BATCH)
      .select("_id text quote")
      .lean();
    if (!batch.length) break;

    for (const comment of batch) {
      lastId = comment._id;
      if (!containsAbusiveContent(comment.text)) continue;
      await Comment.deleteOne({ _id: comment._id });
      const found = await findQuoteDocByIdRaw(comment.quote);
      if (found) {
        await found.Model.updateOne(
          { _id: comment.quote, commentsCount: { $gt: 0 } },
          { $inc: { commentsCount: -1 } }
        );
      }
      removedComments += 1;
    }
  }

  if (deletedPosts || removedComments) {
    console.log(
      `[moderation] Deleted ${deletedPosts} abusive posts; removed ${removedComments} abusive comments`
    );
  }

  return { deletedPosts, removedComments };
};
