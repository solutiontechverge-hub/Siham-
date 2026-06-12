export type ListingDateMode = "today" | "any";
export type ListingTimePreset = "any" | "morning" | "noon" | "afternoon" | "evening";

export type ListingDateTimeFilter = {
  dateMode: ListingDateMode;
  date: string;
  timePreset: ListingTimePreset;
  timeFrom: string;
  timeTo: string;
};

export type CalendarPopoverValue = ListingDateTimeFilter | null;

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultListingDateTimeFilter(): ListingDateTimeFilter {
  return {
    dateMode: "today",
    date: todayIsoDate(),
    timePreset: "any",
    timeFrom: "",
    timeTo: "",
  };
}

const TIME_PRESET_LABELS: Record<ListingTimePreset, string> = {
  any: "any time",
  morning: "morning",
  noon: "noon",
  afternoon: "afternoon",
  evening: "evening",
};

export function formatListingDateTimeDisplay(value: CalendarPopoverValue): string {
  if (!value) return "";

  const dateLabel =
    value.dateMode === "today"
      ? "Today"
      : (() => {
          const [y, m, d] = value.date.split("-").map(Number);
          if (!y || !m || !d) return value.date;
          return new Date(y, m - 1, d).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        })();

  if (value.timeFrom || value.timeTo) {
    const from = value.timeFrom || "…";
    const to = value.timeTo || "…";
    return `${dateLabel}, ${from} – ${to}`;
  }

  if (value.timePreset !== "any") {
    return `${dateLabel}, ${TIME_PRESET_LABELS[value.timePreset]}`;
  }

  return dateLabel;
}

export function timePresetRange(preset: ListingTimePreset): { from: string; to: string } | null {
  switch (preset) {
    case "any":
      return null;
    case "morning":
      return { from: "00:00", to: "11:59" };
    case "noon":
      return { from: "12:00", to: "13:00" };
    case "afternoon":
      return { from: "13:01", to: "18:00" };
    case "evening":
      return { from: "18:01", to: "23:59" };
    default:
      return null;
  }
}
