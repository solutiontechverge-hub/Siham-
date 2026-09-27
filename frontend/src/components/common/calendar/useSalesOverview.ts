"use client";

import * as React from "react";
import type { CalendarBooking } from "../../../store/services/businessApi";
import {
  useGetProfessionalClientsQuery,
  useUpdateBookingStatusMutation,
} from "../../../store/services/businessApi";
import {
  useReissueFinanceInvoiceMutation,
  useLazyGetFinanceTransactionsQuery,
  useGetFinanceTransactionsQuery,
  useBulkFinanceTransactionActionMutation,
  useCreateFinanceTransactionMutation,
  useProcessFinanceInvoiceReissuesMutation,
} from "../../../store/services/financeApi";
import {
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
  parseCalendarEntryNotes,
} from "./bookingEventDetails";
import { buildSplitBillNotesPatch, resolveSalesPayerShares } from "./salesSplitBill";
import type { CalendarBookingDetails, CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useSnackbar } from "../AppSnackbar";
import {
  buildClientBookingTransactionRow,
  useProfessionalBusinessOverride,
} from "../finance-documents";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
} from "../client-booking/checkoutPaymentOptions";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import { buildSalesOverviewCards } from "./buildSalesOverviewCards";
import type { SalesCardMenuAction } from "./SalesOverviewCard";
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
import { SALES_OVERVIEW_COPY } from "./salesOverview.data";
import {
  allowedBookingStatus,
  cardToDraft,
  toFinanceHints,
} from "./useSalesOverview.helpers";

export type SalesDocumentType = "invoice" | "receipt";

export type SalesOverviewArgs = {
  bookings: CalendarBooking[];
  currentEvent?: CalendarEvent | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  fallbackResourceId?: string;
  focusCardId?: string | null;
  onBookingCancelled?: () => void;
  onBookingCompleted?: (bookingId: string) => void;
};

