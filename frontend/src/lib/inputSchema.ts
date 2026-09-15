/**
 * Strict input schemas: type / length / format.
 * Reject mismatches — do not sanitize into a "close enough" value.
 */

export const INPUT_LIMITS = {
  email: 254,
  personName: 80,
  passwordMin: 8,
  passwordMax: 128,
  phoneDigits: 15,
  otp: 6,
  subject: 200,
  messageMin: 10,
  messageMax: 5000,
  reviewBodyMin: 3,
  reviewBodyMax: 2000,
  textShort: 120,
  textMedium: 500,
  textLong: 5000,
  coc: 8,
  vat: 14,
  postalCode: 12,
  streetNumber: 20,
} as const;

export type ParseOk<T> = { ok: true; value: T };
export type ParseErr = { ok: false; error: string };
export type ParseResult<T = string> = ParseOk<T> | ParseErr;

function asString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return raw;
}

/** Email: required string, trimmed, format + max length. */
export function parseEmail(
  raw: unknown,
  opts: { required?: boolean; label?: string } = {},
): ParseResult {
  const label = opts.label ?? "Email";
  const required = opts.required !== false;
  const str = asString(raw);
  if (str === null) return { ok: false, error: `${label} must be a string.` };
  const value = str.trim().toLowerCase();
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (value.length > INPUT_LIMITS.email) {
    return {
      ok: false,
      error: `${label} must be at most ${INPUT_LIMITS.email} characters.`,
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false, error: `Enter a valid ${label.toLowerCase()} address.` };
  }
  return { ok: true, value };
}

/** Letters (incl. accented), spaces, apostrophes, hyphens — no digits. */
export function parsePersonName(
  raw: unknown,
  opts: { required?: boolean; label?: string; max?: number } = {},
): ParseResult {
  const label = opts.label ?? "Name";
  const required = opts.required !== false;
  const max = opts.max ?? INPUT_LIMITS.personName;
  const str = asString(raw);
  if (str === null) return { ok: false, error: `${label} must be a string.` };
  const value = str.trim();
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (value.length > max) {
    return { ok: false, error: `${label} must be at most ${max} characters.` };
  }
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value)) {
    return { ok: false, error: `Enter a valid ${label.toLowerCase()}.` };
  }
  return { ok: true, value };
}

/** Password length (+ optional strong check). Rejects non-strings and oversize. */
export function parsePassword(
  raw: unknown,
  opts: { required?: boolean; strong?: boolean; label?: string } = {},
): ParseResult {
  const label = opts.label ?? "Password";
  const required = opts.required !== false;
  const str = asString(raw);
  if (str === null) return { ok: false, error: `${label} must be a string.` };
  if (!str) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (str.length < INPUT_LIMITS.passwordMin) {
    return {
      ok: false,
      error: `${label} must be at least ${INPUT_LIMITS.passwordMin} characters.`,
    };
  }
  if (str.length > INPUT_LIMITS.passwordMax) {
    return {
      ok: false,
      error: `${label} must be at most ${INPUT_LIMITS.passwordMax} characters.`,
    };
  }
  if (opts.strong) {
    const hasLower = /[a-z]/.test(str);
    const hasUpper = /[A-Z]/.test(str);
    const hasDigit = /\d/.test(str);
    const hasSpecial = /[^A-Za-z0-9]/.test(str);
    if (!(hasLower && hasUpper && hasDigit && hasSpecial)) {
      return {
        ok: false,
        error: `${label} must include upper, lower, number, and special character.`,
      };
    }
  }
  return { ok: true, value: str };
}

/** Bounded trimmed string (type + length). */
export function parseText(
  raw: unknown,
  opts: {
    required?: boolean;
    label?: string;
    min?: number;
    max?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {},
): ParseResult {
  const label = opts.label ?? "Field";
  const required = opts.required !== false;
  const min = opts.min ?? (required ? 1 : 0);
  const max = opts.max ?? INPUT_LIMITS.textMedium;
  const str = asString(raw);
  if (str === null) return { ok: false, error: `${label} must be a string.` };
  const value = str.trim();
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (value.length < min) {
    return {
      ok: false,
      error: `${label} must be at least ${min} characters.`,
    };
  }
  if (value.length > max) {
    return {
      ok: false,
      error: `${label} must be at most ${max} characters.`,
    };
  }
  if (opts.pattern && !opts.pattern.test(value)) {
    return {
      ok: false,
      error: opts.patternMessage ?? `${label} format is invalid.`,
    };
  }
  return { ok: true, value };
}

export function parseOtp(
  raw: unknown,
  opts: { length?: number } = {},
): ParseResult {
  const length = opts.length ?? INPUT_LIMITS.otp;
  const str = asString(raw);
  if (str === null) return { ok: false, error: "OTP must be a string." };
  const value = str.trim();
  if (!new RegExp(`^\\d{${length}}$`).test(value)) {
    return {
      ok: false,
      error: `OTP must be a ${length}-digit code.`,
    };
  }
  return { ok: true, value };
}

export function parseCoc(raw: unknown, opts: { required?: boolean } = {}): ParseResult {
  return parseText(raw, {
    required: opts.required !== false,
    label: "COC number",
    min: INPUT_LIMITS.coc,
    max: INPUT_LIMITS.coc,
    pattern: /^\d{8}$/,
    patternMessage: "COC number must be exactly 8 digits.",
  });
}

export function parseVat(raw: unknown, opts: { required?: boolean } = {}): ParseResult {
  return parseText(raw, {
    required: opts.required !== false,
    label: "VAT number",
    min: 14,
    max: INPUT_LIMITS.vat,
    pattern: /^NL\d{9}B\d{2}$/i,
    patternMessage: "VAT must match NL#########B##.",
  });
}

export function parsePhoneDigits(
  raw: unknown,
  opts: { required?: boolean; label?: string } = {},
): ParseResult {
  const label = opts.label ?? "Phone number";
  const required = opts.required !== false;
  const str = asString(raw);
  if (str === null) return { ok: false, error: `${label} must be a string.` };
  const value = str.trim();
  if (!value) {
    return required
      ? { ok: false, error: `${label} is required.` }
      : { ok: true, value: "" };
  }
  if (!/^\d+$/.test(value)) {
    return { ok: false, error: `${label} must contain digits only.` };
  }
  if (value.length > INPUT_LIMITS.phoneDigits) {
    return {
      ok: false,
      error: `${label} must be at most ${INPUT_LIMITS.phoneDigits} digits.`,
    };
  }
  return { ok: true, value };
}

export function parseRating(raw: unknown): ParseResult<number> {
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return { ok: false, error: "Rating must be an integer." };
  }
  if (raw < 1 || raw > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }
  return { ok: true, value: raw };
}

/** Collect field parse results; reject if any fail. */
export function rejectInvalid<
  T extends Record<string, ParseOk<unknown> | ParseErr>,
>(
  fields: T,
):
  | {
      ok: true;
      values: {
        [K in keyof T]: Extract<T[K], ParseOk<unknown>>["value"];
      };
    }
  | { ok: false; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  const values = {} as {
    [K in keyof T]: Extract<T[K], ParseOk<unknown>>["value"];
  };

  (Object.keys(fields) as Array<keyof T>).forEach((key) => {
    const result = fields[key];
    if (result.ok) {
      values[key] = result.value as (typeof values)[typeof key];
    } else {
      errors[key] = result.error;
    }
  });

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, values };
}
