import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const writeSeoStaticFiles = (siteUrl, outDir) => {
  const base = siteUrl.replace(/\/+$/, "");
  const robots = `User-agent: *
Allow: /
Allow: /popular-quotes
Allow: /awards
Allow: /contact
Allow: /guidelines
Allow: /privacy
Allow: /motivational-quotes
Allow: /inspirational-quotes
Allow: /hindi-quotes
Allow: /signup
Allow: /profile/
Allow: /llms.txt

Disallow: /login
Disallow: /auth/
Disallow: /account
Disallow: /profile$
Disallow: /quotes
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email

Sitemap: ${base}/sitemap.xml
`;

  const lastmod = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${base}/popular-quotes</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${base}/motivational-quotes</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${base}/inspirational-quotes</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${base}/hindi-quotes</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${base}/awards</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${base}/contact</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${base}/guidelines</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${base}/privacy</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${base}/signup</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "robots.txt"), robots);
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
};

const seoFilesPlugin = (siteUrl) => ({
  name: "quoteapp-seo-files",
  configResolved() {
    writeSeoStaticFiles(siteUrl, path.resolve(__dirname, "public"));
  },
  closeBundle() {
    writeSeoStaticFiles(siteUrl, path.resolve(__dirname, "dist"));
  },
  transformIndexHtml(html) {
    return html.replaceAll("__SITE_URL__", siteUrl.replace(/\/+$/, ""));
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Production default for build/Vercel. Omit VITE_SITE_URL locally so the
  // app uses window.location.origin for runtime canonicals.
  const siteUrl = (env.VITE_SITE_URL || "https://quotwellix.in").replace(
    /\/+$/,
    ""
  );

  return {
    plugins: [react(), seoFilesPlugin(siteUrl)],
  };
});
