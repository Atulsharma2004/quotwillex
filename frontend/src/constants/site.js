/**
 * Site-wide SEO defaults. Set VITE_SITE_URL to your production origin
 * (e.g. https://quotwellix.com) before building for correct canonicals/sitemap.
 */
const trimSlash = (url = "") => String(url).replace(/\/+$/, "");

export const SITE_NAME = "Quotwellix";
export const SITE_TAGLINE = "Words that linger.";
export const SUPPORT_EMAIL = "quotesupport9@gmail.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
/** Default profile image when the user does not upload one. */
export const DEFAULT_AVATAR = "/default-avatar.svg";
export const SITE_DESCRIPTION =
  "Quotwellix is a social quotes platform to discover daily inspiration, share wisdom, explore popular classics, and connect with people who love meaningful words — in English and Hindi.";
export const SITE_KEYWORDS = [
  "Quotwellix",
  "quotes",
  "inspirational quotes",
  "motivational quotes",
  "daily quotes",
  "quote of the day",
  "famous quotes",
  "Hindi quotes",
  "wisdom quotes",
  "share quotes",
].join(", ");

export const getSiteUrl = () => {
  const fromEnv = trimSlash(import.meta.env.VITE_SITE_URL || "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimSlash(window.location.origin);
  }
  return "https://quotwellix.com";
};

export const absoluteUrl = (path = "/") => {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export const DEFAULT_OG_IMAGE = "/og-cover.png";
export const SITE_LOGO = "/quotwellix-logo.png";

export const SEO_ROUTES = {
  home: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  popular: {
    title: `Popular Quotes & Classics | ${SITE_NAME}`,
    description:
      "Browse timeless popular quotes from famous voices. Filter by category, language, and date — English and Hindi classics on Quotwellix.",
    path: "/popular-quotes",
  },
  awards: {
    title: `Awards & Leaderboard | ${SITE_NAME}`,
    description:
      "See Quotwellix’s most liked quotes, most commented lines, and creators with the most Quote of the Day stars.",
    path: "/awards",
  },
  quotes: {
    title: `Community Quotes Feed | ${SITE_NAME}`,
    description:
      "Read and share community quotes, like and comment, and follow creators on Quotwellix.",
    path: "/quotes",
    noindex: true,
  },
  profile: {
    title: `Your Profile | ${SITE_NAME}`,
    description: "Manage your Quotwellix profile, posts, and follows.",
    path: "/profile",
    noindex: true,
  },
  account: {
    title: `Full profile | ${SITE_NAME}`,
    description: "View your full Quotwellix account details in private view mode.",
    path: "/account",
    noindex: true,
  },
  login: {
    title: `Sign In | ${SITE_NAME}`,
    description: "Sign in to Quotwellix to share quotes and follow creators.",
    path: "/login",
    noindex: true,
  },
  signup: {
    title: `Create Account | ${SITE_NAME}`,
    description:
      "Join Quotwellix free — share inspirational quotes, discover classics, and connect with a thoughtful community.",
    path: "/signup",
    noindex: false,
  },
  contact: {
    title: `Reach Out — Contact ${SITE_NAME}`,
    description:
      "Contact Quotwellix for questions, feedback, complaints, partnerships, or press. We reply personally at quotesupport9@gmail.com.",
    path: "/contact",
  },
  guidelines: {
    title: `Guidelines, Policies & Instructions | ${SITE_NAME}`,
    description:
      "Quotwellix community guidelines: how to use the site, what is mandatory, content rules, abusive-word policy, privacy, and guest vs member access.",
    path: "/guidelines",
  },
};
