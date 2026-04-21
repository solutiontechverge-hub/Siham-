"use client";

import * as React from "react";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Button, MenuItem, Stack } from "@mui/material";
import { MollureTextField } from "../../common";
import { useListingTokens, type ListingSortValue } from "../../../app/clients/listing/listing.use";

export type ClientListingToolbarData = {
  filterLabel: string;
  sortOptions: readonly { label: string; value: ListingSortValue }[];
};

export function ClientListingToolbar({
  data,
  sort,
  onSortChange,
}: {
  data: ClientListingToolbarData;
  sort: ListingSortValue;
  onSortChange: (next: ListingSortValue) => void;
}) {
  const tokens = useListingTokens();

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.25} sx={{ mb: 2 }}>
      <Button
        variant="text"
        startIcon={<TuneRoundedIcon />}
        sx={{
          textTransform: "none",
          fontWeight: 800,
          color: tokens.slate,
          "&:hover": { bgcolor: "rgba(33, 184, 191, 0.08)", color: tokens.navy },
        }}
      >
        {data.filterLabel}
      </Button>

      <MollureTextField
        select
        size="small"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as ListingSortValue)}
        sx={{
          width: 170,
          "& .MuiOutlinedInput-root": {
            height: 40,
            bgcolor: "#fff",
            borderRadius: "6px",
            fontSize: 13,
            color: tokens.navy,
            "& fieldset": { borderColor: tokens.inputBorder },
            "&:hover fieldset": { borderColor: tokens.inputBorderHover },
            "&.Mui-focused fieldset": { borderColor: tokens.teal, borderWidth: 1 },
          },
        }}
        InputProps={{
          startAdornment: <SortRoundedIcon sx={{ color: tokens.placeholder, mr: 0.75 }} />,
        }}
      >
        {data.sortOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </MollureTextField>
    </Stack>
  );
}

