import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  commentQuote,
  deleteComment,
  deleteQuote,
  dislikeQuote,
  editComment,
  likeQuote,
  updateQuote,
  optimisticToggleLike,
  optimisticToggleDislike,
  optimisticUpdateQuoteText,
} from "../redux/quotes/quoteSlice";
import {
  syncAuthUser,
  followUser,
  cancelFollowRequest,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  followBack,
  updateProfile,
  patchFollowingLocal,
  patchPendingFollowLocal,
} from "../redux/auth/authSlice";
import authService from "../redux/auth/authService";
import quoteService from "../redux/quotes/quoteService";
import QuoteCard from "../components/QuoteCard";
import Pagination from "../components/Pagination";
import ProfileHero from "../components/ProfileHero";
import FollowListModal from "../components/FollowListModal";
import EditProfileModal from "../components/EditProfileModal";
import { ProfileSkeleton } from "../components/Shimmer";
import Seo from "../components/Seo";
import {
  QUOTE_CATEGORIES,
  OTHER_CATEGORY_VALUE,
} from "../constants/quoteCategories";
import { SEO_ROUTES } from "../constants/site";
import {
  canonicalProfilePath,
  profilePath,
} from "../utils/profileKey";

import {
  COMPLETE_PROFILE_DISMISSED,
  COMPLETE_PROFILE_FLAG,
  isPrivateProfileIncomplete,
} from "../utils/profileCompletion";

const PROFILE_QUOTES_PER_PAGE = 3;
const FOLLOW_LIST_LIMIT = 40;

