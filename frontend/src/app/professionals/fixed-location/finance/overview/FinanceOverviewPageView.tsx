"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Menu, MenuItem, Paper } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import CancelPendingPaymentModal from "../../../../../components/sections/finance/CancelPendingPaymentModal";
import ManualEntryDrawer from "../../../../../components/sections/finance/ManualEntryDrawer";
import RefundSalesDrawer from "../../../../../components/sections/finance/RefundSalesDrawer";
import TransactionNoteModal from "../../../../../components/sections/finance/TransactionNoteModal";
import FinanceFiltersDrawerView from "../../../../../components/sections/finance/FinanceFiltersDrawerView";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import { useProfessionalBusinessOverride } from "../../../../../components/common/finance-documents";
import TransactionsHeader from "../../../../../components/sections/finance/TransactionsHeader";
import TransactionsTable from "../../../../../components/sections/finance/TransactionsTable";
import TransactionsToolbar from "../../../../../components/sections/finance/TransactionsToolbar";
import {
  ADD_MENU_ITEMS,
  ACTION_EXPORT_ITEMS,
  INITIAL_VISIBLE,
} from "./overview.data";
import { useFinanceOverviewPage } from "./useFinanceOverviewPage";

export default function FinanceOverviewPageView() {
  const {
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
  } = useFinanceOverviewPage();
  const professionalBusinessOverride = useProfessionalBusinessOverride();

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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
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
              <ChevronRightRoundedIcon
                sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }}
              />
            </MenuItem>
          ) : (
            <MenuItem
              key={opt.id}
              disabled={opt.requiresSelection && selectedCount === 0}
              onClick={() => handleActionMenuAction(opt.id)}
              sx={{
                borderRadius: "8px",
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.75),
                my: 0.25,
              }}
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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
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
            sx={{
              borderRadius: "8px",
              fontSize: 12.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.75),
              my: 0.25,
            }}
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
        onOpenDocument={(row, documentType) =>
          setActiveDocument({ row, documentType })
        }
        onOpenNote={(row) => openNoteModal(row.id)}
        onEntryClick={(row) => {
          if (row.bookingId) {
            router.push(
              `/professionals/calendar?booking=${encodeURIComponent(row.bookingId)}`,
            );
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
        professionalBusinessOverride={professionalBusinessOverride}
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
        onDelete={
          noteModalTransaction?.note?.trim() ? deleteTransactionNote : undefined
        }
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
