import Quote from "../models/Quote.js";



// ✅ Create a new quote and update post count
export const createQuote = async (req, res) => {
  try {
    console.log("User in request:", req.user); // Debugging

    if (!req.user) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    const { text } = req.body;
    const newQuote = new Quote({ text, author: req.user.id });

    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Load all quotes (Ensure author includes profilePic)
export const loadQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .populate("author", "name profilePicture role").populate("likes", "name profilePicture")
      .populate("dislikes", "name profilePicture")
      .populate("comments.user", "name profilePicture").exec(); // Ensure author is populated
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  
  // ✅ Delete a quote and update post count
  export const deleteQuote = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
  
      if (quote.author.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
  
      await Quote.findByIdAndDelete(req.params.id);
      
      // Decrease post count
      await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: -1 } });
  
      res.json({ message: "Quote deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


export const likeQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("likes", "name profilePicture").populate("dislikes", "name profilePicture").populate("comments.user", "name profilePicture");

    if (!quote) return res.status(404).json({ message: "Quote not found" });

    if (!quote.likes.some((user) => user._id.toString() === req.user.id)) {
      quote.likes.push(req.user.id);
      quote.dislikes = quote.dislikes.filter((user) => user._id.toString() !== req.user.id);
    }

    await quote.save();
    const updatedQuote = await Quote.findById(req.params.id)
      .populate("likes", "name profilePicture")
      .populate("dislikes", "name profilePicture")
      .populate("comments.user", "name profilePicture");

    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  

  export const dislikeQuote = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id).populate("likes", "name profilePicture").populate("dislikes", "name profilePicture").populate("comments.user", "name profilePicture");
  
      if (!quote) return res.status(404).json({ message: "Quote not found" });
  
      if (!quote.dislikes.some((user) => user._id.toString() === req.user.id)) {
        quote.dislikes.push(req.user.id);
        quote.likes = quote.likes.filter((user) => user._id.toString() !== req.user.id);
      }
  
      await quote.save();
      const updatedQuote = await Quote.findById(req.params.id)
        .populate("likes", "name profilePicture")
        .populate("dislikes", "name profilePicture")
        .populate("comments.user", "name profilePicture");
  
      res.json(updatedQuote);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  

  export const commentQuote = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id);
  
      if (!quote) return res.status(404).json({ message: "Quote not found" });
  
      const newComment = { user: req.user.id, text: req.body.text };
      quote.comments.push(newComment);
  
      await quote.save();
      const updatedQuote = await Quote.findById(req.params.id)
        .populate("likes", "name profilePicture")
        .populate("dislikes", "name profilePicture")
        .populate("comments.user", "name profilePicture");
  
      res.json(updatedQuote);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
  // ✅ Edit own quote
  export const updateQuote = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
  
      if (quote.author.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }
  
      quote.text = req.body.text;
      await quote.save();
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
