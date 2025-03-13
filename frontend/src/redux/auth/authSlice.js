import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// Register User
export const register = createAsyncThunk("auth/register", async (userData, thunkAPI) => {
  try {
    return await authService.register(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

// Login User
export const login = createAsyncThunk("auth/login", async (userData, thunkAPI) => {
  try {
    return await authService.login(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

// Logout User
export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(register.fulfilled, (state) => {
      // state.user = action.payload.user;
      // state.token = action.payload.token;
      // localStorage.setItem("user", JSON.stringify(action.payload.user));
      // localStorage.setItem("token", action.payload.token);
      // state.isSuccess = true; // Ensure it triggers redirection

      state.isSuccess = true;
      state.user = null; // Ensure no user is stored
      state.token = null;
      localStorage.removeItem("user");
      // localStorage.removeItem("token");
    })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
