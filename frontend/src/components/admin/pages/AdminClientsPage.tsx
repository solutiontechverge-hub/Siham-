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
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
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
import { AppButton, AppMultiSelect, AppPagination, AppSearchField, AppSelect, AppTextField } from "../../common";
import MollureModal from "../../common/MollureModal";
import AdminFilterDateRange from "../AdminFilterDateRange";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { AdminSummaryGrid, type AdminTableColumn } from "../AdminDataTable";
import {
  clientManagementSummary,
  mockClients,
  type MockClient,
} from "../adminMockData";
import { exportClientsToExcel } from "../exportClientsExcel";
import { exportClientsToPdf } from "../exportClientsPdf";
import { ADMIN_CARD_PADDING as pad } from "../adminCardPadding";

type SortOption = "reg_desc" | "reg_asc" | "booking_desc" | "booking_asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "reg_desc", label: "Registration date (newest first)" },
  { value: "reg_asc", label: "Registration date (oldest first)" },
  { value: "booking_desc", label: "Last completed booking (newest first)" },
  { value: "booking_asc", label: "Last completed booking (oldest first)" },
];

const CLIENT_TYPE_OPTIONS = [
  { value: "IC", label: "Individual (IC)" },
  { value: "CC", label: "Company (CC)" },
];

const STATUS_STYLES: Record<
  MockClient["accountStatus"],
  { bg: string; fg: string; label: string }
> = {
  active: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "Active" },
  disabled: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803", label: "Disabled" },
  deleted: { bg: "rgba(240, 68, 56, 0.12)", fg: "#B42318", label: "Deleted" },
};

const CC_PURPLE = "#6941C6";
const CC_PURPLE_SOFT = "rgba(127, 86, 217, 0.12)";
const INITIAL_VISIBLE = 5;
const PAGE_SIZE = 10;

type ClientModal = "view" | "disable" | "delete" | "note" | null;

type ClientRowActionsProps = {
  client: MockClient;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onNote: () => void;
};

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: tokens.navy }}>
        {isIC ? "Individual Client" : "Company Client"}
      </Typography>
    </Stack>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, lineHeight: 1.2 }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack spacing={0.35}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tokens.navy }}>{value}</Typography>
    </Stack>
  );
}

function ClientRowActions({ client, onView, onToggleStatus, onDelete, onNote }: ClientRowActionsProps) {
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
              color: client.accountStatus === "disabled" ? tokens.tealDark : tokens.requestAccent,
            }}
            onClick={() => {
              setAnchorEl(null);
              onToggleStatus();
            }}
          >
            <BlockOutlinedIcon sx={{ fontSize: 18 }} />
            {client.accountStatus === "disabled" ? "Enable Client" : "Disable Client"}
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

