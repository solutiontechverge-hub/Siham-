import { body } from "express-validator";

/**
 * Accepts empty / missing values, or URLs with or without http(s)://
 * (strict .isURL() rejects values like "example.com" and blocks multipart profile saves).
 */
function optionalWebUrl(field, label) {
  return body(field)
    .trim()
    .optional({ values: "falsy" })
    .custom((value) => {
      if (!value) return true;
      try {
        const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        const u = new URL(normalized);
        return Boolean(u.hostname);
      } catch {
        return false;
      }
    })
    .withMessage(`${label} must be a valid URL.`);
}

export const optionalWebsite = () => optionalWebUrl("website", "website");
export const optionalOtherLink = () => optionalWebUrl("other_link", "other_link");
