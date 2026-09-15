/** Shared auth form validators (signup + professional setup). */
import { parseEmail, parsePersonName } from "./inputSchema";

export function isValidEmail(email: string): boolean {
  return parseEmail(email).ok;
}

/** Letters (incl. accented), spaces, apostrophes, hyphens — no digits. */
export function isValidPersonName(name: string): boolean {
  return parsePersonName(name).ok;
}

export { parseEmail, parsePersonName } from "./inputSchema";
