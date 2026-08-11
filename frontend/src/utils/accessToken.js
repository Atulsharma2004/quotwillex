/** Client-side JWT helpers (expiry UX only — server still verifies). */

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const parseJwtPayload = (token) => {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/** True if token exists and exp is still in the future (5s skew). */
export const isAccessTokenValid = (token) => {
  if (!token || typeof token !== "string") return false;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() < payload.exp * 1000 - 5000;
};

export const getValidStoredToken = () => {
  const token = localStorage.getItem("token");
  if (isAccessTokenValid(token)) return token;
  if (token) clearAuthStorage();
  return null;
};

export { clearAuthStorage };
