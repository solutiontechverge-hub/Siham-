"use client";

import { mollureLabelSx } from "../../../../theme/mollureHierarchy";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { BodyText } from "../../../ui/typography";

import AppButton from "../../AppButton";

import PaymentDueIcon from "../../client-booking/PaymentDueIcon";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPaymentBag =
  Pick<
    Vm,
    | "m"
    | "postBookingPendingPayment"
    | "setFocusSalesCardId"
    | "setSlotDrawerTab"
    | "viewingBookingPaymentDue"
  >;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPaymentBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPayment({
  bag,
}: Props) {
  const {
    m,
    postBookingPendingPayment,
    setFocusSalesCardId,
    setSlotDrawerTab,
    viewingBookingPaymentDue,
  } = bag;

  const pastDue = Boolean(viewingBookingPaymentDue?.pastDue);
  const accent = pastDue ? "#E85D5D" : m.teal;

  return (
    <>
      {viewingBookingPaymentDue ? (
        <Box
          sx={{
            width: "100%",
            borderRadius: "12px",
            px: 1.35,
            py: 1.05,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            bgcolor: alpha(accent, pastDue ? 0.1 : 0.07),
            border: `1px solid ${alpha(accent, pastDue ? 0.28 : 0.22)}`,
            backgroundImage: pastDue
              ? undefined
              : `linear-gradient(135deg, ${alpha("#fff", 0.7)} 0%, ${alpha(m.teal, 0.04)} 100%)`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.85}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: "9px",
                bgcolor: alpha(accent, pastDue ? 0.16 : 0.12),
                flexShrink: 0,
              }}
            >
              <PaymentDueIcon size={24} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <BodyText
                sx={{
                  ...mollureLabelSx(m.navy),
                  lineHeight: 1.2,
                }}
              >
                {viewingBookingPaymentDue.reissued || pastDue
                  ? "Reissue Invoice"
                  : "Payment Due"}
              </BodyText>
              <BodyText
                sx={{
                  mt: 0.2,
                  fontSize: 11,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.5),
                  lineHeight: 1.2,
                }}
              >
                Due date
              </BodyText>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            <BodyText
              sx={{
                fontSize: 13,
                fontWeight: 900,
                color: pastDue ? accent : m.teal,
                letterSpacing: "0.01em",
              }}
            >
              {viewingBookingPaymentDue.dateLabel}
            </BodyText>
            {pastDue ? (
              <AppButton
                tone="secondary"
                onClick={() => {
                  setFocusSalesCardId(null);
                  setSlotDrawerTab("sales");
                }}
                sx={{
                  height: 32,
                  minWidth: 64,
                  px: 1.5,
                  fontSize: 12,
                }}
              >
                View
              </AppButton>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      {postBookingPendingPayment ? (
        <Box
          sx={{
            width: "100%",
            borderRadius: "12px",
            px: 1.35,
            py: 1.05,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            bgcolor: alpha("#F79009", 0.1),
            border: `1px solid ${alpha("#F79009", 0.28)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.85}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: "9px",
                bgcolor: alpha("#F79009", 0.16),
                flexShrink: 0,
              }}
            >
              <PaymentDueIcon size={24} />
            </Box>
            <BodyText
              sx={{
                ...mollureLabelSx(m.navy),
                lineHeight: 1.2,
              }}
            >
              {postBookingPendingPayment.label}
            </BodyText>
          </Stack>
          <AppButton
            tone="secondary"
            onClick={() => {
              setFocusSalesCardId(postBookingPendingPayment.focusCardId);
              setSlotDrawerTab("sales");
            }}
            sx={{
              height: 32,
              minWidth: 64,
              px: 1.5,
              fontSize: 12,
            }}
          >
            View
          </AppButton>
        </Box>
      ) : null}
    </>
  );
}
