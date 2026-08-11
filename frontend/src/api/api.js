import axios from "axios";
import { getValidStoredToken, clearAuthStorage } from "../utils/accessToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized = null;

/** Register a handler (e.g. Redux logout) for 401 session failures. */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = typeof handler === "function" ? handler : null;
};

api.interceptors.request.use((config) => {
  const token = getValidStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "");
    const isAuthFailure =
      status === 401 &&
      (/invalid token/i.test(message) ||
        /session expired/i.test(message) ||
        /no token/i.test(message) ||
        /unauthorized/i.test(message));

    if (isAuthFailure) {
      clearAuthStorage();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
