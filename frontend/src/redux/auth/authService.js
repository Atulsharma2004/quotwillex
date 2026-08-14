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

/** Send a follow request (not instant follow). */
const followUser = async (id) => {
  const response = await api.put(`/users/follow/${id}`);
  return response.data;
};

const cancelFollowRequest = async (id) => {
  const response = await api.put(`/users/follow-request/${id}/cancel`);
  return response.data;
};

const unfollowUser = async (id) => {
  const response = await api.put(`/users/unfollow/${id}`);
  return response.data;
};

const acceptFollowRequest = async (requestId) => {
  const response = await api.put(`/users/follow-request/${requestId}/accept`);
  return response.data;
};

const rejectFollowRequest = async (requestId) => {
  const response = await api.put(`/users/follow-request/${requestId}/reject`);
  return response.data;
};

const followBack = async (id) => {
  const response = await api.put(`/users/follow-back/${id}`);
  return response.data;
};

const listNotifications = async (params = {}) => {
  const response = await api.get("/users/notifications", { params });
  return response.data;
};

const getUnreadNotificationCount = async () => {
  const response = await api.get("/users/notifications/unread-count");
  return response.data;
};

const markNotificationsRead = async (ids = null) => {
  const response = await api.post("/users/notifications/read", {
    ids: ids || undefined,
  });
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
  cancelFollowRequest,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  followBack,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
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
