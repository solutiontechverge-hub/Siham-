"use client";

import * as React from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import AppButton from "../../../components/common/AppButton";
import BookingSummaryNote from "../../../components/common/client-booking/BookingSummaryNote";
import { locationModeChipSx } from "../../../components/common/client-booking/locationModeChipSx";
import {
  bookingParticipantDisplayHeading,
  participantHeadingOrdinal,
  participantOrdinals,
  planningScheduleMeta,
} from "../../../components/common/client-booking/buildBookingSummarySections";
import type { ClientBookingSummarySection } from "../../../components/common/client-booking/types";
import { ServiceSummaryMetaLine } from "../../../components/common/ServiceSummaryMetaLine";
import {
  CLIENT_BOOKING_MIN_LEAD_ERROR,
  fmtMinutesToIsoTime,
  fmtMinutesToTimeLabel,
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "./booking-time";
import BookingStartEndTimeRow from "../../../components/common/BookingStartEndTimeRow";
import type { Service } from "./booking.page.types";

export type ClientBookingPaymentSummaryPanelProps = {
  summaryShopName: string;
  selectedDate: Date;
  bookingStartMinutes: number;
  bookingEndMinutes: number;
  isDesiredLocation: boolean;
  desiredTeamMemberFullName: string;
  summarySections: ClientBookingSummarySection[];
  clientNote: string;
  bookServicesAtSameTime: boolean;
  resolveServiceTeamMemberName: (service: Service) => string | undefined;
  /** Resolve assigned staff id for a service line (public profile open). */
  resolveServiceTeamMemberId?: (service: Service) => string | undefined;
  onTeamMemberClick?: (teamMemberId: string) => void;
  total: number;
  allServicesAssigned: boolean;
  servicesCount: number;
  unassigned: Service[];
  needsTeamMemberProvidedByPro: boolean;
  selectedTeamMemberId: string;
  selectedTimeTooSoon: boolean;
  isContinuing: boolean;
  onContinue: () => void | Promise<void>;
  continueLabel: string;
};

export default function ClientBookingPaymentSummaryPanel({
  summaryShopName,
  selectedDate,
  bookingStartMinutes,
  bookingEndMinutes,
  isDesiredLocation,
  desiredTeamMemberFullName,
  summarySections,
  clientNote,
  bookServicesAtSameTime,
  resolveServiceTeamMemberName,
  resolveServiceTeamMemberId,
  onTeamMemberClick,
  total,
  allServicesAssigned,
  servicesCount,
  unassigned,
  needsTeamMemberProvidedByPro,
  selectedTeamMemberId,
  selectedTimeTooSoon,
  isContinuing,
  onContinue,
  continueLabel,
}: ClientBookingPaymentSummaryPanelProps) {
  const m = useTheme().palette.mollure;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 1.8, pt: 1.2, pb: 1.05 }}>
        <Typography
          sx={mollureSectionTitleSx(m.navy, {
            color: m.headingText,
            textAlign: "center",
            lineHeight: 1.2,
          })}
        >
          Service Summary
        </Typography>
      </Box>
      <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
      <Box sx={{ px: 1.8, pt: 1.15, pb: 1.05 }}>
        <Typography
          sx={mollureSectionTitleSx(m.navy, {
            color: m.headingText,
            lineHeight: 1.2,
          })}
        >
          {summaryShopName}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.55}
          sx={{ mt: 0.65, minWidth: 0 }}
        >
          <AccessTimeRoundedIcon
            sx={{ fontSize: 15, color: m.teal, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontWeight: 800,
              color: alpha(m.teal, 0.95),
              fontSize: 10.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            ({fmtMinutesToTimeLabel(bookingStartMinutes)} –{" "}
            {fmtMinutesToTimeLabel(bookingEndMinutes)})
          </Typography>
        </Stack>

        <Chip
          label={isDesiredLocation ? "Desired Location" : "Fixed Location"}
          size="small"
          sx={{ ...locationModeChipSx, mt: 0.75 }}
        />
        <BookingStartEndTimeRow
          start={fmtMinutesToIsoTime(bookingStartMinutes)}
          end={fmtMinutesToIsoTime(bookingEndMinutes)}
          sx={{ mt: 1 }}
        />
      </Box>
      <Divider />

      <Box sx={{ p: 1.6 }}>
        <Stack spacing={1.25}>
          {isDesiredLocation && desiredTeamMemberFullName ? (
            <Box
              component={
                selectedTeamMemberId && onTeamMemberClick ? "button" : "div"
              }
              type={
                selectedTeamMemberId && onTeamMemberClick ? "button" : undefined
              }
              onClick={
                selectedTeamMemberId && onTeamMemberClick
                  ? () => onTeamMemberClick(selectedTeamMemberId)
                  : undefined
              }
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "flex-start",
                gap: 0.6,
                height: 26,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
                px: 1,
                py: 0,
                lineHeight: 0,
                cursor:
                  selectedTeamMemberId && onTeamMemberClick
                    ? "pointer"
                    : "default",
                "&:hover":
                  selectedTeamMemberId && onTeamMemberClick
                    ? { borderColor: alpha(m.teal, 0.45) }
                    : undefined,
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  lineHeight: 0,
                }}
              >
                <PersonOutlineRoundedIcon
                  sx={{
                    fontSize: 14,
                    color: alpha(m.navy, 0.45),
                    display: "block",
                  }}
                />
              </Box>
              <Typography
                sx={mollureBodySx(m.navy, {
                  fontSize: 11.5,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                })}
              >
                {desiredTeamMemberFullName}
              </Typography>
            </Box>
          ) : null}
          {summarySections.map((section) => {
            const {
              key,
              isRequester,
              items,
              planningItem,
              startTime,
              participantType,
            } = section;
            const ordinals = participantOrdinals(summarySections);
            const heading = bookingParticipantDisplayHeading(
              section,
              participantHeadingOrdinal(section, ordinals),
            );
            const planningMeta = planningScheduleMeta(section);
            const isGuestOrModel =
              participantType === "guest" || participantType === "model";
            // Guest/Model: name lives in the header — never a fake person/schedule card.
            const guestDisplayName = isGuestOrModel
              ? section.title?.trim() || undefined
              : undefined;
            const showGuestDisplayName = Boolean(
              guestDisplayName &&
                guestDisplayName.toLowerCase() !== heading.toLowerCase(),
            );
            const showSectionSchedule =
              Boolean(planningItem) ||
              participantType === "buffer" ||
              participantType === "planning";
            return (
              <Box
                key={key}
                sx={{
                  borderRadius: "10px",
                  bgcolor: m.fxGrayF2F4F7,
                  px: 1.2,
                  py: 1,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{ mb: 0.75 }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: isRequester ? 14 : 15,
                      color: m.headingText,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {heading}
                  </Typography>
                  {showGuestDisplayName ? (
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        color: alpha(m.navy, 0.62),
                        lineHeight: 1,
                      }}
                    >
                      {guestDisplayName}
                    </Typography>
                  ) : null}
                  {isRequester ? (
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 10.5,
                        color: "primary.light",
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      CLIENT
                    </Typography>
                  ) : null}
                </Stack>
                <Stack spacing={0.75}>
                  {showSectionSchedule ? (
                    <Box
                      sx={{
                        borderRadius: "10px",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        px: 1.2,
                        py: 0.9,
                        bgcolor: "#fff",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        {planningItem?.activity &&
                        planningItem.activity.toLowerCase() !== "buffer" &&
                        planningItem.activity !== heading ? (
                          <Typography
                            sx={mollureLabelSx(m.navy, {
                              fontWeight: 900,
                              lineHeight: 1.1,
                            })}
                          >
                            {planningItem.activity}
                          </Typography>
                        ) : null}
                        {planningMeta.timeRange || planningMeta.durationLabel ? (
                          <ServiceSummaryMetaLine
                            timeRange={planningMeta.timeRange}
                            durationLabel={planningMeta.durationLabel}
                          />
                        ) : planningItem?.duration ? (
                          <Typography
                            sx={{
                              mt: planningItem.activity ? 0.25 : 0,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.48),
                            }}
                          >
                            {planningItem.duration}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  ) : null}
                  {items.map((s, index) => {
                    const sectionStartMinutes = startTime
                      ? parseTimeLabelToMinutes(startTime)
                      : bookingStartMinutes;
                    const serviceOffset = items
                      .slice(0, index)
                      .reduce((sum, row) => sum + row.durationMins, 0);
                    const startMin = s.startTime
                      ? parseTimeLabelToMinutes(s.startTime)
                      : bookServicesAtSameTime
                        ? bookingStartMinutes
                        : sectionStartMinutes + serviceOffset;
                    // Same team-member line for client + guest service cards (FL).
                    const staffName = !isDesiredLocation
                      ? resolveServiceTeamMemberName(s as Service)
                      : undefined;
                    const staffId = !isDesiredLocation
                      ? resolveServiceTeamMemberId?.(s as Service) ||
                        String((s as Service).teamMemberId ?? "").trim() ||
                        undefined
                      : undefined;
                    const staffClickable = Boolean(
                      staffName && staffId && onTeamMemberClick,
                    );
                    return (
                      <Box
                        key={`${s.id}::${s.guestId ?? ""}::${index}`}
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          px: 1.2,
                          py: 0.9,
                          bgcolor: "#fff",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: m.headingText,
                                lineHeight: 1.2,
                              }}
                            >
                              {s.name}
                            </Typography>
                            <ServiceSummaryMetaLine
                              timeRange={serviceTimeRangeLabel(
                                startMin,
                                s.durationMins,
                              )}
                              durationLabel={`${s.durationMins} Mins`}
                            />
                            {staffName ? (
                              <Stack
                                component={staffClickable ? "button" : "div"}
                                type={staffClickable ? "button" : undefined}
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                onClick={
                                  staffClickable
                                    ? (event: React.MouseEvent) => {
                                        event.stopPropagation();
                                        onTeamMemberClick?.(staffId!);
                                      }
                                    : undefined
                                }
                                sx={{
                                  mt: 0.5,
                                  p: 0,
                                  m: 0,
                                  border: "none",
                                  bgcolor: "transparent",
                                  cursor: staffClickable
                                    ? "pointer"
                                    : "default",
                                  textAlign: "left",
                                  width: "fit-content",
                                  maxWidth: "100%",
                                  "&:hover": staffClickable
                                    ? { color: m.teal }
                                    : undefined,
                                }}
                              >
                                <PersonOutlineRoundedIcon
                                  sx={{
                                    fontSize: 14,
                                    color: alpha(m.navy, 0.4),
                                  }}
                                />
                                <Typography
                                  sx={mollureBodyMutedSx(m.navy, {
                                    fontSize: 11,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    ...(staffClickable
                                      ? { "&:hover": { color: m.teal } }
                                      : null),
                                  })}
                                >
                                  {staffName}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: m.headingText,
                              flexShrink: 0,
                            }}
                          >
                            {s.price} €
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}

          <BookingSummaryNote note={clientNote} />

          <Box
            sx={{
              borderRadius: "10px",
              bgcolor: alpha(m.navy, 0.04),
              border: `1px solid ${alpha(m.navy, 0.18)}`,
              px: 1.5,
              py: 1.2,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={mollureSectionTitleSx(m.navy, {
                  color: m.headingText,
                  lineHeight: 1.2,
                })}
              >
                Total
              </Typography>
              <Typography
                sx={mollureSectionTitleSx(m.navy, {
                  fontSize: 18,
                  color: m.headingText,
                  lineHeight: 1.2,
                })}
              >
                €{total}
              </Typography>
            </Stack>
          </Box>

          {!allServicesAssigned && servicesCount > 0 ? (
            <Typography
              sx={{
                mt: 1,
                fontSize: 11,
                fontWeight: 800,
                color: "#C67A00",
                lineHeight: 1.35,
              }}
            >
              {unassigned.length > 0
                ? `${unassigned.length} service${unassigned.length === 1 ? "" : "s"} still need a person.`
                : "Every service needs a person before you can continue."}
            </Typography>
          ) : null}

          {allServicesAssigned &&
          needsTeamMemberProvidedByPro &&
          !selectedTeamMemberId &&
          servicesCount > 0 ? (
            <Typography
              sx={{
                mt: 1,
                fontSize: 11,
                fontWeight: 800,
                color: "primary.light",
                lineHeight: 1.35,
              }}
            >
              Team member will be provided by professional.
            </Typography>
          ) : null}

          {allServicesAssigned && selectedTimeTooSoon ? (
            <Typography
              sx={{
                mt: 1,
                fontSize: 11,
                fontWeight: 800,
                color: "#C62828",
                lineHeight: 1.35,
              }}
            >
              {CLIENT_BOOKING_MIN_LEAD_ERROR}
            </Typography>
          ) : null}

          <AppButton
            tone="primary"
            fullWidth
            disabled={
              !allServicesAssigned || isContinuing || selectedTimeTooSoon
            }
            onClick={() => void onContinue()}
            sx={{
              mt: 1.25,
              height: 40,
              ...(allServicesAssigned && !isContinuing && !selectedTimeTooSoon
                ? null
                : {
                    color: alpha(m.navy, 0.45),
                  }),
            }}
          >
            {isContinuing ? (
              <>
                <CircularProgress
                  size={18}
                  sx={{ mr: 1, color: "inherit" }}
                />
                {continueLabel}
              </>
            ) : (
              continueLabel
            )}
          </AppButton>
        </Stack>
      </Box>
    </Paper>
  );
}
