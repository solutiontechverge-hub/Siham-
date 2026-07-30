"use client";

import AppButton from "../AppButton";
import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import { BodyText, SubHeading } from "../../ui/typography";
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
import type { CalendarDesignDraft } from "./CalendarDesignModal";
import { getCalendarDesignServiceLabel } from "./CalendarDesignModal";
import type { PublicBusinessHoursEntry } from "./CalendarPublicBusinessHoursModal";
import CalendarServiceOrderCard from "./CalendarServiceOrderCard";
import {
  isCategoryVisibleInServiceOrder,
  isServiceVisibleInServiceOrder,
  toggleHiddenCategory,
  toggleHiddenService,
} from "./serviceOrder.utils";

type CalendarHoursRulesPanelProps = {
  availableLocations: readonly CalendarBookingLocation[];
  bookingRules: BookingRules;
  publicBusinessHours?: readonly PublicBusinessHoursEntry[];
  serviceOrder: ServiceOrderSettings;
  appliedDesign: CalendarDesignDraft;
  isSaving?: boolean;
  onBookingRulesChange: (next: BookingRules) => void;
  onServiceOrderChange: (next: ServiceOrderSettings) => void;
  onOpenDesign: () => void;
  onOpenPublicHours: (location?: CalendarBookingLocation) => void;
  onOpenServiceOrder: () => void;
  onSaveBookingRules: () => Promise<void>;
  onSaveServiceOrder: () => Promise<void>;
  onEditAppearanceColor: (key: string) => void;
  onRemoveAppearanceColor: (key: string) => void;
};

function SettingsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.15,
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
        }}
      >
        <SubHeading
          sx={{ fontSize: 15, fontWeight: 800, color: alpha(m.navy, 0.82) }}
        >
          {title}
        </SubHeading>
        {action}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function SetButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <AppButton
      tone="primary"
      disabled={disabled}
      onClick={onClick}
      sx={{
        fontSize: 12.5,
        minWidth: 58,
        height: 30,
        px: 1.75,
      }}
    >
      Set
    </AppButton>
  );
}

function EditSectionButton({
  active,
  onClick,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <IconButton
      size="small"
      disabled={disabled}
      onClick={onClick}
      aria-label={active ? "Editing section" : "Edit section"}
      sx={{
        width: 30,
        height: 30,
        borderRadius: "999px",
        border: `1px solid ${active ? alpha(m.teal, 0.35) : alpha(m.navy, 0.12)}`,
        bgcolor: active ? alpha(m.teal, 0.12) : "#fff",
        color: active ? m.teal : alpha(m.navy, 0.55),
      }}
    >
      <EditOutlinedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

function SectionSaveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <AppButton
      tone="primary"
      disabled={disabled}
      onClick={onClick}
      sx={{
        fontSize: 12.5,
        minWidth: 72,
        height: 30,
        px: 1.75,
      }}
    >
      Save
    </AppButton>
  );
}

function DurationInput({
  label,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  helperText,
  disabled,
}: {
  label: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  helperText?: string;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      bgcolor: "#fff",
      fontSize: 14,
      fontWeight: 700,
    },
    "& .MuiOutlinedInput-input": {
      py: 1.1,
      px: 1.5,
    },
  } as const;

  const sanitize = (raw: string) => raw.replace(/\D/g, "").slice(0, 2);

  return (
    <Box>
      <BodyText
        sx={{
          fontSize: 12.5,
          fontWeight: 700,
          color: alpha(m.navy, 0.72),
          mb: 0.85,
        }}
      >
        {label}
      </BodyText>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <AppTextField
          value={hours}
          onChange={(e) => onHoursChange(sanitize(e.target.value))}
          disabled={disabled}
          inputProps={{
            inputMode: "numeric",
            maxLength: 2,
            "aria-label": `${label} hours`,
          }}
          sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
        />
        <BodyText
          sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}
        >
          h
        </BodyText>
        <AppTextField
          value={minutes}
          onChange={(e) => onMinutesChange(sanitize(e.target.value))}
          disabled={disabled}
          inputProps={{
            inputMode: "numeric",
            maxLength: 2,
            "aria-label": `${label} minutes`,
          }}
          sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
        />
        <BodyText
          sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}
        >
          min
        </BodyText>
      </Stack>
      {helperText ? (
        <BodyText
          sx={{
            mt: 1,
            fontSize: 11.5,
            color: alpha(m.navy, 0.45),
            lineHeight: 1.45,
          }}
        >
          {helperText}
        </BodyText>
      ) : null}
    </Box>
  );
}

function LocationRulesCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 2,
        py: 1.75,
      }}
    >
      <BodyText
        sx={{
          fontSize: 13.5,
          fontWeight: 800,
          color: alpha(m.navy, 0.78),
          mb: 1.5,
        }}
      >
        {title}
      </BodyText>
      {children}
    </Box>
  );
}

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

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function weekdaySortIndex(day: string | undefined): number {
  if (!day) return WEEKDAY_ORDER.length;
  const idx = WEEKDAY_ORDER.indexOf(
    day as (typeof WEEKDAY_ORDER)[number],
  );
  return idx >= 0 ? idx : WEEKDAY_ORDER.length;
}

function formatHoursLabel(entry: PublicBusinessHoursEntry): string {
  const start = entry.startTime || "--:--";
  const end = entry.endTime || "--:--";
  const fromLabel = formatDisplayDate(entry.dateFrom);
  const toLabel = formatDisplayDate(entry.dateTo || entry.dateFrom);
  const dateSpan =
    fromLabel && toLabel && fromLabel !== toLabel
      ? `${fromLabel} – ${toLabel}`
      : fromLabel;

  // Off / not available — show specific date when present (pinned to top separately).
  if (entry.notAvailable) {
    if (dateSpan) {
      const dayPrefix = entry.day ? `${entry.day} ` : "";
      return `${dayPrefix}${dateSpan} (Not available)`;
    }
    return `${entry.day || "Day"} (Not available)`;
  }

  // Specific day override inside a range — show that date + changed time.
  if (isSingleDateEntry(entry)) {
    const dayPrefix = entry.day ? `${entry.day} ` : "";
    return `${dayPrefix}${fromLabel} (${start} - ${end})`;
  }

  // Date range schedule — weekday + start/end dates + time.
  if (isRangeEntry(entry)) {
    const day = entry.day || "Every day";
    return `${day} ${dateSpan} (${start} - ${end})`;
  }

  // Legacy weekday-only rows.
  return `${entry.day || "Today"} (${start} - ${end})`;
}

function hoursOptionId(entry: PublicBusinessHoursEntry, index: number): string {
  return `${entry.location}-${entry.day}-${entry.dateFrom}-${entry.dateTo}-${entry.startTime}-${entry.endTime}-${index}`;
}

function buildHoursDropdownOptions(
  entries: PublicBusinessHoursEntry[],
  colors: { override: string; notAvailable: string },
) {
  if (!entries.length) {
    return [{ label: "No hours set yet", value: "empty" }];
  }

  const indexed = entries.map((entry, index) => ({ entry, index }));
  const notAvailable = indexed.filter((item) => item.entry.notAvailable);
  const singleDayOverrides = indexed.filter(
    (item) => !item.entry.notAvailable && isSingleDateEntry(item.entry),
  );
  const rangeOrWeek = indexed.filter(
    (item) => !item.entry.notAvailable && !isSingleDateEntry(item.entry),
  );

  // Days already shown prominently at the top should not repeat in the week list.
  const prominentDays = new Set<string>();
  for (const item of [...notAvailable, ...singleDayOverrides]) {
    if (item.entry.day) prominentDays.add(item.entry.day);
  }

  // One clean week row per weekday (latest wins). Prefer dated ranges over legacy.
  const uniqueWeek = new Map<string, (typeof indexed)[number]>();
  for (const item of rangeOrWeek) {
    const day = item.entry.day || "all";
    if (day !== "all" && prominentDays.has(day)) continue;

    const existing = uniqueWeek.get(day);
    if (!existing) {
      uniqueWeek.set(day, item);
      continue;
    }
    // Prefer a real date-range row over a legacy day-only row.
    const existingIsRange = isRangeEntry(existing.entry);
    const nextIsRange = isRangeEntry(item.entry);
    if (nextIsRange || !existingIsRange) {
      uniqueWeek.set(day, item);
    }
  }

  const weekRows = [...uniqueWeek.values()].sort(
    (a, b) =>
      weekdaySortIndex(a.entry.day) - weekdaySortIndex(b.entry.day),
  );

  // Image-2 layout: changed/off days first (prominent), then the rest of the week.
  const ordered = [...notAvailable, ...singleDayOverrides, ...weekRows];

  return ordered.map(({ entry, index }) => ({
    label: formatHoursLabel(entry),
    value: hoursOptionId(entry, index),
    color: entry.notAvailable
      ? colors.notAvailable
      : isSingleDateEntry(entry)
        ? colors.override
        : undefined,
  }));
}

