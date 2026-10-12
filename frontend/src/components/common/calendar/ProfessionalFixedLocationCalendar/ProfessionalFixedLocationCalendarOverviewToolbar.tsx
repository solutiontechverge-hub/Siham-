"use client";

import AppButton from "../../AppButton";
import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, IconButton, Popover, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppCalendarPanel } from "../../AppDatePicker";
import CalendarAddMenu from "../CalendarAddMenu";
import {
  createEmptyPublicBusinessHoursDraft,
  draftFromPublicBusinessHoursEntries,
  locationHasPublicHoursConfigured,
} from "../CalendarPublicBusinessHoursModal";
import {
  createEmptyBlockTimeDraft,
  fmtMinToTime,
  formatLongDateUtc,
  formatMonthYearUtc,
} from "../calendar.utils";
import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

/** Calendar Overview action-toolbar control height (matches Add @ 40px). */
const TOOLBAR_H = 40;

export type ProfessionalFixedLocationCalendarOverviewToolbarProps = Pick<
  Vm,
  | "activeDateIso"
  | "activeMonthIso"
  | "activeResource"
  | "addAnchor"
  | "addMenuBookingResourceId"
  | "appliedDesign"
  | "calendarSettings"
  | "data"
  | "datePickerAnchor"
  | "endMin"
  | "getAvailabilityFor"
  | "grid"
  | "isAddMenuBookingDisabled"
  | "m"
  | "nowMin"
  | "onNext"
  | "onPrev"
  | "onToday"
  | "openBookingDrawer"
  | "resetToDefaultTeamMember"
  | "setActiveDateIso"
  | "setAddAnchor"
  | "setBlockDraft"
  | "setBlockTimeOpen"
  | "setDatePickerAnchor"
  | "setDesignDraft"
  | "setDesignOpen"
  | "setFiltersOpen"
  | "setPublicBusinessHoursDraft"
  | "setPublicBusinessHoursOpen"
  | "setSelectedResourceId"
  | "setViewMode"
  | "showSnackbar"
  | "startMin"
  | "todayIso"
  | "userPickedTeamMemberRef"
  | "viewMode"
>;

