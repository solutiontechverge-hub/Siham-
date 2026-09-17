"use client";

import * as React from "react";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  resolveServiceCategorySliderIconId,
  type ServiceCategorySliderIconId,
} from "../../../data/businessServiceCategorySlider.data";
import type { CalendarBookingLocation } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type {
  BookingRules,
  ServiceOrderSettings,
} from "./calendar-settings.types";
import { withClampedDesiredLocationInterval } from "./calendar-settings.types";
import type { CalendarDesignDraft } from "./CalendarDesignModal";
import { getCalendarDesignCategoryLabel } from "./CalendarDesignModal";
import {
  countConfiguredAppearanceColors,
  isAppearanceConfigured,
  isConfiguredColor,
  UNCONFIGURED_GRAY,
} from "../../../lib/calendarDesign.utils";
import type { TemplateCategoryRow } from "../../../lib/businessTemplateCatalog";
import type { PublicBusinessHoursEntry } from "./CalendarPublicBusinessHoursModal";
import {
  locationHasPublicHoursConfigured,
  offLabelForLocation,
  preferredScheduleForLocation,
  scheduleLabelForType,
  scheduleTypeForLocation,
  variableNoteForLocation,
} from "./CalendarPublicBusinessHoursModal";
import {
  dedupeServiceOrderSettings,
} from "./serviceOrder.utils";
import {
  CALENDAR_HOURS_RULES_COPY,
  WEEKDAY_ORDER,
} from "./calendarHoursRules.data";

export type AppearanceSummaryRow = {
  key: string;
  label: string;
  color: string;
  configured: boolean;
  kind: "category" | "service" | "group";
};

export type IndexedHoursEntry = {
  entry: PublicBusinessHoursEntry;
  index: number;
};

type HoursDropdownOption = {
  label: string;
  value: string;
  color?: string;
  sourceIds: string[];
};

