"use client";

import * as React from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  Divider,
  ListItemText,
  ListSubheader,
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

const ADD_ACTION_ITEMS = [
  { id: "voidSales", label: "Void Sales", requiresSelection: true },
  { id: "refund", label: "Refund", requiresSelection: true },
  { id: "manualEntry", label: "Manual entry" },
] as const;

const ADD_EXPORT_ITEMS = [
  { id: "exportInvoiceReceipt", label: "Export Invoice/Receipt" },
  { id: "exportOverview", label: "Export Overview", hasSubmenu: true },
] as const;

const MORE_MENU_OPTIONS = [
  "Void Sales",
  "Refund",
  "Export Invoice/Receipt",
  "Export Overview",
] as const;

const MORE_EXPORT_OPTIONS = new Set<string>(["Export Invoice/Receipt", "Export Overview"]);

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
        const isManual = (r.entryLabel ?? "").toLowerCase().includes("manual");
        const isOnline = method.startsWith("online");
        const isOffline = method.startsWith("offline");
        const ok =
          (entryKeys.includes("entry:manualEntry") && isManual) ||
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
    });
    setTransactions((prev) => [row, ...prev]);
    setManualEntryDrawerOpen(false);
    showSnackbar({
      severity: "success",
      message: `Manual entry added for ${client.clientName} (${row.status}).`,
    });
  }, [showSnackbar]);

  const handleMoreMenuAction = React.useCallback(
    (opt: (typeof MORE_MENU_OPTIONS)[number]) => {
      if (opt === "Void Sales") {
        openVoidPaymentModal();
        return;
      }

      closeMoreMenus();

      if (opt === "Refund") {
        openRefundDrawer();
        return;
      }

      if (rowsToExport.length === 0) {
        showSnackbar({ severity: "warning", message: "No transactions to export." });
        return;
      }

      const filenamePrefix =
        opt === "Export Invoice/Receipt" ? "transactions-invoice-receipt" : "transactions-overview";
      const ok = exportTransactionsToExcel(rowsToExport, filenamePrefix);
      if (ok) {
        const exportLabel = opt === "Export Invoice/Receipt" ? "invoice/receipt" : "overview";
        showSnackbar({
          severity: "success",
          message: `Exported ${rowsToExport.length} transaction${rowsToExport.length === 1 ? "" : "s"} (${exportLabel}) to Excel.`,
        });
      }
    },
    [closeMoreMenus, openRefundDrawer, openVoidPaymentModal, rowsToExport, selectedCount, showSnackbar],
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

  const addMenuHeadingSx = React.useMemo(
    () => ({
      lineHeight: 1.3,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      color: alpha(m.navy, 0.42),
      bgcolor: "transparent",
      pointerEvents: "none" as const,
    }),
    [m.navy],
  );

  const handleAddMenuAction = React.useCallback(
    (actionId: string) => {
      if (actionId === "exportOverview") return;

      closeAddMenus();

      if (actionId === "voidSales") {
        openVoidPaymentModal();
        return;
      }

      if (actionId === "refund") {
        openRefundDrawer();
        return;
      }

      if (actionId === "manualEntry") {
        openManualEntryDrawer();
        return;
      }

      if (actionId === "exportInvoiceReceipt") {
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
      }
    },
    [closeAddMenus, openManualEntryDrawer, openRefundDrawer, openVoidPaymentModal, rowsToExport, selectedCount, showSnackbar],
  );

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
        <ListSubheader disableSticky sx={addMenuHeadingSx}>
          Actions
        </ListSubheader>
        {ADD_ACTION_ITEMS.map((opt) => (
          <MenuItem
            key={opt.id}
            disabled={multipleSelected && "requiresSelection" in opt && opt.requiresSelection}
            onClick={() => handleAddMenuAction(opt.id)}
            sx={addMenuItemSx}
          >
            {opt.label}
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5, borderColor: alpha(m.navy, 0.08) }} />
        <ListSubheader disableSticky sx={addMenuHeadingSx}>
          Export
        </ListSubheader>
        {ADD_EXPORT_ITEMS.map((opt) =>
          opt.hasSubmenu ? (
            <MenuItem
              key={opt.id}
              onMouseEnter={(e) => openOverviewExportMenu(e.currentTarget)}
              onClick={(e) => openOverviewExportMenu(e.currentTarget)}
              sx={{
                ...addMenuItemSx,
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              {opt.label}
              <ChevronRightRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
            </MenuItem>
          ) : (
            <MenuItem key={opt.id} onClick={() => handleAddMenuAction(opt.id)} sx={addMenuItemSx}>
              {opt.label}
            </MenuItem>
          ),
        )}
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
        {MORE_MENU_OPTIONS.map((opt) => (
          <MenuItem
            key={opt}
            disabled={multipleSelected && !MORE_EXPORT_OPTIONS.has(opt)}
            onClick={() => handleMoreMenuAction(opt)}
            sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
          >
            {opt}
          </MenuItem>
        ))}
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
    </Paper>
  );
}
