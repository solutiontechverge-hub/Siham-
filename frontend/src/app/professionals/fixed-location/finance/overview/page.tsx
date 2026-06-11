"use client";

import * as React from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import {
  applyStatusToTransactionIds,
  buildManualEntryTransactionRow,
  mockTransactions,
  transactionMatchesStatusFilter,
  type TransactionRow,
} from "../data/transactions";
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

const INITIAL_VISIBLE = 4;

const ADD_MENU_ITEMS = [
  { id: "newSale", label: "New Sale" },
  { id: "addNote", label: "Add Note" },
] as const;

function isNewSaleEntry(entryLabel?: string | null) {
  const label = (entryLabel ?? "").toLowerCase();
  return label.includes("new sale") || label.includes("manual");
}

const ACTION_MENU_ITEMS = [
  { id: "refund", label: "Refund", requiresSelection: true },
  { id: "voidSales", label: "Void Sales", requiresSelection: true },
  { id: "export", label: "Export", hasSubmenu: true },
] as const;

const ACTION_EXPORT_ITEMS = [
  { id: "exportInvoiceReceipt", label: "Export Invoice/Receipt" },
  { id: "exportOverview", label: "Export Overview", hasSubmenu: true },
] as const;

const OVERVIEW_EXPORT_OPTIONS = ["Export PDF", "Export Excel"] as const;

function selectedKeys(value: FinanceFiltersValue, prefix: string) {
  return Object.keys(value).filter((k) => k.startsWith(prefix) && value[k]);
}

function normalizeMethod(value?: string | null) {
  return (value ?? "").toLowerCase().replaceAll("—", "-").replaceAll("–", "-");
}

