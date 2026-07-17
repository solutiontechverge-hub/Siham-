import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { TransactionRow } from "../../app/professionals/fixed-location/finance/data/transactions";
import type { FinanceInvoiceSettings } from "../../components/common/finance-documents/useFinanceInvoiceSettings";
import type { FinanceTransactionOptions } from "../../components/common/finance-documents/useFinanceTransactionOptions";
import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type FinanceStripeConnectStatus = "not_connected" | "onboarding" | "connected";
export type FinanceSubscriptionStatus = "inactive" | "active";

export type FinanceSettings = {
  subscriptionStatus: FinanceSubscriptionStatus;
  stripeConnectStatus: FinanceStripeConnectStatus;
  transactionOptions: FinanceTransactionOptions;
  invoiceSettings: FinanceInvoiceSettings;
};

export type FinanceTransactionsResponse = {
  rows: TransactionRow[];
  total: number;
};

export type ListFinanceTransactionsParams = {
  q?: string;
  fromDate?: string | null;
  toDate?: string | null;
  entryTypes?: string;
  clientTypes?: string;
  txTypes?: string;
  statuses?: string;
  limit?: number;
  offset?: number;
};

export type CreateFinanceTransactionRequest = {
  clientName: string;
  clientEmail: string;
  clientType: string;
  paymentMethod: "onlineDirect" | "offlineDirect";
  totalPrice: number;
  discountAmount?: number;
  lines: Array<{ name: string; quantity: number; unitPrice: number }>;
};

export type BulkFinanceTransactionAction = {
  ids: string[];
  action: "refund" | "void" | "cancel" | "delete";
};

export type UpdateFinanceStripeRequest = {
  action?: "activate_subscription" | "deactivate_subscription" | "connect_payments";
  subscriptionStatus?: FinanceSubscriptionStatus;
  stripeConnectStatus?: FinanceStripeConnectStatus;
};

const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

    createFinanceTransaction: builder.mutation<
      ApiEnvelope<TransactionRow>,
      CreateFinanceTransactionRequest
    >({
      query: (body) => ({
        url: "/api/finance/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinanceTransactions"],
    }),

    updateFinanceTransaction: builder.mutation<
      ApiEnvelope<TransactionRow>,
      { id: string; status?: string; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/finance/transactions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        "FinanceTransactions",
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
      invalidatesTags: ["FinanceTransactions"],
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
      invalidatesTags: ["FinanceTransactions"],
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
      invalidatesTags: ["FinanceTransactions"],
    }),

    getPublicTransactionOptions: builder.query<
      ApiEnvelope<FinanceTransactionOptions>,
      string
    >({
      query: (businessSetupId) => `/api/finance/transaction-options/${businessSetupId}`,
    }),

    getPublicInvoiceSettings: builder.query<ApiEnvelope<FinanceInvoiceSettings>, string>({
      query: (businessSetupId) => `/api/finance/invoice-settings/${businessSetupId}`,
    }),

    processFinanceInvoiceReissues: builder.mutation<ApiEnvelope<{ created: number }>, void>({
      query: () => ({
        url: "/api/finance/invoices/process-reissues",
        method: "POST",
      }),
      invalidatesTags: ["FinanceTransactions"],
    }),

    createStripeConnectLink: builder.mutation<
      ApiEnvelope<{ url: string | null; simulated?: boolean; accountId?: string }>,
      { refreshUrl?: string; returnUrl?: string; accountId?: string } | void
    >({
      query: (body) => ({
        url: "/api/finance/settings/stripe/connect-link",
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["FinanceSettings"],
    }),
  }),
});

export const {
  useGetFinanceSettingsQuery,
  useUpdateFinanceInvoiceSettingsMutation,
  useUpdateFinanceTransactionOptionsMutation,
  useUpdateFinanceStripeStatusMutation,
  useGetFinanceTransactionsQuery,
  useCreateFinanceTransactionMutation,
  useUpdateFinanceTransactionMutation,
  useBulkFinanceTransactionActionMutation,
  useReplaceFinanceTransactionMutation,
  useSyncFinanceTransactionFromBookingMutation,
  useGetPublicTransactionOptionsQuery,
  useGetPublicInvoiceSettingsQuery,
  useProcessFinanceInvoiceReissuesMutation,
  useCreateStripeConnectLinkMutation,
} = financeApi;

export type FinanceApiError = FetchBaseQueryError;

export { financeApi };
