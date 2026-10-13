"use client";

import { Box, Container, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppButton, AppDrawer } from "..";
import BookingActivityOverview from "../calendar/BookingActivityOverview";
import { FinanceDocumentPreviewDrawer } from "../finance-documents";
import type { FinanceInvoiceTemplateType } from "../finance-documents/useFinanceInvoiceSettings";
import ClientBookingCancelDialog from "./ClientBookingCancelDialog";
import ClientBookingCancelFeeDialog from "./ClientBookingCancelFeeDialog";
import ClientBookingDeleteDialog from "./ClientBookingDeleteDialog";
import ClientBookingDiscardDialog from "./ClientBookingDiscardDialog";
import ClientEbrSuggestDrawer from "./ClientEbrSuggestDrawer";
import ClientEbrActionDialog from "./ClientEbrActionDialog";
import type { ClientEbrActionKind } from "./ClientEbrActionDialog";
import StripePrepaymentDialog from "./StripePrepaymentDialog";
import {
  ACTIVITY_DRAWER_TITLES,
  CLIENT_BOOKING_DETAILS_COPY,
} from "./clientBookingDetails.data";
import type { ClientBookingDetailsActionFeedback } from "./clientBookingDetails.helpers";
import type { CancellationFeeSettlement } from "./settleCancellationFee";
import type { ClientBookingDraft } from "./types";

/* ponytail: loose overlay bag — mirrors orchestrator return; tighten when dialog props unify */
type Props = {
  m: { white: string; navy: string; success: string; successDark: string };
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  handleConfirmCancelBooking: (reason: string) => void;
  cancelFeeDialogOpen: boolean;
  handleKeepBookingFromFeeDialog: () => void;
  handlePayCancellationFee: () => void | Promise<void>;
  cancellationSettlement: CancellationFeeSettlement;
  policySections: unknown[];
  cancellationPolicyInstruction?: string | null;
  isCancelProcessing: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDeleteBooking: () => void;
  bookingStatus: string;
  discardDialogOpen: boolean;
  setDiscardDialogOpen: (open: boolean) => void;
  handleDiscardBookingRequest: () => void;
  activityOpen: boolean;
  setActivityOpen: (open: boolean) => void;
  activityDetailItem: unknown;
  setActivityDetailItem: (item: unknown) => void;
  activityTimelineItems: unknown[];
  ebrAction: ClientEbrActionKind | null;
  setEbrAction: (action: ClientEbrActionKind | null) => void;
  isIncomingConfirmedEr: boolean;
  isIncomingBr: boolean;
  activeBooking: {
    prepaymentPercent?: number | null;
  } | null;
  prepaymentPercent: number;
  isPrepaymentPaid: boolean;
  handleConfirmEbrSuggest: () => void | Promise<void>;
  setResponseActionsDismissed: (v: boolean) => void;
  setActionFeedback: (v: ClientBookingDetailsActionFeedback | null) => void;
  handleConfirmEbrAccept: () => void;
  handleConfirmEbrReject: () => void | Promise<void>;
  ebrSuggestDrawerOpen: boolean;
  setEbrSuggestDrawerOpen: (open: boolean) => void;
  draft: ClientBookingDraft | null;
  handleEbrSuggestEditServices: (note: string) => void;
  handleEbrSuggestSend: (note: string) => void | Promise<void>;
  stripeDialogOpen: boolean;
  setStripeDialogOpen: (open: boolean) => void;
  prepaidAmount: number;
  bookingRef: string;
  completePrepayment: () => void | Promise<void>;
  cancelFeeStripeOpen: boolean;
  setCancelFeeStripeOpen: (open: boolean) => void;
  setCancelFeeDialogOpen: (open: boolean) => void;
  handleCancellationFeeStripeSuccess: () => void | Promise<void>;
  activeDocument: {
    type: "invoice" | "receipt";
    row: unknown;
  } | null;
  setActiveDocument: (
    doc: { type: "invoice" | "receipt"; row: unknown } | null,
  ) => void;
  bookingInvoiceType: FinanceInvoiceTemplateType | string;
  financeSettings: unknown;
  professionalBusinessOverride: unknown;
  hasProfessionalSuggestedEdits: boolean;
};

