import type { CalendarDesignDraft } from "../components/common/calendar/CalendarDesignModal";

const UNCONFIGURED_GRAY = "#9CA3AF";

export function isConfiguredColor(color: string | undefined): boolean {
  const trimmed = String(color ?? "").trim();
  return Boolean(trimmed && trimmed !== "#" && trimmed.toUpperCase() !== UNCONFIGURED_GRAY);
}

export function countConfiguredColors(
  map: Record<string, string | undefined> | undefined,
): number {
  return Object.values(map ?? {}).filter((color) => isConfiguredColor(color)).length;
}

export function countConfiguredAppearanceColors(
  design: CalendarDesignDraft,
  scope: "Categories" | "Services",
): number {
  const map =
    scope === "Services" ? design.colorsByService : design.colorsByCategory;
  return countConfiguredColors(map);
}

export function isAppearanceConfigured(design: CalendarDesignDraft): boolean {
  return (
    countConfiguredAppearanceColors(design, "Categories") > 0 ||
    countConfiguredAppearanceColors(design, "Services") > 0
  );
}

export function appearanceModeLabel(scope: CalendarDesignDraft["scope"]): string {
  return scope === "Services" ? "Service-based" : "Category-based";
}

export function normalizeCalendarDesignScope(
  scope: string | undefined,
): CalendarDesignDraft["scope"] {
  return scope === "Services" ? "Services" : "Categories";
}

export { UNCONFIGURED_GRAY };
