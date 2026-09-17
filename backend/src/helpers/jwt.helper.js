import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET?.trim();
const refreshSecret = process.env.JWT_REFRESH_SECRET?.trim();

if (!jwtSecret || !refreshSecret) {
  throw new Error(
    "JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment (see backend/.env.example).",
  );
}

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

/** Longer refresh when the client opts into Remember Me. */
export const generateRememberRefreshToken = (user) =>
  jwt.sign(getPayload(user), refreshSecret, { expiresIn: "30d" });

export const generateAdminAccessToken = (admin) =>
  jwt.sign(getAdminPayload(admin), jwtSecret, { expiresIn: "5h" });

export const generateAdminRefreshToken = (admin) =>
  jwt.sign(getAdminPayload(admin), refreshSecret, { expiresIn: "7d" });

export const verifyAccessToken = (token) => jwt.verify(token, jwtSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);
