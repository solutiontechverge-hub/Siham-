"use client";

import AppButton from "./AppButton";
import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "./MollureFormField";

type MollureListToolbarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (next: string) => void;
  onSortClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onAddClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onFilterClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  activeFilterCount?: number;
};

export default function MollureListToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSortClick,
  onAddClick,
  onFilterClick,
  activeFilterCount = 0,
}: MollureListToolbarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box sx={{ px: 2.25, py: 1.5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ md: "center" }}
      >
        <Box sx={{ flex: 1, maxWidth: { md: 420 } }}>
          <MollureFormField
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha(m.navy, 0.01),
                borderRadius: "10px",
              },
            }}
            InputProps={{
              endAdornment: (
                <SearchRoundedIcon
                  sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }}
                />
              ),
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-end"
        >
          {onFilterClick ? (
            <AppButton
              variant="outlined"
              onClick={onFilterClick}
              startIcon={<TuneRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 12.5,
                borderColor:
                  activeFilterCount > 0
                    ? alpha(m.teal, 0.45)
                    : alpha(m.navy, 0.14),
                color: activeFilterCount > 0 ? m.teal : alpha(m.navy, 0.78),
                bgcolor: activeFilterCount > 0 ? alpha(m.teal, 0.06) : "#fff",
                height: 34,
                px: 1.25,
              }}
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </AppButton>
          ) : null}
          <AppButton
            variant="outlined"
            onClick={onSortClick}
            startIcon={<SortRoundedIcon sx={{ fontSize: 18 }} />}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.78),
              bgcolor: "#fff",
              height: 34,
              px: 1.25,
            }}
          >
            Sort By
          </AppButton>
          <AppButton
            tone="primary"
            onClick={onAddClick}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{
              fontSize: 12.5,
              height: 34,
              px: 1.25,
              color: m.white,
            }}
          >
            Add
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  );
}
