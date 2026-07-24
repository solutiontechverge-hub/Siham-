"use client";

import AppButton from "../AppButton";
import * as React from "react";
import {
  Box,
  Grid,
  MenuItem,
  Paper,
  Stack,
  type PaperProps,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarPopover, {
  formatListingDateTimeDisplay,
  type CalendarPopoverValue,
} from "./CalendarPopover";
import ListingLocationModeCards from "./ListingLocationModeCards";
import Image from "next/image";
import { ArrowDown } from "../../../../images";
import { KeywordTagsInput, MollureTextField } from "..";
import ServiceCategoryIcon from "../ServiceCategoryIcon";
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
  categories: string[];
  municipality: string;
  municipalities: string[];
  keywords: string[];
  locationModes: Array<"fixed" | "desired">;
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
  const [calendarAnchor, setCalendarAnchor] =
    React.useState<HTMLElement | null>(null);

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

  const set = (patch: Partial<ListingFilterValues>) =>
    onChange({ ...values, ...patch });

  const dateTimeDisplay = formatListingDateTimeDisplay(values.dateTime);

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
            onChange={(e) => {
              const next = e.target.value;
              set({ category: next, categories: next ? [next] : [] });
            }}
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
                  (selected as any)
                ) : (
                  <BodyText
                    sx={{
                      color: alpha(tokens.navy, 0.55),
                      fontSize: "1.05rem",
                      fontWeight: 500,
                    }}
                  >
                    Select Category
                  </BodyText>
                ),
            }}
          >
            <MenuItem value="">
              <BodyText sx={{ color: tokens.placeholder, fontSize: 13 }}>
                Select Category
              </BodyText>
            </MenuItem>
            {categoryOptions.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 40,
                  py: 1,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.75}
                  sx={{ width: "100%", lineHeight: 1 }}
                >
                  <ServiceCategoryIcon
                    label={opt.label}
                    fontSize={20}
                    color={tokens.teal}
                  />
                  <BodyText
                    sx={{ fontSize: 14, lineHeight: 1.2, color: "inherit" }}
                  >
                    {opt.label}
                  </BodyText>
                </Stack>
              </MenuItem>
            ))}
          </MollureTextField>
        </Grid>

        <Grid item xs={12}>
          <ListingLocationModeCards
            value={values.locationModes}
            onChange={(locationModes) => set({ locationModes })}
          />
        </Grid>

        <Grid item xs={12}>
          <MollureTextField
            select
            value={values.municipality}
            onChange={(e) => {
              const next = e.target.value;
              set({ municipality: next, municipalities: next ? [next] : [] });
            }}
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
                  (selected as any)
                ) : (
                  <BodyText
                    sx={{
                      color: alpha(tokens.navy, 0.55),
                      fontSize: "1.05rem",
                      fontWeight: 500,
                    }}
                  >
                    Select Municipality
                  </BodyText>
                ),
            }}
          >
            <MenuItem value="">
              <BodyText sx={{ color: tokens.placeholder, fontSize: 13 }}>
                Select Municipality
              </BodyText>
            </MenuItem>
            {municipalityOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MollureTextField>
        </Grid>

        <Grid item xs={12}>
          <KeywordTagsInput
            value={values.keywords}
            onChange={(keywords) => set({ keywords })}
            maxKeywords={3}
            placeholder="Search Keyword"
            sx={lineFieldSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ pt: 0.25 }}>
            <AppButton
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
            </AppButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
