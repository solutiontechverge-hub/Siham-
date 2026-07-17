"use client";

import * as React from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useRouter } from "next/navigation";
import {
  Box,
  Menu,
  MenuItem,
  Paper,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import {
  getTransactionActionCategory,
  type TransactionRow,
} from "../data/transactions";
import { buildFinanceTransactionQueryParams } from "../financeQueryParams";
import type { ManualEntrySavePayload } from "../../../../../components/sections/finance/manualEntry.data";
import { manualEntryClientFields } from "../../../../../components/sections/finance/manualEntry.data";
import CancelPendingPaymentModal from "../../../../../components/sections/finance/CancelPendingPaymentModal";
import ManualEntryDrawer from "../../../../../components/sections/finance/ManualEntryDrawer";
import RefundSalesDrawer from "../../../../../components/sections/finance/RefundSalesDrawer";
import TransactionNoteModal from "../../../../../components/sections/finance/TransactionNoteModal";
import FinanceFiltersDrawerView, { type FinanceFiltersValue } from "../../../../../components/sections/finance/FinanceFiltersDrawerView";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import TransactionsHeader from "../../../../../components/sections/finance/TransactionsHeader";
import TransactionsTable from "../../../../../components/sections/finance/TransactionsTable";
import TransactionsToolbar from "../../../../../components/sections/finance/TransactionsToolbar";
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

const INITIAL_VISIBLE = 4;

const ADD_MENU_ITEMS = [
  { id: "newSale", label: "New Sales" },
  { id: "addNote", label: "Note" },
] as const;

type ActionMenuItem = {
  id: string;
  label: string;
  requiresSelection?: boolean;
  hasSubmenu?: boolean;
};

function buildActionMenuItems(category: ReturnType<typeof getTransactionActionCategory>): ActionMenuItem[] {
  const exportItem: ActionMenuItem = { id: "export", label: "Export", hasSubmenu: true };

  switch (category) {
    case "paid":
      return [
        { id: "refund", label: "Refund", requiresSelection: true },
        { id: "voidSales", label: "Void Sales", requiresSelection: true },
        exportItem,
      ];
    case "failed":
      return [
        { id: "deleteSales", label: "Delete Sales", requiresSelection: true },
        { id: "editSales", label: "Edit Sales", requiresSelection: true },
        exportItem,
      ];
    case "pending":
      return [
        { id: "cancelSales", label: "Cancel Sales", requiresSelection: true },
        { id: "editSales", label: "Edit Sales", requiresSelection: true },
        exportItem,
      ];
    case "voided":
      return [
        { id: "deleteSales", label: "Delete Sales", requiresSelection: true },
        exportItem,
      ];
    default:
      return [
        { id: "refund", label: "Refund", requiresSelection: true },
        { id: "voidSales", label: "Void Sales", requiresSelection: true },
        exportItem,
      ];
  }
}

const ACTION_EXPORT_ITEMS = [
  { id: "exportTable", label: "Export item/table" },
  { id: "exportInvoiceReceipt", label: "Export invoices/receipts" },
] as const;

export default function FinanceOverviewPage() {
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
  const [actionExportAnchor, setActionExportAnchor] = React.useState<null | HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filtersValue, setFiltersValue] = React.useState<FinanceFiltersValue>({});
  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE);
  const [activeDocument, setActiveDocument] = React.useState<{
    row: TransactionRow;
    documentType: "invoice" | "receipt";
  } | null>(null);
  const [voidPaymentModalOpen, setVoidPaymentModalOpen] = React.useState(false);
  const [refundDrawerOpen, setRefundDrawerOpen] = React.useState(false);
  const [manualEntryDrawerOpen, setManualEntryDrawerOpen] = React.useState(false);
  const [editSalesWarningOpen, setEditSalesWarningOpen] = React.useState(false);
  const [replaceTransactionId, setReplaceTransactionId] = React.useState<string | null>(null);
  const [noteModalTransactionId, setNoteModalTransactionId] = React.useState<string | null>(null);

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

  const { data: transactionsResponse, refetch } = useGetFinanceTransactionsQuery(apiParams);
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
      showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
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
      showSnackbar({ severity: "error", message: "Could not void transactions." });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const openRefundDrawer = React.useCallback(() => {
    if (selectedCount === 0) {
      showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
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
      showSnackbar({ severity: "error", message: "Could not refund transactions." });
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
      await updateTransaction({ id: noteModalTransactionId, note: "" }).unwrap();
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
      showSnackbar({ severity: "error", message: "Could not delete transactions." });
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
      showSnackbar({ severity: "error", message: "Could not cancel transactions." });
    }
  }, [bulkAction, selectedRows, showSnackbar]);

  const confirmManualEntry = React.useCallback(async (payload: ManualEntrySavePayload) => {
    const client = manualEntryClientFields(payload.clientSelection, payload.guestEmail, payload.guestName);
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
        await replaceTransaction({ id: replaceTransactionId, ...body }).unwrap();
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
      showSnackbar({ severity: "error", message: "Could not save new sale." });
    }
  }, [createTransaction, refetch, replaceTransaction, replaceTransactionId, showSnackbar]);

  const exportInvoiceReceipt = React.useCallback(() => {
    closeMoreMenus();
    if (rowsToExport.length === 0) {
      showSnackbar({ severity: "warning", message: "No transactions to export." });
      return;
    }
    const ok = exportTransactionsToExcel(rowsToExport, "transactions-invoice-receipt");
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
      showSnackbar({ severity: "warning", message: "No transactions to export." });
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
      showSnackbar({ severity: "error", message: "Export failed. Please try again." });
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
          showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
          return;
        }
        deleteSelectedSales();
        return;
      }

      if (actionId === "cancelSales") {
        if (selectedCount === 0) {
          showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
          return;
        }
        cancelSelectedSales();
        return;
      }

      if (actionId === "editSales") {
        if (selectedCount === 0) {
          showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
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
          showSnackbar({ severity: "warning", message: "Select a transaction to add a note." });
          return;
        }
        openNoteModal(selectedRows[0].id);
      }
    },
    [closeAddMenus, openManualEntryDrawer, openNoteModal, selectedCount, selectedRows, showSnackbar],
  );

  const openActionExportMenu = React.useCallback((el: HTMLElement) => {
    setActionExportAnchor(el);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <TransactionsHeader
        title="Transaction overview"
        subtitle="A complete overview of all transactions — accurate data here improves your Analytics page."
      />
      <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.06) }} />

      <TransactionsToolbar
        query={query}
        onQueryChange={(next) => {
          setQuery(next);
          setVisibleCount(INITIAL_VISIBLE);
        }}
        onAddClick={setAddAnchor}
        onMoreClick={setMoreAnchor}
        onFiltersClick={() => setFiltersOpen(true)}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        dateRangeError={dateRangeError}
      />

      <FinanceFiltersDrawerView
        open={filtersOpen}
        value={filtersValue}
        onChange={setFiltersValue}
        onClose={() => setFiltersOpen(false)}
        onCancel={() => setFiltersOpen(false)}
        onApply={() => setFiltersOpen(false)}
      />

      <Menu
        anchorEl={addAnchor}
        open={Boolean(addAnchor)}
        onClose={closeAddMenus}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
            mt: 0.75,
            minWidth: 220,
            p: 0.5,
          },
        }}
      >
        {ADD_MENU_ITEMS.map((opt) => (
          <MenuItem
            key={opt.id}
            disabled={opt.id === "addNote" && selectedCount === 0}
            onClick={() => handleAddMenuAction(opt.id)}
            sx={addMenuItemSx}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={closeMoreMenus}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
            mt: 0.75,
            minWidth: 220,
            p: 0.5,
          },
        }}
      >
        {actionMenuItems.map((opt) =>
          opt.hasSubmenu ? (
            <MenuItem
              key={opt.id}
              onMouseEnter={(e) => openActionExportMenu(e.currentTarget)}
              onClick={(e) => openActionExportMenu(e.currentTarget)}
              sx={{
                borderRadius: "8px",
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.75),
                my: 0.25,
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              {opt.label}
              <ChevronRightRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
            </MenuItem>
          ) : (
            <MenuItem
              key={opt.id}
              disabled={opt.requiresSelection && selectedCount === 0}
              onClick={() => handleActionMenuAction(opt.id)}
              sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
            >
              {opt.label}
            </MenuItem>
          ),
        )}
      </Menu>

      <Menu
        anchorEl={actionExportAnchor}
        open={Boolean(actionExportAnchor)}
        onClose={() => setActionExportAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        MenuListProps={{ sx: { py: 0.5 } }}
        disableAutoFocusItem
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
            ml: 0.25,
            minWidth: 200,
            p: 0.5,
          },
        }}
      >
        {ACTION_EXPORT_ITEMS.map((opt) => (
            <MenuItem
              key={opt.id}
              onClick={() => handleActionExportAction(opt.id)}
              sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
            >
              {opt.label}
            </MenuItem>
        ))}
      </Menu>

      <TransactionsTable
        rows={visibleRows}
        selected={selected}
        disableDocumentLinks={multipleSelected}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
        onOpenDocument={(row, documentType) => setActiveDocument({ row, documentType })}
        onOpenNote={(row) => openNoteModal(row.id)}
        onEntryClick={(row) => {
          if (row.bookingId) {
            router.push(`/professionals/calendar?booking=${encodeURIComponent(row.bookingId)}`);
          }
        }}
        onClientClick={() => {
          router.push("/professionals/client");
        }}
        canLoadMore={canLoadMore}
        onLoadMore={
          canLoadMore
            ? () => setVisibleCount((c) => c + INITIAL_VISIBLE)
            : undefined
        }
        theme={theme as Theme}
        m={m}
      />

      <FinanceDocumentPreviewDrawer
        open={Boolean(activeDocument)}
        onClose={() => setActiveDocument(null)}
        documentType={activeDocument?.documentType ?? "invoice"}
        invoiceType={settings.defaultInvoiceType}
        settings={settings}
        row={activeDocument?.row ?? null}
        profileData={profileResponse?.data ?? null}
      />

      <CancelPendingPaymentModal
        open={voidPaymentModalOpen}
        onClose={() => setVoidPaymentModalOpen(false)}
        onConfirm={confirmVoidPayment}
      />

      <RefundSalesDrawer
        open={refundDrawerOpen}
        onClose={() => setRefundDrawerOpen(false)}
        transactions={selectedRows}
        onSave={() => confirmRefund()}
      />

      <ManualEntryDrawer
        open={manualEntryDrawerOpen}
        onClose={closeManualEntryDrawer}
        onSave={confirmManualEntry}
      />

      <TransactionNoteModal
        open={Boolean(noteModalTransactionId)}
        initialNote={noteModalTransaction?.note ?? ""}
        onClose={() => setNoteModalTransactionId(null)}
        onSave={saveTransactionNote}
        onDelete={noteModalTransaction?.note?.trim() ? deleteTransactionNote : undefined}
      />

      <CancelPendingPaymentModal
        open={editSalesWarningOpen}
        onClose={() => setEditSalesWarningOpen(false)}
        onConfirm={() => {
          setEditSalesWarningOpen(false);
          openManualEntryDrawer();
        }}
        title="Edit Sales"
        message="The selected transaction record will be replaced when you save the edited sale."
        confirmLabel="Continue"
      />
    </Paper>
  );
}
