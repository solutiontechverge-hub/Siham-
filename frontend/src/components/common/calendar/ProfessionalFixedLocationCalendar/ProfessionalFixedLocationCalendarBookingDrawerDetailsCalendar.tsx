"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import {
  Box,
  ButtonBase,
  Paper,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import {
  AppCalendarPanel,
} from "../../AppDatePicker";

import {
  AppTimePanel,
} from "../../AppTimePicker";

import BookingEditedTag, { BookingChangeTags } from "../BookingEditedTag";

import {
  ACTIVITY_COMPARISON_SIGNPOST,
} from "../buildActivityComparison";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendarBag = Pick<
  Vm,
  | "allowDrawerTimeSelection"
  | "applyDesiredLocationKilometerDefaults"
  | "applyDrawerTimeSlot"
  | "calendarFieldLabel"
  | "data"
  | "defaultDateIso"
  | "drawerSelectableTimes"
  | "grid"
  | "isViewingBooking"
  | "isViewingExisting"
  | "m"
  | "openDrawerLineTagComparison"
  | "requestedScheduleLabel"
  | "scheduleChangeTags"
  | "selectedSlot"
  | "setActiveDateIso"
  | "setSelectedSlot"
  | "setSlotCalendarOpen"
  | "setSlotCalendarTouched"
  | "setSlotLocation"
  | "slotCalendarOpen"
  | "slotCalendarTouched"
  | "slotLocation"
  | "todayIso"
  | "unavailableBookingTooltip"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendarProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendarBag;
};

/** Calendar date/location selector + time slots */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendar({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsCalendarProps) {
  const {
    allowDrawerTimeSelection,
    applyDesiredLocationKilometerDefaults,
    applyDrawerTimeSlot,
    calendarFieldLabel,
    data,
    defaultDateIso,
    drawerSelectableTimes,
    grid,
    isViewingBooking,
    isViewingExisting,
    m,
    openDrawerLineTagComparison,
    requestedScheduleLabel,
    scheduleChangeTags,
    selectedSlot,
    setActiveDateIso,
    setSelectedSlot,
    setSlotCalendarOpen,
    setSlotCalendarTouched,
    setSlotLocation,
    slotCalendarOpen,
    slotCalendarTouched,
    slotLocation,
    todayIso,
    unavailableBookingTooltip,
  } = bag;

  return (
    <>
        {/* Calendar selector */}
        <Box>
          <BodyText
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.65),
              mb: 0.75,
            }}
          >
            Calendar
          </BodyText>
          <ButtonBase
            onClick={() => {
              if (isViewingExisting) return;
              setSlotCalendarOpen((prev) => !prev);
            }}
            disabled={isViewingExisting}
            sx={{
              width: "100%",
              border: `1px solid ${alpha(m.navy, 0.14)}`,
              borderRadius: "10px",
              minHeight: 40,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: isViewingExisting
                ? alpha(m.navy, 0.02)
                : "#fff",
              textAlign: "left",
              cursor: isViewingExisting ? "default" : "pointer",
              transition: "border-color 0.15s",
              "&:hover": {
                borderColor: isViewingExisting
                  ? alpha(m.navy, 0.14)
                  : m.teal,
              },
            }}
          >
            <BodyText
              sx={mollureLabelSx(m.navy, {
                color:
                  isViewingBooking || slotCalendarTouched
                    ? alpha(m.navy, 0.74)
                    : alpha(m.navy, 0.45),
              })}
            >
              {calendarFieldLabel}
            </BodyText>
            <KeyboardArrowDownRoundedIcon
              sx={{
                fontSize: 18,
                color: slotCalendarOpen
                  ? m.teal
                  : alpha(m.navy, 0.45),
                transform: slotCalendarOpen
                  ? "rotate(180deg)"
                  : "none",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
            />
          </ButtonBase>

          {requestedScheduleLabel ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mt: 1, px: 0.25 }}
            >
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.72),
                }}
              >
                Requested: {requestedScheduleLabel}
              </BodyText>
              <BookingEditedTag
                variant="edited"
                signpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                onSignpostClick={openDrawerLineTagComparison}
              />
            </Stack>
          ) : scheduleChangeTags.length ? (
            <Box sx={{ mt: 1, px: 0.25 }}>
              <BookingChangeTags
                variants={scheduleChangeTags}
                signpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
                onSignpostClick={openDrawerLineTagComparison}
              />
            </Box>
          ) : null}

          {slotCalendarOpen ? (
            <Paper
              elevation={0}
              sx={{
                mt: 1.5,
                mx: 0,
                width: "100%",
                borderRadius: "8px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                boxShadow: "0 8px 18px rgba(16, 35, 63, 0.08)",
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ p: 1.5 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(1, data.supportedLocations.length)}, 1fr)`,
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    borderRadius: "7px",
                    overflow: "hidden",
                    mb: 1.2,
                    maxWidth: 242,
                    mx: "auto",
                  }}
                >
                  {data.supportedLocations.map((loc) => {
                    const active = slotLocation === loc;
                    return (
                      <ButtonBase
                        key={loc}
                        onClick={() => {
                          if (isViewingExisting) return;
                          setSlotLocation(loc);
                          setSlotCalendarTouched(true);
                          if (loc === "DL") {
                            applyDesiredLocationKilometerDefaults();
                          }
                        }}
                        sx={{
                          height: 34,
                          fontSize: 10,
                          fontWeight: 900,
                          bgcolor: active ? m.teal : "#fff",
                          color: active
                            ? "#fff"
                            : alpha(m.navy, 0.55),
                          borderRight:
                            data.supportedLocations[
                              data.supportedLocations.length - 1
                            ] !== loc
                              ? `1px solid ${alpha(m.navy, 0.08)}`
                              : undefined,
                        }}
                      >
                        {loc === "FL"
                          ? "Fixed Location"
                          : "Desired Location"}
                      </ButtonBase>
                    );
                  })}
                </Box>

                <Box sx={{ mt: 0.5 }}>
                  <AppCalendarPanel
                    compact
                    value={selectedSlot?.date ?? defaultDateIso}
                    onChange={(iso) => {
                      setSelectedSlot((p) =>
                        p ? { ...p, date: iso } : p,
                      );
                      setSlotCalendarTouched(true);
                      setActiveDateIso(iso);
                    }}
                    min={isViewingBooking ? undefined : todayIso}
                  />
                </Box>
              </Box>
            </Paper>
          ) : null}

          {!isViewingExisting && allowDrawerTimeSelection ? (
            <Box sx={{ mt: 1.5 }}>
              <BodyText
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "primary.light",
                  mb: 0.85,
                }}
              >
                Select time
              </BodyText>
              {drawerSelectableTimes.length ? (
                <AppTimePanel
                  compact
                  hideHeader
                  variant="clock"
                  value={
                    selectedSlot?.start?.slice(0, 5) ||
                    drawerSelectableTimes[0] ||
                    "09:00"
                  }
                  onChange={applyDrawerTimeSlot}
                  minuteStep={grid.stepMinutes}
                  allowedTimes={drawerSelectableTimes}
                  unavailableTooltip={unavailableBookingTooltip}
                />
              ) : (
                <BodyText
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.45),
                  }}
                >
                  No available time slots for this date.
                </BodyText>
              )}
            </Box>
          ) : null}
        </Box>
    </>
  );
}
