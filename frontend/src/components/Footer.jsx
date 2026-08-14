import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowUp,
  FaCheck,
  FaCopy,
  FaEnvelope,
  FaHome,
  FaLandmark,
  FaLock,
  FaQuoteLeft,
  FaRedo,
  FaShieldAlt,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../constants/site";

const FOOTER_QUOTES = [
  {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
  },
  {
    text: "In the middle of every difficulty lies opportunity.",
    author: "Albert Einstein",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "To thine own self be true.",
    author: "William Shakespeare",
  },
];

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const quickLinks = useMemo(() => {
    if (user) {
      return [
        { to: "/", label: "Home", icon: FaHome },
        { to: "/quotes", label: "Quotes", icon: FaQuoteLeft },
        { to: "/popular-quotes", label: "Popular Quotes", icon: FaLandmark },
        { to: "/motivational-quotes", label: "Motivational", icon: FaQuoteLeft },
        { to: "/awards", label: "Awards", icon: FaTrophy },
        { to: "/guidelines", label: "Guidelines", icon: FaShieldAlt },
        { to: "/privacy", label: "Privacy & Policy", icon: FaLock },
        { to: "/contact", label: "Contact", icon: FaEnvelope },
        { to: "/profile", label: "Profile", icon: FaUser },
      ];
    }
    return [
      { to: "/", label: "Home", icon: FaHome },
      { to: "/popular-quotes", label: "Popular Quotes", icon: FaLandmark },
      { to: "/motivational-quotes", label: "Motivational", icon: FaQuoteLeft },
      { to: "/awards", label: "Awards", icon: FaTrophy },
      { to: "/guidelines", label: "Guidelines", icon: FaShieldAlt },
      { to: "/privacy", label: "Privacy & Policy", icon: FaLock },
      { to: "/contact", label: "Contact", icon: FaEnvelope },
      { to: "/login", label: "Sign In", icon: FaUser },
      { to: "/signup", label: "Sign Up", icon: FaQuoteLeft },
    ];
  }, [user]);

  const activeQuote = FOOTER_QUOTES[quoteIndex % FOOTER_QUOTES.length];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shuffleQuote = () => {
    setQuoteIndex((prev) => {
      if (FOOTER_QUOTES.length < 2) return prev;
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * FOOTER_QUOTES.length);
      }
      return next;
    });
  };

  const copySiteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-indigo-50">
      <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-3 flex items-center gap-2 text-left text-lg font-bold text-white transition hover:text-indigo-200"
          >
            <picture>
              <source srcSet="/quotwellix-mark.webp" type="image/webp" />
              <img
                src="/quotwellix-mark.png"
                alt=""
                className="h-9 w-9 rounded-xl object-cover"
                width={36}
                height={36}
                decoding="async"
              />
            </picture>
            Quotwellix
          </button>
          <p className="max-w-sm text-sm leading-relaxed text-indigo-100/80">
            Words that linger — share wisdom, discover timeless quotes, and
            connect through lines that matter in English and Hindi.
          </p>
          <a
            href={SUPPORT_MAILTO}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-200 transition hover:text-white"
          >
            <FaEnvelope className="text-xs" />
            {SUPPORT_EMAIL}
          </a>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
            >
              <FaEnvelope />
              Reach Out
            </Link>
            <button
              type="button"
              onClick={copySiteLink}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
            >
              {copied ? <FaCheck className="text-emerald-300" /> : <FaCopy />}
              {copied ? "Link copied" : "Copy site link"}
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400/40"
            >
              <FaArrowUp />
              Back to top
            </button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-indigo-50 transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/10"
              >
                <Icon className="text-xs text-indigo-300 transition group-hover:text-white" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
              Mini Quote
            </p>
            <button
              type="button"
              onClick={shuffleQuote}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-indigo-200 transition hover:bg-white/10 hover:text-white"
              aria-label="Show another quote"
            >
              <FaRedo />
              Shuffle
            </button>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm transition hover:border-indigo-300/30">
            <p className="text-sm italic leading-relaxed text-indigo-50">
              &ldquo;{activeQuote.text}&rdquo;
            </p>
            <p className="mt-2 text-xs font-semibold text-indigo-300">
              — {activeQuote.author}
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-4 py-3 text-center text-xs text-indigo-200/80">
        &copy; {new Date().getFullYear()} Quotwellix. Words that linger.{" "}
        <Link
          to="/guidelines"
          className="underline decoration-indigo-400/50 underline-offset-2 transition hover:text-white"
        >
          Guidelines
        </Link>
        {" · "}
        <Link
          to="/privacy"
          className="underline decoration-indigo-400/50 underline-offset-2 transition hover:text-white"
        >
          Privacy &amp; Policy
        </Link>
        {" · "}
        <a
          href={SUPPORT_MAILTO}
          className="underline decoration-indigo-400/50 underline-offset-2 transition hover:text-white"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
