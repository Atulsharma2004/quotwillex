import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaFilter,
  FaLandmark,
  FaPlus,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
} from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import QuoteCard from "../components/QuoteCard";
import Pagination from "../components/Pagination";
import { QuoteFeedSkeleton } from "../components/Shimmer";
import Seo from "../components/Seo";
import {
  commentQuote,
  createPopularQuote,
  deleteComment,
  deleteQuote,
  dislikeQuote,
  editComment,
  fetchPopularQuotes,
  fetchGuestQuotes,
  likeQuote,
  optimisticToggleDislike,
  optimisticToggleLike,
  optimisticUpdateQuoteText,
  updateQuote,
} from "../redux/quotes/quoteSlice";
import {
  QUOTE_CATEGORIES,
  OTHER_CATEGORY_VALUE,
  categoryLabel,
} from "../constants/quoteCategories";
import { SEO_ROUTES } from "../constants/site";
import { quoteUi, sortOptions } from "../constants/quoteUi";
import {
  moderateText,
  getAbuseRejectionMessage,
} from "../utils/contentModeration";

const QUOTES_PER_PAGE = 10;

const PopularQuotes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { popularQuotes, popularMeta, isLoading, errorMessage } = useSelector(
    (state) => state.quotes
  );
  const { user } = useSelector((state) => state.auth);
  const [text, setText] = useState("");
  const [attributedTo, setAttributedTo] = useState("");
  const [sourceWork, setSourceWork] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [language, setLanguage] = useState("english");
  const [currentPage, setCurrentPage] = useState(1);
  const [postError, setPostError] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editSourceWork, setEditSourceWork] = useState("");
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const initialCategory = String(searchParams.get("category") || "all")
    .trim()
    .toLowerCase();
  const initialSearch = String(
    searchParams.get("search") || searchParams.get("q") || ""
  ).trim();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategory || "all"
  );
  const [languageFilter, setLanguageFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const hasActiveFilters =
    searchQuery.trim() ||
    categoryFilter !== "all" ||
    languageFilter !== "all" ||
    sortBy !== "newest" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

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
    if (user) return;
    dispatch(
      fetchGuestQuotes({
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
    user,
    searchQuery,
    sortBy,
    categoryFilter,
    languageFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    if (!user) return;
    dispatch(
      fetchPopularQuotes({
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
    user,
    currentPage,
    searchQuery,
    sortBy,
    categoryFilter,
    languageFilter,
    dateFrom,
    dateTo,
  ]);

  const resolveCategory = (selected, custom) => {
    if (selected === OTHER_CATEGORY_VALUE) {
      return custom.trim().toLowerCase();
    }
    return selected;
  };

  const filteredQuotes = popularQuotes;
  const guestMode = !user;
  const guestTotalPages = Math.max(
    1,
    Math.ceil((filteredQuotes.length || 0) / QUOTES_PER_PAGE)
  );
  const totalPages = guestMode
    ? guestTotalPages
    : Math.max(1, popularMeta?.totalPages || 1);
  const activePage = Math.min(currentPage, totalPages);
  const pageQuotes = guestMode
    ? filteredQuotes.slice(
        (activePage - 1) * QUOTES_PER_PAGE,
        activePage * QUOTES_PER_PAGE
      )
    : filteredQuotes;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // When filters change for guests, reset to page 1 (fetch already re-samples).
  useEffect(() => {
    if (!user) setCurrentPage(1);
  }, [
    user,
    searchQuery,
    sortBy,
    categoryFilter,
    languageFilter,
    dateFrom,
    dateTo,
  ]);

  const userSnapshot = user
    ? {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
      }
    : null;

  const requireLogin = () => {
    navigate("/login", {
      state: { from: "/popular-quotes" },
      replace: false,
    });
  };

  const handlePost = async () => {
    if (!user || user.role !== "admin") {
      requireLogin();
      return;
    }
    if (!text.trim() || !attributedTo.trim()) return;
    if (category === OTHER_CATEGORY_VALUE && !customCategory.trim()) {
      setPostError(
        language === "hindi"
          ? "कृपया अपनी श्रेणी लिखें।"
          : "Please write your custom category."
      );
      return;
    }

    const moderation = await moderateText(text, language);
    if (moderation.blocked) {
      setPostError(
        moderation.message || getAbuseRejectionMessage(moderation.words, language)
      );
      return;
    }

    setPostError("");
    const action = await dispatch(
      createPopularQuote({
        text: text.trim(),
        attributedTo: attributedTo.trim(),
        sourceWork: sourceWork.trim(),
        category: resolveCategory(category, customCategory),
        language,
      })
    );
    if (createPopularQuote.fulfilled.match(action)) {
      setText("");
      setAttributedTo("");
      setSourceWork("");
      setCategory("");
      setCustomCategory("");
      setLanguage("english");
    } else {
      setPostError(action.payload || "Unable to publish this quote.");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setLanguageFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    setCurrentPage(1);
    if (searchParams.toString()) {
      navigate("/popular-quotes", { replace: true });
    }
  };

  const reloadFeed = () => {
    if (user) {
      dispatch(
        fetchPopularQuotes({
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
      return;
    }
    dispatch(
      fetchGuestQuotes({
        search: searchQuery.trim() || undefined,
        sortBy,
        category: categoryFilter,
        language: languageFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
    );
  };

  const handleLike = (id) => {
    if (!user) return requireLogin();
    dispatch(
      optimisticToggleLike({ quoteId: id, userId: user._id, userSnapshot })
    );
    dispatch(likeQuote(id)).then((action) => {
      if (likeQuote.rejected.match(action)) reloadFeed();
    });
  };

  const handleDislike = (id) => {
    if (!user) return requireLogin();
    dispatch(
      optimisticToggleDislike({ quoteId: id, userId: user._id, userSnapshot })
    );
    dispatch(dislikeQuote(id)).then((action) => {
      if (dislikeQuote.rejected.match(action)) reloadFeed();
    });
  };

  const handleEditQuote = (quote) => {
    if (!user) return requireLogin();
    setEditQuoteId(quote._id);
    setEditText(quote.text);
    const known = QUOTE_CATEGORIES.includes(quote.category);
    setEditCategory(known ? quote.category || "" : quote.category ? OTHER_CATEGORY_VALUE : "");
    setEditCustomCategory(known ? "" : quote.category || "");
    setEditSourceWork(quote.sourceWork || "");
  };

  const handleSaveQuote = (id) => {
    if (!user) return requireLogin();
    if (!editText.trim()) return;
    if (editCategory === OTHER_CATEGORY_VALUE && !editCustomCategory.trim()) return;
    const textValue = editText.trim();
    const categoryValue = resolveCategory(editCategory, editCustomCategory);
    dispatch(
      optimisticUpdateQuoteText({
        id,
        text: textValue,
        category: categoryValue,
        sourceWork: editSourceWork,
      })
    );
    setEditQuoteId(null);
    dispatch(
      updateQuote({
        id,
        text: textValue,
        category: categoryValue,
        sourceWork: editSourceWork,
      })
    ).then((action) => {
      if (updateQuote.rejected.match(action)) reloadFeed();
    });
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm("Delete this popular quote permanently?")) return;
    setDeletingQuoteId(id);
    const action = await dispatch(deleteQuote(id));
    setDeletingQuoteId(null);
    if (deleteQuote.rejected.match(action)) {
      setPostError(action.payload || "Unable to delete this popular quote.");
    }
  };

  const postUi = quoteUi(language);
  const filterUi = quoteUi(languageFilter === "hindi" ? "hindi" : "english");
  const filterSortOptions = sortOptions(
    languageFilter === "hindi" ? "hindi" : "english"
  );

  return (
    <div className="min-h-[70vh] p-4 sm:p-6">
      <Seo {...SEO_ROUTES.popular} />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <FaLandmark className="mx-auto mb-3 text-3xl text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
            Timeless words
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {guestMode ? "Explore Quotes" : "Popular Quotes"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {guestMode
              ? "A free preview of up to 100 random quotes — popular classics mixed with community lines. Sign in for the full feeds and to post."
              : "Public-domain and verified-attribution quotes shared by the admins. Browse famous lines in English and Hindi."}
          </p>
          {!user && (
            <p className="mt-3 text-sm text-indigo-700">
              <Link
                to="/signup"
                className="font-semibold underline-offset-2 hover:underline"
              >
                Create a free account
              </Link>{" "}
              to like, comment, follow creators, and share your own quotes.
            </p>
          )}
        </div>

        {user?.role === "admin" && (
          <section className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">{postUi.publishTitle}</h2>
            {postError && <p className="mb-3 text-sm text-red-600">{postError}</p>}
            <textarea
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={postUi.popularQuotePlaceholder}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                value={attributedTo}
                onChange={(event) => setAttributedTo(event.target.value)}
                placeholder={postUi.attributedTo}
                className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                value={sourceWork}
                onChange={(event) => setSourceWork(event.target.value)}
                placeholder={postUi.sourceWork}
                className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  if (event.target.value !== OTHER_CATEGORY_VALUE) {
                    setCustomCategory("");
                  }
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">{postUi.chooseCategory}</option>
                {QUOTE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item, language)}
                  </option>
                ))}
                <option value={OTHER_CATEGORY_VALUE}>{postUi.otherCategory}</option>
              </select>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label={postUi.quoteLanguage}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="english">{postUi.english}</option>
                <option value="hindi">{postUi.hindi}</option>
              </select>
            </div>
            {category === OTHER_CATEGORY_VALUE && (
              <input
                type="text"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder={postUi.customCategoryPlaceholder}
                maxLength={40}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            )}
            <button
              type="button"
              disabled={
                !text.trim() ||
                !attributedTo.trim() ||
                (category === OTHER_CATEGORY_VALUE && !customCategory.trim())
              }
              onClick={handlePost}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlus className="text-xs" /> {postUi.publishQuote}
            </button>
          </section>
        )}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FaFilter className="text-xs" />
              </span>
              <h2 className="font-semibold text-gray-800">
                {filterUi.explorePopularQuotes}
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-indigo-600"
              >
                <FaTimes /> {filterUi.clearFilters}
              </button>
            )}
          </div>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={filterUi.searchPopular}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="relative">
              <FaSortAmountDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.sortQuotes}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {filterSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
            </label>
            <label className="relative">
              <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <select
                value={languageFilter}
                onChange={(event) => {
                  setLanguageFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByLanguage}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByCategory}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">{filterUi.allCategories}</option>
                {QUOTE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(
                      item,
                      languageFilter === "hindi" ? "hindi" : "english"
                    )}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
            </label>
            <label className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByDateFrom}
                title={filterUi.filterByDateFrom}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-3 text-sm text-gray-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label={filterUi.filterByDateTo}
                title={filterUi.filterByDateTo}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-3 text-sm text-gray-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          {!isLoading && (
            <p className="mt-3 text-xs font-medium text-gray-500">
              {guestMode
                ? `Showing ${pageQuotes.length} of ${filteredQuotes.length} preview quotes (max 100)`
                : filterUi.showingPopular(
                    filteredQuotes.length,
                    popularMeta?.total || filteredQuotes.length
                  )}
            </p>
          )}
        </section>
      </div>

      {isLoading && <QuoteFeedSkeleton count={4} />}
      {!isLoading && errorMessage && (
        <p className="text-center text-red-600">{errorMessage}</p>
      )}
      {!isLoading && !errorMessage && filteredQuotes.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? filterUi.noPopularMatch : filterUi.noQuotesYet}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Clear filters
            </button>
          ) : guestMode ? (
            <Link
              to="/signup"
              className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Join to share quotes
            </Link>
          ) : (
            <Link
              to="/quotes#compose"
              className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Share a community quote
            </Link>
          )}
        </div>
      )}
      {!isLoading &&
        pageQuotes.map((quote) => (
          <QuoteCard
            key={quote._id}
            quote={quote}
            user={user}
            guestMode={guestMode}
            onRequireLogin={requireLogin}
            onLike={handleLike}
            onDislike={handleDislike}
            onEdit={handleEditQuote}
            onSave={handleSaveQuote}
            onDelete={handleDeleteQuote}
            onComment={(id, commentText) => {
              if (!user) return requireLogin();
              dispatch(commentQuote({ id, text: commentText }));
            }}
            onEditComment={(comment) => {
              if (!user) return requireLogin();
              setEditCommentId(comment._id);
              setEditCommentText(comment.text);
            }}
            onSaveComment={(quoteId, commentId) => {
              if (!user) return requireLogin();
              if (!editCommentText.trim()) return;
              dispatch(
                editComment({
                  quoteId,
                  commentId,
                  text: editCommentText.trim(),
                })
              ).then(() => setEditCommentId(null));
            }}
            onDeleteComment={(quoteId, commentId) => {
              if (!user) return requireLogin();
              dispatch(deleteComment({ quoteId, commentId }));
            }}
            editCommentId={editCommentId}
            editCommentText={editCommentText}
            setEditCommentText={setEditCommentText}
            editQuoteId={editQuoteId}
            editText={editText}
            setEditText={setEditText}
            editCategory={editCategory}
            setEditCategory={setEditCategory}
            editCustomCategory={editCustomCategory}
            setEditCustomCategory={setEditCustomCategory}
            editSourceWork={editSourceWork}
            setEditSourceWork={setEditSourceWork}
            deletingQuoteId={deletingQuoteId}
            allowQuoteManagement={user?.role === "admin"}
          />
        ))}
      {!isLoading && (
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          label={guestMode ? "Preview quote pages" : "Popular quote pages"}
        />
      )}
    </div>
  );
};

export default PopularQuotes;