export function useSalesOverview({
  bookings,
  currentEvent = null,
  clientName = "",
  clientEmail = "",
  clientPhone = "",
  fallbackResourceId = "unassigned",
  focusCardId = null,
  onBookingCompleted,
}: SalesOverviewArgs) {
  const { showSnackbar } = useSnackbar();
  const { settings: financeSettings } = useFinanceInvoiceSettings();
  const professionalBusinessOverride = useProfessionalBusinessOverride();
  const { data: clientsResponse } = useGetProfessionalClientsQuery();
  const [updateBookingStatus, { isLoading: cancelling }] =
    useUpdateBookingStatusMutation();
  const [reissueFinanceInvoice] = useReissueFinanceInvoiceMutation();
  const [fetchFinanceTransactions] = useLazyGetFinanceTransactionsQuery();
  const [bulkFinanceAction] = useBulkFinanceTransactionActionMutation();
  const [createFinanceTransaction] = useCreateFinanceTransactionMutation();
  const [processFinanceInvoiceReissues] = useProcessFinanceInvoiceReissuesMutation();

  const financeQuery = currentEvent?.bookingCode || bookings[0]?.unique_code || bookings[0]?.id || "";
  const { data: financeResponse } = useGetFinanceTransactionsQuery(
    { q: String(financeQuery), limit: 50 },
    { skip: !financeQuery },
  );
  const financeHints = React.useMemo(
    () => toFinanceHints(financeResponse?.data?.rows ?? []),
    [financeResponse?.data?.rows],
  );

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
  const [docType, setDocType] = React.useState<SalesDocumentType>("invoice");
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
        financeHints,
        paymentTerms: financeSettings.paymentTerms,
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
      financeHints,
      financeSettings.paymentTerms,
      revision,
    ],
  );

  React.useEffect(() => {
    if (!focusCardId) return;
    const node = document.querySelector(
      `[data-sales-card-id="${CSS.escape(focusCardId)}"]`,
    );
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusCardId, cards]);

  const subToCard = React.useCallback(
    (
      sub: SalesSubCardData,
      parent: SalesOverviewCardData,
    ): SalesOverviewCardData => ({
      id: sub.id,
      bookingId: sub.bookingId || parent.bookingId,
      bookingCode: sub.bookingCode || parent.bookingCode,
      kind: "after_treatment",
      title: SALES_OVERVIEW_COPY.afterTreatmentSummary,
      clientName: sub.payerName,
      payerLabel: sub.payerLabel,
      payerRole: sub.payerRole,
      payerKey: sub.id,
      lines: sub.lines,
      highlightedLineIds: sub.lines.map((line) => line.id),
      total: sub.total,
      totalLabel: SALES_OVERVIEW_COPY.totalAmount,
      highlightLabel: SALES_OVERVIEW_COPY.payment,
      highlightAmount: sub.highlightAmount,
      methodDateLine: sub.methodDateLine,
      dueDate: sub.dueDate,
      showAddOns: sub.showAddOns,
      paymentState: sub.paymentState,
      statusBadge: sub.statusBadge,
      markedUnpaid: sub.markedUnpaid,
      paidAt: sub.paidAt,
      penaltyPrompt: sub.penaltyPrompt,
      overdueKind: sub.overdueKind,
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
        : match?.clientName || clientName || SALES_OVERVIEW_COPY.fallbackClient;
    return {
      bookingId: checkoutBookingId,
      bookingCode:
        checkoutBookingCode || match?.bookingCode || checkoutBookingId,
      clientName: displayName,
      clientEmail: match?.clientEmail || clientEmail,
      priorLines: match?.lines ?? [],
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
    (card: SalesOverviewCardData, type: SalesDocumentType) => {
      const draft = cardToDraft(card);
      if (!draft.services.length) {
        showSnackbar({
          severity: "warning",
          message: SALES_OVERVIEW_COPY.noLineItems,
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

  const overdueManualCard = React.useMemo(
    () => cards.find((card) => card.penaltyPrompt === "manual") ?? null,
    [cards],
  );
  const needsAutomaticReissue = cards.some((card) => card.penaltyPrompt === "automatic");
  const autoReissueKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!needsAutomaticReissue) return;
    const key = cards
      .filter((card) => card.penaltyPrompt === "automatic")
      .map((card) => card.id)
      .join("|");
    if (!key || autoReissueKeyRef.current === key) return;
    autoReissueKeyRef.current = key;
    void processFinanceInvoiceReissues()
      .unwrap()
      .then((result) => {
        const created = result.data?.created ?? 0;
        if (created > 0) bump();
      })
      .catch(() => {
        autoReissueKeyRef.current = "";
      });
  }, [cards, needsAutomaticReissue, processFinanceInvoiceReissues]);

  const handleDownload = React.useCallback(
    async (card: SalesOverviewCardData, format: "pdf" | "excel") => {
      try {
        if (format === "pdf") await downloadSalesInvoicePdf(card);
        else await downloadSalesInvoiceExcel(card);
        showSnackbar({
          severity: "success",
          message: SALES_OVERVIEW_COPY.downloadSuccess(format),
        });
      } catch {
        showSnackbar({
          severity: "error",
          message: SALES_OVERVIEW_COPY.downloadFailed,
        });
      }
    },
    [showSnackbar],
  );

  const handleRefundSales = async (card: SalesOverviewCardData) => {
    if (card.refunded || card.voided || card.canceled) return;

    try {
      const bookingRef = card.bookingCode || card.bookingId;
      const financeResult = await fetchFinanceTransactions({
        q: bookingRef,
        limit: 50,
      }).unwrap();
      const rows = financeResult.data?.rows ?? [];
      const refundable = rows.filter((row) => {
        if (row.status !== "Paid" && row.status !== "Prepaid") return false;
        const matchesBooking =
          row.bookingId === card.bookingCode ||
          row.bookingId === card.bookingId ||
          row.entryId === card.bookingCode;
        if (!matchesBooking) return false;
        const phase = (row.document as { paymentPhase?: string; addonId?: string } | undefined)
          ?.paymentPhase;
        const addonId = (row.document as { addonId?: string } | undefined)?.addonId;
        if (card.kind === "addon") {
          const cardAddonId = card.id.replace(/^addon-/, "");
          return phase === "addon" && (!addonId || addonId === cardAddonId || card.id.includes(addonId));
        }
        if (card.kind === "prepayment") return phase === "prepay" || !phase;
        if (card.kind === "after_treatment") return phase === "full" || !phase;
        return true;
      });

      if (refundable.length) {
        await bulkFinanceAction({
          ids: refundable.map((row) => row.id),
          action: "refund",
        }).unwrap();
      }

      if (card.kind === "addon") {
        updateSalesAddon(card.id.replace(/^addon-/, ""), { refunded: true });
      } else {
        upsertSalesCardMeta({
          bookingId: card.bookingId,
          cardKind: card.kind,
          cardId: card.id,
          note: card.note,
          refunded: true,
          voided: card.voided,
          canceled: card.canceled,
          paymentMethod: card.paymentMethod,
          dueDate: card.dueDate,
        });
      }

      // Keep calendar refund indicators in sync for primary booking sales.
      if (card.kind === "prepayment" || card.kind === "after_treatment") {
        const booking = bookings.find(
          (b) =>
            String(b.id) === String(card.bookingId) ||
            b.unique_code === card.bookingCode,
        );
        if (booking) {
          const parsed = parseCalendarEntryNotes(booking.notes);
          const nextDetails = {
            ...(parsed ?? {}),
            refunded: true,
            waitingForPayment: false,
          };
          const nextNotes = serializeCalendarEntryNotes(
            nextDetails.internalNote ?? "",
            nextDetails,
            parseStoredEbrFromNotes(booking.notes),
            parseStoredErFromNotes(booking.notes),
          );
          await updateBookingStatus({
            id: String(booking.id),
            status: (() => {
              const normalized = String(booking.status || "")
                .toLowerCase()
                .replace(/\s+/g, "_");
              const allowed = [
                "requested",
                "cancelled",
                "completed",
                "confirmed",
                "in_progress",
                "no_show",
                "invalid",
              ] as const;
              return (
                allowed.find((value) => value === normalized) ?? "confirmed"
              );
            })(),
            notes: nextNotes,
          }).unwrap();
        }
      }

      bump();
      showSnackbar({
        severity: "success",
        message: SALES_OVERVIEW_COPY.refunded,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: SALES_OVERVIEW_COPY.refundFailed,
      });
    }
  };

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
    if (action === "refundSales") {
      await handleRefundSales(card);
      return;
    }
    if (action === "markUnpaid") {
      upsertSalesCardMeta({
        bookingId: card.bookingId,
        cardKind: card.kind,
        cardId: card.id,
        note: card.note,
        markedUnpaid: true,
        paymentMethod: card.paymentMethod,
        dueDate: card.dueDate,
        voided: card.voided,
        refunded: card.refunded,
        canceled: card.canceled,
      });
      bump();
      showSnackbar({
        severity: "success",
        message: SALES_OVERVIEW_COPY.markedUnpaid,
      });
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
      const bookingRef = cancelCard.bookingCode || cancelCard.bookingId;
      const financeResult = await fetchFinanceTransactions({
        q: bookingRef,
        limit: 50,
      }).unwrap();
      const rows = financeResult.data?.rows ?? [];
      const cancelable = rows.filter((row) => {
        const matchesBooking =
          row.bookingId === cancelCard.bookingCode ||
          row.bookingId === cancelCard.bookingId ||
          row.entryId === cancelCard.bookingCode;
        if (!matchesBooking) return false;
        const open =
          row.status === "Pending" ||
          row.status === "Payment due" ||
          row.status === "Overdue" ||
          row.status === "Failed" ||
          row.status === "Prepayment due";
        if (!open) return false;
        const phase = (row.document as { paymentPhase?: string; addonId?: string } | undefined)
          ?.paymentPhase;
        if (cancelCard.kind === "addon") {
          const cardAddonId = cancelCard.id.replace(/^addon-/, "");
          const addonId = (row.document as { addonId?: string } | undefined)?.addonId;
          return phase === "addon" && (!addonId || addonId === cardAddonId || cancelCard.id.includes(addonId));
        }
        if (cancelCard.kind === "prepayment") return phase === "prepay" || !phase;
        return phase === "full" || !phase;
      });

      if (cancelable.length) {
        await bulkFinanceAction({
          ids: cancelable.map((row) => row.id),
          action: "cancel",
        }).unwrap();
      }

      const booking = bookings.find(
        (b) =>
          String(b.id) === String(cancelCard.bookingId) ||
          b.unique_code === cancelCard.bookingCode,
      );
      if (booking) {
        const parsed = parseCalendarEntryNotes(booking.notes);
        const nextDetails = {
          ...(parsed ?? {}),
          waitingForPayment: false,
        };
        const nextNotes = serializeCalendarEntryNotes(
          nextDetails.internalNote ?? "",
          nextDetails,
          parseStoredEbrFromNotes(booking.notes),
          parseStoredErFromNotes(booking.notes),
        );
        await updateBookingStatus({
          id: String(booking.id),
          status: allowedBookingStatus(booking.status),
          notes: nextNotes,
        }).unwrap();
      }

      if (cancelCard.kind === "addon") {
        updateSalesAddon(cancelCard.id.replace(/^addon-/, ""), { voided: true });
      }

      const seqMatch = cancelCard.id.match(/-v(\d+)$/);
      upsertSalesCardMeta({
        bookingId: cancelCard.bookingId,
        cardKind: cancelCard.kind,
        cardId: cancelCard.id,
        note: cancelCard.note,
        canceled: true,
        invoiceSeq: seqMatch ? Number(seqMatch[1]) : 0,
        paymentMethod: cancelCard.paymentMethod,
        dueDate: cancelCard.dueDate,
      });
      setCancelCard(null);
      bump();
      showSnackbar({
        severity: "success",
        message: SALES_OVERVIEW_COPY.canceled,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: SALES_OVERVIEW_COPY.cancelFailed,
      });
    }
  };

  const clearCheckout = () => {
    setCheckoutBookingId(null);
    setCheckoutBookingCode("");
    setCheckoutCardId(null);
  };

  const openAddOns = (bookingId: string, bookingCode: string, cardId: string) => {
    setCheckoutBookingId(bookingId);
    setCheckoutBookingCode(bookingCode);
    setCheckoutCardId(cardId);
  };

  const handleSaveAddon = async (payload: SalesAddOnCheckoutPayload) => {
    if (!checkoutContext) return;
    const addonId = `addon-${Date.now()}`;
    try {
      await createFinanceTransaction({
        clientName: checkoutContext.clientName || clientName || SALES_OVERVIEW_COPY.fallbackClient,
        clientEmail: payload.clientEmail || checkoutContext.clientEmail || clientEmail || "",
        clientType: clientKind === "company" ? "company" : "individual",
        paymentMethod: payload.paymentMethod,
        totalPrice: payload.totalPrice,
        discountAmount: payload.discountAmount,
        lines: payload.lines.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        bookingId: checkoutContext.bookingId,
        bookingRef: checkoutContext.bookingCode,
        paymentPhase: "addon",
        addonId,
        entryLabel: "Add-ons",
      }).unwrap();

      saveSalesAddon({
        id: addonId,
        bookingId: checkoutContext.bookingId,
        bookingCode: checkoutContext.bookingCode,
        clientName: checkoutContext.clientName,
        clientEmail: payload.clientEmail || checkoutContext.clientEmail,
        lines: payload.lines,
        discount: payload.discount,
        discountAmount: payload.discountAmount,
        totalPrice: payload.totalPrice,
        paymentMethod: payload.paymentMethod,
        createdAt: new Date().toISOString(),
      });
      clearCheckout();
      bump();
      showSnackbar({
        severity: "success",
        message: SALES_OVERVIEW_COPY.addonCreated,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: SALES_OVERVIEW_COPY.addonFailed,
      });
    }
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
          message: SALES_OVERVIEW_COPY.clientNotifiedAt(result.data.emailTo ?? ""),
        });
      } else if (result.data?.notificationSent) {
        showSnackbar({
          severity: "success",
          message: SALES_OVERVIEW_COPY.clientNotifiedEmailFailed,
        });
      }
    } catch {
      showSnackbar({
        severity: "warning",
        message: SALES_OVERVIEW_COPY.clientNotifyFailed,
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
      markedUnpaid: false,
      ...(isReissue && payload.dueDate
        ? { reissuedAt: new Date().toISOString() }
        : {}),
    });
    setEditingCard(null);
    bump();
    showSnackbar({
      severity: "success",
      message: SALES_OVERVIEW_COPY.saleUpdated,
    });

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
            mainClientEmail:
              payload.clientEmail || editingCard.clientEmail,
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
        // Invoice / payment pending stays In Progress; Completed only after settlement.
        await updateBookingStatus({
          id: editingCard.bookingId,
          status: "in_progress",
          ...(nextNotes != null ? { notes: nextNotes } : {}),
        }).unwrap();
        onBookingCompleted?.(editingCard.bookingId);
      } catch {
        showSnackbar({
          severity: "warning",
          message: SALES_OVERVIEW_COPY.bookingCompleteFailed,
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
      message: SALES_OVERVIEW_COPY.invoiceReissued,
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

  const handleSaveNote = (note: string) => {
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
    showSnackbar({
      severity: "success",
      message: SALES_OVERVIEW_COPY.noteSaved,
    });
  };

  const handleDeleteNote = () => {
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
    showSnackbar({
      severity: "success",
      message: SALES_OVERVIEW_COPY.noteDeleted,
    });
  };

  return {
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
    focusCardId,
    handleConfirmCancel,
    handleDeleteNote,
    handleMenuAction,
    handleReissue,
    handleSaveAddon,
    handleSaveEdit,
    handleSaveNote,
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
    subToCard,
  };
}
