import { body, param } from "express-validator";

/** Shared length / format caps — reject mismatches (do not coerce). */
export const LIMITS = {
  email: 254,
  personName: 80,
  passwordMin: 8,
  passwordMax: 128,
  phone: 32,
  otp: 6,
  subject: 200,
  messageMin: 10,
  messageMax: 5000,
  reviewBodyMin: 3,
  reviewBodyMax: 2000,
  textShort: 120,
  textMedium: 500,
  textLong: 5000,
  /** Human optional notes: min when non-empty; no app max (`max: null` on textBody). */
  notesMin: 5,
  uuid: 36,
};

const PERSON_NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const COC_RE = /^\d{8}$/;
const VAT_RE = /^NL\d{9}B\d{2}$/i;

export const emailBody = (field = "email", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .trim()
    .isString()
    .withMessage(`${field} must be a string.`)
    .isLength({ min: 3, max: LIMITS.email })
    .withMessage(`${field} must be 3–${LIMITS.email} characters.`)
    .isEmail()
    .withMessage(`A valid ${field} is required.`)
    .normalizeEmail();
};

export const passwordBody = (field = "password", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .isString()
    .withMessage(`${field} must be a string.`)
    .isLength({ min: LIMITS.passwordMin, max: LIMITS.passwordMax })
    .withMessage(
      `${field} must be ${LIMITS.passwordMin}–${LIMITS.passwordMax} characters.`,
    );
};

export const personNameBody = (field, { optional = false, label } = {}) => {
  const name = label || field;
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .trim()
    .isString()
    .withMessage(`${name} must be a string.`)
    .isLength({ min: 1, max: LIMITS.personName })
    .withMessage(`${name} must be 1–${LIMITS.personName} characters.`)
    .matches(PERSON_NAME_RE)
    .withMessage(`${name} format is invalid.`);
};

export const textBody = (
  field,
  { optional = false, min = optional ? 0 : 1, max = LIMITS.textMedium, label } = {},
) => {
  const name = label || field;
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  const unlimited = max == null;
  const lengthOpts = unlimited ? { min } : { min, max };
  const lengthMsg = unlimited
    ? min > 0
      ? `${name} must be at least ${min} characters.`
      : `${name} must be a string.`
    : min > 0
      ? `${name} must be ${min}–${max} characters.`
      : `${name} must be at most ${max} characters.`;
  return chain
    .trim()
    .isString()
    .withMessage(`${name} must be a string.`)
    .isLength(lengthOpts)
    .withMessage(lengthMsg);
};

export const otpBody = (field = "otp") =>
  body(field)
    .trim()
    .isString()
    .withMessage(`${field} must be a string.`)
    .matches(new RegExp(`^\\d{${LIMITS.otp}}$`))
    .withMessage(`${field} must be a ${LIMITS.otp}-digit code.`);

export const cocBody = (field = "ccc_number", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .trim()
    .matches(COC_RE)
    .withMessage(`${field} must be exactly 8 digits.`);
};

export const vatBody = (field = "vat_number", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .trim()
    .matches(VAT_RE)
    .withMessage(`${field} must match NL#########B##.`);
};

export const uuidParam = (field = "id") =>
  param(field).isUUID().withMessage(`${field} must be a valid UUID.`);

export const uuidBody = (field, { optional = false } = {}) => {
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain.isUUID().withMessage(`${field} must be a valid UUID.`);
};

/** UUID list (e.g. favorites). Rejects non-arrays and non-UUID entries. */
export const uuidArrayBody = (field, { max = 200 } = {}) =>
  body(field)
    .isArray({ max })
    .withMessage(`${field} must be an array of at most ${max} UUIDs.`)
    .custom((arr) => {
      if (!Array.isArray(arr)) return false;
      return arr.every(
        (id) =>
          typeof id === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
          ),
      );
    })
    .withMessage(`${field} entries must be valid UUIDs.`);

/**
 * Messaging thread ids: real UUID or draft:UUID / draft:setup-UUID.
 */
export const messagingThreadIdParam = (field = "threadId") =>
  param(field)
    .isString()
    .isLength({ min: 1, max: 80 })
    .matches(
      /^(?:draft:setup-[0-9a-f-]{36}|draft:[0-9a-f-]{36}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
    )
    .withMessage(`${field} must be a UUID or draft thread id.`);

export const enumBody = (field, values, { optional = false, label } = {}) => {
  const name = label || field;
  const chain = body(field);
  if (optional) chain.optional({ values: "falsy" });
  return chain
    .isIn(values)
    .withMessage(`${name} must be one of: ${values.join(", ")}.`);
};