function formatDisplayDate(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isSingleDateEntry(entry: PublicBusinessHoursEntry): boolean {
  return Boolean(entry.dateFrom && entry.dateFrom === (entry.dateTo || entry.dateFrom));
}

function isRangeEntry(entry: PublicBusinessHoursEntry): boolean {
  return Boolean(
    entry.dateFrom && entry.dateTo && entry.dateFrom !== entry.dateTo,
  );
}

function weekdaySortIndex(day: string | undefined): number {
  if (!day) return WEEKDAY_ORDER.length;
  const idx = WEEKDAY_ORDER.indexOf(
    day as (typeof WEEKDAY_ORDER)[number],
  );
  return idx >= 0 ? idx : WEEKDAY_ORDER.length;
}

function hoursOptionId(entry: PublicBusinessHoursEntry, index: number): string {
  return `${entry.location}-${entry.day}-${entry.dateFrom}-${entry.dateTo}-${entry.startTime}-${entry.endTime}-${index}`;
}

function hoursEntriesKey(entries: PublicBusinessHoursEntry[]): string {
  return entries.map((entry, index) => hoursOptionId(entry, index)).join("|");
}

function formatWeekdaySpan(days: readonly string[]): string {
  const ordered = WEEKDAY_ORDER.filter((day) => days.includes(day));
  if (!ordered.length || ordered.length === WEEKDAY_ORDER.length) return "";

  const spans: string[] = [];
  let start = 0;
  for (let i = 1; i <= ordered.length; i += 1) {
    const prev = WEEKDAY_ORDER.indexOf(ordered[i - 1]);
    const current =
      i < ordered.length ? WEEKDAY_ORDER.indexOf(ordered[i]) : Number.NaN;
    if (current !== prev + 1) {
      spans.push(
        start === i - 1
          ? ordered[start]
          : `${ordered[start]} – ${ordered[i - 1]}`,
      );
      start = i;
    }
  }
  return spans.join(", ");
}

function formatHoursTimeSpan(entry: PublicBusinessHoursEntry): {
  start: string;
  end: string;
  dateSpan: string;
  fromLabel: string;
} {
  const start = entry.startTime || "--:--";
  const end = entry.endTime || "--:--";
  const fromLabel = formatDisplayDate(entry.dateFrom);
  const toLabel = formatDisplayDate(entry.dateTo || entry.dateFrom);
  const dateSpan =
    fromLabel && toLabel && fromLabel !== toLabel
      ? `${fromLabel} – ${toLabel}`
      : fromLabel;
  return { start, end, dateSpan, fromLabel };
}

function formatHoursLabel(entry: PublicBusinessHoursEntry): string {
  const { start, end, dateSpan, fromLabel } = formatHoursTimeSpan(entry);
  const offLabel = offLabelForLocation(entry.location);
  const dayLabel = entry.day || CALENDAR_HOURS_RULES_COPY.dayFallback;

  if (entry.notAvailable) {
    // Weekly public hours are day-based (no date-range picker).
    if (!dateSpan) return `${dayLabel} (${offLabel})`;
    return `${entry.day ? `${entry.day} ` : ""}${dateSpan} (${offLabel})`;
  }

  if (isSingleDateEntry(entry)) {
    const dayPrefix = entry.day ? `${entry.day} ` : "";
    return `${dayPrefix}${fromLabel} (${start} - ${end})`;
  }

  if (isRangeEntry(entry)) {
    const day = entry.day || CALENDAR_HOURS_RULES_COPY.everyDay;
    return `${day} ${dateSpan} (${start} - ${end})`;
  }

  return `${dayLabel} (${start} - ${end})`;
}

function formatGroupedHoursLabel(
  days: readonly string[],
  entry: PublicBusinessHoursEntry,
): string {
  const { start, end, dateSpan } = formatHoursTimeSpan(entry);
  const daySpan = formatWeekdaySpan(days);
  const prefix = daySpan ? `${daySpan} ` : "";

  // Prefer weekday spans for the current weekly public-hours model.
  if (!dateSpan || (!entry.dateFrom && !entry.dateTo)) {
    return `${daySpan || entry.day || CALENDAR_HOURS_RULES_COPY.today} (${start} - ${end})`;
  }

  if (isRangeEntry(entry) && dateSpan) {
    return `${prefix}${dateSpan} (${start} - ${end})`.trim();
  }

  return `${prefix}${dateSpan} (${start} - ${end})`.trim();
}

function latestByKey(items: IndexedHoursEntry[]): IndexedHoursEntry[] {
  const latest = new Map<string, IndexedHoursEntry>();
  for (const item of items) {
    const key = item.entry.dateFrom
      ? `${item.entry.dateFrom}|${item.entry.dateTo || item.entry.dateFrom}`
      : `${item.entry.day}|${item.index}`;
    latest.set(key, item);
  }
  return [...latest.values()].sort((a, b) =>
    String(b.entry.dateFrom || "").localeCompare(String(a.entry.dateFrom || "")),
  );
}

function groupIdenticalWeekRows(
  weekRows: IndexedHoursEntry[],
): Array<{ days: string[]; item: IndexedHoursEntry; sourceIds: string[] }> {
  const groups: Array<{
    days: string[];
    item: IndexedHoursEntry;
    sourceIds: string[];
  }> = [];
  const groupIndex = new Map<string, number>();

  for (const item of weekRows) {
    const day = item.entry.day || "";
    const key = [
      item.entry.dateFrom,
      item.entry.dateTo,
      item.entry.startTime,
      item.entry.endTime,
    ].join("|");
    const existing = groupIndex.get(key);
    const sourceId = hoursOptionId(item.entry, item.index);
    if (existing != null) {
      if (day && !groups[existing].days.includes(day)) {
        groups[existing].days.push(day);
      }
      groups[existing].sourceIds.push(sourceId);
      continue;
    }
    groupIndex.set(key, groups.length);
    groups.push({
      days: day ? [day] : [],
      item,
      sourceIds: [sourceId],
    });
  }

  return groups;
}

function buildHoursDropdownOptions(
  entries: PublicBusinessHoursEntry[],
  colors: { override: string; notAvailable: string },
): HoursDropdownOption[] {
  if (!entries.length) {
    return [
      {
        label: CALENDAR_HOURS_RULES_COPY.noHoursSetYet,
        value: "empty",
        sourceIds: [],
      },
    ];
  }

  const indexed = entries.map((entry, index) => ({ entry, index }));
  const notAvailable = latestByKey(
    indexed.filter((item) => item.entry.notAvailable),
  );
  const singleDayOverrides = latestByKey(
    indexed.filter(
      (item) => !item.entry.notAvailable && isSingleDateEntry(item.entry),
    ),
  );
  const rangeOrWeek = indexed.filter(
    (item) => !item.entry.notAvailable && !isSingleDateEntry(item.entry),
  );

  const prominentDays = new Set<string>();
  for (const item of [...notAvailable, ...singleDayOverrides]) {
    if (item.entry.day) prominentDays.add(item.entry.day);
  }

  const uniqueWeek = new Map<string, IndexedHoursEntry>();
  for (const item of rangeOrWeek) {
    const day = item.entry.day || "all";
    if (day !== "all" && prominentDays.has(day)) continue;
    const spanKey = `${day}|${item.entry.dateFrom}|${item.entry.dateTo}`;

    const existing = uniqueWeek.get(spanKey);
    if (!existing) {
      uniqueWeek.set(spanKey, item);
      continue;
    }
    const existingIsRange = isRangeEntry(existing.entry);
    const nextIsRange = isRangeEntry(item.entry);
    if (nextIsRange || !existingIsRange) {
      uniqueWeek.set(spanKey, item);
    }
  }

  const datedDays = new Set<string>();
  for (const item of uniqueWeek.values()) {
    if (isRangeEntry(item.entry) && item.entry.day) {
      datedDays.add(item.entry.day);
    }
  }

  const weekRows = [...uniqueWeek.values()]
    .filter((item) => {
      if (isRangeEntry(item.entry) || !item.entry.day) return true;
      return !datedDays.has(item.entry.day);
    })
    .sort((a, b) => {
      const dateCmp = String(b.entry.dateFrom || "").localeCompare(
        String(a.entry.dateFrom || ""),
      );
      if (dateCmp !== 0) return dateCmp;
      return weekdaySortIndex(a.entry.day) - weekdaySortIndex(b.entry.day);
    });
  const weekGroups = groupIdenticalWeekRows(weekRows);
  for (const group of weekGroups) {
    const key = [
      group.item.entry.dateFrom,
      group.item.entry.dateTo,
      group.item.entry.startTime,
      group.item.entry.endTime,
    ].join("|");
    for (const item of rangeOrWeek) {
      const itemKey = [
        item.entry.dateFrom,
        item.entry.dateTo,
        item.entry.startTime,
        item.entry.endTime,
      ].join("|");
      if (itemKey !== key) continue;
      const id = hoursOptionId(item.entry, item.index);
      if (!group.sourceIds.includes(id)) group.sourceIds.push(id);
    }
  }

  const options: HoursDropdownOption[] = [
    ...notAvailable.map((item) => ({
      label: formatHoursLabel(item.entry),
      value: hoursOptionId(item.entry, item.index),
      color: colors.notAvailable,
      sourceIds: [hoursOptionId(item.entry, item.index)],
    })),
    ...singleDayOverrides.map((item) => ({
      label: formatHoursLabel(item.entry),
      value: hoursOptionId(item.entry, item.index),
      color: colors.override,
      sourceIds: [hoursOptionId(item.entry, item.index)],
    })),
    ...weekGroups.map((group) => ({
      label: formatGroupedHoursLabel(group.days, group.item.entry),
      value: `group-${group.sourceIds[0]}`,
      sourceIds: group.sourceIds,
    })),
  ];

  return options;
}

function pickLatestHoursOption(
  entries: PublicBusinessHoursEntry[],
  options: HoursDropdownOption[],
): string {
  if (!entries.length || !options.length) return options[0]?.value ?? "empty";
  const last = entries[entries.length - 1];
  const lastId = hoursOptionId(last, entries.length - 1);
  return (
    options.find((option) => option.sourceIds.includes(lastId))?.value ??
    options[0].value
  );
}

export function resolveCategoryMeta(category: string): {
  label: string;
  iconId: ServiceCategorySliderIconId;
} {
  const catalog = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
    (entry) =>
      entry.key === category ||
      entry.label.toLowerCase() === category.toLowerCase() ||
      resolveServiceCategorySliderIconId(category) === entry.iconId,
  );
  if (catalog) {
    return {
      label: catalog.label,
      iconId: catalog.iconId,
    };
  }
  return {
    label: category,
    iconId: resolveServiceCategorySliderIconId(category),
  };
}

