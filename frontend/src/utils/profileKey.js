/** Opaque profile URL keys — prefer @username; never put raw ObjectIds in links. */

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const ENCODED_PREFIX = "u.";

const toBase64Url = (bytes) => {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const base64 = padded + pad;
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
};

export const normalizeUsername = (username) =>
  String(username || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

export const encodeProfileId = (id) => {
  const hex = String(id || "").trim();
  if (!OBJECT_ID_RE.test(hex)) return null;
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 12; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return `${ENCODED_PREFIX}${toBase64Url(bytes)}`;
};

export const decodeProfileId = (token) => {
  const raw = String(token || "").trim();
  if (!raw.startsWith(ENCODED_PREFIX)) return null;
  try {
    const bytes = fromBase64Url(raw.slice(ENCODED_PREFIX.length));
    if (bytes.length !== 12) return null;
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
};

export const isObjectIdString = (value) => OBJECT_ID_RE.test(String(value || "").trim());

/**
 * Resolve a URL/API profile key into a lookup descriptor.
 * Supports: @username | username | u.<encoded> | legacy raw ObjectId
 */
export const resolveProfileKey = (key) => {
  const raw = decodeURIComponent(String(key || "").trim());
  if (!raw) return null;

  const withoutAt = raw.replace(/^@+/, "");
  const decoded = decodeProfileId(withoutAt);
  if (decoded) {
    return { type: "id", value: decoded, encoded: true };
  }

  if (isObjectIdString(withoutAt)) {
    return { type: "id", value: withoutAt.toLowerCase(), legacy: true };
  }

  const username = normalizeUsername(withoutAt);
  if (!username) return null;
  return { type: "username", value: username };
};

/** Public frontend path for a user profile. */
export const profilePath = (userOrId, currentUserId) => {
  if (!userOrId) return "/profile";

  if (typeof userOrId === "string") {
    if (currentUserId && userOrId.toString() === currentUserId.toString()) {
      return "/profile";
    }
    const encoded = encodeProfileId(userOrId);
    return encoded ? `/profile/${encoded}` : "/profile";
  }

  const id = userOrId._id?.toString?.() || userOrId.id?.toString?.();
  if (currentUserId && id && id === currentUserId.toString()) {
    return "/profile";
  }

  const username = normalizeUsername(userOrId.username);
  if (username) return `/profile/@${username}`;

  const encoded = encodeProfileId(id);
  return encoded ? `/profile/${encoded}` : "/profile";
};

/** Canonical path after a profile loads (upgrade legacy / encoded → @username). */
export const canonicalProfilePath = (profile, currentUserId) => {
  if (!profile) return "/profile";
  if (
    profile.isOwnProfile ||
    (currentUserId && profile._id?.toString() === currentUserId.toString())
  ) {
    return "/profile";
  }
  return profilePath(profile, currentUserId);
};
