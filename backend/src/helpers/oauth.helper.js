import { OAuth2Client } from "google-auth-library";
import * as jose from "jose";

const appleJwks = jose.createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || "";

const getAppleClientId = () => process.env.APPLE_CLIENT_ID?.trim() || "";

export const isGoogleOAuthConfigured = () => Boolean(getGoogleClientId());

export const isAppleOAuthConfigured = () => Boolean(getAppleClientId());

export const verifyGoogleIdToken = async (idToken) => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error("Google OAuth is not configured.");
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error("Google token is missing required user information.");
  }

  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    displayName: payload.name || "",
  };
};

export const verifyAppleIdToken = async (idToken) => {
  const clientId = getAppleClientId();

  if (!clientId) {
    throw new Error("Apple OAuth is not configured.");
  }

  const { payload } = await jose.jwtVerify(idToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });

  if (!payload.sub) {
    throw new Error("Apple token is missing subject.");
  }

  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase() : "";

  return {
    subject: String(payload.sub),
    email,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    firstName: "",
    lastName: "",
    displayName: "",
  };
};
