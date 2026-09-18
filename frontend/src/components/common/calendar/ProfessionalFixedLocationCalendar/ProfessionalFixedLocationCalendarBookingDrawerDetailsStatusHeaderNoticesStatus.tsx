"use client";

import {
  mollureBodyMutedSx,
} from "../../../../theme/mollureHierarchy";

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
            }}
          >
            {viewingBookingEvent.bookingCode ??
              extractBookingId(viewingBookingEvent.id)}
          </BodyText>
        </Box>
      </Box>

      {showExpiredResponseBanner ? (
        <BookingResponseExpiryBanner
          onRestart={() => void handleRestartResponseTime()}
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
              height: 18,
              fontSize: 9,
              fontWeight: 800,
              border: "1px solid",
              "& .MuiChip-label": {
                px: 0.7,
                py: 0,
                lineHeight: 1.2,
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
              const badgeResponses =
                indicator === "EBR"
                  ? responseIndicators
                  : indicator === "ER"
                    ? responseIndicators.filter(
                        (item) =>
                          item === "suggestion_for_change" ||
                          item === "overdue_response",
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
                                size={18}
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
                        {indicator === "EBR" &&
                        prepaymentVariant === "canceled_or_invalid" ? (
                          <PrepaymentStatusIcon
                            variant={prepaymentVariant}
                            size={18}
                          />
                        ) : null}
                      </Stack>
                    }
                    sx={{
                      height: 24,
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: alpha(m.navy, 0.06),
                      color: alpha(m.navy, 0.62),
                      border: `1px solid ${alpha(m.navy, 0.14)}`,
                      cursor: comparisonSignpost ? "pointer" : "default",
                      "& .MuiChip-label": { px: 0.85 },
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

            if (scenarioIndicators.length && !hasBr) {
              if (!responseIndicators.includes("overdue_response"))
                return null;
              if (
                scenarioIndicators.some((indicator) => indicator === "ER")
              ) {
                return null;
              }
            }

            const standaloneResponses = hasBr
              ? responseIndicators
              : scenarioIndicators.length === 0
                ? responseIndicators
                : [];

            const standalonePrepayment =
              prepayment &&
              !professionalWaitingForClientPrepay(viewingBookingEvent) &&
              (scenarioIndicators.length === 0 || hasBr)
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
                        lineHeight: 0,
                      }}
                    >
                      <BookingIndicatorIcon variant={item} size={18} />
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
                        lineHeight: 0,
                      }}
                    >
                      <PrepaymentStatusIcon
                        variant={toPrepaymentIconVariant(
                          standalonePrepayment,
                        )}
                        size={18}
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
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: "8px",
                  bgcolor: alpha(m.navy, 0.04),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                }}
              >
                <PaymentDueIcon size={18} />
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
