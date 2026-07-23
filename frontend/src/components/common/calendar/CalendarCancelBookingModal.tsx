"use client";

import * as React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";

export type CancelBookingPayload = {
  reasons: string[];
  details: string;
};

type CalendarCancelBookingModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: CancelBookingPayload) => void;
};

const REASON_OPTIONS = [
  { label: "No availability / Fully booked", value: "no_availability" },
  { label: "Service not available on selected date/time", value: "service_unavailable" },
  { label: "Invalid booking details", value: "invalid_details" },
  { label: "Other reason", value: "other" },
];

export default function CalendarCancelBookingModal({
  open,
  onClose,
  onConfirm,
}: CalendarCancelBookingModalProps) {
  const m = useTheme().palette.mollure;
  const [reasons, setReasons] = React.useState<string[]>([]);
  const [details, setDetails] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReasons(REASON_OPTIONS.map((o) => o.value));
      setDetails("");
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} title="Cancel Booking" maxWidth="sm" fullWidth headerTone="danger">
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <WarningRoundedIcon sx={{ fontSize: 52, color: "#E85D5D" }} />
          <Typography
            sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.88), textAlign: "center", lineHeight: 1.4 }}
          >
            Are you sure you want to Cancel this booking?
          </Typography>
        </Stack>

        <Stack spacing={1.75}>
          <AppDropdown
            label="Reason"
            value={reasons}
            multiple
            placeholder="Select Reason"
            renderValue={(selected) => {
              const ids = selected as readonly string[];
              if (!ids.length) return "Select Reason";
              if (ids.length === REASON_OPTIONS.length) return "All Reasons";
              return REASON_OPTIONS.filter((o) => ids.includes(o.value))
                .map((o) => o.label)
                .join(", ");
            }}
            onChange={(val) => setReasons(val as string[])}
            options={REASON_OPTIONS}
            fullWidth
          />

          <AppTextField
            label="Additional Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="..."
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </Box>
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" justifyContent="center" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 800,
              height: 40,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
              bgcolor: "#fff",
              minWidth: 120,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => onConfirm({ reasons, details: details.trim() })}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 800,
              height: 40,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
              minWidth: 120,
            }}
          >
            Yes, Reject
          </Button>
        </Stack>
      </Box>
    </AppModal>
  );
}
