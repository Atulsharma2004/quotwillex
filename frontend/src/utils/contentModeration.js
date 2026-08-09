import api from "../api/api";

export const moderateText = async (text = "", language = "english") => {
  const response = await api.post("/moderation/check", { text, language });
  return response.data;
};

export const findAbusiveWords = async (text = "", language = "english") => {
  const result = await moderateText(text, language);
  return result.words || [];
};

export const getAbuseRejectionMessage = (words = [], language = "english") => {
  const listed = words.slice(0, 5).join(", ");
  if (language === "hindi") {
    return `यह पोस्ट अपमानजनक / उत्पीड़न वाले शब्दों के कारण ब्लॉक की गई है: ${listed}`;
  }
  return `This post contains abusive or harassing words and cannot be published: ${listed}`;
};
