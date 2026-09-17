import type { CalendarEvent } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import { isConfiguredColor } from "../../../../lib/calendarDesign.utils";
import type { CalendarDesignDraft } from "../CalendarDesignModal";

export function formatLateCancelNoticeLabel(
  cancellationBeforeHours: number | null | undefined,
  cancellationBeforeMinutes: number | null | undefined,
): string {
  const hours = Number(cancellationBeforeHours) || 0;
  const minutes = Number(cancellationBeforeMinutes) || 0;
  const windowLabel =
    hours && minutes
      ? `${hours}h ${minutes}m`
      : hours
        ? `${hours}h`
        : minutes
          ? `${minutes} min`
          : "24h";
  return `Fee applies after the required ${windowLabel} notice`;
}

export function calendarStatusToApiValue(
  status: CalendarEvent["status"],
):
  | "requested"
  | "cancelled"
  | "completed"
  | "confirmed"
  | "in_progress"
  | "no_show"
  | "invalid" {
  switch (status) {
    case "Requested":
      return "requested";
    case "Cancelled":
      return "cancelled";
    case "Completed":
      return "completed";
    case "In Progress":
      return "in_progress";
    case "No Show":
      return "no_show";
    case "Invalid":
      return "invalid";
    case "Confirmed":
    default:
      return "confirmed";
  }
}

export function emptyCalendarDesignDraft(): CalendarDesignDraft {
  return {
    scope: "Categories",
    colorsByCategory: {},
    colorsByService: {},
    colorsByStatus: {},
    colorsByTeamMember: {},
  };
}

export function resolveEventCategoryKey(
  event: CalendarEvent,
  serviceNameToCategoryKey: Readonly<Record<string, string>>,
): string | null {
  const candidates = [
    ...(event.details?.services?.map((service) => service.name) ?? []),
    event.title,
  ]
    .map((text) => String(text ?? "").trim())
    .filter(Boolean);

  for (const name of candidates) {
    const direct = serviceNameToCategoryKey[name];
    if (direct) return direct;
    const lower = name.toLowerCase();
    const matched = Object.entries(serviceNameToCategoryKey).find(
      ([serviceTitle]) => serviceTitle.toLowerCase() === lower,
    );
    if (matched) return matched[1];
  }
  return null;
}

export function lookupCategoryColor(
  categoryKey: string | null | undefined,
  colorsByCategory: Readonly<Record<string, string>> | undefined,
): string | undefined {
  if (!categoryKey) return undefined;
  const color = (colorsByCategory ?? {})[categoryKey];
  return isConfiguredColor(color) ? color : undefined;
}

export function resolveEventColors(
  event: CalendarEvent,
  appliedDesign: CalendarDesignDraft,
  serviceNameToCategoryKey: Readonly<Record<string, string>>,
): { serviceColor: string | undefined; statusColor: undefined } {
  const categoryKey = resolveEventCategoryKey(event, serviceNameToCategoryKey);
  const categoryColor = lookupCategoryColor(
    categoryKey,
    appliedDesign.colorsByCategory,
  );
  const serviceNames = [
    ...(event.details?.services?.map((service) => service.name) ?? []),
    event.title,
  ].filter(Boolean);
  const namedServiceColor = serviceNames
    .map((name) => appliedDesign.colorsByService?.[String(name)])
    .find((color) => isConfiguredColor(color));

  const cardColor =
    appliedDesign.scope === "Services"
      ? namedServiceColor ?? categoryColor
      : categoryColor;

  return {
    serviceColor: cardColor,
    statusColor: undefined,
  };
}
