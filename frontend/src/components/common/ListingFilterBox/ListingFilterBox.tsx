"use client";

import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Stack,
  type PaperProps,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarPopover, { type CalendarPopoverValue } from "./CalendarPopover";
import Image from "next/image";
import { ArrowDown, ListingBG, DesiredLocationIcon, FixedLocationIcon } from "../../../../images";
import { MollureTextField } from "..";
import { BodyText } from "../../ui/typography";

function assetUrl(asset: any) {
  if (!asset) return "";
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    if (typeof asset.src === "string") return asset.src;
    if (typeof asset.default === "string") return asset.default;
    if (typeof asset.default === "object") return assetUrl(asset.default);
  }
  return String(asset);
}

export type ListingFilterOption = { label: string; value: string };

export type ListingFilterValues = {
  dateTime: CalendarPopoverValue;
  category: string;
  municipality: string;
  keyword: string;
  locationMode: "fixed" | "desired";
};

export type ListingFilterBoxProps = Omit<PaperProps, "onChange"> & {
  values: ListingFilterValues;
  onChange: (next: ListingFilterValues) => void;
  categoryOptions: ListingFilterOption[];
  municipalityOptions: ListingFilterOption[];
  onApply?: () => void;
};

export default function ListingFilterBox({
  values,
  onChange,
  categoryOptions,
  municipalityOptions,
  onApply,
  sx,
  ...props
}: ListingFilterBoxProps) {
  const tokens = useTheme().palette.mollure;
  const [calendarAnchor, setCalendarAnchor] = React.useState<HTMLElement | null>(null);

  const lineFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 0,
      bgcolor: "transparent",
      "& fieldset": { border: "none" },
      "&:hover fieldset": { border: "none" },
      "&.Mui-focused fieldset": { border: "none" },
      borderBottom: `1px solid ${alpha(tokens.navy, 0.14)}`,
      "&:hover": { borderBottomColor: alpha(tokens.navy, 0.22) },
      "&.Mui-focused": { borderBottom: `2px solid ${tokens.teal}` },
    },
    "& .MuiOutlinedInput-input": {
      px: 0,
      py: 1.15,
      fontSize: "0.95rem",
      fontWeight: 500,
      color: alpha(tokens.navy, 0.9),
    },
    "& input::placeholder": {
      color: alpha(tokens.navy, 0.55),
      opacity: 1,
      fontWeight: 500,
      fontSize: "1.05rem",
    },
    "& .MuiSelect-select": {
      px: 0,
      py: 1.15,
      fontSize: "0.95rem",
      fontWeight: 500,
      color: alpha(tokens.navy, 0.9),
    },
  } as const;

  const set = (patch: Partial<ListingFilterValues>) => onChange({ ...values, ...patch });

  const dateTimeDisplay = values.dateTime
    ? values.dateTime.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const LocationPill = ({
    icon,
    label,
    checked,
    onClick,
  }: {
    icon: any;
    label: string;
    checked: boolean;
    onClick: () => void;
  }) => (
    <Button
      onClick={onClick}
      variant="text"
      disableRipple
      sx={{
        justifyContent: "space-between",
        textTransform: "none",
        px: 1.5,
        py: 1.05,
        borderRadius: "12px",
        bgcolor: alpha(tokens.navy, 0.03),
        color: tokens.navy,
        fontWeight: 600,
        "&:hover": { bgcolor: alpha(tokens.teal, 0.06) },
      }}
      fullWidth
    >
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Image src={icon} alt={label} width={18} height={18} />
        <BodyText sx={{ fontSize: 14, fontWeight: 500, color: tokens.navy }}>
          {label}
        </BodyText>
      </Stack>
      <Checkbox
        checked={checked}
        onChange={onClick}
        sx={{
          p: 0,
          ml: 1,
          color: tokens.teal,
          "&.Mui-checked": { color: tokens.teal },
        }}
      />
    </Button>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.25,
        position: "relative",
        bgcolor: tokens.white,
        border: `2px solid ${alpha(tokens.teal, 0.25)}`,
        boxShadow: "0 18px 42px rgba(16, 24, 40, 0.08)",
        p: { xs: 2.25, md: 3 },
        "& > *": { position: "relative" },
        ...sx,
      }}
      {...props}
    >
      <Grid container spacing={2.75} alignItems="flex-end">
        <Grid item xs={12} sm={6}>
          <MollureTextField
            placeholder="Select Date and Time"
            value={dateTimeDisplay}
            onClick={(e) => setCalendarAnchor(e.currentTarget)}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Box sx={{ display: "flex", alignItems: "center", pr: 0.25 }}>
                  <Image src={ArrowDown} alt="" width={16} height={16} />
                </Box>
              ),
            }}
            sx={{
              cursor: "pointer",
              ...lineFieldSx,
            }}
          />
          <CalendarPopover
            anchorEl={calendarAnchor}
            open={Boolean(calendarAnchor)}
            onClose={() => setCalendarAnchor(null)}
            value={values.dateTime}
            onChange={(next) => set({ dateTime: next })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <MollureTextField
            select
            value={values.category}
            onChange={(e) => set({ category: e.target.value })}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: "flex", alignItems: "center", pr: 0.25 }}>
                  <Image src={ArrowDown} alt="" width={16} height={16} />
                </Box>
              ),
            }}
            sx={lineFieldSx}
            SelectProps={{
              displayEmpty: true,
              IconComponent: () => null,
              renderValue: (selected) =>
                selected ? (
                  selected as any
                ) : (
                  <BodyText sx={{ color: alpha(tokens.navy, 0.55), fontSize: "1.05rem", fontWeight: 500 }}>
                    Select Category
                  </BodyText>
                ),
            }}
          >
            <MenuItem value="">
              <BodyText sx={{ color: tokens.placeholder, fontSize: 13 }}>Select Category</BodyText>
            </MenuItem>
            {categoryOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureTextField>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <LocationPill
                icon={FixedLocationIcon}
                label="Fixed Location"
                checked={values.locationMode === "fixed"}
                onClick={() => set({ locationMode: "fixed" })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocationPill
                icon={DesiredLocationIcon}
                label="Desired Location"
                checked={values.locationMode === "desired"}
                onClick={() => set({ locationMode: "desired" })}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <MollureTextField
            select
            value={values.municipality}
            onChange={(e) => set({ municipality: e.target.value })}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: "flex", alignItems: "center", pr: 0.25 }}>
                  <Image src={ArrowDown} alt="" width={16} height={16} />
                </Box>
              ),
            }}
            sx={lineFieldSx}
            SelectProps={{
              displayEmpty: true,
              IconComponent: () => null,
              renderValue: (selected) =>
                selected ? (
                  selected as any
                ) : (
                  <BodyText sx={{ color: alpha(tokens.navy, 0.55), fontSize: "1.05rem", fontWeight: 500 }}>
                    Select Municipality
                  </BodyText>
                ),
            }}
          >
            <MenuItem value="">
              <BodyText sx={{ color: tokens.placeholder, fontSize: 13 }}>Select Municipality</BodyText>
            </MenuItem>
            {municipalityOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureTextField>
        </Grid>

        <Grid item xs={12}>
          <MollureTextField
            value={values.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
            placeholder="Search Keyword"
            sx={lineFieldSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ pt: 0.25 }}>
            <Button
              fullWidth
              onClick={onApply}
              variant="contained"
              disableElevation
              sx={{
                height: 52,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1.05rem",
                bgcolor: tokens.teal,
                color: tokens.white,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              Apply
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

