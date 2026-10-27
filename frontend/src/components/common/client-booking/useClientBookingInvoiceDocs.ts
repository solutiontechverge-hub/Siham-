"use client";

import * as React from "react";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import {
  buildClientBookingTransactionRow,
  buildProfessionalBusinessOverride,
  ensureKilometerAllowanceOnTransactionRow,
  findIssuedFinanceTransaction,
  hasStoredDocumentSnapshot,
} from "../finance-documents";
import { applyNetServicePricesToDocument } from "../finance-documents/applyNetServicePricesToDocument";
import type { FinanceInvoiceTemplateType } from "../finance-documents/useFinanceInvoiceSettings";
import { useGetFinanceTransactionsQuery } from "../../../store/services/financeApi";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";
import type { ClientBookingDetailsActiveDocument } from "./clientBookingDetails.helpers";
import type { ClientBookingDraft } from "./types";
import {
  LATE_CANCELLATION_BOOKING_FEE,
  LATE_RESCHEDULING_FEE,
} from "../finance-documents/protectiveFeeInvoice";

function isFeeSummaryLineId(lineId?: string | null) {
  return Boolean(lineId && String(lineId).startsWith("fee-"));
}

/** Parse Fee Summary line id → finance match keys. */
function parseFeeSummaryLineId(lineId?: string | null): {
  transactionId?: string;
  entryLabel?: string;
} {
  const raw = String(lineId ?? "");
  if (!raw.startsWith("fee-")) return {};
  if (raw.startsWith("fee-tx-")) {
    return { transactionId: raw.slice("fee-tx-".length) };
  }
  if (raw === "fee-lrf") return { entryLabel: LATE_RESCHEDULING_FEE };
  if (raw === "fee-ns") return { entryLabel: "No-show fee" };
  return { entryLabel: LATE_CANCELLATION_BOOKING_FEE };
}

function isPrepaymentLineId(lineId?: string | null) {
  return Boolean(lineId && String(lineId).startsWith("prepaid-"));
}

