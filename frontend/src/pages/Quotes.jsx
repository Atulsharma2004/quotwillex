import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaQuoteLeft } from "react-icons/fa";

import {
  fetchQuotes,
  createQuote,
  deleteQuote,
  updateQuote,
  likeQuote,
  dislikeQuote,
  commentQuote,
} from "../redux/quotes/quoteSlice";
import { Navigate } from "react-router-dom";

const Quotes = () => {
  const dispatch = useDispatch();
  const { quotes } = useSelector((state) => state.quotes);
  const { user } = useSelector((state) => state.auth); // Get the logged-in user
  const [newQuote, setNewQuote] = useState("");
  // const [commentText, setCommentText] = useState("");

  // State for editing mode
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");

  const [localQuotes, setLocalQuotes] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [visibleComments, setVisibleComments] = useState({});


  useEffect(() => {
    dispatch(fetchQuotes());
  }, [dispatch]);

  useEffect(() => {
    setLocalQuotes(quotes); // Sync state with fetched quotes
  }, [quotes]);

  
  const handleCreate = async () => {
  
    if (newQuote.trim()) {
      const action = await dispatch(createQuote(newQuote));
      if (action.payload) {
        setLocalQuotes([action.payload, ...localQuotes]); // Add new quote at the top
      }
      setNewQuote("");
      dispatch(fetchQuotes());
    }
  };


  const handleEditClick = (quote) => {
    setEditQuoteId(quote._id);
    setEditText(quote.text);
  };

  
  const handleSaveClick = async (id) => {
    if (editText.trim()) {
      const action = await dispatch(updateQuote({ id, text: editText }));
      if (action.payload) {
        setLocalQuotes(
          localQuotes.map((q) => (q._id === id ? { ...q, text: editText } : q))
        ); // Update quote in local state
      }
      setEditQuoteId(null); // Exit edit mode
    }
  };

  const handleDelete = async (id) => {
    await dispatch(deleteQuote(id));
    setLocalQuotes(localQuotes.filter((q) => q._id !== id)); // Remove quote dynamically
  };

  const handleLike = async (id) => {
    const action = await dispatch(likeQuote(id));
    if (action.payload) {
      setLocalQuotes(localQuotes.map(q => 
        q._id === id ? { ...q, likes: action.payload.likes } : q
      ));
    }
  };
  
  const handleDislike = async (id) => {
    const action = await dispatch(dislikeQuote(id));
    if (action.payload) {
      setLocalQuotes(localQuotes.map(q => 
        q._id === id ? { ...q, dislikes: action.payload.dislikes } : q
      ));
    }
  };

  const handleCommentSubmit = async (quoteId) => {
    if (commentText.trim()) {
      await dispatch(commentQuote({ id: quoteId, text: commentText }));
      setCommentText("");
    }
  };

  // Handle Load More Comments
  const handleLoadMoreComments = (quoteId) => {
    setVisibleComments((prev) => ({
      ...prev,
      [quoteId]: (prev[quoteId] || 3) + 3, // Load 3 more comments
    }));
  };

  if(!user){
    Navigate("/login");
    if (!quotes) return <p>Please login to view your Quotes.</p>;
  }
  

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center">Quotes</h2>

      {/* Add New Quote */}
      <div className="my-4 flex flex-col w-3/4 mx-auto">
        <input
          type="text"
          className="border p-4 h-24 rounded-sm"
          value={newQuote}
          onChange={(e) => setNewQuote(e.target.value)}
          placeholder="Add a new quote..."
        />
        <button className="bg-blue-500 text-white p-2 mt-2 rounded-lg" onClick={handleCreate}>
          Add Quote
        </button>
      </div>

      {/* Display Quotes */}
      {localQuotes.map((quote) => (
        <div key={quote._id} className="border px-4 py-2 my-2 w-3/4 mx-auto rounded-lg">
          <div className="header-quote-post flex justify-between items-center  px-2 py-1">
          <div className="owner-detail flex items-center gap-2   rounded-md px-2 py-2">
            <img src={quote.author.profilePicture} alt="owner-pic" className="w-14 h-10 rounded-full"/>
            <div className="author-name">
              <p className="font-bold">{quote.author.name}</p>
            </div>
          </div>
          <div className="edit-delete-button w-full flex justify-end gap-8 mb-2">
            {/* Only show Edit/Delete buttons if the user is the author or an admin */}
            {(user?._id === quote.author._id || user?.role === "admin") && (
              <>
                {editQuoteId === quote._id ? (
                  <button className="bg-blue-500 text-white px-4 py-1 rounded-lg" onClick={() => handleSaveClick(quote._id)}>
                    Save
                  </button>
                ) : (
                  <button className="bg-green-500 text-white px-4 py-1 rounded-lg" onClick={() => handleEditClick(quote)}>
                    Edit
                  </button>
                )}
                <button className="bg-white border border-1 border-black px-4 py-1 rounded-lg" onClick={() => handleDelete(quote._id)}>
                  ❌
                </button>
              </>
            )}
          </div>
          </div>

          <div className="min-h-[300px] bg-[url('https://hbr.org/resources/images/article_assets/2018/08/R1805D_CHIN.jpg')] px-8 pt-20">
            <div className="w-2/3 bg-white border border-2 mx-auto shadow-xl px-4 py-4 rounded-md">
              <p className="text-xl mb-1 font-bold text-blue-600"><FaQuoteLeft /></p>
              {editQuoteId === quote._id ? (
                <input
                  type="text"
                  className="w-full border p-2 rounded-md"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              ) : (
                <p className="text-xl italic">{quote.text}</p>
              )}
            </div>
          </div>
          <div>
          <div>
            <button onClick={() => handleLike(quote._id)}>👍 {quote.likes.length}</button>
            <button onClick={() => handleDislike(quote._id)}>👎 {quote.dislikes.length}</button>
          </div>
          </div>

          {/* Comment Section */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="border p-2 w-full rounded-md"
            />
            <button
              onClick={() => handleCommentSubmit(quote._id)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
            >
              Comment
            </button>

            {/* Display Comments */}
            <div className="mt-4">
              {quote.comments.slice(0, visibleComments[quote._id] || 3).map((comment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md mt-2">
                  <img
                    src={comment.user.profilePicture}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-bold">{comment.user.name}</p>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}

              {/* Load More Comments Button */}
              {quote.comments.length > (visibleComments[quote._id] || 3) && (
                <button
                  onClick={() => handleLoadMoreComments(quote._id)}
                  className="text-blue-500 mt-2"
                >
                  Load More Comments
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Quotes;
