"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureSectionTitleSx,
  mollureLabelSx,
  mollureBodySx,
  mollureBodyMutedSx,
} from "../../../../theme/mollureHierarchy";
import {
  AppButton,
  AppMultiSelect,
  AppPagination,
  AppSearchField,
  AppSelect,
  AppTextField,
} from "../../../common";
import AppModal from "../../../common/AppModal";
import AdminFilterDateRange from "../../AdminFilterDateRange";
import AdminFilterField from "../../AdminFilterField";
import AdminPageHeader from "../../AdminPageHeader";
import AdminSectionCard from "../../AdminSectionCard";
import AdminDataTable, {
  AdminSummaryGrid,
  type AdminTableColumn,
} from "../../AdminDataTable";
import {
  type MockClient,
} from "../../adminMockData";
import { ADMIN_CARD_PADDING as pad } from "../../adminCardPadding";
import {
  CC_PURPLE,
  CC_PURPLE_SOFT,
  CLIENT_TYPE_OPTIONS,
  formatDisplayDate,
  getInitials,
  SORT_OPTIONS,
  STATUS_STYLES,
} from "./adminClients.data";
import type { ClientRowActionsProps, SortOption } from "./adminClients.types";
import { useAdminClientsPage } from "./useAdminClientsPage";

function ClientTypeCell({ type }: { type: MockClient["type"] }) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const isIC = type === "IC";

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: isIC ? tokens.mintSoft : CC_PURPLE_SOFT,
          color: isIC ? tokens.tealDark : CC_PURPLE,
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {type}
      </Box>
      <Typography sx={mollureBodyMutedSx(tokens.navy, { fontWeight: 500, color: tokens.navy })}>
        {isIC ? "Individual Client" : "Company Client"}
      </Typography>
    </Stack>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack spacing={0.35}>
      <Typography
        sx={mollureLabelSx(tokens.navy, { fontSize: 11, fontWeight: 600, color: tokens.slate, textTransform: "uppercase", letterSpacing: "0.04em" })}
      >
        {label}
      </Typography>
      <Typography sx={mollureBodySx(tokens.navy, { color: tokens.navy })}>{value}</Typography>
    </Stack>
  );
}

function ClientRowActions({
  client,
  onView,
  onToggleStatus,
  onDelete,
  onNote,
}: ClientRowActionsProps) {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const menuItemSx = { fontSize: 13, py: 1, gap: 1.25, color: tokens.navy };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Client actions"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreVertRoundedIcon sx={{ fontSize: 20, color: tokens.slate }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 180,
              borderRadius: 2,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "0 12px 40px rgba(16, 35, 63, 0.12)",
            },
          },
        }}
      >
        <MenuItem
          sx={menuItemSx}
          onClick={() => {
            setAnchorEl(null);
            onView();
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: 18, color: tokens.slate }} />
          View Details
        </MenuItem>
        {client.accountStatus !== "deleted" ? (
          <MenuItem
            sx={{
              ...menuItemSx,
              color:
                client.accountStatus === "disabled"
                  ? tokens.tealDark
                  : tokens.requestAccent,
            }}
            onClick={() => {
              setAnchorEl(null);
              onToggleStatus();
            }}
          >
            <BlockOutlinedIcon sx={{ fontSize: 18 }} />
            {client.accountStatus === "disabled"
              ? "Enable Client"
              : "Disable Client"}
          </MenuItem>
        ) : null}
        {client.accountStatus !== "deleted" ? (
          <MenuItem
            sx={{ ...menuItemSx, color: "#B42318" }}
            onClick={() => {
              setAnchorEl(null);
              onDelete();
            }}
          >
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
            Delete Client
          </MenuItem>
        ) : null}
        <MenuItem
          sx={menuItemSx}
          onClick={() => {
            setAnchorEl(null);
            onNote();
          }}
        >
          <NoteAddOutlinedIcon sx={{ fontSize: 18, color: tokens.slate }} />
          {client.note?.trim() ? "Edit Note" : "Add Note"}
        </MenuItem>
      </Menu>
    </>
  );
}

