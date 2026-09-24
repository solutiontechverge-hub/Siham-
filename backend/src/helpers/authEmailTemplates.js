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

const buildStripeOnboardingLink = () =>
  `${getFrontendBaseUrl()}/auth/login?redirect=${encodeURIComponent("/professionals/finance/setting")}`;

const buildLoginLink = () => `${getFrontendBaseUrl()}/auth/login`;

export const buildSignupConfirmationEmail = ({ displayName }) =>
  simpleEmail({
    title: "Your Email Has Been Verified!",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Thank you for signing up. Your email has been verified and your Mollure account is ready.
        You can now log in and start using Mollure.
      </p>`,
    ctaLabel: "Go to Login",
    ctaHref: buildLoginLink(),
  });

export const buildVerifyEmailEmail = ({ token }) => {
  const verificationLink = buildVerificationLink(token);
  const html = wrapEmail(`
    <h2 style="margin:0 0 12px;font-size:24px;color:#1a2b42;">One Last Step To Get Started!</h2>
    <p style="margin:0 0 20px;line-height:1.6;color:#5c6778;">
      Welcome to Mollure! We are thrilled to have you. Please verify your email address to complete your registration and unlock all features.
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

export const buildChangeEmailVerifyEmail = ({ token, newEmail }) => {
  const verificationLink = buildVerificationLink(token);
  return simpleEmail({
    title: "Confirm your new email",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi there,</p>
      <p style="margin:0 0 12px;">
        Please confirm <strong>${escapeHtml(newEmail)}</strong> as the new email for your Mollure account.
        Your email will only change after you click the button below.
      </p>`,
    ctaLabel: "Confirm new email",
    ctaHref: verificationLink,
  });
};

export const buildEmailChangeAlertEmail = ({ newEmail }) =>
  simpleEmail({
    title: "Email change requested",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi there,</p>
      <p style="margin:0 0 12px;">
        Someone requested changing the email on your Mollure account to
        <strong>${escapeHtml(newEmail)}</strong>.
      </p>
      <p style="margin:0;">
        If this was you, no action is needed on this message — confirm the change from the new address.
        If you did not request this, sign in and change your password immediately, or contact support.
      </p>`,
    ctaLabel: "Sign in to Mollure",
    ctaHref: buildLoginLink(),
  });

export const buildAccountUnderReviewEmail = ({ displayName }) =>
  simpleEmail({
    title: "Your Email Has Been Verified!",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Thank you for your registration! Your account is under review.
        Our team is validating your professional details. We will notify you by email once your account has been reviewed.
      </p>`,
    ctaLabel: "Go to Login",
    ctaHref: buildLoginLink(),
  });

/** Alias — same pending copy as under-review (tracked email-type compatibility). */
export const buildPostVerificationProEmail = buildAccountUnderReviewEmail;

export const buildAccountApprovedEmail = ({ displayName }) =>
  simpleEmail({
    title: "Your Account is Approved!",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Thank you for joining Mollure. Your account has been validated.
        Please proceed to finalize your Stripe onboarding so you can receive payments from clients.
      </p>`,
    ctaLabel: "Finalize Stripe Onboarding",
    ctaHref: buildStripeOnboardingLink(),
  });

export const buildAccountNotApprovedEmail = ({ displayName }) =>
  simpleEmail({
    title: "Your Account is not Approved!",
    iconType: "cancelled",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        We are sorry to inform you but we found no record that you are a registered professional/salon.
        If you believe this is a mistake, please contact us through the Contact Us form.
      </p>`,
    ctaLabel: "Contact support",
    ctaHref: `${getFrontendBaseUrl()}/contact-us`,
  });

export const buildStripeOnboardingEmail = ({ displayName }) =>
  simpleEmail({
    title: "Welcome to Mollure",
    iconType: "confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        Congratulations! Your Mollure professional account has been validated.
        The next step is to connect your Stripe account to start receiving payments securely.
      </p>`,
    ctaLabel: "Finalize Stripe Onboarding",
    ctaHref: buildStripeOnboardingLink(),
  });

export const buildNotRegisteredProfessionalEmail = ({ displayName }) =>
  simpleEmail({
    title: "Your Account is not Approved!",
    iconType: "cancelled",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(displayName || "there")},</p>
      <p style="margin:0;">
        We are sorry to inform you, but we found no record that you are a registered professional or salon on Mollure.
        If you would like to join as a professional, please complete registration on our platform.
      </p>`,
    ctaLabel: "Register as professional",
    ctaHref: `${getFrontendBaseUrl()}/auth/signup/professional`,
  });

export const buildPasswordChangedEmail = () =>
  simpleEmail({
    title: "Your password was changed",
    iconType: "info",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi there,</p>
      <p style="margin:0 0 12px;">
        This is a confirmation that the password for your Mollure account was changed successfully.
      </p>
      <p style="margin:0;">
        If you did not make this change, please reset your password or contact support right away.
      </p>`,
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
