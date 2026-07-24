"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Checkbox, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import type {
  CalendarBookingLocation,
  CalendarBookingType,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { CalendarFilters } from "./calendar.utils";

type CalendarFiltersDrawerProps = {
  appliedFilters: CalendarFilters;
  bookingTypes: readonly CalendarBookingType[];
  draftFilters: CalendarFilters;
  initialFilters: CalendarFilters;
  locations: readonly CalendarBookingLocation[];
  onApply: (filters: CalendarFilters) => void;
  onClose: () => void;
  open: boolean;
  resources: readonly CalendarResource[];
  setDraftFilters: React.Dispatch<React.SetStateAction<CalendarFilters>>;
};

function FilterRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        margin: 0,
        padding: "2px 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disableRipple
        sx={{
          padding: 0,
          margin: 0,
          width: 18,
          height: 18,
          color: alpha(m.navy, 0.35),
          "&.Mui-checked": { color: m.teal },
          "& .MuiSvgIcon-root": { fontSize: 18 },
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 500,
          color: alpha(m.navy, 0.72),
          margin: 0,
          padding: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const m = useTheme().palette.mollure;
  return (
    <Typography
      component="div"
      sx={{
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1.2,
        color: alpha(m.navy, 0.7),
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

export default function CalendarFiltersDrawer({
  appliedFilters,
  bookingTypes,
  draftFilters,
  initialFilters,
  locations,
  onApply,
  onClose,
  open,
  resources,
  setDraftFilters,
}: CalendarFiltersDrawerProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filter calendar"
      footer={
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1}>
            <AppButton
              fullWidth
              tone="secondary"
              onClick={() => {
                setDraftFilters(appliedFilters);
                onClose();
              }}
              sx={{ borderRadius: "8px" }}
            >
              Cancel
            </AppButton>
            <AppButton
              fullWidth
              tone="secondary"
              onClick={() => setDraftFilters(initialFilters)}
              sx={{ borderRadius: "8px" }}
            >
              Reset
            </AppButton>
            <AppButton
              tone="primary"
              fullWidth
              onClick={() => onApply(draftFilters)}
              sx={{ borderRadius: "8px" }}
            >
              Apply
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2}>
          <Box>
            <SectionHeading>Team Member</SectionHeading>
            <Stack spacing={0.75}>
              <FilterRow
                label="All"
                checked={draftFilters.teamAll}
                onChange={(checked) =>
                  setDraftFilters((p) => ({
                    ...p,
                    teamAll: checked,
                    teamIds: Object.fromEntries(
                      Object.keys(p.teamIds).map((id) => [id, false]),
                    ),
                  }))
                }
              />
              {resources.map((r, i) => (
                <FilterRow
                  key={r.id}
                  label={`TM ${String.fromCharCode(65 + i)}`}
                  checked={
                    !draftFilters.teamAll && Boolean(draftFilters.teamIds[r.id])
                  }
                  onChange={(checked) =>
                    setDraftFilters((p) => ({
                      ...p,
                      teamAll: false,
                      teamIds: { ...p.teamIds, [r.id]: checked },
                    }))
                  }
                />
              ))}
            </Stack>
            <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
          </Box>

          {locations.length > 1 ? (
            <Box>
              <SectionHeading>Location</SectionHeading>
              <Stack spacing={0.75}>
                <FilterRow
                  label="All"
                  checked={draftFilters.locationAll}
                  onChange={(checked) =>
                    setDraftFilters((p) => ({
                      ...p,
                      locationAll: checked,
                      locations: { FL: false, DL: false },
                    }))
                  }
                />
                {locations.map((loc) => (
                  <FilterRow
                    key={loc}
                    label={loc}
                    checked={
                      !draftFilters.locationAll &&
                      Boolean(draftFilters.locations[loc])
                    }
                    onChange={(checked) =>
                      setDraftFilters((p) => ({
                        ...p,
                        locationAll: false,
                        locations: { ...p.locations, [loc]: checked },
                      }))
                    }
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
            </Box>
          ) : null}

          <Box>
            <SectionHeading>Booking</SectionHeading>
            <Stack spacing={0.75}>
              <FilterRow
                label="All"
                checked={draftFilters.bookingAll}
                onChange={(checked) =>
                  setDraftFilters((p) => ({
                    ...p,
                    bookingAll: checked,
                    booking: {
                      Online: false,
                      Offline: false,
                      Project: false,
                      Requests: false,
                    },
                  }))
                }
              />
              {bookingTypes.map((bt) => (
                <FilterRow
                  key={bt}
                  label={bt}
                  checked={
                    !draftFilters.bookingAll && Boolean(draftFilters.booking[bt])
                  }
                  onChange={(checked) =>
                    setDraftFilters((p) => ({
                      ...p,
                      bookingAll: false,
                      booking: { ...p.booking, [bt]: checked },
                    }))
                  }
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </AppDrawer>
  );
}
