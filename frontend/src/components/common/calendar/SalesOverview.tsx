"use client";

import { mollureSectionTitleSx, mollureLabelSx, mollureBodyMutedSx } from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { FinanceDocumentPreviewDrawer } from "../finance-documents";
import PaymentDueIcon from "../client-booking/PaymentDueIcon";
import TransactionNoteModal from "../../sections/finance/TransactionNoteModal";
import SalesAddOnCheckout from "./SalesAddOnCheckout";
import SalesCancelModal from "./SalesCancelModal";
import SalesEditCheckout from "./SalesEditCheckout";
import SalesOverdueReissueModal from "./SalesOverdueReissueModal";
import SalesOverviewCard from "./SalesOverviewCard";
import RefundSalesDrawer from "../../sections/finance/RefundSalesDrawer";
import {
  SALES_OVERVIEW_COPY,
  SALES_OVERVIEW_OVERDUE_COLOR,
} from "./salesOverview.data";
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
    professionalBusinessOverride,
    clearCheckout,
    setCancelCard,
    setDocOpen,
    setEditingCard,
    setNoteCard,
    setOverdueCard,
    refundCard,
    refundTransactions,
    setRefundCard,
    subToCard,
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

  if (refundCard) {
    return (
      <RefundSalesDrawer
        open
        transactions={refundTransactions}
        fallbackItems={refundCard.lines.map((line) => ({
          id: line.id,
          name: line.label,
          meta: `€${line.amount.toFixed(2)}`,
          amount: line.amount,
        }))}
        onClose={() => setRefundCard(null)}
        onSave={async () => {
          await handleRefundSales(refundCard);
        }}
      />
    );
  }

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
        <Box
          sx={{
            width: "100%",
            borderRadius: "12px",
            px: 1.35,
            py: 1.05,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            bgcolor: alpha(SALES_OVERVIEW_OVERDUE_COLOR, 0.08),
            border: `1px solid ${alpha(SALES_OVERVIEW_OVERDUE_COLOR, 0.28)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.85} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: "9px",
                bgcolor: alpha(SALES_OVERVIEW_OVERDUE_COLOR, 0.16),
                flexShrink: 0,
              }}
            >
              <PaymentDueIcon size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  ...mollureLabelSx(m.navy),
                  lineHeight: 1.2,
                }}
              >
                {SALES_OVERVIEW_COPY.penaltyInvoiceTitle}
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontSize: 11,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.5),
                  lineHeight: 1.2,
                }}
              >
                {SALES_OVERVIEW_COPY.penaltyInvoiceSubtitle}
              </Typography>
            </Box>
          </Stack>
          <AppButton
            size="small"
            onClick={() => setOverdueCard(overdueManualCard)}
            sx={{
              flexShrink: 0,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 12,
              borderRadius: "8px",
              bgcolor: SALES_OVERVIEW_OVERDUE_COLOR,
              color: "#fff",
              "&:hover": { bgcolor: "#DC6803" },
            }}
          >
            {SALES_OVERVIEW_COPY.sendPenaltyInvoice}
          </AppButton>
        </Box>
      ) : null}

      {cards.length === 0 ? (
        <Typography sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.6) })}>
          {SALES_OVERVIEW_COPY.empty}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {cards.map((card) => (
            <SalesOverviewCard
              key={card.id}
              card={card}
              highlighted={
                Boolean(focusCardId) &&
                (card.id === focusCardId ||
                  Boolean(card.subCards?.some((sub) => sub.id === focusCardId)))
              }
              highlightId={focusCardId}
              onViewInvoice={() => openDocument(card, "invoice")}
              onViewReceipt={() => openDocument(card, "receipt")}
              onAddOns={() =>
                openAddOns(card.bookingId, card.bookingCode, card.id)
              }
              onMenuAction={(action) => void handleMenuAction(card, action)}
              onSubViewInvoice={(sub) =>
                openDocument(subToCard(sub, card), "invoice")
              }
              onSubViewReceipt={(sub) =>
                openDocument(subToCard(sub, card), "receipt")
              }
              onSubAddOns={(sub) => {
                openAddOns(
                  sub.bookingId || card.bookingId,
                  sub.bookingCode || card.bookingCode,
                  sub.id,
                );
              }}
              onSubMenuAction={(sub, action) =>
                void handleMenuAction(subToCard(sub, card), action)
              }
            />
          ))}
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
        onClose={() => setOverdueCard(null)}
        onConfirm={handleReissue}
      />
    </Box>
  );
}
