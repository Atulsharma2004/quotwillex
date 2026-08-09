/** Opaque profile URL/API keys — prefer username; encode ObjectIds for fallback. */

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const ENCODED_PREFIX = "u.";

export const normalizeUsername = (username) =>
  String(username || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

export const encodeProfileId = (id) => {
  const hex = String(id || "").trim();
  if (!OBJECT_ID_RE.test(hex)) return null;
  return `${ENCODED_PREFIX}${Buffer.from(hex, "hex").toString("base64url")}`;
};

export const decodeProfileId = (token) => {
  const raw = String(token || "").trim();
  if (!raw.startsWith(ENCODED_PREFIX)) return null;
  try {
    const buf = Buffer.from(raw.slice(ENCODED_PREFIX.length), "base64url");
    if (buf.length !== 12) return null;
    return buf.toString("hex");
  } catch {
    return null;
  }
};

export const isObjectIdString = (value) =>
  OBJECT_ID_RE.test(String(value || "").trim());

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

export const publicProfileKey = (user) => {
  if (!user) return null;
  const username = normalizeUsername(user.username);
  if (username) return `@${username}`;
  return encodeProfileId(user._id) || null;
};
