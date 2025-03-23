import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import quoteService from "./quoteService";
// import axios from "axios";

// Get token from local storage
const token = localStorage.getItem("token");

const initialState = {
  quotes: [],
  isLoading: false,
  isError: false,
  errorMessage: "",
};

// Async Thunks

// Fetch Quotes
export const fetchQuotes = createAsyncThunk("quotes/fetch", async (_, thunkAPI) => {
  try {
    return await quoteService.getQuotes(token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});



// Create Quote
export const createQuote = createAsyncThunk("quotes/create", async (text, thunkAPI) => {
  try {
    return await quoteService.createQuote(text, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Update Quote
export const updateQuote = createAsyncThunk("quotes/update", async ({ id, text }, thunkAPI) => {
  try {
    return await quoteService.updateQuote(id, text, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Delete Quote
export const deleteQuote = createAsyncThunk("quotes/delete", async (id, thunkAPI) => {
  try {
    return await quoteService.deleteQuote(id, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Like Quote
export const likeQuote = createAsyncThunk("quotes/like", async (id, thunkAPI) => {
  try {
    return await quoteService.likeQuote(id, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Dislike Quote
export const dislikeQuote = createAsyncThunk("quotes/dislike", async (id, thunkAPI) => {
  try {
    return await quoteService.dislikeQuote(id, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Comment on Quote
export const commentQuote = createAsyncThunk("quotes/comment", async ({ id, text }, thunkAPI) => {
  try {
    return await quoteService.commentQuote(id, text, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Edit Comment on Quote
export const editComment = createAsyncThunk("quotes/editComment", async ({ quoteId, commentId, text }, thunkAPI) => {
  try {
    return await quoteService.editComment(quoteId, commentId, text, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Delete Comment on Quote
export const deleteComment = createAsyncThunk("quotes/deleteComment", async ({ quoteId, commentId }, thunkAPI) => {
  try {
    return await quoteService.deleteComment(quoteId, commentId, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
  }
});

// Slice
const quoteSlice = createSlice({
  name: "quotes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.quotes = action.payload;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.quotes.unshift(action.payload);
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) =>
          quote._id === action.payload._id ? action.payload : quote
        );
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.filter((quote) => quote._id !== action.payload.id);
      })
      .addCase(likeQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) =>
          quote._id === action.payload._id ? action.payload : quote
        );
      })
      .addCase(dislikeQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) =>
          quote._id === action.payload._id ? action.payload : quote
        );
      })
      .addCase(commentQuote.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) =>
          quote._id === action.payload._id ? action.payload : quote
        );
      }).addCase(editComment.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) =>
          quote._id === action.payload._id ? action.payload : quote
        );
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.quotes = state.quotes.map((quote) => {
          if (quote._id === action.payload.quoteId) {
            return {
              ...quote,
              comments: quote.comments.filter((comment) => comment._id !== action.payload.commentId),
            };
          }
          return quote;
        });
      });
  },
});

export default quoteSlice.reducer;
