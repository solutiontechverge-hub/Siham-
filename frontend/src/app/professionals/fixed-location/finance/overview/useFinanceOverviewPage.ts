"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import {
  getTransactionActionCategory,
  type TransactionRow,
} from "../data/transactions";
import { buildFinanceTransactionQueryParams } from "../financeQueryParams";
import type { ManualEntrySavePayload } from "../../../../../components/sections/finance/manualEntry.data";
import { manualEntryClientFields } from "../../../../../components/sections/finance/manualEntry.data";
import type { FinanceFiltersValue } from "../../../../../components/sections/finance/FinanceFiltersDrawerView";
import { useSnackbar } from "../../../../../components/common/AppSnackbar";
import { exportTransactionsToExcel } from "../../../../../components/sections/finance/exportTransactionsExcel";
import { downloadTransactionsOverview } from "../../../../../components/sections/finance/downloadTransactionsOverview";
import { useFinanceInvoiceSettings } from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import { useGetProfileQuery } from "../../../../../store/services/profileApi";
import {
  useBulkFinanceTransactionActionMutation,
  useReplaceFinanceTransactionMutation,
  useCreateFinanceTransactionMutation,
  useGetFinanceTransactionsQuery,
  useUpdateFinanceTransactionMutation,
} from "../../../../../store/services/financeApi";
import { INITIAL_VISIBLE, buildActionMenuItems } from "./overview.data";

