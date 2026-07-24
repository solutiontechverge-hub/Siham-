"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppButton,
  AppPagination,
  AppSearchField,
  AppSelect,
  AppDrawer,
} from "../../../common";
import AppModal from "../../../common/AppModal";
import AdminFilterDateRange from "../../AdminFilterDateRange";
import AdminFilterPanel, { AdminFilterPanelRow } from "../../AdminFilterPanel";
import AdminSectionCard from "../../AdminSectionCard";
import AdminDataTable, {
  AdminSummaryGrid,
  type AdminTableColumn,
} from "../../AdminDataTable";
import { AdminDashboardFooter } from "../../AdminDashboardHeader";
import AdminActivityLogWidgets from "../../AdminActivityLogWidgets";
import { ADMIN_CARD_PADDING as pad } from "../../adminCardPadding";
import {
  ACTION_FILTER_OPTIONS,
  ACTION_STYLES,
  MODULE_FILTER_OPTIONS,
  USER_FILTER_OPTIONS,
} from "../../activityLogData";
import type { ActivityLogAction, ActivityLogModule, ActivityLogRow } from "./activity-log.types";
import {
  formatDateTime,
  formatDisplayDate,
  formatTime12h,
  MODULE_ICONS,
  PAGE_SIZE_OPTIONS,
} from "./activity-log.data";
import { useAdminActivityLogPage } from "./useAdminActivityLogPage";

function UserCell({ user }: { user: ActivityLogRow["user"] }) {
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
        <Typography
          sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
          noWrap
        >
          {user.name}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: tokens.slate }} noWrap>
          {user.email}
        </Typography>
      </Box>
    </Stack>
  );
}

function ActionBadge({ action }: { action: ActivityLogRow["action"] }) {
  const style = ACTION_STYLES[action];
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

function ModuleCell({
  module,
  label,
}: {
  module: ActivityLogModule;
  label: string;
}) {
  const tokens = useTheme().palette.mollure;
  const Icon = MODULE_ICONS[module];
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: tokens.mintSoft,
          color: tokens.teal,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 15 }} />
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: tokens.navy }}>
        {label}
      </Typography>
    </Stack>
  );
}

