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
  
      if (!quote) return res.status(404).json({ error: "Quote not found" });
  
      // Check if the logged-in user is the author or an admin
      if (quote.author.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to edit this quote" });
      }
  
      quote.text = req.body.text;
      await quote.save();
  
      res.status(200).json(quote);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
  
  // ✅ Delete a quote and update post count
  export const deleteQuote = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id);
  
      if (!quote) return res.status(404).json({ error: "Quote not found" });
  
      // Check if the logged-in user is the author or an admin
      if (quote.author.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this quote" });
      }
  
      await quote.deleteOne();
      res.status(200).json({ message: "Quote deleted successfully", id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
