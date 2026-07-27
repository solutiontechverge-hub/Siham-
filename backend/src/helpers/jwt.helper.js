import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "development_jwt_secret_change_me";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || "development_refresh_secret_change_me";

const getPayload = (user) => ({
  id: user.id,
  email: user.email,
  user_type: user.user_type,
});

const getAdminPayload = (admin) => ({
  id: admin.id,
  email: admin.email,
  user_type: "admin",
  token_kind: "admin",
});

export const generateAccessToken = (user) =>
  jwt.sign(getPayload(user), jwtSecret, { expiresIn: "5h" });

export const generateRefreshToken = (user) =>
  jwt.sign(getPayload(user), refreshSecret, { expiresIn: "7d" });

export const generateAdminAccessToken = (admin) =>
  jwt.sign(getAdminPayload(admin), jwtSecret, { expiresIn: "5h" });

export const generateAdminRefreshToken = (admin) =>
  jwt.sign(getAdminPayload(admin), refreshSecret, { expiresIn: "7d" });

export const verifyAccessToken = (token) => jwt.verify(token, jwtSecret);
