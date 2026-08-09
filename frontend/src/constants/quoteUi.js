export const QUOTE_LANGUAGES = [
  { value: "english", labelEn: "English", labelHi: "अंग्रेज़ी" },
  { value: "hindi", labelEn: "Hindi", labelHi: "हिंदी" },
];

const CATEGORY_LABELS_EN = {
  motivation: "Motivation",
  wisdom: "Wisdom",
  love: "Love",
  success: "Success",
  emotional: "Emotional",
  sad: "Sad",
  happiness: "Happiness",
  life: "Life",
  friendship: "Friendship",
  humor: "Humor",
  truth: "Truth",
  courage: "Courage",
  patriotism: "Patriotism",
  peace: "Peace",
  ethics: "Ethics",
  hope: "Hope",
  faith: "Faith",
  nature: "Nature",
};

const CATEGORY_LABELS_HI = {
  motivation: "प्रेरणा",
  wisdom: "ज्ञान",
  love: "प्रेम",
  success: "सफलता",
  emotional: "भावनात्मक",
  sad: "दुख",
  happiness: "खुशी",
  life: "जीवन",
  friendship: "मित्रता",
  humor: "हास्य",
  truth: "सत्य",
  courage: "साहस",
  patriotism: "देशभक्ति",
  peace: "शांति",
  ethics: "नीति",
  hope: "आशा",
  faith: "विश्वास",
  nature: "प्रकृति",
};

export const categoryLabel = (value, language = "english") => {
  if (!value) return "";
  if (language === "hindi") {
    return CATEGORY_LABELS_HI[value] || value;
  }
  return CATEGORY_LABELS_EN[value] || value.charAt(0).toUpperCase() + value.slice(1);
};

export const languageLabel = (value, uiLanguage = "english") => {
  const found = QUOTE_LANGUAGES.find((item) => item.value === value);
  if (!found) return value;
  return uiLanguage === "hindi" ? found.labelHi : found.labelEn;
};

const SORT_OPTIONS = {
  english: [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "mostLiked", label: "Most liked" },
    { value: "mostCommented", label: "Most commented" },
  ],
  hindi: [
    { value: "newest", label: "नए पहले" },
    { value: "oldest", label: "पुराने पहले" },
    { value: "mostLiked", label: "सबसे ज्यादा लाइक" },
    { value: "mostCommented", label: "सबसे ज्यादा कमेंट" },
  ],
};

export const sortOptions = (language = "english") =>
  SORT_OPTIONS[language === "hindi" ? "hindi" : "english"];

const UI = {
  english: {
    shareTitle: "Share a thought",
    shareSubtitle: "Add a quote to inspire someone today.",
    quotePlaceholder: "What words are on your mind?",
    chooseCategory: "Choose a category",
    categoryOptional: "Category (optional)",
    otherCategory: "Other",
    customCategoryPlaceholder: "Write your own category...",
    quoteLanguage: "Quote language",
    postQuote: "Post quote",
    publishTitle: "Publish a popular quote",
    popularQuotePlaceholder: "Enter the quote...",
    attributedTo: "Attributed to (required)",
    sourceWork: "Work / source (optional)",
    publishQuote: "Publish quote",
    editQuoteText: "Edit quote text",
    editCategory: "Edit quote category",
    editSourceWork: "Edit source work",
    editLanguage: "Edit quote language",
    english: "English",
    hindi: "Hindi",
    comment: "Comment",
    comments: "Comments",
    shareThoughts: "Share your thoughts...",
    postComment: "Post comment",
    noComments: "No comments yet — be the first to say something! ✨",
    loadMoreComments: "Load more comments",
    exploreQuotes: "Explore quotes",
    explorePopularQuotes: "Explore popular quotes",
    clearFilters: "Clear",
    searchQuotesPeople: "Search quotes or people...",
    searchPopular: "Search quotes or famous people...",
    allLanguages: "All languages",
    allCategories: "All categories",
    sortQuotes: "Sort quotes",
    filterByLanguage: "Filter by language",
    filterByCategory: "Filter by category",
    filterByDateFrom: "From date",
    filterByDateTo: "To date",
    showingRange: (from, to, total) => `Showing ${from}–${to} of ${total} quotes`,
    showingPopular: (matched, total) =>
      `Showing ${matched} of ${total} popular quotes`,
    noMatch: "No quotes match your search or filters.",
    noPopularMatch: "No popular quotes match your search or filters.",
    noQuotesYet: "Be the first to share a quote in this feed.",
  },
  hindi: {
    shareTitle: "अपना विचार शेयर करें",
    shareSubtitle: "आज किसी को प्रेरित करने के लिए एक क्वोट ऐड करें।",
    quotePlaceholder: "आपके मन में कौन से शब्द हैं?",
    chooseCategory: "श्रेणी चुनें",
    categoryOptional: "श्रेणी (वैकल्पिक)",
    otherCategory: "अन्य",
    customCategoryPlaceholder: "अपनी श्रेणी लिखें...",
    quoteLanguage: "क्वोट लैंग्वेज",
    postQuote: "क्वोट पोस्ट करें",
    publishTitle: "पॉपुलर क्वोट पब्लिश करें",
    popularQuotePlaceholder: "क्वोट लिखें...",
    attributedTo: "लेखक का नाम (ज़रूरी)",
    sourceWork: "कृति / स्रोत (वैकल्पिक)",
    publishQuote: "क्वोट पब्लिश करें",
    editQuoteText: "क्वोट एडिट करें",
    editCategory: "श्रेणी एडिट करें",
    editSourceWork: "कृति / स्रोत एडिट करें",
    editLanguage: "लैंग्वेज एडिट करें",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    comment: "कमेंट",
    comments: "कमेंट्स",
    shareThoughts: "अपना विचार शेयर करें...",
    postComment: "कमेंट पोस्ट करें",
    noComments: "अभी कोई कमेंट नहीं — पहले आप लिखें! ✨",
    loadMoreComments: "और कमेंट्स देखें",
    exploreQuotes: "क्वोट्स एक्सप्लोर करें",
    explorePopularQuotes: "पॉपुलर क्वोट्स एक्सप्लोर करें",
    clearFilters: "क्लियर",
    searchQuotesPeople: "क्वोट्स या लोग सर्च करें...",
    searchPopular: "क्वोट्स या प्रसिद्ध लोग सर्च करें...",
    allLanguages: "सभी लैंग्वेज",
    allCategories: "सभी श्रेणियाँ",
    sortQuotes: "क्वोट्स सॉर्ट करें",
    filterByLanguage: "लैंग्वेज से फिल्टर",
    filterByCategory: "श्रेणी से फिल्टर",
    filterByDateFrom: "तारीख से",
    filterByDateTo: "तारीख तक",
    showingRange: (from, to, total) =>
      `${total} में से ${from}–${to} क्वोट्स दिखा रहे हैं`,
    showingPopular: (matched, total) =>
      `${total} में से ${matched} पॉपुलर क्वोट्स दिखा रहे हैं`,
    noMatch: "आपके सर्च या फिल्टर से कोई क्वोट मैच नहीं हुआ।",
    noPopularMatch: "आपके सर्च या फिल्टर से कोई पॉपुलर क्वोट मैच नहीं हुआ।",
    noQuotesYet: "इस फीड में पहली क्वोट आप शेयर करें।",
  },
};

export const quoteUi = (language = "english") =>
  UI[language === "hindi" ? "hindi" : "english"];
