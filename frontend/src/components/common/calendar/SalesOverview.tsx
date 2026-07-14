"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarBooking } from "../../../store/services/businessApi";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useSnackbar } from "../AppSnackbar";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
} from "../finance-documents";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import TransactionNoteModal from "../../sections/finance/TransactionNoteModal";
import type { ClientBookingDraft } from "../client-booking/types";
import { buildSalesOverviewCards } from "./buildSalesOverviewCards";
import SalesAddOnCheckout from "./SalesAddOnCheckout";
import SalesOverviewCard, { type SalesCardMenuAction } from "./SalesOverviewCard";
import {
  saveSalesAddon,
  updateSalesAddon,
  upsertSalesCardMeta,
} from "./salesOverview.storage";
import type {
  SalesAddOnCheckoutPayload,
  SalesOverviewCardData,
} from "./salesOverview.types";

type SalesOverviewProps = {
  bookings: CalendarBooking[];
  currentEvent?: CalendarEvent | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fallbackResourceId?: string;
};

function cardToDraft(card: SalesOverviewCardData): ClientBookingDraft {
  return {
    selectedDateISO: card.occurredAt.slice(0, 10),
    selectedTime: "",
    combineServices: false,
    services: card.lines
      .filter((line) => line.amount >= 0)
      .map((line) => ({
        id: line.id,
        name: line.label,
        price: line.amount,
        durationMins: 30,
      })),
    total: card.documentAmount,
    people: [],
    teamMembers: [],
  };
}

