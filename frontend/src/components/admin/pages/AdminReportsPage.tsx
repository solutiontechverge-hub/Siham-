"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppButton,
  AppPagination,
  AppSearchField,
  AppSelect,
  AppDrawer,
} from "../../common";
import MollureModal from "../../common/MollureModal";
import AdminFilterDateRange from "../AdminFilterDateRange";
import AdminFilterPanel, { AdminFilterPanelRow } from "../AdminFilterPanel";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { AdminSummaryGrid, type AdminTableColumn } from "../AdminDataTable";
import { AdminDashboardFooter } from "../AdminDashboardHeader";
import { ADMIN_CARD_PADDING as pad } from "../adminCardPadding";
import {
  mockReportRows,
  REPORT_TYPE_OPTIONS,
  reportSummaryStats,
  STATUS_FILTER_OPTIONS,
  type ReportRow,
  type ReportStatus,
  type ReportUserType,
} from "../reportsData";
import { exportReportsToExcel } from "../exportReportsExcel";
import { exportReportsToPdf } from "../exportReportsPdf";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const USER_TYPE_STYLES: Record<ReportUserType, { bg: string; color: string }> = {
  Professional: { bg: "rgba(127, 86, 217, 0.12)", color: "#6941C6" },
  Client: { bg: "rgba(76, 175, 80, 0.12)", color: "#2E7D32" },
};

const STATUS_STYLES: Record<ReportStatus, { bg: string; color: string; label: string }> = {
  new: { bg: "rgba(220, 104, 3, 0.14)", color: "#DC6803", label: "New" },
  viewed: { bg: "rgba(59, 130, 246, 0.12)", color: "#2563EB", label: "Viewed" },
};

type AdminReportsPageProps = {
  embedded?: boolean;
};

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function UserCell({ user }: { user: ReportRow["reporter"] }) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: alpha(tokens.teal, 0.12),
          color: tokens.tealDark,
        }}
      >
        {user.initials}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }} noWrap>
          {user.name}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: tokens.slate }} noWrap>
          {user.email}
        </Typography>
      </Box>
    </Stack>
  );
}

function UserTypeBadge({ type }: { type: ReportUserType }) {
  const style = USER_TYPE_STYLES[type];
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        height: 22,
        fontSize: 10,
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.color,
      }}
    />
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        height: 22,
        fontSize: 10,
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.color,
      }}
    />
  );
}

function ReportDetailContent({
  report,
  onStatusChange,
  onDeleteRequest,
}: {
  report: ReportRow;
  onStatusChange: (status: ReportStatus) => void;
  onDeleteRequest: () => void;
}) {
  const tokens = useTheme().palette.mollure;

  const renderUserBlock = (label: string, user: ReportRow["reporter"]) => (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: alpha(tokens.teal, 0.12),
            color: tokens.tealDark,
          }}
        >
          {user.initials}
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>{user.name}</Typography>
          <UserTypeBadge type={user.type} />
        </Box>
      </Stack>
      <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>{user.email}</Typography>
      <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>{user.phone}</Typography>
    </Box>
  );

  return (
    <Stack spacing={2} sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: tokens.teal }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: tokens.navy }}>Report Details</Typography>
        </Stack>
        <StatusBadge status={report.status} />
      </Stack>

      <Typography sx={{ fontSize: 12, color: tokens.slate, fontWeight: 500 }}>
        Report ID #{report.reportId}
      </Typography>

      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: tokens.surface, border: `1px solid ${tokens.cardBorder}` }}>
        {renderUserBlock(`Reporter (${report.reporter.type})`, report.reporter)}
      </Box>

      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: tokens.surface, border: `1px solid ${tokens.cardBorder}` }}>
        {renderUserBlock(`Reported User (${report.reported.type})`, report.reported)}
      </Box>

      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Reason
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>{report.reasonCategory}</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.bodyText, mt: 0.5 }}>{report.reasonDescription}</Typography>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Additional Details
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.bodyText, lineHeight: 1.55 }}>{report.additionalDetails}</Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1}>
        <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: tokens.slate }} />
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate }}>Date Reported</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>
            {formatDisplayDate(report.date)} · {report.time}
          </Typography>
        </Box>
      </Stack>

      <AppSelect
        label="Status"
        value={report.status}
        onChange={(e) => onStatusChange(e.target.value as ReportStatus)}
        options={[
          { value: "new", label: "New" },
          { value: "viewed", label: "Viewed" },
        ]}
        size="small"
        fullWidth
      />

      <AppButton
        variant="outlined"
        color="error"
        fullWidth
        onClick={onDeleteRequest}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Delete Report
      </AppButton>
    </Stack>
  );
}

