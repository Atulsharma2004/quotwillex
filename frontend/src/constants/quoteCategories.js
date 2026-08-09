import { categoryLabel } from "./quoteUi";

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

export { categoryLabel };

/** Exact match, or custom category text containing the filter label/value. */
export const matchesCategoryFilter = (quoteCategory, filterValue) => {
  if (!filterValue || filterValue === "all") return true;

  const cat = String(quoteCategory || "").trim().toLowerCase();
  const filter = String(filterValue).trim().toLowerCase();
  if (!cat) return false;
  if (cat === filter) return true;

  const enLabel = categoryLabel(filter, "english").toLowerCase();
  const hiLabel = categoryLabel(filter, "hindi").toLowerCase();

  return (
    cat.includes(filter) ||
    (enLabel && cat.includes(enLabel)) ||
    (hiLabel && cat.includes(hiLabel))
  );
};
