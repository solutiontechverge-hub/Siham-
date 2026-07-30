"use client";

import * as React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Avatar,
  Box,
  ButtonBase,
  InputAdornment,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../AppSearchField";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import {
  addMinutesToTime,
  buildBookingTimeOptions,
  type BookingServiceEditDraft,
} from "../../../data/bookingServiceEdit.data";

export type BookingEditServiceStaffOption = {
  id: string;
  name: string;
  avatarText?: string;
  /** 0–100, shown as “N% availability”. */
  availabilityPercent?: number;
};

export type BookingEditServiceTimeSlot = {
  time: string;
  status: "available" | "occupied";
};

type BookingEditServiceScreenProps = {
  draft: BookingServiceEditDraft;
  staffOptions?: readonly BookingEditServiceStaffOption[];
  errors?: Partial<
    Record<"name" | "durationMins" | "startTime" | "endTime" | "price", string>
  >;
  onChange: (patch: Partial<BookingServiceEditDraft>) => void;
  disabled?: boolean;
  /** Start Time + availability list only for manual booking add. */
  showStartTime?: boolean;
  /** Optional Available/Occupied rows under Start Time. */
  startTimeSlots?: readonly BookingEditServiceTimeSlot[];
  /**
   * Show professional assign UI only when client has not already assigned one.
   * When false, section is hidden (staff already set on the service).
   */
  showStaffAssign?: boolean;
};

const priceTypeOptions = [
  { label: "Fixed price", value: "fixed" },
  { label: "Starting from", value: "starting_from" },
];

const discountTypeOptions = [
  { label: "Fixed discount", value: "fixed" },
  { label: "Percentage discount", value: "percentage" },
];

