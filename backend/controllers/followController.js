import Follow from "../models/Follow.js";
import FollowRequest from "../models/FollowRequest.js";
import Notification, { notificationCutoffDate } from "../models/Notification.js";
import User from "../models/User.js";
import { USER_CARD_SELECT } from "../utils/quoteSerializer.js";
import {
  parsePagination,
  paginatedResponse,
} from "../utils/pagination.js";

const actorSelect = USER_CARD_SELECT;

const createFollowEdge = async (followerId, followingId) => {
  const created = await Follow.updateOne(
    { follower: followerId, following: followingId },
    {
      $setOnInsert: { follower: followerId, following: followingId },
    },
    { upsert: true }
  );
  const inserted = (created.upsertedCount || 0) > 0 || Boolean(created.upsertedId);
  if (inserted) {
    // follower → following: only follower's followingCount and target's followerCount
    await Promise.all([
      User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }),
      User.updateOne({ _id: followingId }, { $inc: { followerCount: 1 } }),
    ]);
  }
  return inserted;
};

const removeFollowEdge = async (followerId, followingId) => {
  const removed = await Follow.deleteOne({
    follower: followerId,
    following: followingId,
  });
  if (removed.deletedCount > 0) {
    await Promise.all([
      User.updateOne(
        { _id: followerId, followingCount: { $gt: 0 } },
        { $inc: { followingCount: -1 } }
      ),
      User.updateOne(
        { _id: followingId, followerCount: { $gt: 0 } },
        { $inc: { followerCount: -1 } }
      ),
    ]);
  }
  return removed.deletedCount > 0;
};

/** Recompute denormalized counts from Follow edges (source of truth). */
const recountUserFollowStats = async (...userIds) => {
  const unique = [
    ...new Set(userIds.filter(Boolean).map((id) => id.toString())),
  ];
  const stats = {};
  await Promise.all(
    unique.map(async (id) => {
      const [followingCount, followerCount] = await Promise.all([
        Follow.countDocuments({ follower: id }),
        Follow.countDocuments({ following: id }),
      ]);
      await User.updateOne(
        { _id: id },
        { $set: { followingCount, followerCount } }
      );
      stats[id] = { followingCount, followerCount };
    })
  );
  return stats;
};

