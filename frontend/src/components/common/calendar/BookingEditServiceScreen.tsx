"use client";

import * as React from "react";
import { InputAdornment, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import { BodyText } from "../../ui/typography";
import {
  addMinutesToTime,
  buildBookingTimeOptions,
  type BookingServiceEditDraft,
} from "../../../data/bookingServiceEdit.data";

type StaffOption = {
  id: string;
  name: string;
};

type BookingEditServiceScreenProps = {
  draft: BookingServiceEditDraft;
  staffOptions: readonly StaffOption[];
  errors?: Partial<
    Record<"name" | "durationMins" | "startTime" | "endTime" | "price", string>
  >;
  onChange: (patch: Partial<BookingServiceEditDraft>) => void;
  disabled?: boolean;
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
  staffOptions,
  errors = {},
  onChange,
  disabled = false,
}: BookingEditServiceScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const timeOptions = React.useMemo(() => buildBookingTimeOptions(), []);

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
        placeholder="Service name"
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />

      <AppTextField
        placeholder="Duration"
        value={draft.durationMins}
        onChange={(e) => handleDurationChange(e.target.value)}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.durationMins)}
        helperText={errors.durationMins}
        inputProps={{ inputMode: "numeric" }}
      />

      <AppSelect
        placeholder="Start time"
        value={draft.startTime}
        onChange={(e) => handleStartTimeChange(String(e.target.value))}
        options={timeOptions}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.startTime)}
        helperText={errors.startTime}
      />

      <AppTextField
        placeholder="End time"
        value={draft.endTime}
        onChange={(e) => onChange({ endTime: e.target.value })}
        fullWidth
        disabled={disabled}
        error={Boolean(errors.endTime)}
        helperText={errors.endTime}
      />

      <BodyText
        sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65) }}
      >
        Price
      </BodyText>
      <Stack direction="row" spacing={1}>
        <AppSelect
          placeholder="Price type"
          value={draft.priceType}
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
          placeholder="0"
          value={draft.price}
          onChange={(e) => onChange({ price: e.target.value })}
          fullWidth
          disabled={disabled}
          error={Boolean(errors.price)}
          helperText={errors.price}
          inputProps={{ inputMode: "decimal" }}
          InputProps={{
            startAdornment: <InputAdornment position="start">€</InputAdornment>,
            endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
      </Stack>

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
          InputProps={{
            startAdornment: <InputAdornment position="start">€</InputAdornment>,
            endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
      </Stack>

      <AppSelect
        placeholder="Staff member"
        value={draft.staffResourceId}
        onChange={(e) => onChange({ staffResourceId: String(e.target.value) })}
        options={staffOptions.map((staff) => ({
          label: staff.name,
          value: staff.id,
        }))}
        fullWidth
        disabled={disabled}
      />
    </Stack>
  );
}
