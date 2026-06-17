import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { dialCodeFromSelectValue, findCountryDialCode } from "../data/countryDialCodes";

export type PhoneValidationResult = {
  valid: boolean;
  message: string;
};

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d\s\-()]/g, "");
}

export function normalizeDialCode(value: string): string {
  return dialCodeFromSelectValue(value) || value.trim();
}

export function getIsoForDialCode(dialCode: string): CountryCode | undefined {
  const normalized = normalizeDialCode(dialCode);
  const entry = findCountryDialCode(normalized) ?? findCountryDialCode(dialCode);
  return entry?.iso as CountryCode | undefined;
}

export function validatePhoneForCountry(
  dialCode: string,
  phoneNumber: string,
  options: { required?: boolean } = { required: true },
): PhoneValidationResult {
  const code = normalizeDialCode(dialCode);
  const nationalDigits = phoneNumber.replace(/\D/g, "");

  if (!code) {
    return { valid: false, message: "Country code is required." };
  }

  if (!nationalDigits) {
    return options.required === false
      ? { valid: true, message: "" }
      : { valid: false, message: "Phone number is required." };
  }

  const iso = getIsoForDialCode(code);
  const candidates = [`${code}${nationalDigits}`, `+${nationalDigits}`];

  for (const candidate of candidates) {
    try {
      if (iso && isValidPhoneNumber(candidate, iso)) {
        return { valid: true, message: "" };
      }
      if (isValidPhoneNumber(candidate)) {
        return { valid: true, message: "" };
      }
    } catch {
      // try next candidate
    }
  }

  return { valid: false, message: "Enter a valid phone number for the selected country." };
}

export function getPhoneValidationErrors(
  dialCode: string,
  phoneNumber: string,
  options: { required?: boolean } = { required: true },
): { countryCode?: string; phone?: string } {
  const code = normalizeDialCode(dialCode);
  const errors: { countryCode?: string; phone?: string } = {};

  if (!code && options.required !== false) {
    errors.countryCode = "Country code is required.";
  }

  const phoneResult = validatePhoneForCountry(dialCode, phoneNumber, options);
  if (!phoneResult.valid && phoneResult.message) {
    if (phoneResult.message === "Country code is required.") {
      errors.countryCode = phoneResult.message;
    } else {
      errors.phone = phoneResult.message;
    }
  }

  return errors;
}

/** Validates phone when provided; skips when both code and number are empty. */
export function getOptionalPhoneValidationErrors(
  dialCode: string,
  phoneNumber: string,
): { countryCode?: string; phone?: string } {
  const hasPhone = phoneNumber.replace(/\D/g, "").length > 0;
  const hasCode = normalizeDialCode(dialCode).length > 0;
  if (!hasPhone && !hasCode) return {};
  return getPhoneValidationErrors(dialCode, phoneNumber, { required: true });
}
