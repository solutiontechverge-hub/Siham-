"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Container, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AppButton,
  AppPillTabs,
  ClientPageTabsBar,
  MarketingSiteFooter,
  MollureMarketingHeader,
  stickyFooterAnchorSx,
  stickyFooterPageSx,
} from "..";
import { marketingShellFooter } from "../../../data/marketingShell.data";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import ClientBookingDetailsHeader from "./ClientBookingDetailsHeader";
import { ACTIVITY_COMPARISON_SIGNPOST } from "../calendar/buildActivityComparison";
import ClientBookingInfoBar from "./ClientBookingInfoBar";
import ClientBookingPaymentDetailsCard from "./ClientBookingPaymentDetailsCard";
import ClientBookingPaymentSummary from "./ClientBookingPaymentSummary";
import ClientBookingPoliciesAccordion from "./ClientBookingPoliciesAccordion";
import ClientBookingChangeResponsePanel from "./ClientBookingChangeResponsePanel";
import ClientEbrResponseActions from "./ClientEbrResponseActions";
import EditRequestIncomingNote from "./EditRequestIncomingNote";
import InlineTimedSnackbar from "../InlineTimedSnackbar";
import { isResponseWindowOverdue } from "../calendar/bookingResponseDeadline";
import ClientBookingPaymentMethodSelector from "./ClientBookingPaymentMethodSelector";
import ClientBookingDetailsOverlays from "./ClientBookingDetailsOverlays";
import { CLIENT_BOOKING_DETAILS_COPY } from "./clientBookingDetails.data";
import { useClientBookingDetails } from "./useClientBookingDetails";

export type ClientBookingDetailsVariant = "standard" | "prepaid";

export type ClientBookingDetailsViewProps = {
  variant: ClientBookingDetailsVariant;
};