export default function AdminClientsPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  const [clients, setClients] = React.useState<MockClient[]>(mockClients);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [regDateFrom, setRegDateFrom] = React.useState("");
  const [regDateTo, setRegDateTo] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("reg_desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE);
  const [usePagination, setUsePagination] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [modal, setModal] = React.useState<ClientModal>(null);
  const [activeClient, setActiveClient] = React.useState<MockClient | null>(null);
  const [draftNote, setDraftNote] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const exportMenuOpen = Boolean(exportMenuAnchor);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resetListView = React.useCallback(() => {
    setVisibleCount(INITIAL_VISIBLE);
    setUsePagination(false);
    setPage(1);
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients
      .filter((c) => {
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q);
        const matchesType = typeFilter.length === 0 || typeFilter.includes(c.type);
        const matchesStatus = statusFilter === "all" || c.accountStatus === statusFilter;
        const matchesFrom = !regDateFrom || c.registrationDate >= regDateFrom;
        const matchesTo = !regDateTo || c.registrationDate <= regDateTo;
        return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        const field = sortBy.startsWith("reg") ? "registrationDate" : "lastBookingDate";
        const cmp = a[field].localeCompare(b[field]);
        return sortBy.endsWith("_desc") ? -cmp : cmp;
      });
  }, [clients, search, typeFilter, statusFilter, regDateFrom, regDateTo, sortBy]);

  React.useEffect(() => {
    resetListView();
  }, [search, typeFilter, statusFilter, regDateFrom, regDateTo, sortBy, resetListView]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const displayed = React.useMemo(() => {
    if (usePagination) {
      const start = (page - 1) * PAGE_SIZE;
      return filtered.slice(start, start + PAGE_SIZE);
    }
    return filtered.slice(0, visibleCount);
  }, [filtered, usePagination, page, visibleCount]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const showLoadMore = !usePagination && visibleCount === INITIAL_VISIBLE && filtered.length > INITIAL_VISIBLE;
  const showPagination = usePagination && filtered.length > PAGE_SIZE;

  const showingFrom = filtered.length === 0 ? 0 : usePagination ? (page - 1) * PAGE_SIZE + 1 : 1;
  const showingTo = usePagination
    ? Math.min(page * PAGE_SIZE, filtered.length)
    : Math.min(visibleCount, filtered.length);

  const openClientModal = (client: MockClient, type: ClientModal) => {
    setActiveClient(client);
    setModal(type);
    if (type === "note") setDraftNote(client.note ?? "");
  };

  const closeModal = () => {
    setModal(null);
    setActiveClient(null);
    setDraftNote("");
  };

  const updateClient = (id: string, patch: Partial<MockClient>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setActiveClient((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const handleLoadMore = () => {
    setVisibleCount(PAGE_SIZE);
    if (filtered.length > PAGE_SIZE) {
      setUsePagination(true);
      setPage(1);
    }
  };

  const handleApplyStatus = () => {
    if (!activeClient || activeClient.accountStatus === "deleted") return;
    const nextStatus = activeClient.accountStatus === "active" ? "disabled" : "active";
    updateClient(activeClient.id, { accountStatus: nextStatus });
    closeModal();
  };

  const handleApplyDelete = () => {
    if (!activeClient) return;
    updateClient(activeClient.id, { accountStatus: "deleted" });
    closeModal();
  };

  const handleSaveNote = () => {
    if (!activeClient) return;
    const trimmed = draftNote.trim();
    updateClient(activeClient.id, {
      note: trimmed,
      hasNotes: Boolean(trimmed),
    });
    closeModal();
  };

  const clientHasNote = (client: MockClient) => Boolean(client.note?.trim() || client.hasNotes);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = displayed.map((r) => r.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const resetFilters = () => {
    setSearch("");
    setTypeFilter([]);
    setStatusFilter("all");
    setRegDateFrom("");
    setRegDateTo("");
    setSortBy("reg_desc");
    resetListView();
  };

  const handleExportExcel = () => {
    const ok = exportClientsToExcel(filtered, "client-management");
    setExportNotice(
      ok
        ? `Exported ${filtered.length} client${filtered.length === 1 ? "" : "s"} to Excel.`
        : "No clients to export for the current filters."
    );
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    const ok = await exportClientsToPdf(filtered, "client-management");
    setExportNotice(
      ok
        ? `Exported ${filtered.length} client${filtered.length === 1 ? "" : "s"} to PDF.`
        : "No clients to export for the current filters."
    );
    setExportMenuAnchor(null);
  };

  React.useEffect(() => {
    if (!exportNotice) return;
    const timer = window.setTimeout(() => setExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  const allPageSelected =
    displayed.length > 0 && displayed.every((r) => selected.has(r.id));
  const somePageSelected = displayed.some((r) => selected.has(r.id)) && !allPageSelected;

  const isDisabling = activeClient?.accountStatus === "active";

  const { totalIC, totalCC, totalClients, totalBookings } = clientManagementSummary;
  const icPct = ((totalIC / totalClients) * 100).toFixed(1);
  const ccPct = ((totalCC / totalClients) * 100).toFixed(1);

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
        <Checkbox size="small" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
      ),
    },
    {
      id: "date",
      label: "Registration Date",
      minWidth: 130,
      render: (r) => (
        <Stack spacing={0.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: tokens.navy }}>
            {formatDisplayDate(r.registrationDate)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.registrationTime}</Typography>
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
              bgcolor: r.type === "IC" ? alpha(tokens.teal, 0.14) : CC_PURPLE_SOFT,
              color: r.type === "IC" ? tokens.tealDark : CC_PURPLE,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {getInitials(r.name)}
          </Avatar>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>{r.name}</Typography>
            <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.email}</Typography>
            <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.phone}</Typography>
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
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: tokens.navy }}>
            {formatDisplayDate(r.lastBookingDate)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.lastBookingTime}</Typography>
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
            <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18, color: tokens.teal }} />
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
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
        <Typography
          component={Link}
          href="/admin/dashboard"
          sx={{ fontSize: 12, color: tokens.bodyText, textDecoration: "none", "&:hover": { color: tokens.teal } }}
        >
          Home
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>/</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}>Client Management</Typography>
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
            alignItems={{ lg: "flex-end" }}
          >
            <FilterField label="Search by">
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
                sx={{ minWidth: { lg: 280 } }}
              />
            </FilterField>

            <FilterField label="Client Type">
              <AppMultiSelect
                options={CLIENT_TYPE_OPTIONS}
                value={typeFilter}
                onChange={(values) => {
                  setTypeFilter(values);
                }}
                placeholder="All (IC, CC)"
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 170 } }}
              />
            </FilterField>

            <FilterField label="Registration date">
              <AdminFilterDateRange
                start={regDateFrom}
                end={regDateTo}
                onChange={(start, end) => {
                  setRegDateFrom(start);
                  setRegDateTo(end);
                }}
                minWidth={{ xs: "100%", sm: 260 }}
              />
            </FilterField>

            <FilterField label="Account Status">
              <AppSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                  { value: "deleted", label: "Deleted" },
                ]}
              />
            </FilterField>

            <AppButton
              variant="text"
              startIcon={<RefreshOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={resetFilters}
              sx={{
                textTransform: "none",
                color: tokens.bodyText,
                fontWeight: 500,
                fontSize: 13,
                whiteSpace: "nowrap",
                alignSelf: { xs: "flex-start", lg: "flex-end" },
                mb: { lg: 0.25 },
              }}
            >
              reset filters
            </AppButton>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{
              pt: 1.5,
              borderTop: `1px solid ${tokens.cardBorder}`,
            }}
          >
            <FilterField label="Sort by">
              <AppSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 320 } }}
                options={SORT_OPTIONS}
              />
            </FilterField>

            <Box>
              <AppButton
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                endIcon={<KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={filtered.length === 0}
                sx={{ textTransform: "none", whiteSpace: "nowrap" }}
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
                <MenuItem onClick={handleExportPdf} sx={{ fontSize: 13, gap: 1.25 }}>
                  <PictureAsPdfOutlinedIcon sx={{ fontSize: 18, color: tokens.slate }} />
                  Export as PDF
                </MenuItem>
                <MenuItem onClick={handleExportExcel} sx={{ fontSize: 13, gap: 1.25 }}>
                  <TableChartOutlinedIcon sx={{ fontSize: 18, color: tokens.slate }} />
                  Export as Excel
                </MenuItem>
              </Menu>
            </Box>
          </Stack>

          {exportNotice ? (
            <Typography sx={{ fontSize: 12, color: tokens.tealDark, fontWeight: 500 }}>
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
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>
            Total Clients:{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {filtered.length.toLocaleString()}
            </Box>
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
              {selected.size} selected
            </Typography>
            {selected.size > 0 ? (
              <Typography
                component="button"
                onClick={clearSelection}
                sx={{
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.teal,
                  p: 0,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Clear
              </Typography>
            ) : null}
          </Stack>
        </Stack>

        <AdminDataTable columns={columns} rows={displayed} getRowId={(r) => r.id} />

        {showLoadMore ? (
          <Box sx={{ px: pad.tableCellX, py: 2, borderTop: `1px solid ${tokens.cardBorder}`, textAlign: "center" }}>
            <AppButton variant="outlined" onClick={handleLoadMore} sx={{ textTransform: "none", minWidth: 140 }}>
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
          <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
            Showing {showingFrom.toLocaleString()} to {showingTo.toLocaleString()} of{" "}
            {filtered.length.toLocaleString()} results
          </Typography>
          {showPagination ? (
            <AppPagination
              page={page}
              count={pageCount}
              onChange={(_, p) => setPage(p)}
              sx={{ "& .MuiPagination-ul": { flexWrap: "nowrap", justifyContent: { xs: "center", md: "flex-end" } } }}
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
        sx={{
          textAlign: "center",
          fontSize: 11,
          color: tokens.slate,
          mt: 2.5,
          pb: 1,
        }}
      >
        © 2025 Molur. All rights reserved.
      </Typography>

      {mounted ? (
        <>
          <MollureModal
            open={modal === "view" && Boolean(activeClient)}
            onClose={closeModal}
            title="Client details"
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <AppButton variant="outlined" onClick={closeModal} sx={{ textTransform: "none" }}>
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
                      bgcolor: activeClient.type === "IC" ? alpha(tokens.teal, 0.14) : CC_PURPLE_SOFT,
                      color: activeClient.type === "IC" ? tokens.tealDark : CC_PURPLE,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(activeClient.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.navy }}>{activeClient.name}</Typography>
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
                <DetailRow label="Account status" value={STATUS_STYLES[activeClient.accountStatus].label} />
                {activeClient.contactPerson ? (
                  <DetailRow label="Contact person" value={activeClient.contactPerson} />
                ) : null}
                {activeClient.birthdate ? <DetailRow label="Birthdate" value={activeClient.birthdate} /> : null}
                {activeClient.gender ? <DetailRow label="Gender" value={activeClient.gender} /> : null}
                {activeClient.note?.trim() ? <DetailRow label="Note" value={activeClient.note} /> : null}
              </Stack>
            ) : null}
          </MollureModal>

          <MollureModal
            open={modal === "disable" && Boolean(activeClient)}
            onClose={closeModal}
            title={isDisabling ? "Disable client" : "Enable client"}
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton variant="outlined" onClick={closeModal} sx={{ textTransform: "none", minWidth: 120 }}>
                    Cancel
                  </AppButton>
                  <AppButton variant="contained" onClick={handleApplyStatus} sx={{ textTransform: "none", minWidth: 120 }}>
                    Apply
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: alpha(tokens.navy, 0.88), lineHeight: 1.55 }}>
                {isDisabling
                  ? `Are you sure you want to disable ${activeClient?.name}? They will no longer be able to book services.`
                  : `Are you sure you want to re-enable ${activeClient?.name}? They will regain access to booking.`}
              </Typography>
            </Box>
          </MollureModal>

          <MollureModal
            open={modal === "delete" && Boolean(activeClient)}
            onClose={closeModal}
            title="Delete client"
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton variant="outlined" onClick={closeModal} sx={{ textTransform: "none", minWidth: 120 }}>
                    Cancel
                  </AppButton>
                  <AppButton
                    variant="contained"
                    color="error"
                    onClick={handleApplyDelete}
                    sx={{ textTransform: "none", minWidth: 120 }}
                  >
                    Apply
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: alpha(tokens.navy, 0.88), lineHeight: 1.55 }}>
                Are you sure you want to delete {activeClient?.name}? This will mark the account as deleted.
              </Typography>
            </Box>
          </MollureModal>

          <MollureModal
            open={modal === "note" && Boolean(activeClient)}
            onClose={closeModal}
            title={activeClient?.note?.trim() ? "Client note" : "Add note"}
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
                  <AppButton variant="outlined" onClick={closeModal} sx={{ textTransform: "none" }}>
                    Cancel
                  </AppButton>
                  <AppButton variant="contained" onClick={handleSaveNote} sx={{ textTransform: "none" }}>
                    Save note
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: 13, color: tokens.bodyText }}>
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
          </MollureModal>
        </>
      ) : null}
    </>
  );
}
