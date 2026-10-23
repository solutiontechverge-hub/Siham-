import {
  DEFAULT_REVIEWER_DISPLAY_FORMAT,
  type ReviewerDisplayFormat,
} from "./reviewerDisplayName";

const REVIEWER_FORMAT_STORAGE_KEY = "mollure:reviewer_display_format";
const REVIEWER_FORMAT_EVENT = "mollure:reviewer-display-format-changed";

const VALID_FORMATS = new Set<ReviewerDisplayFormat>(["first_name", "full_name", "initials"]);

function normalizeReviewerDisplayFormat(value: string | null | undefined): ReviewerDisplayFormat {
  if (value && VALID_FORMATS.has(value as ReviewerDisplayFormat)) {
    return value as ReviewerDisplayFormat;
  }
  return DEFAULT_REVIEWER_DISPLAY_FORMAT;
}

export function getReviewerDisplayFormat(): ReviewerDisplayFormat {
  if (typeof window === "undefined") return DEFAULT_REVIEWER_DISPLAY_FORMAT;
  try {
    return normalizeReviewerDisplayFormat(window.localStorage.getItem(REVIEWER_FORMAT_STORAGE_KEY));
  } catch {
    return DEFAULT_REVIEWER_DISPLAY_FORMAT;
  }
}

export function setReviewerDisplayFormat(format: ReviewerDisplayFormat): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVIEWER_FORMAT_STORAGE_KEY, format);
    window.dispatchEvent(new CustomEvent(REVIEWER_FORMAT_EVENT, { detail: format }));
  } catch {
    // ignore storage failures
  }
}

export function subscribeReviewerDisplayFormat(listener: (format: ReviewerDisplayFormat) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== REVIEWER_FORMAT_STORAGE_KEY) return;
    listener(normalizeReviewerDisplayFormat(event.newValue));
  };

  const onCustom = (event: Event) => {
    listener(normalizeReviewerDisplayFormat((event as CustomEvent<ReviewerDisplayFormat>).detail));
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(REVIEWER_FORMAT_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(REVIEWER_FORMAT_EVENT, onCustom);
  };
}
