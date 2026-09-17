"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import AppModal from "../AppModal";
import MessagingFilterCheckboxList from "./MessagingFilterCheckboxList";
import { MESSAGE_RETENTION_DAYS } from "./messagingRetention";
import type {
  BookingStatusFilter,
  MessagingPresenceStatus,
  MessagingSettingsFilters,
} from "./messagingTypes";

const AUTO_DELETE_OPTIONS: { key: BookingStatusFilter; label: string }[] = [
  { key: "completed", label: "Completed bookings" },
  { key: "cancelled", label: "Cancelled bookings" },
  { key: "invalid", label: "Invalid bookings" },
  { key: "no_show", label: "No shows" },
  { key: "unlinked", label: "Unlinked" },
];

const PRESENCE_OPTIONS: {
  key: MessagingPresenceStatus;
  label: string;
  color: string;
}[] = [
  { key: "online", label: "Online (automatic)", color: "#4CAF50" },
  { key: "busy", label: "Busy", color: "#FF9800" },
  { key: "offline", label: "Offline", color: "#F44336" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  filters: MessagingSettingsFilters;
  onChange: (next: MessagingSettingsFilters) => void;
  presenceStatus: MessagingPresenceStatus;
  onPresenceChange: (status: MessagingPresenceStatus) => void;
  embedded?: boolean;
};

function SettingsContent({
  filters,
  onChange,
  presenceStatus,
  onPresenceChange,
}: {
  filters: MessagingSettingsFilters;
  onChange: (next: MessagingSettingsFilters) => void;
  presenceStatus: MessagingPresenceStatus;
  onPresenceChange: (status: MessagingPresenceStatus) => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <>
      <Typography
        sx={mollureLabelSx(m.navy, {
          color: alpha(m.navy, 0.55),
          mb: 1,
          mt: 0.5,
        })}
      >
        Status
      </Typography>
      <Stack spacing={0.75} sx={{ mb: 2.5 }}>
        {PRESENCE_OPTIONS.map((option) => {
          const active = presenceStatus === option.key;
          const disabled = option.key === "online";
          return (
            <Box
              key={option.key}
              onClick={() => {
                if (!disabled) onPresenceChange(option.key);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.25,
                py: 1,
                borderRadius: "10px",
                cursor: disabled ? "default" : "pointer",
                bgcolor: active ? alpha(m.teal, 0.08) : alpha(m.navy, 0.04),
                border: `1px solid ${active ? alpha(m.teal, 0.25) : "transparent"}`,
                opacity: disabled ? 0.85 : 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: option.color,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  {option.label}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Typography
        sx={mollureLabelSx(m.navy, {
          color: alpha(m.navy, 0.55),
          mb: 1,
          mt: 0.75,
        })}
      >
        Auto delete messages of
      </Typography>
      <MessagingFilterCheckboxList
        options={AUTO_DELETE_OPTIONS}
        checked={filters as Record<string, boolean>}
        onToggle={(key, value) =>
          onChange({ ...filters, [key as BookingStatusFilter]: value })
        }
      />

      <Typography
        sx={{
          mt: 2.5,
          fontSize: 11.5,
          fontWeight: 600,
          color: alpha(m.navy, 0.45),
          lineHeight: 1.5,
        }}
      >
        Messages are kept for {MESSAGE_RETENTION_DAYS} days. Older messages are
        automatically deleted for everyone.
      </Typography>
    </>
  );
}

export default function MessagingSettingsDialog({
  open,
  onClose,
  filters,
  onChange,
  presenceStatus,
  onPresenceChange,
  embedded = false,
}: Props) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Settings"
      maxWidth="xs"
      embedded={embedded}
      contentSx={{ px: 2.5, pt: 2.5, pb: 2 }}
    >
      <SettingsContent
        filters={filters}
        onChange={onChange}
        presenceStatus={presenceStatus}
        onPresenceChange={onPresenceChange}
      />
    </AppModal>
  );
}
