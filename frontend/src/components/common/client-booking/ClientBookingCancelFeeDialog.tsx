"use client";

import { mollureLabelSx, mollureBodyMutedSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";
import { FinancePreviewLabelValueRow } from "../finance-documents/FinancePreviewRows";
import type { BusinessPublicProfilePolicySection } from "../../../data/businessPublicProfile.data";
import type { CancellationFeeSettlement } from "./settleCancellationFee";

type Props = {
  open: boolean;
  onClose: () => void;
  onKeepBooking: () => void;
  onPayNow: () => void;
  settlement: CancellationFeeSettlement;
  policySections?: BusinessPublicProfilePolicySection[];
  policyInstruction?: string;
  isProcessing?: boolean;
};

function money(value: number) {
  return `€${value.toFixed(2)}`;
}

export default function ClientBookingCancelFeeDialog({
  open,
  onClose,
  onKeepBooking,
  onPayNow,
  settlement,
  policySections = [],
  policyInstruction = "",
  isProcessing = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const cancellationSections = policySections.filter((section) =>
    /cancel/i.test(section.title),
  );
  const feeApplies = settlement.isLateCancellation && settlement.cancellationFee > 0;
  const primaryLabel =
    settlement.amountDueNow >= 0.5
      ? `Pay now ${money(settlement.amountDueNow)}`
      : "Confirm cancellation";

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title="Cancellation policy"
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <MessagingModalCancelButton
            onClick={onKeepBooking}
            label="Keep booking"
            disabled={isProcessing}
          />
          <MessagingModalPrimaryButton
            label={isProcessing ? "Processing…" : primaryLabel}
            onClick={onPayNow}
            disabled={isProcessing}
          />
        </>
      }
    >
      <Box sx={{ py: 1.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 13.5,
            color: alpha(m.navy, 0.78),
            lineHeight: 1.55,
          }}
        >
          {feeApplies
            ? "This cancellation is inside the professional's minimum notice window, so a fee applies."
            : "This cancellation is outside the professional's minimum notice window, so no fee is charged."}
        </Typography>

        <Stack spacing={1.25} sx={{ mt: 1.75 }}>
          {cancellationSections.length ? (
            cancellationSections.map((section) => (
              <Box
                key={section.title}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: alpha(m.navy, 0.02),
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Typography sx={{ ...mollureLabelSx(m.navy), mb: 0.5 }}>
                  {section.title}
                </Typography>
                {section.fields?.map((field) => (
                  <Typography
                    key={`${section.title}-${field.label}`}
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.55),
                      lineHeight: 1.5,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ fontWeight: 900, color: alpha(m.navy, 0.7) }}
                    >
                      {field.label}:
                    </Box>{" "}
                    {field.value}
                  </Typography>
                ))}
                {section.description ? (
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: alpha(m.navy, 0.55),
                      lineHeight: 1.55,
                    }}
                  >
                    {section.description}
                  </Typography>
                ) : null}
              </Box>
            ))
          ) : policyInstruction ? (
            <Typography
              sx={{
                ...mollureBodyMutedSx(m.navy),
                lineHeight: 1.55,
              }}
            >
              {policyInstruction}
            </Typography>
          ) : (
            <Typography
              sx={{
                ...mollureBodyMutedSx(m.navy),
                lineHeight: 1.55,
              }}
            >
              {feeApplies
                ? `A cancellation fee of ${settlement.feePercent}% of the booking total applies.`
                : "No cancellation fee applies for this booking."}
            </Typography>
          )}
        </Stack>

        <Box
          sx={{
            mt: 2,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: m.cancelledSurface,
            px: 1.5,
            py: 1.35,
          }}
        >
          <Stack spacing={0.65}>
            <FinancePreviewLabelValueRow
              label="Booking total"
              value={money(settlement.bookingTotal)}
              variant="fee"
            />
            <FinancePreviewLabelValueRow
              label={
                feeApplies
                  ? `Cancellation fee (${settlement.feePercent}%)`
                  : "Cancellation fee"
              }
              value={money(settlement.cancellationFee)}
              variant="feeEmphasize"
            />
            {settlement.prepaidPaid > 0 ? (
              <FinancePreviewLabelValueRow
                label="Applied from prepayment"
                value={`− ${money(settlement.appliedFromPrepaid)}`}
                variant="fee"
              />
            ) : null}
            {settlement.refundAmount > 0 ? (
              <FinancePreviewLabelValueRow
                label="Refund to you"
                value={money(settlement.refundAmount)}
                variant="fee"
              />
            ) : null}
            <FinancePreviewLabelValueRow
              label={
                settlement.amountDueNow > 0
                  ? "Amount to pay now"
                  : "Amount due now"
              }
              value={money(settlement.amountDueNow)}
              variant="feeEmphasize"
            />
          </Stack>
        </Box>

        <Typography
          sx={{
            mt: 1.5,
            ...mollureBodyMutedSx(m.navy, {
              fontSize: 11.5,
              lineHeight: 1.5,
            }),
          }}
        >
          Keep booking leaves this booking unchanged. Confirming cancels the
          booking
          {settlement.amountDueNow >= 0.5
            ? " and charges any remaining fee"
            : ""}
          .
          {settlement.refundAmount > 0
            ? ` Any unused prepayment (${money(settlement.refundAmount)}) will be refunded.`
            : ""}
        </Typography>
      </Box>
    </AppModal>
  );
}
