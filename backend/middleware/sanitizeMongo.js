/**
 * Strip MongoDB operator / prototype-pollution keys from request payloads
 * to reduce NoSQL injection risk (this app uses MongoDB, not SQL).
 *
 * Returns a cleaned plain object; does not keep prototype chains.
 */

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(value instanceof RegExp) &&
  !(typeof Buffer !== "undefined" && Buffer.isBuffer?.(value));

const scrubValue = (value, depth = 0) => {
  if (depth > 6) return undefined;
  if (value == null) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => scrubValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (!isPlainObject(value)) {
    // Do not allow unexpected object types into query filters.
    return undefined;
  }

  const out = Object.create(null);
  for (const key of Object.keys(value)) {
    if (
      FORBIDDEN_KEYS.has(key) ||
      key.startsWith("$") ||
      key.includes(".")
    ) {
      continue;
    }
    const cleaned = scrubValue(value[key], depth + 1);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
};

const assignClean = (target, cleaned) => {
  if (!target || typeof target !== "object") return cleaned;
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  if (cleaned && typeof cleaned === "object") {
    Object.assign(target, cleaned);
  }
  return target;
};

export const sanitizeMongoInput = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    const cleaned = scrubValue(req.body);
    req.body = cleaned && typeof cleaned === "object" ? cleaned : {};
  }

  // Express may expose query as a mutable object; scrub in place + replace when possible.
  if (req.query && typeof req.query === "object") {
    const cleaned = scrubValue(req.query) || {};
    try {
      req.query = cleaned;
    } catch {
      assignClean(req.query, cleaned);
    }
  }

  if (req.params && typeof req.params === "object") {
    const cleaned = scrubValue(req.params) || {};
    assignClean(req.params, cleaned);
  }

  next();
};
