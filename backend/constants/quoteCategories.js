export const QUOTE_CATEGORIES = [
  "motivation",
  "wisdom",
  "love",
  "success",
  "emotional",
  "sad",
  "happiness",
  "life",
  "friendship",
  "humor",
  "truth",
  "courage",
  "patriotism",
  "peace",
  "ethics",
  "hope",
  "faith",
  "nature",
];

export const OTHER_CATEGORY_VALUE = "other";

export const isKnownCategory = (value) =>
  QUOTE_CATEGORIES.includes(String(value || "").trim().toLowerCase());

export const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 40);
