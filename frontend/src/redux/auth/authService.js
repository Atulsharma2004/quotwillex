import api from "../../api/api";

const register = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

const login = async (userData) => {
  const response = await api.post("/users/login", userData);
  return response.data;
};

const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

const getProfile = async (params = {}) => {
  const response = await api.get("/users/profile", { params });
  return response.data;
};

const getUserById = async (id, params = {}) => {
  const key = encodeURIComponent(String(id || "").trim());
  const response = await api.get(`/users/${key}`, { params });
  return response.data;
};

const followUser = async (id) => {
  const response = await api.put(`/users/follow/${id}`);
  return response.data;
};

const unfollowUser = async (id) => {
  const response = await api.put(`/users/unfollow/${id}`);
  return response.data;
};

const updateProfile = async (data) => {
  const response = await api.put("/users/profile", data);
  return response.data;
};

const checkUsername = async (username) => {
  const response = await api.get("/users/check-username", {
    params: { username },
  });
  return response.data;
};

const searchUsers = async (q) => {
  const response = await api.get("/users/search", {
    params: { q, limit: 100 },
  });
  return response.data;
};

const exchangeOAuthCode = async (code) => {
  const response = await api.post("/users/oauth/exchange", { code });
  return response.data;
};

const verifyEmail = async (token) => {
  const response = await api.post("/users/verify-email", { token });
  return response.data;
};

const resendVerification = async (email) => {
  const response = await api.post("/users/resend-verification", { email });
  return response.data;
};

const forgotPassword = async (email) => {
  const response = await api.post("/users/forgot-password", { email });
  return response.data;
};

const requestPasswordReset = async () => {
  const response = await api.post("/users/request-password-reset");
  return response.data;
};

const resetPassword = async ({ token, password }) => {
  const response = await api.post("/users/reset-password", { token, password });
  return response.data;
};

const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.put("/users/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export default {
  register,
  login,
  logout,
  getProfile,
  getUserById,
  followUser,
  unfollowUser,
  updateProfile,
  checkUsername,
  searchUsers,
  exchangeOAuthCode,
  verifyEmail,
  resendVerification,
  forgotPassword,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
