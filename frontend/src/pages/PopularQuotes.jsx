import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaFilter,
  FaFileUpload,
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
  bulkCreatePopularQuotes,
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
import { absoluteUrl } from "../constants/site";
import { SEO_LANDINGS } from "../constants/seoLandings";
import { quoteUi, sortOptions } from "../constants/quoteUi";
import FeedbackToast from "../components/FeedbackToast";

const QUOTES_PER_PAGE = 10;

const PopularQuotes = ({ landingKey = "popular" }) => {
  const landing = SEO_LANDINGS[landingKey] || SEO_LANDINGS.popular;
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
  const [isPosting, setIsPosting] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkPreviewCount, setBulkPreviewCount] = useState(0);
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editSourceWork, setEditSourceWork] = useState("");
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const initialCategory = String(
    searchParams.get("category") || landing.category || "all"
  )
    .trim()
    .toLowerCase();
  const initialSearch = String(
    searchParams.get("search") || searchParams.get("q") || ""
  ).trim();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategory || "all"
  );
  const [languageFilter, setLanguageFilter] = useState(
    landing.language || "all"
  );
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
    const cat = String(
      searchParams.get("category") || landing.category || "all"
    )
      .trim()
      .toLowerCase();
    const q = String(
      searchParams.get("search") || searchParams.get("q") || ""
    ).trim();
    setCategoryFilter(cat || "all");
    setSearchQuery(q);
    if (!searchParams.get("category") && landing.language && landing.language !== "all") {
      setLanguageFilter(landing.language);
    }
    setCurrentPage(1);
  }, [searchParams, landing.category, landing.language]);

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

  const collectionLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: landing.h1,
      description: landing.description,
      url: absoluteUrl(landing.path),
      isPartOf: {
        "@type": "WebSite",
        name: "Quotwellix",
        url: absoluteUrl("/"),
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: pageQuotes.length,
        itemListElement: pageQuotes.slice(0, 12).map((quote, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Quotation",
            text: quote.text,
            spokenByCharacter:
              quote.attributedTo ||
              quote.author?.name ||
              quote.authorName ||
              "Unknown",
          },
        })),
      },
    }),
    [landing, pageQuotes]
  );

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
    if (isPosting) return;
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

    const ui = quoteUi(language);
    setIsPosting(true);
    setPostError("");
    try {
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
        setToast({ message: ui.publishSuccess, type: "success" });
      } else {
        setPostError(action.payload || "Unable to publish this quote.");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const normalizeBulkPayload = (parsed) => {
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.quotes)) return parsed.quotes;
    if (parsed && typeof parsed === "object" && (parsed.quote || parsed.text)) {
      return [parsed];
    }
    return null;
  };

  const handleBulkFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setBulkError("");
    setBulkItems([]);
    setBulkFileName("");
    setBulkPreviewCount(0);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      setBulkError("Please upload a .json file.");
      return;
    }

    try {
      const textContent = await file.text();
      const parsed = JSON.parse(textContent);
      const items = normalizeBulkPayload(parsed);
      if (!items) {
        setBulkError(
          'Invalid JSON. Use an array of quotes, or { "quotes": [ ... ] }.'
        );
        return;
      }
      if (!items.length) {
        setBulkError("JSON file has no quotes.");
        return;
      }
      if (items.length > 30) {
        setBulkError("You can upload at most 30 quotes at a time.");
        return;
      }
      setBulkItems(items);
      setBulkFileName(file.name);
      setBulkPreviewCount(items.length);
    } catch {
      setBulkError("Could not read that JSON file. Check the format and try again.");
    }
  };

  const downloadBulkSample = () => {
    const sample = [
      {
        language: "english",
        quote: "The only way to do great work is to love what you do.",
        writer: "Steve Jobs",
        source: "",
        category: "motivation",
        other: "",
      },
      {
        language: "hindi",
        quote: "खुद पर विश्वास रखो।",
        writer: "Unknown",
        source: "",
        category: "other",
        other: "आत्मविश्वास",
      },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "popular-quotes-sample.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (isBulkUploading || !bulkItems.length) return;
    if (!user || user.role !== "admin") {
      requireLogin();
      return;
    }

    setIsBulkUploading(true);
    setBulkError("");
    try {
      const action = await dispatch(bulkCreatePopularQuotes(bulkItems));
      if (bulkCreatePopularQuotes.fulfilled.match(action)) {
        const created = action.payload?.createdCount || 0;
        const failed = action.payload?.failedCount || 0;
        const msg =
          action.payload?.message ||
          `Published ${created} popular quote(s) successfully.`;
        setToast({
          message: msg,
          type: created > 0 ? "success" : "error",
        });
        if (failed && action.payload?.failed?.length) {
          const details = action.payload.failed
            .slice(0, 5)
            .map((f) => `#${f.index}: ${f.error}`)
            .join(" · ");
          setBulkError(details);
        } else {
          setBulkError("");
        }
        setBulkItems([]);
        setBulkFileName("");
        setBulkPreviewCount(0);
        reloadFeed();
      } else {
        const payload = action.payload;
        const message =
          payload?.error ||
          payload?.message ||
          "Unable to bulk publish quotes.";
        setBulkError(message);
        if (payload?.failed?.length) {
          const details = payload.failed
            .slice(0, 5)
            .map((f) => `#${f.index}: ${f.error}`)
            .join(" · ");
          setBulkError(`${message} ${details}`);
        }
      }
    } finally {
      setIsBulkUploading(false);
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
      <Seo
        title={landing.title}
        description={landing.description}
        path={landing.path}
        jsonLd={collectionLd}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <FaLandmark className="mx-auto mb-3 text-3xl text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
            English & Hindi quotes
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-100">
            {landing.h1}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {landing.intro}
          </p>
          {guestMode && (
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Preview mixed popular classics and community lines. Sign in for the
              full feeds and to post.
            </p>
          )}
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
              disabled={isPosting}
              onChange={(event) => setText(event.target.value)}
              placeholder={postUi.popularQuotePlaceholder}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
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
                isPosting ||
                !text.trim() ||
                !attributedTo.trim() ||
                (category === OTHER_CATEGORY_VALUE && !customCategory.trim())
              }
              onClick={handlePost}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlus className="text-xs" />{" "}
              {isPosting ? postUi.publishingQuote : postUi.publishQuote}
            </button>

            <div className="mt-6 border-t border-indigo-50 pt-5">
              <h3 className="font-semibold text-gray-900">
                {postUi.bulkUploadTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{postUi.bulkUploadHint}</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{`[
  {
    "language": "english",
    "quote": "Your quote text",
    "writer": "Author name",
    "source": "",
    "category": "other",
    "other": "your custom category"
  }
]`}
              </pre>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700">
                  <FaFileUpload className="text-xs" />
                  {postUi.bulkChooseFile}
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    disabled={isBulkUploading}
                    onChange={handleBulkFileChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={downloadBulkSample}
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  {postUi.bulkDownloadSample}
                </button>
              </div>
              {bulkFileName && (
                <p className="mt-2 text-sm text-gray-600">
                  {bulkFileName} · {bulkPreviewCount} quote
                  {bulkPreviewCount === 1 ? "" : "s"} ready
                </p>
              )}
              {bulkError && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {bulkError}
                </p>
              )}
              <button
                type="button"
                disabled={isBulkUploading || !bulkItems.length}
                onClick={handleBulkUpload}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaFileUpload className="text-xs" />
                {isBulkUploading ? postUi.bulkUploading : postUi.bulkUploadButton}
              </button>
            </div>
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
            onComment={async (id, commentText, language = "english") => {
              if (!user) {
                requireLogin();
                throw new Error("Login required");
              }
              const action = await dispatch(
                commentQuote({ id, text: commentText, language })
              );
              if (commentQuote.rejected.match(action)) {
                throw new Error(action.payload || "Unable to post comment");
              }
            }}
            onEditComment={(comment) => {
              if (!user) return requireLogin();
              if (!comment?._id) {
                setEditCommentId(null);
                setEditCommentText("");
                return;
              }
              setEditCommentId(comment._id);
              setEditCommentText(comment.text);
            }}
            onSaveComment={async (quoteId, commentId) => {
              if (!user) {
                requireLogin();
                throw new Error("Login required");
              }
              if (!editCommentText.trim()) return;
              const action = await dispatch(
                editComment({
                  quoteId,
                  commentId,
                  text: editCommentText.trim(),
                })
              );
              if (editComment.rejected.match(action)) {
                throw new Error(action.payload || "Unable to update comment");
              }
              setEditCommentId(null);
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
      <FeedbackToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
};

export default PopularQuotes;
