import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Quote from "../models/Quote.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, profilePic, role } = req.body; // ⬅️ Use profilePic (not profilePicture)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profilePicture: profilePic, // ⬅️ Store the profilePic properly
      role: role || "user",
    });

    await user.save();
    // Generate token for immediate authentication after signup
    // const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, profilePicture, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, profilePicture, bio }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Follow a user
export const followUser = async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);
  
      if (!userToFollow || !currentUser) return res.status(404).json({ message: "User not found" });
  
      if (!currentUser.following.includes(req.params.id)) {
        currentUser.following.push(req.params.id);
        userToFollow.followers.push(req.user.id);
      }
  
      await currentUser.save();
      await userToFollow.save();
  
      res.json({ message: "Followed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // ✅ Unfollow a user
  export const unfollowUser = async (req, res) => {
    try {
      const userToUnfollow = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);
  
      if (!userToUnfollow || !currentUser) return res.status(404).json({ message: "User not found" });
  
      currentUser.following = currentUser.following.filter((id) => id.toString() !== req.params.id);
      userToUnfollow.followers = userToUnfollow.followers.filter((id) => id.toString() !== req.user.id);
  
      await currentUser.save();
      await userToUnfollow.save();
  
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password") // Exclude password
      .populate("followers", "name profilePicture") // Populate followers
      .populate("following", "name profilePicture"); // Populate following

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all posts (quotes) by the user
    const userPosts = await Quote.find({ author: req.user.id });

    res.json({
      ...user.toObject(),
      postCount: userPosts.length,
      posts: userPosts, // Include posts details
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};