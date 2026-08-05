import { query } from "../db/index.js";
import { sendMail } from "../helpers/email.helper.js";
import {
  buildAccountApprovedEmail,
  buildAccountNotApprovedEmail,
  buildAccountUnderReviewEmail,
  buildContactAcknowledgmentEmail,
  buildContactReplyEmail,
  buildNotRegisteredProfessionalEmail,
  buildPostVerificationProEmail,
  buildSignupConfirmationEmail,
  buildStripeOnboardingEmail,
  buildVerifyEmailEmail,
} from "../helpers/authEmailTemplates.js";

export const AUTH_EMAIL_TYPES = {
  SIGNUP_CONFIRMATION: "signup_confirmation",
  VERIFY_EMAIL: "verify_email",
  POST_VERIFICATION_PRO: "post_verification_pro",
  ACCOUNT_UNDER_REVIEW: "account_under_review",
  ACCOUNT_APPROVED: "account_approved",
  ACCOUNT_NOT_APPROVED: "account_not_approved",
  STRIPE_ONBOARDING: "stripe_onboarding",
  NOT_REGISTERED_PROFESSIONAL: "not_registered_professional",
  CONTACT_ACKNOWLEDGMENT: "contact_acknowledgment",
  CONTACT_REPLY: "contact_reply",
};

const EMAIL_BUILDERS = {
  [AUTH_EMAIL_TYPES.SIGNUP_CONFIRMATION]: {
    subject: "Welcome to Mollure — sign-up confirmation",
    build: buildSignupConfirmationEmail,
  },
  [AUTH_EMAIL_TYPES.VERIFY_EMAIL]: {
    subject: "Please verify your email",
    build: buildVerifyEmailEmail,
  },
  [AUTH_EMAIL_TYPES.POST_VERIFICATION_PRO]: {
    subject: "Email verified — next steps",
    build: buildPostVerificationProEmail,
  },
  [AUTH_EMAIL_TYPES.ACCOUNT_UNDER_REVIEW]: {
    subject: "Your account is under review",
    build: buildAccountUnderReviewEmail,
  },
  [AUTH_EMAIL_TYPES.ACCOUNT_APPROVED]: {
    subject: "Your Mollure account has been approved",
    build: buildAccountApprovedEmail,
  },
  [AUTH_EMAIL_TYPES.ACCOUNT_NOT_APPROVED]: {
    subject: "Your Mollure account was not approved",
    build: buildAccountNotApprovedEmail,
  },
  [AUTH_EMAIL_TYPES.STRIPE_ONBOARDING]: {
    subject: "Complete your Stripe onboarding",
    build: buildStripeOnboardingEmail,
  },
  [AUTH_EMAIL_TYPES.NOT_REGISTERED_PROFESSIONAL]: {
    subject: "No registered professional record found",
    build: buildNotRegisteredProfessionalEmail,
  },
  [AUTH_EMAIL_TYPES.CONTACT_ACKNOWLEDGMENT]: {
    subject: "We received your message",
    build: buildContactAcknowledgmentEmail,
  },
  [AUTH_EMAIL_TYPES.CONTACT_REPLY]: {
    subject: "Reply from Mollure support",
    build: buildContactReplyEmail,
  },
};

