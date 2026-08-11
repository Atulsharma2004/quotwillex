/**
 * Site-wide SEO defaults. On Vercel set VITE_SITE_URL=https://quotwellix.in.
 * Leave it unset for local so canonicals use http://localhost:5173.
 */
const trimSlash = (url = "") => String(url).replace(/\/+$/, "");

export const SITE_NAME = "Quotwellix";
export const SITE_TAGLINE = "Words that linger.";
export const SITE_TAGLINE_HI = "शब्द जो याद रह जाएँ।";
export const SUPPORT_EMAIL = "quotesupport9@gmail.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
/** Default profile image when the user does not upload one. */
export const DEFAULT_AVATAR = "/default-avatar.svg";

export const SITE_DESCRIPTION =
  "Quotwellix — English और Hindi में quotes शेयर करें। Quote of the day, motivational quotes, प्रेरक विचार, शायरी और popular classics खोजें। भारत का social quotes community।";

export const SITE_DESCRIPTION_EN =
  "Quotwellix is a social quotes platform to share quotes online in English and Hindi, discover quote of the day, browse popular classics, and connect with a thoughtful community in India.";

/** English + Hindi (Devanagari) + Hinglish / Roman Hindi search terms. */
export const SITE_KEYWORDS = [
  // Brand
  "Quotwellix",
  "quotwellix.in",
  // Core English
  "Hindi quotes",
  "share quotes online",
  "English Hindi quotes community",
  "inspirational quotes",
  "motivational quotes",
  "daily quotes",
  "quote of the day",
  "popular quotes classics",
  "famous quotes",
  "social quotes platform India",
  "post your own quotes online",
  "wisdom quotes",
  "life quotes",
  "love quotes",
  "success quotes",
  "positive quotes",
  "short quotes",
  "best quotes",
  "deep quotes",
  "attitude quotes",
  "friendship quotes",
  "sad quotes",
  "happy quotes",
  "hope quotes",
  "courage quotes",
  "peace quotes",
  "self love quotes",
  "good morning quotes",
  "good night quotes",
  "birthday quotes",
  "thank you quotes",
  "quotes for Instagram",
  "quotes for WhatsApp status",
  "write your own quotes",
  "quote sharing app India",
  "quote community website",
  "famous Hindi English quotes",
  "daily inspiration India",
  "thought of the day",
  "words of wisdom",
  "classic quotes",
  "timeless quotes",
  "quote leaderboard",
  // Hindi Devanagari
  "हिंदी कोट्स",
  "प्रेरणादायक विचार",
  "प्रेरक अनमोल वचन",
  "सुविचार",
  "हिंदी शायरी",
  "शायरी",
  "मोटिवेशनल कोट्स हिंदी",
  "आज का विचार",
  "दिन का सुविचार",
  "जीवन विचार",
  "प्रेम शायरी",
  "दर्द भरी शायरी",
  "रोमांटिक शायरी",
  "दोस्ती शायरी",
  "जिंदगी शायरी",
  "सफलता के विचार",
  "सकारात्मक विचार",
  "अनमोल वचन",
  "महापुरुषों के विचार",
  "गुड मॉर्निंग सुविचार",
  "गुड नाईट शायरी",
  "व्हाट्सएप स्टेटस हिंदी",
  "इंस्टाग्राम कैप्शन हिंदी",
  "छोटी शायरी",
  "टू लाइन शायरी",
  "रविवार सुविचार",
  "सोमवार मोटिवेशन",
  "हिंदी प्रेरणा",
  "मन की बात कोट्स",
  "आत्मा के विचार",
  "कर्म के वचन",
  "हिम्मत के कोट्स",
  "सपनों के विचार",
  "प्रेरणादायक कहानियाँ कोट्स",
  "भारतीय सुविचार",
  "वेदिक विचार",
  "योग और शांति कोट्स",
  "माँ बाप शायरी",
  "देशभक्ति के विचार",
  "शिक्षा के अनमोल वचन",
  "परीक्षा मोटिवेशन कोट्स",
  "नौकरी सफलता विचार",
  "व्यवसाय प्रेरणा कोट्स",
  "रिश्ते शायरी",
  "एकतरफा प्यार शायरी",
  "टूटा दिल शायरी",
  "खुशी के पल कोट्स",
  "आशा के सुविचार",
  "धैर्य के विचार",
  "आत्मविश्वास कोट्स हिंदी",
  "स्वयं प्रेम विचार",
  "मेहनत सफलता कोट्स",
  "समय के अनमोल वचन",
  "सच के विचार",
  "नैतिक मूल्य सुविचार",
  // Hinglish / Roman Hindi
  "love quotes hindi",
  "success quotes hindi",
  "whatsapp status hindi",
  "suvichar",
  "anmol vachan",
  "hindi shayari",
  "motivational quotes hindi",
  "inspirational quotes hindi",
  "zindagi shayari",
  "dosti shayari",
  "pyar shayari",
  "dard bhari shayari",
  "romantic shayari hindi",
  "two line shayari",
  "attitude shayari",
  "sad shayari hindi",
  "happy quotes hindi",
  "good morning suvichar",
  "good night shayari",
  "instagram captions hindi",
  "status for whatsapp hindi",
  "aaj ka vichar",
  "din ka suvichar",
  "jeevan vichar",
  "prerana dayak vichar",
  "safalta ke quotes",
  "positive thinking hindi",
  "himmat quotes hindi",
  "mehnat success quotes hindi",
  "sapne quotes hindi",
  "self confidence quotes hindi",
  "broken heart shayari",
  "one sided love shayari",
  "friendship quotes hindi",
  "family quotes hindi",
  "maa baap shayari",
  "deshbhakti quotes hindi",
  "exam motivation quotes hindi",
  "job success quotes hindi",
  "business motivation hindi",
  "short hindi quotes",
  "best hindi quotes",
  "deep hindi shayari",
  "life lessons hindi",
  "monday motivation hindi",
  "sunday thoughts hindi",
  "quotes likho online",
  "apne quotes share karo",
  "hindi english quotes mix",
  "hinglish quotes",
  "desi quotes",
  "bharat suvichar",
  "anmol vachan hindi",
  "prerak kahani quotes",
  "yoga peace quotes hindi",
  "karma quotes hindi",
  "satya vichar",
  "dhairya quotes hindi",
  "asha ke suvichar",
  "khushi ke quotes",
  "rishte shayari",
  "dil ki baat quotes",
  "mann ke vichar",
  "atma vishwas quotes",
  "swayam prem quotes hindi",
  "time management quotes hindi",
  "study motivation hindi",
  "UPSC motivation quotes hindi",
  "students motivational quotes hindi",
  "teachers day quotes hindi",
  "diwali wishes quotes hindi",
  "holi quotes hindi",
  "new year quotes hindi",
  "republic day quotes hindi",
  "independence day quotes hindi",
  "rakhi shayari",
  "bhai behen shayari",
  "shaadi quotes hindi",
  "anniversary shayari",
  "miss you shayari",
  "sorry quotes hindi",
  "thank you quotes hindi",
  "bye quotes hindi",
  "traveling quotes hindi",
  "nature peace quotes hindi",
  "god quotes hindi",
  "bhagwan ke vichar",
  "ramayan quotes hindi",
  "gita quotes hindi",
  "kabir ke dohe",
  "rahim ke dohe",
  "gulzar shayari",
  "mirza ghalib shayari",
  "rahim ke dohe",
  "tulsidas dohe",
  "quote of the day hindi",
  "today thought hindi",
  "viral hindi quotes",
  "trending shayari",
  "share shayari online",
  "post hindi quotes free",
].join(", ");

