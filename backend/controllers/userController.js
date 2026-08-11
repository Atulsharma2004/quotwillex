import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Quote from "../models/Quote.js";
import PopularQuote from "../models/PopularQuote.js";
import Follow from "../models/Follow.js";
import {
  validateUsernameFormat,
  normalizeUsername,
} from "../utils/username.js";
import {
  resolveProfileKey,
  publicProfileKey,
} from "../utils/profileKey.js";
import {
  stripPrivateProfileFields,
  validatePrivateProfileInput,
  publicSelectExclude,
  isPrivateProfileIncomplete,
} from "../utils/privateProfile.js";
import {
  createOAuthState,
  consumeOAuthState,
  createLoginCode,
  consumeLoginCode,
} from "../utils/oauthSession.js";
import { sanitizeProfilePicture, resolveOAuthProfilePicture, isDefaultAvatar } from "../utils/profilePicture.js";
import { resolveEffectiveRole } from "../utils/adminAccess.js";
import {
  createEmailToken,
  sendVerificationEmail,
  isTransactionalMailConfigured,
} from "../utils/mail.js";
import {
  parsePagination,
  paginatedResponse,
} from "../utils/pagination.js";
import {
  AUTHOR_SELECT,
  buildAuthUserPayload,
  serializeQuotesForViewer,
  USER_CARD_SELECT,
} from "../utils/quoteSerializer.js";
import { createAccessToken } from "../utils/accessToken.js";

const createToken = (user) => createAccessToken(user);

const findUserIdFromKey = async (key) => {
  const resolved = resolveProfileKey(key);
  if (!resolved) return null;

  if (resolved.type === "id") {
    const user = await User.findById(resolved.value).select("_id").lean();
    return user?._id?.toString() || null;
  }

  const user = await User.findOne({ username: resolved.value })
    .select("_id")
    .lean();
  return user?._id?.toString() || null;
};

const getGoogleOAuthClient = () => {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5000/api/users/google/callback";

  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

const findOrCreateGoogleUser = async ({ googleId, email, name, picture }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const displayName = name || normalizedEmail.split("@")[0];
  const resolvedPicture = resolveOAuthProfilePicture(
    picture,
    normalizedEmail,
    displayName
  );

  let user = await User.findOne({ googleId });
  if (user) {
    // If they still have no custom photo, use Google photo or email-based avatar.
    if (isDefaultAvatar(user.profilePicture)) {
      user.profilePicture = resolvedPicture;
    }
    if (!user.emailVerified) user.emailVerified = true;
    if (user.isModified()) await user.save();
    return user;
  }

  user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (user) {
    // Never auto-link Google to an existing password account (account takeover).
    if (user.authProvider === "local" || user.password) {
      const err = new Error("ACCOUNT_EXISTS_PASSWORD");
      err.code = "ACCOUNT_EXISTS_PASSWORD";
      throw err;
    }
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      if (isDefaultAvatar(user.profilePicture)) {
        user.profilePicture = resolvedPicture;
      }
      await user.save();
    }
    return user;
  }

  return User.create({
    name: displayName,
    email: normalizedEmail,
    googleId,
    authProvider: "google",
    profilePicture: resolvedPicture,
    role: resolveEffectiveRole(normalizedEmail),
    emailVerified: true,
  });
};