const loadUserEmailContext = async (userId) => {
  const result = await query(
    `SELECT
       u.id,
       u.email,
       u.user_type,
       COALESCE(
         ip.display_name,
         NULLIF(TRIM(COALESCE(ip.first_name, '') || ' ' || COALESCE(ip.last_name, '')), ''),
         NULLIF(TRIM(COALESCE(pp.contact_first_name, '') || ' ' || COALESCE(pp.contact_last_name, '')), ''),
         NULLIF(TRIM(COALESCE(cp.contact_first_name, '') || ' ' || COALESCE(cp.contact_last_name, '')), ''),
         cp.legal_name,
         pp.legal_name,
         u.email
       ) AS display_name
     FROM users u
     LEFT JOIN individual_profiles ip ON ip.user_id = u.id
     LEFT JOIN professional_profiles pp ON pp.user_id = u.id
     LEFT JOIN company_profiles cp ON cp.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] || null;
};

const hasSentUserEmail = async (userId, emailType) => {
  try {
    const result = await query(
      `SELECT 1 FROM user_email_notifications WHERE user_id = $1 AND email_type = $2 LIMIT 1`,
      [userId, emailType],
    );
    return result.rowCount > 0;
  } catch {
    return false;
  }
};

const markUserEmailSent = async (userId, emailType) => {
  try {
    await query(
      `INSERT INTO user_email_notifications (user_id, email_type)
       VALUES ($1, $2)
       ON CONFLICT (user_id, email_type) DO NOTHING`,
      [userId, emailType],
    );
  } catch {
    // table may not exist before migration
  }
};

export const sendAuthEmail = async (userId, emailType, extras = {}, options = {}) => {
  const config = EMAIL_BUILDERS[emailType];
  if (!config) {
    throw new Error(`Unknown auth email type: ${emailType}`);
  }

  const ctx = await loadUserEmailContext(userId);
  if (!ctx?.email) {
    return { sent: false, reason: "user_or_email_not_found" };
  }

  const { html, text } = config.build({ displayName: ctx.display_name, ...extras });
  await sendMail({
    to: ctx.email,
    subject: config.subject,
    html,
    text,
  });

  if (!options.skipTracking) {
    await markUserEmailSent(userId, emailType);
  }

  return { sent: true, to: ctx.email };
};

export const sendAuthEmailOnce = async (userId, emailType, extras = {}) => {
  try {
    const alreadySent = await hasSentUserEmail(userId, emailType);
    if (alreadySent) {
      return { sent: false, reason: "already_sent" };
    }
    return await sendAuthEmail(userId, emailType, extras);
  } catch (error) {
    console.error(`[auth-email] Failed to send ${emailType} for user ${userId}:`, error.message);
    return { sent: false, reason: "error", error: error.message };
  }
};

export const sendDirectAuthEmail = async (email, emailType, extras = {}) => {
  const config = EMAIL_BUILDERS[emailType];
  if (!config) {
    throw new Error(`Unknown auth email type: ${emailType}`);
  }

  const { html, text } = config.build(extras);
  await sendMail({ to: email, subject: config.subject, html, text });
  return { sent: true, to: email };
};

export const notifySignupConfirmation = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.SIGNUP_CONFIRMATION);

export const notifyVerifyEmail = async (email, token) =>
  sendDirectAuthEmail(email, AUTH_EMAIL_TYPES.VERIFY_EMAIL, { token });

/** Sends only the verification email after password signup. Welcome/confirmation is sent after verify. */
export const sendSignupEmails = async (_userId, { email, token }) => {
  const results = {
    verification: { sent: false },
  };

  try {
    await notifyVerifyEmail(email, token);
    results.verification = { sent: true, to: email };
  } catch (error) {
    console.error(`[auth-email] Verification email failed for ${email}:`, error.message);
    results.verification = { sent: false, error: error.message };
  }

  return results;
};

export const notifyPostVerificationPro = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.POST_VERIFICATION_PRO);

export const notifyAccountUnderReview = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.ACCOUNT_UNDER_REVIEW);

export const notifyAccountApproved = async (userId) => {
  await sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.ACCOUNT_APPROVED);
  await sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.STRIPE_ONBOARDING);
};

export const notifyAccountNotApproved = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.ACCOUNT_NOT_APPROVED);

export const notifyStripeOnboarding = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.STRIPE_ONBOARDING);

export const notifyNotRegisteredProfessional = (userId) =>
  sendAuthEmailOnce(userId, AUTH_EMAIL_TYPES.NOT_REGISTERED_PROFESSIONAL);

export const notifyContactAcknowledgment = async (userId, { name, subject }) =>
  sendAuthEmail(userId, AUTH_EMAIL_TYPES.CONTACT_ACKNOWLEDGMENT, { name, subject }, { skipTracking: true });

export const notifyContactReply = async (userId, { name, subject, replyMessage }) => {
  const ctx = await loadUserEmailContext(userId);
  if (!ctx?.email) {
    return { sent: false, reason: "user_or_email_not_found" };
  }
  return sendDirectAuthEmail(ctx.email, AUTH_EMAIL_TYPES.CONTACT_REPLY, {
    name,
    subject,
    replyMessage,
  });
};

export const updateProfessionalValidation = async (userId, validationStatus) => {
  const result = await query(
    `UPDATE professional_profiles
     SET validation_status = $2
     WHERE user_id = $1
     RETURNING user_id, validation_status`,
    [userId, validationStatus],
  );

  if (!result.rows.length) {
    return { updated: false, reason: "professional_profile_not_found" };
  }

  if (validationStatus === "validated") {
    await notifyAccountApproved(userId);
  } else if (validationStatus === "not_validated") {
    await notifyAccountNotApproved(userId);
  }

  return { updated: true, validationStatus };
};
