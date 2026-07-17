import nodemailer from "nodemailer";
import { buildVerifyEmailEmail } from "./authEmailTemplates.js";

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
  "your_smtp_username",
  "your_smtp_app_password",
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

const normalizeSmtpPass = (value) => String(value || "").replace(/\s+/g, "");

const ensureEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);
  const hasPlaceholderConfig = requiredEmailEnv.some((key) =>
    isPlaceholderValue(process.env[key]),
  );

  return missing.length === 0 && !hasPlaceholderConfig;
};

const hasResendConfig = () =>
  Boolean(process.env.RESEND_API_KEY) &&
  !isPlaceholderValue(process.env.RESEND_API_KEY);

let cachedTransporter = null;
let transportMode = null;
let initPromise = null;

const buildSmtpTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;
  const auth = {
    user: process.env.SMTP_USER,
    pass: normalizeSmtpPass(process.env.SMTP_PASS),
  };

  if (process.env.SMTP_HOST === "smtp.gmail.com") {
    return nodemailer.createTransport({
      service: "gmail",
      auth,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth,
    requireTLS: !secure,
  });
};

const buildEtherealTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendViaResend = async ({ to, subject, html, text }) => {
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    "Mollure <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return response.json();
};

export const initEmailTransport = async () => {
  if (hasResendConfig()) {
    transportMode = "resend";
    console.log("[email] Using Resend API for outbound email.");
    return { mode: transportMode };
  }

  if (ensureEmailConfig()) {
    const transporter = buildSmtpTransporter();

    try {
      await transporter.verify();
      cachedTransporter = transporter;
      transportMode = "smtp";
      console.log(`[email] SMTP ready (${process.env.SMTP_HOST}).`);
      return { mode: transportMode };
    } catch (error) {
      console.error(
        "[email] SMTP authentication failed:",
        error.message.split("\n")[0],
      );
      console.error(
        "[email] Gmail: create a new App Password at https://myaccount.google.com/apppasswords",
      );
      console.error(
        "[email] Or set RESEND_API_KEY in .env (https://resend.com) for reliable delivery.",
      );
    }
  } else {
    console.warn("[email] SMTP env vars are missing or still placeholders.");
  }

  if (process.env.NODE_ENV !== "production") {
    cachedTransporter = await buildEtherealTransporter();
    transportMode = "ethereal";
    console.warn(
      "[email] Dev fallback active: Ethereal test inbox (not delivered to real addresses).",
    );
    console.warn(
      "[email] After each send, open the preview URL printed in this terminal.",
    );
    return { mode: transportMode };
  }

  transportMode = "disabled";
  console.error(
    "[email] No working email transport. Configure RESEND_API_KEY or valid SMTP credentials.",
  );
  return { mode: transportMode };
};

export const ensureEmailTransport = async () => {
  if (transportMode) {
    return transportMode;
  }

  if (!initPromise) {
    initPromise = initEmailTransport();
  }

  await initPromise;
  return transportMode;
};

export const sendMail = async ({ to, subject, html, text }) => {
  await ensureEmailTransport();

  if (transportMode === "resend") {
    return sendViaResend({ to, subject, html, text });
  }

  if (transportMode === "disabled") {
    throw new Error(
      "Email transport is not configured. Set RESEND_API_KEY or valid SMTP credentials.",
    );
  }

  const transporter =
    cachedTransporter ||
    (ensureEmailConfig() ? buildSmtpTransporter() : nodemailer.createTransport({ jsonTransport: true }));

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.RESEND_FROM || "no-reply@localhost",
    to,
    subject,
    html,
    text,
  });

  if (transportMode === "ethereal") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[email] Preview for ${to}: ${previewUrl}`);
    }
  }

  if (transportMode === "json") {
    console.warn(
      `[email] SMTP is not fully configured. Email was captured locally for ${to}: ${subject}`,
    );
  }

  return info;
};

export const sendVerificationEmail = async ({ email, token }) => {
  const { html, text } = buildVerifyEmailEmail({ token });
  await sendMail({
    to: email,
    subject: "Please verify your email",
    html,
    text,
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
