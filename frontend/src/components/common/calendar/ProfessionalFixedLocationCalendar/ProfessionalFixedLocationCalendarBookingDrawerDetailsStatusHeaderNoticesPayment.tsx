"use client";

import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
    | "setDrawerDocOpen"
    | "setDrawerDocType"
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
    setDrawerDocOpen,
    setDrawerDocType,
    setFocusSalesCardId,
    setSlotDrawerTab,
    viewingBookingPaymentDue,
  } = bag;

  const pastDue = Boolean(viewingBookingPaymentDue?.pastDue);
  const accent = pastDue ? "#E85D5D" : m.teal;

  const openIssuedInvoice = () => {
    setDrawerDocType("invoice");
    setDrawerDocOpen(true);
  };

  const openSalesReissue = () => {
    // SalesOverview mounts SalesOverdueReissuePanel when penaltyPrompt === "manual".
    setFocusSalesCardId(null);
    setSlotDrawerTab("sales");
  };

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
            bgcolor: alpha(accent, pastDue ? 0.1 : 0.12),
            border: `1px solid ${alpha(accent, pastDue ? 0.28 : 0.35)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.85}
            sx={{ minWidth: 0 }}
          >
            {pastDue ? (
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  bgcolor: alpha(accent, 0.16),
                  color: accent,
                  flexShrink: 0,
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            ) : (
              <InfoOutlinedIcon
                sx={{ fontSize: 20, color: accent, flexShrink: 0 }}
              />
            )}
            <BodyText
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: accent,
                lineHeight: 1.35,
                minWidth: 0,
              }}
            >
              {pastDue
                ? `Payment Overdue (Due Date ${viewingBookingPaymentDue.dateLabel})`
                : `Invoice Issued (Due Date ${viewingBookingPaymentDue.dateLabel})`}
            </BodyText>
          </Stack>
          <AppButton
            tone="secondary"
            onClick={() => {
              if (pastDue) {
                openSalesReissue();
                return;
              }
              openIssuedInvoice();
            }}
            sx={{
              height: 32,
              minWidth: 64,
              px: 1.5,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            View
          </AppButton>
        </Box>
      ) : null}

      {postBookingPendingPayment && !viewingBookingPaymentDue ? (
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
                fontSize: 13,
                fontWeight: 800,
                color: m.navy,
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
