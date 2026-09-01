"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarBooking } from "../../../store/services/businessApi";
import {
  useGetProfessionalClientsQuery,
  useUpdateBookingStatusMutation,
} from "../../../store/services/businessApi";
import { useReissueFinanceInvoiceMutation } from "../../../store/services/financeApi";
import {
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "./bookingEventDetails";
import { buildSplitBillNotesPatch, resolveSalesPayerShares } from "./salesSplitBill";
import type { CalendarBookingDetails, CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useSnackbar } from "../AppSnackbar";
import {
  FinanceDocumentPreviewDrawer,
  buildClientBookingTransactionRow,
  useProfessionalBusinessOverride,
} from "../finance-documents";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
} from "../client-booking/checkoutPaymentOptions";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import TransactionNoteModal from "../../sections/finance/TransactionNoteModal";
import type { ClientBookingDraft } from "../client-booking/types";
import { buildSalesOverviewCards } from "./buildSalesOverviewCards";
import SalesAddOnCheckout from "./SalesAddOnCheckout";
import SalesCancelModal from "./SalesCancelModal";
import SalesEditCheckout from "./SalesEditCheckout";
import SalesOverdueReissueModal from "./SalesOverdueReissueModal";
import SalesOverviewCard, {
  type SalesCardMenuAction,
} from "./SalesOverviewCard";
import {
  downloadSalesInvoiceExcel,
  downloadSalesInvoicePdf,
} from "./salesInvoiceDownload";
import {
  saveSalesAddon,
  updateSalesAddon,
  upsertSalesCardMeta,
} from "./salesOverview.storage";
import type {
  SalesAddOnCheckoutPayload,
  SalesClientKind,
  SalesEditCheckoutPayload,
  SalesOverviewCardData,
  SalesSubCardData,
} from "./salesOverview.types";

type SalesOverviewProps = {
  bookings: CalendarBooking[];
  currentEvent?: CalendarEvent | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fallbackResourceId?: string;
  onBookingCancelled?: () => void;
  onBookingCompleted?: (bookingId: string) => void;
};

