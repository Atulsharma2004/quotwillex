import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaQuoteLeft,
  FaHeart,
  FaRegCommentDots,
  FaStar,
  FaTrophy,
  FaArrowRight,
} from "react-icons/fa";
import { profilePath } from "../utils/profileKey";
import ProfileAvatar from "./ProfileAvatar";

const formatShortDate = (isoDay) => {
  if (!isoDay) return "";
  const date = new Date(`${isoDay}T12:00:00.000Z`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const StarBurst = () => (
  <div className="qotd-stars-burst pointer-events-none absolute inset-0" aria-hidden>
    <FaStar className="qotd-spark qotd-spark-1" />
    <FaStar className="qotd-spark qotd-spark-2" />
    <FaStar className="qotd-spark qotd-spark-3" />
    <FaStar className="qotd-spark qotd-spark-4" />
  </div>
);

const QuoteOfTheDayCard = ({ data, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (!data?.quote) return null;

  const { quote, date, sourceDate, isFallbackDay, usedPopular } = data;
  const author = quote.author || {};
  const authorName = author.username || author.name || "Community";
  const starPoints = author.qotdStars ?? 0;
  const likes = quote.likesCount || 0;
  const comments = quote.commentsCount || 0;

  const goToAuthor = () => {
    if (!author._id && !author.username) return;
    navigate(profilePath(author, user?._id));
  };

  return (
    <section
      className={`qotd-card qotd-card-v2 relative mx-auto overflow-hidden ${
        compact ? "max-w-xl" : "max-w-lg"
      }`}
      aria-label="Quote of the day"
    >
      <div className="qotd-card-shell relative rounded-2xl border border-amber-200/70 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-[1px] shadow-xl shadow-amber-500/10 dark:border-amber-500/30">
        <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-4 py-4 sm:px-5 sm:py-4">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl"
            aria-hidden
          />
          <StarBurst />

          <div className="relative flex items-start justify-between gap-3">
            <div className="qotd-badge inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
              <FaTrophy className="text-[9px] text-amber-300" />
              Quote of the Day
            </div>
            <div className="qotd-star-chip shrink-0 text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-500/25 to-orange-500/20 px-2.5 py-1 shadow-sm shadow-amber-500/20">
                <FaStar className="qotd-star-spin text-amber-300 text-[11px]" />
                <span className="text-sm font-bold tabular-nums text-amber-100">
                  {starPoints}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">
                  pts
                </span>
              </div>
              <p className="mt-1 text-[10px] font-medium text-slate-400">
                {formatShortDate(date)}
              </p>
            </div>
          </div>

          <div className="relative mt-3 flex gap-2.5">
            <FaQuoteLeft className="qotd-quote-mark mt-0.5 shrink-0 text-sm text-amber-300/80" />
            <blockquote
              className={`min-w-0 font-serif italic leading-snug text-slate-50 ${
                compact ? "text-base sm:text-lg" : "text-[15px] sm:text-base"
              }`}
            >
              “{quote.text}”
            </blockquote>
          </div>

          <div className="relative mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <div className="group flex min-w-0 items-center gap-2.5 text-left">
              <span className="relative shrink-0">
                <ProfileAvatar
                  src={author.profilePicture}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-300/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] text-slate-900 shadow pointer-events-none">
                  <FaStar />
                </span>
              </span>
              <button
                type="button"
                onClick={goToAuthor}
                className="min-w-0 text-left"
              >
                <span className="block truncate text-sm font-semibold text-white transition group-hover:text-amber-200">
                  @{String(authorName).replace(/^@/, "")}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {quote.category
                    ? String(quote.category).charAt(0).toUpperCase() +
                      String(quote.category).slice(1)
                    : "Featured creator"}
                  {" · "}
                  {starPoints === 1 ? "1 QOTD star" : `${starPoints} QOTD stars`}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <FaHeart className="text-rose-400" />
                {likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <FaRegCommentDots className="text-sky-300" />
                {comments}
              </span>
            </div>
          </div>

          {isFallbackDay && (
            <p className="relative mt-2.5 text-[10px] leading-relaxed text-slate-500">
              {usedPopular
                ? "No recent community posts — featuring a popular quote."
                : `Picked from ${formatShortDate(sourceDate)}.`}
            </p>
          )}

          <div className="relative mt-3 flex flex-wrap items-center gap-2">
            <Link
              to="/awards"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-400/20"
            >
              <FaStar className="text-[9px]" /> Star board
            </Link>
            <Link
              to="/quotes"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-100 transition hover:bg-white/20"
            >
              More quotes <FaArrowRight className="text-[9px]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteOfTheDayCard;
