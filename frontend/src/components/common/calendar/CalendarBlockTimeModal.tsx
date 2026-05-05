"use client";

import * as React from "react";
import { Box, Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDropdown from "../AppDropdown";
import AppSelect from "../AppSelect";
import AppTextField from "../AppTextField";
import MollureModal from "../MollureModal";
import type { CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BlockTimeDraft } from "./calendar.utils";

type CalendarBlockTimeModalProps = {
  draft: BlockTimeDraft;
  onApply: () => void;
  onClose: () => void;
  open: boolean;
  resources: readonly CalendarResource[];
  setDraft: React.Dispatch<React.SetStateAction<BlockTimeDraft>>;
  teamLabelById: ReadonlyMap<string, string>;
};

const dayOptions = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

export default function CalendarBlockTimeModal({
  draft,
  onApply,
  onClose,
  open,
  resources,
  setDraft,
  teamLabelById,
}: CalendarBlockTimeModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title="Add Block Time"
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
          <AppSelect
            label="Title"
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value as BlockTimeDraft["title"] }))}
            options={[
              { label: "Meeting", value: "Meeting" },
              { label: "Training", value: "Training" },
              { label: "Holiday", value: "Holiday" },
              { label: "Custom", value: "Custom" },
            ]}
            fullWidth
          />

          <AppDropdown
            label="Team Member"
            value={draft.teamIds}
            multiple
            renderValue={(selected) => {
              const ids = selected as readonly string[];
              if (!ids.length) return "Select Team Member";
              if (ids.length === resources.length) return "All";
              return ids.map((id) => teamLabelById.get(id) ?? id).join(", ");
            }}
            onChange={(val) => setDraft((p) => ({ ...p, teamIds: val as string[] }))}
            options={resources.map((r) => ({ value: r.id, label: teamLabelById.get(r.id) ?? r.name }))}
            fullWidth
          />

          <AppDropdown
            label="Location"
            value={draft.locations}
            multiple
            renderValue={(selected) => {
              const locs = selected as readonly string[];
              if (!locs.length) return "Select Location";
              if (locs.length === 2) return "All";
              return locs.join(", ");
            }}
            onChange={(val) => setDraft((p) => ({ ...p, locations: val as CalendarBookingLocation[] }))}
            options={[
              { label: "FL", value: "FL" },
              { label: "DL", value: "DL" },
            ]}
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <AppTextField
              label="Date (from)"
              type="date"
              value={draft.dateFrom}
              onChange={(e) => setDraft((p) => ({ ...p, dateFrom: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <AppTextField
              label="Date (to)"
              type="date"
              value={draft.dateTo}
              onChange={(e) => setDraft((p) => ({ ...p, dateTo: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppSelect
              label="Day (from)"
              value={draft.dayFrom}
              onChange={(e) => setDraft((p) => ({ ...p, dayFrom: e.target.value as BlockTimeDraft["dayFrom"] }))}
              options={dayOptions}
              fullWidth
            />
            <AppSelect
              label="Day (to)"
              value={draft.dayTo}
              onChange={(e) => setDraft((p) => ({ ...p, dayTo: e.target.value as BlockTimeDraft["dayTo"] }))}
              options={dayOptions}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <AppTextField
              label="Start Time"
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft((p) => ({ ...p, startTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <AppTextField
              label="End Time"
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft((p) => ({ ...p, endTime: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>
      </Box>
    </MollureModal>
  );
}
