import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import Quote from "../models/Quote.js";
import QuoteDislike from "../models/QuoteDislike.js";
import QuoteLike from "../models/QuoteLike.js";
import User from "../models/User.js";
import { syncQotdStarsFromHistory } from "./selectQuoteOfTheDay.js";

/**
 * One-time (idempotent) migration from embedded arrays → split collections.
 * Safe to run on every boot; skips work once markers look migrated.
 */
export const migrateNormalizedSocialData = async () => {
  // Users may still have legacy followers/following fields in Mongo even if
  // removed from the Mongoose schema — read via native collection.
  const userColl = User.collection;
  const quoteColl = Quote.collection;

  let followsCreated = 0;
  let likesCreated = 0;
  let dislikesCreated = 0;
  let commentsCreated = 0;

  const users = await userColl
    .find({
      $or: [
        { followers: { $exists: true, $ne: [] } },
        { following: { $exists: true, $ne: [] } },
      ],
    })
    .project({ followers: 1, following: 1 })
    .toArray();

  for (const user of users) {
    const following = Array.isArray(user.following) ? user.following : [];
    for (const targetId of following) {
      try {
        await Follow.updateOne(
          { follower: user._id, following: targetId },
          { $setOnInsert: { follower: user._id, following: targetId } },
          { upsert: true }
        );
        followsCreated += 1;
      } catch {
        // duplicate ignore
      }
    }
  }

  // Rebuild follow counts from Follow collection
  const followCounts = await Follow.aggregate([
    {
      $facet: {
        followers: [
          { $group: { _id: "$following", count: { $sum: 1 } } },
        ],
        following: [
          { $group: { _id: "$follower", count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  const followerMap = new Map(
    (followCounts[0]?.followers || []).map((r) => [r._id.toString(), r.count])
  );
  const followingMap = new Map(
    (followCounts[0]?.following || []).map((r) => [r._id.toString(), r.count])
  );
  const allUserIds = await userColl.distinct("_id");
  for (const id of allUserIds) {
    const key = id.toString();
    await userColl.updateOne(
      { _id: id },
      {
        $set: {
          followerCount: followerMap.get(key) || 0,
          followingCount: followingMap.get(key) || 0,
        },
        $unset: { followers: "", following: "" },
      }
    );
  }

  const legacyQuotes = await quoteColl
    .find({
      $or: [
        { likes: { $exists: true, $ne: [] } },
        { dislikes: { $exists: true, $ne: [] } },
        { comments: { $exists: true, $ne: [] } },
      ],
    })
    .project({ likes: 1, dislikes: 1, comments: 1 })
    .toArray();

  for (const quote of legacyQuotes) {
    for (const userId of quote.likes || []) {
      try {
        await QuoteLike.updateOne(
          { quote: quote._id, user: userId },
          { $setOnInsert: { quote: quote._id, user: userId } },
          { upsert: true }
        );
        likesCreated += 1;
      } catch {
        /* ignore */
      }
    }
    for (const userId of quote.dislikes || []) {
      try {
        await QuoteDislike.updateOne(
          { quote: quote._id, user: userId },
          { $setOnInsert: { quote: quote._id, user: userId } },
          { upsert: true }
        );
        dislikesCreated += 1;
      } catch {
        /* ignore */
      }
    }
    for (const comment of quote.comments || []) {
      if (!comment?.user || !comment?.text) continue;
      const exists = await Comment.findOne({
        quote: quote._id,
        user: comment.user,
        text: comment.text,
        createdAt: comment.createdAt,
      }).select("_id");
      if (exists) continue;
      await Comment.create({
        quote: quote._id,
        user: comment.user,
        text: comment.text,
        createdAt: comment.createdAt || new Date(),
        updatedAt: comment.updatedAt || comment.createdAt || new Date(),
      });
      commentsCreated += 1;
    }

    const [likesCount, dislikesCount, commentsCount] = await Promise.all([
      QuoteLike.countDocuments({ quote: quote._id }),
      QuoteDislike.countDocuments({ quote: quote._id }),
      Comment.countDocuments({ quote: quote._id }),
    ]);

    await quoteColl.updateOne(
      { _id: quote._id },
      {
        $set: { likesCount, dislikesCount, commentsCount },
        $unset: { likes: "", dislikes: "", comments: "" },
      }
    );
  }

  // Ensure counts exist on all quotes
  await quoteColl.updateMany(
    { likesCount: { $exists: false } },
    { $set: { likesCount: 0, dislikesCount: 0, commentsCount: 0 } }
  );
  await userColl.updateMany(
    { followerCount: { $exists: false } },
    { $set: { followerCount: 0, followingCount: 0 } }
  );

  // Sync postCount
  const postCounts = await Quote.aggregate([
    { $group: { _id: "$author", count: { $sum: 1 } } },
  ]);
  for (const row of postCounts) {
    await User.updateOne(
      { _id: row._id },
      { $set: { postCount: row.count } }
    );
  }

  try {
    await syncQotdStarsFromHistory();
  } catch (error) {
    console.warn(`[migrate] QOTD star sync skipped: ${error.message}`);
  }

  const changed =
    followsCreated + likesCreated + dislikesCreated + commentsCreated;
  if (changed) {
    console.log(
      `[migrate] Normalized legacy data — follows~${followsCreated}, likes~${likesCreated}, dislikes~${dislikesCreated}, comments~${commentsCreated}`
    );
  }
};