/** Invoice / receipt rows + document drawer openers for client booking details. */
export function useClientBookingInvoiceDocs(input: {
  bookingSetup: unknown;
  shopDisplayName: string;
  professionalPhone: string;
  businessProfile: {
    phone?: string | null;
    fixedLocation?: { formattedAddress?: string | null } | null;
    vatNumber?: string | null;
    cocNumber?: string | null;
  } | null;
  shop: {
    addressLabel?: string | null;
    municipalityLabel?: string | null;
  } | null;
  requesterUserType?: string | null;
  draft: ClientBookingDraft | null;
  bookingRef: string;
  /** Canonical booking UUID when known — used to load issued finance docs. */
  bookingId?: string | null;
  requesterName: string;
  requesterEmail?: string | null;
  requesterAddress?: string | null;
  requesterVat?: string | null;
  requesterCoc?: string | null;
  financeSettings: unknown;
  selectedPaymentMethod: CheckoutPaymentMethodId;
  requiresPrepayment: boolean;
  isPrepaymentPaid: boolean;
  prepaidAmount: number;
  isOfflinePay: boolean;
  /** Desired-location km allowance — invoice Description + inclusive totals. */
  kilometerAllowanceAmount?: number;
  /** Services + km booking total when known (aligns PRE Total with payment card). */
  bookingTotal?: number;
}) {
  const [activeDocument, setActiveDocument] =
    React.useState<ClientBookingDetailsActiveDocument>(null);

  const financeBookingKey = input.bookingRef || input.bookingId || "";
  const { data: financeResponse } = useGetFinanceTransactionsQuery(
    { bookingId: String(financeBookingKey), limit: 50 },
    {
      skip: !financeBookingKey,
      refetchOnMountOrArgChange: true,
      // ponytail: same 12s Sales poll so Fee Summary appears after LCF pay without refresh.
      pollingInterval: 12_000,
    },
  );
  const financeRows = financeResponse?.data?.rows ?? [];

  const professionalBusinessOverride = React.useMemo(
    () =>
      buildProfessionalBusinessOverride({
        listing: input.bookingSetup as never,
        shopName: input.shopDisplayName,
        phone: input.professionalPhone || input.businessProfile?.phone,
        address:
          input.businessProfile?.fixedLocation?.formattedAddress ||
          input.shop?.addressLabel ||
          input.shop?.municipalityLabel,
        vatNumber: input.businessProfile?.vatNumber,
        cocNumber: input.businessProfile?.cocNumber,
      }),
    [
      input.bookingSetup,
      input.businessProfile,
      input.professionalPhone,
      input.shop?.addressLabel,
      input.shop?.municipalityLabel,
      input.shopDisplayName,
    ],
  );

  const bookingInvoiceType = (
    input.requesterUserType === "company" ? "company" : "individual"
  ) as FinanceInvoiceTemplateType;

  const clientParty = React.useMemo(
    () => ({
      legalName: input.requesterName,
      email: input.requesterEmail ?? undefined,
      address: input.requesterAddress || undefined,
      vatNumber: input.requesterVat || undefined,
      cocNumber: input.requesterCoc || undefined,
    }),
    [
      input.requesterAddress,
      input.requesterCoc,
      input.requesterEmail,
      input.requesterName,
      input.requesterVat,
    ],
  );

  const methodTitle = checkoutPaymentMethodTitle(input.selectedPaymentMethod);
  const methodDetail = checkoutPaymentMethodDetail(input.selectedPaymentMethod);

  const kmOpts = React.useMemo(
    () => ({
      kilometerAllowanceAmount: input.kilometerAllowanceAmount ?? 0,
      bookingTotal:
        input.bookingTotal ??
        (input.draft?.total != null && input.draft.total > 0
          ? input.draft.total
          : undefined),
      prepaidAmount:
        input.prepaidAmount > 0 ? input.prepaidAmount : undefined,
    }),
    [
      input.bookingTotal,
      input.draft?.total,
      input.kilometerAllowanceAmount,
      input.prepaidAmount,
    ],
  );

  const withKm = React.useCallback(
    (row: TransactionRow | null) =>
      ensureKilometerAllowanceOnTransactionRow(row, kmOpts),
    [kmOpts],
  );
  const discountedServiceLines = React.useMemo(
    () =>
      (input.draft?.services ?? []).map((service) => ({
        label: service.name,
        amount: service.price,
        originalAmount: service.originalPrice,
      })),
    [input.draft?.services],
  );
  const withDiscountedIssued = React.useCallback(
    (row: TransactionRow) =>
      withKm(applyNetServicePricesToDocument(row, discountedServiceLines)),
    [discountedServiceLines, withKm],
  );

  /** After-treatment / non-fee full invoice — never bind LCF when opening service docs. */
  const bookingTransactionRow = React.useMemo(() => {
    const issued = findIssuedFinanceTransaction(financeRows, {
      bookingId: input.bookingId,
      bookingCode: input.bookingRef,
      phase: "full",
      protectiveFee: false,
    });
    if (issued && hasStoredDocumentSnapshot(issued)) return withDiscountedIssued(issued);

    if (!input.draft?.services?.length) return null;
    return withKm(
      buildClientBookingTransactionRow({
        bookingRef: input.bookingRef,
        draft: input.draft,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail ?? undefined,
        financeSettings: input.financeSettings as never,
        methodTitle,
        methodDetail,
        prepaymentAmount:
          (input.requiresPrepayment || input.isPrepaymentPaid) &&
          input.prepaidAmount > 0
            ? input.prepaidAmount
            : undefined,
        prepaymentPaid: input.isPrepaymentPaid,
        kilometerAllowanceAmount: input.kilometerAllowanceAmount,
        clientParty,
      }),
    );
  }, [
    clientParty,
    financeRows,
    input.bookingId,
    input.bookingRef,
    input.draft,
    input.financeSettings,
    input.isPrepaymentPaid,
    input.kilometerAllowanceAmount,
    input.prepaidAmount,
    input.requesterEmail,
    input.requesterName,
    input.requiresPrepayment,
    methodDetail,
    methodTitle,
    withDiscountedIssued,
    withKm,
  ]);

  /** PRE invoice — services + prepaid amount; never fee lines. */
  const prepaymentInvoiceRow = React.useMemo(() => {
    const issued = findIssuedFinanceTransaction(financeRows, {
      bookingId: input.bookingId,
      bookingCode: input.bookingRef,
      phase: "prepay",
      protectiveFee: false,
    });
    if (issued && hasStoredDocumentSnapshot(issued)) return withDiscountedIssued(issued);

    if (!input.draft?.services?.length) return null;
    if (!input.isPrepaymentPaid && !input.isOfflinePay) return null;
    if (!(input.prepaidAmount > 0)) return null;
    return withKm(
      buildClientBookingTransactionRow({
        bookingRef: `${input.bookingRef}-prepay`,
        draft: input.draft,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail ?? undefined,
        financeSettings: input.financeSettings as never,
        // PRE total = full booking; prepaid is separate (matches finance-sync).
        prepaymentAmount: input.prepaidAmount,
        prepaymentPaid: true,
        kilometerAllowanceAmount: input.kilometerAllowanceAmount,
        methodTitle,
        methodDetail,
        clientParty,
      }),
    );
  }, [
    clientParty,
    financeRows,
    input.bookingId,
    input.bookingRef,
    input.draft,
    input.financeSettings,
    input.isOfflinePay,
    input.isPrepaymentPaid,
    input.kilometerAllowanceAmount,
    input.prepaidAmount,
    input.requesterEmail,
    input.requesterName,
    methodDetail,
    methodTitle,
    withDiscountedIssued,
    withKm,
  ]);

  const prepaymentReceiptRow = React.useMemo(() => {
    const issued = findIssuedFinanceTransaction(financeRows, {
      bookingId: input.bookingId,
      bookingCode: input.bookingRef,
      phase: "prepay",
      protectiveFee: false,
    });
    if (issued && hasStoredDocumentSnapshot(issued)) return withDiscountedIssued(issued);

    if (!input.draft?.services?.length) return null;
    if (!input.isPrepaymentPaid && !input.isOfflinePay) return null;
    if (!(input.prepaidAmount > 0)) return null;
    return withKm(
      buildClientBookingTransactionRow({
        bookingRef: `${input.bookingRef}-prepay`,
        draft: input.draft,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail ?? undefined,
        financeSettings: input.financeSettings as never,
        documentAmount: input.prepaidAmount,
        prepaymentAmount: input.prepaidAmount,
        asPrepaymentReceipt: true,
        kilometerAllowanceAmount: input.kilometerAllowanceAmount,
        methodTitle,
        methodDetail,
        clientParty,
      }),
    );
  }, [
    clientParty,
    financeRows,
    input.bookingId,
    input.bookingRef,
    input.draft,
    input.financeSettings,
    input.isOfflinePay,
    input.isPrepaymentPaid,
    input.kilometerAllowanceAmount,
    input.prepaidAmount,
    input.requesterEmail,
    input.requesterName,
    methodDetail,
    methodTitle,
    withDiscountedIssued,
    withKm,
  ]);

  /** Fee Summary invoice — LCF/LRF/NS only. */
  const feeInvoiceRow = React.useMemo(
    () =>
      findIssuedFinanceTransaction(financeRows, {
        bookingId: input.bookingId,
        bookingCode: input.bookingRef,
        phase: "full",
        protectiveFee: true,
      }),
    [financeRows, input.bookingId, input.bookingRef],
  );

  const hasAnyDocument = Boolean(
    bookingTransactionRow ||
      prepaymentInvoiceRow ||
      prepaymentReceiptRow ||
      feeInvoiceRow,
  );

  const resolveRowForLine = React.useCallback(
    (lineId: string | undefined, type: "invoice" | "receipt"): TransactionRow | null => {
      if (isFeeSummaryLineId(lineId)) {
        const parsed = parseFeeSummaryLineId(lineId);
        const matched = findIssuedFinanceTransaction(financeRows, {
          bookingId: input.bookingId,
          bookingCode: input.bookingRef,
          phase: "full",
          protectiveFee: true,
          transactionId: parsed.transactionId,
          entryLabel: parsed.entryLabel,
        });
        // Never fall back to after-treatment booking row for fee lines.
        return matched ?? feeInvoiceRow;
      }
      if (isPrepaymentLineId(lineId)) {
        return type === "receipt"
          ? (prepaymentReceiptRow ?? prepaymentInvoiceRow)
          : (prepaymentInvoiceRow ?? prepaymentReceiptRow);
      }
      return type === "receipt"
        ? (prepaymentReceiptRow ?? bookingTransactionRow)
        : bookingTransactionRow;
    },
    [
      bookingTransactionRow,
      feeInvoiceRow,
      financeRows,
      input.bookingId,
      input.bookingRef,
      prepaymentInvoiceRow,
      prepaymentReceiptRow,
    ],
  );

  const openInvoice = React.useCallback(
    (lineId?: string) => {
      const row = resolveRowForLine(lineId, "invoice");
      if (!row) return;
      setActiveDocument({ type: "invoice", row });
    },
    [resolveRowForLine],
  );

  const openReceipt = React.useCallback(
    (lineId?: string) => {
      const row = resolveRowForLine(lineId, "receipt");
      if (!row) return;
      setActiveDocument({ type: "receipt", row });
    },
    [resolveRowForLine],
  );

  return {
    activeDocument,
    setActiveDocument,
    professionalBusinessOverride,
    bookingInvoiceType,
    bookingTransactionRow,
    prepaymentReceiptRow,
    prepaymentInvoiceRow,
    feeInvoiceRow,
    hasAnyDocument,
    financeRows,
    openInvoice,
    openReceipt,
  };
}
