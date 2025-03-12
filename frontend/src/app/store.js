import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/auth/authSlice";
import quoteReducer from "../redux/quotes/quoteSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quotes: quoteReducer,
  },
});

export default store;
