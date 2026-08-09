/**
 * Shared pagination + query helpers for high-concurrency list endpoints.
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

export const parsePagination = (query = {}, defaults = {}) => {
  const page = Math.max(
    1,
    parseInt(query.page ?? defaults.page ?? DEFAULT_PAGE, 10) || DEFAULT_PAGE
  );
  const rawLimit = parseInt(
    query.limit ?? defaults.limit ?? DEFAULT_LIMIT,
    10
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginationMeta = (total, page, limit) => {
  const safeTotal = Math.max(0, total || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit) || 1);
  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const paginatedResponse = (itemsKey, items, total, page, limit) => ({
  [itemsKey]: items,
  ...paginationMeta(total, page, limit),
});

/** Inclusive local/UTC day range from YYYY-MM-DD strings. */
export const buildDateRangeFilter = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return null;
  const range = {};
  if (dateFrom) {
    const start = new Date(`${dateFrom}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (dateTo) {
    const end = new Date(`${dateTo}T23:59:59.999Z`);
    if (!Number.isNaN(end.getTime())) range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
