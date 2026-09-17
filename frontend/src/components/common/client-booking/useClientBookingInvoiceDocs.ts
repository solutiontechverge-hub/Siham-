"use client";

import * as React from "react";
import {
  buildClientBookingTransactionRow,
  buildProfessionalBusinessOverride,
} from "../finance-documents";
import type { FinanceInvoiceTemplateType } from "../finance-documents/useFinanceInvoiceSettings";
import {
  checkoutPaymentMethodDetail,
  checkoutPaymentMethodTitle,
  type CheckoutPaymentMethodId,
} from "./checkoutPaymentOptions";
import type { ClientBookingDetailsActiveDocument } from "./clientBookingDetails.helpers";
import type { ClientBookingDraft } from "./types";

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
}) {
  const [activeDocument, setActiveDocument] =
    React.useState<ClientBookingDetailsActiveDocument>(null);

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

  const bookingTransactionRow = React.useMemo(() => {
    if (!input.draft?.services?.length) return null;
    return buildClientBookingTransactionRow({
      bookingRef: input.bookingRef,
      draft: input.draft,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail ?? undefined,
      financeSettings: input.financeSettings as never,
      methodTitle: checkoutPaymentMethodTitle(input.selectedPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(input.selectedPaymentMethod),
      prepaymentAmount:
        (input.requiresPrepayment || input.isPrepaymentPaid) &&
        input.prepaidAmount > 0
          ? input.prepaidAmount
          : undefined,
      clientParty: {
        legalName: input.requesterName,
        email: input.requesterEmail ?? undefined,
        address: input.requesterAddress || undefined,
        vatNumber: input.requesterVat || undefined,
        cocNumber: input.requesterCoc || undefined,
      },
    });
  }, [
    input.bookingRef,
    input.draft,
    input.financeSettings,
    input.isPrepaymentPaid,
    input.prepaidAmount,
    input.requesterAddress,
    input.requesterCoc,
    input.requesterEmail,
    input.requesterName,
    input.requesterVat,
    input.requiresPrepayment,
    input.selectedPaymentMethod,
  ]);

  const prepaymentReceiptRow = React.useMemo(() => {
    if (!input.draft?.services?.length) return null;
    if (!input.isPrepaymentPaid && !input.isOfflinePay) return null;
    if (!(input.prepaidAmount > 0)) return null;
    return buildClientBookingTransactionRow({
      bookingRef: `${input.bookingRef}-prepay`,
      draft: input.draft,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail ?? undefined,
      financeSettings: input.financeSettings as never,
      documentAmount: input.prepaidAmount,
      prepaymentAmount: input.prepaidAmount,
      asPrepaymentReceipt: true,
      methodTitle: checkoutPaymentMethodTitle(input.selectedPaymentMethod),
      methodDetail: checkoutPaymentMethodDetail(input.selectedPaymentMethod),
      clientParty: {
        legalName: input.requesterName,
        email: input.requesterEmail ?? undefined,
        address: input.requesterAddress || undefined,
        vatNumber: input.requesterVat || undefined,
        cocNumber: input.requesterCoc || undefined,
      },
    });
  }, [
    input.bookingRef,
    input.draft,
    input.financeSettings,
    input.isOfflinePay,
    input.isPrepaymentPaid,
    input.prepaidAmount,
    input.requesterAddress,
    input.requesterCoc,
    input.requesterEmail,
    input.requesterName,
    input.requesterVat,
    input.selectedPaymentMethod,
  ]);

  const openInvoice = React.useCallback(() => {
    if (!bookingTransactionRow) return;
    setActiveDocument("invoice");
  }, [bookingTransactionRow]);

  const openReceipt = React.useCallback(() => {
    if (!(prepaymentReceiptRow ?? bookingTransactionRow)) return;
    setActiveDocument("receipt");
  }, [bookingTransactionRow, prepaymentReceiptRow]);

  return {
    activeDocument,
    setActiveDocument,
    professionalBusinessOverride,
    bookingInvoiceType,
    bookingTransactionRow,
    prepaymentReceiptRow,
    openInvoice,
    openReceipt,
  };
}