export default function ClientBookingDetailsOverlays(props: Props) {
  const {
    m,
    cancelDialogOpen,
    setCancelDialogOpen,
    handleConfirmCancelBooking,
    cancelFeeDialogOpen,
    handleKeepBookingFromFeeDialog,
    handlePayCancellationFee,
    cancellationSettlement,
    policySections,
    cancellationPolicyInstruction,
    isCancelProcessing,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteBooking,
    bookingStatus,
    discardDialogOpen,
    setDiscardDialogOpen,
    handleDiscardBookingRequest,
    activityOpen,
    setActivityOpen,
    activityDetailItem,
    setActivityDetailItem,
    activityTimelineItems,
    ebrAction,
    setEbrAction,
    isIncomingConfirmedEr,
    isIncomingBr,
    activeBooking,
    prepaymentPercent,
    isPrepaymentPaid,
    handleConfirmEbrSuggest,
    setResponseActionsDismissed,
    setActionFeedback,
    handleConfirmEbrAccept,
    handleConfirmEbrReject,
    ebrSuggestDrawerOpen,
    setEbrSuggestDrawerOpen,
    draft,
    handleEbrSuggestEditServices,
    handleEbrSuggestSend,
    stripeDialogOpen,
    setStripeDialogOpen,
    prepaidAmount,
    bookingRef,
    completePrepayment,
    cancelFeeStripeOpen,
    setCancelFeeStripeOpen,
    setCancelFeeDialogOpen,
    handleCancellationFeeStripeSuccess,
    activeDocument,
    setActiveDocument,
    bookingInvoiceType,
    financeSettings,
    professionalBusinessOverride,
    hasProfessionalSuggestedEdits,
  } = props;

  return (
    <>
      <ClientBookingCancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancelBooking}
      />
      <ClientBookingCancelFeeDialog
        open={cancelFeeDialogOpen}
        onClose={handleKeepBookingFromFeeDialog}
        onKeepBooking={handleKeepBookingFromFeeDialog}
        onPayNow={() => {
          void handlePayCancellationFee();
        }}
        settlement={cancellationSettlement}
        policySections={policySections as never}
        policyInstruction={cancellationPolicyInstruction ?? undefined}
        isProcessing={isCancelProcessing}
      />
      <ClientBookingDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBooking}
        variant={bookingStatus === "completed" ? "completed" : "cancelled"}
      />
      <ClientBookingDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={handleDiscardBookingRequest}
      />

      <AppDrawer
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          setActivityDetailItem(null);
        }}
        title={
          activityDetailItem
            ? (activityDetailItem as { detailType?: string; comparison?: unknown })
                .detailType === "cancellation"
              ? ACTIVITY_DRAWER_TITLES.details
              : (activityDetailItem as { detailType?: string; comparison?: unknown })
                    .detailType === "comparison" ||
                  (activityDetailItem as { comparison?: unknown }).comparison
                ? ACTIVITY_DRAWER_TITLES.comparison
                : ACTIVITY_DRAWER_TITLES.editRequest
            : ACTIVITY_DRAWER_TITLES.overview
        }
        onBack={
          activityDetailItem ? () => setActivityDetailItem(null) : undefined
        }
        panelWidth={420}
      >
        <Box sx={{ px: 2, pb: 2 }}>
          <BookingActivityOverview
            title={ACTIVITY_DRAWER_TITLES.overviewHeading}
            items={activityTimelineItems as never}
            emptyMessage={ACTIVITY_DRAWER_TITLES.empty}
            selectedDetail={activityDetailItem as never}
            onSelectedDetailChange={setActivityDetailItem as never}
          />
        </Box>
      </AppDrawer>

      <ClientEbrActionDialog
        open={Boolean(ebrAction)}
        action={ebrAction}
        context={
          isIncomingConfirmedEr ? "er" : isIncomingBr ? "br" : "ebr"
        }
        onClose={() => setEbrAction(null)}
        onConfirm={() => {
          const action = ebrAction;
          const acceptNeedsPrepay =
            action === "accept" &&
            isIncomingBr &&
            (Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) ||
              0) > 0 &&
            !isPrepaymentPaid;
          if (action === "suggest") {
            void handleConfirmEbrSuggest();
            return;
          }
          if (!acceptNeedsPrepay) {
            setResponseActionsDismissed(true);
            setActionFeedback({
              severity: "success",
              message:
                action === "accept"
                  ? isIncomingConfirmedEr
                    ? "Edit request accepted."
                    : isIncomingBr
                      ? "Booking request accepted."
                      : "Changes accepted."
                  : isIncomingConfirmedEr
                    ? "Edit request rejected. Booking stays confirmed."
                    : isIncomingBr
                      ? "Booking request rejected."
                      : "Edit request rejected. Booking stays confirmed.",
            });
          }
          if (ebrAction === "accept") handleConfirmEbrAccept();
          else if (ebrAction === "reject") void handleConfirmEbrReject();
        }}
      />

      <ClientEbrSuggestDrawer
        open={ebrSuggestDrawerOpen}
        draft={draft}
        onClose={() => setEbrSuggestDrawerOpen(false)}
        onEditServices={handleEbrSuggestEditServices}
        onSend={handleEbrSuggestSend}
      />

      <StripePrepaymentDialog
        open={stripeDialogOpen}
        amount={prepaidAmount}
        bookingRef={bookingRef}
        onClose={() => setStripeDialogOpen(false)}
        onSuccess={completePrepayment}
      />
      <StripePrepaymentDialog
        open={cancelFeeStripeOpen}
        amount={cancellationSettlement.amountDueNow}
        bookingRef={bookingRef}
        title={CLIENT_BOOKING_DETAILS_COPY.payCancellationFeeTitle}
        subtitlePrefix={
          CLIENT_BOOKING_DETAILS_COPY.payCancellationFeeSubtitlePrefix
        }
        paymentType="booking_cancellation_fee"
        onClose={() => {
          setCancelFeeStripeOpen(false);
          setCancelFeeDialogOpen(true);
        }}
        onSuccess={() => {
          void handleCancellationFeeStripeSuccess();
        }}
      />

      <FinanceDocumentPreviewDrawer
        open={Boolean(activeDocument)}
        onClose={() => setActiveDocument(null)}
        documentType={activeDocument?.type ?? "invoice"}
        invoiceType={bookingInvoiceType as FinanceInvoiceTemplateType}
        settings={financeSettings as never}
        row={(activeDocument?.row ?? null) as never}
        professionalBusinessOverride={professionalBusinessOverride as never}
      />

      {hasProfessionalSuggestedEdits && !isIncomingBr ? (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            bgcolor: m.white,
            borderTop: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 -8px 24px rgba(16, 35, 63, 0.08)",
            px: { xs: 2, md: 3 },
            py: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <Container maxWidth="lg" disableGutters>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.15}>
              <AppButton
                fullWidth
                variant="contained"
                disableElevation
                onClick={() => setEbrAction("accept")}
                sx={{
                  minHeight: 44,
                  bgcolor: m.success,
                  color: "#fff",
                  "&:hover": { bgcolor: m.successDark, color: "#fff" },
                }}
              >
                {CLIENT_BOOKING_DETAILS_COPY.acceptSuggestedChanges}
              </AppButton>
              <AppButton
                fullWidth
                tone="secondary"
                onClick={() => setEbrAction("suggest")}
                sx={{ minHeight: 44 }}
              >
                {CLIENT_BOOKING_DETAILS_COPY.suggestChanges}
              </AppButton>
              <AppButton
                fullWidth
                tone="danger"
                onClick={() => setEbrAction("reject")}
                sx={{ minHeight: 44 }}
              >
                {CLIENT_BOOKING_DETAILS_COPY.reject}
              </AppButton>
            </Stack>
          </Container>
        </Box>
      ) : null}
    </>
  );
}
