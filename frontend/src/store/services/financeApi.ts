import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { TransactionRow } from "../../app/professionals/fixed-location/finance/data/transactions";
import type { FinanceInvoiceSettings } from "../../components/common/finance-documents/useFinanceInvoiceSettings";
import type { FinanceTransactionOptions } from "../../components/common/finance-documents/useFinanceTransactionOptions";
import { baseApi } from "./baseApi";
import type { ListPagination, ListPaginationParams } from "../../lib/listPagination";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: ListPagination;
};

/** DB / legacy UI values (onboarding ≡ INCOMPLETE). */
export type FinanceStripeConnectStatus = "not_connected" | "onboarding" | "connected";
/** Canonical Connect onboarding states from Stripe account retrieve. */
export type StripeOnboardingState = "NOT_CONNECTED" | "INCOMPLETE" | "CONNECTED";
export type FinanceSubscriptionStatus = "inactive" | "active";

export type FinanceSettings = {
  subscriptionStatus: FinanceSubscriptionStatus;
  stripeConnectStatus: FinanceStripeConnectStatus;
  /** Persisted Stripe Connect account id; used to resume incomplete onboarding. */
  stripeAccountId?: string | null;
  /** Charge saved card on renewal anniversary when true. */
  autoPay?: boolean;
  subscriptionActivatedAt?: string | null;
  subscriptionRenewsAt?: string | null;
  subscriptionLastPaymentAt?: string | null;
  transactionOptions: FinanceTransactionOptions;
  invoiceSettings: FinanceInvoiceSettings;
};

export type FinanceTransactionsResponse = {
  rows: TransactionRow[];
  total: number;
};

export type FinanceAnalyticsSalesVolume = {
  productSales: { rows: unknown[]; chartMaxEur: number };
  salesByCategoriesAndServices: {
    rows: unknown[];
    categoryBars: unknown[];
    legend: unknown[];
    chartMaxEur: number;
  };
  refundsAndAdjustments: { rows: unknown[] };
  unpaidInvoicesAndFeeCompliance: { rows: unknown[] };
  netSalesOverview: { rows: unknown[] };
  salesByBookingOrigin: { rows: unknown[] };
  transactionSummary: { rows: Array<{ channel: string; count: number; sharePct: number; isTotal?: boolean }> };
  totals: { gross: number; refunds: number; net: number; transactionCount: number };
};

export type FinanceAnalyticsResponse = {
  fromDate: string | null;
  toDate: string | null;
  rows: TransactionRow[];
  total: number;
  truncated?: boolean;
  salesVolume: FinanceAnalyticsSalesVolume;
  transactionSummary: FinanceAnalyticsSalesVolume["transactionSummary"];
  totals: FinanceAnalyticsSalesVolume["totals"];
};

export type FinanceAnalyticsParams = {
  fromDate?: string | null;
  toDate?: string | null;
};

export type SalesCardMetadata = Record<string, unknown> & {
  cardId: string;
  bookingId: string;
  cardKind: string;
  financeTransactionId?: string;
};
export type SalesAddonRecord = Record<string, unknown> & { id: string; bookingId: string; bookingCode: string };

export type ListFinanceTransactionsParams = ListPaginationParams & {
  q?: string;
  /** Exact booking UUID or unique_code — preferred over fuzzy `q` for issued docs. */
  bookingId?: string;
  fromDate?: string | null;
  toDate?: string | null;
  entryTypes?: string;
  clientTypes?: string;
  txTypes?: string;
  statuses?: string;
};

export type CreateFinanceTransactionRequest = {
  clientName: string;
  clientEmail: string;
  clientType: string;
  vatNumber?: string;
  cocNumber?: string;
  paymentMethod:
    | "onlineDirect"
    | "offlineDirect"
    | "onlineNonDirect"
    | "offlineNonDirect"
    | "onlineInvoice"
    | "offlineInvoice";
  totalPrice: number;
  discountAmount?: number;
  dueDate?: string;
  lines: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    sourceReference: string;
    sourceType: "serviceId" | "productId" | "uniqueItemCode";
  }>;
  /** Link to booking unique_code or UUID for add-on / booking-linked sales */
  bookingId?: string;
  bookingRef?: string;
  paymentPhase?: "full" | "prepay" | "addon";
  addonId?: string;
  entryType?: "onlineBooking" | "offlineBooking" | "manualEntry";
  entryLabel?: string;
};

export type BulkFinanceTransactionAction = {
  ids: string[];
  action: "refund" | "void" | "cancel" | "delete" | "markUnpaid" | "markPaid";
  /** YYYY-MM-DD — required by backend when marking offline invoices Paid. */
  transactionDate?: string;
  /** Refund routing metadata (bulk refund only). */
  refundMethod?: string;
  reason?: string;
  refundMode?: "item" | "amount";
  refundItems?: Array<{ id?: string; name: string; amount?: number }>;
  bankDetails?: { accountHolder: string; iban: string };
};

