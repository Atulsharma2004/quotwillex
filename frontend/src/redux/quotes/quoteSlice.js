import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import quoteService from "./quoteService";

const initialState = {
  quotes: [],
  popularQuotes: [],
  quotesMeta: { page: 1, limit: 10, total: 0, totalPages: 1 },
  popularMeta: { page: 1, limit: 10, total: 0, totalPages: 1 },
  isLoading: false,
  isError: false,
  errorMessage: "",
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong";

const entryId = (entry) => (entry?._id || entry)?.toString();

const matchesUser = (entry, userId) => entryId(entry) === userId?.toString();

export const fetchQuotes = createAsyncThunk(
  "quotes/fetch",
  async (params = {}, thunkAPI) => {
    try {
      return await quoteService.getQuotes(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createQuote = createAsyncThunk(
  "quotes/create",
  async ({ text, category = "", language = "english", tempId }, thunkAPI) => {
    try {
      return await quoteService.createQuote(text, category, language);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPopularQuotes = createAsyncThunk(
  "quotes/fetchPopular",
  async (params = {}, thunkAPI) => {
    try {
      return await quoteService.getPopularQuotes(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchGuestQuotes = createAsyncThunk(
  "quotes/fetchGuest",
  async (params = {}, thunkAPI) => {
    try {
      return await quoteService.getGuestQuotes(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPopularQuote = createAsyncThunk(
  "quotes/createPopular",
  async (
    { text, attributedTo, sourceWork = "", category = "", language = "english" },
    thunkAPI
  ) => {
    try {
      return await quoteService.createPopularQuote(
        text,
        attributedTo,
        sourceWork,
        category,
        language
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateQuote = createAsyncThunk(
  "quotes/update",
  async (
    { id, text, category = "", language, sourceWork },
    thunkAPI
  ) => {
    try {
      return await quoteService.updateQuote(
        id,
        text,
        category,
        language,
        sourceWork
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteQuote = createAsyncThunk(
  "quotes/delete",
  async (id, thunkAPI) => {
    try {
      return await quoteService.deleteQuote(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const likeQuote = createAsyncThunk(
  "quotes/like",
  async (id, thunkAPI) => {
    try {
      return await quoteService.likeQuote(id);
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(error),
        quoteId: id,
      });
    }
  }
);

export const dislikeQuote = createAsyncThunk(
  "quotes/dislike",
  async (id, thunkAPI) => {
    try {
      return await quoteService.dislikeQuote(id);
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(error),
        quoteId: id,
      });
    }
  }
);

export const commentQuote = createAsyncThunk(
  "quotes/comment",
  async ({ id, text }, thunkAPI) => {
    try {
      return await quoteService.commentQuote(id, text);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const editComment = createAsyncThunk(
  "quotes/editComment",
  async ({ quoteId, commentId, text }, thunkAPI) => {
    try {
      return await quoteService.editComment(quoteId, commentId, text);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteComment = createAsyncThunk(
  "quotes/deleteComment",
  async ({ quoteId, commentId }, thunkAPI) => {
    try {
      return await quoteService.deleteComment(quoteId, commentId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

const replaceQuote = (state, quote) => {
  state.quotes = state.quotes.map((q) => (q._id === quote._id ? quote : q));
  state.popularQuotes = state.popularQuotes.map((q) =>
    q._id === quote._id ? quote : q
  );
};

const quoteSlice = createSlice({
  name: "quotes",
  initialState,
  reducers: {
    optimisticToggleLike: (state, action) => {
      const { quoteId, userId } = action.payload;
      const quote =
        state.quotes.find((q) => q._id === quoteId) ||
        state.popularQuotes.find((q) => q._id === quoteId);
      if (!quote) return;

      if (quote.likedByMe) {
        quote.likedByMe = false;
        quote.likesCount = Math.max(0, (quote.likesCount || 1) - 1);
        quote.likes = [];
      } else {
        quote.likedByMe = true;
        quote.likesCount = (quote.likesCount || 0) + 1;
        quote.likes = [userId];
        if (quote.dislikedByMe) {
          quote.dislikedByMe = false;
          quote.dislikesCount = Math.max(0, (quote.dislikesCount || 1) - 1);
          quote.dislikes = [];
        }
      }
    },
    optimisticToggleDislike: (state, action) => {
      const { quoteId, userId } = action.payload;
      const quote =
        state.quotes.find((q) => q._id === quoteId) ||
        state.popularQuotes.find((q) => q._id === quoteId);
      if (!quote) return;

      if (quote.dislikedByMe) {
        quote.dislikedByMe = false;
        quote.dislikesCount = Math.max(0, (quote.dislikesCount || 1) - 1);
        quote.dislikes = [];
      } else {
        quote.dislikedByMe = true;
        quote.dislikesCount = (quote.dislikesCount || 0) + 1;
        quote.dislikes = [userId];
        if (quote.likedByMe) {
          quote.likedByMe = false;
          quote.likesCount = Math.max(0, (quote.likesCount || 1) - 1);
          quote.likes = [];
        }
      }
    },
    optimisticUpdateQuoteText: (state, action) => {
      const { id, text, category, language, sourceWork } = action.payload;
      const quote =
        state.quotes.find((q) => q._id === id) ||
        state.popularQuotes.find((q) => q._id === id);
      if (!quote) return;
      quote.text = text;
      if (category !== undefined) {
        quote.category = category || undefined;
      }
      if (language !== undefined) quote.language = language;
      if (sourceWork !== undefined) quote.sourceWork = sourceWork;
    },
    optimisticCreateQuote: (state, action) => {
      state.quotes.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quotes = action.payload.quotes || [];
        state.quotesMeta = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      .addCase(fetchPopularQuotes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPopularQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularQuotes = action.payload.quotes || [];
        state.popularMeta = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchPopularQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      .addCase(fetchGuestQuotes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchGuestQuotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularQuotes = action.payload.quotes || [];
        state.popularMeta = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
        };
      })
      .addCase(fetchGuestQuotes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        const tempId = action.meta.arg.tempId;
        const tempIndex = state.quotes.findIndex((quote) => quote._id === tempId);
        if (tempIndex !== -1) {
          state.quotes[tempIndex] = action.payload;
        } else {
          state.quotes.unshift(action.payload);
        }
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.quotes = state.quotes.filter(
          (quote) => quote._id !== action.meta.arg.tempId
        );
      })
      .addCase(createPopularQuote.fulfilled, (state, action) => {
        state.popularQuotes.unshift(action.payload);
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        replaceQuote(state, action.payload);
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.filter((q) => q._id !== action.payload.id);
        state.popularQuotes = state.popularQuotes.filter(
          (q) => q._id !== action.payload.id
        );
      })
      .addCase(likeQuote.fulfilled, (state, action) => {
        replaceQuote(state, action.payload);
      })
      .addCase(likeQuote.rejected, (state, action) => {
        state.isError = true;
        state.errorMessage = action.payload?.message || "Like failed";
      })
      .addCase(dislikeQuote.fulfilled, (state, action) => {
        replaceQuote(state, action.payload);
      })
      .addCase(dislikeQuote.rejected, (state, action) => {
        state.isError = true;
        state.errorMessage = action.payload?.message || "Dislike failed";
      })
      .addCase(commentQuote.fulfilled, (state, action) => {
        replaceQuote(state, action.payload);
      })
      .addCase(editComment.fulfilled, (state, action) => {
        replaceQuote(state, action.payload);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (action.payload.updatedQuote) {
          replaceQuote(state, action.payload.updatedQuote);
        } else {
          state.quotes = state.quotes.map((quote) => {
            if (quote._id === action.payload.quoteId) {
              return {
                ...quote,
                comments: quote.comments.filter(
                  (c) => c._id !== action.payload.commentId
                ),
              };
            }
            return quote;
          });
        }
      });
  },
});

export const {
  optimisticToggleLike,
  optimisticToggleDislike,
  optimisticUpdateQuoteText,
  optimisticCreateQuote,
} = quoteSlice.actions;
export default quoteSlice.reducer;