export default function ClientBookingDetailsView({
  variant,
}: ClientBookingDetailsViewProps) {
  const {
    acceptedChangesNote,
    actionFeedback,
    activeBooking,
    activeDocument,
    activityDetailItem,
    activityOpen,
    activityTimelineItems,
    address,
    bookedDateLabel,
    bookedTimeLabel,
    bookingStatus,
    bookingInvoiceType,
    bookingNotesMeta,
    bookingRef,
    bookingSetup,
    bookingTransactionRow,
    businessProfile,
    canActOnPayment,
    cancelDialogOpen,
    cancelFeeDialogOpen,
    cancelFeeStripeOpen,
    cancellationSettlement,
    cancelledServicesForDisplay,
    checkoutPaymentOptions,
    clientChangesAwaitingApproval,
    clientScheduleChangeTags,
    clientVisibleAddedProductIds,
    clientVisibleAddedServiceIds,
    clientVisibleCancelledProductIds,
    clientVisibleCancelledServiceIds,
    clientVisibleEditedProductIds,
    clientVisibleEditedServiceIds,
    completePrepayment,
    deleteDialogOpen,
    detailsContentKey,
    discardDialogOpen,
    displayDraft,
    displayPrepaidAmount,
    displayTotal,
    draft,
    ebrAction,
    ebrSuggestDrawerOpen,
    editRequest,
    effectivePrepayPercent,
    financeSettings,
    handleAcknowledgeCounterpartyAction,
    handleAcknowledgeRejected,
    handleCancellationFeeStripeSuccess,
    handleConfirmCancelBooking,
    handleConfirmEbrAccept,
    handleConfirmEbrReject,
    handleConfirmEbrSuggest,
    handleDeleteBooking,
    handleDiscardBookingRequest,
    handleEbrSuggestEditServices,
    handleEbrSuggestSend,
    handleKeepBookingFromFeeDialog,
    handlePayCancellationFee,
    handlePayNow,
    handleSendBookingRequest,
    hasProfessionalSuggestedEdits,
    headerName,
    incomingProfessionalNote,
    isBookingRequestSent,
    isCancelled,
    isCancelProcessing,
    isClientChangeAccepted,
    isDraft,
    isEbrIncoming,
    isIncomingBr,
    isIncomingConfirmedEr,
    isOfflinePay,
    isPaymentDue,
    isPrepaid,
    isPrepaymentPaid,
    isSubmittingRequest,
    kilometerAllowanceAmount,
    lineTagComparisonMode,
    listTab,
    locationMode,
    m,
    openActivityComparison,
    openConfirmedEbrEditor,
    openInvoice,
    openReceipt,
    pageBackground,
    paymentCardPrepaymentState,
    paymentProducts,
    payNowLabel,
    policySections,
    prepaidAmount,
    prepaymentPercent,
    prepaymentReceiptRow,
    prepaymentState,
    professionalBusinessOverride,
    professionalPhone,
    professionalRole,
    rejectedChangesNote,
    requesterAvatarUrl,
    requesterName,
    requiresPrepayment,
    router,
    selectedPaymentMethod,
    setActionFeedback,
    setActiveDocument,
    setActivityDetailItem,
    setActivityOpen,
    setCancelDialogOpen,
    setCancelFeeDialogOpen,
    setCancelFeeStripeOpen,
    setDeleteDialogOpen,
    setDiscardDialogOpen,
    setEbrAction,
    setEbrSuggestDrawerOpen,
    setResponseActionsDismissed,
    setSelectedPaymentMethod,
    setStripeDialogOpen,
    shopDisplayName,
    showClientAckOk,
    showKilometerAllowance,
    showPaymentSummary,
    showRejectedResponsePanel,
    showRequestResponseActions,
    showStatusUpdated,
    silentFieldUpdates,
    stripeDialogOpen,
    user,
    visiblePaymentSummarySections,
    bookingPillTabs,
  } = useClientBookingDetails({ variant });

  const paymentCardShared = {
    draft: displayDraft,
    requesterName,
    requesterEmail: user?.email,
    requesterAvatarUrl,
    showKilometerAllowance,
    kilometerAllowanceAmount,
    discount: bookingNotesMeta?.totalDiscount ?? null,
    showLateCancellation: Boolean(bookingNotesMeta?.showLateCancellation),
    lateCancellationFeePercent: bookingNotesMeta?.lateCancellationFeePercent,
    showLateRescheduling: Boolean(bookingNotesMeta?.showLateRescheduling),
    lateRescheduleFeePercent: bookingNotesMeta?.lateRescheduleFeePercent,
    showNoShowFee: Boolean(bookingNotesMeta?.showNoShowFee),
    noShowFeePercent: bookingNotesMeta?.noShowFeePercent,
    editedServiceIds: clientVisibleEditedServiceIds,
    addedServiceIds: clientVisibleAddedServiceIds,
    cancelledServiceIds: clientVisibleCancelledServiceIds,
    updatedGuestIds: silentFieldUpdates.guestIds,
    updatedServiceIds: silentFieldUpdates.serviceIds,
    cancelledServices: cancelledServicesForDisplay,
    editedProductIds: clientVisibleEditedProductIds,
    addedProductIds: clientVisibleAddedProductIds,
    cancelledProductIds: clientVisibleCancelledProductIds,
    changesAwaitingApproval: clientChangesAwaitingApproval,
    scheduleChangeTags: clientScheduleChangeTags,
    editTagSignpostTitle: ACTIVITY_COMPARISON_SIGNPOST,
    onEditTagSignpostClick: () => openActivityComparison(lineTagComparisonMode),
  };

  return (
    <Box sx={{ ...stickyFooterPageSx, bgcolor: pageBackground }}>
      <MollureMarketingHeader
        navItems={[]}
        isAuthed
        userLabel={user?.email ?? ""}
        userName={headerName}
        homeHref="/"
      />

      <ClientPageTabsBar activeLabel={CLIENT_BOOKING_DETAILS_COPY.activeLabelBooking} />
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 0, pt: 1 }}
      >
        <AppPillTabs
          tabs={bookingPillTabs}
          active={listTab}
          alignStart
          onChange={(tab) =>
            router.push(`/clients/booking?tab=${parseBookingListTab(tab)}`)
          }
        />
      </Container>

      <Container maxWidth="lg" sx={{ pb: hasProfessionalSuggestedEdits && !isIncomingBr ? { xs: 22, sm: 12 } : 4, pt: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: isCancelled ? m.cancelledSurface : m.white,
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <ClientBookingDetailsHeader
            bookingRef={bookingRef}
            apiBookingId={activeBooking?.apiBookingId}
            bookedDateLabel={bookedDateLabel}
            bookedTimeLabel={bookedTimeLabel}
            bookingStatus={bookingStatus}
            bookingRequestSent={isBookingRequestSent}
            bookingRequestDirection={activeBooking?.bookingRequestDirection}
            locationMode={locationMode}
            isCancelled={isCancelled}
            requiresPrepayment={Boolean(
              activeBooking?.requiresPrepayment ??
                (requiresPrepayment ||
                  (Boolean(bookingNotesMeta?.showPrepayment) &&
                    (Number(bookingNotesMeta?.prepaymentPercent) ||
                      prepaymentPercent) > 0)),
            )}
            prepaymentPaid={isPrepaymentPaid}
            paymentDue={isPaymentDue}
            scheduleChangeTags={clientScheduleChangeTags}
            editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onEditTagSignpostClick={() =>
              openActivityComparison(lineTagComparisonMode)
            }
            onEditDateTime={
              bookingStatus === "confirmed"
                ? () => openConfirmedEbrEditor("datetime")
                : undefined
            }
            onEditBookingDetails={
              bookingStatus === "confirmed"
                ? () => openConfirmedEbrEditor("services")
                : undefined
            }
            onEditProject={
              bookingStatus === "confirmed" &&
              locationMode === "desired" &&
              user?.user_type === "company"
                ? () => openConfirmedEbrEditor("project")
                : undefined
            }
            onSendBookingRequest={
              isDraft && !isBookingRequestSent
                ? handleSendBookingRequest
                : undefined
            }
            onDeleteBooking={() => setDeleteDialogOpen(true)}
            onDiscardBookingRequest={() => setDiscardDialogOpen(true)}
            onOpenActivity={() => setActivityOpen(true)}
            showUpdated={showStatusUpdated}
            showEditScenario={
              bookingStatus === "confirmed" &&
              !editRequest.isPending &&
              !isEbrIncoming &&
              !bookingNotesMeta?.silentUpdated &&
              (Boolean(bookingNotesMeta?.lastEditedBy) ||
                Boolean(activeBooking?.editedServiceIds?.length) ||
                Boolean(activeBooking?.editedProductIds?.length) ||
                isClientChangeAccepted)
            }
            ebrSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onEbrClick={() => openActivityComparison("ebr")}
            erSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
            onErClick={() => openActivityComparison("er")}
            responseOverdue={isResponseWindowOverdue(
              {
                responseStatus: bookingNotesMeta?.responseStatus,
                responseStartedAt: bookingNotesMeta?.responseStartedAt,
                respondBy: bookingNotesMeta?.respondBy,
                responseWindowMinutes: bookingNotesMeta?.responseWindowMinutes,
              },
              new Date(),
              bookingSetup?.responseTime ?? null,
            )}
            onWaitingForPrepaymentClick={() => {
              if (isPrepaid) {
                void handlePayNow();
                return;
              }
              router.push(
                `/clients/booking/checkout/prepaid?tab=${encodeURIComponent(listTab)}`,
              );
            }}
          />

          <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
            <ClientBookingInfoBar
              professionalName={shopDisplayName}
              professionalRole={professionalRole}
              address={address}
              locationMode={locationMode}
              phone={professionalPhone}
            />

            {showRejectedResponsePanel ? (
              <>
                <ClientBookingPaymentDetailsCard
                  key={detailsContentKey}
                  {...paymentCardShared}
                  prepaymentState="none"
                  products={editRequest.suggestedProducts}
                />
                <ClientBookingChangeResponsePanel
                  variant="rejected"
                  total={displayTotal}
                  prepaidAmount={displayPrepaidAmount}
                  prepaymentPaid={prepaymentState === "paid"}
                  onOk={handleAcknowledgeRejected}
                  onViewInvoice={
                    bookingTransactionRow ? openInvoice : undefined
                  }
                  onViewReceipt={
                    (prepaymentReceiptRow ?? bookingTransactionRow)
                      ? openReceipt
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <ClientBookingPaymentDetailsCard
                  key={detailsContentKey}
                  {...paymentCardShared}
                  prepaymentState={paymentCardPrepaymentState}
                  prepaymentPercent={effectivePrepayPercent}
                  payNowLabel={payNowLabel}
                  rejectedChangesNote={rejectedChangesNote}
                  acceptedChangesNote={acceptedChangesNote}
                  prepaymentOffline={isOfflinePay}
                  products={paymentProducts}
                  onPayNow={
                    paymentCardPrepaymentState === "required" && canActOnPayment
                      ? handlePayNow
                      : undefined
                  }
                  footer={
                    showPaymentSummary ? (
                      <ClientBookingPaymentSummary
                        sections={visiblePaymentSummarySections}
                        headerTotal={displayTotal}
                        onViewInvoice={
                          bookingTransactionRow ? openInvoice : undefined
                        }
                        onViewReceipt={
                          (prepaymentReceiptRow ?? bookingTransactionRow)
                            ? openReceipt
                            : undefined
                        }
                      />
                    ) : undefined
                  }
                />

                {canActOnPayment ? (
                  <ClientBookingPaymentMethodSelector
                    options={checkoutPaymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                ) : null}

                {incomingProfessionalNote ? (
                  <EditRequestIncomingNote
                    note={incomingProfessionalNote}
                    from="professional"
                  />
                ) : null}

                {showRequestResponseActions && isIncomingBr ? (
                  <ClientEbrResponseActions
                    onAccept={() => setEbrAction("accept")}
                    onSuggestChange={() => void handleConfirmEbrSuggest()}
                    onReject={() => setEbrAction("reject")}
                  />
                ) : null}

                <InlineTimedSnackbar
                  open={Boolean(actionFeedback)}
                  message={actionFeedback?.message}
                  severity={actionFeedback?.severity}
                  onClose={() => setActionFeedback(null)}
                />

                {isDraft &&
                !isPrepaid &&
                !isBookingRequestSent &&
                !isEbrIncoming ? (
                  <AppButton
                    tone="primary"
                    fullWidth
                    isLoading={isSubmittingRequest}
                    onClick={handleSendBookingRequest}
                    sx={{
                      mt: 2,
                      height: 40,
                    }}
                  >
                    {CLIENT_BOOKING_DETAILS_COPY.sendBookingRequest}
                  </AppButton>
                ) : null}
              </>
            )}

            {showClientAckOk ? (
              <AppButton
                tone="primary"
                fullWidth
                startIcon={<CheckRoundedIcon />}
                onClick={() => void handleAcknowledgeCounterpartyAction()}
                sx={{ mt: 2, fontSize: 14, py: 1.25 }}
              >
                {CLIENT_BOOKING_DETAILS_COPY.ok}
              </AppButton>
            ) : null}

            <Box sx={{ mt: 2 }}>
              <ClientBookingPoliciesAccordion
                sections={policySections}
                showCancelAction={bookingStatus === "confirmed"}
                onCancelBooking={() => setCancelDialogOpen(true)}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      <ClientBookingDetailsOverlays
        m={m}
        cancelDialogOpen={cancelDialogOpen}
        setCancelDialogOpen={setCancelDialogOpen}
        handleConfirmCancelBooking={handleConfirmCancelBooking}
        cancelFeeDialogOpen={cancelFeeDialogOpen}
        handleKeepBookingFromFeeDialog={handleKeepBookingFromFeeDialog}
        handlePayCancellationFee={handlePayCancellationFee}
        cancellationSettlement={cancellationSettlement}
        policySections={policySections}
        cancellationPolicyInstruction={
          businessProfile?.cancellationPolicyInstruction
        }
        isCancelProcessing={isCancelProcessing}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDeleteBooking={handleDeleteBooking}
        bookingStatus={bookingStatus}
        discardDialogOpen={discardDialogOpen}
        setDiscardDialogOpen={setDiscardDialogOpen}
        handleDiscardBookingRequest={handleDiscardBookingRequest}
        activityOpen={activityOpen}
        setActivityOpen={setActivityOpen}
        activityDetailItem={activityDetailItem}
        setActivityDetailItem={setActivityDetailItem as never}
        activityTimelineItems={activityTimelineItems}
        ebrAction={ebrAction}
        setEbrAction={setEbrAction}
        isIncomingConfirmedEr={isIncomingConfirmedEr}
        isIncomingBr={isIncomingBr}
        activeBooking={activeBooking}
        prepaymentPercent={prepaymentPercent}
        isPrepaymentPaid={isPrepaymentPaid}
        handleConfirmEbrSuggest={handleConfirmEbrSuggest}
        setResponseActionsDismissed={setResponseActionsDismissed}
        setActionFeedback={setActionFeedback}
        handleConfirmEbrAccept={handleConfirmEbrAccept}
        handleConfirmEbrReject={handleConfirmEbrReject}
        ebrSuggestDrawerOpen={ebrSuggestDrawerOpen}
        setEbrSuggestDrawerOpen={setEbrSuggestDrawerOpen}
        draft={draft}
        handleEbrSuggestEditServices={handleEbrSuggestEditServices}
        handleEbrSuggestSend={handleEbrSuggestSend}
        stripeDialogOpen={stripeDialogOpen}
        setStripeDialogOpen={setStripeDialogOpen}
        prepaidAmount={prepaidAmount}
        bookingRef={bookingRef}
        completePrepayment={completePrepayment}
        cancelFeeStripeOpen={cancelFeeStripeOpen}
        setCancelFeeStripeOpen={setCancelFeeStripeOpen}
        setCancelFeeDialogOpen={setCancelFeeDialogOpen}
        handleCancellationFeeStripeSuccess={handleCancellationFeeStripeSuccess}
        activeDocument={activeDocument}
        setActiveDocument={setActiveDocument}
        bookingInvoiceType={bookingInvoiceType}
        financeSettings={financeSettings}
        prepaymentReceiptRow={prepaymentReceiptRow}
        bookingTransactionRow={bookingTransactionRow}
        professionalBusinessOverride={professionalBusinessOverride}
        hasProfessionalSuggestedEdits={hasProfessionalSuggestedEdits}
      />

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
        sx={stickyFooterAnchorSx}
      />
    </Box>
  );
}
