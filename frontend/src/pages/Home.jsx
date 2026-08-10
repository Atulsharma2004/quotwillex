import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaComments,
  FaFire,
  FaHeart,
  FaLandmark,
  FaPenNib,
  FaQuoteLeft,
  FaShieldAlt,
  FaStar,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import Seo from "../components/Seo";
import { SEO_ROUTES, absoluteUrl } from "../constants/site";
import GoogleSignInButton from "../components/GoogleSignInButton";
import QuoteOfTheDayCard from "../components/QuoteOfTheDayCard";
import { QotdSkeleton } from "../components/Shimmer";
import quoteService from "../redux/quotes/quoteService";

const CATEGORIES = [
  { label: "Motivation", slug: "motivation", tone: "from-blue-500 to-indigo-500" },
  { label: "Wisdom", slug: "wisdom", tone: "from-sky-500 to-blue-600" },
  { label: "Love", slug: "love", tone: "from-rose-400 to-pink-500" },
  { label: "Courage", slug: "courage", tone: "from-amber-400 to-orange-500" },
  { label: "Peace", slug: "peace", tone: "from-teal-400 to-cyan-500" },
  { label: "Hope", slug: "hope", tone: "from-violet-400 to-indigo-500" },
];

const FEATURES = [
  {
    icon: FaQuoteLeft,
    title: "Share Your Wisdom",
    body: "Post quotes and thoughts that lift someone else’s day.",
  },
  {
    icon: FaUsers,
    title: "Grow Your Circle",
    body: "Follow creators, discover voices, and build a thoughtful feed.",
  },
  {
    icon: FaHeart,
    title: "Feel the Pulse",
    body: "Like, comment, and keep conversations around words that matter.",
  },
  {
    icon: FaLandmark,
    title: "Popular Classics",
    body: "Explore timeless lines from famous minds in one place.",
  },
];

const HomeBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="home-orb absolute -left-20 -top-16 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/20" />
    <div className="home-orb home-orb-delay absolute -right-16 top-24 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/15" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_50%)]" />
  </div>
);

