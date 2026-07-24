"use client";

import AppButton from "./AppButton";
import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "./AppSearchField";

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
          <AppSearchField
            fullWidth
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 40,
                bgcolor: alpha(m.navy, 0.01),
              },
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
              tone="secondary"
              onClick={onFilterClick}
              startIcon={<TuneRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                height: 40,
                px: 1.5,
                fontSize: 12.5,
                borderColor:
                  activeFilterCount > 0
                    ? alpha(m.teal, 0.45)
                    : undefined,
                color: activeFilterCount > 0 ? m.teal : undefined,
                bgcolor:
                  activeFilterCount > 0 ? alpha(m.teal, 0.06) : undefined,
              }}
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </AppButton>
          ) : null}
          <AppButton
            tone="secondary"
            onClick={onSortClick}
            startIcon={<SortRoundedIcon sx={{ fontSize: 18 }} />}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{ height: 40, px: 1.5, fontSize: 12.5 }}
          >
            Sort By
          </AppButton>
          <AppButton
            tone="primary"
            onClick={onAddClick}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{ height: 40, px: 1.5, fontSize: 12.5 }}
          >
            Add
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  );
}
