"use client";

import { mollureLabelSx } from "../../../../theme/mollureHierarchy";

import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

import { Box, IconButton, Popover, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import {
  canAddPrepayment,
  canRestoreKilometerAllowance,
  canRestoreLateCancellation,
  canRestoreLateRescheduling,
  canRestoreNoShowFee,
} from "../bookingGroupAddOns";
import { buildProtectiveFeeActivation } from "../bookingFeeTriggers";

import { resolveCalendarPrepaymentStatus } from "../prepaymentStatus";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerFooterAddOnsBag = Pick<
  Vm,
  | "beginExistingBookingEdit"
  | "bookingMoreAnchor"
  | "appointmentBeforeHours"
  | "appointmentBeforeMinutes"
  | "cancellationBeforeHours"
  | "cancellationBeforeMinutes"
  | "editingEventId"
  | "isViewingExisting"
  | "lateCancellationFeePercentDefault"
  | "lateRescheduleFeePercentDefault"
  | "m"
  | "negotiationDetails"
  | "noShowFeePercentDefault"
  | "prepaymentPercentDefault"
  | "selectedSlot"
  | "setBookingDiscountModalOpen"
  | "setBookingMoreAnchor"
  | "setCancellationFeeAt"
  | "setExceededCancellationWindow"
  | "setLateCancellationFeePercent"
  | "setLateCancellationFeePercentCeiling"
  | "setLateRescheduleFeePercent"
  | "setLateRescheduleFeePercentCeiling"
  | "setNoShowFeePercent"
  | "setNoShowFeePercentCeiling"
  | "setPrepaymentPercent"
  | "setShowInternalNote"
  | "setShowKilometerAllowance"
  | "setShowLateCancellation"
  | "setShowLateRescheduling"
  | "setShowNoShowFee"
  | "setShowPrepayment"
  | "showInternalNote"
  | "showKilometerAllowance"
  | "showLateCancellation"
  | "showLateRescheduling"
  | "showNoShowFee"
  | "showPrepayment"
  | "showSnackbar"
  | "slotBookingScreen"
  | "slotClientAdded"
  | "slotLocation"
  | "slotStatus"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerFooterAddOnsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerFooterAddOns({
  bag,
}: Props) {
  const {
    appointmentBeforeHours,
    appointmentBeforeMinutes,
    beginExistingBookingEdit,
    bookingMoreAnchor,
    cancellationBeforeHours,
    cancellationBeforeMinutes,
    editingEventId,
    isViewingExisting,
    lateCancellationFeePercentDefault,
    lateRescheduleFeePercentDefault,
    m,
    negotiationDetails,
    noShowFeePercentDefault,
    prepaymentPercentDefault,
    selectedSlot,
    setBookingDiscountModalOpen,
    setBookingMoreAnchor,
    setCancellationFeeAt,
    setExceededCancellationWindow,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setPrepaymentPercent,
    setShowInternalNote,
    setShowKilometerAllowance,
    setShowLateCancellation,
    setShowLateRescheduling,
    setShowNoShowFee,
    setShowPrepayment,
    showInternalNote,
    showKilometerAllowance,
    showLateCancellation,
    showLateRescheduling,
    showNoShowFee,
    showPrepayment,
    showSnackbar,
    slotBookingScreen,
    slotClientAdded,
    slotLocation,
    slotStatus,
    viewingBookingEvent,
  } = bag;

  // Existing bookings only — never on brand-new create draft (!editingEventId).
  // Per-item status/policy gates live in bookingGroupAddOns canAdd*.
  const showMoreButton =
    Boolean(editingEventId) &&
    slotBookingScreen === "new-booking" &&
    slotClientAdded;

  const appointmentStartMs = viewingBookingEvent
    ? Date.parse(
        `${viewingBookingEvent.date}T${viewingBookingEvent.start}:00`,
      )
    : selectedSlot
      ? Date.parse(`${selectedSlot.date}T${selectedSlot.start}:00`)
      : NaN;
  const startMs = Number.isFinite(appointmentStartMs)
    ? appointmentStartMs
    : null;

  return (
    <>
      {showMoreButton ? (
        <IconButton
          size="small"
          onClick={(e) => setBookingMoreAnchor(e.currentTarget)}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            border: `1px solid ${alpha(m.navy, 0.14)}`,
            color: alpha(m.navy, 0.68),
            bgcolor: "#fff",
          }}
          aria-label="Group add-ons"
        >
          <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
      <Popover
        open={Boolean(bookingMoreAnchor)}
        anchorEl={bookingMoreAnchor}
        onClose={() => setBookingMoreAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 10px 24px rgba(16, 35, 63, 0.14)",
            overflow: "hidden",
            minWidth: 240,
          },
        }}
      >
        <Stack sx={{ py: 0.5 }}>
          {(
            [
              canAddPrepayment({
                alreadyShown: showPrepayment,
                alreadyPaid:
                  resolveCalendarPrepaymentStatus(
                    viewingBookingEvent ?? {
                      status: "Requested",
                      details: undefined,
                    },
                  ) === "confirmed",
              })
                ? {
                    label: "Add Prepayment",
                    onClick: () => {
                      beginExistingBookingEdit();
                      setShowPrepayment(true);
                      setPrepaymentPercent((prev) =>
                        prev.trim()
                          ? prev
                          : (prepaymentPercentDefault ?? ""),
                      );
                      showSnackbar({
                        severity: "info",
                        message: "Prepayment enabled.",
                      });
                    },
                  }
                : null,
              // Restore/add KM: DL only; no template membership required.
              canRestoreKilometerAllowance({
                location: slotLocation,
                alreadyShown: showKilometerAllowance,
              })
                ? {
                    label: "Add Kilometer Allowance",
                    onClick: () => {
                      beginExistingBookingEdit();
                      setShowKilometerAllowance(true);
                      showSnackbar({
                        severity: "info",
                        message: "Kilometer Allowance enabled.",
                      });
                    },
                  }
                : null,
              !isViewingExisting
                ? {
                    label: "Add Discount to Total",
                    onClick: () => {
                      setBookingDiscountModalOpen(true);
                    },
                  }
                : null,
              // Restore after remove only while cancel/late trigger still holds.
              canRestoreLateCancellation({
                policyPercent: lateCancellationFeePercentDefault,
                status: viewingBookingEvent?.status ?? slotStatus,
                cancelledServiceIds:
                  viewingBookingEvent?.details?.cancelledServiceIds ??
                  negotiationDetails?.cancelledServiceIds,
                alreadyShown: showLateCancellation,
                appointmentStartMs: startMs,
                noticeHours: cancellationBeforeHours,
                noticeMinutes: cancellationBeforeMinutes,
              })
                ? {
                    label: "Add Late Cancellation",
                    onClick: () => {
                      beginExistingBookingEdit();
                      const activation = buildProtectiveFeeActivation(
                        lateCancellationFeePercentDefault,
                        {
                          kind: "lateCancellation",
                          cancellationFeeAt: new Date().toISOString(),
                          exceededCancellationWindow: true,
                        },
                      );
                      if (!activation) return;
                      setShowLateCancellation(true);
                      setLateCancellationFeePercentCeiling(activation.ceiling);
                      // ponytail: always template cap on restore; keep reduce-only after
                      setLateCancellationFeePercent(activation.percent);
                      setCancellationFeeAt(activation.cancellationFeeAt);
                      setExceededCancellationWindow(true);
                      showSnackbar({
                        severity: "info",
                        message: "Late cancellation fee enabled.",
                      });
                    },
                  }
                : null,
              canRestoreLateRescheduling({
                policyPercent: lateRescheduleFeePercentDefault,
                scheduleEdited: Boolean(
                  viewingBookingEvent?.details?.scheduleEdited,
                ),
                alreadyShown: showLateRescheduling,
                appointmentStartMs: startMs,
                noticeHours: appointmentBeforeHours,
                noticeMinutes: appointmentBeforeMinutes,
              })
                ? {
                    label: "Add Late Rescheduling",
                    onClick: () => {
                      beginExistingBookingEdit();
                      const activation = buildProtectiveFeeActivation(
                        lateRescheduleFeePercentDefault,
                        { kind: "lateReschedule" },
                      );
                      if (!activation) return;
                      setShowLateRescheduling(true);
                      setLateRescheduleFeePercentCeiling(activation.ceiling);
                      setLateRescheduleFeePercent(activation.percent);
                      showSnackbar({
                        severity: "info",
                        message: "Late rescheduling fee enabled.",
                      });
                    },
                  }
                : null,
              canRestoreNoShowFee({
                policyPercent: noShowFeePercentDefault,
                status: viewingBookingEvent?.status ?? slotStatus,
                alreadyShown: showNoShowFee,
              })
                ? {
                    label: "Add No-Show Fee",
                    onClick: () => {
                      beginExistingBookingEdit();
                      const activation = buildProtectiveFeeActivation(
                        noShowFeePercentDefault,
                        { kind: "noShow" },
                      );
                      if (!activation) return;
                      setShowNoShowFee(true);
                      setNoShowFeePercentCeiling(activation.ceiling);
                      setNoShowFeePercent(activation.percent);
                      showSnackbar({
                        severity: "info",
                        message: "No-show fee enabled.",
                      });
                    },
                  }
                : null,
              !showInternalNote
                ? {
                    label: "Add Note",
                    onClick: () => {
                      beginExistingBookingEdit();
                      setShowInternalNote(true);
                    },
                  }
                : null,
            ] as Array<{
              label: string;
              onClick: () => void;
            } | null>
          )
            .filter(
              (item): item is { label: string; onClick: () => void } =>
                Boolean(item),
            )
            .map((item) => (
              <Box
                key={item.label}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setBookingMoreAnchor(null);
                  item.onClick();
                }}
                sx={{
                  px: 1.5,
                  py: 1,
                  cursor: "pointer",
                  ...mollureLabelSx(m.navy),
                  borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                  "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                {item.label}
              </Box>
            ))}
        </Stack>
      </Popover>
    </>
  );
}
