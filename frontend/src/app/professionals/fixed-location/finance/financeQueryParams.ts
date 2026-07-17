import type { FinanceFiltersValue } from "../../../../components/sections/finance/FinanceFiltersDrawerView";
import type { ListFinanceTransactionsParams } from "../../../../store/services/financeApi";

function selectedKeys(value: FinanceFiltersValue, prefix: string) {
  return Object.keys(value).filter((k) => k.startsWith(prefix) && value[k]);
}

const ENTRY_MAP: Record<string, string> = {
  "entry:onlineBooking": "onlineBooking",
  "entry:offlineBooking": "offlineBooking",
  "entry:manualEntry": "manualEntry",
};

const CLIENT_MAP: Record<string, string> = {
  "client:mollure": "mollure",
  "client:nonMollure": "nonMollure",
  "client:ic": "nonMollure",
  "client:bc": "business",
  "client:cc": "business",
  "client:guest": "guest",
};

const TX_MAP: Record<string, string> = {
  "tx:onlineDirect": "onlineDirect",
  "tx:onlineInvoice": "onlineInvoice",
  "tx:offlineDirect": "offlineDirect",
  "tx:offlineInvoice": "offlineInvoice",
  "tx:onlineNonDirect": "onlineInvoice",
  "tx:offlineNonDirect": "offlineInvoice",
};

const STATUS_MAP: Record<string, string> = {
  "status:prepaid": "Prepaid",
  "status:paid": "Paid",
  "status:refunded": "Refunded",
  "status:pending": "Pending",
  "status:prepaymentDue": "Prepayment due",
  "status:paymentDue": "Payment due",
  "status:failed": "Failed",
  "status:overdueInvoice": "Overdue",
  "status:overdueResponse": "Overdue response",
  "status:voided": "Voided",
};

export function buildFinanceTransactionQueryParams(input: {
  query?: string;
  fromDate?: string | null;
  toDate?: string | null;
  filters?: FinanceFiltersValue;
  limit?: number;
  offset?: number;
}): ListFinanceTransactionsParams {
  const params: ListFinanceTransactionsParams = {
    limit: input.limit ?? 100,
    offset: input.offset ?? 0,
  };

  if (input.query?.trim()) params.q = input.query.trim();
  if (input.fromDate) params.fromDate = input.fromDate;
  if (input.toDate) params.toDate = input.toDate;

  const filters = input.filters ?? {};
  const entryTypes = selectedKeys(filters, "entry:")
    .map((k) => ENTRY_MAP[k])
    .filter(Boolean);
  if (entryTypes.length) params.entryTypes = entryTypes.join(",");

  const clientTypes = selectedKeys(filters, "client:")
    .map((k) => CLIENT_MAP[k])
    .filter(Boolean);
  if (clientTypes.length) params.clientTypes = [...new Set(clientTypes)].join(",");

  const txTypes = selectedKeys(filters, "tx:")
    .map((k) => TX_MAP[k])
    .filter(Boolean);
  if (txTypes.length) params.txTypes = [...new Set(txTypes)].join(",");

  const statuses = selectedKeys(filters, "status:")
    .map((k) => STATUS_MAP[k])
    .filter(Boolean);
  if (statuses.length) params.statuses = statuses.join(",");

  return params;
}
