"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Button, IconButton, Paper, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import { BodyText, SubHeading } from "../../ui/typography";
import { BUSINESS_SERVICE_CATEGORY_CATALOG } from "../../../data/businessServiceCategorySlider.data";
import type { CalendarDesignDraft } from "./CalendarDesignModal";
import { getCalendarDesignServiceLabel } from "./CalendarDesignModal";
import CalendarServiceOrderCard from "./CalendarServiceOrderCard";
import {
  type BookingRulesDraft,
  type DurationParts,
  type PublicHoursState,
  formatPublicHoursSlotLabel,
} from "./calendarSettings.types";

type CalendarSettingsPanelProps = {
  supportedLocations: readonly ("FL" | "DL")[];
  publicHoursState: PublicHoursState;
  onPublicHoursStateChange: (next: PublicHoursState) => void;
  bookingRules: BookingRulesDraft;
  onBookingRulesChange: (next: BookingRulesDraft) => void;
  serviceOrderKeys: readonly string[];
  onServiceOrderKeysChange: (next: readonly string[]) => void;
  appliedDesign: CalendarDesignDraft;
  onOpenPublicBusinessHours: (location: "FL" | "DL") => void;
  onOpenDesign: () => void;
  onEditServiceColor: (serviceKey: string) => void;
  onRemoveServiceColor: (serviceKey: string) => void;
  onSaveBookingRules: () => Promise<void>;
  onSaveServiceOrder: () => Promise<void>;
  isSaving?: boolean;
};

const DEFAULT_CATEGORY_KEYS = BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => entry.key);

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
        borderRadius: "4px",
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
          py: 1.1,
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
        }}
      >
        <SubHeading sx={{ fontSize: 15, fontWeight: 800, color: alpha(m.navy, 0.82) }}>{title}</SubHeading>
        {action}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function SetButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const m = useTheme().palette.mollure;
  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled}
      onClick={onClick}
      sx={{
        borderRadius: "6px",
        textTransform: "none",
        fontWeight: 800,
        fontSize: 12.5,
        minWidth: 58,
        height: 30,
        px: 1.75,
        bgcolor: m.teal,
        "&:hover": { bgcolor: m.tealDark },
      }}
    >
      Set
    </Button>
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
      aria-label={active ? "Save changes" : "Edit section"}
      sx={{
        width: 30,
        height: 30,
        borderRadius: "6px",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        bgcolor: active ? alpha(m.teal, 0.1) : "#fff",
        color: active ? m.teal : alpha(m.navy, 0.55),
      }}
    >
      <EditOutlinedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

function DurationInput({
  label,
  value,
  onChange,
  helperText,
  disabled,
}: {
  label: string;
  value: DurationParts;
  onChange: (next: DurationParts) => void;
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
    "& .MuiInputLabel-root": {
      fontSize: 12.5,
      fontWeight: 700,
      color: alpha(m.navy, 0.72),
    },
  } as const;

  const setPart = (part: keyof DurationParts, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    onChange({ ...value, [part]: digits.padStart(2, "0") });
  };

  return (
    <Box>
      <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72), mb: 0.85 }}>{label}</BodyText>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <AppTextField
          value={value.hours}
          onChange={(e) => setPart("hours", e.target.value)}
          disabled={disabled}
          inputProps={{ inputMode: "numeric", maxLength: 2, "aria-label": `${label} hours` }}
          sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
        />
        <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}>h</BodyText>
        <AppTextField
          value={value.minutes}
          onChange={(e) => setPart("minutes", e.target.value)}
          disabled={disabled}
          inputProps={{ inputMode: "numeric", maxLength: 2, "aria-label": `${label} minutes` }}
          sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
        />
        <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}>min</BodyText>
      </Stack>
      {helperText ? (
        <BodyText sx={{ mt: 1, fontSize: 11.5, color: alpha(m.navy, 0.45), lineHeight: 1.45 }}>{helperText}</BodyText>
      ) : null}
    </Box>
  );
}

function BookingRulesLocationCard({
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
      <BodyText sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.78), mb: 1.5 }}>{title}</BodyText>
      {children}
    </Box>
  );
}

function LocationBlock({
  title,
  scheduleLabel,
  scheduleOptions,
  scheduleValue,
  onScheduleChange,
  showInfo,
}: {
  title: string;
  scheduleLabel: string;
  scheduleOptions: Array<{ label: string; value: string }>;
  scheduleValue: string;
  onScheduleChange: (value: string) => void;
  showInfo?: boolean;
}) {
  const m = useTheme().palette.mollure;
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
      <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.78), mb: 1.25 }}>{title}</BodyText>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 148 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 18, color: m.teal }} />
          <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}>{scheduleLabel}</BodyText>
        </Stack>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <AppDropdown
            value={scheduleValue}
            onChange={(val) => onScheduleChange(String(val))}
            options={scheduleOptions}
            fullWidth
            size="small"
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

