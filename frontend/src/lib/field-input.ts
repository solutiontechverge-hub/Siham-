/** Whole numbers only (duration, percents that are integers). */
export function sanitizeDigitsInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Decimal amounts (price, fee %, km). Allows one dot. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, "")}`;
}

/** Person names: letters, spaces, hyphen, apostrophe, period. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^\p{L}\s.'’-]/gu, "");
}