/** Send follow request (replaces instant follow). */
export const requestFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const target = await User.findById(targetId).select("_id name");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = await Follow.exists({
      follower: req.user.id,
      following: targetId,
    });
    if (alreadyFollowing) {
      return res.json({
        message: "Already following",
        following: true,
        requested: false,
        targetId,
      });
    }

    const existing = await FollowRequest.findOne({
      from: req.user.id,
      to: targetId,
    });

    if (existing?.status === "pending") {
      return res.json({
        message: "Follow request already sent",
        following: false,
        requested: true,
        targetId,
        requestId: existing._id,
      });
    }

    let requestDoc;
    if (existing) {
      existing.status = "pending";
      await existing.save();
      requestDoc = existing;
    } else {
      requestDoc = await FollowRequest.create({
        from: req.user.id,
        to: targetId,
        status: "pending",
      });
    }

    await Notification.findOneAndUpdate(
      {
        user: targetId,
        type: "follow_request",
        followRequest: requestDoc._id,
      },
      {
        $set: {
          actor: req.user.id,
          actionState: "pending",
          message: "requested to follow you",
          read: false,
        },
        $setOnInsert: {
          user: targetId,
          type: "follow_request",
          followRequest: requestDoc._id,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Follow request sent",
      following: false,
      requested: true,
      targetId,
      requestId: requestDoc._id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

/** Cancel an outgoing pending request. */
export const cancelFollowRequest = async (req, res) => {
  try {
    const targetId = req.params.id;
    const requestDoc = await FollowRequest.findOne({
      from: req.user.id,
      to: targetId,
      status: "pending",
    });
    if (!requestDoc) {
      return res.status(404).json({ message: "No pending request found" });
    }

    requestDoc.status = "cancelled";
    await requestDoc.save();

    await Notification.updateMany(
      { followRequest: requestDoc._id, type: "follow_request" },
      { $set: { actionState: "cancelled", read: true } }
    );

    res.json({
      message: "Follow request cancelled",
      following: false,
      requested: false,
      targetId,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    await removeFollowEdge(req.user.id, targetId);

    const pending = await FollowRequest.findOne({
      from: req.user.id,
      to: targetId,
      status: "pending",
    });
    if (pending) {
      pending.status = "cancelled";
      await pending.save();
      await Notification.updateMany(
        { followRequest: pending._id, type: "follow_request" },
        { $set: { actionState: "cancelled", read: true } }
      );
    }

    res.json({
      message: "Unfollowed successfully",
      following: false,
      requested: false,
      targetId,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const acceptFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const requestDoc = await FollowRequest.findById(requestId);
    if (!requestDoc || requestDoc.to.toString() !== req.user.id) {
      return res.status(404).json({ message: "Follow request not found" });
    }
    if (requestDoc.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${requestDoc.status}`,
        status: requestDoc.status,
      });
    }

    requestDoc.status = "accepted";
    await requestDoc.save();
    // User1 (from) follows User2 (to): User1.following++, User2.followers++ only
    await createFollowEdge(requestDoc.from, requestDoc.to);
    const counts = await recountUserFollowStats(requestDoc.from, requestDoc.to);

    await Notification.updateMany(
      { followRequest: requestDoc._id, type: "follow_request" },
      { $set: { actionState: "accepted", read: true } }
    );

    // Notify requester that they were accepted
    await Notification.create({
      user: requestDoc.from,
      type: "follow_accepted",
      actor: req.user.id,
      followRequest: requestDoc._id,
      actionState: "none",
      message: "accepted your follow request",
      read: false,
    });

    const requesterId = requestDoc.from.toString();
    const accepterId = requestDoc.to.toString();
    const iFollowThem = await Follow.exists({
      follower: req.user.id,
      following: requestDoc.from,
    });

    res.json({
      message: "Follow request accepted",
      following: Boolean(iFollowThem),
      followsYou: true,
      canFollowBack: !iFollowThem,
      requesterId,
      requestId: requestDoc._id,
      actionState: "accepted",
      requester: {
        _id: requesterId,
        followingCount: counts[requesterId]?.followingCount ?? 0,
        followerCount: counts[requesterId]?.followerCount ?? 0,
      },
      accepter: {
        _id: accepterId,
        followingCount: counts[accepterId]?.followingCount ?? 0,
        followerCount: counts[accepterId]?.followerCount ?? 0,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const rejectFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const requestDoc = await FollowRequest.findById(requestId);
    if (!requestDoc || requestDoc.to.toString() !== req.user.id) {
      return res.status(404).json({ message: "Follow request not found" });
    }
    if (requestDoc.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${requestDoc.status}`,
        status: requestDoc.status,
      });
    }

    requestDoc.status = "rejected";
    await requestDoc.save();

    await Notification.updateMany(
      { followRequest: requestDoc._id, type: "follow_request" },
      { $set: { actionState: "rejected", read: true } }
    );

    res.json({
      message: "Follow request cancelled",
      actionState: "rejected",
      requestId: requestDoc._id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

/** After accepting, follow the requester back (instant mutual). */
export const followBack = async (req, res) => {
  try {
    const requesterId = req.params.id;
    if (requesterId === req.user.id) {
      return res.status(400).json({ message: "Invalid target" });
    }

    const theyFollowMe = await Follow.exists({
      follower: requesterId,
      following: req.user.id,
    });
    if (!theyFollowMe) {
      return res.status(400).json({
        message: "You can follow back only after accepting their follow",
      });
    }

    await createFollowEdge(req.user.id, requesterId);
    const counts = await recountUserFollowStats(req.user.id, requesterId);

    await Notification.updateMany(
      {
        user: req.user.id,
        type: "follow_request",
        actor: requesterId,
        actionState: "accepted",
      },
      { $set: { actionState: "followed_back", read: true } }
    );

    await Notification.create({
      user: requesterId,
      type: "follow_back",
      actor: req.user.id,
      actionState: "none",
      message: "followed you back",
      read: false,
    });

    const me = req.user.id.toString();
    const them = requesterId.toString();

    res.json({
      message: "Followed back successfully",
      following: true,
      followsYou: true,
      mutual: true,
      targetId: requesterId,
      actionState: "followed_back",
      me: {
        _id: me,
        followingCount: counts[me]?.followingCount ?? 0,
        followerCount: counts[me]?.followerCount ?? 0,
      },
      target: {
        _id: them,
        followingCount: counts[them]?.followingCount ?? 0,
        followerCount: counts[them]?.followerCount ?? 0,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { limit: 30 });
    const filter = {
      user: req.user.id,
      createdAt: { $gte: notificationCutoffDate() },
    };
    const [total, unreadCount, rows] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", actorSelect)
        .lean(),
    ]);

    const notifications = rows.map((n) => ({
      _id: n._id,
      type: n.type,
      actionState: n.actionState,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
      followRequestId: n.followRequest,
      actor: n.actor
        ? {
            _id: n.actor._id,
            name: n.actor.name,
            username: n.actor.username,
            profilePicture: n.actor.profilePicture,
          }
        : null,
    }));

    res.json({
      ...paginatedResponse("notifications", notifications, total, page, limit),
      unreadCount,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false,
      createdAt: { $gte: notificationCutoffDate() },
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
    const filter = { user: req.user.id, read: false };
    if (ids?.length) {
      filter._id = { $in: ids };
    }
    const result = await Notification.updateMany(filter, {
      $set: { read: true },
    });
    res.json({ message: "Marked as read", modified: result.modifiedCount });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

/** Relationship flags for profile / cards. */
export const getFollowRelation = async (viewerId, targetId) => {
  if (!viewerId || !targetId || viewerId.toString() === targetId.toString()) {
    return {
      isFollowing: false,
      followsYou: false,
      requested: false,
      incomingRequest: false,
      incomingRequestId: null,
      canFollowBack: false,
    };
  }

  const [isFollowing, followsYou, outgoing, incoming] = await Promise.all([
    Follow.exists({ follower: viewerId, following: targetId }).then(Boolean),
    Follow.exists({ follower: targetId, following: viewerId }).then(Boolean),
    FollowRequest.findOne({
      from: viewerId,
      to: targetId,
      status: "pending",
    })
      .select("_id")
      .lean(),
    FollowRequest.findOne({
      from: targetId,
      to: viewerId,
      status: "pending",
    })
      .select("_id")
      .lean(),
  ]);

  return {
    isFollowing,
    followsYou,
    requested: Boolean(outgoing),
    incomingRequest: Boolean(incoming),
    incomingRequestId: incoming?._id || null,
    canFollowBack: followsYou && !isFollowing,
  };
};
