import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaComments,
  FaHeart,
  FaQuoteLeft,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import Seo from "../components/Seo";
import { SEO_ROUTES } from "../constants/site";
import { AwardsSkeleton } from "../components/Shimmer";
import ProfileAvatar from "../components/ProfileAvatar";
import QuoteOfTheDayCard from "../components/QuoteOfTheDayCard";
import { profilePath } from "../utils/profileKey";
import quoteService from "../redux/quotes/quoteService";

const PersonLink = ({ person, className = "" }) => {
  const { user } = useSelector((state) => state.auth);
  if (!person?._id && !person?.username) {
    return <span className={className}>{person?.name || "Unknown"}</span>;
  }
  return (
    <Link
      to={profilePath(person, user?._id)}
      className={`font-semibold transition hover:text-[#C9893A] ${className}`}
    >
      {person.name}
    </Link>
  );
};

const EmptyPodium = ({ label }) => (
  <p className="awards-fade rounded-3xl border border-dashed border-slate-300/80 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
    {label}
  </p>
);

const QuotePodium = ({ entries, metricIcon: MetricIcon, metricWord, accent }) => {
  if (!entries.length) {
    return <EmptyPodium label={`No ${metricWord} yet for this range.`} />;
  }

  return (
    <div className="awards-podium-grid">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const isFirst = rank === 1;
        return (
          <article
            key={entry._id}
            className={`awards-podium-slot awards-slot-${rank} ${accent}`}
            style={{ animationDelay: `${0.08 * rank}s` }}
          >
            <div className={`awards-rank-badge rank-${rank}`}>#{rank}</div>
            <div className={`awards-block rank-${rank}`}>
              <FaQuoteLeft className="mb-2 text-sm opacity-50" />
              <p className={`awards-quote-text ${isFirst ? "text-base" : "text-sm"}`}>
                “{entry.text}”
              </p>
              <div className="mt-4 flex items-center gap-2">
                <ProfileAvatar
                  src={entry.author?.profilePicture}
                  alt=""
                  className={`rounded-full object-cover ring-2 ring-white/70 ${
                    isFirst ? "h-11 w-11" : "h-9 w-9"
                  }`}
                />
                <div className="min-w-0 text-left">
                  <PersonLink
                    person={entry.author}
                    className="block truncate text-sm text-slate-900 dark:text-slate-50"
                  />
                  {entry.author?.username ? (
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      @{entry.author.username}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="awards-metric mt-3">
                <MetricIcon />
                <span>
                  {entry.metricCount ?? 0} {metricWord}
                </span>
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const StarPodium = ({ entries }) => {
  if (!entries.length) {
    return <EmptyPodium label="No Quote of the Day stars yet." />;
  }

  return (
    <div className="awards-podium-grid">
      {entries.map((person) => {
        const rank = person.rank;
        const isFirst = rank === 1;
        return (
          <article
            key={person._id}
            className={`awards-podium-slot awards-slot-${rank} awards-star-accent`}
            style={{ animationDelay: `${0.1 * rank}s` }}
          >
            <div className={`awards-rank-badge rank-${rank}`}>#{rank}</div>
            <div className={`awards-block rank-${rank} items-center text-center`}>
              <ProfileAvatar
                src={person.profilePicture}
                alt=""
                className={`awards-star-avatar mx-auto rounded-full object-cover ${
                  isFirst ? "h-20 w-20" : "h-14 w-14"
                }`}
              />
              <PersonLink
                person={person}
                className="mt-3 block text-base text-slate-900 dark:text-slate-50"
              />
              {person.username ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  @{person.username}
                </p>
              ) : null}
              <p className="awards-metric awards-star-metric mt-3 justify-center">
                <FaStar className="awards-star-spin" />
                <span>{person.qotdStars} stars</span>
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const Awards = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [range, setRange] = useState("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await quoteService.getAwardsLeaderboard();
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              err.message ||
              "Unable to load awards right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scope = range === "today" ? data?.today : data?.overall;
  const liked = scope?.mostLiked?.leaderboard || [];
  const commented = scope?.mostCommented?.leaderboard || [];
  const stars = data?.qotdStars?.leaderboard || [];
  const quoteOfTheDay = data?.quoteOfTheDay || null;

  return (
    <div className="awards-page relative min-h-[70vh] overflow-hidden px-4 py-10">
      <Seo {...SEO_ROUTES.awards} />
      <div className="awards-orb awards-orb-a" aria-hidden />
      <div className="awards-orb awards-orb-b" aria-hidden />
      <div className="awards-orb awards-orb-c" aria-hidden />

      <div className="relative mx-auto max-w-5xl">
        <header className="awards-hero mb-8 text-center">
          <p className="awards-kicker mb-3 inline-flex items-center gap-2">
            <FaTrophy className="awards-trophy-bounce" />
            Hall of fame
          </p>
          <h1 className="awards-title">
            Best quotes
            <span className="awards-title-glow"> Top 3</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Most liked quotes, most commented lines, and Quote of the Day stars
            from the Quotwellix community.
          </p>

          <div
            className="awards-range mt-6 inline-flex rounded-full p-1"
            role="tablist"
            aria-label="Awards time range"
          >
            <button
              type="button"
              role="tab"
              aria-selected={range === "today"}
              onClick={() => setRange("today")}
              className={`awards-range-btn ${range === "today" ? "active" : ""}`}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={range === "overall"}
              onClick={() => setRange("overall")}
              className={`awards-range-btn ${
                range === "overall" ? "active" : ""
              }`}
            >
              Overall
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Stars first (all-time) · then liked & commented
            {range === "today" ? " from today" : " all-time"}
          </p>
        </header>

        {loading && <AwardsSkeleton />}
        {error && (
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <div key={range} className="space-y-12">
            <section className="awards-section">
              <div className="awards-section-head">
                <FaStar className="text-amber-500" />
                <h2>Quote of the Day</h2>
                <span className="awards-pill">Today</span>
              </div>
              <p className="mb-4 text-center text-xs text-slate-500 dark:text-slate-400 sm:text-left">
                Featured line on the home page right now
              </p>
              {quoteOfTheDay?.quote ? (
                <div className="mx-auto max-w-xl">
                  <QuoteOfTheDayCard data={quoteOfTheDay} compact />
                </div>
              ) : (
                <EmptyPodium label="No Quote of the Day selected yet." />
              )}
            </section>

            <section className="awards-section">
              <div className="awards-section-head">
                <FaStar className="text-amber-500" />
                <h2>Most QOTD stars</h2>
                <span className="awards-pill">All-time</span>
              </div>
              <p className="mb-4 text-center text-xs text-slate-500 dark:text-slate-400 sm:text-left">
                Top 3 creators by Quote of the Day star points
              </p>
              <StarPodium entries={stars} />
            </section>

            <section className="awards-section">
              <div className="awards-section-head">
                <FaHeart className="text-rose-500" />
                <h2>Most liked</h2>
              </div>
              <QuotePodium
                entries={liked}
                metricIcon={FaHeart}
                metricWord="likes"
                accent="awards-liked-accent"
              />
            </section>

            <section className="awards-section">
              <div className="awards-section-head">
                <FaComments className="text-sky-500" />
                <h2>Most commented</h2>
              </div>
              <QuotePodium
                entries={commented}
                metricIcon={FaComments}
                metricWord="comments"
                accent="awards-comment-accent"
              />
            </section>

            {!user && (
              <div className="awards-cta text-center">
                <h2 className="text-xl font-bold text-white">
                  Want a spot on the podium?
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm">
                  Share a community quote — likes, comments, and Quote of the
                  Day stars put you here.
                </p>
                <Link to="/signup" className="awards-cta-btn mt-5 inline-flex">
                  Join Quotwellix
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Awards;