export default function FinanceOverviewPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { settings } = useFinanceInvoiceSettings();
  const { data: profileResponse } = useGetProfileQuery();
  const { showSnackbar } = useSnackbar();

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [addAnchor, setAddAnchor] = React.useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = React.useState<null | HTMLElement>(null);
  const [actionExportAnchor, setActionExportAnchor] = React.useState<null | HTMLElement>(null);
  const [overviewExportAnchor, setOverviewExportAnchor] = React.useState<null | HTMLElement>(null);
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
  const [noteModalTransactionId, setNoteModalTransactionId] = React.useState<string | null>(null);
  const [transactions, setTransactions] = React.useState<TransactionRow[]>(() => [...mockTransactions]);

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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const entryKeys = selectedKeys(filtersValue, "entry:");
    const clientKeys = selectedKeys(filtersValue, "client:");
    const txKeys = selectedKeys(filtersValue, "tx:");
    const statusKeysRaw = selectedKeys(filtersValue, "status:");
    const statusKeys = statusKeysRaw.includes("status:all") ? [] : statusKeysRaw;

    // Some rows are grouped under a "parent" and have date=null; inherit previous date.
    let lastDate: string | null = null;

    return transactions.filter((r) => {
      const effectiveDate = r.date ?? lastDate;
      if (r.date) lastDate = r.date;

      // Only apply date range when both are selected and valid.
      if (fromDate && toDate && fromDate <= toDate) {
        if (effectiveDate && effectiveDate < fromDate) return false;
        if (effectiveDate && effectiveDate > toDate) return false;
        if (!effectiveDate) return false;
      }

      const haystack = `${r.clientName} ${r.clientEmail} ${r.entryId ?? ""} ${r.entryLabel ?? ""}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;

      const method = normalizeMethod(r.methodTitle);

      // Entry ID group
      if (entryKeys.length) {
        const isNewSale = isNewSaleEntry(r.entryLabel);
        const isOnline = method.startsWith("online");
        const isOffline = method.startsWith("offline");
        const ok =
          (entryKeys.includes("entry:newSale") && isNewSale) ||
          (entryKeys.includes("entry:onlineBooking") && isOnline) ||
          (entryKeys.includes("entry:offlineBooking") && isOffline);
        if (!ok) return false;
      }

      if (clientKeys.length) {
        const type = r.clientType;
        const ok =
          (clientKeys.includes("client:mollure") && type === "mollure") ||
          (clientKeys.includes("client:nonMollure") && type === "nonMollure") ||
          (clientKeys.includes("client:ic") && type === "nonMollure") ||
          (clientKeys.includes("client:cc") && type === "business");
        if (!ok) return false;
      }

      // Transaction types group
      if (txKeys.length) {
        const isOnline = method.startsWith("online");
        const isOffline = method.startsWith("offline");
        const isDirect = method.includes("direct");
        const isNonDirect = method.includes("non-direct") || method.includes("nondirect") || method.includes("non direct");
        const ok =
          (txKeys.includes("tx:onlineDirect") && isOnline && isDirect && !isNonDirect) ||
          (txKeys.includes("tx:onlineNonDirect") && isOnline && isNonDirect) ||
          (txKeys.includes("tx:offlineDirect") && isOffline && isDirect && !isNonDirect) ||
          (txKeys.includes("tx:offlineNonDirect") && isOffline && isNonDirect);
        if (!ok) return false;
      }

      if (statusKeys.length && !transactionMatchesStatusFilter(r.status, statusKeys)) {
        return false;
      }

      return true;
    });
  }, [query, filtersValue, fromDate, toDate, transactions]);

  const visibleRows = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

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

  const closeAddMenus = React.useCallback(() => {
    setAddAnchor(null);
    setOverviewExportAnchor(null);
  }, []);

  const closeMoreMenus = React.useCallback(() => {
    setMoreAnchor(null);
    setActionExportAnchor(null);
    setOverviewExportAnchor(null);
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

  const confirmVoidPayment = React.useCallback(() => {
    const ids = selectedRows.map((r) => r.id);
    setTransactions((prev) => applyStatusToTransactionIds(prev, ids, "Void"));
    setVoidPaymentModalOpen(false);
    setSelected({});
    showSnackbar({
      severity: "success",
      message: `Voided ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
    });
  }, [selectedRows, showSnackbar]);

  const openRefundDrawer = React.useCallback(() => {
    if (selectedCount === 0) {
      showSnackbar({ severity: "warning", message: "Select at least one transaction first." });
      return;
    }
    closeAddMenus();
    closeMoreMenus();
    setRefundDrawerOpen(true);
  }, [closeAddMenus, closeMoreMenus, selectedCount, showSnackbar]);

  const confirmRefund = React.useCallback(() => {
    const ids = selectedRows.map((r) => r.id);
    setTransactions((prev) => applyStatusToTransactionIds(prev, ids, "Refunded"));
    setRefundDrawerOpen(false);
    setSelected({});
    showSnackbar({
      severity: "success",
      message: `Refunded ${ids.length} transaction${ids.length === 1 ? "" : "s"}.`,
    });
  }, [selectedRows, showSnackbar]);

  const openManualEntryDrawer = React.useCallback(() => {
    closeAddMenus();
    closeMoreMenus();
    setManualEntryDrawerOpen(true);
  }, [closeAddMenus, closeMoreMenus]);

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
    (note: string) => {
      if (!noteModalTransactionId) return;
      setTransactions((prev) =>
        prev.map((row) => (row.id === noteModalTransactionId ? { ...row, note } : row)),
      );
      showSnackbar({ severity: "success", message: "Note saved." });
    },
    [noteModalTransactionId, showSnackbar],
  );

  const deleteTransactionNote = React.useCallback(() => {
    if (!noteModalTransactionId) return;
    setTransactions((prev) =>
      prev.map((row) => (row.id === noteModalTransactionId ? { ...row, note: undefined } : row)),
    );
    showSnackbar({ severity: "success", message: "Note deleted." });
  }, [noteModalTransactionId, showSnackbar]);

  const confirmManualEntry = React.useCallback((payload: ManualEntrySavePayload) => {
    const client = manualEntryClientFields(payload.clientSelection);
    const row = buildManualEntryTransactionRow({
      ...client,
      lines: payload.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
      totalPrice: payload.totalPrice,
      discountAmount: payload.discountAmount,
    });
    setTransactions((prev) => [row, ...prev]);
    setManualEntryDrawerOpen(false);
    setFromDate(null);
    setToDate(null);
    setVisibleCount(INITIAL_VISIBLE);
    setSelected({});
    showSnackbar({
      severity: "success",
      message: `New sale saved for ${client.clientName} — ${row.netAmount} added to transactions.`,
    });
  }, [showSnackbar]);

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
      }
    },
    [closeMoreMenus, openRefundDrawer, openVoidPaymentModal],
  );

  const handleActionExportAction = React.useCallback(
    (actionId: string) => {
      if (actionId === "exportOverview") return;

      if (actionId === "exportInvoiceReceipt") {
        exportInvoiceReceipt();
      }
    },
    [exportInvoiceReceipt],
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

  const openOverviewExportMenu = React.useCallback((el: HTMLElement) => {
    setOverviewExportAnchor(el);
  }, []);

  const handleOverviewExport = React.useCallback(
    async (format: (typeof OVERVIEW_EXPORT_OPTIONS)[number]) => {
      if (rowsToExport.length === 0) {
        closeAddMenus();
        showSnackbar({ severity: "warning", message: "No transactions to export." });
        return;
      }

      const exportFormat = format === "Export Excel" ? "excel" : "pdf";

      try {
        const ok = await downloadTransactionsOverview(rowsToExport, exportFormat);
        closeAddMenus();
        if (ok) {
          showSnackbar({
            severity: "success",
            message: `Downloaded ${rowsToExport.length} transaction${rowsToExport.length === 1 ? "" : "s"} as ${exportFormat === "excel" ? "Excel" : "PDF"}.`,
          });
          return;
        }
        showSnackbar({ severity: "error", message: "Export failed. Please try again." });
      } catch {
        closeAddMenus();
        showSnackbar({ severity: "error", message: `Failed to download ${exportFormat === "excel" ? "Excel" : "PDF"} file.` });
      }
    },
    [closeAddMenus, rowsToExport, showSnackbar],
  );

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
      <TransactionsHeader title="Transactions" subtitle="Manage and track all your bookings and payments." />
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
        {ACTION_MENU_ITEMS.map((opt) =>
          "hasSubmenu" in opt && opt.hasSubmenu ? (
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
              disabled={"requiresSelection" in opt && opt.requiresSelection && selectedCount === 0}
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
        {ACTION_EXPORT_ITEMS.map((opt) =>
          "hasSubmenu" in opt && opt.hasSubmenu ? (
            <MenuItem
              key={opt.id}
              onMouseEnter={(e) => openOverviewExportMenu(e.currentTarget)}
              onClick={(e) => openOverviewExportMenu(e.currentTarget)}
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
              onClick={() => handleActionExportAction(opt.id)}
              sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
            >
              {opt.label}
            </MenuItem>
          ),
        )}
      </Menu>

      <Menu
        anchorEl={overviewExportAnchor}
        open={Boolean(overviewExportAnchor)}
        onClose={() => setOverviewExportAnchor(null)}
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
            minWidth: 168,
            p: 0.5,
          },
        }}
      >
        {OVERVIEW_EXPORT_OPTIONS.map((opt) => (
          <MenuItem
            key={opt}
            onClick={(e) => {
              e.stopPropagation();
              void handleOverviewExport(opt);
            }}
            sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
          >
            <ListItemText primary={opt} />
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
        canLoadMore={canLoadMore}
        onLoadMore={
          canLoadMore
            ? () => setVisibleCount((c) => Math.min(c + INITIAL_VISIBLE, filtered.length))
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
        onClose={() => setManualEntryDrawerOpen(false)}
        onSave={confirmManualEntry}
      />

      <TransactionNoteModal
        open={Boolean(noteModalTransactionId)}
        initialNote={noteModalTransaction?.note ?? ""}
        onClose={() => setNoteModalTransactionId(null)}
        onSave={saveTransactionNote}
        onDelete={noteModalTransaction?.note?.trim() ? deleteTransactionNote : undefined}
      />
    </Paper>
  );
}
