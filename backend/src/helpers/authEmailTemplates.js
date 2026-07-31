import {
  detailsBox,
  escapeHtml,
  getFrontendBaseUrl,
  primaryButton,
  simpleEmail,
  wrapEmail,
} from "./emailLayout.js";

const buildVerificationLink = (token) =>
  `${getFrontendBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

const buildStripeOnboardingLink = () => `${getFrontendBaseUrl()}/professionals/finance`;

const buildLoginLink = () => `${getFrontendBaseUrl()}/auth/login`;

export const buildSignupConfirmationEmail = ({ displayName }) =>
  simpleEmail({
    title: "Sign-up confirmation",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Your email has been verified and your Mollure account is ready.
        Thank you for signing up — you can now log in and start using Mollure.
      </p>`,
    ctaLabel: "Go to Mollure",
    ctaHref: buildLoginLink(),
  });

export const buildVerifyEmailEmail = ({ token }) => {
  const verificationLink = buildVerificationLink(token);
  const html = wrapEmail(`
    <h2 style="margin:0 0 12px;font-size:24px;color:#1a2b42;">Please verify your email</h2>
    <p style="margin:0 0 20px;line-height:1.6;color:#5c6778;">
      Welcome to Mollure! Please verify your email address to complete your registration and unlock all features.
    </p>
    ${primaryButton("Verify Your Email", verificationLink)}
    <p style="margin:20px 0 0;font-size:13px;color:#7a8699;">
      If you did not sign up for this account, you can ignore this email.
    </p>
    <p style="margin-top:20px;font-size:12px;color:#9aa3b2;">
      If the button does not work, copy this link:<br />
      <a href="${verificationLink}">${verificationLink}</a>
    </p>
  `);
  return {
    html,
    text: `Please verify your email by opening this link: ${verificationLink}`,
  };
};

export const buildPostVerificationProEmail = ({ displayName }) =>
  simpleEmail({
    title: "Email verified",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Your email has been verified successfully. As a Mollure professional, your profile will now move to the next step of onboarding.
      </p>`,
    ctaLabel: "Continue onboarding",
    ctaHref: `${getFrontendBaseUrl()}/professionals`,
  });

export const buildAccountUnderReviewEmail = ({ displayName }) =>
  simpleEmail({
    title: "Thank you for your registration!",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Your account is under review. Our team is validating your professional details.
        We will notify you by email once your account has been reviewed.
      </p>`,
    ctaLabel: "View your profile",
    ctaHref: `${getFrontendBaseUrl()}/professionals/profile`,
  });

export const buildAccountApprovedEmail = ({ displayName }) =>
  simpleEmail({
    title: "Account approved",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Great news — your Mollure professional account has been validated and approved.
        You can now proceed with setting up payments and completing your business profile.
      </p>`,
    ctaLabel: "Go to dashboard",
    ctaHref: `${getFrontendBaseUrl()}/professionals`,
  });

export const buildAccountNotApprovedEmail = ({ displayName }) =>
  simpleEmail({
    title: "Account not approved",
    iconType: "cancelled",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        We are sorry to inform you that your Mollure professional account could not be approved at this time.
        If you believe this is a mistake, please contact us through the Contact Us form.
      </p>`,
    ctaLabel: "Contact support",
    ctaHref: `${getFrontendBaseUrl()}/contact-us`,
  });

export const buildStripeOnboardingEmail = ({ displayName }) =>
  simpleEmail({
    title: "Thank you for joining Mollure",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Your account has been validated. Please proceed to finalize your Stripe and Mollure onboarding
        so you can receive payments from clients.
      </p>`,
    ctaLabel: "Complete Stripe onboarding",
    ctaHref: buildStripeOnboardingLink(),
  });

export const buildNotRegisteredProfessionalEmail = ({ displayName }) =>
  simpleEmail({
    title: "No registered professional record found",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        We are sorry to inform you, but we found no record that you are a registered professional or salon on Mollure.
        If you would like to join as a professional, please complete registration on our platform.
      </p>`,
    ctaLabel: "Register as professional",
    ctaHref: `${getFrontendBaseUrl()}/auth/signup/professional`,
  });

export const buildContactAcknowledgmentEmail = ({ name, subject }) =>
  simpleEmail({
    title: "We received your message",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px;">
        Thank you for contacting Mollure. We have received your message regarding
        <strong>${escapeHtml(subject)}</strong> and will get back to you shortly.
      </p>
      <p style="margin:0;">Our support team typically responds within 1–2 business days.</p>`,
    ctaLabel: "Visit Mollure",
    ctaHref: getFrontendBaseUrl(),
  });

export const buildContactReplyEmail = ({ name, subject, replyMessage }) =>
  simpleEmail({
    title: "Reply from Mollure support",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px;">Regarding your inquiry: <strong>${escapeHtml(subject)}</strong></p>
      ${detailsBox([{ label: "Our reply", value: replyMessage }])}`,
    ctaLabel: "Sign in to Mollure",
    ctaHref: buildLoginLink(),
  });
