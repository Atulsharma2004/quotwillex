import jwt from "jsonwebtoken";

/** Access-token lifetime: one login stays valid for 3 days. */
export const ACCESS_TOKEN_EXPIRES_IN = "3d";

export const createAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { id: user._id, tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};