function ReportRowActions({
  onView,
  onDelete,
}: {
  onView: () => void;
  onDelete: () => void;
}) {
  const tokens = useTheme().palette.mollure;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const menuItemSx = { fontSize: 13, py: 1, gap: 1.25, color: tokens.navy };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Report actions"
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
              minWidth: 160,
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
          View
        </MenuItem>
        <MenuItem
          sx={{ ...menuItemSx, color: "#B42318" }}
          onClick={() => {
            setAnchorEl(null);
            onDelete();
          }}
        >
          <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}

export default function AdminReportsPage({ embedded = false }: AdminReportsPageProps) {
  const tokens = useTheme().palette.mollure;
  const [reports, setReports] = React.useState(mockReportRows);
  const [drawerReportId, setDrawerReportId] = React.useState<string | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ReportRow | null>(null);

  const filteredReports = React.useMemo(() => {
    return reports.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.reasonCategory !== typeFilter) return false;
      if (dateFrom && row.date < dateFrom) return false;
      if (dateTo && row.date > dateTo) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          row.reporter.name.toLowerCase().includes(q) ||
          row.reporter.email.toLowerCase().includes(q) ||
          row.reported.name.toLowerCase().includes(q) ||
          row.reported.email.toLowerCase().includes(q) ||
          row.reasonCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, statusFilter, typeFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pagedReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);
  const drawerReport = reports.find((r) => r.id === drawerReportId) ?? null;

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, dateFrom, dateTo, search, pageSize]);

  React.useEffect(() => {
    if (drawerReportId && !reports.some((r) => r.id === drawerReportId)) {
      setDrawerReportId(null);
    }
  }, [reports, drawerReportId]);

  const toggleSelect = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === pagedReports.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pagedReports.map((r) => r.id)));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateFrom(start);
    setDateTo(end);
  };

  const exportRows = React.useMemo(() => {
    const selected = reports.filter((r) => selectedRows.has(r.id));
    return selected.length > 0 ? selected : filteredReports;
  }, [reports, selectedRows, filteredReports]);

  const handleExportExcel = () => {
    exportReportsToExcel(exportRows, "reports");
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    await exportReportsToPdf(exportRows, "reports");
    setExportMenuAnchor(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteReport(deleteTarget.id);
    if (drawerReportId === deleteTarget.id) {
      setDrawerReportId(null);
    }
    setDeleteTarget(null);
  };

  const updateReportStatus = (id: string, status: ReportStatus) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const columns: AdminTableColumn<ReportRow>[] = [
    {
      id: "select",
      label: (
        <Checkbox
          size="small"
          checked={pagedReports.length > 0 && selectedRows.size === pagedReports.length}
          indeterminate={selectedRows.size > 0 && selectedRows.size < pagedReports.length}
          onChange={toggleSelectAll}
        />
      ),
      render: (r) => (
        <Checkbox size="small" checked={selectedRows.has(r.id)} onChange={() => toggleSelect(r.id)} />
      ),
    },
    {
      id: "reporter",
      label: "Reporter",
      minWidth: 180,
      render: (r) => <UserCell user={r.reporter} />,
    },
    {
      id: "reported",
      label: "Reported User",
      minWidth: 180,
      render: (r) => <UserCell user={r.reported} />,
    },
    {
      id: "userType",
      label: "User Type",
      render: (r) => <UserTypeBadge type={r.reported.type} />,
    },
    {
      id: "reason",
      label: "Reason",
      minWidth: 200,
      render: (r) => (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}>{r.reasonCategory}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText, mt: 0.25 }} noWrap>
            {r.reasonDescription}
          </Typography>
        </Box>
      ),
    },
    {
      id: "date",
      label: "Date Reported",
      minWidth: 120,
      render: (r) => (
        <Box>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>{formatDisplayDate(r.date)}</Typography>
          <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>{r.time}</Typography>
        </Box>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: (r) => (
        <ReportRowActions
          onView={() => setDrawerReportId(r.id)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ];

  const summaryItems = [
    {
      label: "New Reports",
      value: reportSummaryStats.new,
      sub: "Awaiting review",
      icon: FlagOutlinedIcon,
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563EB",
    },
    {
      label: "Viewed Reports",
      value: reportSummaryStats.viewed,
      sub: "Already reviewed",
      icon: VisibilityOutlinedIcon,
      iconBg: "rgba(220, 104, 3, 0.14)",
      iconColor: "#DC6803",
    },
    {
      label: "Total Reports",
      value: reportSummaryStats.total,
      sub: "All active reports",
      icon: DescriptionOutlinedIcon,
      iconBg: "rgba(76, 175, 80, 0.12)",
      iconColor: "#2E7D32",
    },
    {
      label: "Resolved (Deleted)",
      value: reportSummaryStats.resolvedDeleted,
      sub: "Removed from system",
      icon: DeleteOutlineOutlinedIcon,
      iconBg: "rgba(217, 45, 32, 0.12)",
      iconColor: "#D92D20",
    },
  ];

  return (
    <>
      {!embedded ? (
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
            <Typography sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}>
              Reports
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography
                variant="mainHeading"
                sx={{ fontSize: { xs: 24, md: 28 }, color: tokens.textcolorgrey700, mb: 0.5 }}
              >
                Reports
              </Typography>
              <Typography sx={{ fontSize: 14, color: tokens.bodyText, maxWidth: 640 }}>
                Review and manage reports submitted by clients and professionals.
              </Typography>
            </Box>
            <AppButton
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
            >
              Export Reports
            </AppButton>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: { borderRadius: 2, minWidth: 180, border: `1px solid ${tokens.cardBorder}` },
                },
              }}
            >
              <MenuItem onClick={handleExportPdf} sx={{ fontSize: 13, gap: 1.25 }}>
                <PictureAsPdfOutlinedIcon sx={{ fontSize: 18, color: "#D92D20" }} />
                Download PDF
              </MenuItem>
              <MenuItem onClick={handleExportExcel} sx={{ fontSize: 13, gap: 1.25 }}>
                <TableChartOutlinedIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
                Download Excel
              </MenuItem>
            </Menu>
          </Stack>
        </>
      ) : null}

      <AdminSummaryGrid items={summaryItems} embedded />

      <Grid container spacing={1.5} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <AdminSectionCard noPadding compact>
            <Box sx={{ p: pad.bodyCompact, borderBottom: `1px solid ${tokens.cardBorder}` }}>
              <AdminFilterPanel horizontal>
                <AdminFilterPanelRow horizontal grow>
                  <AppSearchField
                    placeholder="Search by reporter, reported user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as string)}
                    options={STATUS_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 140 } }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as string)}
                    options={REPORT_TYPE_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 170 } }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AdminFilterDateRange
                    start={dateFrom}
                    end={dateTo}
                    onChange={handleDateRangeChange}
                    minWidth={{ xs: "100%", lg: 220 }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppButton
                    variant="outlined"
                    startIcon={<RefreshOutlinedIcon />}
                    onClick={resetFilters}
                    sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap", height: 40 }}
                  >
                    Reset Filters
                  </AppButton>
                </AdminFilterPanelRow>
              </AdminFilterPanel>
            </Box>

            <AdminDataTable columns={columns} rows={pagedReports} getRowId={(r) => r.id} dense />

            <Box sx={{ p: pad.bodyCompact, borderTop: `1px solid ${tokens.cardBorder}` }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
                  Showing {filteredReports.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, filteredReports.length)} of {filteredReports.length} results
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="nowrap">
                  <AppSelect
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
                    size="small"
                    sx={{ minWidth: 110 }}
                  />
                  <AppPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
                </Stack>
              </Stack>
            </Box>
          </AdminSectionCard>
        </Grid>
      </Grid>

      <AppDrawer
        open={Boolean(drawerReport)}
        onClose={() => setDrawerReportId(null)}
        title="Report Details"
        panelWidth={{ xs: "100%", sm: 420 }}
      >
        {drawerReport ? (
          <ReportDetailContent
            report={drawerReport}
            onStatusChange={(status) => updateReportStatus(drawerReport.id, status)}
            onDeleteRequest={() => setDeleteTarget(drawerReport)}
          />
        ) : null}
      </AppDrawer>

      {!embedded ? <AdminDashboardFooter /> : null}

      <MollureModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete report"
        maxWidth="xs"
        fullWidth
        footer={
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
            <AppButton variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
              Cancel
            </AppButton>
            <AppButton variant="contained" color="error" onClick={confirmDelete} sx={{ textTransform: "none" }}>
              Delete
            </AppButton>
          </Stack>
        }
      >
        <Stack spacing={1.5} sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <WarningAmberRoundedIcon sx={{ color: "#DC6803", fontSize: 22, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>
                Are you sure you want to delete this report?
              </Typography>
              {deleteTarget ? (
                <Typography sx={{ fontSize: 13, color: tokens.bodyText, mt: 0.75 }}>
                  Report <strong>#{deleteTarget.reportId}</strong> ({deleteTarget.reporter.name} →{" "}
                  {deleteTarget.reported.name}) will be permanently removed.
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>
      </MollureModal>
    </>
  );
}
