/** Local calendar day key YYYY-MM-DD from a Date or ISO string. */
export const toLocalDayKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Filter by optional inclusive calendar range (YYYY-MM-DD from <input type="date">).
 */
export const matchesDateFilter = (createdAt, dateFrom = "", dateTo = "") => {
  if (!dateFrom && !dateTo) return true;
  const dayKey = toLocalDayKey(createdAt);
  if (!dayKey) return false;
  if (dateFrom && dayKey < dateFrom) return false;
  if (dateTo && dayKey > dateTo) return false;
  return true;
};
