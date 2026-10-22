import {
  getUiPrefsSnapshot,
  patchUiPrefs,
} from "./uiPrefsStore";

export type ReviewerDisplayFormat = "first_name" | "full_name" | "initials";

function normalizeReviewerDisplayFormat(
  value: string | null | undefined,
): ReviewerDisplayFormat {
  if (value === "full_name" || value === "initials" || value === "first_name") {
    return value;
  }
  return "first_name";
}

/** Stored in users.ui_prefs (no localStorage). */
export function getReviewerDisplayFormat(): ReviewerDisplayFormat {
  return normalizeReviewerDisplayFormat(
    getUiPrefsSnapshot().reviewerDisplayFormat,
  );
}

export function setReviewerDisplayFormat(format: ReviewerDisplayFormat): void {
  patchUiPrefs({ reviewerDisplayFormat: format });
}
