import api from "../../api/api";

const normalizeListPayload = (data, key = "quotes") => {
  if (Array.isArray(data)) {
    return {
      quotes: data,
      page: 1,
      limit: data.length || 10,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }
  return {
    quotes: data?.[key] || data?.quotes || [],
    page: data?.page || 1,
    limit: data?.limit || 10,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    hasNextPage: Boolean(data?.hasNextPage),
    hasPrevPage: Boolean(data?.hasPrevPage),
  };
};

const getQuotes = async (params = {}) => {
  const response = await api.get("/quotes/", { params });
  return normalizeListPayload(response.data);
};

const createQuote = async (text, category = "", language = "english") => {
  const response = await api.post("/quotes/", { text, category, language });
  return response.data;
};

const getPopularQuotes = async (params = {}) => {
  const response = await api.get("/quotes/popular", { params });
  return normalizeListPayload(response.data);
};

const getGuestQuotes = async (params = {}) => {
  const response = await api.get("/quotes/guest", { params });
  return normalizeListPayload(response.data);
};

const createPopularQuote = async (
  text,
  attributedTo,
  sourceWork = "",
  category = "",
  language = "english"
) => {
  const response = await api.post("/quotes/popular", {
    text,
    attributedTo,
    sourceWork,
    category,
    language,
  });
  return response.data;
};

const updateQuote = async (
  id,
  text,
  category = "",
  language = undefined,
  sourceWork = undefined
) => {
  const response = await api.put(`/quotes/${id}`, {
    text,
    category,
    ...(language !== undefined ? { language } : {}),
    ...(sourceWork !== undefined ? { sourceWork } : {}),
  });
  return response.data;
};

const deleteQuote = async (id) => {
  await api.delete(`/quotes/${id}`);
  return { id };
};

const likeQuote = async (id) => {
  const response = await api.put(`/quotes/${id}/like`, {});
  return response.data;
};

const dislikeQuote = async (id) => {
  const response = await api.put(`/quotes/${id}/dislike`, {});
  return response.data;
};

const commentQuote = async (id, text) => {
  const response = await api.put(`/quotes/${id}/comment`, { text });
  return response.data;
};

const editComment = async (quoteId, commentId, text) => {
  const response = await api.put(`/quotes/${quoteId}/comment/${commentId}`, {
    text,
  });
  return response.data;
};

const deleteComment = async (quoteId, commentId) => {
  const response = await api.delete(
    `/quotes/${quoteId}/comment/${commentId}`
  );
  return {
    quoteId,
    commentId,
    updatedQuote: response.data.updatedQuote,
  };
};

const getQuoteOfTheDay = async () => {
  const response = await api.get("/quotes/quote-of-the-day");
  return response.data;
};

const getHomeShowcase = async () => {
  const response = await api.get("/quotes/showcase");
  return response.data;
};

const getAwardsLeaderboard = async () => {
  const response = await api.get("/quotes/awards");
  return response.data;
};

const getFollowers = async (userId, params = {}) => {
  const path = userId
    ? `/users/${encodeURIComponent(String(userId).trim())}/followers`
    : "/users/profile/followers";
  const response = await api.get(path, { params });
  const data = response.data;
  if (Array.isArray(data)) {
    return { users: data, page: 1, total: data.length, totalPages: 1 };
  }
  return data;
};

const getFollowing = async (userId, params = {}) => {
  const path = userId
    ? `/users/${encodeURIComponent(String(userId).trim())}/following`
    : "/users/profile/following";
  const response = await api.get(path, { params });
  const data = response.data;
  if (Array.isArray(data)) {
    return { users: data, page: 1, total: data.length, totalPages: 1 };
  }
  return data;
};

export default {
  getQuotes,
  getPopularQuotes,
  getGuestQuotes,
  getQuoteOfTheDay,
  getHomeShowcase,
  getAwardsLeaderboard,
  getFollowers,
  getFollowing,
  createQuote,
  createPopularQuote,
  updateQuote,
  deleteQuote,
  likeQuote,
  dislikeQuote,
  commentQuote,
  editComment,
  deleteComment,
};