export type UpdateFinanceStripeRequest = {
  action?:
    | "activate_subscription"
    | "deactivate_subscription"
    | "set_auto_pay"
    | "confirm_manual_payment"
    | "connect_payments"
    | "start_onboarding";
  subscriptionStatus?: FinanceSubscriptionStatus;
  stripeConnectStatus?: FinanceStripeConnectStatus;
  autoPay?: boolean;
};

const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookingFinancials: builder.query<
      ApiEnvelope<{
        bookingId: string;
        uniqueCode?: string | null;
        financials: Record<string, unknown>;
        statuses?: {
          payment_status?: string | null;
          prepayment_status?: string | null;
          booking_status?: string | null;
        };
        ledger: Array<{
          id: string;
          type: string;
          amount: number;
          status: string;
          createdAt?: string | null;
          metadata?: Record<string, unknown> | null;
        }>;
      }>,
      string
    >({
      query: (bookingId) => `/api/finance/bookings/${encodeURIComponent(bookingId)}/financials`,
      providesTags: (_result, _error, bookingId) => [
        "FinanceTransactions",
        "Bookings",
        { type: "FinanceTransactions", id: `booking-fin-${bookingId}` },
      ],
    }),
    getSalesCardMetadata: builder.query<ApiEnvelope<SalesCardMetadata[]>, void>({
      query: () => "/api/finance/sales-card-metadata",
      // Isolated tag — do not refetch on every FinanceTransactions mutation.
      providesTags: ["SalesCardMetadata"],
    }),
    upsertSalesCardMetadata: builder.mutation<ApiEnvelope<SalesCardMetadata>, SalesCardMetadata>({
      query: (body) => ({ url: "/api/finance/sales-card-metadata", method: "PUT", body }),
      // Local storage already updated; only refresh this list (not Bookings/Finance).
      invalidatesTags: ["SalesCardMetadata"],
    }),
    getSalesAddons: builder.query<ApiEnvelope<SalesAddonRecord[]>, void>({
      query: () => "/api/finance/sales-addons",
      providesTags: ["SalesAddons"],
    }),
    upsertSalesAddon: builder.mutation<ApiEnvelope<SalesAddonRecord>, SalesAddonRecord>({
      query: (body) => ({ url: "/api/finance/sales-addons", method: "PUT", body }),
      invalidatesTags: ["SalesAddons"],
    }),
    deleteSalesAddon: builder.mutation<ApiEnvelope<null>, string>({
      query: (id) => ({ url: `/api/finance/sales-addons/${id}`, method: "DELETE" }),
      invalidatesTags: ["SalesAddons"],
    }),
    getFinanceSettings: builder.query<ApiEnvelope<FinanceSettings>, void>({
      query: () => "/api/finance/settings",
      providesTags: ["FinanceSettings"],
    }),

    updateFinanceInvoiceSettings: builder.mutation<
      ApiEnvelope<FinanceSettings>,
      { invoiceSettings: FinanceInvoiceSettings }
    >({
      query: (body) => ({
        url: "/api/finance/settings/invoice",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FinanceSettings"],
    }),

    updateFinanceTransactionOptions: builder.mutation<
      ApiEnvelope<FinanceSettings>,
      FinanceTransactionOptions
    >({
      query: (body) => ({
        url: "/api/finance/settings/transaction-options",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FinanceSettings"],
    }),

    updateFinanceStripeStatus: builder.mutation<ApiEnvelope<FinanceSettings>, UpdateFinanceStripeRequest>({
      query: (body) => ({
        url: "/api/finance/settings/stripe",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FinanceSettings"],
    }),

    getFinanceTransactions: builder.query<
      ApiEnvelope<FinanceTransactionsResponse>,
      ListFinanceTransactionsParams | void
    >({
      query: (params) => ({
        url: "/api/finance/transactions",
        params: params ?? {},
      }),
      providesTags: (result) =>
        result?.data?.rows?.length
          ? [
              "FinanceTransactions",
              ...result.data.rows.map((row) => ({ type: "FinanceTransactions" as const, id: row.id })),
            ]
          : ["FinanceTransactions"],
    }),

    getFinanceAnalytics: builder.query<
      ApiEnvelope<FinanceAnalyticsResponse>,
      FinanceAnalyticsParams | void
    >({
      query: (params) => ({
        url: "/api/finance/analytics",
        params: {
          ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
          ...(params?.toDate ? { toDate: params.toDate } : {}),
        },
      }),
      providesTags: ["FinanceTransactions"],
    }),

    createFinanceTransaction: builder.mutation<
      ApiEnvelope<TransactionRow>,
      CreateFinanceTransactionRequest
    >({
      query: (body) => ({
        url: "/api/finance/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    updateFinanceTransaction: builder.mutation<
      ApiEnvelope<TransactionRow>,
      { id: string; status?: string; note?: string; transactionDate?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/finance/transactions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        "FinanceTransactions",
        "Bookings",
        { type: "FinanceTransactions", id: arg.id },
      ],
    }),

    bulkFinanceTransactionAction: builder.mutation<
      ApiEnvelope<{ affected: number; status?: string }>,
      BulkFinanceTransactionAction
    >({
      query: (body) => ({
        url: "/api/finance/transactions/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    replaceFinanceTransaction: builder.mutation<
      ApiEnvelope<TransactionRow>,
      { id: string } & CreateFinanceTransactionRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/api/finance/transactions/${id}/replace`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    syncFinanceTransactionFromBooking: builder.mutation<
      ApiEnvelope<TransactionRow>,
      {
        bookingId?: string;
        bookingRef?: string;
        paymentPhase?: "full" | "prepay";
        paymentMethod?: string;
        amount?: number;
        status?: string;
      }
    >({
      query: (body) => ({
        url: "/api/finance/transactions/from-booking",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    getPublicTransactionOptions: builder.query<
      ApiEnvelope<FinanceTransactionOptions>,
      string
    >({
      query: (businessSetupId) => `/api/finance/transaction-options/${businessSetupId}`,
      providesTags: ["FinanceSettings"],
    }),

    getPublicInvoiceSettings: builder.query<ApiEnvelope<FinanceInvoiceSettings>, string>({
      query: (businessSetupId) => `/api/finance/invoice-settings/${businessSetupId}`,
      providesTags: ["FinanceSettings"],
    }),

    processFinanceInvoiceReissues: builder.mutation<ApiEnvelope<{ created: number }>, void>({
      query: () => ({
        url: "/api/finance/invoices/process-reissues",
        method: "POST",
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    reissueFinanceInvoice: builder.mutation<
      ApiEnvelope<{
        transaction: TransactionRow;
        notificationSent: boolean;
        emailSent: boolean;
        emailTo: string | null;
        emailReason: string | null;
      }>,
      {
        bookingId?: string;
        bookingRef?: string;
        dueDate: string;
        penaltyAmount?: number;
        totalPrice?: number;
        clientEmail?: string;
        clientName?: string;
        paymentMethod?: string;
        /** Target one after-treatment payer invoice (main / guest / model). */
        payerKey?: string;
        financeTransactionId?: string;
      }
    >({
      query: (body) => ({
        url: "/api/finance/invoices/reissue",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings", "Notifications"],
    }),

    restartPrepaymentDue: builder.mutation<
      ApiEnvelope<{
        transaction: TransactionRow;
        booking: {
          id: string;
          notes?: string | null;
          response_deadline_at?: string | null;
          status?: string;
          prepayment_status?: string | null;
          unique_code?: string;
        } | null;
      }>,
      { bookingId?: string; bookingRef?: string }
    >({
      query: (body) => ({
        url: "/api/finance/prepayment-due/restart",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions", "Bookings"],
    }),

    getStripeConnectStatus: builder.query<
      ApiEnvelope<{
        status: StripeOnboardingState;
        stripeConnectStatus: FinanceStripeConnectStatus;
        accountId: string | null;
        detailsSubmitted: boolean;
        payoutsEnabled: boolean;
        chargesEnabled: boolean;
      }>,
      void
    >({
      query: () => ({
        url: "/api/finance/settings/stripe/status",
        method: "GET",
      }),
      providesTags: ["FinanceSettings"],
    }),

    createStripeConnectLink: builder.mutation<
      ApiEnvelope<{
        url: string | null;
        simulated?: boolean;
        alreadyConnected?: boolean;
        accountId?: string;
        status?: StripeOnboardingState;
        stripeConnectStatus?: FinanceStripeConnectStatus;
      }>,
      { refreshUrl?: string; returnUrl?: string; accountId?: string } | void
    >({
      query: (body) => ({
        url: "/api/finance/settings/stripe/connect-link",
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["FinanceSettings"],
    }),

    createStripeDashboardLink: builder.mutation<
      ApiEnvelope<{ url: string | null; simulated?: boolean }>,
      void
    >({
      query: () => ({
        url: "/api/finance/settings/stripe/dashboard-link",
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const {
  useGetFinanceSettingsQuery,
  useUpdateFinanceInvoiceSettingsMutation,
  useUpdateFinanceTransactionOptionsMutation,
  useUpdateFinanceStripeStatusMutation,
  useGetFinanceTransactionsQuery,
  useGetFinanceAnalyticsQuery,
  useLazyGetFinanceTransactionsQuery,
  useGetBookingFinancialsQuery,
  useLazyGetBookingFinancialsQuery,
  useCreateFinanceTransactionMutation,
  useUpdateFinanceTransactionMutation,
  useBulkFinanceTransactionActionMutation,
  useReplaceFinanceTransactionMutation,
  useSyncFinanceTransactionFromBookingMutation,
  useGetPublicTransactionOptionsQuery,
  useGetPublicInvoiceSettingsQuery,
  useProcessFinanceInvoiceReissuesMutation,
  useReissueFinanceInvoiceMutation,
  useRestartPrepaymentDueMutation,
  useGetSalesCardMetadataQuery,
  useUpsertSalesCardMetadataMutation,
  useGetSalesAddonsQuery,
  useUpsertSalesAddonMutation,
  useDeleteSalesAddonMutation,
  useCreateStripeConnectLinkMutation,
  useCreateStripeDashboardLinkMutation,
  useGetStripeConnectStatusQuery,
  useLazyGetStripeConnectStatusQuery,
} = financeApi;

export type FinanceApiError = FetchBaseQueryError;

export { financeApi };
