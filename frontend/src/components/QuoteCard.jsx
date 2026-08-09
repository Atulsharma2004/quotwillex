import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaQuoteLeft,
  FaEdit,
  FaSave,
  FaPaperPlane,
  FaRegCommentDots,
  FaChevronDown,
} from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import {
  QUOTE_CATEGORIES,
  OTHER_CATEGORY_VALUE,
  categoryLabel,
} from "../constants/quoteCategories";
import { quoteUi } from "../constants/quoteUi";
import {
  moderateText,
  getAbuseRejectionMessage,
} from "../utils/contentModeration";
import { profilePath } from "../utils/profileKey";
import ProfileAvatar from "./ProfileAvatar";

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
  const [visibleCount, setVisibleCount] = useState(1);

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
  const listedFollowing = followingList.some(
    (entry) => (entry?._id || entry)?.toString() === authorId
  );
  const isFollowingAuthor =
    listedFollowing ||
    (Boolean(quote.followedByMe) && followingList.length === 0);

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

  const handleCommentSubmit = async () => {
    if (guestMode || !user) {
      askLogin();
      return;
    }
    if (!commentText.trim()) return;
    try {
      const moderation = await moderateText(
        commentText,
        quote.language || "english"
      );
      if (moderation.blocked) {
        setCommentError(
          moderation.message ||
            getAbuseRejectionMessage(
              moderation.words,
              quote.language || "english"
            )
        );
        return;
      }
      setCommentError("");
      onComment(quote._id, commentText.trim());
      setCommentText("");
    } catch {
      setCommentError("Unable to verify comment right now. Please try again.");
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

  const cardLanguage = quote.language || "english";
  const ui = quoteUi(cardLanguage);

  return (
    <div className="border border-blue-100 px-4 py-2 my-2 w-3/4 mx-auto rounded-lg bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="header-quote-post px-2 py-1 flex items-center justify-between gap-2">
        <div className="owner-detail group flex items-center gap-2 rounded-md px-2 py-2 transition flex-1 min-w-0 text-left hover:bg-blue-50 dark:hover:bg-slate-800">
          <ProfileAvatar
            src={quote.author?.profilePicture}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-blue-100 dark:ring-slate-600"
          />
          <button
            type="button"
            onClick={goToAuthor}
            className="author-name min-w-0 flex-1 text-left"
          >
            <p className="font-bold truncate text-gray-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
              {quote.author?.username || quote.author?.name}
            </p>
            {quote.author?.username && quote.author?.name && (
              <p className="text-xs text-gray-500 truncate dark:text-slate-400">
                {quote.author.name}
              </p>
            )}
          </button>
        </div>

        {!guestMode && !isOwnQuote && authorId && onFollowToggle && (
          <button
            type="button"
            disabled={followBusyId === authorId}
            onClick={() => onFollowToggle(authorId, isFollowingAuthor, quote.author)}
            className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60 ${
              isFollowingAuthor
                ? "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 dark:bg-slate-700 dark:text-white dark:border-slate-500 dark:hover:bg-slate-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {followBusyId === authorId
              ? "..."
              : isFollowingAuthor
                ? "Unfollow"
                : "Follow"}
          </button>
        )}
      </div>

      <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-indigo-800 to-blue-900 py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 82% 78%, rgba(147,197,253,0.35), transparent 45%)",
          }}
        />
        <div className="relative z-[1] mx-auto w-3/4 rounded-md border-2 border-white bg-white px-4 py-4 shadow-xl dark:border-slate-600 dark:bg-slate-900">
          <p className="text-xl mb-1 font-bold text-blue-600">
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
              <p className="text-xl italic whitespace-pre-wrap text-gray-900 dark:text-slate-100">
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

      <div className="mt-4 border-t border-gray-200 pt-3 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3 text-gray-600 dark:text-slate-400">
          <FaRegCommentDots className="text-indigo-500" />
          <span className="text-sm font-semibold">
            {commentsCount}{" "}
            {commentsCount === 1 ? ui.comment : ui.comments}
          </span>
        </div>

        {guestMode || !user ? (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-3 text-center dark:border-indigo-900 dark:bg-indigo-950/30">
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              Sign in to like, comment, or share quotes.
            </p>
            <button
              type="button"
              onClick={askLogin}
              className="mt-2 text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              Log in
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300 transition dark:bg-slate-800 dark:border-slate-600 dark:focus-within:ring-indigo-500">
          <ProfileAvatar
            src={user?.profilePicture}
            alt="You"
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <input
            type="text"
            placeholder={ui.shareThoughts}
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentError) setCommentError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommentSubmit();
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={handleCommentSubmit}
            disabled={!commentText.trim()}
            aria-label={ui.postComment}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm transition hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
          >
            <FaPaperPlane className="text-xs -translate-x-px" />
          </button>
          </div>
        )}
        {commentError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {commentError}
          </p>
        )}

        <div className="mt-3 space-y-2">
          {(commentsCount === 0 || (quote.comments || []).length === 0) && (
            <p className="text-center text-sm text-gray-500 py-3 dark:text-slate-500">
              {ui.noComments}
            </p>
          )}

          {(quote.comments || []).slice(0, visibleCount).map((comment) => {
            const canManageComment =
              user?._id === comment.user?._id || user?.role === "admin";

            return (
              <div
                key={comment._id}
                className="group flex items-start justify-between gap-2 px-3 py-2.5 rounded-2xl border border-gray-100 bg-gray-50 transition hover:border-indigo-100 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                <div className="flex gap-2.5 items-start min-w-0">
                  <ProfileAvatar
                    src={comment.user?.profilePicture}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-slate-600"
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                        {comment.user?.username || comment.user?.name}
                      </p>
                      {comment.createdAt && (
                        <span className="text-[11px] text-gray-500 dark:text-slate-400">
                          {timeAgo(comment.createdAt)}
                        </span>
                      )}
                    </div>
                    {editCommentId === comment._id ? (
                      <input
                        type="text"
                        className="border border-gray-300 p-2 rounded-md w-full mt-1 text-sm bg-white text-gray-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 break-words dark:text-slate-300">
                        {comment.text}
                      </p>
                    )}
                  </div>
                </div>

                {canManageComment && (
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                    {editCommentId === comment._id ? (
                      <button
                        type="button"
                        onClick={() => onSaveComment(quote._id, comment._id)}
                        title="Save"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-green-600 hover:bg-green-100 transition dark:hover:bg-green-900/40"
                      >
                        <FaSave className="text-sm" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditComment(comment)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 transition dark:text-blue-400 dark:hover:bg-blue-900/40"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteComment(quote._id, comment._id)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition dark:hover:bg-red-900/40"
                    >
                      <RiDeleteBin6Fill className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {commentsCount > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 1)}
              className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-200"
            >
              {ui.loadMoreComments}
              <FaChevronDown className="text-[10px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
