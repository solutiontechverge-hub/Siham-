const BRAND_TEAL = "#0d9ea8";
const TEXT_PRIMARY = "#1a2b42";
const TEXT_MUTED = "#5c6778";
const TEXT_LIGHT = "#9aa3b2";
const CARD_BG = "#ffffff";
const DETAILS_BG = "#f3f5f7";
const FOOTER_BG = "#f7f9fb";

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

export const logoBlock = () => `
  <div style="text-align:center;padding:28px 24px 12px;">
    <span style="display:inline-block;width:28px;height:28px;background:${BRAND_TEAL};border-radius:50%;margin-right:8px;vertical-align:middle;"></span>
    <strong style="font-size:22px;color:${TEXT_PRIMARY};vertical-align:middle;">Mollure</strong>
  </div>`;

export const footerBlock = () => {
  const year = new Date().getFullYear();
  const address =
    process.env.MOLLURE_COMPANY_ADDRESS ||
    "123 Beauty Lane, Suite 100, Wellness City, 90210";
  const privacyUrl = `${getFrontendBaseUrl()}/privacy`;
  const unsubscribeUrl = `${getFrontendBaseUrl()}/clients/profile?tab=notifications`;

  return `
    <div style="background:${FOOTER_BG};padding:24px;text-align:center;margin-top:8px;">
      <p style="margin:0 0 8px;font-size:13px;color:${TEXT_MUTED};">f &nbsp; ig &nbsp; web</p>
      <p style="margin:0 0 4px;font-size:12px;color:${TEXT_LIGHT};">Mollure Inc. © ${year}. All Rights Reserved.</p>
      <p style="margin:0 0 12px;font-size:12px;color:${TEXT_LIGHT};">${escapeHtml(address)}</p>
      <p style="margin:0;font-size:12px;">
        <a href="${unsubscribeUrl}" style="color:${TEXT_MUTED};text-decoration:none;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="${privacyUrl}" style="color:${TEXT_MUTED};text-decoration:none;">Privacy Policy</a>
      </p>
    </div>`;
};

export const primaryButton = (label, href) => `
  <a href="${href}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
    ${escapeHtml(label)}
  </a>`;

export const secondaryButton = (label, href) => `
  <a href="${href}" style="display:inline-block;padding:14px 24px;background:#ffffff;color:${TEXT_PRIMARY};text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #d5dbe3;margin-right:12px;">
    ${escapeHtml(label)}
  </a>`;

export const wrapEmail = (innerHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#eef2f6;">
    ${logoBlock()}
    <div style="margin:0 16px 24px;background:${CARD_BG};border-radius:12px;box-shadow:0 4px 24px rgba(26,43,66,0.08);padding:32px 28px;text-align:center;">
      ${innerHtml}
    </div>
    ${footerBlock()}
  </div>
</body>
</html>`;

export const detailsBox = (rows) => {
  const items = rows
    .map(
      ({ label, value }) => `
    <p style="margin:0 0 10px;font-size:14px;color:${TEXT_PRIMARY};">
      <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
    </p>`,
    )
    .join("");

  return `
  <div style="background:${DETAILS_BG};border-radius:10px;padding:18px 20px;text-align:left;margin:20px 0;">
    ${items}
  </div>`;
};

export const statusIcon = (type) => {
  if (type === "confirmed") {
    return `<div style="width:52px;height:52px;border-radius:50%;background:${BRAND_TEAL};color:#fff;font-size:28px;line-height:52px;margin:0 auto 16px;">✓</div>`;
  }
  if (type === "cancelled") {
    return `<div style="width:52px;height:52px;border-radius:50%;background:#e53935;color:#fff;font-size:28px;line-height:52px;margin:0 auto 16px;">✕</div>`;
  }
  if (type === "reminder") {
    return `<div style="font-size:36px;margin:0 auto 16px;">🔔</div>`;
  }
  if (type === "info") {
    return `<div style="font-size:36px;margin:0 auto 16px;">ℹ️</div>`;
  }
  return "";
};

export const simpleEmail = ({ title, bodyHtml, ctaLabel, ctaHref, iconType }) => {
  const cta = ctaLabel && ctaHref ? primaryButton(ctaLabel, ctaHref) : "";
  const html = wrapEmail(`
    ${statusIcon(iconType)}
    <h1 style="margin:0 0 12px;font-size:24px;color:${TEXT_PRIMARY};">${escapeHtml(title)}</h1>
    <div style="font-size:14px;line-height:1.6;color:${TEXT_MUTED};text-align:left;">
      ${bodyHtml}
    </div>
    ${cta ? `<div style="margin-top:24px;">${cta}</div>` : ""}
  `);
  const text = `${title}\n${bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}${ctaHref ? `\n${ctaHref}` : ""}`;
  return { html, text };
};
