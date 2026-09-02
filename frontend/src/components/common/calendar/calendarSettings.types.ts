import type { CalendarDesignDraft } from "./CalendarDesignModal";
import type {
  PublicBusinessHoursDraft,
  PublicBusinessHoursEntry,
} from "./CalendarPublicBusinessHoursModal";
import type { ServiceCategorySliderIconId } from "../../../data/businessServiceCategorySlider.data";
import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "../../../data/businessServiceCategorySlider.data";

export type DurationParts = { hours: string; minutes: string };

export type PublicHoursLocationSummary = {
  scheduleType: "fixed" | "variable";
  dayLabel: string;
  startTime: string;
  endTime: string;
};

export type PublicHoursSlot = {
  id: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  scheduleType: "fixed" | "variable";
  notAvailable?: boolean;
  note?: string;
};

export type PublicHoursLocationState = {
  slots: PublicHoursSlot[];
  selectedId: string;
};

export type PublicHoursState = {
  fixed: PublicHoursLocationState;
  desired: PublicHoursLocationState;
};

export type PublicHoursSummary = {
  fixed: PublicHoursLocationSummary;
  desired: PublicHoursLocationSummary;
};

export type BookingRulesLocation = {
  intervalBetweenBookings: DurationParts;
  minimumTimeslot?: DurationParts;
};

export type BookingRulesDraft = {
  fixed: BookingRulesLocation;
  desired: BookingRulesLocation & { minimumTimeslot: DurationParts };
};

export type ServiceOrderCategoryItem = {
  key: string;
  label: string;
  iconId: ServiceCategorySliderIconId;
};

export type CalendarSettingsAvailability = {
  publicBusinessHours?: PublicBusinessHoursEntry | PublicBusinessHoursEntry[];
  publicHoursSummary?: PublicHoursSummary;
  publicHoursState?: PublicHoursState;
  bookingRules?: BookingRulesDraft;
  serviceOrder?: { categoryKeys: readonly string[] };
};

export const defaultDuration = (): DurationParts => ({ hours: "01", minutes: "01" });

export const defaultPublicHoursSummary = (): PublicHoursSummary => ({
  fixed: { scheduleType: "fixed", dayLabel: "Today", startTime: "08:00", endTime: "18:00" },
  desired: { scheduleType: "variable", dayLabel: "Today", startTime: "08:00", endTime: "18:00" },
});

const createDefaultSlot = (scheduleType: "fixed" | "variable", summary: PublicHoursLocationSummary): PublicHoursSlot => ({
  id: `slot-${scheduleType}-default`,
  dayLabel: summary.dayLabel,
  startTime: summary.startTime,
  endTime: summary.endTime,
  scheduleType,
});

export const defaultPublicHoursState = (): PublicHoursState => {
  const summary = defaultPublicHoursSummary();
  const fixedSlot = createDefaultSlot("fixed", summary.fixed);
  const desiredSlot = createDefaultSlot("variable", summary.desired);
  return {
    fixed: { slots: [fixedSlot], selectedId: fixedSlot.id },
    desired: { slots: [desiredSlot], selectedId: desiredSlot.id },
  };
};