export default function SalesOverview({
  bookings,
  currentEvent = null,
  clientName = "",
  clientEmail = "",
  clientPhone = "",
  fallbackResourceId = "unassigned",
}: SalesOverviewProps) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { settings: financeSettings } = useFinanceInvoiceSettings();
  const [revision, setRevision] = React.useState(0);
  const [checkoutBookingId, setCheckoutBookingId] = React.useState<string | null>(null);
  const [checkoutBookingCode, setCheckoutBookingCode] = React.useState("");
  const [docOpen, setDocOpen] = React.useState(false);
  const [docType, setDocType] = React.useState<"invoice" | "receipt">("invoice");
  const [docRow, setDocRow] = React.useState<TransactionRow | null>(null);
  const [noteCard, setNoteCard] = React.useState<SalesOverviewCardData | null>(null);

  const cards = React.useMemo(
    () =>
      buildSalesOverviewCards({
        bookings,
        currentEvent,
        clientName,
        clientEmail,
        clientPhone,
        fallbackResourceId,
      }),
    // revision forces rebuild after localStorage mutations
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, currentEvent, clientName, clientEmail, clientPhone, fallbackResourceId, revision],
  );

  const checkoutContext = React.useMemo(() => {
    if (!checkoutBookingId) return null;
    const match =
      cards.find((card) => card.bookingId === checkoutBookingId && card.kind === "after_treatment") ??
      cards.find((card) => card.bookingId === checkoutBookingId) ??
      null;
    return {
      bookingId: checkoutBookingId,
      bookingCode: checkoutBookingCode || match?.bookingCode || checkoutBookingId,
      clientName: match?.clientName || clientName || "Client",
      clientEmail: match?.clientEmail || clientEmail,
    };
  }, [cards, checkoutBookingCode, checkoutBookingId, clientEmail, clientName]);

  const openDocument = React.useCallback(
    (card: SalesOverviewCardData, type: "invoice" | "receipt") => {
      const draft = cardToDraft(card);
      if (!draft.services.length) {
        showSnackbar({ severity: "warning", message: "No line items available for this document." });
        return;
      }
      const row = buildClientBookingTransactionRow({
        bookingRef: `${card.bookingCode}-${card.kind}`,
        draft,
        requesterName: card.clientName,
        requesterEmail: card.clientEmail,
        financeSettings,
        documentAmount: card.documentAmount,
        methodTitle: card.paymentMethodLabel?.includes("Offline") ? "Offline - Direct" : "Online - Direct",
        methodDetail: card.paymentMethodLabel?.includes("Offline") ? "Cash" : "Card",
      });
      setDocRow(row);
      setDocType(type);
      setDocOpen(true);
    },
    [financeSettings, showSnackbar],
  );

  const bump = () => setRevision((n) => n + 1);

  const handleMenuAction = (card: SalesOverviewCardData, action: SalesCardMenuAction) => {
    if (action === "downloadInvoice") {
      openDocument(card, "invoice");
      return;
    }
    if (action === "downloadReceipt") {
      openDocument(card, "receipt");
      return;
    }
    if (action === "addNote") {
      setNoteCard(card);
      return;
    }
    if (action === "void") {
      if (card.kind === "addon") {
        updateSalesAddon(card.id.replace(/^addon-/, ""), { voided: true });
      } else {
        upsertSalesCardMeta({
          bookingId: card.bookingId,
          cardKind: card.kind,
          cardId: card.id,
          note: card.note,
          voided: true,
          refunded: card.refunded,
        });
      }
      bump();
      showSnackbar({ severity: "success", message: "Sale voided." });
      return;
    }
    if (action === "refund") {
      if (card.kind === "addon") {
        updateSalesAddon(card.id.replace(/^addon-/, ""), { refunded: true });
      } else {
        upsertSalesCardMeta({
          bookingId: card.bookingId,
          cardKind: card.kind,
          cardId: card.id,
          note: card.note,
          voided: card.voided,
          refunded: true,
        });
      }
      bump();
      showSnackbar({ severity: "success", message: "Sale marked as refunded." });
    }
  };

  const handleSaveAddon = (payload: SalesAddOnCheckoutPayload) => {
    if (!checkoutContext) return;
    saveSalesAddon({
      id: `addon-${Date.now()}`,
      bookingId: checkoutContext.bookingId,
      bookingCode: checkoutContext.bookingCode,
      clientName: checkoutContext.clientName,
      clientEmail: checkoutContext.clientEmail,
      lines: payload.lines,
      discount: payload.discount,
      discountAmount: payload.discountAmount,
      totalPrice: payload.totalPrice,
      paymentMethod: payload.paymentMethod,
      createdAt: new Date().toISOString(),
    });
    setCheckoutBookingId(null);
    setCheckoutBookingCode("");
    bump();
    showSnackbar({ severity: "success", message: "Add-ons saved to this sale." });
  };

  if (checkoutContext) {
    return (
      <SalesAddOnCheckout
        clientName={checkoutContext.clientName}
        clientEmail={checkoutContext.clientEmail}
        onCancel={() => {
          setCheckoutBookingId(null);
          setCheckoutBookingCode("");
        }}
        onSave={handleSaveAddon}
      />
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 15, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.5 }}>
        Sales Overview
      </Typography>

      {cards.length === 0 ? (
        <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.6) }}>
          No sales for this client yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {cards.map((card) => (
            <SalesOverviewCard
              key={card.id}
              card={card}
              onViewInvoice={() => openDocument(card, "invoice")}
              onViewReceipt={() => openDocument(card, "receipt")}
              onAddOns={() => {
                setCheckoutBookingId(card.bookingId);
                setCheckoutBookingCode(card.bookingCode);
              }}
              onMenuAction={(action) => handleMenuAction(card, action)}
            />
          ))}
        </Stack>
      )}

      <FinanceDocumentPreviewDrawer
        open={docOpen}
        onClose={() => setDocOpen(false)}
        documentType={docType}
        invoiceType={financeSettings.defaultInvoiceType}
        settings={financeSettings}
        row={docRow}
      />

      <TransactionNoteModal
        open={Boolean(noteCard)}
        initialNote={noteCard?.note ?? ""}
        onClose={() => setNoteCard(null)}
        onSave={(note) => {
          if (!noteCard) return;
          if (noteCard.kind === "addon") {
            updateSalesAddon(noteCard.id.replace(/^addon-/, ""), { note });
          } else {
            upsertSalesCardMeta({
              bookingId: noteCard.bookingId,
              cardKind: noteCard.kind,
              cardId: noteCard.id,
              note,
              voided: noteCard.voided,
              refunded: noteCard.refunded,
            });
          }
          bump();
          showSnackbar({ severity: "success", message: "Note saved." });
        }}
        onDelete={
          noteCard?.note
            ? () => {
                if (!noteCard) return;
                if (noteCard.kind === "addon") {
                  updateSalesAddon(noteCard.id.replace(/^addon-/, ""), { note: "" });
                } else {
                  upsertSalesCardMeta({
                    bookingId: noteCard.bookingId,
                    cardKind: noteCard.kind,
                    cardId: noteCard.id,
                    note: "",
                    voided: noteCard.voided,
                    refunded: noteCard.refunded,
                  });
                }
                bump();
                showSnackbar({ severity: "success", message: "Note deleted." });
              }
            : undefined
        }
      />
    </Box>
  );
}
