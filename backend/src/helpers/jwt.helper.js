import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "development_jwt_secret_change_me";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || "development_refresh_secret_change_me";

const getPayload = (user) => ({
  id: user.id,
  email: user.email,
  user_type: user.user_type,
});

export const generateAccessToken = (user) =>
  jwt.sign(getPayload(user), jwtSecret, { expiresIn: "15m" });

export const generateRefreshToken = (user) =>
  jwt.sign(getPayload(user), refreshSecret, { expiresIn: "7d" });

export const verifyAccessToken = (token) => jwt.verify(token, jwtSecret);
