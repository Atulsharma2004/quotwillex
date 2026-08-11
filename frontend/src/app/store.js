import { configureStore } from "@reduxjs/toolkit";
import authReducer, { clearSession } from "../redux/auth/authSlice";
import quoteReducer from "../redux/quotes/quoteSlice";
import { setUnauthorizedHandler } from "../api/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quotes: quoteReducer,
  },
});

setUnauthorizedHandler(() => {
  store.dispatch(clearSession());
});

export default store;
