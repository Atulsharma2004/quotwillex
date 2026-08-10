import { useEffect } from "react";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOGO,
  SITE_NAME,
  SUPPORT_EMAIL,
  absoluteUrl,
  getSiteUrl,
} from "../constants/site";

const ensureMeta = (attr, key, content) => {
  if (content == null || content === "") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const ensureLink = (rel, href) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const setJsonLd = (id, data) => {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  let el = existing;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

/**
 * Updates document head for the active route (SPA-friendly SEO).
 */
const Seo = ({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = "website",
  jsonLd,
}) => {
  useEffect(() => {
    const fullTitle = title?.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const siteUrl = getSiteUrl();
    const url = absoluteUrl(path);
    const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
    const logoUrl = absoluteUrl(SITE_LOGO);
    const indexRobots =
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    ensureMeta("name", "description", description);
    ensureMeta("name", "keywords", SITE_KEYWORDS);
    ensureMeta("name", "author", SITE_NAME);
    ensureMeta("name", "robots", noindex ? "noindex, nofollow" : indexRobots);
    ensureMeta(
      "name",
      "googlebot",
      noindex ? "noindex, nofollow" : indexRobots
    );

    ensureMeta("property", "og:type", type);
    ensureMeta("property", "og:site_name", SITE_NAME);
    ensureMeta("property", "og:title", fullTitle);
    ensureMeta("property", "og:description", description);
    ensureMeta("property", "og:url", url);
    ensureMeta("property", "og:image", imageUrl);
    ensureMeta("property", "og:image:alt", `${SITE_NAME} — ${description.slice(0, 110)}`);
    ensureMeta("property", "og:locale", "en_US");
    ensureMeta("property", "og:locale:alternate", "hi_IN");

    ensureMeta("name", "twitter:card", "summary_large_image");
    ensureMeta("name", "twitter:title", fullTitle);
    ensureMeta("name", "twitter:description", description);
    ensureMeta("name", "twitter:image", imageUrl);
    ensureMeta("name", "twitter:image:alt", SITE_NAME);

    ensureLink("canonical", url);

    const websiteLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "Quotwellix Quotes",
      url: `${siteUrl}/`,
      description: SITE_DESCRIPTION,
      inLanguage: ["en", "hi"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/popular-quotes")}?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const organizationLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: `${siteUrl}/`,
      logo: logoUrl,
      description: SITE_DESCRIPTION,
      email: SUPPORT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        email: SUPPORT_EMAIL,
        contactType: "customer support",
        availableLanguage: ["English", "Hindi"],
      },
    };

    setJsonLd("seo-website-jsonld", websiteLd);
    setJsonLd("seo-organization-jsonld", organizationLd);
    setJsonLd("seo-page-jsonld", jsonLd || null);

    return undefined;
  }, [title, description, path, image, noindex, type, jsonLd]);

  return null;
};

export default Seo;