export function useFinanceOverviewPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const { settings } = useFinanceInvoiceSettings();
  const { data: profileResponse } = useGetProfileQuery();
  const { showSnackbar } = useSnackbar();

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [addAnchor, setAddAnchor] = React.useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = React.useState<null | HTMLElement>(null);
  const [actionExportAnchor, setActionExportAnchor] =
    React.useState<null | HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filtersValue, setFiltersValue] = React.useState<FinanceFiltersValue>(
    {},
  );
  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = React.useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE);
  const [activeDocument, setActiveDocument] = React.useState<{
    row: TransactionRow;
    documentType: "invoice" | "receipt";
  } | null>(null);
  const [voidPaymentModalOpen, setVoidPaymentModalOpen] = React.useState(false);
  const [refundDrawerOpen, setRefundDrawerOpen] = React.useState(false);
  const [manualEntryDrawerOpen, setManualEntryDrawerOpen] =
    React.useState(false);
  const [editSalesWarningOpen, setEditSalesWarningOpen] = React.useState(false);
  const [replaceTransactionId, setReplaceTransactionId] = React.useState<
    string | null
  >(null);
  const [noteModalTransactionId, setNoteModalTransactionId] = React.useState<
    string | null
  >(null);

  const [bulkAction] = useBulkFinanceTransactionActionMutation();
  const [createTransaction] = useCreateFinanceTransactionMutation();
  const [replaceTransaction] = useReplaceFinanceTransactionMutation();
  const [updateTransaction] = useUpdateFinanceTransactionMutation();

  const apiParams = React.useMemo(
    () =>
      buildFinanceTransactionQueryParams({
        query,
        fromDate,
        toDate,
        filters: filtersValue,
        limit: visibleCount,
      }),
    [filtersValue, fromDate, query, toDate, visibleCount],
  );

  const { data: transactionsResponse, refetch } =
    useGetFinanceTransactionsQuery(apiParams);
  const transactions = transactionsResponse?.data?.rows ?? [];
  const totalTransactions = transactionsResponse?.data?.total ?? 0;

  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filtersValue, fromDate, toDate]);

  React.useEffect(() => {
    if (!fromDate && !toDate) {
      setDateRangeError(null);
      return;
    }
    if (!fromDate || !toDate) {
      setDateRangeError("Select both From date and To date.");
      return;
    }
    if (fromDate > toDate) {
      setDateRangeError("From date must be before To date.");
      return;
    }
    setDateRangeError(null);
  }, [fromDate, toDate]);

  const filtered = transactions;
  const visibleRows = filtered;
  const canLoadMore = visibleCount < totalTransactions;

  const toggleOne = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    visibleRows.forEach((r) => {
      next[r.id] = true;
    });
    setSelected(next);
  };

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selected[r.id]);
  const selectedCount = React.useMemo(
    () => visibleRows.filter((r) => selected[r.id]).length,
    [visibleRows, selected],
  );
  const multipleSelected = selectedCount >= 2;

  const selectedRows = React.useMemo(
    () => filtered.filter((r) => selected[r.id]),
    [filtered, selected],
  );

  const actionCategory = React.useMemo(
    () => getTransactionActionCategory(selectedRows),
    [selectedRows],
  );

  const actionMenuItems = React.useMemo(
    () => buildActionMenuItems(selectedCount > 0 ? actionCategory : null),
    [actionCategory, selectedCount],
  );

  const closeAddMenus = React.useCallback(() => {
    setAddAnchor(null);
  }, []);

  const closeMoreMenus = React.useCallback(() => {
    setMoreAnchor(null);
    setActionExportAnchor(null);
  }, []);

  const rowsToExport = React.useMemo(
    () => (selectedCount > 0 ? selectedRows : filtered),
    [filtered, selectedCount, selectedRows],
  );

  const openVoidPaymentModal = React.useCallback(() => {
    if (selectedCount === 0) {
      showSnackbar({
        severity: "warning",
        message: "Select at least one transaction first.",
      });
      return;
    }
    closeAddMenus();
    closeMoreMenus();
    setVoidPaymentModalOpen(true);
  }, [closeAddMenus, closeMoreMenus, selectedCount, showSnackbar]);

  const confirmVoidPayment = React.useCallback(async () => {
    const ids = selectedRows.map((r) => r.id);
    try {
      await bulkAction({ ids, action: "void" }).unwrap();
      setVoidPaymentModalOpen(false);
      setSelected({});
      showSnackbar({
        severity: "success",
        message: `Voided ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not void transactions.",
      });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const openRefundDrawer = React.useCallback(() => {
    if (selectedCount === 0) {
      showSnackbar({
        severity: "warning",
        message: "Select at least one transaction first.",
      });
      return;
    }
    closeAddMenus();
    closeMoreMenus();
    setRefundDrawerOpen(true);
  }, [closeAddMenus, closeMoreMenus, selectedCount, showSnackbar]);

  const confirmRefund = React.useCallback(async () => {
    const ids = selectedRows.map((r) => r.id);
    try {
      await bulkAction({ ids, action: "refund" }).unwrap();
      setRefundDrawerOpen(false);
      setSelected({});
      showSnackbar({
        severity: "success",
        message: `Refunded ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not refund transactions.",
      });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const openManualEntryDrawer = React.useCallback(() => {
    closeAddMenus();
    closeMoreMenus();
    setManualEntryDrawerOpen(true);
  }, [closeAddMenus, closeMoreMenus]);

  const closeManualEntryDrawer = React.useCallback(() => {
    setManualEntryDrawerOpen(false);
    setReplaceTransactionId(null);
  }, []);

  const noteModalTransaction = React.useMemo(
    () => transactions.find((row) => row.id === noteModalTransactionId) ?? null,
    [noteModalTransactionId, transactions],
  );

  const openNoteModal = React.useCallback(
    (transactionId: string) => {
      closeAddMenus();
      closeMoreMenus();
      setNoteModalTransactionId(transactionId);
    },
    [closeAddMenus, closeMoreMenus],
  );

  const saveTransactionNote = React.useCallback(
    async (note: string) => {
      if (!noteModalTransactionId) return;
      try {
        await updateTransaction({ id: noteModalTransactionId, note }).unwrap();
        showSnackbar({ severity: "success", message: "Note saved." });
      } catch {
        showSnackbar({ severity: "error", message: "Could not save note." });
      }
    },
    [noteModalTransactionId, showSnackbar, updateTransaction],
  );

  const deleteTransactionNote = React.useCallback(async () => {
    if (!noteModalTransactionId) return;
    try {
      await updateTransaction({
        id: noteModalTransactionId,
        note: "",
      }).unwrap();
      showSnackbar({ severity: "success", message: "Note deleted." });
    } catch {
      showSnackbar({ severity: "error", message: "Could not delete note." });
    }
  }, [noteModalTransactionId, showSnackbar, updateTransaction]);

  const deleteSelectedSales = React.useCallback(async () => {
    const ids = selectedRows.map((r) => r.id);
    try {
      await bulkAction({ ids, action: "delete" }).unwrap();
      setSelected({});
      showSnackbar({
        severity: "success",
        message: `Deleted ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not delete transactions.",
      });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const cancelSelectedSales = React.useCallback(async () => {
    const ids = selectedRows.map((r) => r.id);
    try {
      await bulkAction({ ids, action: "cancel" }).unwrap();
      setSelected({});
      showSnackbar({
        severity: "success",
        message: `Cancelled ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Could not cancel transactions.",
      });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const confirmManualEntry = React.useCallback(
    async (payload: ManualEntrySavePayload) => {
      const client = manualEntryClientFields(
        payload.clientSelection,
        payload.guestEmail,
        payload.guestName,
      );
      const body = {
        clientName: client.clientName,
        clientEmail: client.clientEmail,
        clientType: client.clientType,
        paymentMethod: payload.paymentMethod,
        totalPrice: payload.totalPrice,
        discountAmount: payload.discountAmount,
        lines: payload.lines.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      };
      const isReplace = Boolean(replaceTransactionId);
      try {
        if (replaceTransactionId) {
          await replaceTransaction({
            id: replaceTransactionId,
            ...body,
          }).unwrap();
        } else {
          await createTransaction(body).unwrap();
        }
        setManualEntryDrawerOpen(false);
        setReplaceTransactionId(null);
        setFromDate(null);
        setToDate(null);
        setVisibleCount(INITIAL_VISIBLE);
        setSelected({});
        void refetch();
        showSnackbar({
          severity: "success",
          message: isReplace
            ? `Sale updated for ${client.clientName}.`
            : `New sale saved for ${client.clientName} — added to transactions.`,
        });
      } catch {
        showSnackbar({
          severity: "error",
          message: "Could not save new sale.",
        });
      }
    },
    [
      createTransaction,
      refetch,
      replaceTransaction,
      replaceTransactionId,
      showSnackbar,
    ],
  );

  const exportInvoiceReceipt = React.useCallback(() => {
    closeMoreMenus();
    if (rowsToExport.length === 0) {
      showSnackbar({
        severity: "warning",
        message: "No transactions to export.",
      });
      return;
    }
    const ok = exportTransactionsToExcel(
      rowsToExport,
      "transactions-invoice-receipt",
    );
    if (ok) {
      showSnackbar({
        severity: "success",
        message: `Exported ${rowsToExport.length} transaction${rowsToExport.length === 1 ? "" : "s"} (invoice/receipt) to Excel.`,
      });
    }
  }, [closeMoreMenus, rowsToExport, showSnackbar]);

  const exportTable = React.useCallback(async () => {
    closeMoreMenus();
    if (rowsToExport.length === 0) {
      showSnackbar({
        severity: "warning",
        message: "No transactions to export.",
      });
      return;
    }
    try {
      const ok = await downloadTransactionsOverview(rowsToExport, "pdf");
      if (ok) {
        showSnackbar({
          severity: "success",
          message: `Exported ${rowsToExport.length} transaction${rowsToExport.length === 1 ? "" : "s"} to PDF.`,
        });
      }
    } catch {
      showSnackbar({
        severity: "error",
        message: "Export failed. Please try again.",
      });
    }
  }, [closeMoreMenus, rowsToExport, showSnackbar]);

  const handleActionMenuAction = React.useCallback(
    (actionId: string) => {
      if (actionId === "export") return;

      closeMoreMenus();

      if (actionId === "voidSales") {
        openVoidPaymentModal();
        return;
      }

      if (actionId === "refund") {
        openRefundDrawer();
        return;
      }

      if (actionId === "deleteSales") {
        if (selectedCount === 0) {
          showSnackbar({
            severity: "warning",
            message: "Select at least one transaction first.",
          });
          return;
        }
        deleteSelectedSales();
        return;
      }

      if (actionId === "cancelSales") {
        if (selectedCount === 0) {
          showSnackbar({
            severity: "warning",
            message: "Select at least one transaction first.",
          });
          return;
        }
        cancelSelectedSales();
        return;
      }

      if (actionId === "editSales") {
        if (selectedCount === 0) {
          showSnackbar({
            severity: "warning",
            message: "Select at least one transaction first.",
          });
          return;
        }
        setEditSalesWarningOpen(true);
        setReplaceTransactionId(selectedRows[0]?.id ?? null);
      }
    },
    [
      cancelSelectedSales,
      closeMoreMenus,
      deleteSelectedSales,
      openRefundDrawer,
      openVoidPaymentModal,
      selectedCount,
      showSnackbar,
    ],
  );

  const handleActionExportAction = React.useCallback(
    (actionId: string) => {
      if (actionId === "exportTable") {
        void exportTable();
        return;
      }

      if (actionId === "exportInvoiceReceipt") {
        exportInvoiceReceipt();
      }
    },
    [exportInvoiceReceipt, exportTable],
  );

  const addMenuItemSx = React.useMemo(
    () => ({
      borderRadius: "8px",
      fontSize: 12.5,
      fontWeight: 700,
      color: alpha(m.navy, 0.75),
      my: 0.25,
    }),
    [m.navy],
  );

  const handleAddMenuAction = React.useCallback(
    (actionId: string) => {
      closeAddMenus();

      if (actionId === "newSale") {
        openManualEntryDrawer();
        return;
      }

      if (actionId === "addNote") {
        if (selectedCount === 0) {
          showSnackbar({
            severity: "warning",
            message: "Select a transaction to add a note.",
          });
          return;
        }
        openNoteModal(selectedRows[0].id);
      }
    },
    [
      closeAddMenus,
      openManualEntryDrawer,
      openNoteModal,
      selectedCount,
      selectedRows,
      showSnackbar,
    ],
  );

  const openActionExportMenu = React.useCallback((el: HTMLElement) => {
    setActionExportAnchor(el);
  }, []);

  return {
    theme,
    m,
    router,
    settings,
    profileResponse,
    query,
    setQuery,
    selected,
    addAnchor,
    setAddAnchor,
    moreAnchor,
    setMoreAnchor,
    actionExportAnchor,
    setActionExportAnchor,
    filtersOpen,
    setFiltersOpen,
    filtersValue,
    setFiltersValue,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    dateRangeError,
    visibleCount,
    setVisibleCount,
    activeDocument,
    setActiveDocument,
    voidPaymentModalOpen,
    setVoidPaymentModalOpen,
    refundDrawerOpen,
    setRefundDrawerOpen,
    manualEntryDrawerOpen,
    editSalesWarningOpen,
    setEditSalesWarningOpen,
    noteModalTransactionId,
    setNoteModalTransactionId,
    visibleRows,
    canLoadMore,
    toggleOne,
    toggleAll,
    allVisibleSelected,
    selectedCount,
    multipleSelected,
    selectedRows,
    actionMenuItems,
    closeAddMenus,
    closeMoreMenus,
    confirmVoidPayment,
    confirmRefund,
    closeManualEntryDrawer,
    noteModalTransaction,
    openNoteModal,
    saveTransactionNote,
    deleteTransactionNote,
    confirmManualEntry,
    handleActionMenuAction,
    handleActionExportAction,
    addMenuItemSx,
    handleAddMenuAction,
    openActionExportMenu,
    openManualEntryDrawer,
  };
}
