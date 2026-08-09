/**
 * Node-only content moderation.
 * Loads a large wordlist once into Sets — O(tokens) checks, no Python, no per-request network.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDLIST_PATH = path.join(__dirname, "../data/abusive_words.json");
const MAX_TEXT_CHARS = 4000;
const MAX_HITS = 8;

let ready = false;
/** @type {Set<string>} */
let singleTokens = new Set();
/** @type {Set<string>} */
let phraseSet = new Set();
/** @type {string[]} non-latin (e.g. Devanagari) tokens — kept small */
let nonLatin = [];

const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[_*~`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

const isAsciiWord = (w) => /^[\x00-\x7F]+$/.test(w);

const loadWordlist = () => {
  if (ready) return;

  let words = [];
  try {
    const raw = fs.readFileSync(WORDLIST_PATH, "utf8");
    const data = JSON.parse(raw);
    words = Array.isArray(data.words) ? data.words : [];
  } catch {
    words = [
      "fuck",
      "shit",
      "bitch",
      "madarchod",
      "chutiya",
      "behenchod",
      "rape",
      "porn",
    ];
  }

  const singles = new Set();
  const phrases = new Set();
  const nonLatinSet = new Set();

  for (const raw of words) {
    const w = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!w || w.length < 2 || w.length > 64) continue;

    if (!isAsciiWord(w)) {
      // Cap non-latin entries to avoid slow substring scans.
      if (nonLatinSet.size < 4000) nonLatinSet.add(w);
      continue;
    }

    if (w.includes(" ")) {
      phrases.add(w);
      const collapsed = w.replace(/ /g, "");
      if (collapsed.length >= 3) singles.add(collapsed);
      continue;
    }

    singles.add(w);
  }

  singleTokens = singles;
  phraseSet = phrases;
  nonLatin = [...nonLatinSet];
  ready = true;
};

/** Ensure indexes exist (call once at boot or lazily). */
export const warmModeration = () => {
  loadWordlist();
  return {
    singles: singleTokens.size,
    phrases: phraseSet.size,
    nonLatin: nonLatin.length,
  };
};

export const getAbuseRejectionMessage = (words = [], language = "english") => {
  const listed = words.slice(0, 5).join(", ");
  if (language === "hindi") {
    return `यह पोस्ट अपमानजनक / उत्पीड़न वाले शब्दों के कारण ब्लॉक की गई है: ${listed}`;
  }
  return `This post contains abusive or harassing words and cannot be published: ${listed}`;
};

/**
 * Fast local scan: token + bigram/trigram Set lookups (no giant regex list).
 */
export const findAbusiveWordsLocal = (text = "") => {
  loadWordlist();
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const found = [];
  const seen = new Set();
  const push = (word) => {
    if (!word || seen.has(word)) return;
    seen.add(word);
    found.push(word);
  };

  const tokens = normalized.match(/[a-z0-9@$!]+/gi) || [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i].toLowerCase();
    if (t.length >= 2 && singleTokens.has(t)) push(t);

    if (i + 1 < tokens.length) {
      const bi = `${t} ${tokens[i + 1].toLowerCase()}`;
      if (phraseSet.has(bi)) push(bi);
    }
    if (i + 2 < tokens.length) {
      const tri = `${t} ${tokens[i + 1].toLowerCase()} ${tokens[i + 2].toLowerCase()}`;
      if (phraseSet.has(tri)) push(tri);
    }

    if (found.length >= MAX_HITS) return found;
  }

  // Spaced obfuscation like "f u c k" → collapse short adjacent letters.
  if (tokens.length >= 3 && tokens.length <= 16) {
    const collapsed = tokens.map((t) => t.toLowerCase()).join("");
    if (collapsed.length >= 3 && singleTokens.has(collapsed)) push(collapsed);
  }

  if (found.length >= MAX_HITS) return found;

  for (const word of nonLatin) {
    if (normalized.includes(word)) push(word);
    if (found.length >= MAX_HITS) return found;
  }

  return found;
};

export const containsAbusiveContent = (text = "") =>
  findAbusiveWordsLocal(text).length > 0;

/**
 * Node-only moderation API (async for call-site compatibility).
 */
export const moderateText = async (text = "", language = "english") => {
  const words = findAbusiveWordsLocal(text);
  const blocked = words.length > 0;
  return {
    allowed: !blocked,
    blocked,
    words,
    message: blocked ? getAbuseRejectionMessage(words, language) : "",
    source: "node",
  };
};

export default {
  warmModeration,
  moderateText,
  findAbusiveWordsLocal,
  containsAbusiveContent,
  getAbuseRejectionMessage,
};