export function reorderList<T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function useLocationHoursBlock({
  location,
  entries,
  colors,
}: {
  location: "FL" | "DL";
  entries: PublicBusinessHoursEntry[];
  colors: { override: string; notAvailable: string };
}) {
  const configured = locationHasPublicHoursConfigured(entries, location);
  // Use saved schedule when present so FL/DL can independently be Fixed or Variable.
  const scheduleType =
    scheduleTypeForLocation(entries, location) ||
    preferredScheduleForLocation(location);
  const scheduleLabel = scheduleLabelForType(scheduleType);
  const variableNote = variableNoteForLocation(entries, location);
  const showInfo = scheduleType === "variable";
  const infoTitle =
    variableNote || CALENDAR_HOURS_RULES_COPY.variableScheduleFallback;

  const options = buildHoursDropdownOptions(entries, colors);
  const entriesKey = hoursEntriesKey(entries);
  const [selectedId, setSelectedId] = React.useState(() =>
    pickLatestHoursOption(entries, options),
  );

  React.useEffect(() => {
    setSelectedId(pickLatestHoursOption(entries, options));
    // Re-select whenever the professional saves new hours, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesKey]);

  const dropdownValue = options.some((option) => option.value === selectedId)
    ? selectedId
    : options[0]?.value || "empty";

  return {
    configured,
    scheduleLabel,
    showInfo,
    infoTitle,
    options,
    dropdownValue,
    setSelectedId,
  };
}

type UseCalendarHoursRulesPanelArgs = {
  availableLocations: readonly CalendarBookingLocation[];
  bookingRules: BookingRules;
  publicBusinessHours?: readonly PublicBusinessHoursEntry[];
  serviceOrder: ServiceOrderSettings;
  appliedDesign: CalendarDesignDraft;
  categoryOptions?: readonly { key: string; label: string }[];
  templateCategoryRows?: readonly TemplateCategoryRow[];
  onBookingRulesChange: (next: BookingRules) => void;
  onSaveBookingRules: (next?: BookingRules) => Promise<void>;
  onSaveServiceOrder: () => Promise<void>;
};

export function useCalendarHoursRulesPanel({
  availableLocations,
  bookingRules,
  publicBusinessHours = [],
  serviceOrder,
  appliedDesign,
  categoryOptions = [],
  templateCategoryRows = [],
  onBookingRulesChange,
  onSaveBookingRules,
  onSaveServiceOrder,
}: UseCalendarHoursRulesPanelArgs) {
  const showFl = availableLocations.includes("FL");
  const showDl = availableLocations.includes("DL");
  const [appearanceExpanded, setAppearanceExpanded] = React.useState(false);

  const [bookingRulesEditing, setBookingRulesEditing] = React.useState(false);
  const [serviceOrderEditing, setServiceOrderEditing] = React.useState(false);
  const [draggingCategory, setDraggingCategory] = React.useState<string | null>(
    null,
  );
  const [draggingService, setDraggingService] = React.useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  const hoursEntries = React.useMemo(
    () => (Array.isArray(publicBusinessHours) ? publicBusinessHours : []),
    [publicBusinessHours],
  );
  const flEntries = React.useMemo(
    () => hoursEntries.filter((entry) => entry.location === "FL"),
    [hoursEntries],
  );
  const dlEntries = React.useMemo(
    () => hoursEntries.filter((entry) => entry.location === "DL"),
    [hoursEntries],
  );

  const categories = React.useMemo(
    () => dedupeServiceOrderSettings(serviceOrder).categories,
    [serviceOrder],
  );
  const activeCategory =
    selectedCategory && categories.includes(selectedCategory)
      ? selectedCategory
      : (categories[0] ?? null);
  const servicesForActive = React.useMemo(() => {
    if (!activeCategory) return [];
    const byCategory = serviceOrder.servicesByCategory ?? {};
    if (byCategory[activeCategory]?.length) return byCategory[activeCategory];
    const matchedKey = Object.keys(byCategory).find((key) => {
      const left = key.toLowerCase().trim();
      const right = activeCategory.toLowerCase().trim();
      return left === right || left.includes(right) || right.includes(left);
    });
    return matchedKey ? (byCategory[matchedKey] ?? []) : [];
  }, [activeCategory, serviceOrder.servicesByCategory]);

  const appearanceTemplateRows = React.useMemo(() => {
    if (templateCategoryRows.length) return templateCategoryRows;
    return categoryOptions.map((entry) => ({
      key: entry.key,
      label: entry.label,
      services: [] as string[],
    }));
  }, [templateCategoryRows, categoryOptions]);

  const appearanceConfiguredCount = countConfiguredAppearanceColors(
    appliedDesign,
    appliedDesign.scope === "Services" ? "Services" : "Categories",
  );

  const appearanceItems = React.useMemo(() => {
    const isServices = appliedDesign.scope === "Services";
    const rows: AppearanceSummaryRow[] = [];

    if (isServices) {
      for (const category of appearanceTemplateRows) {
        rows.push({
          key: `group:${category.key}`,
          label: category.label,
          color: UNCONFIGURED_GRAY,
          configured: false,
          kind: "group",
        });
        for (const serviceName of category.services) {
          const color = appliedDesign.colorsByService?.[serviceName];
          const configured = isConfiguredColor(color);
          rows.push({
            key: `service:${serviceName}`,
            label: serviceName,
            color: configured ? (color as string) : UNCONFIGURED_GRAY,
            configured,
            kind: "service",
          });
        }
      }
      return rows;
    }

    for (const category of appearanceTemplateRows) {
      const color = appliedDesign.colorsByCategory?.[category.key];
      const configured = isConfiguredColor(color);
      rows.push({
        key: category.key,
        label: getCalendarDesignCategoryLabel(category.key, categoryOptions),
        color: configured ? (color as string) : UNCONFIGURED_GRAY,
        configured,
        kind: "category",
      });
    }
    return rows;
  }, [appliedDesign, appearanceTemplateRows, categoryOptions]);

  const appearanceConfigured = isAppearanceConfigured(appliedDesign);
  const inactiveScope: CalendarDesignDraft["scope"] =
    appliedDesign.scope === "Services" ? "Categories" : "Services";
  const inactiveColorCount = countConfiguredAppearanceColors(
    appliedDesign,
    inactiveScope,
  );

  const handleBookingRulesEdit = () => {
    setBookingRulesEditing(true);
  };

  const handleServiceOrderEdit = () => {
    // Always edit on-page (template/platform defaults seed the list; never open a popup).
    setServiceOrderEditing(true);
  };

  const handleSaveBookingRules = async () => {
    try {
      const clamped = withClampedDesiredLocationInterval(bookingRules);
      if (clamped !== bookingRules) {
        onBookingRulesChange(clamped);
      }
      await onSaveBookingRules(clamped);
      setBookingRulesEditing(false);
    } catch {
      // Parent handlers already surface errors via snackbar.
    }
  };

  const handleSaveServiceOrder = async () => {
    try {
      await onSaveServiceOrder();
      setServiceOrderEditing(false);
    } catch {
      // Parent handlers already surface errors via snackbar.
    }
  };

  return {
    showFl,
    showDl,
    appearanceExpanded,
    setAppearanceExpanded,
    bookingRulesEditing,
    serviceOrderEditing,
    draggingCategory,
    setDraggingCategory,
    draggingService,
    setDraggingService,
    setSelectedCategory,
    flEntries,
    dlEntries,
    categories,
    activeCategory,
    servicesForActive,
    appearanceTemplateRows,
    appearanceConfiguredCount,
    appearanceItems,
    appearanceConfigured,
    inactiveScope,
    inactiveColorCount,
    handleBookingRulesEdit,
    handleServiceOrderEdit,
    handleSaveBookingRules,
    handleSaveServiceOrder,
  };
}
