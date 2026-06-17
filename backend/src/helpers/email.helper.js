import nodemailer from "nodemailer";

const requiredEmailEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const placeholderValues = new Set([
  "",
  "smtp.example.com",
  "example@example.com",
  "your-email@example.com",
  "change-me",
]);

const isPlaceholderValue = (value) => {
  if (!value) {
    return true;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    placeholderValues.has(normalizedValue) ||
    normalizedValue.includes("example.com")
  );
};

const ensureEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);
  const hasPlaceholderConfig = requiredEmailEnv.some((key) =>
    isPlaceholderValue(process.env[key]),
  );

  return missing.length === 0 && !hasPlaceholderConfig;
};

const getTransporter = () => {
  if (!ensureEmailConfig()) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  const port = Number(process.env.SMTP_PORT);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  const isRealEmailConfig = ensureEmailConfig();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@localhost",
    to,
    subject,
    html,
    text,
  });

  if (!isRealEmailConfig) {
    console.warn(
      `[email] SMTP is not fully configured. Email was captured locally for ${to}: ${subject}`,
    );
  }

  return info;
};

export const sendVerificationEmail = async ({ email, token }) => {
  const frontendBaseUrl =
    process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || "http://localhost:3000";
  const verificationLink = `${frontendBaseUrl.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "Verify your email address",
    text: `Verify your email by opening this link: ${verificationLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <strong style="font-size: 22px; color: #1a2b42;">Mollure</strong>
        </div>
        <div style="background: #f7f9fb; border-radius: 12px; padding: 28px 24px; text-align: center;">
          <h2 style="margin: 0 0 12px; font-size: 24px; color: #1a2b42;">One Last Step To Get Started!</h2>
          <p style="margin: 0 0 20px; line-height: 1.6; color: #5c6778;">
            Welcome to Mollure! We are thrilled to have you. Please verify your email address to complete your registration and unlock all features.
          </p>
          <a href="${verificationLink}" style="display:inline-block;padding:14px 28px;background:#0d9ea8;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">
            Verify Your Email
          </a>
          <p style="margin: 20px 0 0; font-size: 13px; color: #7a8699;">
            If you did not sign up for this account, you can ignore this email.
          </p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #9aa3b2; text-align: center;">
          If the button does not work, copy this link:<br />
          <a href="${verificationLink}">${verificationLink}</a>
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetOtpEmail = async ({ email, otp }) => {
  await sendMail({
    to: email,
    subject: "Your password reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });
};
