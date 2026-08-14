import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaQuoteLeft,
  FaEdit,
  FaSave,
  FaPaperPlane,
  FaRegCommentDots,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
} from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import {
  QUOTE_CATEGORIES,
  OTHER_CATEGORY_VALUE,
  categoryLabel,
} from "../constants/quoteCategories";
import { quoteUi } from "../constants/quoteUi";
import { profilePath } from "../utils/profileKey";
import ProfileAvatar from "./ProfileAvatar";
import FeedbackToast from "./FeedbackToast";

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 5) return "just now";
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return `${seconds}s ago`;
};

const QuoteCard = ({
  quote,
  user,
  guestMode = false,
  onRequireLogin,
  onLike,
  onDislike,
  onEdit,
  onSave,
  onDelete,
  deletingQuoteId,
  onComment,
  onEditComment,
  onSaveComment,
  onDeleteComment,
  onFollowToggle,
  allowQuoteManagement = true,
  followBusyId,
  editQuoteId,
  editText,
  setEditText,
  editCategory,
  setEditCategory,
  editCustomCategory,
  setEditCustomCategory,
  editSourceWork,
  setEditSourceWork,
  editCommentId,
  editCommentText,
  setEditCommentText,
}) => {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [visibleCount, setVisibleCount] = useState(2);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [composerFocused, setComposerFocused] = useState(false);
  const [justPostedId, setJustPostedId] = useState(null);
  const composerRef = useRef(null);

  const authorId = quote.author?._id?.toString();
  const userId = user?._id?.toString();
  const isOwnQuote = authorId && authorId === userId;
  const canManageQuote = isOwnQuote || user?.role === "admin";

  const askLogin = () => {
    if (typeof onRequireLogin === "function") {
      onRequireLogin();
      return;
    }
    navigate("/login");
  };

  // Prefer local following list (optimistic); fall back to page flag from API.
  const followingList = user?.following || [];
  const pendingList = user?.pendingFollowRequests || [];
  const listedFollowing = followingList.some(
    (entry) => (entry?._id || entry)?.toString() === authorId
  );
  const isFollowingAuthor =
    listedFollowing ||
    (Boolean(quote.followedByMe) && followingList.length === 0);
  const isRequestedAuthor =
    !isFollowingAuthor &&
    (pendingList.some((id) => id?.toString() === authorId) ||
      Boolean(quote.followRequested));


  const isLiked =
    quote.likedByMe ??
    (quote.likes || []).some(
      (entry) => (entry?._id || entry)?.toString() === userId
    );
  const isDisliked =
    quote.dislikedByMe ??
    (quote.dislikes || []).some(
      (entry) => (entry?._id || entry)?.toString() === userId
    );
  const likesCount = quote.likesCount ?? quote.likes?.length ?? 0;
  const dislikesCount = quote.dislikesCount ?? quote.dislikes?.length ?? 0;
  const commentsCount = quote.commentsCount ?? quote.comments?.length ?? 0;

  const cardLanguage = quote.language || "english";
  const ui = quoteUi(cardLanguage);

  const handleCommentSubmit = async () => {
    if (guestMode || !user) {
      askLogin();
      return;
    }
    if (isCommenting || !commentText.trim()) return;

    setIsCommenting(true);
    setCommentError("");
    const pending = commentText.trim().slice(0, 1000);
    try {
      await onComment(quote._id, pending, cardLanguage);
      setCommentText("");
      setComposerFocused(false);
      setCommentsOpen(true);
      setVisibleCount((count) => Math.max(count, commentsCount + 1, 3));
      setJustPostedId("fresh");
      setToast({ message: ui.commentSuccess, type: "success" });
      window.setTimeout(() => setJustPostedId(null), 2200);
    } catch (error) {
      setCommentError(
        error?.message || "Unable to post comment. Please try again."
      );
    } finally {
      setIsCommenting(false);
    }
  };

  const goToCommentAuthor = (commentUser) => {
    if (guestMode || !user) {
      askLogin();
      return;
    }
    if (!commentUser?._id && !commentUser?.username) return;
    navigate(profilePath(commentUser, user?._id));
  };

  useEffect(() => {
    if (commentsCount > 0 && visibleCount < 2) {
      setVisibleCount(2);
    }
  }, [commentsCount, visibleCount]);

  const COMMENT_MAX = 1000;
  const charsRemaining = COMMENT_MAX - commentText.length;
  const visibleComments = (quote.comments || []).slice(0, visibleCount);
  const hiddenCount = Math.max(0, commentsCount - visibleCount);

  const handleSaveCommentClick = async (commentId) => {
    if (isSavingComment || !editCommentText?.trim()) return;
    setIsSavingComment(true);
    setCommentError("");
    try {
      await onSaveComment(quote._id, commentId);
      setToast({
        message:
          cardLanguage === "hindi"
            ? "कमेंट सफलतापूर्वक अपडेट हो गया!"
            : "Comment updated successfully!",
        type: "success",
      });
    } catch (error) {
      setCommentError(
        error?.message || "Unable to update comment. Please try again."
      );
    } finally {
      setIsSavingComment(false);
    }
  };

  const goToAuthor = () => {
    if (guestMode) {
      askLogin();
      return;
    }
    if (!quote.author?._id && !quote.author?.username) return;
    navigate(profilePath(quote.author, user?._id));
  };

  return (
    <div className="mx-auto my-1.5 w-[95%] max-w-3xl rounded-lg border border-blue-100 bg-white/80 px-3 py-1.5 shadow-sm sm:my-2 sm:w-3/4 sm:px-4 sm:py-2 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="header-quote-post flex items-center justify-between gap-2 px-1 py-0.5 sm:px-2 sm:py-1">
        <div className="owner-detail group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition hover:bg-blue-50 sm:px-2 sm:py-2 dark:hover:bg-slate-800">
          <ProfileAvatar
            src={quote.author?.profilePicture}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-blue-100 sm:h-10 sm:w-10 dark:ring-slate-600"
          />
          <button
            type="button"
            onClick={goToAuthor}
            className="author-name min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-bold text-gray-900 group-hover:text-blue-700 sm:text-base dark:text-slate-100 dark:group-hover:text-blue-300">
              {quote.author?.username || quote.author?.name}
            </p>
            {quote.author?.username && quote.author?.name && (
              <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                {quote.author.name}
              </p>
            )}
          </button>
        </div>

        {!guestMode && !isOwnQuote && authorId && onFollowToggle && (
          <button
            type="button"
            disabled={followBusyId === authorId}
            onClick={() =>
              onFollowToggle(
                authorId,
                isFollowingAuthor,
                quote.author,
                isRequestedAuthor
              )
            }
            className={`min-h-9 shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 sm:px-3 sm:text-sm ${
              isFollowingAuthor || isRequestedAuthor
                ? "border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {followBusyId === authorId
              ? "..."
              : isFollowingAuthor
                ? "Unfollow"
                : isRequestedAuthor
                  ? "Requested"
                  : "Follow"}
          </button>
        )}
      </div>

      <div className="relative flex min-h-[120px] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-indigo-800 to-blue-900 py-4 sm:min-h-[200px] sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 82% 78%, rgba(147,197,253,0.35), transparent 45%)",
          }}
        />
        <div className="relative z-[1] mx-auto w-[90%] rounded-md border-2 border-white bg-white px-3 py-3 shadow-xl sm:w-3/4 sm:px-4 sm:py-4 dark:border-slate-600 dark:bg-slate-900">
          <p className="mb-1 text-base font-bold text-blue-600 sm:text-xl">
            <FaQuoteLeft />
          </p>
          {editQuoteId === quote._id ? (
            <div className="space-y-2">
              <textarea
                rows={4}
                className="w-full border p-2 rounded-md resize-y text-xl italic"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                aria-label={ui.editQuoteText}
              />
              <select
                className="w-full border rounded-md px-3 py-2 bg-white text-sm"
                value={editCategory || ""}
                onChange={(e) => {
                  setEditCategory(e.target.value);
                  if (
                    e.target.value !== OTHER_CATEGORY_VALUE &&
                    setEditCustomCategory
                  ) {
                    setEditCustomCategory("");
                  }
                }}
                aria-label={ui.editCategory}
              >
                <option value="">{ui.categoryOptional}</option>
                {QUOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat, cardLanguage)}
                  </option>
                ))}
                <option value={OTHER_CATEGORY_VALUE}>{ui.otherCategory}</option>
              </select>
              {editCategory === OTHER_CATEGORY_VALUE && setEditCustomCategory && (
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 bg-white text-sm"
                  value={editCustomCategory || ""}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  placeholder={ui.customCategoryPlaceholder}
                  maxLength={40}
                  aria-label={ui.customCategoryPlaceholder}
                />
              )}
              {quote.isPopular && setEditSourceWork && (
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 bg-white text-sm"
                  value={editSourceWork}
                  onChange={(e) => setEditSourceWork(e.target.value)}
                  placeholder={ui.sourceWork}
                  aria-label={ui.editSourceWork}
                />
              )}
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-base italic text-gray-900 sm:text-xl dark:text-slate-100">
                {quote.text}
              </p>
              {quote.attributedTo && (
                <div className="mt-3 text-right text-sm">
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                    — {quote.attributedTo}
                  </p>
                  {quote.sourceWork && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      {quote.sourceWork}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 py-1 mt-2 gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex gap-1 items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
              isLiked
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            }`}
            onClick={() => (guestMode || !user ? askLogin() : onLike(quote._id))}
            aria-pressed={isLiked}
            title={guestMode || !user ? "Sign in to like" : isLiked ? "Remove like" : "Like"}
          >
            <span>👍</span>
            <span>{likesCount}</span>
          </button>
          <button
            type="button"
            className={`flex gap-1 items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
              isDisliked
                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-red-300"
            }`}
            onClick={() =>
              guestMode || !user ? askLogin() : onDislike(quote._id)
            }
            aria-pressed={isDisliked}
            title={
              guestMode || !user
                ? "Sign in to dislike"
                : isDisliked
                  ? "Remove dislike"
                  : "Dislike"
            }
          >
            <span>👎</span>
            <span>{dislikesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {editQuoteId !== quote._id && quote.category ? (
            <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              {categoryLabel(quote.category, cardLanguage)}
            </span>
          ) : null}

          {canManageQuote && allowQuoteManagement && (
            <div className="edit-delete-button flex gap-2">
              {editQuoteId === quote._id ? (
                <button
                  type="button"
                  className="bg-green-500 text-white px-4 py-1 rounded-lg"
                  onClick={() => onSave(quote._id)}
                >
                  <FaSave />
                </button>
              ) : (
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-1 rounded-lg"
                  onClick={() => onEdit(quote)}
                >
                  <FaEdit />
                </button>
              )}
              <button
                type="button"
                disabled={deletingQuoteId === quote._id}
                aria-label="Delete quote"
                title="Delete quote"
                className="bg-red-500 text-white px-4 py-1 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onDelete(quote._id)}
              >
                {deletingQuoteId === quote._id ? "..." : <RiDeleteBin6Fill />}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-indigo-100/80 pt-3 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setCommentsOpen((open) => !open)}
          className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-left transition hover:bg-indigo-50/70 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <FaRegCommentDots className="text-sm" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                {commentsCount}{" "}
                {commentsCount === 1 ? ui.comment : ui.comments}
              </span>
              <span className="block text-[11px] font-medium text-indigo-500/90 dark:text-indigo-300/80">
                {ui.joinConversation}
              </span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
            {commentsOpen ? ui.hideComments : ui.showComments}
            {commentsOpen ? (
              <FaChevronUp className="text-[9px]" />
            ) : (
              <FaChevronDown className="text-[9px]" />
            )}
          </span>
        </button>

        <div className="comment-panel space-y-3">
            {guestMode || !user ? (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 px-4 py-4 text-center dark:border-indigo-900 dark:from-indigo-950/40 dark:to-slate-900">
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  Sign in to like, comment, or share quotes.
                </p>
                <button
                  type="button"
                  onClick={askLogin}
                  className="mt-2 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Log in
                </button>
              </div>
            ) : (
              <div
                className={`rounded-2xl border bg-white p-2.5 shadow-sm transition dark:bg-slate-800 ${
                  composerFocused
                    ? "border-indigo-300 ring-4 ring-indigo-100 dark:border-indigo-500 dark:ring-indigo-950/50"
                    : "border-gray-200 dark:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-2">
                  <ProfileAvatar
                    src={user?.profilePicture}
                    alt="You"
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
                  />
                  <div className="min-w-0 flex-1">
                    <textarea
                      ref={composerRef}
                      rows={composerFocused || commentText ? 2 : 1}
                      maxLength={COMMENT_MAX}
                      placeholder={ui.shareThoughts}
                      value={commentText}
                      disabled={isCommenting}
                      onFocus={() => setComposerFocused(true)}
                      onBlur={() => {
                        if (!commentText.trim()) setComposerFocused(false);
                      }}
                      onChange={(e) => {
                        setCommentText(e.target.value.slice(0, COMMENT_MAX));
                        if (commentError) setCommentError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit();
                        }
                      }}
                      className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] ${
                          charsRemaining < 40
                            ? "font-semibold text-amber-600"
                            : "text-gray-400 dark:text-slate-500"
                        }`}
                      >
                        {composerFocused || commentText
                          ? ui.charsLeft(charsRemaining)
                          : "Enter to send · Shift+Enter for new line"}
                      </span>
                      <button
                        type="button"
                        onClick={handleCommentSubmit}
                        disabled={isCommenting || !commentText.trim()}
                        aria-label={
                          isCommenting ? ui.postingComment : ui.postComment
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FaPaperPlane className="text-[10px]" />
                        {isCommenting ? ui.postingComment : ui.postComment}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {commentError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {commentError}
              </p>
            )}

            {commentsOpen && (
            <div className="space-y-2">
              {commentsCount === 0 || (quote.comments || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {ui.noComments}
                  </p>
                </div>
              ) : (
                visibleComments.map((comment, index) => {
                  const canManageComment =
                    user?._id === comment.user?._id || user?.role === "admin";
                  const isOwnComment =
                    userId &&
                    comment.user?._id?.toString() === userId;
                  const isNewest =
                    justPostedId === "fresh" &&
                    index === visibleComments.length - 1;

                  return (
                    <div
                      key={comment._id}
                      className={`comment-row group relative flex items-start justify-between gap-2 rounded-2xl border px-3 py-2.5 transition ${
                        isOwnComment
                          ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/30"
                          : "border-gray-100 bg-gray-50 hover:border-indigo-100 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      } ${isNewest ? "comment-flash" : ""}`}
                      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                    >
                      {isOwnComment && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-indigo-500" />
                      )}
                      <div className="flex min-w-0 items-start gap-2.5 pl-1">
                        <button
                          type="button"
                          onClick={() => goToCommentAuthor(comment.user)}
                          className="shrink-0 rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <ProfileAvatar
                            src={comment.user?.profilePicture}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <button
                              type="button"
                              onClick={() => goToCommentAuthor(comment.user)}
                              className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                            >
                              {comment.user?.username || comment.user?.name}
                            </button>
                            {isOwnComment && (
                              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                {ui.youLabel}
                              </span>
                            )}
                            {comment.createdAt && (
                              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                {timeAgo(comment.createdAt)}
                              </span>
                            )}
                          </div>
                          {editCommentId === comment._id ? (
                            <div className="mt-1.5 space-y-2">
                              <input
                                type="text"
                                disabled={isSavingComment}
                                className="w-full rounded-xl border border-indigo-200 bg-white p-2 text-sm text-gray-900 outline-none ring-2 ring-indigo-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-indigo-950"
                                value={editCommentText}
                                onChange={(e) =>
                                  setEditCommentText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveCommentClick(comment._id);
                                  }
                                  if (e.key === "Escape") {
                                    onEditComment?.(null);
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    isSavingComment || !editCommentText?.trim()
                                  }
                                  onClick={() =>
                                    handleSaveCommentClick(comment._id)
                                  }
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  <FaSave /> Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditComment?.(null)}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-slate-600 dark:text-slate-300"
                                >
                                  <FaTimes /> {ui.cancelEdit}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-0.5 text-sm leading-relaxed text-gray-700 break-words dark:text-slate-300">
                              {comment.text}
                            </p>
                          )}
                        </div>
                      </div>

                      {canManageComment && editCommentId !== comment._id && (
                        <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => onEditComment(comment)}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteComment(quote._id, comment._id)
                            }
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/40"
                          >
                            <RiDeleteBin6Fill className="text-sm" />
                          </button>
                        </div>
                      )}
                      {canManageComment && editCommentId === comment._id && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            disabled={
                              isSavingComment || !editCommentText?.trim()
                            }
                            onClick={() =>
                              handleSaveCommentClick(comment._id)
                            }
                            title={
                              isSavingComment ? ui.postingComment : "Save"
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-green-600 transition hover:bg-green-100 disabled:opacity-40 dark:hover:bg-green-900/40"
                          >
                            <FaSave className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + 3, Math.max(commentsCount, prev + 3))
                    )
                  }
                  className="mx-auto flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                >
                  {ui.loadMoreComments}
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] dark:bg-indigo-900/60">
                    +{Math.min(3, hiddenCount)}
                  </span>
                  <FaChevronDown className="text-[10px]" />
                </button>
              )}
            </div>
            )}
        </div>
      </div>
      <FeedbackToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
};

export default QuoteCard;
