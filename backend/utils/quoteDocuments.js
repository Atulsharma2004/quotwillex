import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";

export const QUOTE_KIND = {
  COMMUNITY: "community",
  POPULAR: "popular",
};

export const modelForKind = (kind) =>
  kind === QUOTE_KIND.POPULAR ? PopularQuote : Quote;

/**
 * Look up a quote id in either collection (preserves shared like/comment refs).
 */
export const findQuoteDocById = async (id, { lean = false } = {}) => {
  if (!id) return null;

  let query = Quote.findById(id).populate(
    "author",
    "name username profilePicture qotdStars"
  );
  let doc = lean ? await query.lean() : await query;
  if (doc) {
    return {
      doc,
      kind: QUOTE_KIND.COMMUNITY,
      Model: Quote,
      isPopular: false,
    };
  }

  query = PopularQuote.findById(id).populate(
    "author",
    "name username profilePicture qotdStars"
  );
  doc = lean ? await query.lean() : await query;
  if (doc) {
    return {
      doc,
      kind: QUOTE_KIND.POPULAR,
      Model: PopularQuote,
      isPopular: true,
    };
  }

  return null;
};

export const findQuoteDocByIdRaw = async (id) => {
  if (!id) return null;
  let doc = await Quote.findById(id);
  if (doc) {
    return { doc, kind: QUOTE_KIND.COMMUNITY, Model: Quote, isPopular: false };
  }
  doc = await PopularQuote.findById(id);
  if (doc) {
    return { doc, kind: QUOTE_KIND.POPULAR, Model: PopularQuote, isPopular: true };
  }
  return null;
};

/** Attach API-compatible isPopular flag for the frontend. */
export const withQuoteFlags = (doc, isPopular) => {
  if (!doc) return doc;
  const base = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...base,
    isPopular: Boolean(isPopular),
    attributedTo: isPopular ? base.attributedTo || "" : base.attributedTo || "",
    sourceWork: isPopular ? base.sourceWork || "" : "",
  };
};
