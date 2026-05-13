"use client";

import * as React from "react";
import {
  Box,
  Menu,
  MenuItem,
  Paper,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import { mockTransactions, type TransactionRow } from "../data/transactions";
import FinanceFiltersDrawerView, { type FinanceFiltersValue } from "../../../../../components/sections/finance/FinanceFiltersDrawerView";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import TransactionsHeader from "../../../../../components/sections/finance/TransactionsHeader";
import TransactionsTable from "../../../../../components/sections/finance/TransactionsTable";
import TransactionsToolbar from "../../../../../components/sections/finance/TransactionsToolbar";
import { useFinanceInvoiceSettings } from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import { useGetProfileQuery } from "../../../../../store/services/profileApi";

const INITIAL_VISIBLE = 4;

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

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [addAnchor, setAddAnchor] = React.useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = React.useState<null | HTMLElement>(null);
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

    return mockTransactions.filter((r) => {
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

      // Client type group (mock data only has `member`)
      if (clientKeys.length) {
        const isMollure = Boolean(r.member);
        const isNonMollure = !isMollure;
        const ok =
          (clientKeys.includes("client:mollure") && isMollure) ||
          (clientKeys.includes("client:nonMollure") && isNonMollure) ||
          // Fallback: treat IC/CC as non-mollure until we have real type
          ((clientKeys.includes("client:ic") || clientKeys.includes("client:cc")) && isNonMollure);
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

      // Payment status group (map to our mock statuses)
      if (statusKeys.length) {
        const ok =
          (statusKeys.includes("status:paid") && r.status === "Paid") ||
          (statusKeys.includes("status:pending") && r.status === "Unpaid") ||
          (statusKeys.includes("status:failed") && r.status === "Refunded") ||
          // Reasonable fallback for "Prepaid" with current mock data
          (statusKeys.includes("status:prepaid") && r.status === "Paid");
        if (!ok) return false;
      }

      return true;
    });
  }, [query, filtersValue, fromDate, toDate]);

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
  const someVisibleSelected = visibleRows.some((r) => selected[r.id]);

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
        onClose={() => setAddAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
            mt: 0.75,
            minWidth: 180,
            p: 0.5,
          },
        }}
      >
        {["Record payment", "Manual entry", "Import"].map((opt) => (
          <MenuItem
            key={opt}
            onClick={() => setAddAnchor(null)}
            sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
          >
            {opt}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
            mt: 0.75,
            minWidth: 160,
            p: 0.5,
          },
        }}
      >
        {["Export", "Print summary"].map((opt) => (
          <MenuItem
            key={opt}
            onClick={() => setMoreAnchor(null)}
            sx={{ borderRadius: "8px", fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75), my: 0.25 }}
          >
            {opt}
          </MenuItem>
        ))}
      </Menu>

      <TransactionsTable
        rows={visibleRows}
        selected={selected}
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
    </Paper>
  );
}