const loadProfileBundle = async (userId, viewerId, query = {}) => {
  const isOwnProfile = viewerId?.toString() === userId?.toString();
  const user = await User.findById(userId).select(
    isOwnProfile ? "-password -googleId" : publicSelectExclude
  );
  if (!user) return null;

  const { page, limit, skip } = parsePagination(query, { limit: 3 });
  const postsFilter = { author: userId };

  const requestedType = String(query.postsType || query.type || "all")
    .trim()
    .toLowerCase();
  const effectiveRole = resolveEffectiveRole(user.email);
  const canFilterPostTypes = isOwnProfile && effectiveRole === "admin";
  const postsType = canFilterPostTypes
    ? ["community", "popular", "all"].includes(requestedType)
      ? requestedType
      : "all"
    : "all";

  const [communityTotal, popularTotal, isFollowing] = await Promise.all([
    Quote.countDocuments(postsFilter),
    PopularQuote.countDocuments(postsFilter),
    viewerId && !isOwnProfile
      ? Follow.exists({ follower: viewerId, following: userId }).then(Boolean)
      : Promise.resolve(false),
  ]);

  let totalPosts = communityTotal + popularTotal;
  let mixed = [];

  if (postsType === "community") {
    totalPosts = communityTotal;
    const communityPosts = await Quote.find(postsFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", AUTHOR_SELECT)
      .lean();
    mixed = communityPosts.map((q) => ({ ...q, __kind: "community" }));
  } else if (postsType === "popular") {
    totalPosts = popularTotal;
    const popularPosts = await PopularQuote.find(postsFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", AUTHOR_SELECT)
      .lean();
    mixed = popularPosts.map((q) => ({ ...q, __kind: "popular" }));
  } else {
    const [communityPosts, popularPosts] = await Promise.all([
      Quote.find(postsFilter)
        .sort({ createdAt: -1 })
        .limit(limit + skip)
        .populate("author", AUTHOR_SELECT)
        .lean(),
      PopularQuote.find(postsFilter)
        .sort({ createdAt: -1 })
        .limit(limit + skip)
        .populate("author", AUTHOR_SELECT)
        .lean(),
    ]);
    mixed = [
      ...communityPosts.map((q) => ({ ...q, __kind: "community" })),
      ...popularPosts.map((q) => ({ ...q, __kind: "popular" })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);
  }

  const communitySerialized = await serializeQuotesForViewer(
    mixed.filter((q) => q.__kind === "community"),
    viewerId,
    { kind: "community" }
  );
  const popularSerialized = await serializeQuotesForViewer(
    mixed.filter((q) => q.__kind === "popular"),
    viewerId,
    { kind: "popular" }
  );
  const communityMap = new Map(
    communitySerialized.map((q) => [q._id.toString(), q])
  );
  const popularMap = new Map(
    popularSerialized.map((q) => [q._id.toString(), q])
  );
  const serializedPosts = mixed
    .map((q) =>
      q.__kind === "popular"
        ? popularMap.get(q._id.toString())
        : communityMap.get(q._id.toString())
    )
    .filter(Boolean);
  const base = isOwnProfile
    ? user.toObject()
    : stripPrivateProfileFields(user.toObject());

  return {
    ...base,
    role: effectiveRole,
    authProvider: user.authProvider || "local",
    canChangePassword:
      isOwnProfile &&
      (user.authProvider !== "google"),
    // Follow graphs are loaded via paginated /followers and /following routes.
    followers: [],
    following: [],
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    postCount: user.postCount || communityTotal + popularTotal,
    communityPostCount: communityTotal,
    popularPostCount: popularTotal,
    postsType,
    canFilterPostTypes,
    posts: serializedPosts,
    postsPagination: paginatedResponse(
      "quotes",
      serializedPosts,
      totalPosts,
      page,
      limit
    ),
    isOwnProfile,
    isFollowing,
    needsUsername: isOwnProfile && !user.username,
    needsProfileDetails: isOwnProfile && isPrivateProfileIncomplete(user),
    profileKey: publicProfileKey(user),
  };
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, profilePic, bio } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const { errors, cleaned } = validatePrivateProfileInput(req.body, {
      requireAll: false,
    });
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    const pictureCheck = sanitizeProfilePicture(profilePic);
    if (!pictureCheck.ok) {
      return res.status(400).json({ message: pictureCheck.error });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { raw: verifyRaw, hash: verifyHash } = createEmailToken();

    const user = await User.create({
      name: String(name).trim().slice(0, 80),
      email: normalizedEmail,
      password: hashedPassword,
      profilePicture: pictureCheck.value || "/default-avatar.svg",
      bio: String(bio || "").slice(0, 500),
      role: resolveEffectiveRole(normalizedEmail),
      authProvider: "local",
      emailVerified: false,
      emailVerifyTokenHash: verifyHash,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      mobileNumber: cleaned.mobileNumber || "",
      dateOfBirth: cleaned.dateOfBirth || null,
      city: cleaned.city || "",
      state: cleaned.state || "",
      country: cleaned.country || "",
    });

    if (isTransactionalMailConfigured()) {
      try {
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          token: verifyRaw,
        });
      } catch (err) {
        console.error("[register-verify-mail]", err.message);
      }
    }

    res.status(201).json({
      message:
        "Account created. Please check your email to verify your address before logging in.",
      needsEmailVerification: true,
      email: user.email,
      profileComplete: !isPrivateProfileIncomplete(user),
    });
  } catch (error) {
    console.error("[register]", error.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, loginId } = req.body;
    if (typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Email/User ID and password are required" });
    }

    const rawId =
      typeof loginId === "string"
        ? loginId
        : typeof email === "string"
          ? email
          : "";
    const identifier = normalizeUsername(rawId);

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/User ID and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox or resend the verification link.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    res.json({
      token: createToken(user),
      user: await buildAuthUserPayload(user),
    });
  } catch (error) {
    console.error("[login]", error.message);
    res.status(500).json({ message: "Login failed" });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const raw = String(req.query.username || "");
    const format = validateUsernameFormat(raw);
    if (!format.valid) {
      return res.json({
        valid: false,
        available: false,
        message: format.message,
      });
    }

    const username = normalizeUsername(raw);
    const existing = await User.findOne({ username }).select("_id");

    if (existing && existing._id.toString() === req.user.id) {
      return res.json({
        valid: true,
        available: true,
        message: "This is your current User ID",
      });
    }

    if (existing) {
      return res.json({
        valid: true,
        available: false,
        message: "This User ID is already taken",
      });
    }

    res.json({
      valid: true,
      available: true,
      message: "User ID is available",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .replace(/^@/, "")
      .slice(0, 80);

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const contains = new RegExp(escaped, "i");
    const startsWith = new RegExp(`^${escaped}`, "i");

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1),
      200
    );

    const users = await User.find({
      $or: [{ name: contains }, { username: contains }],
    })
      .select("name username profilePicture bio")
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    // Prefer names/usernames that start with the typed letter(s).
    users.sort((a, b) => {
      const aName = a.name || "";
      const bName = b.name || "";
      const aUser = a.username || "";
      const bUser = b.username || "";
      const aPrefix =
        startsWith.test(aName) || startsWith.test(aUser) ? 0 : 1;
      const bPrefix =
        startsWith.test(bName) || startsWith.test(bUser) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    });

    res.json(
      users.map((user) => ({
        ...user,
        profileKey: publicProfileKey(user),
      }))
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const googleAuthStart = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      message:
        "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env",
    });
  }

  const state = createOAuthState();
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const client = getGoogleOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });

  res.redirect(url);
};