export const defaultBookingRules = (): BookingRulesDraft => ({
  fixed: { intervalBetweenBookings: defaultDuration() },
  desired: { intervalBetweenBookings: defaultDuration(), minimumTimeslot: defaultDuration() },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseDuration = (raw: unknown): DurationParts => {
  if (!isRecord(raw)) return defaultDuration();
  return {
    hours: String(raw.hours ?? "01").padStart(2, "0").slice(-2),
    minutes: String(raw.minutes ?? "01").padStart(2, "0").slice(-2),
  };
};

const parsePublicHoursLocation = (
  raw: unknown,
  fallback: PublicHoursLocationSummary,
): PublicHoursLocationSummary => {
  if (!isRecord(raw)) return fallback;
  return {
    scheduleType: raw.scheduleType === "variable" ? "variable" : "fixed",
    dayLabel: String(raw.dayLabel ?? fallback.dayLabel),
    startTime: String(raw.startTime ?? fallback.startTime),
    endTime: String(raw.endTime ?? fallback.endTime),
  };
};

export function formatPublicHoursLabel(summary: PublicHoursLocationSummary): string {
  const fmt = (time: string) => {
    const [hourRaw, minuteRaw] = time.split(":");
    const hour = Number(hourRaw);
    if (Number.isNaN(hour)) return time;
    const minute = minuteRaw ?? "00";
    return minute === "00" ? `${hour}:00` : `${hour}:${minute}`;
  };
  return `${summary.dayLabel}(${fmt(summary.startTime)} - ${fmt(summary.endTime)})`;
}

export function formatPublicHoursSlotLabel(slot: PublicHoursSlot): string {
  return formatPublicHoursLabel({
    scheduleType: slot.scheduleType,
    dayLabel: slot.dayLabel,
    startTime: slot.startTime,
    endTime: slot.endTime,
  });
}

const parsePublicHoursSlot = (raw: unknown, fallback: PublicHoursSlot): PublicHoursSlot => {
  if (!isRecord(raw)) return fallback;
  return {
    id: String(raw.id ?? fallback.id),
    dayLabel: String(raw.dayLabel ?? fallback.dayLabel),
    startTime: String(raw.startTime ?? fallback.startTime),
    endTime: String(raw.endTime ?? fallback.endTime),
    scheduleType: raw.scheduleType === "variable" ? "variable" : "fixed",
    notAvailable: Boolean(raw.notAvailable),
    note: raw.note ? String(raw.note) : undefined,
  };
};

const parsePublicHoursLocationState = (
  raw: unknown,
  fallback: PublicHoursLocationState,
): PublicHoursLocationState => {
  if (!isRecord(raw) || !Array.isArray(raw.slots)) return fallback;
  const slots = raw.slots.map((slot, index) =>
    parsePublicHoursSlot(slot, fallback.slots[index] ?? fallback.slots[0]),
  );
  const selectedId = String(raw.selectedId ?? slots[0]?.id ?? fallback.selectedId);
  return {
    slots: slots.length ? slots : fallback.slots,
    selectedId: slots.some((slot) => slot.id === selectedId) ? selectedId : slots[0]?.id ?? fallback.selectedId,
  };
};

export function publicHoursStateToSummary(state: PublicHoursState): PublicHoursSummary {
  const pick = (location: PublicHoursLocationState, scheduleType: "fixed" | "variable") => {
    const slot = location.slots.find((item) => item.id === location.selectedId) ?? location.slots[0];
    if (!slot) {
      const fallback = defaultPublicHoursSummary();
      return scheduleType === "fixed" ? fallback.fixed : fallback.desired;
    }
    return {
      scheduleType: slot.scheduleType,
      dayLabel: slot.dayLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  };
  return {
    fixed: pick(state.fixed, "fixed"),
    desired: pick(state.desired, "variable"),
  };
}

export function publicHoursSummaryToState(summary: PublicHoursSummary): PublicHoursState {
  return {
    fixed: {
      slots: [createDefaultSlot("fixed", summary.fixed)],
      selectedId: `slot-fixed-default`,
    },
    desired: {
      slots: [createDefaultSlot("variable", summary.desired)],
      selectedId: `slot-variable-default`,
    },
  };
}

export function appendPublicHoursFromDraft(
  draft: PublicBusinessHoursDraft,
  current: PublicHoursState,
): PublicHoursState {
  const locations =
    draft.location
      ? [draft.location]
      : draft.locations.length
        ? draft.locations
        : [];
  if (!locations.length) return current;
  return locations.reduce((state, location) => {
    const locationKey = location === "FL" ? "fixed" : "desired";
    const scheduleType =
      draft.schedule === "variable"
        ? "variable"
        : draft.schedule === "fixed"
          ? "fixed"
          : locationKey === "fixed"
            ? "fixed"
            : "variable";
    const dayRows =
      draft.days?.length
        ? draft.days
        : [
            {
              day: draft.day || "Monday",
              startTime: draft.startTime || "08:00",
              endTime: draft.endTime || "18:00",
              off: draft.notAvailable,
            },
          ];
    let nextState = state;
    for (const dayRow of dayRows) {
      const nextSlot: PublicHoursSlot = {
        id: `slot-${Date.now()}-${location}-${dayRow.day}`,
        dayLabel: dayRow.day,
        startTime: dayRow.startTime || "08:00",
        endTime: dayRow.endTime || "18:00",
        scheduleType,
        notAvailable: dayRow.off,
        note:
          scheduleType === "variable" ? draft.note || undefined : undefined,
      };
      const locationState = nextState[locationKey];
      const existingIndex = locationState.slots.findIndex(
        (slot) => slot.dayLabel === nextSlot.dayLabel,
      );
      const slots =
        existingIndex >= 0
          ? locationState.slots.map((slot, index) =>
              index === existingIndex ? { ...nextSlot, id: slot.id } : slot,
            )
          : [...locationState.slots, nextSlot];
      const selectedId =
        existingIndex >= 0 ? slots[existingIndex].id : nextSlot.id;
      nextState = {
        ...nextState,
        [locationKey]: { slots, selectedId },
      };
    }
    return nextState;
  }, current);
}

export function parseAvailability(raw: Record<string, unknown> | undefined): CalendarSettingsAvailability {
  if (!raw) return {};
  const defaults = defaultPublicHoursSummary();

  const publicHoursSummary: PublicHoursSummary | undefined = isRecord(raw.publicHoursSummary)
    ? {
        fixed: parsePublicHoursLocation(raw.publicHoursSummary.fixed, defaults.fixed),
        desired: parsePublicHoursLocation(raw.publicHoursSummary.desired, defaults.desired),
      }
    : undefined;

  const publicHoursState: PublicHoursState | undefined = isRecord(raw.publicHoursState)
    ? {
        fixed: parsePublicHoursLocationState(raw.publicHoursState.fixed, defaultPublicHoursState().fixed),
        desired: parsePublicHoursLocationState(raw.publicHoursState.desired, defaultPublicHoursState().desired),
      }
    : publicHoursSummary
      ? publicHoursSummaryToState(publicHoursSummary)
      : undefined;

  const bookingRules: BookingRulesDraft | undefined = isRecord(raw.bookingRules)
    ? {
        fixed: {
          intervalBetweenBookings: parseDuration(
            isRecord(raw.bookingRules.fixed) ? raw.bookingRules.fixed.intervalBetweenBookings : undefined,
          ),
        },
        desired: {
          intervalBetweenBookings: parseDuration(
            isRecord(raw.bookingRules.desired) ? raw.bookingRules.desired.intervalBetweenBookings : undefined,
          ),
          minimumTimeslot: parseDuration(
            isRecord(raw.bookingRules.desired) ? raw.bookingRules.desired.minimumTimeslot : undefined,
          ),
        },
      }
    : undefined;

  const serviceOrder = isRecord(raw.serviceOrder) && Array.isArray(raw.serviceOrder.categoryKeys)
    ? { categoryKeys: raw.serviceOrder.categoryKeys.map(String) }
    : undefined;

  const publicBusinessHours = isRecord(raw.publicBusinessHours)
    ? (raw.publicBusinessHours as unknown as PublicBusinessHoursEntry)
    : Array.isArray(raw.publicBusinessHours)
      ? (raw.publicBusinessHours as PublicBusinessHoursEntry[])
      : undefined;

  return { publicBusinessHours, publicHoursSummary, publicHoursState, bookingRules, serviceOrder };
}

export function parseDesign(raw: Record<string, unknown> | undefined): CalendarDesignDraft | undefined {
  if (!raw || !isRecord(raw)) return undefined;
  const colorsByCategory: Record<string, string> = {};
  if (isRecord(raw.colorsByCategory)) {
    for (const [key, value] of Object.entries(raw.colorsByCategory)) {
      const catalogEntry =
        BUSINESS_SERVICE_CATEGORY_CATALOG.find((entry) => entry.key === key) ??
        BUSINESS_SERVICE_CATEGORY_CATALOG.find((entry) => entry.label.toLowerCase() === key.toLowerCase()) ??
        BUSINESS_SERVICE_CATEGORY_CATALOG.find((entry) => entry.key === key.toLowerCase());
      const normalizedKey = catalogEntry?.key ?? key.toLowerCase();
      colorsByCategory[normalizedKey] = String(value);
    }
  }
  return {
    scope: "Categories",
    colorsByCategory,
  };
}

export function summaryFromPublicHoursDraft(
  draft: PublicBusinessHoursDraft,
  current: PublicHoursSummary,
): PublicHoursSummary {
  return publicHoursStateToSummary(appendPublicHoursFromDraft(draft, publicHoursSummaryToState(current)));
}

export function buildAvailabilityPayload(
  publicBusinessHours: PublicBusinessHoursEntry | PublicBusinessHoursEntry[],
  publicHoursState: PublicHoursState,
  bookingRules: BookingRulesDraft,
  serviceOrderKeys: readonly string[],
): CalendarSettingsAvailability {
  const publicHoursSummary = publicHoursStateToSummary(publicHoursState);
  return {
    publicBusinessHours,
    publicHoursSummary,
    publicHoursState,
    bookingRules,
    serviceOrder: { categoryKeys: [...serviceOrderKeys] },
  };
}
