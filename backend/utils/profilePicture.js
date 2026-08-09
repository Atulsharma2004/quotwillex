const DEFAULT_AVATAR = "/default-avatar.svg";
const MAX_DATA_URL_CHARS = 700_000; // ~500KB binary after base64
const MAX_SVG_DATA_URL_CHARS = 8_000;

const isDefaultAvatar = (value) => {
  const raw = String(value || "").trim();
  return !raw || raw === DEFAULT_AVATAR || raw === "/default-avatar.svg";
};

/** Stable HSL color from email so the same address always gets the same avatar. */
const colorFromEmail = (email) => {
  let hash = 0;
  const s = String(email || "user").toLowerCase();
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return {
    bg: `hsl(${hue} 42% 36%)`,
    fg: "#f8fafc",
  };
};

const initialsFromEmail = (email, name = "") => {
  const named = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (named.length >= 2) {
    return `${named[0][0]}${named[1][0]}`.toUpperCase();
  }
  if (named.length === 1 && named[0].length >= 2) {
    return named[0].slice(0, 2).toUpperCase();
  }
  const local = String(email || "u")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "");
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return (local[0] || "U").toUpperCase();
};

/**
 * Default avatar derived from the user's email (and optional display name).
 * Stored as a small SVG data URL — no external image host required.
 */
export const buildEmailAvatar = (email, name = "") => {
  const initials = initialsFromEmail(email, name);
  const { bg, fg } = colorFromEmail(email);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${bg}"/>
  <text x="64" y="64" dy="0.36em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="650" fill="${fg}">${initials}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

/**
 * Allow only safe avatar values: default path, same-origin relative path,
 * data:image URLs under size cap, or Google avatar CDN.
 */
export const sanitizeProfilePicture = (value) => {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || value === "") {
    return { ok: true, value: DEFAULT_AVATAR };
  }

  const raw = String(value).trim();
  if (!raw) return { ok: true, value: DEFAULT_AVATAR };

  if (raw === DEFAULT_AVATAR || raw === "/default-avatar.svg") {
    return { ok: true, value: DEFAULT_AVATAR };
  }

  // Relative public asset only (no protocol-relative //evil.com)
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    if (raw.length > 200 || /[<>"']/.test(raw)) {
      return { ok: false, error: "Invalid profile picture path" };
    }
    return { ok: true, value: raw };
  }

  const rasterMatch = raw.match(
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i
  );
  if (rasterMatch) {
    if (raw.length > MAX_DATA_URL_CHARS) {
      return {
        ok: false,
        error: "Profile picture is too large (max ~500KB)",
      };
    }
    return { ok: true, value: raw.replace(/\s+/g, "") };
  }

  const svgMatch = raw.match(
    /^data:image\/svg\+xml;base64,([A-Za-z0-9+/=\s]+)$/i
  );
  if (svgMatch) {
    if (raw.length > MAX_SVG_DATA_URL_CHARS) {
      return { ok: false, error: "Invalid profile picture" };
    }
    return { ok: true, value: raw.replace(/\s+/g, "") };
  }

  // Google OAuth avatar CDN only (blocks arbitrary remote SSRF/XSS via img src)
  try {
    const url = new URL(raw);
    if (
      url.protocol === "https:" &&
      (url.hostname === "lh3.googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com"))
    ) {
      if (raw.length > 500) {
        return { ok: false, error: "Invalid profile picture URL" };
      }
      return { ok: true, value: url.toString() };
    }
  } catch {
    // not a URL
  }

  return {
    ok: false,
    error:
      "Profile picture must be an uploaded image or the default avatar (external URLs are not allowed)",
  };
};

/**
 * Prefer Google profile photo; otherwise email-based default avatar.
 */
export const resolveOAuthProfilePicture = (picture, email, name = "") => {
  const fromGoogle = sanitizeProfilePicture(picture);
  if (
    fromGoogle.ok &&
    fromGoogle.value &&
    !isDefaultAvatar(fromGoogle.value)
  ) {
    return fromGoogle.value;
  }
  return buildEmailAvatar(email, name);
};

export { DEFAULT_AVATAR, isDefaultAvatar };