export const googleAuthCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const { code, error, state } = req.query;
    const cookieState = req.cookies?.oauth_state;
    res.clearCookie("oauth_state", { path: "/" });

    if (error || !code) {
      return res.redirect(`${frontendUrl}/login?error=google_denied`);
    }

    if (
      !state ||
      !cookieState ||
      String(state) !== String(cookieState) ||
      !consumeOAuthState(state)
    ) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(String(code));

    if (!tokens.id_token) {
      return res.redirect(`${frontendUrl}/login?error=google_no_token`);
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.redirect(`${frontendUrl}/login?error=google_invalid`);
    }

    const user = await findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });

    const token = createToken(user);
    const loginCode = createLoginCode(token);
    res.redirect(
      `${frontendUrl}/auth/callback?code=${encodeURIComponent(loginCode)}`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error.message);
    if (error.code === "ACCOUNT_EXISTS_PASSWORD") {
      return res.redirect(
        `${frontendUrl}/login?error=account_exists_use_password`
      );
    }
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

export const exchangeOAuthCode = async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim();
    const token = consumeLoginCode(code);
    if (!token) {
      return res.status(400).json({ message: "Invalid or expired login code" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      token,
      user: await buildAuthUserPayload(user),
    });
  } catch {
    res.status(400).json({ message: "Invalid or expired login code" });
  }
};

