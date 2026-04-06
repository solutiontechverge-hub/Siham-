"use client";

import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Box, Chip, Stack, Typography, type PaperProps } from "@mui/material";
import ContentCard from "./ContentCard";

type FilterItem = {
  key: string;
  label: string;
};

type FilterPanelProps = PaperProps & {
  title?: React.ReactNode;
  filters?: FilterItem[];
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export default function FilterPanel({
  children,
  filters = [],
  footer,
  title = "Filters",
  ...props
}: FilterPanelProps) {
  return (
    <ContentCard
      title={
        <Stack direction="row" spacing={1} alignItems="center">
          <TuneRoundedIcon fontSize="small" />
          <span>{title}</span>
        </Stack>
      }
      {...props}
    >
      <Stack spacing={2}>
        {filters.length > 0 ? (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {filters.map((filter) => (
              <Chip key={filter.key} label={filter.label} variant="outlined" />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No active filters yet.
          </Typography>
        )}
        {children}
        {footer}
      </Stack>
    </ContentCard>
  );
}
