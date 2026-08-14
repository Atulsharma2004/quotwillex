import { SITE_NAME } from "./site";

/** Public, indexable quote landings for generic search terms. */
export const SEO_LANDINGS = {
  popular: {
    key: "popular",
    path: "/popular-quotes",
    title: `Popular Quotes, Famous Quotes & Classics | ${SITE_NAME}`,
    description:
      "Read popular quotes, famous quotes, and timeless classics in English and Hindi. Browse motivational lines, love quotes, wisdom, and Hindi suvichar on Quotwellix.",
    h1: "Popular Quotes & Famous Lines",
    intro:
      "A free collection of popular quotes and famous lines in English and Hindi — motivational quotes, wisdom, love, and classic suvichar you can browse, share, and save.",
    category: "all",
    language: "all",
  },
  motivation: {
    key: "motivation",
    path: "/motivational-quotes",
    title: `Motivational Quotes & Motivational Lines | English & Hindi | ${SITE_NAME}`,
    description:
      "Read motivational quotes and motivational lines in English and Hindi. Daily inspiration, success quotes, courage quotes, and प्रेरक विचार on Quotwellix.",
    h1: "Motivational Quotes & Lines",
    intro:
      "Motivational quotes and short motivational lines for work, study, and everyday courage — in English and Hindi (प्रेरक विचार, मोटिवेशनल कोट्स).",
    category: "motivation",
    language: "all",
  },
  inspiration: {
    key: "inspiration",
    path: "/inspirational-quotes",
    title: `Inspirational Quotes & Daily Inspiration | ${SITE_NAME}`,
    description:
      "Browse inspirational quotes, hope quotes, and daily inspiration in English and Hindi. Quote of the day, positive lines, and आज का विचार on Quotwellix.",
    h1: "Inspirational Quotes",
    intro:
      "Inspirational quotes and hopeful lines to start the day — positive quotes, peace, faith, and daily inspiration in English and Hindi.",
    category: "hope",
    language: "all",
  },
  hindi: {
    key: "hindi",
    path: "/hindi-quotes",
    title: `Hindi Quotes, सुविचार, शायरी और प्रेरक विचार | ${SITE_NAME}`,
    description:
      "हिंदी कोट्स, सुविचार, शायरी, अनमोल वचन और प्रेरक विचार पढ़ें। Hindi motivational quotes and popular classics on Quotwellix.",
    h1: "Hindi Quotes, सुविचार और शायरी",
    intro:
      "हिंदी कोट्स, सुविचार, शायरी और प्रेरक विचार — popular Hindi quotes and motivational lines you can browse without an account.",
    category: "all",
    language: "hindi",
  },
};

export const SEO_LANDING_PATHS = Object.values(SEO_LANDINGS).map((item) => item.path);
