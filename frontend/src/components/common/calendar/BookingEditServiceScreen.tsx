"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  InputAdornment,
  Stack,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureSectionTitleSx, mollureLabelSx } from "../../../theme/mollureHierarchy";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import {
  formatTimeWindowDurationLabel,
  positiveMinutesBetweenTimes,
  type BookingServiceEditDraft,
} from "../../../data/bookingServiceEdit.data";
import { sanitizeDecimalInput } from "../../../lib/field-input";
import {
  fmtMinToTime,
  minutesSinceMidnight,
  pad2,
} from "./calendar.utils";
import {
  BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS,
  BOOKING_CATALOG_PRICE_TYPE_OPTIONS,
} from "../../../data/bookingUniqueItem.data";

export type BookingEditServiceSlotMember = {
  id: string;
  name: string;
  avatarText?: string;
  photoSrc?: string;
};

export type BookingEditServiceAvailabilitySlot = {
  time: string;
  status: "available" | "occupied";
  /** Members free at this slot — shown as avatars next to Available. */
  availableMembers: readonly BookingEditServiceSlotMember[];
};

type BookingEditServiceScreenProps = {
  draft: BookingServiceEditDraft;
  errors?: Partial<
    Record<"name" | "durationMins" | "startTime" | "endTime" | "price", string>
  >;
  onChange: (patch: Partial<BookingServiceEditDraft>) => void;
  disabled?: boolean;
  /**
   * Time-slot availability after End Time (info only).
   * Each row: time + Available/Occupied + avatars of free members.
   */
  availabilitySlots?: readonly BookingEditServiceAvailabilitySlot[];
  /** When false, hide the availability section. */
  showAvailability?: boolean;
};

function slotsInTimeWindow(
  slots: readonly BookingEditServiceAvailabilitySlot[],
  startTime: string,
  endTime: string,
): BookingEditServiceAvailabilitySlot[] {
  const startMin = minutesSinceMidnight(startTime);
  const endMin = minutesSinceMidnight(endTime);
  if (
    !Number.isFinite(startMin) ||
    !Number.isFinite(endMin) ||
    endMin <= startMin
  ) {
    return slots.filter((slot) => slot.status === "available");
  }
  const inWindow = slots.filter((slot) => {
    if (slot.status !== "available") return false;
    const t = minutesSinceMidnight(slot.time);
    return Number.isFinite(t) && t >= startMin && t < endMin;
  });
  // Fallback: full available list when nobody is free in the window.
  return inWindow.length > 0
    ? inWindow
    : slots.filter((slot) => slot.status === "available");
}

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1;
  return { label: String(hour), value: String(hour) };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => ({
  label: pad2(minute),
  value: pad2(minute),
}));

const PERIOD_OPTIONS = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

type TimeParts = {
  hour12: string;
  minute: string;
  period: "" | "AM" | "PM";
};

function emptyTimeParts(): TimeParts {
  return { hour12: "", minute: "", period: "" };
}

function parseTimeParts(value: string): TimeParts {
  if (!value.trim()) return emptyTimeParts();
  const total = minutesSinceMidnight(value);
  if (!Number.isFinite(total)) return emptyTimeParts();
  const hour24 = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    hour12: String(hour12),
    minute: pad2(minute),
    period,
  };
}

function partsToHhmm(parts: TimeParts): string | null {
  const hour12 = Number.parseInt(parts.hour12, 10);
  const minute = Number.parseInt(parts.minute, 10);
  const period = parts.period === "PM" || parts.period === "AM" ? parts.period : null;
  if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;
  if (!period) return null;
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return fmtMinToTime(hour24 * 60 + minute);
}

function formatClockAmPm(value: string): string {
  const parts = parseTimeParts(value);
  if (!parts.hour12 || !parts.minute || !parts.period) return value;
  return `${parts.hour12}:${parts.minute} ${parts.period}`;
}

