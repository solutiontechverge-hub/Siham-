"use client";

import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Typography,
  type PaperProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarPopover, { type CalendarPopoverValue } from "./CalendarPopover";
import Image from "next/image";
import { ListingBG, DesiredLocationIcon, FixedLocationIcon } from "../../../../images";
import { MollureTextField } from "..";

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

  const labelSx = {
    mb: 0.6,
    fontSize: 14,
    fontWeight: 500,
    color: tokens.slate,
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
        py: 1.15,
        borderRadius: 2,
        bgcolor: "rgba(52, 74, 102, 0.04)",
        border: `1px solid ${tokens.border}`,
        color: tokens.navy,
        fontWeight: 600,
        "&:hover": { bgcolor: "rgba(33, 184, 191, 0.08)" },
      }}
      fullWidth
    >
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Image src={icon} alt={label} width={18} height={18} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>
          {label}
        </Typography>
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
        borderRadius: 3.5,
        position: "relative",
        bgcolor: tokens.whiteOverlay,
        backdropFilter: "blur(12px)",
        border: `1px solid ${tokens.border}`,
        boxShadow: "0 20px 45px rgba(40, 92, 112, 0.10)",
        p: { xs: 2.5, md: 3 },
        "& > *": { position: "relative" },
        ...sx,
      }}
      {...props}
    >
      <Grid container spacing={2.75} alignItems="flex-end">
        <Grid item xs={12} sm={6}>
          <Typography sx={labelSx}>Select Date and Time</Typography>
          <MollureTextField
            placeholder="Pick date & time"
            value={dateTimeDisplay}
            onClick={(e) => setCalendarAnchor(e.currentTarget)}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <CalendarMonthRoundedIcon sx={{ color: tokens.placeholder, fontSize: 20 }} />
              ),
            }}
            sx={{
              cursor: "pointer",
              "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
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
          <Typography sx={labelSx}>Select Category</Typography>
          <MollureTextField
            select
            value={values.category}
            onChange={(e) => set({ category: e.target.value })}
            placeholder="Select category"
            InputProps={{
              endAdornment: <ArrowDropDownRoundedIcon sx={{ color: tokens.placeholder }} />,
            }}
          >
            <MenuItem value="">
              <Typography sx={{ color: tokens.placeholder, fontSize: 13 }}>
                Select category
              </Typography>
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
          <Typography sx={labelSx}>Select Municipality</Typography>
          <MollureTextField
            select
            value={values.municipality}
            onChange={(e) => set({ municipality: e.target.value })}
            placeholder="Select municipality"
            InputProps={{
              endAdornment: <ArrowDropDownRoundedIcon sx={{ color: tokens.placeholder }} />,
            }}
          >
            <MenuItem value="">
              <Typography sx={{ color: tokens.placeholder, fontSize: 13 }}>
                Select municipality
              </Typography>
            </MenuItem>
            {municipalityOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureTextField>
        </Grid>

        <Grid item xs={12}>
          <Typography sx={labelSx}>Search Keyword</Typography>
          <MollureTextField
            value={values.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
            placeholder="Search keyword"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "center", pt: 0.25 }}>
            <Button
              fullWidth
              onClick={onApply}
              variant="contained"
              disableElevation
              sx={{
                maxWidth: 700,
                height: 52,
                borderRadius: 2.2,
                textTransform: "none",
                fontWeight: 800,
                bgcolor: tokens.teal,
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

