"use client";

import * as React from "react";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import {
  FilterDrawerCheckboxRow,
  FilterDrawerSectionHeading,
} from "../FilterDrawerFields";
import { FinanceDrawerFiltersFooter } from "../FinanceDrawerFooter";
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
  const sectionDivider = (
    <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
  );

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filter calendar"
      footer={
        <FinanceDrawerFiltersFooter
          spacing={1}
          stackSx={{ p: 2 }}
          buttonSx={{ borderRadius: "8px" }}
          onCancel={() => {
            setDraftFilters(appliedFilters);
            onClose();
          }}
          onReset={() => setDraftFilters(initialFilters)}
          onApply={() => onApply(draftFilters)}
        />
      }
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2}>
          <Box>
            <FilterDrawerSectionHeading>Team Member</FilterDrawerSectionHeading>
            <Stack spacing={0.75}>
              <FilterDrawerCheckboxRow
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
              {resources.map((r) => {
                const isChecked =
                  !draftFilters.teamAll && Boolean(draftFilters.teamIds[r.id]);
                return (
                <FilterDrawerCheckboxRow
                  key={r.id}
                  label={r.name}
                  checked={isChecked}
                  onChange={(checked) =>
                    setDraftFilters((p) => {
                      const teamIds = { ...p.teamIds, [r.id]: checked };
                      const nextSelected = resources.filter(
                        (member) => teamIds[member.id],
                      );
                      if (nextSelected.length === resources.length) {
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
                );
              })}
            </Stack>
            {sectionDivider}
          </Box>

          {locations.length > 1 ? (
            <Box>
              <FilterDrawerSectionHeading>Location</FilterDrawerSectionHeading>
              <Stack spacing={0.75}>
                <FilterDrawerCheckboxRow
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
                  <FilterDrawerCheckboxRow
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
              {sectionDivider}
            </Box>
          ) : null}

          <Box>
            <FilterDrawerSectionHeading>Booking</FilterDrawerSectionHeading>
            <Stack spacing={0.75}>
              <FilterDrawerCheckboxRow
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
                <FilterDrawerCheckboxRow
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
            <FilterDrawerSectionHeading>Status</FilterDrawerSectionHeading>
            <Stack spacing={0.75}>
              <FilterDrawerCheckboxRow
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
                  <FilterDrawerCheckboxRow
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
                    <FilterDrawerCheckboxRow
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
