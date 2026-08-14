/** Shared date/time helpers for posts, comments, profiles. */

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Relative label: "just now", "5m ago", "2h ago", "3d ago". */
export const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 0) return "just now";
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const amount = Math.floor(seconds / secs);
    if (amount >= 1) return `${amount}${label} ago`;
  }
  return `${seconds}s ago`;
};

/** Full local date + time, e.g. "15 Aug 2026, 3:45 pm". */
export const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** Date only, e.g. "15 Aug 2026". */
export const formatDate = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

/** Month + year for profile join, e.g. "Aug 2026". */
export const formatMonthYear = (value) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

/**
 * Post/comment stamp: date+time visible, relative in tooltip.
 * Returns { label, title } for rendering.
 */
export const formatPostStamp = (value) => {
  const date = toDate(value);
  if (!date) return { label: "", title: "" };
  const absolute = formatDateTime(date);
  const relative = formatRelativeTime(date);
  return {
    label: absolute,
    title: relative,
    absolute,
    relative,
  };
};
