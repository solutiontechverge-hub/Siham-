"use client";

import * as React from "react";
import type { CalendarBooking } from "../../../store/services/businessApi";
import {
  useGetBusinessSetupQuery,
  useGetProfessionalClientsQuery,
  useUpdateBookingStatusMutation,
} from "../../../store/services/businessApi";
import {
  useReissueFinanceInvoiceMutation,
  useLazyGetFinanceTransactionsQuery,
  useGetFinanceTransactionsQuery,
  useBulkFinanceTransactionActionMutation,
  useCreateFinanceTransactionMutation,
  useUpdateFinanceTransactionMutation,
  useProcessFinanceInvoiceReissuesMutation,
  useGetSalesCardMetadataQuery,
  useUpsertSalesCardMetadataMutation,
  useGetSalesAddonsQuery,
  useUpsertSalesAddonMutation,
} from "../../../store/services/financeApi";
import {
  parseApiCalendarEventId,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
  parseCalendarEntryNotes,
} from "./bookingEventDetails";
import { buildSplitBillNotesPatch, resolveSalesPayerShares } from "./salesSplitBill";
import type { CalendarBookingDetails, CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  canEditFinanceTransactionDate,
  canMarkFinancePaid,
  canMarkFinanceUnpaid,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useSnackbar } from "../AppSnackbar";