function ActivityDetailContent({ entry }: { entry: ActivityLogRow }) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack spacing={2} sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: tokens.teal }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: tokens.navy }}>
          Activity Details
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: 12, color: tokens.slate, fontWeight: 500 }}>
        Log ID #{entry.id}
      </Typography>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: tokens.surface,
          border: `1px solid ${tokens.cardBorder}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: tokens.slate,
            mb: 1,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          User
        </Typography>
        <UserCell user={entry.user} />
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: tokens.slate,
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Action
          </Typography>
          <ActionBadge action={entry.action} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: tokens.slate,
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Module
          </Typography>
          <ModuleCell module={entry.module} label={entry.moduleLabel} />
        </Box>
      </Stack>

      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: tokens.slate,
            mb: 0.75,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Details
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: tokens.bodyText, lineHeight: 1.55 }}
        >
          {entry.details}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1}>
        <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: tokens.slate }} />
        <Box>
          <Typography
            sx={{ fontSize: 11, fontWeight: 600, color: tokens.slate }}
          >
            Date & Time
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>
            {formatDateTime(entry.date, entry.time)}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: tokens.slate,
            mb: 0.5,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          IP Address
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: tokens.navy, fontFamily: "monospace" }}
        >
          {entry.ipAddress}
        </Typography>
      </Box>
    </Stack>
  );
}

function ActivityRowActions({
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
        aria-label="Activity actions"
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

export default function AdminActivityLogPageView() {
  const tokens = useTheme().palette.mollure;
  const {
    drawerLog, setDrawerLogId, search, setSearch, userFilter, setUserFilter,
    actionFilter, setActionFilter, moduleFilter, setModuleFilter, dateFrom,
    dateTo, page, setPage, pageSize, setPageSize, exportMenuAnchor,
    setExportMenuAnchor, deleteTarget, setDeleteTarget, filteredLogs,
    totalPages, pagedLogs, dateRangeLabel, summary, isLoading, isFetching,
    isError, refetch, resetFilters, handleDateRangeChange, handleExportExcel,
    handleExportPdf, confirmDelete,
  } = useAdminActivityLogPage();

  const summaryItems = [
    {
      label: "Total Activities",
      value: summary.total,
      icon: HistoryOutlinedIcon,
      iconBg: "rgba(127, 86, 217, 0.12)",
      iconColor: "#6941C6",
    },
    {
      label: "Today",
      value: summary.today,
      icon: TodayOutlinedIcon,
      iconBg: "rgba(76, 175, 80, 0.12)",
      iconColor: "#2E7D32",
    },
    {
      label: "This Week",
      value: summary.thisWeek,
      icon: DateRangeOutlinedIcon,
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563EB",
    },
    {
      label: "This Month",
      value: summary.thisMonth,
      icon: CalendarMonthOutlinedIcon,
      iconBg: "rgba(220, 104, 3, 0.14)",
      iconColor: "#DC6803",
    },
  ];

  const columns: AdminTableColumn<ActivityLogRow>[] = [
    {
      id: "datetime",
      label: "Date & Time",
      minWidth: 160,
      render: (r) => (
        <Box>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>
            {formatDisplayDate(r.date)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
            {formatTime12h(r.time)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "user",
      label: "User",
      minWidth: 180,
      render: (r) => <UserCell user={r.user} />,
    },
    {
      id: "action",
      label: "Action",
      render: (r) => <ActionBadge action={r.action} />,
    },
    {
      id: "module",
      label: "Module",
      minWidth: 140,
      render: (r) => <ModuleCell module={r.module} label={r.moduleLabel} />,
    },
    {
      id: "details",
      label: "Details",
      minWidth: 220,
      render: (r) => (
        <Typography
          sx={{ fontSize: 12, color: tokens.bodyText, lineHeight: 1.45 }}
          noWrap
        >
          {r.details}
        </Typography>
      ),
    },
    {
      id: "ip",
      label: "IP Address",
      render: (r) => (
        <Typography
          sx={{ fontSize: 12, color: tokens.navy, fontFamily: "monospace" }}
        >
          {r.ipAddress}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: (r) => (
        <ActivityRowActions
          onView={() => setDrawerLogId(r.id)}
          onDelete={() => setDeleteTarget(r)}
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
          sx={{
            fontSize: 12,
            color: tokens.bodyText,
            textDecoration: "none",
            "&:hover": { color: tokens.teal },
          }}
        >
          Home
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>/</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}>
          Activity Log
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
            sx={{
              fontSize: { xs: 24, md: 28 },
              color: tokens.textcolorgrey700,
              mb: 0.5,
            }}
          >
            Activity Log
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: tokens.bodyText, maxWidth: 640 }}
          >
            Track and monitor all activities and actions performed across the
            platform.
          </Typography>
        </Box>
        <AppButton
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
        >
          Export
        </AppButton>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2,
                minWidth: 180,
                border: `1px solid ${tokens.cardBorder}`,
              },
            },
          }}
        >
          <MenuItem onClick={handleExportPdf} sx={{ fontSize: 13, gap: 1.25 }}>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 18, color: "#D92D20" }} />
            Download PDF
          </MenuItem>
          <MenuItem
            onClick={handleExportExcel}
            sx={{ fontSize: 13, gap: 1.25 }}
          >
            <TableChartOutlinedIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
            Download Excel
          </MenuItem>
        </Menu>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "flex-end" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 0.5 }}
      >
        <Box sx={{ flex: 1, width: "100%" }}>
          <AdminSummaryGrid items={summaryItems} embedded />
        </Box>
        {dateRangeLabel ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ flexShrink: 0, pb: { md: 0.5 } }}
          >
            <CalendarTodayOutlinedIcon
              sx={{ fontSize: 16, color: tokens.slate }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: tokens.bodyText,
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {dateRangeLabel}
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <Grid container spacing={1.5} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <AdminSectionCard noPadding compact>
            <Box
              sx={{
                p: pad.bodyCompact,
                borderBottom: `1px solid ${tokens.cardBorder}`,
              }}
            >
              <AdminFilterPanel horizontal>
                <AdminFilterPanelRow horizontal grow>
                  <AppSearchField
                    placeholder="Search by user, action, or details..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as string)}
                    options={USER_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 140 } }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value as string)}
                    options={ACTION_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 140 } }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value as string)}
                    options={MODULE_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 140 } }}
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
                    variant="text"
                    startIcon={<RefreshOutlinedIcon sx={{ fontSize: 18 }} />}
                    onClick={resetFilters}
                    sx={{
                      textTransform: "none",
                      color: tokens.teal,
                      fontWeight: 600,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      height: 40,
                      flexShrink: 0,
                      minWidth: "fit-content",
                      px: 1,
                    }}
                  >
                    Reset Filters
                  </AppButton>
                </AdminFilterPanelRow>
              </AdminFilterPanel>
            </Box>

            {isError ? (
              <Box sx={{ px: pad.tableCellX, py: 2 }}>
                <Typography sx={{ fontSize: 13, color: tokens.bodyText }}>
                  Failed to load activity log.{" "}
                  <Box
                    component="button"
                    onClick={() => void refetch()}
                    sx={{
                      border: 0,
                      background: "none",
                      color: tokens.teal,
                      cursor: "pointer",
                      font: "inherit",
                      fontWeight: 700,
                      p: 0,
                    }}
                  >
                    Retry
                  </Box>
                </Typography>
              </Box>
            ) : null}

            {isLoading && filteredLogs.length === 0 ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress size={28} sx={{ color: tokens.teal }} />
              </Box>
            ) : (
              <Box sx={{ opacity: isFetching ? 0.72 : 1 }}>
                <AdminDataTable
                  columns={columns}
                  rows={pagedLogs}
                  getRowId={(r) => r.id}
                  dense
                />
              </Box>
            )}

            <Box
              sx={{
                p: pad.bodyCompact,
                borderTop: `1px solid ${tokens.cardBorder}`,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
              >
                <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
                  Showing{" "}
                  {filteredLogs.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, filteredLogs.length)} of{" "}
                  {filteredLogs.length} results
                </Typography>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  flexWrap="nowrap"
                >
                  <AppSelect
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    options={PAGE_SIZE_OPTIONS.map((n) => ({
                      value: String(n),
                      label: `${n} / page`,
                    }))}
                    size="small"
                    sx={{ minWidth: 110 }}
                  />
                  <AppPagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    size="small"
                  />
                </Stack>
              </Stack>
            </Box>
          </AdminSectionCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <AdminActivityLogWidgets />
        </Grid>
      </Grid>

      <AppDrawer
        open={Boolean(drawerLog)}
        onClose={() => setDrawerLogId(null)}
        title="Activity Details"
        panelWidth={{ xs: "100%", sm: 420 }}
      >
        {drawerLog ? <ActivityDetailContent entry={drawerLog} /> : null}
      </AppDrawer>

      <AdminDashboardFooter />

      <AppModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete activity log"
        maxWidth="xs"
        fullWidth
        headerTone="danger"
        footer={
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 2 }}
          >
            <AppButton tone="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </AppButton>
            <AppButton tone="danger" onClick={confirmDelete}>
              Delete
            </AppButton>
          </Stack>
        }
      >
        <Stack spacing={1.5} sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <WarningAmberRoundedIcon
              sx={{ color: "#DC6803", fontSize: 22, mt: 0.25 }}
            />
            <Box>
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}
              >
                Are you sure you want to delete this activity log entry?
              </Typography>
              {deleteTarget ? (
                <Typography
                  sx={{ fontSize: 13, color: tokens.bodyText, mt: 0.75 }}
                >
                  <strong>{deleteTarget.actionLabel}</strong> by{" "}
                  <strong>{deleteTarget.user.name}</strong> on{" "}
                  {formatDisplayDate(deleteTarget.date)} will be permanently
                  removed.
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>
      </AppModal>
    </>
  );
}
