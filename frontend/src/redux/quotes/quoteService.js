import api from "../../api/api";

const getQuotes = async (token) => {
  const response = await api.get("/quotes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const createQuote = async (text, token) => {
  const response = await api.post(
    "/quotes",
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const updateQuote = async (id, text, token) => {
  const response = await api.put(
    `/quotes/${id}`,
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const deleteQuote = async (id, token) => {
  await api.delete(`/quotes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { id };
};

const likeQuote = async (id, token) => {
  const response = await api.put(`/quotes/${id}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const dislikeQuote = async (id, token) => {
  const response = await api.put(`/quotes/${id}/dislike`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const commentQuote = async (id, text, token) => {
  const response = await api.put(
    `/quotes/${id}/comment`,
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export default {
  getQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  likeQuote,
  dislikeQuote,
  commentQuote,
};