function TimeAmPmFields({
  label,
  value,
  onChange,
  disabled,
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}) {
  const m = useTheme().palette.mollure;
  const parts = parseTimeParts(value);

  const commit = (patch: Partial<TimeParts>) => {
    const next: TimeParts = {
      hour12: patch.hour12 ?? parts.hour12,
      minute: patch.minute ?? parts.minute,
      period: patch.period ?? parts.period,
    };
    if (!next.hour12) next.hour12 = "12";
    if (!next.minute) next.minute = "00";
    if (!next.period) next.period = "AM";
    const hhmm = partsToHhmm(next);
    if (hhmm) onChange(hhmm);
  };

  return (
    <Stack spacing={0.75}>
      <BodyText
        sx={mollureLabelSx(m.navy, {
          color: alpha(m.navy, 0.72),
        })}
      >
        {label}
      </BodyText>
      <Stack direction="row" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppSelect
            label="Hours"
            placeholder="—"
            value={parts.hour12}
            onChange={(e) => commit({ hour12: String(e.target.value) })}
            options={HOUR_12_OPTIONS}
            fullWidth
            disabled={disabled}
            error={error}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppSelect
            label="Minutes"
            placeholder="—"
            value={parts.minute}
            onChange={(e) => commit({ minute: String(e.target.value) })}
            options={MINUTE_OPTIONS}
            fullWidth
            disabled={disabled}
            error={error}
          />
        </Box>
        <Box sx={{ flex: 0.7, minWidth: 0 }}>
          <AppSelect
            label="AM/PM"
            placeholder="—"
            value={parts.period}
            onChange={(e) =>
              commit({ period: String(e.target.value) as "AM" | "PM" })
            }
            options={PERIOD_OPTIONS}
            fullWidth
            disabled={disabled}
            error={error}
          />
        </Box>
      </Stack>
      {helperText ? (
        <BodyText
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            color: error
              ? "error.main"
              : (theme) => alpha(theme.palette.mollure.navy, 0.5),
          }}
        >
          {helperText}
        </BodyText>
      ) : null}
    </Stack>
  );
}

function AvailabilitySlotRow({
  slot,
  m,
}: {
  slot: BookingEditServiceAvailabilitySlot;
  m: { navy: string };
}) {
  const occupied = slot.status === "occupied";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.5,
        py: 0.9,
        borderTop: `1px solid ${alpha(m.navy, 0.06)}`,
        "&:first-of-type": { borderTop: "none" },
      }}
    >
      <BodyText
        component="span"
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: alpha(m.navy, occupied ? 0.42 : 0.78),
        }}
      >
        {formatClockAmPm(slot.time)}
      </BodyText>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <BodyText
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: occupied ? "#E67E22" : "#2ECC71",
          }}
        >
          {occupied ? "Occupied" : "Available"}
        </BodyText>
        {!occupied
          ? slot.availableMembers.map((member) => (
              <Tooltip key={member.id} title={member.name} arrow>
                <Avatar
                  src={member.photoSrc || undefined}
                  alt={member.name}
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 11,
                    fontWeight: 800,
                    bgcolor: alpha(m.navy, 0.08),
                    color: alpha(m.navy, 0.7),
                  }}
                >
                  {member.avatarText ?? member.name.slice(0, 1)}
                </Avatar>
              </Tooltip>
            ))
          : null}
      </Stack>
    </Box>
  );
}

