import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import {
  getValidStoredToken,
  clearAuthStorage,
  isAccessTokenValid,
} from "../../utils/accessToken";

const getStoredUser = () => {
  try {
    if (!getValidStoredToken()) return null;
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: getValidStoredToken(),
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  sessionChecked: !getValidStoredToken(),
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong";

export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      const payload = {
        message: getErrorMessage(error),
        code: error.response?.data?.code,
        email: error.response?.data?.email,
      };
      return thunkAPI.rejectWithValue(payload);
    }
  }
);

/** After Google redirect: exchange one-time code for JWT + profile */
export const completeOAuthLogin = createAsyncThunk(
  "auth/completeOAuthLogin",
  async (code, thunkAPI) => {
    try {
      const data = await authService.exchangeOAuthCode(code);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout();
});

/** Confirm stored JWT still works with the API; clear session if not. */
export const bootstrapSession = createAsyncThunk(
  "auth/bootstrapSession",
  async (_, thunkAPI) => {
    const token = getValidStoredToken();
    if (!token) {
      clearAuthStorage();
      return null;
    }
    try {
      const profile = await authService.getProfile({ lite: 1 });
      return profile;
    } catch (error) {
      clearAuthStorage();
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (params = {}, thunkAPI) => {
    try {
      return await authService.getProfile({ lite: 1, ...params });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const followUser = createAsyncThunk(
  "auth/followUser",
  async (userId, thunkAPI) => {
    try {
      return await authService.followUser(userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelFollowRequest = createAsyncThunk(
  "auth/cancelFollowRequest",
  async (userId, thunkAPI) => {
    try {
      return await authService.cancelFollowRequest(userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const unfollowUser = createAsyncThunk(
  "auth/unfollowUser",
  async (userId, thunkAPI) => {
    try {
      return await authService.unfollowUser(userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const acceptFollowRequest = createAsyncThunk(
  "auth/acceptFollowRequest",
  async (requestId, thunkAPI) => {
    try {
      return await authService.acceptFollowRequest(requestId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const rejectFollowRequest = createAsyncThunk(
  "auth/rejectFollowRequest",
  async (requestId, thunkAPI) => {
    try {
      return await authService.rejectFollowRequest(requestId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const followBack = createAsyncThunk(
  "auth/followBack",
  async (userId, thunkAPI) => {
    try {
      return await authService.followBack(userId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, thunkAPI) => {
    try {
      return await authService.updateProfile(data);
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(error),
        status: error.response?.status,
      });
    }
  }
);

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
    patchFollowingLocal: (state, action) => {
      const { targetId, following, targetSnapshot } = action.payload;
      if (!state.user) return;

      const list = state.user.following || [];
      const idStr = targetId.toString();
      const exists = list.some(
        (e) => (e?._id || e)?.toString() === idStr
      );

      if (following && !exists) {
        state.user.following = [
          ...list,
          targetSnapshot || { _id: targetId },
        ];
      } else if (!following && exists) {
        state.user.following = list.filter(
          (e) => (e?._id || e)?.toString() !== idStr
        );
      }
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    /** Track outgoing pending follow requests (Instagram-style). */
    patchPendingFollowLocal: (state, action) => {
      const { targetId, requested } = action.payload;
      if (!state.user) return;
      const idStr = targetId.toString();
      const list = state.user.pendingFollowRequests || [];
      const exists = list.some((id) => id?.toString() === idStr);
      if (requested && !exists) {
        state.user.pendingFollowRequests = [...list, idStr];
      } else if (!requested && exists) {
        state.user.pendingFollowRequests = list.filter(
          (id) => id?.toString() !== idStr
        );
      }
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    /** Merge auth user from an already-loaded profile (avoids a second API call). */
    syncAuthUser: (state, action) => {
      if (!action.payload || !state.user) {
        if (action.payload) {
          const slim = { ...action.payload };
          delete slim.posts;
          delete slim.postsPagination;
          state.user = slim;
          localStorage.setItem("user", JSON.stringify(slim));
        }
        return;
      }
      const prev = state.user;
      const next = { ...prev, ...action.payload };
      delete next.posts;
      delete next.postsPagination;
      if (action.payload.following === undefined) {
        next.following = prev.following;
      }
      if (action.payload.pendingFollowRequests === undefined) {
        next.pendingFollowRequests = prev.pendingFollowRequests;
      }
      state.user = next;
      localStorage.setItem("user", JSON.stringify(next));
    },
    setAccessToken: (state, action) => {
      const token = action.payload;
      if (!token || !isAccessTokenValid(token)) return;
      state.token = token;
      localStorage.setItem("token", token);
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.isSuccess = false;
      state.sessionChecked = true;
      clearAuthStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.sessionChecked = false;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.sessionChecked = true;
        if (!action.payload) {
          state.user = null;
          state.token = null;
          return;
        }
        const slim = { ...(action.payload || {}) };
        delete slim.posts;
        delete slim.postsPagination;
        if (slim.following === undefined && state.user?.following) {
          slim.following = state.user.following;
        }
        if (
          slim.pendingFollowRequests === undefined &&
          state.user?.pendingFollowRequests
        ) {
          slim.pendingFollowRequests = state.user.pendingFollowRequests;
        }
        state.user = { ...(state.user || {}), ...slim };
        state.token = getValidStoredToken();
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.sessionChecked = true;
        state.user = null;
        state.token = null;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message =
          action.payload?.message ||
          (action.payload?.needsEmailVerification
            ? "Check your email to verify your account."
            : "");
        // Complete signup returns token → stay logged in for Home.
        if (action.payload?.token && action.payload?.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
        } else {
          state.user = null;
          state.token = null;
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message =
          typeof action.payload === "string"
            ? action.payload
            : action.payload?.message || "Login failed";
      })
      .addCase(completeOAuthLogin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(completeOAuthLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(completeOAuthLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.token = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isSuccess = false;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        const slim = { ...(action.payload || {}) };
        delete slim.posts;
        delete slim.postsPagination;
        if (slim.following === undefined && state.user?.following) {
          slim.following = state.user.following;
        }
        if (
          slim.pendingFollowRequests === undefined &&
          state.user?.pendingFollowRequests
        ) {
          slim.pendingFollowRequests = state.user.pendingFollowRequests;
        }
        state.user = { ...state.user, ...slim };
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(followUser.fulfilled, (state, action) => {
        if (!state.user) return;
        if (action.payload?.user) {
          state.user = {
            ...state.user,
            ...action.payload.user,
          };
        }
        const targetId = action.payload?.targetId;
        if (targetId && action.payload?.following) {
          const idStr = targetId.toString();
          const list = state.user.following || [];
          const exists = list.some(
            (e) => (e?._id || e)?.toString() === idStr
          );
          if (!exists) {
            state.user.following = [...list, idStr];
          }
          state.user.pendingFollowRequests = (
            state.user.pendingFollowRequests || []
          ).filter((id) => id?.toString() !== idStr);
        } else if (targetId && action.payload?.requested) {
          const idStr = targetId.toString();
          const pending = state.user.pendingFollowRequests || [];
          if (!pending.some((id) => id?.toString() === idStr)) {
            state.user.pendingFollowRequests = [...pending, idStr];
          }
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        if (!state.user) return;
        if (action.payload?.user) {
          state.user = {
            ...state.user,
            ...action.payload.user,
          };
        }
        const targetId = action.payload?.targetId;
        if (targetId) {
          const idStr = targetId.toString();
          state.user.following = (state.user.following || []).filter(
            (e) => (e?._id || e)?.toString() !== idStr
          );
          state.user.pendingFollowRequests = (
            state.user.pendingFollowRequests || []
          ).filter((id) => id?.toString() !== idStr);
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(cancelFollowRequest.fulfilled, (state, action) => {
        if (!state.user) return;
        const targetId = action.payload?.targetId;
        if (targetId) {
          const idStr = targetId.toString();
          state.user.pendingFollowRequests = (
            state.user.pendingFollowRequests || []
          ).filter((id) => id?.toString() !== idStr);
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(acceptFollowRequest.fulfilled, (state, action) => {
        if (!state.user) return;
        // Accepting means THEY follow YOU → only your followerCount increases
        const accepter = action.payload?.accepter;
        if (accepter && accepter._id?.toString() === state.user._id?.toString()) {
          state.user.followerCount = accepter.followerCount;
          state.user.followingCount = accepter.followingCount;
        } else {
          state.user.followerCount = (state.user.followerCount || 0) + 1;
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(followBack.fulfilled, (state, action) => {
        if (!state.user) return;
        const me = action.payload?.me;
        if (me) {
          state.user.followerCount = me.followerCount;
          state.user.followingCount = me.followingCount;
        } else {
          state.user.followingCount = (state.user.followingCount || 0) + 1;
        }
        const targetId = action.payload?.targetId;
        if (targetId) {
          const idStr = targetId.toString();
          const list = state.user.following || [];
          const exists = list.some(
            (e) => (e?._id || e)?.toString() === idStr
          );
          if (!exists) {
            state.user.following = [...list, idStr];
          }
          state.user.pendingFollowRequests = (
            state.user.pendingFollowRequests || []
          ).filter((id) => id?.toString() !== idStr);
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        const prevFollowing = state.user?.following;
        state.user = {
          ...state.user,
          ...action.payload,
          following:
            action.payload?.following !== undefined
              ? action.payload.following
              : prevFollowing,
        };
        localStorage.setItem("user", JSON.stringify(state.user));
      });
  },
});

export const {
  reset,
  patchFollowingLocal,
  patchPendingFollowLocal,
  syncAuthUser,
  setAccessToken,
  clearSession,
} = authSlice.actions;
export default authSlice.reducer;
