"use client";

import CalendarNoShowModal from "../CalendarNoShowModal";

import CalendarCancelBookingModal from "../CalendarCancelBookingModal";

import CalendarBookingActionConfirmDialog from "../CalendarBookingActionConfirmDialog";

import DiscardBrDialog from "../DiscardBrDialog";

import DiscardEbrDialog from "../DiscardEbrDialog";

import DiscardErDialog from "../DiscardErDialog";

import BookingRequestConfirmDialog from "../BookingRequestConfirmDialog";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarOverlaysBookingDialogsBag = Pick<
  Vm,
  | "cancelModalOpen"
  | "discardBrOpen"
  | "discardEbrOpen"
  | "discardErOpen"
  | "drawerPaymentIsOffline"
  | "handleAcceptConfirmedEr"
  | "handleAcceptIncomingRequest"
  | "handleConfirmBookingAction"
  | "handleConfirmCancel"
  | "handleConfirmNoShow"
  | "handleDiscardBr"
  | "handleDiscardConfirmedEr"
  | "handleDiscardEbr"
  | "handleRejectConfirmedEr"
  | "handleRejectIncomingRequest"
  | "incomingConfirmAction"
  | "isDrawerPrepaymentPaid"
  | "noShowModalOpen"
  | "noShowParticipants"
  | "openBookingMessages"
  | "pendingBookingAction"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "setCancelModalOpen"
  | "setDiscardBrOpen"
  | "setDiscardEbrOpen"
  | "setDiscardErOpen"
  | "setIncomingConfirmAction"
  | "setNoShowModalOpen"
  | "setPendingBookingAction"
  | "setResponseActionsDismissed"
  | "showIncomingErActions"
  | "showPrepayment"
  | "showSnackbar"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarOverlaysBookingDialogsBag;
};

export default function ProfessionalFixedLocationCalendarOverlaysBookingDialogs({
  bag,
}: Props) {
  const {
    cancelModalOpen,
    discardBrOpen,
    discardEbrOpen,
    discardErOpen,
    drawerPaymentIsOffline,
    handleAcceptConfirmedEr,
    handleAcceptIncomingRequest,
    handleConfirmBookingAction,
    handleConfirmCancel,
    handleConfirmNoShow,
    handleDiscardBr,
    handleDiscardConfirmedEr,
    handleDiscardEbr,
    handleRejectConfirmedEr,
    handleRejectIncomingRequest,
    incomingConfirmAction,
    isDrawerPrepaymentPaid,
    noShowModalOpen,
    noShowParticipants,
    openBookingMessages,
    pendingBookingAction,
    prepaymentAmount,
    prepaymentPercent,
    setCancelModalOpen,
    setDiscardBrOpen,
    setDiscardEbrOpen,
    setDiscardErOpen,
    setIncomingConfirmAction,
    setNoShowModalOpen,
    setPendingBookingAction,
    setResponseActionsDismissed,
    showIncomingErActions,
    showPrepayment,
    showSnackbar,
    viewingBookingEvent,
  } = bag;

  return (
    <>
      <DiscardBrDialog
        open={discardBrOpen}
        onClose={() => setDiscardBrOpen(false)}
        onConfirm={handleDiscardBr}
      />
      <DiscardEbrDialog
        open={discardEbrOpen}
        onClose={() => setDiscardEbrOpen(false)}
        onConfirm={handleDiscardEbr}
      />
      <DiscardErDialog
        open={discardErOpen}
        onClose={() => setDiscardErOpen(false)}
        onConfirm={handleDiscardConfirmedEr}
      />
      <BookingRequestConfirmDialog
        open={
          Boolean(incomingConfirmAction) &&
          !(incomingConfirmAction === "reject" && !showIncomingErActions)
        }
        action={incomingConfirmAction}
        scenario={viewingBookingEvent?.bookingScenario}
        onClose={() => setIncomingConfirmAction(null)}
        onConfirm={async () => {
          const action = incomingConfirmAction;
          const prepayRequired =
            showPrepayment &&
            ((Number(prepaymentPercent) || 0) > 0 || prepaymentAmount > 0);
          if (
            action === "accept" &&
            !showIncomingErActions &&
            prepayRequired &&
            !isDrawerPrepaymentPaid &&
            !drawerPaymentIsOffline
          ) {
            showSnackbar({
              severity: "warning",
              message:
                "Prepayment is required. The client must pay before you can accept this booking.",
            });
            return;
          }
          if (action === "suggest") {
            if (viewingBookingEvent) openBookingMessages(viewingBookingEvent);
            return;
          }
          if (showIncomingErActions) {
            if (action === "accept") await handleAcceptConfirmedEr();
            else if (action === "reject") await handleRejectConfirmedEr();
            setResponseActionsDismissed(true);
            showSnackbar({
              severity: "success",
              message:
                action === "accept"
                  ? "Edit request accepted. Client can edit once."
                  : "Edit request rejected. Booking stays Confirmed.",
            });
            return;
          }
          if (action === "accept") await handleAcceptIncomingRequest();
          setResponseActionsDismissed(true);
          showSnackbar({
            severity: "success",
            message: "Booking request accepted.",
          });
        }}
      />
      <CalendarNoShowModal
        open={noShowModalOpen}
        participants={noShowParticipants}
        onClose={() => setNoShowModalOpen(false)}
        onConfirm={(selectedIds) => void handleConfirmNoShow(selectedIds)}
      />
      <CalendarCancelBookingModal
        open={
          cancelModalOpen ||
          (incomingConfirmAction === "reject" && !showIncomingErActions)
        }
        variant={
          incomingConfirmAction === "reject" && !showIncomingErActions
            ? "reject"
            : "cancel"
        }
        onClose={() => {
          setCancelModalOpen(false);
          if (incomingConfirmAction === "reject") {
            setIncomingConfirmAction(null);
          }
        }}
        onConfirm={(payload) => {
          const isBrReject =
            incomingConfirmAction === "reject" && !showIncomingErActions;
          if (isBrReject) {
            // Close before await so a failed RTK object never paints over an open modal.
            setIncomingConfirmAction(null);
            setCancelModalOpen(false);
            void (async () => {
              try {
                await handleRejectIncomingRequest(payload);
                setResponseActionsDismissed(true);
                showSnackbar({
                  severity: "success",
                  message: "Booking request rejected.",
                });
              } catch {
                // reject handler already toasts (+ rethrows Error, not a plain object)
              }
            })();
            return;
          }
          void handleConfirmCancel();
        }}
      />
      <CalendarBookingActionConfirmDialog
        open={Boolean(pendingBookingAction)}
        action={pendingBookingAction}
        onClose={() => setPendingBookingAction(null)}
        onConfirm={() => void handleConfirmBookingAction()}
      />
    </>
  );
}