export default function BookingEditServiceScreen({
  draft,
  staffOptions = [],
  errors = {},
  onChange,
  disabled = false,
  showStartTime = false,
  startTimeSlots = [],
  showStaffAssign = true,
}: BookingEditServiceScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [staffQuery, setStaffQuery] = React.useState("");
  const timeOptions = React.useMemo(() => buildBookingTimeOptions(), []);
  const hasStaffSelected = Boolean(draft.staffResourceId);

  const filteredStaff = React.useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return staffOptions;
    return staffOptions.filter((staff) =>
      staff.name.toLowerCase().includes(q),
    );
  }, [staffOptions, staffQuery]);

  const handleDurationChange = (value: string) => {
    const duration = Number.parseInt(value, 10);
    const next: Partial<BookingServiceEditDraft> = { durationMins: value };
    if (draft.startTime && Number.isFinite(duration) && duration > 0) {
      next.endTime = addMinutesToTime(draft.startTime, duration);
    }
    onChange(next);
  };

  const handleStartTimeChange = (value: string) => {
    const duration = Number.parseInt(draft.durationMins, 10);
    const next: Partial<BookingServiceEditDraft> = { startTime: value };
    if (Number.isFinite(duration) && duration > 0) {
      next.endTime = addMinutesToTime(value, duration);
    }
    onChange(next);
  };

  return (
    <Stack spacing={1.6}>
      <BodyText
        sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
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

      <AppTextField
        label="Time"
        placeholder="Duration"
        value={draft.durationMins}
        onChange={(e) => handleDurationChange(e.target.value)}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.durationMins)}
        helperText={errors.durationMins}
        inputProps={{ inputMode: "numeric" }}
      />

      {showStartTime ? (
        <Stack spacing={0.85}>
          <AppSelect
            label="Start Time"
            value={draft.startTime}
            onChange={(e) => handleStartTimeChange(String(e.target.value))}
            options={timeOptions}
            fullWidth
            disabled={disabled}
            error={Boolean(errors.startTime)}
            helperText={errors.startTime}
          />

          {startTimeSlots.length > 0 ? (
            <Box
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              {startTimeSlots.map((slot, index) => {
                const occupied = slot.status === "occupied";
                const selected = draft.startTime === slot.time;
                return (
                  <ButtonBase
                    key={slot.time}
                    disabled={disabled || occupied}
                    onClick={() => handleStartTimeChange(slot.time)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1.05,
                      borderBottom:
                        index < startTimeSlots.length - 1
                          ? `1px solid ${alpha(m.navy, 0.06)}`
                          : "none",
                      bgcolor: selected ? alpha(m.teal, 0.06) : "#fff",
                      "&.Mui-disabled": { opacity: 1 },
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
                      {slot.time}
                    </BodyText>
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
                  </ButtonBase>
                );
              })}
            </Box>
          ) : null}
        </Stack>
      ) : null}

      {showStartTime ? (
        <AppTextField
          label="End Time"
          placeholder="HH:MM"
          value={draft.endTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
          fullWidth
          disabled={disabled}
          error={Boolean(errors.endTime)}
          helperText={errors.endTime}
        />
      ) : null}

      <Stack direction="row" spacing={1} alignItems="flex-start">
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
            options={priceTypeOptions}
            fullWidth
            disabled={disabled}
            sx={{ flex: 1 }}
          />
          <AppTextField
            label="Price"
            placeholder="0"
            value={draft.price}
            onChange={(e) => onChange({ price: e.target.value })}
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
            sx={{ flex: 1 }}
          />
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
            fontSize: 12.5,
            fontWeight: 900,
            color: alpha(m.navy, 0.76),
            mb: 1.25,
          }}
        >
          Discount (Optional)
        </BodyText>
        <Stack direction="row" spacing={1}>
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
            options={discountTypeOptions}
            fullWidth
            disabled={disabled}
            sx={{ flex: 1 }}
          />
          <AppTextField
            label="Discount Amount"
            placeholder="0"
            value={draft.discountAmount}
            onChange={(e) => onChange({ discountAmount: e.target.value })}
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
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

      {showStaffAssign ? (
        <Stack spacing={0.85}>
          {!hasStaffSelected ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 1.25,
                py: 1,
                borderRadius: "10px",
                bgcolor: alpha(m.teal, 0.08),
                border: `1px solid ${alpha(m.teal, 0.18)}`,
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18, color: m.teal }} />
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                  lineHeight: 1.3,
                }}
              >
                Client Hasn&apos;t Selected Any Team Member
              </BodyText>
            </Stack>
          ) : null}

          <AppSearchField
            fullWidth
            placeholder="Select Team Member"
            value={staffQuery}
            onChange={(e) => setStaffQuery(e.target.value)}
            onClear={() => setStaffQuery("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
              },
            }}
          />

          {filteredStaff.length > 0 ? (
            <Box
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              {filteredStaff.map((staff, index) => {
                const selected = draft.staffResourceId === staff.id;
                const availability =
                  typeof staff.availabilityPercent === "number"
                    ? Math.round(staff.availabilityPercent)
                    : null;
                return (
                  <ButtonBase
                    key={staff.id}
                    disabled={disabled}
                    onClick={() => onChange({ staffResourceId: staff.id })}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 1.25,
                      py: 1,
                      borderBottom:
                        index < filteredStaff.length - 1
                          ? `1px solid ${alpha(m.navy, 0.06)}`
                          : "none",
                      bgcolor: selected ? alpha(m.teal, 0.06) : "#fff",
                      textAlign: "left",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: 12,
                        fontWeight: 800,
                        bgcolor: alpha(m.navy, 0.08),
                        color: alpha(m.navy, 0.7),
                      }}
                    >
                      {staff.avatarText ?? staff.name.slice(0, 1)}
                    </Avatar>
                    <BodyText
                      component="span"
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.78),
                      }}
                    >
                      {staff.name}
                    </BodyText>
                    {availability != null ? (
                      <Stack
                        alignItems="flex-end"
                        spacing={0.35}
                        sx={{ minWidth: 72 }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 4,
                            borderRadius: 99,
                            bgcolor: alpha(m.navy, 0.08),
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${Math.max(0, Math.min(100, availability))}%`,
                              height: "100%",
                              bgcolor: m.teal,
                            }}
                          />
                        </Box>
                        <BodyText
                          component="span"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.48),
                            whiteSpace: "nowrap",
                          }}
                        >
                          {availability}% availability
                        </BodyText>
                      </Stack>
                    ) : null}
                  </ButtonBase>
                );
              })}
            </Box>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
