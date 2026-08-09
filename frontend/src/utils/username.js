export const USERNAME_REGEX = /^[a-zA-Z0-9@_-]+$/;

export const validateUsernameFormat = (username) => {
  const value = String(username || "").trim();
  if (!value) {
    return { valid: false, message: "User ID is required" };
  }
  if (value.length < 3) {
    return { valid: false, message: "User ID must be at least 3 characters" };
  }
  if (value.length > 30) {
    return { valid: false, message: "User ID must be at most 30 characters" };
  }
  if (!USERNAME_REGEX.test(value)) {
    return {
      valid: false,
      message: "Only letters, numbers, and @ - _ are allowed",
    };
  }
  return { valid: true, message: "" };
};

export const formatUserId = (username) => {
  if (!username) return "";
  return username;
};

export const dedupeUsersById = (list = []) => {
  const seen = new Set();
  return list.filter((item) => {
    if (!item) return false;
    const id = (item._id || item).toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};