const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <div className="mx-auto mb-10 max-w-2xl text-center">
    {eyebrow ? (
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">
      {title}
    </h2>
    {subtitle ? (
      <p className="mt-3 text-base text-gray-600 dark:text-slate-400">{subtitle}</p>
    ) : null}
  </div>
);

const QuoteMarquee = ({ quotes = [] }) => {
  if (!quotes.length) return null;

  const loop = quotes.length === 1 ? quotes : [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden border-y border-blue-100/80 bg-white/40 py-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="home-marquee gap-4 px-4">
        {loop.map((item, index) => (
          <div
            key={`${item._id || item.text}-${index}`}
            className="flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <FaQuoteLeft
              className={`mt-1 shrink-0 ${
                item.isPopular ? "text-indigo-500" : "text-blue-500"
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm italic text-slate-800 dark:text-slate-200">
                “{item.text}”
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                — {item.authorName}
                {item.isPopular ? " · Popular" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeaturesSection = () => (
  <section className="relative px-4 py-16">
    <SectionHeading
      eyebrow="Why Quotwellix"
      title="A quieter place for powerful words"
      subtitle="Write, discover, and connect around quotes that actually stick."
    />
    <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className="home-card home-reveal rounded-2xl border border-blue-100 bg-white/90 p-5 dark:border-slate-700 dark:bg-slate-900"
            style={{ animationDelay: `${0.1 + index * 0.08}s` }}
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25">
              <Icon />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              {feature.body}
            </p>
          </article>
        );
      })}
    </div>
  </section>
);

const CategoriesSection = ({
  ctaTo = "/signup",
  ctaLabel = "Join to explore",
  categoryBase = "/popular-quotes",
}) => (
  <section className="relative overflow-hidden px-4 py-16">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-slate-900/50" />
    <div className="relative mx-auto max-w-5xl">
      <SectionHeading
        eyebrow="Moods & themes"
        title="Find the words you need today"
        subtitle="Browse by feeling — from courage to calm — and keep inspiration close."
      />
      <div className="flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((cat, index) => (
          <Link
            key={cat.label}
            to={`${categoryBase}?category=${encodeURIComponent(cat.slug)}`}
            className={`home-card home-reveal inline-flex items-center rounded-full bg-gradient-to-r ${cat.tone} px-5 py-2.5 text-sm font-semibold text-white shadow-md`}
            style={{ animationDelay: `${0.12 + index * 0.06}s` }}
          >
            {cat.label}
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          to={ctaTo}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:gap-3 dark:text-blue-300"
        >
          {ctaLabel} <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="px-4 py-16">
    <SectionHeading
      eyebrow="Simple flow"
      title="How it works"
      subtitle="Three gentle steps from curious visitor to daily inspiration."
    />
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
      {[
        {
          step: "1",
          title: "Create your space",
          body: "Sign up in seconds with email or Google.",
        },
        {
          step: "2",
          title: "Share a quote",
          body: "Post something meaningful for others to find.",
        },
        {
          step: "3",
          title: "Connect & grow",
          body: "Like, comment, follow, and keep the spark going.",
        },
      ].map((item) => (
        <div
          key={item.step}
          className="home-step rounded-2xl border border-blue-100 bg-white/80 p-6 text-center dark:border-slate-700 dark:bg-slate-900/80"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-xl font-bold text-blue-700 dark:from-slate-800 dark:to-slate-700 dark:text-blue-300">
            {item.step}
          </div>
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-slate-100">
            {item.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">{item.body}</p>
        </div>
      ))}
    </div>
  </section>
);

const GuidelinesTeaser = () => (
  <section className="px-4 py-12">
    <div className="mx-auto max-w-4xl rounded-3xl border border-indigo-100 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
            <FaShieldAlt className="text-[11px]" /> Community basics
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            A few guidelines before you share
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            <li>Keep quotes kind, meaningful, and free of abuse or hate.</li>
            <li>Sexual, harassing, or offensive language is blocked automatically.</li>
            <li>User ID is required; private details like phone and city are optional.</li>
          </ul>
        </div>
        <div className="shrink-0">
          <Link
            to="/guidelines"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:scale-[1.02] hover:shadow-lg"
          >
            Explore more <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [qotdLoading, setQotdLoading] = useState(true);
  const [showcaseQuotes, setShowcaseQuotes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [qotd, showcase] = await Promise.all([
          quoteService.getQuoteOfTheDay(),
          quoteService.getHomeShowcase(),
        ]);
        if (!cancelled) {
          setQuoteOfTheDay(qotd);
          setShowcaseQuotes(Array.isArray(showcase) ? showcase : []);
        }
      } catch {
        if (!cancelled) {
          setQuoteOfTheDay(null);
          setShowcaseQuotes([]);
        }
      } finally {
        if (!cancelled) setQotdLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user || quoteOfTheDay?.quote || showcaseQuotes.length <= 1) {
      return undefined;
    }
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % showcaseQuotes.length);
        setFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, [user, quoteOfTheDay, showcaseQuotes]);

  const qotdJsonLd = quoteOfTheDay?.quote
    ? {
        "@context": "https://schema.org",
        "@type": "Quotation",
        text: quoteOfTheDay.quote.text,
        spokenByCharacter: quoteOfTheDay.quote.attributedTo ||
          quoteOfTheDay.quote.author?.name ||
          "Quotwellix community",
        datePublished: quoteOfTheDay.date || quoteOfTheDay.quote.createdAt,
        isPartOf: {
          "@type": "WebSite",
          name: "Quotwellix",
          url: absoluteUrl("/"),
        },
      }
    : null;

  if (user) {
    const quickActions = [
      {
        to: "/quotes#compose",
        icon: FaPenNib,
        title: "Write a quote",
        body: "Share something that moved you.",
        tone: "from-blue-600 to-indigo-600",
      },
      {
        to: "/quotes",
        icon: FaFire,
        title: "Explore feed",
        body: "See what the community is posting.",
        tone: "from-sky-500 to-blue-600",
      },
      {
        to: "/popular-quotes",
        icon: FaLandmark,
        title: "Popular quotes",
        body: "Timeless lines from famous voices.",
        tone: "from-indigo-500 to-violet-600",
      },
      {
        to: "/profile",
        icon: FaUser,
        title: "Your profile",
        body: "Manage posts, follows, and presence.",
        tone: "from-slate-600 to-slate-800",
      },
    ];

    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Seo {...SEO_ROUTES.home} jsonLd={qotdJsonLd} />
        <HomeBackdrop />

        <section className="relative px-4 pb-10 pt-12">
          <div className="mx-auto max-w-5xl">
            <div className="home-reveal mb-8 text-center">
              <p className="home-float mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 backdrop-blur dark:border-slate-600 dark:bg-slate-900/70 dark:text-blue-300">
                <FaStar className="text-[10px]" /> Welcome back
              </p>
              <h1 className="home-shine mb-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-blue-300 dark:via-indigo-300 dark:to-sky-300">
                Quotwellix
              </h1>
              <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">
                Hello, {user.name}
              </h2>
              <p className="mx-auto max-w-xl text-gray-600 dark:text-slate-400">
                Start with today’s featured line, then jump into writing,
                exploring, or your profile.
              </p>
            </div>

            <div className="mb-8 mx-auto max-w-xl">
              {qotdLoading ? (
                <QotdSkeleton compact />
              ) : quoteOfTheDay?.quote ? (
                <QuoteOfTheDayCard data={quoteOfTheDay} compact />
              ) : (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-white/60 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
                  <FaQuoteLeft className="mx-auto mb-3 text-xl text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    No quote of the day yet — be the spark and post one.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.to}
                    className="home-card home-reveal group relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    style={{ animationDelay: `${0.12 + index * 0.07}s` }}
                  >
                    <div
                      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.tone} text-white shadow-md transition group-hover:scale-105`}
                    >
                      <Icon />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {action.body}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:gap-3 dark:text-blue-300">
                      Open <FaArrowRight className="text-xs" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <QuoteMarquee quotes={showcaseQuotes} />

        <CategoriesSection
          ctaTo="/quotes"
          ctaLabel="Browse all quotes"
          categoryBase="/quotes"
        />

        <GuidelinesTeaser />

        <section className="relative px-4 pb-16 pt-4">
          <div className="home-shine mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-6 py-12 text-center text-white shadow-xl shadow-blue-500/20">
            <FaComments className="mx-auto mb-4 text-3xl opacity-90" />
            <h2 className="mb-3 text-3xl font-bold">Keep the conversation going</h2>
            <p className="mx-auto mb-6 max-w-xl text-blue-50">
              Your next like, comment, or quote might be exactly what someone
              needed today.
            </p>
            <Link
              to="/quotes"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:scale-[1.02] hover:bg-blue-50"
            >
              Go to Quotes <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const fallbackQuote = showcaseQuotes[activeIndex] || null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Seo {...SEO_ROUTES.home} jsonLd={qotdJsonLd} />
      <HomeBackdrop />

      <section className="relative flex min-h-[calc(100vh-72px)] items-center px-4 py-16">
        <div className="mx-auto w-full max-w-4xl text-center">
          <p className="home-float home-reveal mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 backdrop-blur dark:border-slate-600 dark:bg-slate-900/70 dark:text-blue-300">
            <FaStar className="text-[10px]" /> Daily inspiration
          </p>
          <h1 className="home-shine home-reveal delay-1 mb-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl dark:from-blue-300 dark:via-indigo-300 dark:to-sky-300">
            Quotwellix
          </h1>
          <p className="home-reveal delay-2 mb-2 text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">
            Share wisdom. Inspire others.
          </p>
          <p className="home-reveal delay-2 mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Discover meaningful quotes, follow thoughtful voices, and build a
            quieter corner of the internet for words that matter.
          </p>

          <div className="home-reveal delay-3 mx-auto mb-8 w-full max-w-lg text-left">
            {qotdLoading ? (
              <QotdSkeleton />
            ) : quoteOfTheDay?.quote ? (
              <QuoteOfTheDayCard data={quoteOfTheDay} />
            ) : fallbackQuote ? (
              <div
                className={`mx-auto max-w-2xl rounded-2xl border border-white/60 bg-white/85 px-6 py-6 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/80 ${
                  fade ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <FaQuoteLeft className="mb-3 text-blue-500" />
                <p className="mb-3 text-lg italic text-gray-800 dark:text-slate-100">
                  &ldquo;{fallbackQuote.text}&rdquo;
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  — {fallbackQuote.authorName}
                  {fallbackQuote.isPopular ? " · Popular" : ""}
                </p>
                {showcaseQuotes.length > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {showcaseQuotes.slice(0, 8).map((item, i) => (
                      <button
                        key={item._id || i}
                        type="button"
                        aria-label={`Quote ${i + 1}`}
                        onClick={() => {
                          setFade(false);
                          setTimeout(() => {
                            setActiveIndex(i);
                            setFade(true);
                          }, 200);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          i === activeIndex
                            ? "w-6 bg-blue-600"
                            : "w-2 bg-blue-200 hover:bg-blue-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
                <FaQuoteLeft className="mx-auto mb-3 text-2xl text-blue-500" />
                <p className="text-gray-600 dark:text-slate-400">
                  Be the first to share a quote on Quotwellix.
                </p>
              </div>
            )}
          </div>

          <div className="home-reveal delay-4 mb-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-blue-300 bg-white/70 px-8 py-3 text-lg font-semibold text-blue-700 backdrop-blur transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/70 dark:text-blue-300"
            >
              Sign In
            </Link>
          </div>

          <div className="home-reveal delay-5 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Or continue with Google
            </p>
            <GoogleSignInButton />
          </div>
        </div>
      </section>

      <QuoteMarquee quotes={showcaseQuotes} />
      <FeaturesSection />
      <CategoriesSection
        ctaTo="/popular-quotes"
        ctaLabel="Explore popular quotes"
      />
      <HowItWorksSection />
      <GuidelinesTeaser />

      <section className="px-4 pb-20 pt-4">
        <div className="home-shine mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-6 py-14 text-center text-white shadow-xl shadow-blue-500/25">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
            Ready to start sharing?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-blue-50">
            Join Quotwellix and turn everyday thoughts into lines someone might
            remember.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-lg font-semibold text-blue-700 transition hover:scale-[1.02] hover:bg-blue-50"
          >
            Create Your Account <FaArrowRight className="text-sm" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