export default function AdminClientsPageView() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const {
    activeClient,
    allPageSelected,
    ccPct,
    clearSelection,
    clientHasNote,
    closeModal,
    displayed,
    draftNote,
    exportMenuAnchor,
    exportMenuOpen,
    exportNotice,
    filtered,
    handleApplyDelete,
    handleApplyStatus,
    handleExportExcel,
    handleExportPdf,
    handleLoadMore,
    handleSaveNote,
    icPct,
    isDisabling,
    modal,
    mounted,
    openClientModal,
    page,
    pageCount,
    regDateFrom,
    regDateTo,
    resetFilters,
    search,
    selected,
    setDraftNote,
    setExportMenuAnchor,
    setPage,
    setRegDateFrom,
    setRegDateTo,
    setSearch,
    setSortBy,
    setStatusFilter,
    setTypeFilter,
    showLoadMore,
    showPagination,
    showingFrom,
    showingTo,
    somePageSelected,
    sortBy,
    statusFilter,
    toggleSelect,
    toggleSelectAll,
    totalBookings,
    totalCC,
    totalClients,
    totalIC,
    typeFilter,
  } = useAdminClientsPage();

  const columns: AdminTableColumn<MockClient>[] = [
    {
      id: "select",
      label: (
        <Checkbox
          size="small"
          checked={allPageSelected}
          indeterminate={somePageSelected}
          onChange={toggleSelectAll}
        />
      ),
      minWidth: 44,
      render: (r) => (
        <Checkbox
          size="small"
          checked={selected.has(r.id)}
          onChange={() => toggleSelect(r.id)}
        />
      ),
    },
    {
      id: "date",
      label: "Registration Date",
      minWidth: 130,
      render: (r) => (
        <Stack spacing={0.25}>
          <Typography
            sx={mollureBodyMutedSx(tokens.navy, { fontWeight: 500, color: tokens.navy })}
          >
            {formatDisplayDate(r.registrationDate)}
          </Typography>
          <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText })}>
            {r.registrationTime}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "details",
      label: "Client Details",
      minWidth: 220,
      render: (r) => (
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Avatar
            src={r.avatarUrl}
            sx={{
              width: 36,
              height: 36,
              bgcolor:
                r.type === "IC" ? alpha(tokens.teal, 0.14) : CC_PURPLE_SOFT,
              color: r.type === "IC" ? tokens.tealDark : CC_PURPLE,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {getInitials(r.name)}
          </Avatar>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              sx={mollureLabelSx(tokens.navy, { fontWeight: 600, color: tokens.navy })}
            >
              {r.name}
            </Typography>
            <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText })}>
              {r.email}
            </Typography>
            <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText })}>
              {r.phone}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "type",
      label: "Client Type",
      minWidth: 160,
      render: (r) => <ClientTypeCell type={r.type} />,
    },
    {
      id: "lastBooking",
      label: "Last Completed Booking",
      minWidth: 150,
      render: (r) => (
        <Stack spacing={0.25}>
          <Typography
            sx={mollureBodyMutedSx(tokens.navy, { fontWeight: 500, color: tokens.navy })}
          >
            {formatDisplayDate(r.lastBookingDate)}
          </Typography>
          <Typography sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, color: tokens.bodyText })}>
            {r.lastBookingTime}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "status",
      label: "Account Status",
      render: (r) => {
        const s = STATUS_STYLES[r.accountStatus];
        return (
          <Box
            sx={{
              display: "inline-flex",
              px: 1.25,
              py: 0.35,
              borderRadius: 999,
              bgcolor: s.bg,
              color: s.fg,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {s.label}
          </Box>
        );
      },
    },
    {
      id: "notes",
      label: "Notes",
      align: "center",
      render: (r) =>
        clientHasNote(r) ? (
          <IconButton
            size="small"
            aria-label="View notes"
            onClick={() => openClientModal(r, "note")}
          >
            <ChatBubbleOutlineOutlinedIcon
              sx={{ fontSize: 18, color: tokens.teal }}
            />
          </IconButton>
        ) : (
          <Box sx={{ width: 34, height: 34 }} />
        ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: (r) => (
        <ClientRowActions
          client={r}
          onView={() => openClientModal(r, "view")}
          onToggleStatus={() => openClientModal(r, "disable")}
          onDelete={() => openClientModal(r, "delete")}
          onNote={() => openClientModal(r, "note")}
        />
      ),
    },
  ];

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ mb: 1.5 }}
      >
        <Typography
          component={Link}
          href="/admin/dashboard"
          sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText, textDecoration: "none", "&:hover": { color: tokens.teal } })}
        >
          Home
        </Typography>
        <Typography sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText })}>/</Typography>
        <Typography sx={mollureBodyMutedSx(tokens.navy, { fontWeight: 500, color: tokens.navy })}>
          Client Management
        </Typography>
      </Stack>

      <AdminPageHeader
        title="Client Management"
        description="View and manage all individual and company clients."
      />

      <AdminSectionCard noPadding sx={{ mb: 2.5 }}>
        <Stack spacing={2} sx={{ px: pad.bodyCompact, py: 1.75 }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            useFlexGap
            alignItems={{ xs: "stretch", lg: "flex-end" }}
            sx={{ gap: 1.5 }}
          >
            <AdminFilterField label="Search by">
              <AppSearchField
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onClear={() => {
                  setSearch("");
                }}
                size="small"
                fullWidth
                sx={{ minWidth: 0, height: 40 }}
              />
            </AdminFilterField>

            <AdminFilterField label="Client Type">
              <AppMultiSelect
                options={CLIENT_TYPE_OPTIONS}
                value={typeFilter}
                onChange={(values) => {
                  setTypeFilter(values);
                }}
                placeholder="All (IC, CC)"
                size="small"
                sx={{ width: "100%", minWidth: 0, height: 40 }}
              />
            </AdminFilterField>

            <AdminFilterField label="Registration date">
              <AdminFilterDateRange
                start={regDateFrom}
                end={regDateTo}
                onChange={(start, end) => {
                  setRegDateFrom(start);
                  setRegDateTo(end);
                }}
                minWidth={0}
              />
            </AdminFilterField>

            <AdminFilterField label="Account Status">
              <AppSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                size="small"
                fullWidth
                sx={{ minWidth: 0, height: 40 }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                  { value: "deleted", label: "Deleted" },
                ]}
              />
            </AdminFilterField>

            <AppButton
              variant="text"
              startIcon={<RefreshOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={resetFilters}
              sx={{
                textTransform: "none",
                color: tokens.teal,
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: "nowrap",
                alignSelf: { xs: "flex-start", lg: "flex-end" },
                height: 40,
                flexShrink: 0,
                flexGrow: 0,
                minWidth: "fit-content",
                px: 1,
                ml: { lg: 0.5 },
              }}
            >
              Reset Filters
            </AppButton>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
            justifyContent="space-between"
            sx={{
              pt: 1.5,
              borderTop: `1px solid ${tokens.cardBorder}`,
            }}
          >
            <AdminFilterField label="Sort by">
              <AppSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 280 }, height: 40 }}
                options={SORT_OPTIONS}
              />
            </AdminFilterField>

            <Box sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}>
              <AppButton
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                endIcon={
                  <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />
                }
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={filtered.length === 0}
                sx={{
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  height: 40,
                }}
              >
                Export
              </AppButton>
              <Menu
                anchorEl={exportMenuAnchor}
                open={exportMenuOpen}
                onClose={() => setExportMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 0.75,
                      minWidth: 168,
                      borderRadius: 2,
                      border: `1px solid ${tokens.cardBorder}`,
                      boxShadow: "0 12px 40px rgba(16, 35, 63, 0.12)",
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={handleExportPdf}
                  sx={{ fontSize: 13, gap: 1.25 }}
                >
                  <PictureAsPdfOutlinedIcon
                    sx={{ fontSize: 18, color: tokens.slate }}
                  />
                  Export as PDF
                </MenuItem>
                <MenuItem
                  onClick={handleExportExcel}
                  sx={{ fontSize: 13, gap: 1.25 }}
                >
                  <TableChartOutlinedIcon
                    sx={{ fontSize: 18, color: tokens.slate }}
                  />
                  Export as Excel
                </MenuItem>
              </Menu>
            </Box>
          </Stack>

          {exportNotice ? (
            <Typography
              sx={mollureBodyMutedSx(tokens.navy, { fontWeight: 500, color: tokens.tealDark })}
            >
              {exportNotice}
            </Typography>
          ) : null}
        </Stack>
      </AdminSectionCard>

      <AdminSectionCard noPadding>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{
            px: pad.tableCellX,
            py: 1.5,
            borderBottom: `1px solid ${tokens.cardBorder}`,
          }}
        >
          <Typography
            sx={mollureLabelSx(tokens.navy, { fontWeight: 600, color: tokens.navy })}
          >
            Total Clients:{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {filtered.length.toLocaleString()}
            </Box>
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText })}>
              {selected.size} selected
            </Typography>
            {selected.size > 0 ? (
              <Typography
                component="button"
                onClick={clearSelection}
                sx={mollureLabelSx(tokens.navy, { fontWeight: 600, border: 0, bgcolor: "transparent", cursor: "pointer", color: tokens.teal, p: 0, "&:hover": { textDecoration: "underline" } })}
              >
                Clear
              </Typography>
            ) : null}
          </Stack>
        </Stack>

        <AdminDataTable
          columns={columns}
          rows={displayed}
          getRowId={(r) => r.id}
        />

        {showLoadMore ? (
          <Box
            sx={{
              px: pad.tableCellX,
              py: 2,
              borderTop: `1px solid ${tokens.cardBorder}`,
              textAlign: "center",
            }}
          >
            <AppButton
              variant="outlined"
              onClick={handleLoadMore}
              sx={{ textTransform: "none", minWidth: 140 }}
            >
              Load more
            </AppButton>
          </Box>
        ) : null}

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{
            px: pad.tableCellX,
            py: 1.75,
            borderTop: `1px solid ${tokens.cardBorder}`,
          }}
        >
          <Typography sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText })}>
            Showing {showingFrom.toLocaleString()} to{" "}
            {showingTo.toLocaleString()} of {filtered.length.toLocaleString()}{" "}
            results
          </Typography>
          {showPagination ? (
            <AppPagination
              page={page}
              count={pageCount}
              onChange={(_, p) => setPage(p)}
              sx={{
                "& .MuiPagination-ul": {
                  flexWrap: "nowrap",
                  justifyContent: { xs: "center", md: "flex-end" },
                },
              }}
            />
          ) : null}
        </Stack>
      </AdminSectionCard>

      <AdminSectionCard title="Client Summary" sx={{ mt: 2.5 }}>
        <AdminSummaryGrid
          embedded
          items={[
            {
              label: "Total Individual Clients (IC)",
              value: totalIC,
              sub: `${icPct}% of total`,
              icon: PersonOutlineOutlinedIcon,
              iconBg: tokens.mintSoft,
              iconColor: tokens.tealDark,
              labelColor: tokens.tealDark,
              cardBg: alpha(tokens.teal, 0.04),
            },
            {
              label: "Total Company Clients (CC)",
              value: totalCC,
              sub: `${ccPct}% of total`,
              icon: BusinessOutlinedIcon,
              iconBg: CC_PURPLE_SOFT,
              iconColor: CC_PURPLE,
              labelColor: CC_PURPLE,
              cardBg: alpha(CC_PURPLE, 0.05),
            },
            {
              label: "Total Clients (IC + CC)",
              value: totalClients,
              sub: "100% of total",
              icon: GroupsOutlinedIcon,
              iconBg: alpha("#0284C7", 0.12),
              iconColor: "#0284C7",
              labelColor: "#0284C7",
              cardBg: alpha("#0284C7", 0.05),
            },
            {
              label: "Total Completed Bookings",
              value: totalBookings,
              sub: "This Year",
              icon: EventAvailableOutlinedIcon,
              iconBg: tokens.warmwarning,
              iconColor: tokens.requestAccent,
              labelColor: tokens.requestAccent,
              cardBg: alpha(tokens.requestAccent, 0.06),
            },
          ]}
        />
      </AdminSectionCard>

      <Typography
        sx={mollureBodyMutedSx(tokens.navy, { fontSize: 11, textAlign: "center", color: tokens.slate, mt: 2.5, pb: 1 })}
      >
        Â© 2025 Molur. All rights reserved.
      </Typography>

      {mounted ? (
        <>
          <AppModal
            open={modal === "view" && Boolean(activeClient)}
            onClose={closeModal}
            title="Client details"
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <AppButton
                    variant="outlined"
                    onClick={closeModal}
                    sx={{ textTransform: "none" }}
                  >
                    Close
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            {activeClient ? (
              <Stack spacing={2} sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor:
                        activeClient.type === "IC"
                          ? alpha(tokens.teal, 0.14)
                          : CC_PURPLE_SOFT,
                      color:
                        activeClient.type === "IC"
                          ? tokens.tealDark
                          : CC_PURPLE,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(activeClient.name)}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={mollureSectionTitleSx(tokens.navy, { fontWeight: 600, color: tokens.navy })}
                    >
                      {activeClient.name}
                    </Typography>
                    <ClientTypeCell type={activeClient.type} />
                  </Box>
                </Stack>
                <DetailRow label="Email" value={activeClient.email} />
                <DetailRow label="Phone" value={activeClient.phone} />
                <DetailRow
                  label="Registration"
                  value={`${formatDisplayDate(activeClient.registrationDate)}, ${activeClient.registrationTime}`}
                />
                <DetailRow
                  label="Last completed booking"
                  value={`${formatDisplayDate(activeClient.lastBookingDate)}, ${activeClient.lastBookingTime}`}
                />
                <DetailRow
                  label="Account status"
                  value={STATUS_STYLES[activeClient.accountStatus].label}
                />
                {activeClient.contactPerson ? (
                  <DetailRow
                    label="Contact person"
                    value={activeClient.contactPerson}
                  />
                ) : null}
                {activeClient.birthdate ? (
                  <DetailRow label="Birthdate" value={activeClient.birthdate} />
                ) : null}
                {activeClient.gender ? (
                  <DetailRow label="Gender" value={activeClient.gender} />
                ) : null}
                {activeClient.note?.trim() ? (
                  <DetailRow label="Note" value={activeClient.note} />
                ) : null}
              </Stack>
            ) : null}
          </AppModal>

          <AppModal
            open={modal === "disable" && Boolean(activeClient)}
            onClose={closeModal}
            title={isDisabling ? "Disable client" : "Enable client"}
            maxWidth="sm"
            fullWidth
            headerTone={isDisabling ? "danger" : "default"}
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton
                    tone="secondary"
                    onClick={closeModal}
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    variant="contained"
                    onClick={handleApplyStatus}
                    sx={{ textTransform: "none", minWidth: 120 }}
                  >
                    Apply
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon
                sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
              />
              <Typography
                sx={mollureBodySx(tokens.navy, { fontSize: 14, color: alpha(tokens.navy, 0.88), lineHeight: 1.55 })}
              >
                {isDisabling
                  ? `Are you sure you want to disable ${activeClient?.name}? They will no longer be able to book services.`
                  : `Are you sure you want to re-enable ${activeClient?.name}? They will regain access to booking.`}
              </Typography>
            </Box>
          </AppModal>

          <AppModal
            open={modal === "delete" && Boolean(activeClient)}
            onClose={closeModal}
            title="Delete client"
            maxWidth="sm"
            fullWidth
            headerTone="danger"
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton
                    tone="secondary"
                    onClick={closeModal}
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    tone="danger"
                    onClick={handleApplyDelete}
                    sx={{ minWidth: 120 }}
                  >
                    Apply
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon
                sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
              />
              <Typography
                sx={mollureBodySx(tokens.navy, { fontSize: 14, color: alpha(tokens.navy, 0.88), lineHeight: 1.55 })}
              >
                Are you sure you want to delete {activeClient?.name}? This will
                permanently remove the client from the list.
              </Typography>
            </Box>
          </AppModal>

          <AppModal
            open={modal === "note" && Boolean(activeClient)}
            onClose={closeModal}
            title={activeClient?.note?.trim() ? "Client note" : "Add note"}
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
                  <AppButton tone="secondary" onClick={closeModal}>
                    Cancel
                  </AppButton>
                  <AppButton tone="primary" onClick={handleSaveNote}>
                    Save note
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              <Typography sx={mollureBodyMutedSx(tokens.navy, { color: tokens.bodyText })}>
                {activeClient?.name}
              </Typography>
              <AppTextField
                label="Note"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                multiline
                minRows={4}
                fullWidth
                placeholder="Add internal notes about this client..."
              />
            </Stack>
          </AppModal>
        </>
      ) : null}
    </>
  );
}