function LocationHoursBlock({
  title,
  scheduleLabel,
  entries,
  selectedId,
  onSelectedIdChange,
  showInfo,
}: {
  title: string;
  scheduleLabel: string;
  entries: PublicBusinessHoursEntry[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  showInfo?: boolean;
}) {
  const m = useTheme().palette.mollure;
  const options = buildHoursDropdownOptions(entries, {
    // Requested / changed-day accent (orange).
    override: m.requestAccent,
    // Delete / blocked accent (red).
    notAvailable: m.blockedTimeFg,
  });

  return (
    <Box
      sx={{
        borderRadius: "8px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 1.75,
        py: 1.5,
      }}
    >
      <BodyText
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: alpha(m.navy, 0.78),
          mb: 1.25,
        }}
      >
        {title}
      </BodyText>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ minWidth: 148 }}
        >
          <AccessTimeRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}
          >
            {scheduleLabel}
          </BodyText>
        </Stack>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <AppDropdown
            value={selectedId || options[0]?.value || "empty"}
            onChange={(val) => onSelectedIdChange(String(val))}
            options={options}
            fullWidth
            size="small"
            disabled={entries.length === 0}
          />
        </Box>
        {showInfo ? (
          <Tooltip title="Variable schedule applies to desired-location bookings.">
            <InfoOutlinedIcon sx={{ fontSize: 18, color: m.teal }} />
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );
}

function resolveCategoryMeta(category: string): {
  label: string;
  iconId: ServiceCategorySliderIconId;
} {
  const catalog = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
    (entry) =>
      entry.key === category ||
      entry.label.toLowerCase() === category.toLowerCase(),
  );
  if (catalog) {
    return {
      label: catalog.key === "hair" ? "Haar" : catalog.label,
      iconId: catalog.iconId,
    };
  }
  return {
    label: category,
    iconId: resolveServiceCategorySliderIconId(category),
  };
}