/** Production origin used when VITE_SITE_URL is unset and window is unavailable (SSR/build). */
export const PRODUCTION_SITE_URL = "https://quotwellix.in";

export const getSiteUrl = () => {
  const fromEnv = trimSlash(import.meta.env.VITE_SITE_URL || "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimSlash(window.location.origin);
  }
  return PRODUCTION_SITE_URL;
};

export const absoluteUrl = (path = "/") => {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export const DEFAULT_OG_IMAGE = "/og-cover.jpg";
export const SITE_LOGO = "/quotwellix-logo.png";

export const SEO_ROUTES = {
  home: {
    title: `${SITE_NAME} — ${SITE_TAGLINE} | हिंदी कोट्स एवं सुविचार`,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  popular: {
    title: `Popular Quotes, हिंदी कोट्स और क्लासिक्स | ${SITE_NAME}`,
    description:
      "Browse popular quotes और प्रसिद्ध हिंदी कोट्स, सुविचार व classics on Quotwellix. Filter by category, language (English/Hindi), and date — timeless wisdom to share.",
    path: "/popular-quotes",
  },
  awards: {
    title: `Awards & Leaderboard | पुरस्कार | ${SITE_NAME}`,
    description:
      "Quotwellix awards: most liked quotes, most commented lines, और Quote of the Day stars — सबसे पसंद आए कोट्स और क्रिएटर्स देखें।",
    path: "/awards",
  },
  quotes: {
    title: `Community Quotes Feed | ${SITE_NAME}`,
    description:
      "Read and share community quotes in English और हिंदी — like, comment, और creators को follow करें।",
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
    title: `Create Account | मुफ्त जुड़ें | ${SITE_NAME}`,
    description:
      "Join Quotwellix free — हिंदी और English में अपने quotes पोस्ट करें, popular classics खोजें, और quotes community से जुड़ें।",
    path: "/signup",
    noindex: false,
  },
  contact: {
    title: `Contact ${SITE_NAME} | संपर्क करें`,
    description:
      "Contact Quotwellix for questions, feedback, complaints, partnerships, or press. हमसे संपर्क करें: quotesupport9@gmail.com।",
    path: "/contact",
  },
  guidelines: {
    title: `Guidelines & Policies | नियम | ${SITE_NAME}`,
    description:
      "Quotwellix community guidelines: site कैसे इस्तेमाल करें, content rules, abusive-word policy, privacy, और guest vs member access।",
    path: "/guidelines",
  },
};
