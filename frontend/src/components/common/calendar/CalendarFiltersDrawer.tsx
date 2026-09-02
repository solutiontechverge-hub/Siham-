"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Checkbox, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import type {
  CalendarBookingLocation,
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  EMPTY_CALENDAR_BOOKING_TYPES,
  EMPTY_CALENDAR_STATUSES,
  type CalendarFilters,
} from "./calendar.utils";

type CalendarFiltersDrawerProps = {
  appliedFilters: CalendarFilters;
  bookingTypes: readonly CalendarBookingType[];
  bookingStatuses?: readonly CalendarBookingStatus[];
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
  bookingStatuses = ["Confirmed", "Completed", "Cancelled", "Invalid", "No Show"],
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
                    teamIds: checked
                      ? Object.fromEntries(
                          Object.keys(p.teamIds).map((id) => [id, false]),
                        )
                      : p.teamIds,
                  }))
                }
              />
              {resources.map((r) => (
                <FilterRow
                  key={r.id}
                  label={r.name}
                  checked={
                    !draftFilters.teamAll && Boolean(draftFilters.teamIds[r.id])
                  }
                  onChange={(checked) =>
                    setDraftFilters((p) => {
                      const teamIds = { ...p.teamIds, [r.id]: checked };
                      const selectedCount = resources.filter(
                        (member) => teamIds[member.id],
                      ).length;
                      if (selectedCount === resources.length) {
                        return {
                          ...p,
                          teamAll: true,
                          teamIds: Object.fromEntries(
                            resources.map((member) => [member.id, false]),
                          ),
                        };
                      }
                      return { ...p, teamAll: false, teamIds };
                    })
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
                      locations: checked
                        ? { FL: false, DL: false }
                        : p.locations,
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
                      setDraftFilters((p) => {
                        const nextLocations = { ...p.locations, [loc]: checked };
                        const selectedCount = locations.filter(
                          (location) => nextLocations[location],
                        ).length;
                        if (selectedCount === locations.length) {
                          return {
                            ...p,
                            locationAll: true,
                            locations: { FL: false, DL: false },
                          };
                        }
                        return { ...p, locationAll: false, locations: nextLocations };
                      })
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
                    booking: checked
                      ? { ...EMPTY_CALENDAR_BOOKING_TYPES }
                      : p.booking,
                    statusAll: checked ? true : p.statusAll,
                    brRejectedOnly: checked ? false : p.brRejectedOnly,
                    statuses: checked
                      ? { ...EMPTY_CALENDAR_STATUSES }
                      : p.statuses,
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
                    setDraftFilters((p) => {
                      const booking = { ...p.booking, [bt]: checked };
                      const selectedCount = bookingTypes.filter(
                        (type) => booking[type],
                      ).length;
                      if (selectedCount === bookingTypes.length) {
                        return {
                          ...p,
                          bookingAll: true,
                          booking: { ...EMPTY_CALENDAR_BOOKING_TYPES },
                        };
                      }
                      return { ...p, bookingAll: false, booking };
                    })
                  }
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <SectionHeading>Status</SectionHeading>
            <Stack spacing={0.75}>
              <FilterRow
                label="All"
                checked={draftFilters.statusAll !== false}
                onChange={(checked) =>
                  setDraftFilters((p) => ({
                    ...p,
                    statusAll: checked,
                    brRejectedOnly: checked ? false : p.brRejectedOnly,
                    statuses: checked
                      ? { ...EMPTY_CALENDAR_STATUSES }
                      : p.statuses,
                  }))
                }
              />
              {bookingStatuses.map((st) => (
                <React.Fragment key={st}>
                  <FilterRow
                    label={st}
                    checked={
                      draftFilters.statusAll === false &&
                      Boolean(draftFilters.statuses?.[st])
                    }
                    onChange={(checked) =>
                      setDraftFilters((p) => {
                        const statuses = { ...p.statuses, [st]: checked };
                        const selectedCount = bookingStatuses.filter(
                          (status) => statuses[status],
                        ).length;
                        if (selectedCount === bookingStatuses.length) {
                          return {
                            ...p,
                            statusAll: true,
                            brRejectedOnly: false,
                            statuses: { ...EMPTY_CALENDAR_STATUSES },
                          };
                        }
                        return {
                          ...p,
                          statusAll: false,
                          statuses,
                        };
                      })
                    }
                  />
                  {st === "Invalid" ? (
                    <FilterRow
                      label="BR Rejected"
                      checked={
                        draftFilters.statusAll === false &&
                        Boolean(draftFilters.brRejectedOnly)
                      }
                      onChange={(checked) =>
                        setDraftFilters((p) => {
                          const next = {
                            ...p,
                            statusAll: false,
                            brRejectedOnly: checked,
                          };
                          const selectedCount = bookingStatuses.filter(
                            (status) => next.statuses[status],
                          ).length;
                          if (
                            !checked &&
                            selectedCount === 0
                          ) {
                            return {
                              ...next,
                              statusAll: true,
                              brRejectedOnly: false,
                            };
                          }
                          return next;
                        })
                      }
                    />
                  ) : null}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </AppDrawer>
  );
}