function reorderList<T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function CalendarHoursRulesPanel({
  availableLocations,
  bookingRules,
  publicBusinessHours = [],
  serviceOrder,
  appliedDesign,
  isSaving = false,
  onBookingRulesChange,
  onServiceOrderChange,
  onOpenDesign,
  onOpenPublicHours,
  onOpenServiceOrder,
  onSaveBookingRules,
  onSaveServiceOrder,
  onEditAppearanceColor,
  onRemoveAppearanceColor,
}: CalendarHoursRulesPanelProps) {
  const m = useTheme().palette.mollure;
  const showFl = availableLocations.includes("FL");
  const showDl = availableLocations.includes("DL");

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
  const [flHoursId, setFlHoursId] = React.useState("");
  const [dlHoursId, setDlHoursId] = React.useState("");

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

  React.useEffect(() => {
    if (flEntries.length && !flHoursId) {
      setFlHoursId(
        hoursOptionId(flEntries[flEntries.length - 1], flEntries.length - 1),
      );
    }
  }, [flEntries, flHoursId]);

  React.useEffect(() => {
    if (dlEntries.length && !dlHoursId) {
      setDlHoursId(
        hoursOptionId(dlEntries[dlEntries.length - 1], dlEntries.length - 1),
      );
    }
  }, [dlEntries, dlHoursId]);

  const categories = serviceOrder.categories ?? [];
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

  const appearanceItems = React.useMemo(() => {
    const withColor = ([, color]: [string, string | undefined]) =>
      Boolean(color && String(color).trim() && String(color).trim() !== "#");

    if (appliedDesign.scope === "Services") {
      return Object.entries(appliedDesign.colorsByService ?? {})
        .filter(withColor)
        .map(([key, color]) => ({
          key,
          label: key,
          color: color as string,
        }));
    }
    if (appliedDesign.scope === "Status") {
      return Object.entries(appliedDesign.colorsByStatus ?? {})
        .filter(withColor)
        .map(([key, color]) => ({
          key,
          label: key,
          color: color ?? "",
        }));
    }
    if (appliedDesign.scope === "Team Members") {
      return Object.entries(appliedDesign.colorsByTeamMember ?? {})
        .filter(withColor)
        .map(([key, color]) => ({
          key,
          label: key,
          color: color as string,
        }));
    }
    return Object.entries(appliedDesign.colorsByCategory ?? {})
      .filter(withColor)
      .map(([key, color]) => ({
        key,
        label: getCalendarDesignServiceLabel(key),
        color: color as string,
      }));
  }, [appliedDesign]);

  const handleBookingRulesEdit = () => {
    setBookingRulesEditing(true);
  };

  const handleServiceOrderEdit = () => {
    if (categories.length === 0) {
      onOpenServiceOrder();
      return;
    }
    setServiceOrderEditing(true);
  };

  const handleSaveBookingRules = async () => {
    try {
      await onSaveBookingRules();
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

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "2px",
        border: 0,
        boxShadow: "none",
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.35,
          bgcolor: alpha(m.navy, 0.04),
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
        }}
      >
        <SubHeading
          sx={{ fontSize: 18, fontWeight: 800, color: alpha(m.navy, 0.72) }}
        >
          Settings
        </SubHeading>
      </Box>

      <Stack spacing={1.75} sx={{ px: 2.5, py: 2.25 }}>
        <SettingsSection
          title="Public Hours"
          action={
            <SetButton
              disabled={isSaving}
              onClick={() =>
                onOpenPublicHours(showFl ? "FL" : showDl ? "DL" : undefined)
              }
            />
          }
        >
          <Stack spacing={1.25}>
            {showFl ? (
              <LocationHoursBlock
                title="Fixed Location"
                scheduleLabel="Fixed Schedule"
                entries={flEntries}
                selectedId={flHoursId}
                onSelectedIdChange={setFlHoursId}
              />
            ) : null}
            {showDl ? (
              <LocationHoursBlock
                title="Desired Location"
                scheduleLabel="Variable Schedule"
                entries={dlEntries}
                selectedId={dlHoursId}
                onSelectedIdChange={setDlHoursId}
                showInfo
              />
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title="Booking Rules"
          action={
            bookingRulesEditing ? (
              <SectionSaveButton
                disabled={isSaving}
                onClick={() => void handleSaveBookingRules()}
              />
            ) : (
              <EditSectionButton
                active={false}
                disabled={isSaving}
                onClick={handleBookingRulesEdit}
              />
            )
          }
        >
          <Stack spacing={1.25}>
            {showFl ? (
              <LocationRulesCard title="Fixed Location">
                <DurationInput
                  label="Interval Between Bookings"
                  hours={bookingRules.flIntervalHours}
                  minutes={bookingRules.flIntervalMinutes}
                  onHoursChange={(value) =>
                    onBookingRulesChange({
                      ...bookingRules,
                      flIntervalHours: value,
                    })
                  }
                  onMinutesChange={(value) =>
                    onBookingRulesChange({
                      ...bookingRules,
                      flIntervalMinutes: value,
                    })
                  }
                  helperText="Set the minimum time between consecutive bookings"
                  disabled={!bookingRulesEditing || isSaving}
                />
              </LocationRulesCard>
            ) : null}
            {showDl ? (
              <LocationRulesCard title="Desired Location">
                <Stack spacing={1.75}>
                  <DurationInput
                    label="Interval Between Bookings"
                    hours={bookingRules.dlIntervalHours}
                    minutes={bookingRules.dlIntervalMinutes}
                    onHoursChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlIntervalHours: value,
                      })
                    }
                    onMinutesChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlIntervalMinutes: value,
                      })
                    }
                    disabled={!bookingRulesEditing || isSaving}
                  />
                  <DurationInput
                    label="Minimum Timeslot"
                    hours={bookingRules.dlMinTimeslotHours}
                    minutes={bookingRules.dlMinTimeslotMinutes}
                    onHoursChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlMinTimeslotHours: value,
                      })
                    }
                    onMinutesChange={(value) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        dlMinTimeslotMinutes: value,
                      })
                    }
                    helperText="Minimum required team member time at DL location"
                    disabled={!bookingRulesEditing || isSaving}
                  />
                </Stack>
              </LocationRulesCard>
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title="Service Order Rules"
          action={
            serviceOrderEditing ? (
              <SectionSaveButton
                disabled={isSaving}
                onClick={() => void handleSaveServiceOrder()}
              />
            ) : (
              <EditSectionButton
                active={false}
                disabled={isSaving}
                onClick={handleServiceOrderEdit}
              />
            )
          }
        >
          {categories.length ? (
            <Stack spacing={2}>
              <Box>
                <BodyText
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                    mb: 0.5,
                  }}
                >
                  Select Categories
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.45),
                    mb: 1.1,
                    lineHeight: 1.4,
                  }}
                >
                  {serviceOrderEditing
                    ? "Check to show, uncheck to hide. Drag to change placement (1 appears first)."
                    : "Edit to show/hide categories and rearrange their order."}
                </BodyText>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    pb: 0.5,
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      borderRadius: 999,
                      bgcolor: alpha(m.navy, 0.12),
                    },
                  }}
                >
                  {categories.map((category, index) => {
                    const meta = resolveCategoryMeta(category);
                    const visible = isCategoryVisibleInServiceOrder(
                      serviceOrder,
                      category,
                    );
                    return (
                      <CalendarServiceOrderCard
                        key={category}
                        label={meta.label}
                        iconId={meta.iconId}
                        order={index + 1}
                        checked={visible}
                        showCheckbox={serviceOrderEditing}
                        active={false}
                        draggable={serviceOrderEditing}
                        isDragging={draggingCategory === category}
                        onCheckedChange={(nextChecked) => {
                          if (!serviceOrderEditing) return;
                          if (visible === nextChecked) return;
                          onServiceOrderChange(
                            toggleHiddenCategory(serviceOrder, category),
                          );
                        }}
                        onClick={
                          serviceOrderEditing
                            ? () => setSelectedCategory(category)
                            : undefined
                        }
                        onDragStart={() => setDraggingCategory(category)}
                        onDragEnd={() => setDraggingCategory(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (
                            !serviceOrderEditing ||
                            !draggingCategory ||
                            draggingCategory === category
                          )
                            return;
                          const from = categories.indexOf(draggingCategory);
                          const to = categories.indexOf(category);
                          if (from < 0 || to < 0) return;
                          onServiceOrderChange({
                            ...serviceOrder,
                            categories: reorderList(categories, from, to),
                          });
                          setDraggingCategory(null);
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              <Box>
                <BodyText
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                    mb: 0.5,
                  }}
                >
                  Services
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 11.5,
                    color: alpha(m.navy, 0.45),
                    mb: 1.1,
                    lineHeight: 1.4,
                  }}
                >
                  {serviceOrderEditing
                    ? "Check to show, uncheck to hide. Drag to rearrange within this category."
                    : activeCategory
                      ? `Services in ${resolveCategoryMeta(activeCategory).label}`
                      : "Select a category"}
                </BodyText>
                <Stack spacing={0.75}>
                  {servicesForActive.length ? (
                    servicesForActive.map((service, index) => {
                      const visible =
                        Boolean(activeCategory) &&
                        isServiceVisibleInServiceOrder(
                          serviceOrder,
                          activeCategory as string,
                          service,
                        );
                      return (
                        <Box
                          key={`${activeCategory}-${service}`}
                          draggable={serviceOrderEditing}
                          onDragStart={() => setDraggingService(service)}
                          onDragEnd={() => setDraggingService(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (
                              !serviceOrderEditing ||
                              !activeCategory ||
                              !draggingService ||
                              draggingService === service
                            ) {
                              return;
                            }
                            const list =
                              serviceOrder.servicesByCategory?.[
                                activeCategory
                              ] ?? servicesForActive;
                            const from = list.indexOf(draggingService);
                            const to = list.indexOf(service);
                            if (from < 0 || to < 0) return;
                            onServiceOrderChange({
                              ...serviceOrder,
                              servicesByCategory: {
                                ...serviceOrder.servicesByCategory,
                                [activeCategory]: reorderList(list, from, to),
                              },
                            });
                            setDraggingService(null);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            borderRadius: "6px",
                            border: `1px ${visible ? "solid" : "dashed"} ${alpha(m.navy, visible ? 0.08 : 0.14)}`,
                            bgcolor: visible
                              ? alpha(m.navy, 0.015)
                              : alpha(m.navy, 0.03),
                            px: 1.5,
                            py: 1,
                            cursor: serviceOrderEditing ? "grab" : "default",
                            opacity:
                              draggingService === service
                                ? 0.55
                                : visible
                                  ? 1
                                  : 0.55,
                            userSelect: "none",
                          }}
                        >
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "999px",
                              bgcolor: visible ? m.teal : alpha(m.navy, 0.28),
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                fontSize: 10,
                                fontWeight: 800,
                                lineHeight: 1,
                                transform: "translateY(0.5px)",
                              }}
                            >
                              {index + 1}
                            </Box>
                          </Box>
                          <BodyText
                            sx={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: 700,
                              color: alpha(m.navy, visible ? 0.72 : 0.45),
                            }}
                          >
                            {service}
                          </BodyText>
                          {serviceOrderEditing ? (
                            <Checkbox
                              size="small"
                              checked={visible}
                              disabled={!activeCategory}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation();
                                if (!activeCategory) return;
                                if (visible === event.target.checked) return;
                                onServiceOrderChange(
                                  toggleHiddenService(
                                    serviceOrder,
                                    activeCategory,
                                    service,
                                  ),
                                );
                              }}
                              inputProps={{
                                "aria-label": visible
                                  ? `Hide ${service}`
                                  : `Show ${service}`,
                              }}
                              sx={{
                                p: 0.35,
                                color: alpha(m.navy, 0.35),
                                "&.Mui-checked": { color: m.teal },
                              }}
                            />
                          ) : null}
                        </Box>
                      );
                    })
                  ) : (
                    <Box
                      sx={{
                        borderRadius: "6px",
                        border: `1px dashed ${alpha(m.navy, 0.12)}`,
                        px: 1.5,
                        py: 1.25,
                      }}
                    >
                      <BodyText
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: alpha(m.navy, 0.42),
                        }}
                      >
                        No services in this category
                      </BodyText>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Box
              sx={{
                borderRadius: "6px",
                border: `1px dashed ${alpha(m.navy, 0.14)}`,
                bgcolor: alpha(m.navy, 0.015),
                minHeight: 88,
                display: "grid",
                placeItems: "center",
                px: 2,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.42),
                  textAlign: "center",
                }}
              >
                Add services in setup to define booking order
              </BodyText>
            </Box>
          )}
        </SettingsSection>

        <SettingsSection
          title="Calendar Appearance"
          action={<SetButton disabled={isSaving} onClick={onOpenDesign} />}
        >
          {appearanceItems.length ? (
            <Stack spacing={1}>
              {appearanceItems.map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "center",
                    gap: 1.25,
                    borderRadius: "8px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: alpha(m.navy, 0.015),
                    px: 1.5,
                    py: 1.1,
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "4px",
                      bgcolor: item.color || alpha(m.navy, 0.12),
                      border: `1px solid ${alpha(m.navy, 0.14)}`,
                    }}
                  />
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.72),
                    }}
                  >
                    {item.label} colour {item.color}
                  </BodyText>
                  <IconButton
                    size="small"
                    onClick={() => onEditAppearanceColor(item.key)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveAppearanceColor(item.key)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      color: alpha(m.navy, 0.55),
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                borderRadius: "6px",
                border: `1px dashed ${alpha(m.navy, 0.14)}`,
                bgcolor: alpha(m.navy, 0.015),
                minHeight: 120,
                display: "grid",
                placeItems: "center",
                px: 2,
              }}
            >
              <BodyText
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.42),
                  textAlign: "center",
                }}
              >
                Customize Your Calendar Based On Categories Or Services
              </BodyText>
            </Box>
          )}
        </SettingsSection>
      </Stack>
    </Paper>
  );
}
