/**
 * Generate a large English + Hindi abusive/offensive word list for Node moderation.
 * Target: ~65,000 unique entries (sexual, harassment, hate, Hindi transliterations).
 *
 * Usage: node data/generateAbusiveWordlist.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = 65000;
const OUT = path.join(__dirname, "abusive_words.json");

const BASE_ENGLISH = [
  "fuck", "fucker", "fucking", "motherfucker", "shit", "bullshit", "bitch",
  "bastard", "asshole", "arsehole", "dick", "dickhead", "cock", "pussy",
  "cunt", "slut", "whore", "hoe", "piss", "pissed", "crap", "damn", "bloody",
  "retard", "retarded", "idiot", "moron", "stupid", "dumbass", "jackass",
  "loser", "trash", "scum", "rape", "rapist", "molest", "nigger", "nigga",
  "faggot", "homo", "terrorist", "kill yourself", "go die", "hate you",
  "kys", "shut up bitch", "son of a bitch", "piece of shit", "dumb fuck",
  "fuck you", "fuck off", "screw you", "eat shit", "go to hell",
  "worthless", "ugly bitch", "dirty slut", "fucking idiot", "dumb bitch",
  "shithead", "asswipe", "twat", "wanker", "prick", "bollocks", "bugger",
  "cocksucker", "dipshit", "shitface", "cumdump", "skank", "tramp",
  "pedo", "pedophile", "nazi", "racist pig", "kill him", "kill her",
  "beat her", "beat him", "i will kill you", "i hate you", "die bitch",
  "suck", "sucks", "sucking", "sucker", "suck my", "suck off", "dick suck",
  "penis", "penish", "penus", "peniis", "peen", "dong", "schlong",
  "vagina", "vaginas", "vagin", "pussies",
  "boob", "boobs", "boobie", "boobies", "tit", "tits", "titties", "nipple",
  "nipples", "breast", "breasts",
  "ass", "asses", "butt", "butthole", "anus", "anal", "rectum",
  "balls", "ballsack", "testicle", "testicles", "scrotum",
  "clit", "clitoris", "labia",
  "cum", "cumming", "semen", "sperm", "jizz",
  "blowjob", "handjob", "rimjob", "fellatio", "cunnilingus",
  "masturbate", "masturbation", "jerk off", "jerking off", "jack off",
  "porn", "porno", "pornography", "xxx", "nsfw",
  "nude", "nudes", "naked", "sex", "sexy", "horny", "orgasm", "orgy",
  "dildo", "vibrator", "hentai", "onlyfans",
  "suck my dick", "suck my cock", "lick my", "eat my pussy",
  "slutty", "whorish", "pervert", "perverted", "creep", "creepy",
  "incest", "bestiality", "zoophile", "grooming", "groomer",
  "necrophilia", "snuff", "gore", "torture", "slavery",
  "kill yourself now", "hang yourself", "cut yourself",
  "gas the", "white power", "heil hitler",
  "chink", "spic", "kike", "paki", "towelhead", "camel jockey",
  "tranny", "shemale", "dyke", "lezbo",
  "stfu", "gtfo", "kys now", "die already",
  "rape her", "rape him", "gangbang", "threesome", "creampie",
  "deepthroat", "facefuck", "skullfuck", "cumshot", "bukkake",
  "prostitut", "escort slut", "paid whore", "sugar baby slut",
  "molest child", "child porn", "cp link", "underage sex",
];

const BASE_HINDI = [
  "चूतिया", "चुत", "मादरचोद", "मदरचोद", "भोसड़ी", "भोसडी", "भोसड़ीके",
  "हरामी", "हरामजादा", "हरामजादी", "कमीना", "कमीनी", "रंडी", "रन्डी",
  "बेवकूफ", "गधा", "सुअर", "कुत्ता", "कुतिया", "बहनचोद", "बहन के लौड़े",
  "माँ चोद", "मां चोद", "तेरी माँ", "तेरी बहन", "लौड़ा", "लंड", "गांड",
  "गांडू", "भड़वा", "चूत", "चूतड़ी", "साला", "साली", "कुतते",
  "मादरचोद के", "भोसड़ी के", "लौड़े", "लौडा", "चूत मार", "गांड मर",
  "madarchod", "madarchodh", "behenchod", "bhenchod", "bhosdike", "bhosdi",
  "chutia", "chutiya", "harami", "haramzada", "haramzadi", "randi",
  "gaandu", "gandu", "gand", "lavde", "laude", "loda", "lode", "saala",
  "sala", "sali", "kutte", "kutti", "kamina", "kamini", "bewakoof", "suar",
  "bhadwa", "bhadwe", "teri maa", "teri behen", "maa chod", "behen chod",
  "madar chod", "lund", "lawde", "bhosada", "bhosda", "chut ke",
  "gand mara", "gand masti", "tu chutiya hai", "haraami kahi ka",
  "randi rona", "saale kutte", "teri maa ki", "maa ki aankh",
  "bsdk", "mc", "bc", "bkl", "chutiyapa", "lundchoos", "gaand maar",
  "teri bahan", "maa ki chut", "behen ki chut", "randi ke bacche",
  "harami kahi ke", "kaminey", "saali randi", "chodu", "chodne",
];

const SUFFIXES_EN = [
  "", "s", "er", "ers", "ing", "ed", "y", "ish", "head", "face", "hole",
  "bag", "wad", "stain", "lord", "fest",
];

const PREFIXES_EN = [
  "", "super", "mega", "ultra", "dumb", "fucking", "bloody", "damn",
  "little", "big", "nasty", "dirty", "sick",
];

const FILLERS = [
  "you", "u", "tu", "tera", "teri", "your", "bloody", "damn", "stupid",
  "dumb", "fucking", "ugly", "dirty", "nasty", "little", "useless",
];

const HI_FILLERS = [
  "hai", "ho", "kahi ka", "kahi ke", "sali", "saale", "sala", "kutte",
  "randi", "bc", "mc",
];

const LEET = {
  a: ["a", "@", "4"],
  e: ["e", "3"],
  i: ["i", "1", "!"],
  o: ["o", "0"],
  s: ["s", "$", "5"],
  t: ["t", "7"],
};

const normalizeEntry = (w) =>
  String(w || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const leetVariants = (word, limit = 8) => {
  const variants = new Set([word]);
  if (word.includes(" ") || !/^[\x00-\x7F]+$/.test(word)) return variants;

  const chars = [...word];
  const replaceable = [];
  chars.forEach((c, i) => {
    if (LEET[c]) replaceable.push([i, LEET[c]]);
  });

  for (const [idx, options] of replaceable.slice(0, 5)) {
    const current = [...variants];
    for (const base of current) {
      if (variants.size >= limit) return variants;
      const arr = [...base];
      if (idx >= arr.length) continue;
      for (const opt of options) {
        arr[idx] = opt;
        variants.add(arr.join(""));
        if (variants.size >= limit) return variants;
      }
    }
  }
  return variants;
};

const spacedVariant = (word) => {
  if (word.includes(" ") || word.length < 4 || !/^[\x00-\x7F]+$/.test(word)) {
    return [];
  }
  return [word.split("").join(" ")];
};

const buildWordlist = (target = TARGET) => {
  const words = new Set();

  for (const w of [...BASE_ENGLISH, ...BASE_HINDI]) {
    const c = normalizeEntry(w);
    if (c) words.add(c);
  }

  for (const base of BASE_ENGLISH) {
    const b = normalizeEntry(base);
    if (!b) continue;
    if (b.includes(" ")) {
      words.add(b);
      words.add(b.replace(/ /g, "-"));
      words.add(b.replace(/ /g, ""));
      continue;
    }
    for (const pre of PREFIXES_EN) {
      for (const suf of SUFFIXES_EN) {
        const candidate = normalizeEntry(`${pre}${b}${suf}`);
        if (!candidate || candidate.length < 2) continue;
        words.add(candidate);
        for (const v of leetVariants(candidate, 6)) words.add(v);
      }
    }
    for (const v of spacedVariant(b)) words.add(v);
  }

  for (const base of BASE_HINDI) {
    const b = normalizeEntry(base);
    if (!b) continue;
    words.add(b);
    if (!/^[\x00-\x7F]+$/.test(b)) continue;
    words.add(b.replace(/ /g, ""));
    words.add(b.replace(/ /g, "-"));
    for (const suf of ["", "a", "e", "i", "ya", "ke", "ki", "ka", "on", "ein"]) {
      words.add(normalizeEntry(`${b}${suf}`));
    }
    for (const v of leetVariants(b.replace(/ /g, ""), 8)) words.add(v);
  }

  const shortEn = BASE_ENGLISH.map(normalizeEntry).filter((w) => w && !w.includes(" ")).slice(0, 80);
  const shortHi = BASE_HINDI.map(normalizeEntry).filter(
    (w) => w && /^[\x00-\x7F]+$/.test(w) && !w.includes(" ")
  ).slice(0, 60);

  outerEn: for (const a of shortEn) {
    for (const b of FILLERS) {
      words.add(`${a} ${b}`);
      words.add(`${b} ${a}`);
      words.add(`${a}-${b}`);
      if (words.size >= target) break outerEn;
    }
  }

  outerHi: for (const a of shortHi) {
    for (const b of HI_FILLERS) {
      words.add(`${a} ${b}`);
      words.add(`${b} ${a}`);
      if (words.size >= target) break outerHi;
    }
  }

  // Cross pairs among offensive seeds for more coverage
  const seeds = shortEn.slice(0, 50);
  outerPair: for (let i = 0; i < seeds.length; i += 1) {
    for (let j = 0; j < seeds.length; j += 1) {
      if (i === j) continue;
      words.add(`${seeds[i]} ${seeds[j]}`);
      if (words.size >= target) break outerPair;
    }
  }

  // Numbered obfuscations last (lower priority filler).
  const seed = [...words];
  let n = 0;
  while (words.size < target + 5000 && seed.length) {
    const base = seed[n % seed.length];
    if (/^[\x00-\x7F]+$/.test(base) && !base.includes(" ") && !/\d/.test(base)) {
      words.add(`${base}${n % 97}`);
      words.add(`${base}_${n % 97}`);
      words.add(`${base}x${n % 40}`);
      words.add(`x${base}${n % 40}`);
    }
    n += 1;
    if (n > target * 4) break;
  }

  const coreBases = new Set(
    [...BASE_ENGLISH, ...BASE_HINDI].map(normalizeEntry).filter(Boolean)
  );

  const all = [...words]
    .map(normalizeEntry)
    .filter((w) => w && w.length >= 2 && w.length <= 48);

  const rank = (w) => {
    if (coreBases.has(w)) return 0;
    if (!/^[\x00-\x7F]+$/.test(w)) return 1; // Hindi script first-class
    if (w.includes(" ")) return 2;
    if (/\d|_/.test(w)) return 4; // numbered filler last
    return 3;
  };

  all.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  // Prefer quality entries; fill to target with obfuscations if needed.
  return all.slice(0, Math.min(Math.max(target, 60000), 70000));
};

const words = buildWordlist(TARGET);
if (words.length < 60000) {
  console.error(`Generated only ${words.length} words; expected >= 60000`);
  process.exit(1);
}

const payload = {
  count: words.length,
  languages: ["english", "hindi"],
  generatedAt: new Date().toISOString(),
  words,
};

fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
console.log(`Wrote ${payload.count} words to ${OUT}`);
