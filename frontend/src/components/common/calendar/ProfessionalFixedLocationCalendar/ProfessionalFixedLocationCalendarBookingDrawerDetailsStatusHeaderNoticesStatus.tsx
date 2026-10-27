"use client";

import {
  mollureBodyMutedSx,
} from "../../../../theme/mollureHierarchy";

import {
  MOLLURE_FONT_BODY,
} from "../../../../theme/typography";

import {
  Box,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import BookingIndicatorIcon, {
  BOOKING_INDICATOR_LABELS,
} from "../BookingIndicatorIcon";

import BookingRequestBadge, {
  resolveBookingRequestBadgeState,
  resolveProfessionalBookingRequestDirection,
} from "../BookingRequestBadge";

import {
  ACTIVITY_COMPARISON_SIGNPOST,
} from "../buildActivityComparison";

import {
  extractBookingId,
  statusChipSx,
} from "../calendar.utils";

import {
  BOOKING_SCENARIO_LABELS,
  getActionRequiredScenarioIndicators,
  professionalCalendarDisplayStatus,
  professionalCalendarStatusLabel,
  professionalWaitingForClientPrepay,
  scenarioIndicatorDisplayLabel,
} from "../bookingStatus";

import PrepaymentStatusIcon from "../PrepaymentStatusIcon";

import {
  PREPAYMENT_STATUS_LABELS,
} from "../PrepaymentStatusIcon";

import {
  bookingSecondaryStatusChipSx,
} from "../../../../app/clients/booking/clientBookingStatus";

import BookingRequestReceivedIcon from "../BookingRequestReceivedIcon";

import BookingRequestSentIcon from "../BookingRequestSentIcon";

import PaymentDueIcon from "../../client-booking/PaymentDueIcon";

import {
  actionRequiredBookingIndicators,
  resolveBookingResponseIndicators,
} from "../bookingResponseStatus";

import {
  resolveCalendarPrepaymentStatus,
  toPrepaymentIconVariant,
} from "../prepaymentStatus";

import BookingStartEndTimeRow from "../../BookingStartEndTimeRow";

import BookingResponseExpiryBanner from "../BookingResponseExpiryBanner";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatusBag = Pick<
  Vm,
  | "businessResponseWindowInput"
  | "handleRestartResponseTime"
  | "handleDiscardBr"
  | "m"
  | "openActivityComparison"
  | "responseTimeConfigured"
  | "selectedSlot"
  | "showExpiredResponseBanner"
  | "viewingBookingEvent"
  | "viewingBookingPaymentDue"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatusBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatus({
  bag,
}: Props) {
  const {
    businessResponseWindowInput,
    handleRestartResponseTime,
    handleDiscardBr,
    m,
    openActivityComparison,
    responseTimeConfigured,
    selectedSlot,
    showExpiredResponseBanner,
    viewingBookingEvent,
    viewingBookingPaymentDue,
  } = bag;

  if (!viewingBookingEvent) return null;

  return (
    <Stack spacing={1.25}>
      <Box>
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          Booking ID
        </BodyText>
        <Box
          sx={{
            width: "100%",
            border: `1px solid ${alpha(m.navy, 0.14)}`,
            borderRadius: "10px",
            minHeight: 40,
            px: 1.5,
            display: "flex",
            alignItems: "center",
            bgcolor: alpha(m.navy, 0.02),
          }}
        >
          <BodyText
            sx={{
              ...mollureBodyMutedSx(m.navy),
              fontFamily: MOLLURE_FONT_BODY,
              fontVariantNumeric: "lining-nums tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {viewingBookingEvent.bookingCode ??
              extractBookingId(viewingBookingEvent.id)}
          </BodyText>
        </Box>
      </Box>

      {showExpiredResponseBanner ? (
        <BookingResponseExpiryBanner
          message={
            viewingBookingEvent.status === "BR Accepted"
              ? "The Client Hasn't Prepaid In Time And Is Still Able To Pay. You Can Restart The Response Time Or You Can Discard The Request."
              : undefined
          }
          onRestart={() => void handleRestartResponseTime()}
          // Requested BR: Discard lives mid-panel (below Total Price). Prepay wait keeps banner Discard.
          onDiscard={
            viewingBookingEvent.status === "BR Accepted"
              ? () => void handleDiscardBr()
              : undefined
          }
        />
      ) : null}

      <Box>
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          Status
        </BodyText>
        <Box
          sx={{
            width: "100%",
            border: `1px solid ${alpha(m.navy, 0.14)}`,
            borderRadius: "10px",
            minHeight: 40,
            px: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
            bgcolor: "#fff",
          }}
        >
          <Chip
            size="small"
            label={professionalCalendarStatusLabel(viewingBookingEvent)}
            sx={{
              height: 24,
              minHeight: 24,
              maxHeight: 24,
              boxSizing: "border-box",
              fontSize: 11,
              fontWeight: 600,
              "& .MuiChip-label": {
                px: 1.1,
                py: 0,
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
              },
              ...statusChipSx(
                professionalCalendarDisplayStatus(viewingBookingEvent),
                m,
              ),
            }}
          />
          {getActionRequiredScenarioIndicators(viewingBookingEvent).map(
            (indicator) => {
              const responseIndicators = actionRequiredBookingIndicators(
                resolveBookingResponseIndicators(viewingBookingEvent, {
                  responseTimeConfigured,
                  responseTime: businessResponseWindowInput,
                }),
              );
              const prepayment =
                resolveCalendarPrepaymentStatus(viewingBookingEvent);
              const prepaymentVariant = prepayment
                ? toPrepaymentIconVariant(prepayment)
                : undefined;
              // In-pill glyphs only; waiting/overdue are standalone 24×24 below.
              const badgeResponses =
                indicator === "EBR"
                  ? responseIndicators.filter(
                      (item) =>
                        item !== "overdue_response" &&
                        item !== "response_time_active",
                    )
                  : indicator === "ER"
                    ? responseIndicators.filter(
                        (item) => item === "suggestion_for_change",
                      )
                    : [];
              const comparisonSignpost =
                indicator === "EBR" || indicator === "ER";

              return (
                <Tooltip
                  key={indicator}
                  title={
                    comparisonSignpost
                      ? ACTIVITY_COMPARISON_SIGNPOST
                      : BOOKING_SCENARIO_LABELS[indicator]
                  }
                  placement="top"
                >
                  <Chip
                    size="small"
                    onClick={
                      comparisonSignpost
                        ? () =>
                            openActivityComparison(
                              indicator === "ER" ? "er" : "ebr",
                            )
                        : undefined
                    }
                    label={
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.35}
                      >
                        {indicator === "BR" ? (
                          <BookingRequestBadge
                            variant="inline"
                            iconSize={12}
                            state={resolveBookingRequestBadgeState(
                              viewingBookingEvent,
                            )}
                            direction={resolveProfessionalBookingRequestDirection(
                              viewingBookingEvent,
                            )}
                          />
                        ) : (
                          <span>
                            {scenarioIndicatorDisplayLabel(indicator)}
                          </span>
                        )}
                        {badgeResponses.map((item) => (
                          <Tooltip
                            key={item}
                            title={BOOKING_INDICATOR_LABELS[item]}
                            placement="top"
                          >
                            <Box
                              sx={{
                                display: "grid",
                                placeItems: "center",
                                lineHeight: 0,
                              }}
                            >
                              <BookingIndicatorIcon
                                variant={item}
                                size={14}
                              />
                            </Box>
                          </Tooltip>
                        ))}
                        {indicator === "ER" &&
                        !badgeResponses.includes("suggestion_for_change") ? (
                          resolveProfessionalBookingRequestDirection(
                            viewingBookingEvent,
                          ) === "incoming" ? (
                            <BookingRequestReceivedIcon size={12} />
                          ) : (
                            <BookingRequestSentIcon size={12} />
                          )
                        ) : null}
                        {indicator === "EBR" ? (
                          resolveProfessionalBookingRequestDirection(
                            viewingBookingEvent,
                          ) === "incoming" ? (
                            <BookingRequestReceivedIcon size={12} />
                          ) : (
                            <BookingRequestSentIcon size={12} />
                          )
                        ) : null}
                        {indicator === "EBR" && prepaymentVariant ? (
                          <PrepaymentStatusIcon
                            variant={prepaymentVariant}
                            size={14}
                          />
                        ) : null}
                      </Stack>
                    }
                    sx={{
                      ...bookingSecondaryStatusChipSx,
                      fontWeight: 800,
                      cursor: comparisonSignpost ? "pointer" : "default",
                    }}
                  />
                </Tooltip>
              );
            },
          )}
          {(() => {
            const scenarioIndicators =
              getActionRequiredScenarioIndicators(viewingBookingEvent);
            const responseIndicators = actionRequiredBookingIndicators(
              resolveBookingResponseIndicators(viewingBookingEvent, {
                responseTimeConfigured,
                responseTime: businessResponseWindowInput,
              }),
            );
            const prepayment =
              resolveCalendarPrepaymentStatus(viewingBookingEvent);
            const hasBr = scenarioIndicators.includes("BR");
            const waitingClientPrepay = professionalWaitingForClientPrepay(
              viewingBookingEvent,
            );
            const confirmedPrepaidStandalone =
              prepayment === "confirmed" && !waitingClientPrepay;

            const timingStandalone = responseIndicators.filter(
              (item) =>
                item === "overdue_response" || item === "response_time_active",
            );
            if (scenarioIndicators.length && !hasBr) {
              // Scenario chips own most indicators; waiting/overdue + prepaid stay standalone.
              if (!timingStandalone.length && !confirmedPrepaidStandalone) {
                return null;
              }
            }

            const standaloneResponses = hasBr
              ? responseIndicators
              : scenarioIndicators.length === 0
                ? responseIndicators
                : timingStandalone;

            // Confirmed prepaid always surfaces unless the EBR chip already renders it.
            // Pending (incl. BR Accepted waiting for client pay) shows the € seal.
            const ebrOwnsPrepaymentIcon = scenarioIndicators.includes("EBR");
            const standalonePrepayment = waitingClientPrepay
              ? ("pending" as const)
              : prepayment &&
                  (prepayment === "confirmed"
                    ? !ebrOwnsPrepaymentIcon
                    : scenarioIndicators.length === 0 || hasBr)
                ? prepayment
                : undefined;

            const prepaymentAsIndicator =
              standalonePrepayment === "pending"
                ? ("waiting_for_prepayment" as const)
                : standalonePrepayment === "confirmed"
                  ? ("prepaid" as const)
                  : standalonePrepayment === "canceled" ||
                      standalonePrepayment === "invalid"
                    ? ("refund_pending" as const)
                    : null;

            const filteredResponses = standaloneResponses.filter(
              (item) => item !== prepaymentAsIndicator,
            );

            if (!filteredResponses.length && !standalonePrepayment)
              return null;

            return (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {filteredResponses.map((item) => (
                  <Tooltip
                    key={item}
                    title={BOOKING_INDICATOR_LABELS[item]}
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 24,
                        height: 24,
                        lineHeight: 0,
                        flexShrink: 0,
                      }}
                    >
                      <BookingIndicatorIcon variant={item} size={24} />
                    </Box>
                  </Tooltip>
                ))}
                {standalonePrepayment ? (
                  <Tooltip
                    title={
                      PREPAYMENT_STATUS_LABELS[
                        toPrepaymentIconVariant(standalonePrepayment)
                      ]
                    }
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 24,
                        height: 24,
                        lineHeight: 0,
                        flexShrink: 0,
                      }}
                    >
                      <PrepaymentStatusIcon
                        variant={toPrepaymentIconVariant(
                          standalonePrepayment,
                        )}
                        size={24}
                      />
                    </Box>
                  </Tooltip>
                ) : null}
              </Stack>
            );
          })()}
          {viewingBookingPaymentDue ? (
            <Tooltip title="Payment due" placement="top">
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 24,
                  height: 24,
                  lineHeight: 0,
                  flexShrink: 0,
                }}
              >
                <PaymentDueIcon size={24} />
              </Box>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <BookingStartEndTimeRow
        start={selectedSlot?.start ?? viewingBookingEvent.start}
        end={selectedSlot?.end ?? viewingBookingEvent.end}
      />
    </Stack>
  );
}
