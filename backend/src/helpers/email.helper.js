import nodemailer from "nodemailer";

const requiredEmailEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const ensureEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);
  return missing.length === 0;
};

const getTransporter = () => {
  if (!ensureEmailConfig()) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  });
};

export const sendVerificationEmail = async ({ email, token }) => {
  const appBaseUrl =
    process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const verificationLink = `${appBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "Verify your email address",
    text: `Verify your email by opening this link: ${verificationLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the button below.</p>
        <p>
          <a href="${verificationLink}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p>${verificationLink}</p>
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
