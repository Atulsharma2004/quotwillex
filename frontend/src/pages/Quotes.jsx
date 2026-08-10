import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchQuotes,
  createQuote,
  deleteQuote,
  updateQuote,
  likeQuote,
  dislikeQuote,
  commentQuote,
  editComment,
  deleteComment,
  optimisticToggleLike,
  optimisticToggleDislike,
  optimisticUpdateQuoteText,
  optimisticCreateQuote,
} from "../redux/quotes/quoteSlice";
import {
  followUser,
  unfollowUser,
  patchFollowingLocal,
} from "../redux/auth/authSlice";
import QuoteCard from "../components/QuoteCard";
import Pagination from "../components/Pagination";
import { QuoteFeedSkeleton } from "../components/Shimmer";
import Seo from "../components/Seo";
import FeedbackToast from "../components/FeedbackToast";
import {
  QUOTE_CATEGORIES,
  OTHER_CATEGORY_VALUE,
  categoryLabel,
} from "../constants/quoteCategories";
import { SEO_ROUTES } from "../constants/site";
import { quoteUi, sortOptions } from "../constants/quoteUi";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaFilter,
  FaPenNib,
  FaPlus,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
} from "react-icons/fa";

const QUOTES_PER_PAGE = 10;

const Quotes = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const composeRef = useRef(null);
  const composeInputRef = useRef(null);
  const { quotes, quotesMeta, isLoading, isError, errorMessage } = useSelector(
    (state) => state.quotes
  );
  const { user } = useSelector((state) => state.auth);
  const [newQuote, setNewQuote] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [newLanguage, setNewLanguage] = useState("english");
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [followBusyId, setFollowBusyId] = useState(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [createError, setCreateError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const initialCategory = String(searchParams.get("category") || "all")
    .trim()
    .toLowerCase();
  const initialSearch = String(
    searchParams.get("search") || searchParams.get("q") || ""
  ).trim();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategory || "all"
  );
  const [languageFilter, setLanguageFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const hasActiveFilters =
    searchQuery.trim() ||
    sortBy !== "newest" ||
    categoryFilter !== "all" ||
    languageFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setCategoryFilter("all");
    setLanguageFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    if (location.search) {
      navigate("/quotes", { replace: true });
    }
  };

  useEffect(() => {
    const cat = String(searchParams.get("category") || "all")
      .trim()
      .toLowerCase();
    const q = String(
      searchParams.get("search") || searchParams.get("q") || ""
    ).trim();
    setCategoryFilter(cat || "all");
    setSearchQuery(q);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    dispatch(
      fetchQuotes({
        page: currentPage,
        limit: QUOTES_PER_PAGE,
        search: searchQuery.trim() || undefined,
        sortBy,
        category: categoryFilter,
        language: languageFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
    );
  }, [
    dispatch,
    currentPage,
    searchQuery,
    sortBy,
    categoryFilter,
    languageFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    const wantsCompose =
      location.hash === "#compose" || searchParams.get("compose") === "1";
    if (!wantsCompose) return;
    const timer = window.setTimeout(() => {
      composeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      composeInputRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash, searchParams]);

  const userSnapshot = user
    ? {
        _id: user._id,
        name: user.name,
        profilePicture: user.profilePicture,
      }
    : null;

  const filteredQuotes = quotes;
  const totalPages = Math.max(1, quotesMeta?.totalPages || 1);
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * (quotesMeta?.limit || QUOTES_PER_PAGE);
  const paginatedQuotes = filteredQuotes;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resolveCategory = (selected, custom) => {
    if (selected === OTHER_CATEGORY_VALUE) {
      return custom.trim().toLowerCase();
    }
    return selected;
  };

  const handleCreate = async () => {
    if (isPosting) return;
    if (!newQuote.trim()) return;
    if (newCategory === OTHER_CATEGORY_VALUE && !customCategory.trim()) {
      setCreateError(
        newLanguage === "hindi"
          ? "कृपया अपनी श्रेणी लिखें।"
          : "Please write your custom category."
      );
      return;
    }

    const text = newQuote.trim();
    const category = resolveCategory(newCategory, customCategory);
    const language = newLanguage;
    const tempId = `temp-${Date.now()}`;
    const ui = quoteUi(language);

    setIsPosting(true);
    setCreateError("");
    setNewQuote("");
    setNewCategory("");
    setCustomCategory("");
    setNewLanguage("english");
    dispatch(
      optimisticCreateQuote({
        _id: tempId,
        text,
        ...(category ? { category } : {}),
        language,
        author: {
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
        },
        likes: [],
        dislikes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      })
    );

    try {
      const action = await dispatch(
        createQuote({ text, category, language, tempId })
      );
      if (createQuote.rejected.match(action)) {
        setCreateError(
          action.payload || "Unable to post the quote. Please try again."
        );
        setNewQuote(text);
        setNewCategory(category || "");
        setNewLanguage(language);
      } else {
        setToast({ message: ui.postSuccess, type: "success" });
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditClick = (quote) => {
    setEditQuoteId(quote._id);
    setEditText(quote.text);
    const known = QUOTE_CATEGORIES.includes(quote.category);
    setEditCategory(known ? quote.category || "" : quote.category ? OTHER_CATEGORY_VALUE : "");
    setEditCustomCategory(known ? "" : quote.category || "");
  };

  const handleSaveClick = async (id) => {
    if (!editText.trim()) return;
    if (editCategory === OTHER_CATEGORY_VALUE && !editCustomCategory.trim()) return;
    const text = editText.trim();
    const category = resolveCategory(editCategory, editCustomCategory);
    dispatch(optimisticUpdateQuoteText({ id, text, category }));
    setEditQuoteId(null);
    dispatch(updateQuote({ id, text, category })).then((action) => {
      if (updateQuote.rejected.match(action)) {
        setCreateError(action.payload || "Unable to update the quote.");
        dispatch(fetchQuotes());
      }
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this quote permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleteError("");
    setDeletingQuoteId(id);
    const action = await dispatch(deleteQuote(id));
    setDeletingQuoteId(null);

    if (deleteQuote.rejected.match(action)) {
      setDeleteError(action.payload || "Unable to delete the quote. Please try again.");
    }
  };

  const handleLike = (id) => {
    if (!user) return;
    dispatch(
      optimisticToggleLike({
        quoteId: id,
        userId: user._id,
        userSnapshot,
      })
    );
    dispatch(likeQuote(id)).then((action) => {
      if (likeQuote.rejected.match(action)) {
        dispatch(fetchQuotes());
      }
    });
  };

  const handleDislike = (id) => {
    if (!user) return;
    dispatch(
      optimisticToggleDislike({
        quoteId: id,
        userId: user._id,
        userSnapshot,
      })
    );
    dispatch(dislikeQuote(id)).then((action) => {
      if (dislikeQuote.rejected.match(action)) {
        dispatch(fetchQuotes());
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
  };

  const handleDeleteComment = (quoteId, commentId) => {
    dispatch(deleteComment({ quoteId, commentId }));
  };

  const handleFollowToggle = (authorId, currentlyFollowing, author) => {
    if (!user || !authorId) return;
    const willFollow = !currentlyFollowing;
    const snapshot = {
      _id: authorId,
      name: author?.name,
      username: author?.username,
      profilePicture: author?.profilePicture,
    };

    setFollowBusyId(authorId);
    dispatch(
      patchFollowingLocal({
        targetId: authorId,
        following: willFollow,
        targetSnapshot: snapshot,
      })
    );

    const action = currentlyFollowing
      ? unfollowUser(authorId)
      : followUser(authorId);

    dispatch(action).then((result) => {
      setFollowBusyId(null);
      if (
        followUser.rejected.match(result) ||
        unfollowUser.rejected.match(result)
      ) {
        dispatch(
          patchFollowingLocal({
            targetId: authorId,
            following: currentlyFollowing,
            targetSnapshot: snapshot,
          })
        );
      }
    });
  };

  const postUi = quoteUi(newLanguage);
  const filterUi = quoteUi(languageFilter === "hindi" ? "hindi" : "english");
  const filterSortOptions = sortOptions(
    languageFilter === "hindi" ? "hindi" : "english"
  );

  return (
    <div className="p-4 sm:p-6">
      <Seo {...SEO_ROUTES.quotes} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
            Community feed
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Quotes</h1>
        </div>

        <section
          id="compose"
          ref={composeRef}
          className="mb-5 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm scroll-mt-24"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <FaPenNib className="text-sm" />
            </span>
            <div>
              <h3 className="font-semibold">{postUi.shareTitle}</h3>
              <p className="text-xs text-indigo-100">{postUi.shareSubtitle}</p>
            </div>
          </div>
          <div className="p-4">
            {createError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </p>
            )}
            <textarea
              ref={composeInputRef}
              rows={3}
              disabled={isPosting}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder={postUi.quotePlaceholder}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
              <select
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  if (e.target.value !== OTHER_CATEGORY_VALUE) setCustomCategory("");
                }}
                aria-label={postUi.categoryOptional}
              >
                <option value="">{postUi.chooseCategory}</option>
                {QUOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat, newLanguage)}
                  </option>
                ))}
                <option value={OTHER_CATEGORY_VALUE}>{postUi.otherCategory}</option>
              </select>
              {newCategory === OTHER_CATEGORY_VALUE && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder={postUi.customCategoryPlaceholder}
                  maxLength={40}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              )}
              <select
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                aria-label={postUi.quoteLanguage}
              >
                <option value="english">{postUi.english}</option>
                <option value="hindi">{postUi.hindi}</option>
              </select>
              </div>
              <button
                type="button"
                disabled={isPosting || !newQuote.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none"
                onClick={handleCreate}
              >
                <FaPlus className="text-xs" />
                {isPosting ? postUi.postingQuote : postUi.postQuote}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FaFilter className="text-xs" />
              </span>
              <h3 className="font-semibold text-gray-800">{filterUi.exploreQuotes}</h3>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition hover:text-indigo-600"
              >
                <FaTimes />
                {filterUi.clearFilters}
              </button>
            )}
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={filterUi.searchQuotesPeople}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="relative">
              <FaSortAmountDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.sortQuotes}
              >
                {filterSortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
            </label>
            <label className="relative">
              <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByLanguage}
              >
                <option value="all">{filterUi.allLanguages}</option>
                <option value="english">{filterUi.english}</option>
                <option value="hindi">{filterUi.hindi}</option>
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
            </label>
            <label className="relative">
              <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByCategory}
              >
                <option value="all">{filterUi.allCategories}</option>
                {QUOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat, languageFilter === "hindi" ? "hindi" : "english")}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
            </label>
            <label className="relative sm:col-span-1">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByDateFrom}
                title={filterUi.filterByDateFrom}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-3 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="relative sm:col-span-1">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByDateTo}
                title={filterUi.filterByDateTo}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-3 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          {!isLoading && (
            <p className="mt-3 text-xs font-medium text-gray-500">
              {filteredQuotes.length
                ? filterUi.showingRange(
                    filteredQuotes.length
                      ? pageStart + 1
                      : 0,
                    pageStart + filteredQuotes.length,
                    quotesMeta?.total || filteredQuotes.length
                  )
                : filterUi.noQuotesYet}
            </p>
          )}
        </section>
      </div>

      <div>
        {/* Quote feed */}

      {isLoading && <QuoteFeedSkeleton count={4} />}
      {isError && (
        <p className="text-center text-red-600">{errorMessage}</p>
      )}
      {deleteError && (
        <p className="mx-auto mb-4 w-3/4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {!isLoading && filteredQuotes.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? filterUi.noMatch : filterUi.noQuotesYet}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                composeRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                composeInputRef.current?.focus();
              }}
              className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Write the first quote
            </button>
          )}
        </div>
      )}

      {!isLoading &&
        paginatedQuotes.map((quote) => (
          <QuoteCard
            key={quote._id}
            quote={quote}
            user={user}
            onLike={handleLike}
            onDislike={handleDislike}
            onEdit={handleEditClick}
            onSave={handleSaveClick}
            onDelete={handleDelete}
            deletingQuoteId={deletingQuoteId}
            onComment={handleComment}
            onEditComment={handleEditComment}
            onSaveComment={handleSaveComment}
            onDeleteComment={handleDeleteComment}
            onFollowToggle={handleFollowToggle}
            followBusyId={followBusyId}
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
        ))}

      {!isLoading && (
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          label="Quote pages"
        />
      )}
      </div>
      <FeedbackToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
};

export default Quotes;