export default function BookingEditServiceScreen({
  draft,
  errors = {},
  onChange,
  disabled = false,
  availabilitySlots = [],
  showAvailability = true,
}: BookingEditServiceScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const hasTimeWindow = Boolean(draft.startTime.trim() && draft.endTime.trim());

  const displayedSlots = React.useMemo(
    () =>
      hasTimeWindow
        ? slotsInTimeWindow(
            availabilitySlots,
            draft.startTime,
            draft.endTime,
          )
        : availabilitySlots.filter((slot) => slot.status === "available"),
    [availabilitySlots, draft.endTime, draft.startTime, hasTimeWindow],
  );

  const windowHasAvailability = React.useMemo(() => {
    if (!hasTimeWindow) return true;
    const startMin = minutesSinceMidnight(draft.startTime);
    const endMin = minutesSinceMidnight(draft.endTime);
    return availabilitySlots.some((slot) => {
      if (slot.status !== "available") return false;
      const t = minutesSinceMidnight(slot.time);
      return Number.isFinite(t) && t >= startMin && t < endMin;
    });
  }, [availabilitySlots, draft.endTime, draft.startTime, hasTimeWindow]);

  const handleStartTimeChange = (value: string) => {
    const next: Partial<BookingServiceEditDraft> = { startTime: value };
    if (draft.endTime) {
      const mins = positiveMinutesBetweenTimes(value, draft.endTime);
      next.durationMins = mins > 0 ? String(mins) : "";
    }
    onChange(next);
  };

  const handleEndTimeChange = (value: string) => {
    const mins = draft.startTime
      ? positiveMinutesBetweenTimes(draft.startTime, value)
      : 0;
    onChange({
      endTime: value,
      durationMins: mins > 0 ? String(mins) : "",
    });
  };

  const durationDisplay = formatTimeWindowDurationLabel(
    draft.startTime,
    draft.endTime,
    draft.durationMins,
  );

  return (
    <Stack spacing={1.6}>
      <BodyText
        sx={mollureSectionTitleSx(m.navy)}
      >
        Edit Service
      </BodyText>

      <AppTextField
        label="Title"
        placeholder="Service name"
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />

      <TimeAmPmFields
        label="Start Time"
        value={draft.startTime}
        onChange={handleStartTimeChange}
        disabled={disabled}
        error={Boolean(errors.startTime)}
        helperText={errors.startTime}
      />

      <TimeAmPmFields
        label="End Time"
        value={draft.endTime}
        onChange={handleEndTimeChange}
        disabled={disabled}
        error={Boolean(errors.endTime)}
        helperText={errors.endTime}
      />

      {showAvailability && displayedSlots.length > 0 ? (
        <Stack spacing={1}>
          <BodyText
            sx={{
              ...mollureLabelSx(m.navy),
            }}
          >
            Availability
          </BodyText>

          {hasTimeWindow ? (
            <BodyText
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.5),
              }}
            >
              {windowHasAvailability
                ? `Available slots for ${formatClockAmPm(draft.startTime)}–${formatClockAmPm(draft.endTime)}`
                : "No one available in this window — all available slots"}
            </BodyText>
          ) : null}

          <Box
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            {displayedSlots.map((slot) => (
              <AvailabilitySlotRow key={slot.time} slot={slot} m={m} />
            ))}
          </Box>
        </Stack>
      ) : null}

      <AppTextField
        label="Duration"
        placeholder="—"
        value={durationDisplay}
        fullWidth
        disabled
        error={Boolean(errors.durationMins)}
        helperText={errors.durationMins}
        InputProps={{ readOnly: true }}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppSelect
            label="Price type"
            placeholder="Select price type"
            value={draft.priceType || "fixed"}
            onChange={(e) =>
              onChange({
                priceType: String(
                  e.target.value,
                ) as BookingServiceEditDraft["priceType"],
              })
            }
            options={BOOKING_CATALOG_PRICE_TYPE_OPTIONS}
            fullWidth
            disabled={disabled}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppTextField
            label="Price"
            placeholder="0"
            value={draft.price}
            onChange={(e) =>
              onChange({ price: sanitizeDecimalInput(e.target.value) })
            }
            fullWidth
            disabled={disabled}
            error={Boolean(errors.price)}
            helperText={errors.price}
            inputProps={{ inputMode: "decimal" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">€</InputAdornment>
              ),
            }}
          />
        </Box>
      </Stack>

      <Box
        sx={{
          borderRadius: "12px",
          bgcolor: alpha(m.navy, 0.025),
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          p: 1.5,
        }}
      >
        <BodyText
          sx={{
            ...mollureLabelSx(m.navy),
            mb: 1.25,
          }}
        >
          Discount (Optional)
        </BodyText>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppSelect
              label="Discount type"
              value={draft.discountType}
              onChange={(e) =>
                onChange({
                  discountType: String(
                    e.target.value,
                  ) as BookingServiceEditDraft["discountType"],
                })
              }
              options={BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS}
              fullWidth
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTextField
              label="Discount Amount"
              placeholder="0"
              value={draft.discountAmount}
              onChange={(e) =>
                onChange({
                  discountAmount: sanitizeDecimalInput(e.target.value),
                })
              }
              fullWidth
              disabled={disabled}
              inputProps={{ inputMode: "decimal" }}
              InputProps={
                draft.discountType === "percentage"
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }
                  : {
                      startAdornment: (
                        <InputAdornment position="start">€</InputAdornment>
                      ),
                    }
              }
            />
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