function timeFromOccurredAt(iso: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match?.[1] ?? "";
  }
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cardToDraft(card: SalesOverviewCardData): ClientBookingDraft {
  const sourceLines = card.highlightedLineIds?.length
    ? card.lines.filter(
        (line) =>
          card.highlightedLineIds!.includes(line.id) && line.amount >= 0,
      )
    : card.lines.filter((line) => line.amount >= 0);

  return {
    selectedDateISO: card.occurredAt.slice(0, 10),
    selectedTime: timeFromOccurredAt(card.occurredAt),
    combineServices: false,
    services: (sourceLines.length
      ? sourceLines
      : card.lines.filter((line) => line.amount >= 0)
    ).map((line) => ({
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
  onBookingCancelled,
  onBookingCompleted,
}: SalesOverviewProps) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { settings: financeSettings } = useFinanceInvoiceSettings();
  const professionalBusinessOverride = useProfessionalBusinessOverride();
  const { data: clientsResponse } = useGetProfessionalClientsQuery();
  const [updateBookingStatus, { isLoading: cancelling }] =
    useUpdateBookingStatusMutation();
  const [reissueFinanceInvoice] = useReissueFinanceInvoiceMutation();

  const [revision, setRevision] = React.useState(0);
  const [checkoutBookingId, setCheckoutBookingId] = React.useState<
    string | null
  >(null);
  const [checkoutBookingCode, setCheckoutBookingCode] = React.useState("");
  const [checkoutCardId, setCheckoutCardId] = React.useState<string | null>(
    null,
  );
  const [editingCard, setEditingCard] =
    React.useState<SalesOverviewCardData | null>(null);
  const [docOpen, setDocOpen] = React.useState(false);
  const [docType, setDocType] = React.useState<"invoice" | "receipt">(
    "invoice",
  );
  const [docRow, setDocRow] = React.useState<TransactionRow | null>(null);
  const [noteCard, setNoteCard] = React.useState<SalesOverviewCardData | null>(
    null,
  );
  const [cancelCard, setCancelCard] =
    React.useState<SalesOverviewCardData | null>(null);
  const [overdueCard, setOverdueCard] =
    React.useState<SalesOverviewCardData | null>(null);

  const clientKind = React.useMemo<SalesClientKind | undefined>(() => {
    const email = (clientEmail || currentEvent?.details?.clientEmail || "")
      .trim()
      .toLowerCase();
    if (!email) return undefined;
    const match = (clientsResponse?.data ?? []).find(
      (row) =>
        String(row.email || "")
          .trim()
          .toLowerCase() === email,
    );
    return match?.client_kind;
  }, [clientEmail, clientsResponse?.data, currentEvent?.details?.clientEmail]);

  const cards = React.useMemo(
    () =>
      buildSalesOverviewCards({
        bookings,
        currentEvent,
        clientName,
        clientEmail,
        clientPhone,
        clientKind,
        fallbackResourceId,
      }),
    // revision forces rebuild after localStorage mutations
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      bookings,
      currentEvent,
      clientName,
      clientEmail,
      clientPhone,
      clientKind,
      fallbackResourceId,
      revision,
    ],
  );

  const subToCard = React.useCallback(
    (
      sub: SalesSubCardData,
      parent: SalesOverviewCardData,
    ): SalesOverviewCardData => ({
      id: sub.id,
      bookingId: sub.bookingId || parent.bookingId,
      bookingCode: sub.bookingCode || parent.bookingCode,
      kind: "after_treatment",
      title: "After treatment Summary",
      clientName: sub.payerName,
      payerLabel: sub.payerLabel,
      payerRole: sub.payerRole,
      payerKey: sub.id,
      lines: sub.lines,
      highlightedLineIds: sub.lines.map((line) => line.id),
      total: sub.total,
      totalLabel: "Total Amount",
      highlightLabel: "Payment",
      highlightAmount: sub.highlightAmount,
      methodDateLine: sub.methodDateLine,
      dueDate: sub.dueDate,
      showAddOns: sub.showAddOns,
      paymentState: sub.paymentState,
      statusBadge: sub.statusBadge,
      documentAmount: sub.highlightAmount,
      occurredAt: parent.occurredAt,
      paymentMethodLabel: parent.paymentMethodLabel,
      paymentMethod: parent.paymentMethod,
    }),
    [],
  );

  const checkoutContext = React.useMemo(() => {
    if (!checkoutBookingId) return null;

    let match: SalesOverviewCardData | null =
      (checkoutCardId
        ? cards.find((card) => card.id === checkoutCardId)
        : null) ?? null;

    if (!match && checkoutCardId) {
      for (const card of cards) {
        const sub = card.subCards?.find((row) => row.id === checkoutCardId);
        if (sub) {
          match = subToCard(sub, card);
          break;
        }
      }
    }

    if (!match) {
      match =
        cards.find(
          (card) =>
            card.bookingId === checkoutBookingId &&
            card.kind === "after_treatment",
        ) ??
        cards.find((card) => card.bookingId === checkoutBookingId) ??
        null;
    }

    const displayName =
      match?.payerLabel && match.payerRole !== "main_client"
        ? `${match.payerLabel} · ${match.clientName}`
        : match?.clientName || clientName || "Client";
    return {
      bookingId: checkoutBookingId,
      bookingCode:
        checkoutBookingCode || match?.bookingCode || checkoutBookingId,
      clientName: displayName,
      clientEmail: match?.clientEmail || clientEmail,
    };
  }, [
    cards,
    checkoutBookingCode,
    checkoutBookingId,
    checkoutCardId,
    clientEmail,
    clientName,
    subToCard,
  ]);

  const openDocument = React.useCallback(
    (card: SalesOverviewCardData, type: "invoice" | "receipt") => {
      const draft = cardToDraft(card);
      if (!draft.services.length) {
        showSnackbar({
          severity: "warning",
          message: "No line items available for this document.",
        });
        return;
      }
      const matchedClient = (clientsResponse?.data ?? []).find(
        (row) =>
          String(row.email || "")
            .trim()
            .toLowerCase() === String(card.clientEmail || "").trim().toLowerCase(),
      );
      const methodKey = card.paymentMethod || card.paymentMethodLabel;
      const isPrepayCard = card.kind === "prepayment";
      const row = buildClientBookingTransactionRow({
        bookingRef: `${card.bookingCode}-${card.kind}${card.payerKey ? `-${card.payerKey}` : ""}`,
        draft,
        requesterName:
          card.payerLabel && card.payerRole !== "main_client"
            ? `${card.payerLabel} · ${card.clientName}`
            : card.clientName,
        requesterEmail: card.clientEmail,
        financeSettings,
        documentAmount: card.documentAmount,
        prepaymentAmount: isPrepayCard ? card.documentAmount : undefined,
        asPrepaymentReceipt: type === "receipt" && isPrepayCard,
        methodTitle: checkoutPaymentMethodTitle(methodKey),
        methodDetail: checkoutPaymentMethodDetail(methodKey),
        clientParty: {
          legalName: matchedClient?.legal_name || card.clientName,
          email: card.clientEmail,
          address: matchedClient?.business_address || undefined,
          vatNumber: matchedClient?.vat || undefined,
          cocNumber: matchedClient?.coc || undefined,
        },
      });
      setDocRow(row);
      setDocType(type);
      setDocOpen(true);
    },
    [clientsResponse?.data, financeSettings, showSnackbar],
  );

  const bump = () => setRevision((n) => n + 1);

  const handleDownload = React.useCallback(
    async (card: SalesOverviewCardData, format: "pdf" | "excel") => {
      try {
        if (format === "pdf") await downloadSalesInvoicePdf(card);
        else await downloadSalesInvoiceExcel(card);
        showSnackbar({
          severity: "success",
          message: `Invoice downloaded as ${format.toUpperCase()}.`,
        });
      } catch {
        showSnackbar({ severity: "error", message: "Download failed." });
      }
    },
    [showSnackbar],
  );

  const handleMenuAction = async (
    card: SalesOverviewCardData,
    action: SalesCardMenuAction,
  ) => {
    if (action === "editSales") {
      setEditingCard(card);
      return;
    }
    if (action === "cancelSales") {
      setCancelCard(card);
      return;
    }
    if (action === "downloadInvoicePdf") {
      await handleDownload(card, "pdf");
      return;
    }
    if (action === "downloadInvoiceExcel") {
      await handleDownload(card, "excel");
      return;
    }
    if (action === "addNote") {
      setNoteCard(card);
      return;
    }
    if (action === "reissueOverdue") {
      setOverdueCard(card);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelCard) return;
    try {
      await updateBookingStatus({
        id: cancelCard.bookingId,
        status: "cancelled",
      }).unwrap();
      upsertSalesCardMeta({
        bookingId: cancelCard.bookingId,
        cardKind: cancelCard.kind,
        cardId: cancelCard.id,
        note: cancelCard.note,
        canceled: true,
        voided: true,
      });
      setCancelCard(null);
      bump();
      onBookingCancelled?.();
      showSnackbar({
        severity: "success",
        message: "Sale canceled. Booking marked cancelled.",
      });
    } catch {
      showSnackbar({ severity: "error", message: "Failed to cancel booking." });
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
    setCheckoutCardId(null);
    bump();
    showSnackbar({
      severity: "success",
      message: "Add-ons saved to this sale.",
    });
  };

  const notifyClientInvoiceReissue = async (input: {
    bookingId: string;
    bookingCode?: string;
    dueDate: string;
    penaltyAmount?: number;
    totalPrice?: number;
    clientEmail?: string;
    clientName?: string;
    paymentMethod?: string;
  }) => {
    try {
      const result = await reissueFinanceInvoice({
        bookingId: input.bookingId,
        bookingRef: input.bookingCode,
        dueDate: input.dueDate,
        penaltyAmount: input.penaltyAmount,
        totalPrice: input.totalPrice,
        clientEmail: input.clientEmail || clientEmail || undefined,
        clientName: input.clientName || clientName || undefined,
        paymentMethod: input.paymentMethod,
      }).unwrap();

      if (result.data?.emailSent) {
        showSnackbar({
          severity: "success",
          message: `Client notified${result.data.emailTo ? ` at ${result.data.emailTo}` : ""} (app + email).`,
        });
      } else if (result.data?.notificationSent) {
        showSnackbar({
          severity: "success",
          message: "Client notified in app. Email could not be sent.",
        });
      }
    } catch {
      showSnackbar({
        severity: "warning",
        message: "Sale saved, but client notification failed.",
      });
    }
  };

  const handleSaveEdit = async (payload: SalesEditCheckoutPayload) => {
    if (!editingCard) return;
    const isReissue =
      payload.paymentMethod === "onlineNonDirect" ||
      payload.paymentMethod === "offlineNonDirect";

    upsertSalesCardMeta({
      bookingId: editingCard.bookingId,
      cardKind: isReissue ? "reissued_invoice" : editingCard.kind,
      cardId: editingCard.id,
      note: editingCard.note,
      paymentMethod: payload.paymentMethod,
      dueDate: payload.dueDate ?? null,
      editedLines: payload.lines,
      discount: payload.discount,
      discountAmount: payload.discountAmount,
      totalPrice: payload.totalPrice,
      ...(isReissue && payload.dueDate
        ? { reissuedAt: new Date().toISOString() }
        : {}),
    });
    setEditingCard(null);
    bump();
    showSnackbar({ severity: "success", message: "Sale updated." });

    if (payload.dueDate) {
      const shares = currentEvent
        ? resolveSalesPayerShares({
            event: currentEvent,
            allLines: payload.lines.map((line) => ({
              id: line.id,
              label: line.name,
              amount: line.quantity * line.unitPrice,
            })),
            mainClientName: editingCard.clientName,
            mainClientEmail: editingCard.clientEmail,
            mainClientPhone: editingCard.clientPhone,
          })
        : [];
      const nextDetails = {
        ...(currentEvent?.details ?? {}),
        waitingForPayment: true,
        invoiceDueDate: payload.dueDate,
      } as CalendarBookingDetails;
      if (shares.length > 1) {
        Object.assign(
          nextDetails,
          buildSplitBillNotesPatch(
            currentEvent?.details,
            shares.map((share) => ({
              ...share,
              paymentAmount: share.subtotal,
            })),
            0,
          ),
        );
      }
      const nextNotes = currentEvent
        ? serializeCalendarEntryNotes(
            nextDetails.internalNote ?? "",
            nextDetails,
            parseStoredEbrFromNotes(currentEvent.notes),
            parseStoredErFromNotes(currentEvent.notes),
          )
        : undefined;
      try {
        await updateBookingStatus({
          id: editingCard.bookingId,
          status: "completed",
          ...(nextNotes != null ? { notes: nextNotes } : {}),
        }).unwrap();
        onBookingCompleted?.(editingCard.bookingId);
      } catch {
        showSnackbar({
          severity: "warning",
          message: "Invoice saved, but the booking could not be marked Completed.",
        });
      }
    }

    if (isReissue && payload.dueDate) {
      await notifyClientInvoiceReissue({
        bookingId: editingCard.bookingId,
        bookingCode: editingCard.bookingCode,
        dueDate: payload.dueDate,
        totalPrice: payload.totalPrice,
        clientEmail: editingCard.clientEmail,
        clientName: editingCard.clientName,
        paymentMethod: payload.paymentMethod,
      });
    }
  };

  const handleReissue = async (payload: {
    penaltyType: "fixed" | "percentage";
    penaltyValue: number;
    penaltyAmount: number;
    dueDate: string;
  }) => {
    if (!overdueCard) return;
    const card = overdueCard;
    upsertSalesCardMeta({
      bookingId: card.bookingId,
      cardKind: "reissued_invoice",
      cardId: card.id,
      note: card.note,
      paymentMethod: card.paymentMethod || "onlineNonDirect",
      dueDate: payload.dueDate,
      penaltyAmount: payload.penaltyAmount,
      penaltyType: payload.penaltyType,
      reissuedAt: new Date().toISOString(),
      totalPrice: card.total + payload.penaltyAmount,
    });
    setOverdueCard(null);
    bump();
    showSnackbar({
      severity: "success",
      message: "Invoice reissued with new due date.",
    });

    await notifyClientInvoiceReissue({
      bookingId: card.bookingId,
      bookingCode: card.bookingCode,
      dueDate: payload.dueDate,
      penaltyAmount: payload.penaltyAmount,
      totalPrice: card.total + payload.penaltyAmount,
      clientEmail: card.clientEmail,
      clientName: card.clientName,
      paymentMethod: card.paymentMethod || "onlineNonDirect",
    });
  };

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
        onCancel={() => {
          setCheckoutBookingId(null);
          setCheckoutBookingCode("");
          setCheckoutCardId(null);
        }}
        onSave={handleSaveAddon}
      />
    );
  }

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: 900,
          color: alpha(m.navy, 0.88),
          mb: 1.5,
        }}
      >
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
                setCheckoutCardId(card.id);
              }}
              onMenuAction={(action) => void handleMenuAction(card, action)}
              onOverdueAction={
                card.paymentState === "overdue"
                  ? () => setOverdueCard(card)
                  : undefined
              }
              onSubViewInvoice={(sub) =>
                openDocument(subToCard(sub, card), "invoice")
              }
              onSubViewReceipt={(sub) =>
                openDocument(subToCard(sub, card), "receipt")
              }
              onSubAddOns={(sub) => {
                setCheckoutBookingId(sub.bookingId || card.bookingId);
                setCheckoutBookingCode(sub.bookingCode || card.bookingCode);
                setCheckoutCardId(sub.id);
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
              canceled: noteCard.canceled,
              paymentMethod: noteCard.paymentMethod,
              dueDate: noteCard.dueDate,
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
                  updateSalesAddon(noteCard.id.replace(/^addon-/, ""), {
                    note: "",
                  });
                } else {
                  upsertSalesCardMeta({
                    bookingId: noteCard.bookingId,
                    cardKind: noteCard.kind,
                    cardId: noteCard.id,
                    note: "",
                    voided: noteCard.voided,
                    refunded: noteCard.refunded,
                    canceled: noteCard.canceled,
                    paymentMethod: noteCard.paymentMethod,
                    dueDate: noteCard.dueDate,
                  });
                }
                bump();
                showSnackbar({ severity: "success", message: "Note deleted." });
              }
            : undefined
        }
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
