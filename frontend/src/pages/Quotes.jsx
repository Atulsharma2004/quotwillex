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

const Quotes = () => {
  const dispatch = useDispatch();
  const { quotes } = useSelector((state) => state.quotes);
  const [newQuote, setNewQuote] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    dispatch(fetchQuotes());
  }, [dispatch]);

  const handleCreate = () => {
    if (newQuote.trim()) {
      dispatch(createQuote(newQuote));
      setNewQuote("");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center">Quotes</h2>

      {/* Add New Quote */}
      <div className="my-4 flex flex-col w-3/4 mx-auto ">
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
      {quotes.map((quote) => (
        <div key={quote._id} className="border p-4 my-2  w-3/4 mx-auto rounded-lg ">
          <div className="w-full flex justify-end gap-8">
            <button onClick={() => dispatch(updateQuote(quote._id))} className="">Edit</button>
            <button onClick={() => dispatch(deleteQuote(quote._id))} className="">❌</button>
            </div>
          
          <div className="min-h-[300px] bg-[url('https://hbr.org/resources/images/article_assets/2018/08/R1805D_CHIN.jpg')] px-8 pt-20">
            <div className="w-2/3 bg-white border border-2 mx-auto shadow-xl px-4 py-4 rounded-md">
            <p className="text-xl mb-1 font-bold text-blue-600"><FaQuoteLeft /></p>
            <p className="text-xl italic">{quote.text}</p>
            </div>
          </div>
          <div className="">
            <button onClick={() => dispatch(likeQuote(quote._id))}>👍 {quote.likes.length}</button>
            <button onClick={() => dispatch(dislikeQuote(quote._id))}>👎 {quote.dislikes.length}</button>
          </div>
          
          

          {/* Comment Section */}
          <div>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={() => dispatch(commentQuote({ id: quote._id, text: commentText }))}>
              Comment
            </button>
          </div>

          {/* Comment Area */}
        </div>
      ))}
    </div>
  );
};

export default Quotes;
