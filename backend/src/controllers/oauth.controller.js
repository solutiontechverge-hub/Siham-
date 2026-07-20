import {
  generateAccessToken,
  generateRefreshToken,
} from "../helpers/jwt.helper.js";
import {
  isAppleOAuthConfigured,
  isGoogleOAuthConfigured,
  verifyAppleIdToken,
  verifyGoogleIdToken,
} from "../helpers/oauth.helper.js";
import { findOrCreateOAuthUser } from "../services/social-auth.service.js";

const buildLoginPayload = (user) => ({
  access_token: generateAccessToken(user),
  refresh_token: generateRefreshToken(user),
  user: {
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    is_email_verified: user.is_email_verified,
    is_active: user.is_active,
  },
});

const respondWithOAuthUser = (res, user) => {
  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      message: "User account is inactive.",
      data: null,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: buildLoginPayload(user),
  });
};

const handleOAuthError = (res, error) => {
  if (error.code === "EMAIL_ALREADY_REGISTERED") {
    return res.status(409).json({
      success: false,
      message:
        "An account with this email already exists. Please sign in with your email and password.",
      data: null,
    });
  }

  if (error.code === "EMAIL_REQUIRED") {
    return res.status(400).json({
      success: false,
      message:
        "Apple did not share your email. Remove Mollure from Apple ID settings and try again, or use email sign-in.",
      data: null,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Social login failed. Please try again.",
    data: {
      error: error.message,
    },
  });
};

export const loginWithGoogle = async (req, res) => {
  try {
    if (!isGoogleOAuthConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Google sign-in is not configured.",
        data: null,
      });
    }

    const { id_token: idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "id_token is required.",
        data: null,
      });
    }

    const identity = await verifyGoogleIdToken(idToken);

    if (!identity.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Google email address is not verified.",
        data: null,
      });
    }

    const { user } = await findOrCreateOAuthUser({
      provider: "google",
      subject: identity.subject,
      email: identity.email,
      emailVerified: true,
      firstName: identity.firstName,
      lastName: identity.lastName,
      displayName: identity.displayName,
    });

    return respondWithOAuthUser(res, user);
  } catch (error) {
    return handleOAuthError(res, error);
  }
};

export const loginWithApple = async (req, res) => {
  try {
    if (!isAppleOAuthConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Apple sign-in is not configured.",
        data: null,
      });
    }

    const { id_token: idToken, first_name: firstName, last_name: lastName } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "id_token is required.",
        data: null,
      });
    }

    const identity = await verifyAppleIdToken(idToken);
    const { user } = await findOrCreateOAuthUser({
      provider: "apple",
      subject: identity.subject,
      email: identity.email,
      emailVerified: identity.emailVerified || Boolean(identity.email),
      firstName: firstName || identity.firstName,
      lastName: lastName || identity.lastName,
      displayName: "",
    });

    return respondWithOAuthUser(res, user);
  } catch (error) {
    return handleOAuthError(res, error);
  }
};
