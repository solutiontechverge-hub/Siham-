"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureSectionTitleSx,
  mollureBodyMutedSx,
} from "../../../theme/mollureHierarchy";
import { FinanceDocumentPreviewDrawer } from "../finance-documents";
import TransactionDateModal from "../../sections/finance/TransactionDateModal";
import TransactionNoteModal from "../../sections/finance/TransactionNoteModal";
import SalesAddOnCheckout from "./SalesAddOnCheckout";
import SalesCancelModal from "./SalesCancelModal";
import SalesEditCheckout from "./SalesEditCheckout";
import SalesOverdueReissueModal from "./SalesOverdueReissueModal";
import SalesOverdueReissuePanel from "./SalesOverdueReissuePanel";
import SalesOverviewCard from "./SalesOverviewCard";
import RefundSalesDrawer from "../../sections/finance/RefundSalesDrawer";
import { refundItemsFromSaleLines } from "../../sections/finance/refundSales.data";
import { SALES_OVERVIEW_COPY } from "./salesOverview.data";
import {
  useSalesOverview,
  type SalesOverviewArgs,
} from "./useSalesOverview";

export type SalesOverviewProps = SalesOverviewArgs;

export default function SalesOverview({
  bookings,
  currentEvent = null,
  clientName = "",
  clientEmail = "",
  clientPhone = "",
  fallbackResourceId = "unassigned",
  focusCardId = null,
  onBookingCancelled,
  onBookingCompleted,
}: SalesOverviewProps) {
  const m = useTheme().palette.mollure;
  const {
    cancelling,
    cards,
    cancelCard,
    checkoutContext,
    clientKind,
    docOpen,
    docRow,
    docType,
    editingCard,
    financeSettings,
    handleConfirmCancel,
    handleDeleteNote,
    handleMenuAction,
    handleReissue,
    handleSaveAddon,
    handleSaveEdit,
    handleSaveNote,
    handleRefundSales,
    noteCard,
    openAddOns,
    openDocument,
    overdueCard,
    overdueManualCard,
    overduePaymentTerms,
    professionalBusinessOverride,
    clearCheckout,
    setCancelCard,
    setDocOpen,
    setEditingCard,
    setNoteCard,
    setOverdueCard,
    refundCard,
    refundTransactions,
    refundTransactionsLoading,
    setRefundCard,
    setRefundTransactionsLoading,
    subToCard,
    transactionDateModal,
    setTransactionDateModal,
    confirmTransactionDateModal,
  } = useSalesOverview({
    bookings,
    currentEvent,
    clientName,
    clientEmail,
    clientPhone,
    fallbackResourceId,
    focusCardId,
    onBookingCancelled,
    onBookingCompleted,
  });

  // Booking-wide sale lines for Refund-by-Item (not only the active card).
  // Memoized so RefundSalesDrawer does not see a new fallbackItems array every render.
  const refundFallbackItems = React.useMemo(() => {
    if (!refundCard) return [];
    const bookingSaleLines = cards
      .filter(
        (card) =>
          String(card.bookingId) === String(refundCard.bookingId) ||
          String(card.bookingCode) === String(refundCard.bookingCode),
      )
      .flatMap((card) => card.lines);
    return refundItemsFromSaleLines(
      bookingSaleLines.length ? bookingSaleLines : refundCard.lines,
    );
  }, [cards, refundCard]);

  if (editingCard) {
    return (
      <SalesEditCheckout
        card={editingCard}
        clientKind={clientKind}
        onCancel={() => setEditingCard(null)}
        onSave={handleSaveEdit}
      />
    );
  }

  if (checkoutContext) {
    return (
      <SalesAddOnCheckout
        clientName={checkoutContext.clientName}
        clientEmail={checkoutContext.clientEmail}
        priorLines={checkoutContext.priorLines}
        prepaymentAmount={checkoutContext.prepaymentAmount}
        onCancel={clearCheckout}
        onSave={handleSaveAddon}
      />
    );
  }

  return (
    <Box>
      <Typography
        sx={{
          ...mollureSectionTitleSx(m.navy),
          mb: 1.5,
        }}
      >
        {SALES_OVERVIEW_COPY.title}
      </Typography>

      {overdueManualCard ? (
        <SalesOverdueReissuePanel
          unpaidAmount={overdueManualCard.highlightAmount ?? 0}
          paymentTerms={overduePaymentTerms}
          alreadyReissued={overdueManualCard.kind === "reissued_invoice"}
          onConfirm={(payload) => {
            void handleReissue(payload, overdueManualCard);
          }}
        />
      ) : null}

      {cards.length === 0 ? (
        <Typography sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.6) })}>
          {SALES_OVERVIEW_COPY.empty}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {cards.map((card) => {
            // Split-bill: one shell around payer cards so they read as one entity.
            if (card.subCards?.length) {
              const subs = card.subCards.map((sub) => subToCard(sub, card));
              const groupHighlighted =
                Boolean(focusCardId) &&
                subs.some((sub) => sub.id === focusCardId);
              return (
                <Box
                  key={card.id}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${
                      groupHighlighted
                        ? alpha(m.teal, 0.55)
                        : alpha(m.navy, 0.1)
                    }`,
                    bgcolor: groupHighlighted
                      ? alpha(m.teal, 0.05)
                      : "#fff",
                    boxShadow: groupHighlighted
                      ? `0 0 0 3px ${alpha(m.teal, 0.12)}`
                      : "none",
                    px: 1.75,
                    py: 1.5,
                  }}
                >
                  <Stack
                    spacing={1.5}
                    divider={
                      <Box
                        sx={{
                          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                        }}
                      />
                    }
                  >
                    {subs.map((sub, index) => (
                      <SalesOverviewCard
                        key={sub.id}
                        card={sub}
                        embedded
                        hideTitle={index > 0}
                        highlighted={
                          Boolean(focusCardId) && sub.id === focusCardId
                        }
                        highlightId={focusCardId}
                        onViewInvoice={() => openDocument(sub, "invoice")}
                        onViewReceipt={() => openDocument(sub, "receipt")}
                        onAddOns={() =>
                          openAddOns(sub.bookingId, sub.bookingCode, sub.id)
                        }
                        onMenuAction={(action) =>
                          void handleMenuAction(sub, action)
                        }
                      />
                    ))}
                  </Stack>
                </Box>
              );
            }

            return (
              <SalesOverviewCard
                key={card.id}
                card={card}
                highlighted={
                  Boolean(focusCardId) && card.id === focusCardId
                }
                highlightId={focusCardId}
                onViewInvoice={() => openDocument(card, "invoice")}
                onViewReceipt={() => openDocument(card, "receipt")}
                onAddOns={() =>
                  openAddOns(card.bookingId, card.bookingCode, card.id)
                }
                onMenuAction={(action) => void handleMenuAction(card, action)}
              />
            );
          })}
        </Stack>
      )}

      <FinanceDocumentPreviewDrawer
        open={docOpen}
        onClose={() => setDocOpen(false)}
        documentType={docType}
        invoiceType={clientKind === "company" ? "company" : "individual"}
        settings={financeSettings}
        row={docRow}
        professionalBusinessOverride={professionalBusinessOverride}
      />

      <RefundSalesDrawer
        open={Boolean(refundCard)}
        transactions={refundTransactions}
        transactionsLoading={refundTransactionsLoading}
        fallbackItems={refundFallbackItems}
        originalPaymentMethod={refundCard?.paymentMethod}
        onClose={() => {
          setRefundCard(null);
          // Avoid sticky "Loading…" if a late fetch races after close.
          setRefundTransactionsLoading(false);
        }}
        onSave={
          refundCard
            ? async (payload) => {
                const ok = await handleRefundSales(refundCard, payload);
                // Snackbar already shown with the real reason; throw to keep drawer open.
                if (!ok) throw new Error("refund-rejected");
                setRefundCard(null);
              }
            : undefined
        }
      />

      <TransactionNoteModal
        open={Boolean(noteCard)}
        initialNote={noteCard?.note ?? ""}
        onClose={() => setNoteCard(null)}
        onSave={handleSaveNote}
        onDelete={noteCard?.note ? handleDeleteNote : undefined}
      />

      <SalesCancelModal
        open={Boolean(cancelCard)}
        confirming={cancelling}
        onClose={() => setCancelCard(null)}
        onConfirm={() => void handleConfirmCancel()}
      />

      <SalesOverdueReissueModal
        open={Boolean(overdueCard)}
        unpaidAmount={overdueCard?.highlightAmount ?? 0}
        paymentTerms={overduePaymentTerms}
        alreadyReissued={overdueCard?.kind === "reissued_invoice"}
        onClose={() => setOverdueCard(null)}
        onConfirm={(payload) => void handleReissue(payload)}
      />

      <TransactionDateModal
        open={Boolean(transactionDateModal)}
        title={
          transactionDateModal?.mode === "markPaid"
            ? "Mark as Paid"
            : "Edit transaction date"
        }
        subtitle={
          transactionDateModal?.mode === "markPaid"
            ? "Enter the date this offline payment was received."
            : "Update the transaction date for this offline payment."
        }
        initialDate={transactionDateModal?.initialDate ?? null}
        confirmLabel={
          transactionDateModal?.mode === "markPaid" ? "Mark Paid" : "Save"
        }
        onClose={() => setTransactionDateModal(null)}
        onConfirm={(date) => void confirmTransactionDateModal(date)}
      />
    </Box>
  );
}