export const updateUser = async (req, res) => {
  try {
    // role / email / googleId are never accepted from the client
    const { name, profilePicture, bio, username } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = String(name).trim().slice(0, 80);
    if (profilePicture !== undefined) {
      const pictureCheck = sanitizeProfilePicture(profilePicture);
      if (!pictureCheck.ok) {
        return res.status(400).json({ message: pictureCheck.error });
      }
      user.profilePicture = pictureCheck.value;
    }
    if (bio !== undefined) user.bio = String(bio).slice(0, 500);

    const { errors, cleaned } = validatePrivateProfileInput(req.body, {
      requireAll: false,
    });
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    if (cleaned.email !== undefined) {
      // Email is immutable — login identity / security anchor.
      delete cleaned.email;
    }

    if (cleaned.mobileNumber !== undefined) {
      user.mobileNumber = cleaned.mobileNumber;
    }
    if (cleaned.dateOfBirth !== undefined) {
      user.dateOfBirth = cleaned.dateOfBirth;
    }
    if (cleaned.city !== undefined) user.city = cleaned.city;
    if (cleaned.state !== undefined) user.state = cleaned.state;
    if (cleaned.country !== undefined) user.country = cleaned.country;
    if (cleaned.instagram !== undefined) user.instagram = cleaned.instagram;

    if (username !== undefined) {
      const format = validateUsernameFormat(username);
      if (!format.valid) {
        return res.status(400).json({ message: format.message });
      }

      const normalized = normalizeUsername(username);
      const taken = await User.findOne({
        username: normalized,
        _id: { $ne: req.user.id },
      }).select("_id");

      if (taken) {
        return res
          .status(400)
          .json({ message: "This User ID is already taken" });
      }

      user.username = normalized;
    }

    if (!user.username) {
      return res.status(400).json({
        message: "User ID is required. Please set a unique User ID.",
      });
    }

    await user.save();
    // Skip following graph lookup — client already has it; speeds up profile edits.
    res.json(await buildAuthUserPayload(user, { skipFollowing: true }));
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        message:
          field === "email"
            ? "This email is already in use"
            : "This User ID is already taken",
      });
    }
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const target = await User.findById(req.params.id).select("_id");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    const created = await Follow.updateOne(
      { follower: req.user.id, following: req.params.id },
      { $setOnInsert: { follower: req.user.id, following: req.params.id } },
      { upsert: true }
    );

    if (created.upsertedCount > 0) {
      await Promise.all([
        User.updateOne({ _id: req.user.id }, { $inc: { followingCount: 1 } }),
        User.updateOne({ _id: req.params.id }, { $inc: { followerCount: 1 } }),
      ]);
    }

    res.json({
      message: "Followed successfully",
      following: true,
      targetId: req.params.id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const removed = await Follow.deleteOne({
      follower: req.user.id,
      following: req.params.id,
    });

    if (removed.deletedCount > 0) {
      await Promise.all([
        User.updateOne(
          { _id: req.user.id, followingCount: { $gt: 0 } },
          { $inc: { followingCount: -1 } }
        ),
        User.updateOne(
          { _id: req.params.id, followerCount: { $gt: 0 } },
          { $inc: { followerCount: -1 } }
        ),
      ]);
    }

    res.json({
      message: "Unfollowed successfully",
      following: false,
      targetId: req.params.id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const getProfile = async (req, res) => {
  try {
    // Fast path for auth sync / account page — no posts serialization.
    if (String(req.query.lite || "") === "1") {
      const user = await User.findById(req.user.id).select(
        "-password -googleId -emailVerifyTokenHash -emailVerifyExpires -passwordResetTokenHash -passwordResetExpires"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        ...(await buildAuthUserPayload(user, { skipFollowing: true })),
        isOwnProfile: true,
        profileKey: publicProfileKey(user),
      });
    }

    const bundle = await loadProfileBundle(req.user.id, req.user.id, req.query);
    if (!bundle) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(bundle);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = await findUserIdFromKey(req.params.id);
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    const bundle = await loadProfileBundle(userId, req.user.id, req.query);
    if (!bundle) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(bundle);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const listFollowers = async (req, res) => {
  try {
    const userId = req.params.id
      ? await findUserIdFromKey(req.params.id)
      : req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const filter = { following: userId };
    const [total, rows] = await Promise.all([
      Follow.countDocuments(filter),
      Follow.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("follower", USER_CARD_SELECT)
        .lean(),
    ]);
    const users = rows.map((row) => row.follower).filter(Boolean);
    res.json(paginatedResponse("users", users, total, page, limit));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};

export const listFollowing = async (req, res) => {
  try {
    const userId = req.params.id
      ? await findUserIdFromKey(req.params.id)
      : req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
    const filter = { follower: userId };
    const [total, rows] = await Promise.all([
      Follow.countDocuments(filter),
      Follow.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("following", USER_CARD_SELECT)
        .lean(),
    ]);
    const users = rows.map((row) => row.following).filter(Boolean);
    res.json(paginatedResponse("users", users, total, page, limit));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Request failed" });
  }
};
