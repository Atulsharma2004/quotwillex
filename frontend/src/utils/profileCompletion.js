/** Shared post-auth navigation helpers */

export const isPrivateProfileIncomplete = (user = {}) => {
  const mobile = String(user.mobileNumber || "").trim();
  const city = String(user.city || "").trim();
  const state = String(user.state || "").trim();
  const country = String(user.country || "").trim();
  const hasDob = Boolean(user.dateOfBirth);
  return !mobile || !hasDob || !city || !state || !country;
};

export const hasMissingSignupExtras = (form = {}) =>
  !String(form.mobileNumber || "").trim() ||
  !String(form.dateOfBirth || "").trim() ||
  !String(form.city || "").trim() ||
  !String(form.state || "").trim() ||
  !String(form.country || "").trim();

/**
 * Where to send the user after login / OAuth / complete signup.
 * Only username setup is a hard gate — private details are optional.
 */
export const postAuthPath = (user, fallback = "/") => {
  if (!user) return "/login";
  if (!user.username || user.needsUsername) return "/profile?setup=1";
  return fallback || "/";
};

export const COMPLETE_PROFILE_FLAG = "quotwellix_complete_profile";
export const COMPLETE_PROFILE_DISMISSED = "quotwellix_complete_dismissed";