const Profile = () => {
  const { profileKey } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [viewedProfile, setViewedProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [postsMeta, setPostsMeta] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [modalType, setModalType] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [requireUsername, setRequireUsername] = useState(false);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [postsType, setPostsType] = useState("all"); // all | community | popular

  const isOwnRoute = !profileKey;
  const profileLookupKey = profileKey
    ? decodeURIComponent(profileKey)
    : null;
  const isOwnProfile =
    isOwnRoute ||
    (!!viewedProfile &&
      !!currentUser &&
      viewedProfile._id?.toString() === currentUser._id?.toString());
  const profileTargetKey = isOwnProfile
    ? null
    : viewedProfile?.profileKey ||
      (viewedProfile?.username
        ? `@${viewedProfile.username}`
        : profileLookupKey);

  const loadViewedProfile = async ({
    silent = false,
    page = currentPage,
  } = {}) => {
    if (!currentUser) return;
    if (!silent) {
      setProfileLoading(true);
      setProfileError("");
    }

    try {
      const params = { page, limit: PROFILE_QUOTES_PER_PAGE };
      if (
        (isOwnRoute || isOwnProfile) &&
        currentUser?.role === "admin" &&
        postsType !== "all"
      ) {
        params.postsType = postsType;
      }
      const profile = isOwnRoute
        ? await authService.getProfile(params)
        : await authService.getUserById(profileLookupKey, params);

      setViewedProfile(profile);
      setProfilePosts(profile.posts || profile.postsPagination?.quotes || []);
      setPostsMeta(
        profile.postsPagination || {
          page: 1,
          totalPages: 1,
          total: (profile.posts || []).length,
        }
      );

      if (profile.isOwnProfile || isOwnRoute) {
        // Reuse loaded profile — avoid a second /users/profile round-trip.
        dispatch(syncAuthUser(profile));
        const needsUsername =
          !profile.username ||
          profile.needsUsername ||
          searchParams.get("setup") === "1";
        const needsComplete =
          searchParams.get("complete") === "1" ||
          localStorage.getItem(COMPLETE_PROFILE_FLAG) === "1";

        if (needsUsername) {
          setRequireUsername(true);
          setShowEditProfile(true);
        } else if (needsComplete) {
          setRequireUsername(false);
          const dismissed =
            localStorage.getItem(COMPLETE_PROFILE_DISMISSED) === "1";
          if (!dismissed) setShowCompleteBanner(true);
          if (searchParams.get("complete") === "1") {
            navigate("/profile", { replace: true });
          }
        }
      }

      const canonical = canonicalProfilePath(profile, currentUser?._id);
      const currentPath = isOwnRoute
        ? "/profile"
        : `/profile/${profileLookupKey}`;
      if (canonical !== currentPath) {
        navigate(canonical, { replace: true });
      }
    } catch (error) {
      if (!silent) {
        setProfileError(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to load profile"
        );
        setViewedProfile(null);
        setProfilePosts([]);
      }
    } finally {
      if (!silent) setProfileLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setViewedProfile(null);
    setProfilePosts([]);
    setPostsMeta(null);
    setProfileError("");
    setModalType(null);
    setPostsType("all");
  }, [profileLookupKey]);

  useEffect(() => {
    loadViewedProfile({ page: currentPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, profileLookupKey, currentUser?._id, currentPage, postsType]);

  useEffect(() => {
    if (!modalType || !viewedProfile?._id) {
      setModalUsers([]);
      return;
    }

    let cancelled = false;
    const loadFollowList = async () => {
      setModalLoading(true);
      try {
        const payload =
          modalType === "followers"
            ? await quoteService.getFollowers(profileTargetKey, {
                page: 1,
                limit: FOLLOW_LIST_LIMIT,
              })
            : await quoteService.getFollowing(profileTargetKey, {
                page: 1,
                limit: FOLLOW_LIST_LIMIT,
              });
        if (!cancelled) {
          setModalUsers(payload.users || []);
        }
      } catch {
        if (!cancelled) setModalUsers([]);
      } finally {
        if (!cancelled) setModalLoading(false);
      }
    };

    loadFollowList();
    return () => {
      cancelled = true;
    };
  }, [modalType, viewedProfile?._id, profileTargetKey]);

  const totalPages = Math.max(1, postsMeta?.totalPages || 1);
  const activePage = Math.min(currentPage, totalPages);
  const paginatedQuotes = profilePosts;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const userSnapshot = currentUser
    ? {
        _id: currentUser._id,
        name: currentUser.name,
        profilePicture: currentUser.profilePicture,
      }
    : null;

  const handleEditClick = (quote) => {
    setEditQuoteId(quote._id);
    setEditText(quote.text);
    const known = QUOTE_CATEGORIES.includes(quote.category);
    setEditCategory(
      known ? quote.category || "" : quote.category ? OTHER_CATEGORY_VALUE : ""
    );
    setEditCustomCategory(known ? "" : quote.category || "");
  };

  const handleSaveClick = (id) => {
    if (!editText.trim()) return;
    if (editCategory === OTHER_CATEGORY_VALUE && !editCustomCategory.trim()) {
      return;
    }
    const text = editText.trim();
    const category =
      editCategory === OTHER_CATEGORY_VALUE
        ? editCustomCategory.trim().toLowerCase()
        : editCategory;
    dispatch(optimisticUpdateQuoteText({ id, text, category }));
    setProfilePosts((prev) =>
      prev.map((q) => (q._id === id ? { ...q, text, category } : q))
    );
    setEditQuoteId(null);
    dispatch(updateQuote({ id, text, category })).then((action) => {
      if (updateQuote.rejected.match(action)) {
        loadViewedProfile({ silent: true, page: currentPage });
      }
    });
  };

  const handleDelete = (id) => {
    dispatch(deleteQuote(id)).then((action) => {
      if (deleteQuote.fulfilled.match(action)) {
        setProfilePosts((prev) => prev.filter((q) => q._id !== id));
        setViewedProfile((prev) =>
          prev
            ? {
                ...prev,
                postCount: Math.max(0, (prev.postCount || 1) - 1),
              }
            : prev
        );
      }
    });
  };

  const handleLike = (id) => {
    if (!currentUser) return;
    dispatch(
      optimisticToggleLike({
        quoteId: id,
        userId: currentUser._id,
        userSnapshot,
      })
    );
    setProfilePosts((prev) =>
      prev.map((q) => {
        if (q._id !== id) return q;
        const liked = q.likedByMe;
        return {
          ...q,
          likedByMe: !liked,
          dislikedByMe: false,
          likesCount: Math.max(0, (q.likesCount || 0) + (liked ? -1 : 1)),
          dislikesCount: q.dislikedByMe
            ? Math.max(0, (q.dislikesCount || 0) - 1)
            : q.dislikesCount || 0,
        };
      })
    );
    dispatch(likeQuote(id)).then((action) => {
      if (likeQuote.rejected.match(action)) {
        loadViewedProfile({ silent: true, page: currentPage });
      }
    });
  };

  const handleDislike = (id) => {
    if (!currentUser) return;
    dispatch(
      optimisticToggleDislike({
        quoteId: id,
        userId: currentUser._id,
        userSnapshot,
      })
    );
    setProfilePosts((prev) =>
      prev.map((q) => {
        if (q._id !== id) return q;
        const disliked = q.dislikedByMe;
        return {
          ...q,
          dislikedByMe: !disliked,
          likedByMe: false,
          dislikesCount: Math.max(
            0,
            (q.dislikesCount || 0) + (disliked ? -1 : 1)
          ),
          likesCount: q.likedByMe
            ? Math.max(0, (q.likesCount || 0) - 1)
            : q.likesCount || 0,
        };
      })
    );
    dispatch(dislikeQuote(id)).then((action) => {
      if (dislikeQuote.rejected.match(action)) {
        loadViewedProfile({ silent: true, page: currentPage });
      }
    });
  };

  const handleComment = async (quoteId, text, language = "english") => {
    const action = await dispatch(
      commentQuote({ id: quoteId, text, language })
    );
    if (commentQuote.rejected.match(action)) {
      throw new Error(action.payload || "Unable to post comment");
    }
    await loadViewedProfile({ silent: true, page: currentPage });
  };

  const handleEditComment = (comment) => {
    if (!comment?._id) {
      setEditCommentId(null);
      setEditCommentText("");
      return;
    }
    setEditCommentId(comment._id);
    setEditCommentText(comment.text);
  };

  const handleSaveComment = async (quoteId, commentId) => {
    if (!editCommentText.trim()) return;
    const action = await dispatch(
      editComment({ quoteId, commentId, text: editCommentText.trim() })
    );
    if (editComment.rejected.match(action)) {
      throw new Error(action.payload || "Unable to update comment");
    }
    setEditCommentId(null);
    await loadViewedProfile({ silent: true, page: currentPage });
  };

  const handleDeleteComment = (quoteId, commentId) => {
    dispatch(deleteComment({ quoteId, commentId })).then(() => {
      loadViewedProfile({ silent: true, page: currentPage });
    });
  };

  const applyOptimisticFollow = (targetId, willFollow, targetSnapshot) => {
    dispatch(
      patchFollowingLocal({
        targetId,
        following: willFollow,
        targetSnapshot,
      })
    );
    if (willFollow) {
      dispatch(patchPendingFollowLocal({ targetId, requested: false }));
    }

    setViewedProfile((prev) => {
      if (!prev) return prev;

      if (prev._id?.toString() === targetId.toString()) {
        return {
          ...prev,
          isFollowing: willFollow,
          followRequested: false,
          canFollowBack: willFollow ? false : prev.canFollowBack,
          followerCount: Math.max(
            0,
            (prev.followerCount || 0) + (willFollow ? 1 : -1)
          ),
        };
      }

      if (prev._id?.toString() === currentUser._id?.toString()) {
        return {
          ...prev,
          followingCount: Math.max(
            0,
            (prev.followingCount || 0) + (willFollow ? 1 : -1)
          ),
        };
      }

      return prev;
    });

    setModalUsers((prev) => {
      if (!willFollow && modalType === "following" && isOwnProfile) {
        return prev.filter((u) => u._id?.toString() !== targetId.toString());
      }
      if (
        willFollow &&
        modalType === "following" &&
        isOwnProfile &&
        targetSnapshot
      ) {
        const exists = prev.some(
          (u) => u._id?.toString() === targetId.toString()
        );
        return exists ? prev : [...prev, targetSnapshot];
      }
      return prev;
    });
  };

  const applyOptimisticRequest = (targetId, requested) => {
    dispatch(patchPendingFollowLocal({ targetId, requested }));
    setViewedProfile((prev) => {
      if (!prev || prev._id?.toString() !== targetId.toString()) return prev;
      return {
        ...prev,
        followRequested: requested,
        isFollowing: false,
      };
    });
  };

  const handleFollowToggleProfile = () => {
    if (!viewedProfile?._id || isOwnProfile) return;
    const currentlyFollowing = !!viewedProfile.isFollowing;
    const targetId = viewedProfile._id;
    const snapshot = {
      _id: viewedProfile._id,
      name: viewedProfile.name,
      profilePicture: viewedProfile.profilePicture,
      username: viewedProfile.username,
    };

    if (currentlyFollowing) {
      applyOptimisticFollow(targetId, false, snapshot);
      dispatch(unfollowUser(targetId)).then((result) => {
        if (unfollowUser.rejected.match(result)) {
          applyOptimisticFollow(targetId, true, snapshot);
        }
      });
      return;
    }

    // Send follow request (not instant follow)
    applyOptimisticRequest(targetId, true);
    dispatch(followUser(targetId)).then((result) => {
      if (followUser.rejected.match(result)) {
        applyOptimisticRequest(targetId, false);
        return;
      }
      if (result.payload?.following) {
        applyOptimisticRequest(targetId, false);
        applyOptimisticFollow(targetId, true, snapshot);
      }
    });
  };

  const handleCancelRequestProfile = () => {
    if (!viewedProfile?._id || isOwnProfile) return;
    const targetId = viewedProfile._id;
    applyOptimisticRequest(targetId, false);
    dispatch(cancelFollowRequest(targetId)).then((result) => {
      if (cancelFollowRequest.rejected.match(result)) {
        applyOptimisticRequest(targetId, true);
      }
    });
  };

  const handleAcceptIncoming = () => {
    if (!viewedProfile?.incomingFollowRequestId) return;
    const requestId = viewedProfile.incomingFollowRequestId;
    setViewedProfile((prev) =>
      prev
        ? {
            ...prev,
            incomingFollowRequest: false,
            incomingFollowRequestId: null,
            followsYou: true,
            canFollowBack: !prev.isFollowing,
          }
        : prev
    );
    dispatch(acceptFollowRequest(requestId)).then((result) => {
      if (acceptFollowRequest.rejected.match(result)) {
        loadViewedProfile({ silent: true });
        return;
      }
      const payload = result.payload || {};
      // Accept = requester follows you. On their profile: only their followingCount changes.
      setViewedProfile((prev) => {
        if (!prev) return prev;
        const requesterCounts = payload.requester;
        const isRequesterProfile =
          prev._id?.toString() === (payload.requesterId || "").toString();
        return {
          ...prev,
          followsYou: true,
          canFollowBack: payload.canFollowBack !== false,
          incomingFollowRequest: false,
          incomingFollowRequestId: null,
          ...(isRequesterProfile && requesterCounts
            ? {
                followingCount: requesterCounts.followingCount,
                followerCount: requesterCounts.followerCount,
              }
            : isRequesterProfile
              ? {
                  followingCount: (prev.followingCount || 0) + 1,
                }
              : {}),
        };
      });
    });
  };

  const handleRejectIncoming = () => {
    if (!viewedProfile?.incomingFollowRequestId) return;
    const requestId = viewedProfile.incomingFollowRequestId;
    setViewedProfile((prev) =>
      prev
        ? {
            ...prev,
            incomingFollowRequest: false,
            incomingFollowRequestId: null,
          }
        : prev
    );
    dispatch(rejectFollowRequest(requestId)).then((result) => {
      if (rejectFollowRequest.rejected.match(result)) {
        loadViewedProfile({ silent: true });
      }
    });
  };

  const handleFollowBackProfile = () => {
    if (!viewedProfile?._id) return;
    const targetId = viewedProfile._id;
    const snapshot = {
      _id: viewedProfile._id,
      name: viewedProfile.name,
      profilePicture: viewedProfile.profilePicture,
      username: viewedProfile.username,
    };
    // Follow back = I follow them → their followers +1, my following +1
    applyOptimisticFollow(targetId, true, snapshot);
    setViewedProfile((prev) =>
      prev ? { ...prev, canFollowBack: false, followsYou: true } : prev
    );
    dispatch(followBack(targetId)).then((result) => {
      if (followBack.rejected.match(result)) {
        applyOptimisticFollow(targetId, false, snapshot);
        setViewedProfile((prev) =>
          prev ? { ...prev, canFollowBack: true } : prev
        );
        return;
      }
      const targetCounts = result.payload?.target;
      if (targetCounts) {
        setViewedProfile((prev) =>
          prev && prev._id?.toString() === targetId.toString()
            ? {
                ...prev,
                followerCount: targetCounts.followerCount,
                followingCount: targetCounts.followingCount,
                canFollowBack: false,
                isFollowing: true,
              }
            : prev
        );
      }
    });
  };

  const patchModalUserFlags = (personId, flags) => {
    setModalUsers((prev) =>
      prev.map((u) =>
        u._id?.toString() === personId.toString() ? { ...u, ...flags } : u
      )
    );
  };

  const handleFollowToggleInModal = (person, relation = {}) => {
    const personId = person?._id;
    if (!personId) return;

    const followedByMe = !!relation.followedByMe;
    const followRequested = !!relation.followRequested;
    const canFollowBack = !!relation.canFollowBack;

    setBusyId(personId);

    const snapshot = {
      _id: person._id,
      name: person.name,
      username: person.username,
      profilePicture: person.profilePicture,
    };

    // Unfollow
    if (followedByMe) {
      const prevFlags = {
        followedByMe: true,
        followRequested: false,
        canFollowBack: !!person.followsYou,
        followsYou: !!person.followsYou,
      };
      patchModalUserFlags(personId, {
        followedByMe: false,
        followRequested: false,
        canFollowBack: !!person.followsYou,
      });
      applyOptimisticFollow(personId, false, snapshot);
      dispatch(unfollowUser(personId)).then((result) => {
        setBusyId(null);
        if (unfollowUser.rejected.match(result)) {
          patchModalUserFlags(personId, prevFlags);
          applyOptimisticFollow(personId, true, snapshot);
          return;
        }
        // Own following list: remove row live
        if (modalType === "following" && isOwnProfile) {
          setModalUsers((prev) =>
            prev.filter((u) => u._id?.toString() !== personId.toString())
          );
        }
      });
      return;
    }

    // Cancel pending request
    if (followRequested) {
      patchModalUserFlags(personId, {
        followRequested: false,
        followedByMe: false,
        canFollowBack: !!person.followsYou,
      });
      dispatch(patchPendingFollowLocal({ targetId: personId, requested: false }));
      dispatch(cancelFollowRequest(personId)).then((result) => {
        setBusyId(null);
        if (cancelFollowRequest.rejected.match(result)) {
          patchModalUserFlags(personId, {
            followRequested: true,
            followedByMe: false,
            canFollowBack: false,
          });
          dispatch(
            patchPendingFollowLocal({ targetId: personId, requested: true })
          );
        }
      });
      return;
    }

    // Follow back (instant mutual edge)
    if (canFollowBack) {
      patchModalUserFlags(personId, {
        followedByMe: true,
        followRequested: false,
        canFollowBack: false,
        followsYou: true,
      });
      applyOptimisticFollow(personId, true, snapshot);
      dispatch(followBack(personId)).then((result) => {
        setBusyId(null);
        if (followBack.rejected.match(result)) {
          patchModalUserFlags(personId, {
            followedByMe: false,
            followRequested: false,
            canFollowBack: true,
            followsYou: true,
          });
          applyOptimisticFollow(personId, false, snapshot);
          return;
        }
        const target = result.payload?.target;
        if (target) {
          patchModalUserFlags(personId, {
            followedByMe: true,
            canFollowBack: false,
            followsYou: true,
          });
        }
      });
      return;
    }

    // Send follow request
    patchModalUserFlags(personId, {
      followRequested: true,
      followedByMe: false,
      canFollowBack: false,
    });
    dispatch(patchPendingFollowLocal({ targetId: personId, requested: true }));
    dispatch(followUser(personId)).then((result) => {
      setBusyId(null);
      if (followUser.rejected.match(result)) {
        patchModalUserFlags(personId, {
          followRequested: false,
          followedByMe: false,
          canFollowBack: !!person.followsYou,
        });
        dispatch(
          patchPendingFollowLocal({ targetId: personId, requested: false })
        );
        return;
      }
      if (result.payload?.following) {
        patchModalUserFlags(personId, {
          followedByMe: true,
          followRequested: false,
          canFollowBack: false,
        });
        dispatch(
          patchPendingFollowLocal({ targetId: personId, requested: false })
        );
        applyOptimisticFollow(personId, true, snapshot);
      }
    });
  };

  const handleFollowToggleOnQuote = (
    authorId,
    currentlyFollowing,
    author,
    currentlyRequested
  ) => {
    if (!authorId) return;
    handleFollowToggleInModal(author || { _id: authorId }, {
      followedByMe: !!currentlyFollowing,
      followRequested: !!currentlyRequested,
      canFollowBack: false,
    });
  };

  const handleSelectUser = (personOrId) => {
    setModalType(null);
    const person =
      typeof personOrId === "object" && personOrId
        ? personOrId
        : { _id: personOrId };
    navigate(profilePath(person, currentUser?._id));
  };

  const handleSaveProfile = async (data) => {
    setSavingProfile(true);
    setViewedProfile((prev) => (prev ? { ...prev, ...data } : prev));
    try {
      const updated = await dispatch(updateProfile(data)).unwrap();
      setViewedProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setRequireUsername(false);
      setShowEditProfile(false);
      setShowCompleteBanner(false);
      localStorage.removeItem(COMPLETE_PROFILE_FLAG);
      localStorage.removeItem(COMPLETE_PROFILE_DISMISSED);

      const wasSetup = searchParams.get("setup") === "1";
      const wasComplete = searchParams.get("complete") === "1";
      const stillNeedsDetails = isPrivateProfileIncomplete(updated);

      if (wasSetup && stillNeedsDetails) {
        localStorage.setItem(COMPLETE_PROFILE_FLAG, "1");
        setShowCompleteBanner(true);
        navigate("/profile", { replace: true });
        return;
      }

      if (wasSetup || wasComplete) {
        navigate("/", { replace: true });
        return;
      }
    } catch (err) {
      await loadViewedProfile({ silent: true });
      const message =
        (typeof err === "object" && err?.message) ||
        (typeof err === "string" ? err : null) ||
        "Could not save profile";
      const error = new Error(message);
      error.status = typeof err === "object" ? err?.status : undefined;
      error.payload = err;
      throw error;
    } finally {
      setSavingProfile(false);
    }
  };

  if (!currentUser) {
    return (
      <p className="p-4 text-center">Please login to view your profile.</p>
    );
  }

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  if (profileError || !viewedProfile) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 mb-4">
          {profileError || "Profile not found"}
        </p>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="text-blue-600 font-semibold"
        >
          Back to your profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-8">
      <Seo
        title={
          viewedProfile?.name
            ? `${viewedProfile.name}${
                viewedProfile.username ? ` (@${viewedProfile.username})` : ""
              } | Quotwellix`
            : SEO_ROUTES.profile.title
        }
        description={
          viewedProfile?.name
            ? `${viewedProfile.name} on Quotwellix — read their shared quotes in English and Hindi, popular posts, and community wisdom.`
            : SEO_ROUTES.profile.description
        }
        path={
          isOwnProfile
            ? SEO_ROUTES.profile.path
            : viewedProfile
              ? profilePath(viewedProfile, currentUser?._id)
              : profileKey
                ? `/profile/${profileKey}`
                : SEO_ROUTES.profile.path
        }
        noindex={isOwnProfile || !viewedProfile}
      />
      <ProfileHero
        profile={viewedProfile}
        postCount={
          viewedProfile.postCount ??
          ((viewedProfile.communityPostCount || 0) +
            (viewedProfile.popularPostCount || 0) ||
            profilePosts.length)
        }
        isOwnProfile={isOwnProfile}
        isFollowing={!!viewedProfile.isFollowing}
        followRequested={!!viewedProfile.followRequested}
        incomingFollowRequest={!!viewedProfile.incomingFollowRequest}
        canFollowBack={!!viewedProfile.canFollowBack}
        onOpenSettings={() => setShowEditProfile(true)}
        onFollowToggle={handleFollowToggleProfile}
        onCancelRequest={handleCancelRequestProfile}
        onAcceptRequest={handleAcceptIncoming}
        onRejectRequest={handleRejectIncoming}
        onFollowBack={handleFollowBackProfile}
        onOpenFollowers={() => setModalType("followers")}
        onOpenFollowing={() => setModalType("following")}
      />

      {isOwnProfile && showCompleteBanner && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900 dark:bg-indigo-950/40">
          <div>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              Finish your private profile details
            </p>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
              Optional — helps recovery and account safety. You can skip anytime.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowEditProfile(true)}
              className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Complete now
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(COMPLETE_PROFILE_DISMISSED, "1");
                localStorage.removeItem(COMPLETE_PROFILE_FLAG);
                setShowCompleteBanner(false);
              }}
              className="rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-3 sm:mt-8 sm:space-y-4">
        {isOwnProfile &&
          (currentUser?.role === "admin" || viewedProfile?.canFilterPostTypes) && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {[
                {
                  id: "all",
                  label: "All",
                  count:
                    (viewedProfile.communityPostCount || 0) +
                    (viewedProfile.popularPostCount || 0),
                },
                {
                  id: "community",
                  label: "My quotes",
                  count: viewedProfile.communityPostCount || 0,
                },
                {
                  id: "popular",
                  label: "Popular",
                  count: viewedProfile.popularPostCount || 0,
                },
              ].map((tab) => {
                const active = postsType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (postsType === tab.id) return;
                      setPostsType(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        {paginatedQuotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-gray-500 dark:text-slate-400">
              {postsType === "popular"
                ? "No popular quotes posted yet."
                : postsType === "community"
                  ? "No community quotes posted yet."
                  : "No quotes yet."}
            </p>
            {isOwnProfile && postsType !== "popular" && (
              <Link
                to="/quotes#compose"
                className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Post your first quote
              </Link>
            )}
            {isOwnProfile && postsType === "popular" && (
              <Link
                to="/popular-quotes"
                className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Publish a popular quote
              </Link>
            )}
          </div>
        ) : (
          paginatedQuotes.map((quote) => (
            <QuoteCard
              key={quote._id}
              quote={quote}
              user={currentUser}
              onLike={handleLike}
              onDislike={handleDislike}
              onComment={handleComment}
              onDelete={handleDelete}
              onEdit={handleEditClick}
              onSave={handleSaveClick}
              onEditComment={handleEditComment}
              onSaveComment={handleSaveComment}
              onDeleteComment={handleDeleteComment}
              onFollowToggle={handleFollowToggleOnQuote}
              editQuoteId={editQuoteId}
              editText={editText}
              setEditText={setEditText}
              editCategory={editCategory}
              setEditCategory={setEditCategory}
              editCustomCategory={editCustomCategory}
              setEditCustomCategory={setEditCustomCategory}
              editCommentId={editCommentId}
              editCommentText={editCommentText}
              setEditCommentText={setEditCommentText}
            />
          ))
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            label="Profile quote pages"
          />
        )}
      </div>

      {modalType && (
        <FollowListModal
          title={
            modalType === "followers" ? "Followers" : "Following"
          }
          users={modalUsers}
          loading={modalLoading}
          currentUser={currentUser}
          onClose={() => setModalType(null)}
          onSelectUser={handleSelectUser}
          onFollowToggle={handleFollowToggleInModal}
          busyId={busyId}
        />
      )}

      {showEditProfile && isOwnProfile && (
        <EditProfileModal
          profile={viewedProfile}
          onClose={() => {
            if (requireUsername) return;
            if (searchParams.get("complete") === "1") {
              localStorage.setItem(COMPLETE_PROFILE_DISMISSED, "1");
              localStorage.removeItem(COMPLETE_PROFILE_FLAG);
              setShowCompleteBanner(false);
              setShowEditProfile(false);
              navigate("/profile", { replace: true });
              return;
            }
            setShowEditProfile(false);
          }}
          onSave={handleSaveProfile}
          isSaving={savingProfile}
          requireUsername={requireUsername || !viewedProfile.username}
        />
      )}
    </div>
  );
};

export default Profile;
