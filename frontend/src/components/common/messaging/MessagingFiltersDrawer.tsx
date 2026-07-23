"use client";

import * as React from "react";
import { Box, Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import MessagingFilterCheckboxList from "./MessagingFilterCheckboxList";
import MessagingInsetOverlay from "./MessagingInsetOverlay";
import type { MessagingDrawerFilters } from "./messagingTypes";

const SEARCH_OPTIONS: {
  key: MessagingDrawerFilters["searchFor"];
  label: string;
  info?: boolean;
  professionalOnly?: boolean;
}[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "requested", label: "Requests", info: true },
  { key: "cancelled", label: "Cancelled" },
  { key: "invalid", label: "Invalid" },
  { key: "no_show", label: "No Show", professionalOnly: true },
  { key: "unlinked", label: "No booking status", info: true },
];

type Props = {
  open: boolean;
  onClose: () => void;
  filters: MessagingDrawerFilters;
  onChange: (next: MessagingDrawerFilters) => void;
  onApply: () => void;
  onCancel: () => void;
  audience?: "client" | "professional";
  embedded?: boolean;
};

function FiltersContent({
  filters,
  onChange,
  audience = "client",
}: {
  filters: MessagingDrawerFilters;
  onChange: (next: MessagingDrawerFilters) => void;
  audience?: "client" | "professional";
}) {
  const visibleOptions = SEARCH_OPTIONS.filter((opt) => !opt.professionalOnly || audience === "professional");
  const searchChecked = visibleOptions.reduce(
    (acc, opt) => {
      acc[opt.key] = filters.searchFor === opt.key;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  return (
    <>
      <MessagingFilterCheckboxList
        title="Search for"
        options={visibleOptions}
        checked={searchChecked}
        singleSelect
        onToggle={(key, value) => {
          if (!value) return;
          onChange({ ...filters, searchFor: key as MessagingDrawerFilters["searchFor"] });
        }}
      />
      <Box sx={{ mt: 2.5 }}>
        <MessagingFilterCheckboxList
          title="Location"
          options={[
            { key: "fixed", label: "Fixed location" },
            { key: "desired", label: "Desired location" },
          ]}
          checked={{ fixed: filters.locationFixed, desired: filters.locationDesired }}
          onToggle={(key, value) =>
            onChange({
              ...filters,
              locationFixed: key === "fixed" ? value : filters.locationFixed,
              locationDesired: key === "desired" ? value : filters.locationDesired,
            })
          }
        />
      </Box>
    </>
  );
}

function FiltersFooter({
  onCancel,
  onApply,
}: {
  onCancel: () => void;
  onApply: () => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box sx={{ px: 2.5, py: 2, width: "100%" }}>
      <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onCancel}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "10px",
            borderColor: alpha(m.navy, 0.18),
            color: alpha(m.navy, 0.7),
          }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={onApply}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "10px",
            bgcolor: m.teal,
            "&:hover": { bgcolor: m.tealDark },
          }}
        >
          Apply
        </Button>
      </Stack>
    </Box>
  );
}

export default function MessagingFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onCancel,
  audience = "client",
  embedded = false,
}: Props) {
  const footer = <FiltersFooter onCancel={onCancel} onApply={onApply} />;
  const body = <FiltersContent filters={filters} onChange={onChange} audience={audience} />;

  if (embedded) {
    return (
      <MessagingInsetOverlay open={open} title="Filter messages" onClose={onClose} maxWidth={560} footer={footer}>
        {body}
      </MessagingInsetOverlay>
    );
  }

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filter messages"
      footer={footer}
      contentSx={{ px: 2.5, py: 1 }}
    >
      {body}
    </AppDrawer>
  );
}
