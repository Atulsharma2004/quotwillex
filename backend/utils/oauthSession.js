import crypto from "crypto";

/** Short-lived OAuth login codes (one-time JWT exchange). */
const oauthCodes = new Map();
const oauthStates = new Map();

const CODE_TTL_MS = 2 * 60 * 1000;
const STATE_TTL_MS = 10 * 60 * 1000;

const pruneMap = (map, now = Date.now()) => {
  for (const [key, entry] of map.entries()) {
    if (entry.expiresAt <= now) map.delete(key);
  }
};

export const createOAuthState = () => {
  pruneMap(oauthStates);
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, { expiresAt: Date.now() + STATE_TTL_MS });
  return state;
};

export const consumeOAuthState = (state) => {
  if (!state) return false;
  pruneMap(oauthStates);
  const entry = oauthStates.get(String(state));
  if (!entry) return false;
  oauthStates.delete(String(state));
  return entry.expiresAt > Date.now();
};

export const createLoginCode = (token) => {
  pruneMap(oauthCodes);
  const code = crypto.randomBytes(32).toString("hex");
  oauthCodes.set(code, {
    token,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
};

export const consumeLoginCode = (code) => {
  if (!code) return null;
  pruneMap(oauthCodes);
  const entry = oauthCodes.get(String(code));
  if (!entry) return null;
  oauthCodes.delete(String(code));
  if (entry.expiresAt <= Date.now()) return null;
  return entry.token;
};
