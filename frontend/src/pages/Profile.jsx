import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  commentQuote,
  deleteComment,
  deleteQuote,
  dislikeQuote,
  editComment,
  fetchQuotes,
  likeQuote,
  updateQuote,
} from "../redux/quotes/quoteSlice";
import { FaQuoteLeft } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { FaSave } from "react-icons/fa";

// import { logout } from "../redux/auth/authSlice";
// import { useNavigate } from "react-router-dom";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { quotes } = useSelector((state) => state.quotes);
  // const dispatch = useDispatch();
  // const navigate = useNavigate();
  // const [newQuote, setNewQuote] = useState("");
  // const [commentText, setCommentText] = useState("");

  // State for editing mode
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editText, setEditText] = useState("");

  const [localQuotes, setLocalQuotes] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [visibleComments, setVisibleComments] = useState({});

  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    dispatch(fetchQuotes()); // Fetch quotes when profile loads
  }, [dispatch]);

  useEffect(() => {
    setLocalQuotes(quotes); // Sync state with fetched quotes
  }, [quotes]);

  const handleEditClick = (quote) => {
    setEditQuoteId(quote._id);
    setEditText(quote.text);
  };

  // const handleSaveClick = async (id) => {
  //   if (editText.trim()) {
  //     const action = await dispatch(updateQuote({ id, text: editText }));
  //     if (action.payload) {
  //       setLocalQuotes(
  //         localQuotes.map((q) => (q._id === id ? { ...q, text: editText } : q))
  //       ); // Update quote in local state
  //     }
  //     setEditQuoteId(null); // Exit edit mode
  //   }
  // };
  const handleSaveClick = async (id) => {
    if (editText.trim()) {
      await dispatch(updateQuote({ id, text: editText }));
      dispatch(fetchQuotes()); // Re-fetch updated quotes
      setEditQuoteId(null);
    }
  };

  const handleDelete = async (id) => {
    await dispatch(deleteQuote(id));
    setLocalQuotes(localQuotes.filter((q) => q._id !== id)); // Remove quote dynamically
  };

  const handleLike = async (id) => {
    const action = await dispatch(likeQuote(id));
    if (action.payload) {
      setLocalQuotes(
        localQuotes.map((q) =>
          q._id === id ? { ...q, likes: action.payload.likes } : q
        )
      );
    }
  };

  const handleDislike = async (id) => {
    const action = await dispatch(dislikeQuote(id));
    if (action.payload) {
      setLocalQuotes(
        localQuotes.map((q) =>
          q._id === id ? { ...q, dislikes: action.payload.dislikes } : q
        )
      );
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

  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentText(comment.text);
  };

  // Handle save edited comment
  const handleSaveComment = async (quoteId, commentId) => {
    if (editCommentText.trim()) {
      const action = await dispatch(
        editComment({ quoteId, commentId, text: editCommentText })
      );
      if (action.payload) {
        setLocalQuotes((prevQuotes) =>
          prevQuotes.map((quote) =>
            quote._id === quoteId ? action.payload : quote
          )
        );
      }
      setEditCommentId(null);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (quoteId, commentId) => {
    await dispatch(deleteComment({ quoteId, commentId }));
    setLocalQuotes((prevQuotes) =>
      prevQuotes.map((quote) =>
        quote._id === quoteId
          ? {
              ...quote,
              comments: quote.comments.filter((c) => c._id !== commentId),
            }
          : quote
      )
    );
  };

  const postCount = quotes.filter(
    (post) => post.author._id === user._id
  ).length;

  if (!user) return <p>Please login to view your profile.</p>;

  return (
    <div>
      <div className="image-area bg-gray-200 px-12 w-3/4 py-8 flex justify-center mx-auto mt-2">
        <div className="flex flex-col justify-center items-center">
          <img
            src={
              user.profilePicture ||
              "https://static-00.iconduck.com/assets.00/user-icon-1024x1024-dtzturco.png"
            }
            alt="Profile"
            style={{ borderRadius: "50%", width: "100px", height: "100px" }}
            className="mb-2 flex items-center justify-center"
          />
          <h2>
            {user.name}
            {user.role}
          </h2>
          <p>Email: {user.email}</p>
          <p>Bio: {user.bio || "No bio available"}</p>
        </div>
        <div className="flex flex-row  gap-12 mt-6 ml-12">
          <h3>Posts: {postCount || 0}</h3>
          <h3>Followers: ({user.followers.length})</h3>
          {/* <ul>
        {user.followers.length > 0 ? (
          user.followers.map((follower) => <li key={follower.email}>{follower.name}</li>)
        ) : (
          <p>No followers</p>
        )}
      </ul> */}
          <h3>Following: ({user.following.length})</h3>
          {/* <ul>
        {user.following.length > 0 ? (
          user.following.map((follow) => <li key={follow.email}>{follow.name}</li>)
        ) : (
          <p>Not following anyone</p>
        )}
      </ul> */}
        </div>
      </div>
      <div className="post-area">
        <h3 className="text-xl font-bold mb-4 mt-8 mx-auto w-3/4">
          Quotes by {user.name}
        </h3>
        <ul>
          {quotes.length > 0 ? (
            quotes
              .filter((quote) => quote.author._id === user._id)
              .map((quote, index) => (
                <li key={index}>
                  <div className="border px-4 py-2 my-2 w-3/4 mx-auto  rounded-lg">
                    <div className="header-quote-post   px-2 py-1">
                      <div className="owner-detail flex items-center gap-2   rounded-md px-2 py-2">
                        <img
                          src={quote.author.profilePicture}
                          alt="owner-pic"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="author-name">
                          <p className="font-bold">{quote.author.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[300px] bg-[url('https://hbr.org/resources/images/article_assets/2018/08/R1805D_CHIN.jpg')] flex items-center justify-center">
                      <div className="w-2/3 bg-white border border-2 mx-auto shadow-xl px-4 py-4 rounded-md">
                        <p className="text-xl mb-1 font-bold text-blue-600">
                          <FaQuoteLeft />
                        </p>
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
                    <div className="flex items-center justify-between px-2 py-1 mt-2">
                      <div className="flex gap-2">
                        <button
                          className="flex"
                          onClick={() => handleLike(quote._id)}
                        >
                          <span>👍</span> <span>{quote.likes.length}</span>
                        </button>
                        <button
                          className="flex"
                          onClick={() => handleDislike(quote._id)}
                        >
                          <span>👎</span> <span>{quote.dislikes.length}</span>
                        </button>
                      </div>
                      <div className="edit-delete-button flex gap-4">
                        {/* Only show Edit/Delete buttons if the user is the author or an admin */}
                        {(user?._id === quote.author._id ||
                          user?.role === "admin") && (
                          <>
                            {editQuoteId === quote._id ? (
                              <button
                                className="bg-green-500 text-white px-4 py-1  rounded-lg"
                                onClick={() => handleSaveClick(quote._id)}
                              >
                                <FaSave />
                              </button>
                            ) : (
                              <button
                                className="bg-blue-500 text-white px-4 py-1 rounded-lg"
                                onClick={() => handleEditClick(quote)}
                              >
                                <FaEdit />
                              </button>
                            )}
                            <button
                              className="bg-red-500 text-white  px-4 py-1 rounded-lg"
                              onClick={() => handleDelete(quote._id)}
                            >
                              <RiDeleteBin6Fill />
                            </button>
                          </>
                        )}
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
                        {quote.comments
                          .slice(0, visibleComments[quote._id] || 1)
                          .map((comment) => (
                            <div
                              key={comment._id}
                              className="flex  justify-between gap-2 p-2 border rounded-md"
                            >
                              <div className="flex gap-2 items-center">
                                <div className="">
                                  <img
                                    src={comment.user.profilePicture}
                                    alt="User"
                                    className="w-8 h-8 rounded-full"
                                  />
                                </div>
                                <div className="">
                                  <p className="font-bold">
                                    {comment.user.name}
                                  </p>
                                  {editCommentId === comment._id ? (
                                    <input
                                      type="text"
                                      className="border p-2 rounded-md w-full"
                                      value={editCommentText}
                                      onChange={(e) =>
                                        setEditCommentText(e.target.value)
                                      }
                                    />
                                  ) : (
                                    <p>{comment.text}</p>
                                  )}
                                </div>
                              </div>

                              {/* Edit and Delete buttons for comment */}

                              {(user?._id === comment.user._id ||
                                user?.role === "admin") && (
                                <div className="flex gap-6">
                                  {editCommentId === comment._id ? (
                                    <button
                                      onClick={() =>
                                        handleSaveComment(
                                          quote._id,
                                          comment._id
                                        )
                                      }
                                      className="text-green-500 text-xl font-bold"
                                    >
                                      <FaSave />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleEditComment(comment)}
                                      className="text-blue-500 text-xl font-bold"
                                    >
                                      <FaEdit />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(
                                        quote._id,
                                        comment._id
                                      )
                                    }
                                    className="text-red-500 text-xl font-bold"
                                  >
                                    <RiDeleteBin6Fill />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}

                        {/* Load More Comments Button */}
                        {quote.comments.length >
                          (visibleComments[quote._id] || 1) && (
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
                </li>
              ))
          ) : (
            <p>No quotes available.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
