"use client";

import * as React from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";

export type PublicBusinessHoursDraft = {
  location: "" | "FL" | "DL";
  schedule: "" | "fixed" | "variable";
  day: "" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string;
  notAvailable: boolean;
  note: string;
};

type CalendarPublicBusinessHoursModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  draft: PublicBusinessHoursDraft;
  setDraft: React.Dispatch<React.SetStateAction<PublicBusinessHoursDraft>>;
};

const dayOptions: Array<{ label: string; value: PublicBusinessHoursDraft["day"] }> = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

export default function CalendarPublicBusinessHoursModal({
  open,
  onClose,
  onApply,
  draft,
  setDraft,
}: CalendarPublicBusinessHoursModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title="Public Business Hours"
      maxWidth="sm"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                minWidth: 110,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={onApply}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
                minWidth: 110,
              }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.75}>
          <AppDropdown
            label="Location"
            value={draft.location}
            onChange={(val) => setDraft((p) => ({ ...p, location: String(val) as PublicBusinessHoursDraft["location"] }))}
            options={[
              { label: "FL", value: "FL" },
              { label: "DL", value: "DL" },
            ]}
            placeholder="Select Location"
            fullWidth
          />

          <AppDropdown
            label="Schedule"
            value={draft.schedule}
            onChange={(val) => setDraft((p) => ({ ...p, schedule: String(val) as PublicBusinessHoursDraft["schedule"] }))}
            options={[
              { label: "Fixed schedule", value: "fixed" },
              { label: "Variable schedule", value: "variable" },
            ]}
            placeholder="Select Schedule"
            fullWidth
          />

          <AppDropdown
            label="Day"
            value={draft.day}
            onChange={(val) => setDraft((p) => ({ ...p, day: String(val) as PublicBusinessHoursDraft["day"] }))}
            options={dayOptions.map((d) => ({ label: d.label, value: d.value }))}
            placeholder="Select Day"
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <AppTextField
              label="Start Time (from)"
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft((p) => ({ ...p, startTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <AppTextField
              label="End Time (to)"
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft((p) => ({ ...p, endTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={draft.notAvailable}
                onChange={(e) => setDraft((p) => ({ ...p, notAvailable: e.target.checked }))}
                size="small"
              />
            }
            label="Not Availability"
            sx={{
              "& .MuiFormControlLabel-label": { fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.7) },
              m: 0,
            }}
          />

          <AppTextField
            label="Add Note"
            value={draft.note}
            onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </Box>
    </MollureModal>
  );
}

