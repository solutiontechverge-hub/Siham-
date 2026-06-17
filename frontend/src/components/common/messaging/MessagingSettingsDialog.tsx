"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingFilterCheckboxList from "./MessagingFilterCheckboxList";
import MessagingInsetOverlay from "./MessagingInsetOverlay";
import type { MessagingSettingsFilters } from "./messagingTypes";
import type { BookingStatusFilter } from "./messagingTypes";

const OPTIONS: { key: BookingStatusFilter; label: string }[] = [
  { key: "completed", label: "Completed bookings" },
  { key: "cancelled", label: "Cancelled bookings" },
  { key: "invalid", label: "Invalid bookings" },
  { key: "no_show", label: "No shows" },
  { key: "unlinked", label: "Unlinked" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  filters: MessagingSettingsFilters;
  onChange: (next: MessagingSettingsFilters) => void;
  embedded?: boolean;
};

function SettingsContent({
  filters,
  onChange,
}: {
  filters: MessagingSettingsFilters;
  onChange: (next: MessagingSettingsFilters) => void;
}) {
  return (
    <MessagingFilterCheckboxList
      options={OPTIONS}
      checked={filters as Record<string, boolean>}
      onToggle={(key, value) => onChange({ ...filters, [key as BookingStatusFilter]: value })}
    />
  );
}

export default function MessagingSettingsDialog({ open, onClose, filters, onChange, embedded = false }: Props) {
  const m = useTheme().palette.mollure;

  if (embedded) {
    return (
      <MessagingInsetOverlay open={open} title="Settings" onClose={onClose} maxWidth={380}>
        <SettingsContent filters={filters} onChange={onChange} />
      </MessagingInsetOverlay>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.88) }}>Settings</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close settings">
            <CloseRoundedIcon sx={{ color: alpha(m.navy, 0.45) }} />
          </IconButton>
        </Stack>
        <SettingsContent filters={filters} onChange={onChange} />
      </DialogContent>
    </Dialog>
  );
}