import {
  buildClientBookingTransactionRow,
  findIssuedFinanceTransaction,
  hasStoredDocumentSnapshot,
  salesCardKindToPaymentPhase,
  useProfessionalBusinessOverride,
} from "../finance-documents";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
  isOfflinePaymentMethod,
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
  configureSalesCardMetadataPersistence,
  hydrateSalesCardMetadata,
  hydrateSalesAddons,
  listSalesAddons,
  configureSalesAddonPersistence,
  SALES_META_CHANGED_EVENT,
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
import { auditSalesCardFinanceReconcile } from "./auditSalesCardFinanceReconcile";

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
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const lateCancellationFeePercentDefault =
    businessSetupResponse?.data?.late_cancellation_fee_percentage != null
      ? String(businessSetupResponse.data.late_cancellation_fee_percentage)
      : undefined;
  const { data: clientsResponse } = useGetProfessionalClientsQuery();
  const [updateBookingStatus, { isLoading: cancelling }] =
    useUpdateBookingStatusMutation();
  const [reissueFinanceInvoice] = useReissueFinanceInvoiceMutation();
  const [fetchFinanceTransactions] = useLazyGetFinanceTransactionsQuery();
  const [bulkFinanceAction] = useBulkFinanceTransactionActionMutation();
  const [createFinanceTransaction] = useCreateFinanceTransactionMutation();
  const [updateFinanceTransaction] = useUpdateFinanceTransactionMutation();
  const [transactionDateModal, setTransactionDateModal] = React.useState<
    | {
        mode: "markPaid" | "editDate";
        card: SalesOverviewCardData;
        ids: string[];
        initialDate: string | null;
      }
    | null
  >(null);
  const [refundCard, setRefundCard] = React.useState<SalesOverviewCardData | null>(null);
  const [refundTransactions, setRefundTransactions] = React.useState<TransactionRow[]>([]);
  const [processFinanceInvoiceReissues] = useProcessFinanceInvoiceReissuesMutation();
  const { data: salesMetadataResponse } = useGetSalesCardMetadataQuery();
  const { data: salesAddonsResponse } = useGetSalesAddonsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    // ponytail: same 12s cadence as finance poll so Add-ons Summary tracks API.
    pollingInterval: 12_000,
  });
  const [saveSalesCardMetadata] = useUpsertSalesCardMetadataMutation();
  // Do not shadow storage `saveSalesAddon` — local list must update before cards rebuild.
  const [upsertSalesAddonApi] = useUpsertSalesAddonMutation();

  React.useEffect(() => {
    hydrateSalesCardMetadata((salesMetadataResponse?.data ?? []) as never[] as import("./salesOverview.types").SalesCardMetaRecord[]);
  }, [salesMetadataResponse?.data]);

  React.useEffect(() => {
    hydrateSalesAddons((salesAddonsResponse?.data ?? []) as never[] as import("./salesOverview.types").SalesAddonRecord[]);
  }, [salesAddonsResponse?.data]);

  React.useEffect(() => {
    configureSalesCardMetadataPersistence((record) => {
      void saveSalesCardMetadata(record as never);
    });
    return () => configureSalesCardMetadataPersistence(null);
  }, [saveSalesCardMetadata]);

  React.useEffect(() => {
    configureSalesAddonPersistence((record) => {
      void upsertSalesAddonApi(record as never);
    });
    return () => configureSalesAddonPersistence(null);
  }, [upsertSalesAddonApi]);

  // Prefer unique_code (matches finance_transactions.booking_id); UUID still resolves server-side.
  const parsedCurrentId = currentEvent
    ? parseApiCalendarEventId(currentEvent.id)
    : null;
  const financeBookingId =
    currentEvent?.bookingCode ||
    bookings[0]?.unique_code ||
    (parsedCurrentId?.kind === "booking" ? parsedCurrentId.id : null) ||
    bookings[0]?.id ||
    "";
  // Live while Sales is open: remount refetch + short poll so Paid LCF/LRF/NS appear without manual refresh.
  const { data: financeResponse, isError: financeQueryError } =
    useGetFinanceTransactionsQuery(
      { bookingId: String(financeBookingId), limit: 50 },
      {
        skip: !financeBookingId,
        refetchOnMountOrArgChange: true,
        // ponytail: 12s matches calendar page poll; websockets not in codebase.
        pollingInterval: 12_000,
      },
    );
  const financeHints = React.useMemo(
    () => toFinanceHints(financeResponse?.data?.rows ?? []),
    [financeResponse?.data?.rows],
  );

  const [revision, setRevision] = React.useState(0);
  // Hydrate/save emit this; without it, API refetch updates storage but cards stay stale.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onMeta = () => setRevision((n) => n + 1);
    window.addEventListener(SALES_META_CHANGED_EVENT, onMeta);
    return () => window.removeEventListener(SALES_META_CHANGED_EVENT, onMeta);
  }, []);
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
        lateCancellationFeePercentDefault,
      }),
    // revision forces rebuild after backend-backed sales mutations
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
      lateCancellationFeePercentDefault,
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

  // Dev-only: after bookings + finance + card meta settle, log card↔row reconcile.
  const lastReconcileKeyRef = React.useRef("");
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!bookings.length && !currentEvent) return;
    if (financeBookingId && financeResponse === undefined && !financeQueryError) {
      return;
    }
    if (salesMetadataResponse === undefined) return;

    const timer = window.setTimeout(() => {
      const stats = auditSalesCardFinanceReconcile(cards, financeHints);
      const key = [
        stats.cards,
        stats.matchedByFk,
        stats.matchedByPhase,
        stats.unmatched,
        stats.financeRows,
        stats.statusMismatches,
      ].join("|");
      if (lastReconcileKeyRef.current === key) return;
      lastReconcileKeyRef.current = key;
      console.info(
        `[SalesOverview reconcile] cards=${stats.cards} matchedByFk=${stats.matchedByFk} matchedByPhase=${stats.matchedByPhase} unmatched=${stats.unmatched} financeRows=${stats.financeRows} statusMismatches=${stats.statusMismatches}`,
      );
    }, 50);
    return () => window.clearTimeout(timer);
  }, [
    bookings.length,
    cards,
    currentEvent,
    financeBookingId,
    financeHints,
    financeQueryError,
    financeResponse,
    salesMetadataResponse,
  ]);

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
    const existingLines = match?.lines ?? [];
    const existingLineIds = new Set(existingLines.map((line) => String(line.id)));
    const persistedAddonLines = listSalesAddons(checkoutBookingId)
      .filter((addon) => !addon.voided && !addon.refunded)
      .flatMap((addon) =>
        (addon.lines ?? []).map((line) => ({
          id: `addon-${addon.id}-${line.id}`,
          label: line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
          amount: Number(line.unitPrice ?? 0) * Number(line.quantity ?? 1),
        })),
      )
      .filter((line) => !existingLineIds.has(String(line.id)));

    return {
      bookingId: checkoutBookingId,
      bookingCode:
        checkoutBookingCode || match?.bookingCode || checkoutBookingId,
      clientName: displayName,
      clientEmail: match?.clientEmail || clientEmail,
      priorLines: [...existingLines, ...persistedAddonLines],
      prepaymentAmount:
        cards.find(
          (card) =>
            card.bookingId === checkoutBookingId && card.kind === "prepayment",
        )?.documentAmount ?? 0,
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

  const resolveIssuedFinanceRow = React.useCallback(
    async (card: SalesOverviewCardData, type: SalesDocumentType) => {
      const phase =
        type === "receipt" && card.kind === "prepayment"
          ? "prepay"
          : salesCardKindToPaymentPhase(card.kind);
      const addonId =
        card.kind === "addon"
          ? card.id.replace(/^addon-/, "").replace(/-v\d+$/, "")
          : undefined;
      const matchOpts = {
        bookingId: card.bookingId,
        bookingCode: card.bookingCode,
        phase,
        addonId,
        transactionId: card.financeTransactionId,
        // Fee Summary / No-Show cards share after_treatment kind — pin protective fee docs.
        protectiveFee:
          card.title === "Fee Summary" || card.title === "No-Show Fee Invoice"
            ? true
            : card.kind === "after_treatment"
              ? false
              : undefined,
      };
      const cached = findIssuedFinanceTransaction(
        financeResponse?.data?.rows ?? [],
        matchOpts,
      );
      if (cached && hasStoredDocumentSnapshot(cached)) return cached;
      try {
        const result = await fetchFinanceTransactions({
          bookingId: card.bookingId || card.bookingCode,
          limit: 50,
        }).unwrap();
        return findIssuedFinanceTransaction(result.data?.rows ?? [], matchOpts);
      } catch {
        return cached;
      }
    },
    [fetchFinanceTransactions, financeResponse?.data?.rows],
  );

  const openDocument = React.useCallback(
    async (card: SalesOverviewCardData, type: SalesDocumentType) => {
      const issued = await resolveIssuedFinanceRow(card, type);
      if (issued && hasStoredDocumentSnapshot(issued)) {
        setDocRow(issued);
        setDocType(type);
        setDocOpen(true);
        return;
      }

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
        prepaymentPaid: isPrepayCard
          ? card.paymentState === "prepaid" || card.paymentState === "paid"
          : undefined,
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
    [clientsResponse?.data, financeSettings, resolveIssuedFinanceRow, showSnackbar],
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
        const issued = await resolveIssuedFinanceRow(card, "invoice");
        if (format === "pdf") await downloadSalesInvoicePdf(card, issued);
        else await downloadSalesInvoiceExcel(card, issued);
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
    [resolveIssuedFinanceRow, showSnackbar],
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
        if (card.kind === "addon") {
          // The UI groups every add-on for a booking into one summary card;
          // refund every add-on transaction represented by that card.
          return phase === "addon";
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
        listSalesAddons(card.bookingId)
          .filter((addon) => !addon.refunded && !addon.voided)
          .forEach((addon) => updateSalesAddon(addon.id, { refunded: true }));
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
          // Refund is already persisted in finance/meta. Calendar-note sync is
          // best-effort and must not turn a successful refund into an error.
          try {
            await updateBookingStatus({
              id: String(booking.id),
              status: (() => {
                const normalized = String(booking.status || "")
                  .toLowerCase()
                  .replace(/\s+/g, "_");
                const allowed = [
                  "requested", "cancelled", "completed", "confirmed",
                  "in_progress", "no_show", "invalid",
                ] as const;
                return allowed.find((value) => value === normalized) ?? "confirmed";
              })(),
              notes: nextNotes,
            }).unwrap();
          } catch {
            // Do not fail the refund because an unrelated calendar update failed.
          }
        }
      }

      bump();
      showSnackbar({
        severity: "success",
        message: SALES_OVERVIEW_COPY.refunded,
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: SALES_OVERVIEW_COPY.refundFailed,
      });
      throw error;
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
      const result = await fetchFinanceTransactions({
        q: card.bookingCode || card.bookingId,
        limit: 50,
      }).unwrap();
      setRefundTransactions(result.data?.rows ?? []);
      setRefundCard(card);
      return;
    }
    if (
      action === "markPaid" ||
      action === "markUnpaid" ||
      action === "editTransactionDate"
    ) {
      const offline = isOfflinePaymentMethod(card.paymentMethod);
      if (action === "markPaid") {
        if (
          !offline ||
          (card.paymentState !== "payment_due" &&
            card.paymentState !== "overdue_invoice" &&
            card.paymentState !== "unpaid")
        ) {
          return;
        }
      } else if (action === "markUnpaid") {
        const allowed =
          card.paymentState === "pending" ||
          (offline &&
            (card.paymentState === "overdue_invoice" ||
              card.paymentState === "paid"));
        if (!allowed) return;
      } else if (
        !offline ||
        (card.paymentState !== "paid" && card.paymentState !== "unpaid")
      ) {
        return;
      }

      try {
        const bookingRef = card.bookingCode || card.bookingId;
        const financeResult = await fetchFinanceTransactions({
          q: bookingRef,
          limit: 50,
        }).unwrap();
        const rows = financeResult.data?.rows ?? [];
        const matchesCard = (row: TransactionRow) => {
          const matchesBooking =
            row.bookingId === card.bookingCode ||
            row.bookingId === card.bookingId ||
            row.entryId === card.bookingCode ||
            (card.financeTransactionId && row.id === card.financeTransactionId);
          if (!matchesBooking) return false;
          const phase = (row.document as { paymentPhase?: string } | undefined)
            ?.paymentPhase;
          if (card.kind === "addon") return phase === "addon";
          if (card.kind === "prepayment") return phase === "prepay" || !phase;
          return phase === "full" || !phase;
        };
        const targets = rows.filter((row) => {
          if (!matchesCard(row)) return false;
          if (action === "markPaid") return canMarkFinancePaid(row);
          if (action === "markUnpaid") return canMarkFinanceUnpaid(row);
          return canEditFinanceTransactionDate(row);
        });

        if (action === "editTransactionDate" || action === "markPaid") {
          const ids = targets.length
            ? targets.map((row) => row.id)
            : card.financeTransactionId
              ? [card.financeTransactionId]
              : [];
          if (!ids.length) {
            showSnackbar({
              severity: "error",
              message:
                action === "markPaid"
                  ? SALES_OVERVIEW_COPY.markPaidFailed
                  : SALES_OVERVIEW_COPY.editTransactionDateFailed,
            });
            return;
          }
          setTransactionDateModal({
            mode: action === "markPaid" ? "markPaid" : "editDate",
            card,
            ids,
            initialDate: targets.find((row) => row.date)?.date ?? card.paidAt?.slice(0, 10) ?? null,
          });
          return;
        }

        // markUnpaid
        if (targets.length) {
          await bulkFinanceAction({
            ids: targets.map((row) => row.id),
            action: "markUnpaid",
          }).unwrap();
        } else if (card.paymentState !== "pending") {
          showSnackbar({
            severity: "error",
            message: SALES_OVERVIEW_COPY.markUnpaidFailed,
          });
          return;
        }
        upsertSalesCardMeta({
          bookingId: card.bookingId,
          cardKind: card.kind,
          cardId: card.id,
          note: card.note,
          markedUnpaid: true,
          paidAt: null,
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
      } catch {
        showSnackbar({
          severity: "error",
          message:
            action === "markPaid"
              ? SALES_OVERVIEW_COPY.markPaidFailed
              : action === "editTransactionDate"
                ? SALES_OVERVIEW_COPY.editTransactionDateFailed
                : SALES_OVERVIEW_COPY.markUnpaidFailed,
        });
      }
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
    // Pending → cancel; Paid/Prepaid → void (existing). Block other states.
    const voidSettledSale =
      cancelCard.paymentState === "paid" ||
      cancelCard.paymentState === "prepaid";
    if (!voidSettledSale && cancelCard.paymentState !== "pending") return;
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
          row.entryId === cancelCard.bookingCode ||
          (cancelCard.financeTransactionId &&
            row.id === cancelCard.financeTransactionId);
        if (!matchesBooking) return false;
        const open = voidSettledSale
          ? ["Paid", "Prepaid", "Payment due", "Overdue", "Unpaid"].includes(row.status)
          : row.status === "Pending";
        if (!open) return false;
        const phase = (row.document as { paymentPhase?: string; addonId?: string } | undefined)
          ?.paymentPhase;
        if (cancelCard.kind === "addon") {
          return phase === "addon";
        }
        if (cancelCard.kind === "prepayment") return phase === "prepay" || !phase;
        return phase === "full" || !phase;
      });

      if (cancelable.length) {
        await bulkFinanceAction({
          ids: cancelable.map((row) => row.id),
          action: voidSettledSale ? "void" : "cancel",
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
        try {
          await updateBookingStatus({
            id: String(booking.id),
            status: allowedBookingStatus(booking.status),
            notes: nextNotes,
          }).unwrap();
        } catch {
          // Finance cancellation/void is authoritative; calendar-note sync is best-effort.
        }
      }

      if (cancelCard.kind === "addon") {
        const addonId = cancelCard.id.startsWith("addon-")
          ? cancelCard.id.slice("addon-".length)
          : cancelCard.id;
        updateSalesAddon(addonId, { voided: true });
      }

      // Void in place (grey Voided badge). Clear canceled so supersede-hide does not win on merge.
      upsertSalesCardMeta({
        bookingId: cancelCard.bookingId,
        cardKind: cancelCard.kind,
        cardId: cancelCard.id,
        note: cancelCard.note,
        voided: true,
        canceled: false,
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
        // Add-ons inherit the booking's channel.  Without this field the API
        // defaults every booking sale to `onlineBooking`, which makes an
        // Offline Direct add-on fail/land in the wrong finance flow.
        entryType:
          payload.paymentMethod === "offlineDirect"
            ? "offlineBooking"
            : "onlineBooking",
        totalPrice: payload.totalPrice,
        discountAmount: payload.discountAmount,
        lines: payload.lines.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          sourceReference: line.sourceReference ?? line.id,
          sourceType: line.sourceType ?? "uniqueItemCode",
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
    } catch (error) {
      const apiError = error as {
        data?: { message?: string };
        error?: string;
        message?: string;
      };
      const detail =
        apiError?.data?.message ||
        (typeof apiError?.data === "string" ? apiError.data : "") ||
        apiError?.error ||
        apiError?.message ||
        "Request failed";
      showSnackbar({
        severity: "error",
        message: `${SALES_OVERVIEW_COPY.addonFailed} ${detail}`,
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

  const confirmTransactionDateModal = async (transactionDate: string) => {
    const modal = transactionDateModal;
    if (!modal) return;
    try {
      if (modal.mode === "markPaid") {
        await bulkFinanceAction({
          ids: modal.ids,
          action: "markPaid",
          transactionDate,
        }).unwrap();
        upsertSalesCardMeta({
          bookingId: modal.card.bookingId,
          cardKind: modal.card.kind,
          cardId: modal.card.id,
          note: modal.card.note,
          markedUnpaid: false,
          paidAt: `${transactionDate}T12:00:00`,
          paymentMethod: modal.card.paymentMethod,
          dueDate: modal.card.dueDate,
          voided: modal.card.voided,
          refunded: modal.card.refunded,
          canceled: modal.card.canceled,
        });
        showSnackbar({
          severity: "success",
          message: SALES_OVERVIEW_COPY.markedPaid,
        });
      } else {
        await Promise.all(
          modal.ids.map((id) =>
            updateFinanceTransaction({ id, transactionDate }).unwrap(),
          ),
        );
        if (modal.card.paymentState === "paid") {
          upsertSalesCardMeta({
            bookingId: modal.card.bookingId,
            cardKind: modal.card.kind,
            cardId: modal.card.id,
            note: modal.card.note,
            paidAt: `${transactionDate}T12:00:00`,
            paymentMethod: modal.card.paymentMethod,
            dueDate: modal.card.dueDate,
            voided: modal.card.voided,
            refunded: modal.card.refunded,
            canceled: modal.card.canceled,
          });
        }
        showSnackbar({
          severity: "success",
          message: SALES_OVERVIEW_COPY.transactionDateUpdated,
        });
      }
      setTransactionDateModal(null);
      bump();
    } catch {
      showSnackbar({
        severity: "error",
        message:
          modal.mode === "markPaid"
            ? SALES_OVERVIEW_COPY.markPaidFailed
            : SALES_OVERVIEW_COPY.editTransactionDateFailed,
      });
    }
  };

  // Manual reissue modal seeds from issued snapshot terms when available.
  const overduePaymentTerms = React.useMemo(() => {
    const txId = overdueCard?.financeTransactionId;
    if (!txId) return financeSettings.paymentTerms;
    const snap = financeHints.find(
      (hint) => String(hint.transactionId) === String(txId),
    )?.paymentTerms;
    return snap
      ? { ...financeSettings.paymentTerms, ...snap }
      : financeSettings.paymentTerms;
  }, [financeHints, financeSettings.paymentTerms, overdueCard?.financeTransactionId]);

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
    handleRefundSales,
    refundCard,
    refundTransactions,
    setRefundCard,
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
    subToCard,
    transactionDateModal,
    setTransactionDateModal,
    confirmTransactionDateModal,
  };
}