export default function ProfessionalFixedLocationCalendarOverviewToolbar(
  props: ProfessionalFixedLocationCalendarOverviewToolbarProps,
) {
  const {
    activeDateIso,
    activeMonthIso,
    activeResource,
    addAnchor,
    addMenuBookingResourceId,
    appliedDesign,
    calendarSettings,
    data,
    datePickerAnchor,
    endMin,
    getAvailabilityFor,
    grid,
    isAddMenuBookingDisabled,
    m,
    nowMin,
    onNext,
    onPrev,
    onToday,
    openBookingDrawer,
    resetToDefaultTeamMember,
    setActiveDateIso,
    setAddAnchor,
    setBlockDraft,
    setBlockTimeOpen,
    setDatePickerAnchor,
    setDesignDraft,
    setDesignOpen,
    setFiltersOpen,
    setPublicBusinessHoursDraft,
    setPublicBusinessHoursOpen,
    setSelectedResourceId,
    setViewMode,
    showSnackbar,
    startMin,
    todayIso,
    userPickedTeamMemberRef,
    viewMode,
  } = props;

  return (
<Box sx={{ px: { xs: 1.25, md: 2 }, py: 1.25, bgcolor: "#fff" }}>
  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
    flexWrap="wrap"
    useFlexGap
  >
    <Stack direction="row" spacing={0.75} alignItems="center">
      <IconButton
        size="small"
        onClick={onPrev}
        sx={{
          width: TOOLBAR_H,
          height: TOOLBAR_H,
          borderRadius: "5px",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          color: alpha(m.navy, 0.6),
          bgcolor: "#fff",
        }}
      >
        <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <AppButton
        variant="outlined"
        startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
        onClick={(e) => setDatePickerAnchor(e.currentTarget)}
        sx={{
          borderRadius: "6px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: 10.5,
          borderColor: alpha(m.navy, 0.12),
          color: alpha(m.navy, 0.78),
          bgcolor: "#fff",
          height: TOOLBAR_H,
          px: 1,
          "& .MuiButton-startIcon": { mr: 0.45 },
        }}
      >
        {viewMode === "month"
          ? formatMonthYearUtc(activeMonthIso)
          : formatLongDateUtc(activeDateIso)}
      </AppButton>

      <Popover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        onClose={() => setDatePickerAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "14px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 16px 40px rgba(16, 35, 63, 0.13)",
            overflow: "hidden",
            bgcolor: "#fff",
          },
        }}
      >
        <AppCalendarPanel
          value={activeDateIso}
          onChange={(iso) => {
            setActiveDateIso(iso);
            setViewMode("day");
            resetToDefaultTeamMember();
          }}
          onDaySelect={() => setDatePickerAnchor(null)}
        />
      </Popover>

      <IconButton
        size="small"
        onClick={onNext}
        sx={{
          width: TOOLBAR_H,
          height: TOOLBAR_H,
          borderRadius: "5px",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          color: alpha(m.navy, 0.6),
          bgcolor: "#fff",
        }}
      >
        <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Stack>

    <Box sx={{ flex: 1 }} />

    <AppButton
      tone="secondary"
      onClick={onToday}
      sx={{
        fontSize: 10.5,
        height: TOOLBAR_H,
        px: 1,
      }}
    >
      Today
    </AppButton>

    <Box
      sx={{
        display: "flex",
        height: TOOLBAR_H,
        borderRadius: "5px",
        overflow: "hidden",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        bgcolor: "#fff",
      }}
    >
      {(["day", "week"] as const).map((v) => {
        const active = v === viewMode;
        return (
          <AppButton
            key={v}
            onClick={() => {
              setViewMode(v);
              if (v === "day") {
                resetToDefaultTeamMember();
              } else {
                userPickedTeamMemberRef.current = false;
                setSelectedResourceId("");
              }
            }}
            sx={{
              borderRadius: 0,
              minWidth: 38,
              height: TOOLBAR_H,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 10.5,
              bgcolor: active ? alpha(m.teal, 0.08) : "#fff",
              color: alpha(m.navy, 0.78),
            }}
          >
            {v === "day" ? "Day" : "Week"}
          </AppButton>
        );
      })}
    </Box>

    <AppButton
      tone="secondary"
      startIcon={<FilterListRoundedIcon sx={{ fontSize: 18 }} />}
      onClick={() => setFiltersOpen(true)}
      sx={{
        borderRadius: "5px",
        fontSize: 10.5,
        height: TOOLBAR_H,
        px: 1,
        "& .MuiButton-startIcon": { mr: 0.45 },
      }}
    >
      Filters
    </AppButton>

    <AppButton
      tone="primary"
      endIcon={<KeyboardArrowDownRoundedIcon />}
      onClick={(e) => setAddAnchor(e.currentTarget)}
      sx={{
        fontSize: 10.5,
        height: TOOLBAR_H,
        px: 1.1,
        "& .MuiButton-endIcon": { color: "#fff" },
      }}
    >
      Add
    </AppButton>
    <CalendarAddMenu
      anchorEl={addAnchor}
      bookingDisabled={isAddMenuBookingDisabled}
      onBlockedTime={() => {
        setBlockDraft(
          createEmptyBlockTimeDraft(
            activeResource
              ? [activeResource.id]
              : data.resources.map((r) => r.id),
            data.supportedLocations,
            activeDateIso,
          ),
        );
        setBlockTimeOpen(true);
      }}
      onBooking={() => {
        const bookingDate = activeDateIso;
        const resourceId =
          addMenuBookingResourceId ||
          data.resources[0]?.id ||
          "unassigned";
        const availability = getAvailabilityFor(
          resourceId,
          bookingDate,
        );
        const segment = availability[0] ?? {
          startMin,
          endMin: Math.min(endMin, startMin + grid.stepMinutes),
        };
        let start = Number.isFinite(segment.startMin)
          ? segment.startMin
          : startMin;
        const segmentEnd = Number.isFinite(segment.endMin)
          ? segment.endMin
          : Math.min(endMin, start + grid.stepMinutes);
        if (bookingDate === todayIso && start < nowMin) {
          const snapped =
            Math.ceil(nowMin / grid.stepMinutes) * grid.stepMinutes;
          if (snapped < segmentEnd) start = snapped;
        }
        openBookingDrawer(
          {
            resourceId,
            date: bookingDate,
            start: fmtMinToTime(start),
            end: fmtMinToTime(
              Math.min(segmentEnd, start + grid.stepMinutes),
            ),
            freeStart: fmtMinToTime(
              Number.isFinite(segment.startMin)
                ? segment.startMin
                : start,
            ),
            freeEnd: fmtMinToTime(segmentEnd),
          },
          { allowTimeSelection: true },
        );
      }}
      onPublicBusinessHours={() => {
        const defaultLocation =
          data.supportedLocations.find(
            (location) => location === "FL" || location === "DL",
          ) ?? "FL";
        const existing = Array.isArray(
          calendarSettings?.availability.publicBusinessHours,
        )
          ? calendarSettings.availability.publicBusinessHours
          : [];
        setPublicBusinessHoursDraft(
          locationHasPublicHoursConfigured(existing, defaultLocation)
            ? draftFromPublicBusinessHoursEntries(
                existing,
                defaultLocation,
              )
            : createEmptyPublicBusinessHoursDraft(defaultLocation),
        );
        setPublicBusinessHoursOpen(true);
      }}
      onDesign={() => {
        setDesignDraft(appliedDesign);
        setDesignOpen(true);
      }}
      onClose={() => setAddAnchor(null)}
      onMockAction={(label) =>
        showSnackbar({ severity: "info", message: label })
      }
    />
  </Stack>
</Box>
  );
}
