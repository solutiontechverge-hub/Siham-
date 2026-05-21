"use client";

import * as React from "react";
import { Box, Button, Checkbox, Divider, FormControlLabel, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import MollureDrawer from "../MollureDrawer";
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
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <MollureDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filters"
      width={{ xs: "100%", sm: 320 }}
      footer={
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setDraftFilters(appliedFilters);
                onClose();
              }}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px" }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setDraftFilters(initialFilters)}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px" }}
            >
              Reset
            </Button>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => onApply(draftFilters)}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "8px", bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2}>
          <Box>
            <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Team Member</BodyText>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={draftFilters.teamAll}
                    onChange={(e) =>
                      setDraftFilters((p) => ({
                        ...p,
                        teamAll: e.target.checked,
                        teamIds: Object.fromEntries(Object.keys(p.teamIds).map((id) => [id, false])),
                      }))
                    }
                  />
                }
                label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
              />
              {resources.map((r, i) => (
                <FormControlLabel
                  key={r.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={!draftFilters.teamAll && Boolean(draftFilters.teamIds[r.id])}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          teamAll: false,
                          teamIds: { ...p.teamIds, [r.id]: e.target.checked },
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{`TM ${String.fromCharCode(65 + i)}`}</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
              ))}
            </Stack>
            <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
          </Box>

          {locations.length > 1 ? (
            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Location</BodyText>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={draftFilters.locationAll}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          locationAll: e.target.checked,
                          locations: { FL: false, DL: false },
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
                {locations.map((loc) => (
                  <FormControlLabel
                    key={loc}
                    control={
                      <Checkbox
                        size="small"
                        checked={!draftFilters.locationAll && Boolean(draftFilters.locations[loc])}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            locationAll: false,
                            locations: { ...p.locations, [loc]: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{loc}</BodyText>}
                    sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
            </Box>
          ) : null}

          <Box>
            <BodyText sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.7), mb: 0.75 }}>Booking</BodyText>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={draftFilters.bookingAll}
                    onChange={(e) =>
                      setDraftFilters((p) => ({
                        ...p,
                        bookingAll: e.target.checked,
                        booking: { Online: false, Offline: false, Project: false, Requests: false },
                      }))
                    }
                  />
                }
                label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>All</BodyText>}
                sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
              />
              {bookingTypes.map((bt) => (
                <FormControlLabel
                  key={bt}
                  control={
                    <Checkbox
                      size="small"
                      checked={!draftFilters.bookingAll && Boolean(draftFilters.booking[bt])}
                      onChange={(e) =>
                        setDraftFilters((p) => ({
                          ...p,
                          bookingAll: false,
                          booking: { ...p.booking, [bt]: e.target.checked },
                        }))
                      }
                    />
                  }
                  label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{bt}</BodyText>}
                  sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </MollureDrawer>
  );
}