function reorderKeys(keys: readonly string[], fromKey: string, toKey: string) {
  const next = [...keys];
  const fromIndex = next.indexOf(fromKey);
  const toIndex = next.indexOf(toKey);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return keys;
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromKey);
  return next;
}

export default function CalendarSettingsPanel({
  supportedLocations,
  publicHoursState,
  onPublicHoursStateChange,
  bookingRules,
  onBookingRulesChange,
  serviceOrderKeys,
  onServiceOrderKeysChange,
  appliedDesign,
  onOpenPublicBusinessHours,
  onOpenDesign,
  onEditServiceColor,
  onRemoveServiceColor,
  onSaveBookingRules,
  onSaveServiceOrder,
  isSaving = false,
}: CalendarSettingsPanelProps) {
  const m = useTheme().palette.mollure;
  const showFixed = supportedLocations.includes("FL");
  const showDesired = supportedLocations.includes("DL");

  const [bookingRulesEditing, setBookingRulesEditing] = React.useState(false);
  const [serviceOrderEditing, setServiceOrderEditing] = React.useState(false);
  const [draggingCategoryKey, setDraggingCategoryKey] = React.useState<string | null>(null);

  const fixedLocationState = publicHoursState.fixed;
  const desiredLocationState = publicHoursState.desired;

  const fixedOptions = fixedLocationState.slots.map((slot) => ({
    label: formatPublicHoursSlotLabel(slot),
    value: slot.id,
  }));
  const desiredOptions = desiredLocationState.slots.map((slot) => ({
    label: formatPublicHoursSlotLabel(slot),
    value: slot.id,
  }));

  const setFixedSelected = (slotId: string) => {
    onPublicHoursStateChange({
      ...publicHoursState,
      fixed: { ...fixedLocationState, selectedId: slotId },
    });
  };

  const setDesiredSelected = (slotId: string) => {
    onPublicHoursStateChange({
      ...publicHoursState,
      desired: { ...desiredLocationState, selectedId: slotId },
    });
  };

  const orderedCategories = React.useMemo(() => {
    const catalogByKey = new Map<string, (typeof BUSINESS_SERVICE_CATEGORY_CATALOG)[number]>(
      BUSINESS_SERVICE_CATEGORY_CATALOG.map((entry) => [entry.key, entry]),
    );
    const keys = serviceOrderKeys.length ? serviceOrderKeys : DEFAULT_CATEGORY_KEYS;
    return keys
      .map((key, index) => {
        const entry = catalogByKey.get(key);
        if (!entry) return null;
        return { ...entry, order: index + 1 };
      })
      .filter(Boolean) as Array<(typeof BUSINESS_SERVICE_CATEGORY_CATALOG)[number] & { order: number }>;
  }, [serviceOrderKeys]);

  const customizedServices = React.useMemo(
    () =>
      BUSINESS_SERVICE_CATEGORY_CATALOG.filter((entry) => Boolean(appliedDesign.colorsByCategory[entry.key])).map(
        (entry) => ({
          key: entry.key,
          label: getCalendarDesignServiceLabel(entry.key),
          color: appliedDesign.colorsByCategory[entry.key],
        }),
      ),
    [appliedDesign.colorsByCategory],
  );

  const handleBookingRulesEditToggle = async () => {
    if (bookingRulesEditing) {
      await onSaveBookingRules();
      setBookingRulesEditing(false);
      return;
    }
    setBookingRulesEditing(true);
  };

  const handleServiceOrderEditToggle = async () => {
    if (serviceOrderEditing) {
      await onSaveServiceOrder();
      setServiceOrderEditing(false);
      return;
    }
    setServiceOrderEditing(true);
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
        <SubHeading sx={{ fontSize: 18, fontWeight: 800, color: alpha(m.navy, 0.72) }}>Settings</SubHeading>
      </Box>

      <Stack spacing={1.75} sx={{ px: 2.5, py: 2.25 }}>
        <SettingsSection
          title="Public Hours"
          action={<SetButton disabled={isSaving} onClick={() => onOpenPublicBusinessHours(showFixed ? "FL" : "DL")} />}
        >
          <Stack spacing={1.25}>
            {showFixed ? (
              <LocationBlock
                title="Fixed Location"
                scheduleLabel="Fixed Schedule"
                scheduleOptions={fixedOptions}
                scheduleValue={fixedLocationState.selectedId}
                onScheduleChange={setFixedSelected}
              />
            ) : null}
            {showDesired ? (
              <LocationBlock
                title="Desired Location"
                scheduleLabel="Variable Schedule"
                scheduleOptions={desiredOptions}
                scheduleValue={desiredLocationState.selectedId}
                onScheduleChange={setDesiredSelected}
                showInfo
              />
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title="Booking Rules"
          action={
            <EditSectionButton
              active={bookingRulesEditing}
              disabled={isSaving}
              onClick={() => void handleBookingRulesEditToggle()}
            />
          }
        >
          <Stack spacing={1.25}>
            {showFixed ? (
              <BookingRulesLocationCard title="Fixed Location">
                <DurationInput
                  label="Interval Between Bookings"
                  value={bookingRules.fixed.intervalBetweenBookings}
                  onChange={(next) =>
                    onBookingRulesChange({ ...bookingRules, fixed: { intervalBetweenBookings: next } })
                  }
                  helperText="Set the minimum time between consecutive bookings."
                  disabled={!bookingRulesEditing || isSaving}
                />
              </BookingRulesLocationCard>
            ) : null}
            {showDesired ? (
              <BookingRulesLocationCard title="Desired Location">
                <Stack spacing={1.75}>
                  <DurationInput
                    label="Interval Between Bookings"
                    value={bookingRules.desired.intervalBetweenBookings}
                    onChange={(next) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        desired: { ...bookingRules.desired, intervalBetweenBookings: next },
                      })
                    }
                    disabled={!bookingRulesEditing || isSaving}
                  />
                  <DurationInput
                    label="Minimum Timeslot"
                    value={bookingRules.desired.minimumTimeslot}
                    onChange={(next) =>
                      onBookingRulesChange({
                        ...bookingRules,
                        desired: { ...bookingRules.desired, minimumTimeslot: next },
                      })
                    }
                    helperText="Minimum required team member time at DL location."
                    disabled={!bookingRulesEditing || isSaving}
                  />
                </Stack>
              </BookingRulesLocationCard>
            ) : null}
          </Stack>
        </SettingsSection>

        <SettingsSection
          title="Service Order Rules"
          action={
            <EditSectionButton
              active={serviceOrderEditing}
              disabled={isSaving}
              onClick={() => void handleServiceOrderEditToggle()}
            />
          }
        >
          <Stack spacing={2}>
            <Box>
              <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 1.1 }}>
                Select Categories
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
                {orderedCategories.map((category) => (
                  <CalendarServiceOrderCard
                    key={category.key}
                    label={category.key === "hair" ? "Haar" : category.label}
                    iconId={category.iconId}
                    order={category.order}
                    draggable
                    isDragging={draggingCategoryKey === category.key}
                    onDragStart={() => setDraggingCategoryKey(category.key)}
                    onDragEnd={() => {
                      setDraggingCategoryKey(null);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingCategoryKey || draggingCategoryKey === category.key) return;
                      const nextKeys = reorderKeys(
                        serviceOrderKeys.length ? serviceOrderKeys : DEFAULT_CATEGORY_KEYS,
                        draggingCategoryKey,
                        category.key,
                      );
                      onServiceOrderKeysChange(nextKeys);
                      setDraggingCategoryKey(null);
                      void onSaveServiceOrder();
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 1.1 }}>Services</BodyText>
              <Stack spacing={0.75}>
                {orderedCategories.map((category) => (
                  <Box
                    key={category.key}
                    sx={{
                      borderRadius: "6px",
                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                      bgcolor: alpha(m.navy, 0.015),
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <BodyText sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                      {getCalendarDesignServiceLabel(category.key)}
                    </BodyText>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </SettingsSection>

        <SettingsSection title="Calendar Appearance" action={<SetButton disabled={isSaving} onClick={onOpenDesign} />}>
          {customizedServices.length ? (
            <Stack spacing={1}>
              {customizedServices.map((service) => (
                <Box
                  key={service.key}
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
                      bgcolor: service.color,
                      border: `1px solid ${alpha(m.navy, 0.14)}`,
                    }}
                  />
                  <BodyText sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                    {service.label} colour {service.color}
                  </BodyText>
                  <IconButton
                    size="small"
                    onClick={() => onEditServiceColor(service.key)}
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
                    onClick={() => onRemoveServiceColor(service.key)}
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
              <BodyText sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.42), textAlign: "center" }}>
                Customize Your Calendar Based On Categories Or Services
              </BodyText>
            </Box>
          )}
        </SettingsSection>
      </Stack>
    </Paper>
  );
}
