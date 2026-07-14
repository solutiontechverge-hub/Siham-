"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Checkbox,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppDropdown, AppPagination, AppSearchField, AppSelect } from "../../common";
import AdminFilterDateRange from "../AdminFilterDateRange";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminSegmentedFilterBar, { ADMIN_FLUSHED_FIELD_SX } from "../AdminSegmentedFilterBar";
import AdminDataTable, { type AdminTableColumn } from "../AdminDataTable";
import AdminKpiCard from "../AdminKpiCard";
import {
  ProfessionalSummaryWidget,
  RecentlyJoinedWidget,
  TopCategoriesWidget,
  VerificationOverviewWidget,
} from "../AdminProfessionalWidgets";
import {
  mockProfessionals,
  professionalManagementSummary,
  type MockProfessional,
  type ProfessionalCategory,
} from "../adminMockData";
import { ADMIN_CARD_PADDING as pad } from "../adminCardPadding";
import { exportProfessionalsToExcel } from "../exportProfessionalsExcel";
import { exportProfessionalsToPdf } from "../exportProfessionalsPdf";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "Hair & Beauty", label: "Hair & Beauty" },
  { value: "Wellness & Spa", label: "Wellness & Spa" },
  { value: "Fitness & Training", label: "Fitness & Training" },
  { value: "Make-up & Skincare", label: "Make-up & Skincare" },
  { value: "Barber", label: "Barber" },
];

const CATEGORY_CHIP_COLORS: Record<ProfessionalCategory, { bg: string; fg: string }> = {
  "Hair & Beauty": { bg: "rgba(33, 184, 191, 0.12)", fg: "#149CA7" },
  "Wellness & Spa": { bg: "rgba(127, 86, 217, 0.12)", fg: "#6941C6" },
  "Fitness & Training": { bg: "rgba(2, 132, 199, 0.12)", fg: "#0284C7" },
  "Make-up & Skincare": { bg: "rgba(236, 72, 153, 0.12)", fg: "#DB2777" },
  Barber: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803" },
};

const VERIFICATION_STYLES: Record<
  MockProfessional["validationStatus"],
  { bg: string; fg: string; label: string }
> = {
  validated: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "Verified" },
  pending: { bg: "rgba(255, 181, 71, 0.2)", fg: "#DC6803", label: "Pending" },
  not_validated: { bg: "rgba(240, 68, 56, 0.12)", fg: "#B42318", label: "Rejected" },
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

function isActiveAccount(status: MockProfessional["accountStatus"]) {
  return status === "active";
}

function StatusPill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.25,
        py: 0.35,
        borderRadius: 999,
        bgcolor: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

function StarRating({ value, count }: { value: number; count: number }) {
  const tokens = useTheme().palette.mollure;
  if (count === 0) {
    return <Typography sx={{ fontSize: 12, color: tokens.slate }}>—</Typography>;
  }
  return (
    <Stack spacing={0.25}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Stack direction="row" spacing={0.1}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarRoundedIcon
              key={star}
              sx={{
                fontSize: 13,
                color: star <= Math.round(value) ? "#FAAF00" : alpha(tokens.slate, 0.25),
              }}
            />
          ))}
        </Stack>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}>{value.toFixed(1)}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 10.5, color: tokens.bodyText }}>({count} reviews)</Typography>
    </Stack>
  );
}

function CategoryChip({ category }: { category: ProfessionalCategory }) {
  const colors = CATEGORY_CHIP_COLORS[category];
  return <StatusPill bg={colors.bg} fg={colors.fg} label={category} />;
}

export default function AdminProfessionalsPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [verificationFilter, setVerificationFilter] = React.useState("all");
  const [regDateFrom, setRegDateFrom] = React.useState("");
  const [regDateTo, setRegDateTo] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [bulkMenuAnchor, setBulkMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [rowMenuAnchor, setRowMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = React.useState<Set<string>>(new Set());

  const { total, verified, pending, rejected, inactive, growthTrend } = professionalManagementSummary;

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return mockProfessionals.filter((p) => {
      const matchesSearch =
        !q ||
        p.brandName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "all" || p.primaryCategory === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? isActiveAccount(p.accountStatus) : !isActiveAccount(p.accountStatus));
      const matchesVerification =
        verificationFilter === "all" || p.validationStatus === verificationFilter;
      const matchesFrom = !regDateFrom || p.registrationDate >= regDateFrom;
      const matchesTo = !regDateTo || p.registrationDate <= regDateTo;
      return matchesSearch && matchesCategory && matchesStatus && matchesVerification && matchesFrom && matchesTo;
    });
  }, [search, categoryFilter, statusFilter, verificationFilter, regDateFrom, regDateTo]);

  React.useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, verificationFilter, regDateFrom, regDateTo, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, filtered.length);

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

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setVerificationFilter("all");
    setRegDateFrom("");
    setRegDateTo("");
    setPage(1);
    setHighlightedIds(new Set());
  };

  const highlightExportedRows = (rows: MockProfessional[]) => {
    const ids = new Set(rows.map((r) => r.id));
    setSelected(ids);
    setHighlightedIds(ids);
    window.setTimeout(() => setHighlightedIds(new Set()), 2400);
  };

  const handleExportExcel = () => {
    const ok = exportProfessionalsToExcel(filtered, "professional-management");
    setExportNotice(
      ok
        ? `Exported ${filtered.length} professional${filtered.length === 1 ? "" : "s"} to Excel.`
        : "No professionals to export for the current filters.",
    );
    if (ok) highlightExportedRows(filtered);
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    const ok = await exportProfessionalsToPdf(filtered, "professional-management");
    setExportNotice(
      ok
        ? `Exported ${filtered.length} professional${filtered.length === 1 ? "" : "s"} to PDF.`
        : "No professionals to export for the current filters.",
    );
    if (ok) highlightExportedRows(filtered);
    setExportMenuAnchor(null);
  };

  React.useEffect(() => {
    if (!exportNotice) return;
    const timer = window.setTimeout(() => setExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  const allPageSelected = displayed.length > 0 && displayed.every((r) => selected.has(r.id));
  const somePageSelected = displayed.some((r) => selected.has(r.id)) && !allPageSelected;

  const columns: AdminTableColumn<MockProfessional>[] = [
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
      id: "professional",
      label: "Professional",
      minWidth: 200,
      render: (r) => {
        const colors = CATEGORY_CHIP_COLORS[r.primaryCategory];
        return (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: colors.bg,
                color: colors.fg,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getInitials(r.brandName)}
            </Avatar>
            <Stack spacing={0.2} sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }} noWrap>
                {r.brandName}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: tokens.bodyText }}>ID: {r.id.toUpperCase()}</Typography>
            </Stack>
          </Stack>
        );
      },
    },
    {
      id: "category",
      label: "Category",
      minWidth: 140,
      render: (r) => <CategoryChip category={r.primaryCategory} />,
    },
    {
      id: "contact",
      label: "Contact",
      minWidth: 180,
      render: (r) => (
        <Stack spacing={0.25}>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>{r.email}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.phone}</Typography>
        </Stack>
      ),
    },
    {
      id: "verification",
      label: "Verification Status",
      minWidth: 150,
      render: (r) => {
        const s = VERIFICATION_STYLES[r.validationStatus];
        return (
          <Stack spacing={0.35}>
            <StatusPill bg={s.bg} fg={s.fg} label={s.label} />
            {r.verificationDate ? (
              <Typography sx={{ fontSize: 10.5, color: tokens.bodyText }}>
                {formatDisplayDate(r.verificationDate)}
              </Typography>
            ) : null}
          </Stack>
        );
      },
    },
    {
      id: "account",
      label: "Account Status",
      render: (r) => {
        const active = isActiveAccount(r.accountStatus);
        return (
          <StatusPill
            bg={active ? "rgba(76, 175, 80, 0.12)" : "rgba(148, 163, 184, 0.2)"}
            fg={active ? "#2E7D32" : tokens.slate}
            label={active ? "Active" : "Inactive"}
          />
        );
      },
    },
    {
      id: "rating",
      label: "Rating",
      minWidth: 130,
      render: (r) => <StarRating value={r.avgRating} count={r.totalReviews} />,
    },
    {
      id: "bookings",
      label: "Total Bookings",
      align: "right",
      render: (r) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}>
          {(r.onlineBookings + r.offlineBookings).toLocaleString()}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: () => (
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <IconButton size="small" aria-label="View professional">
            <VisibilityOutlinedIcon sx={{ fontSize: 18, color: tokens.slate }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="More actions"
            onClick={(e) => setRowMenuAnchor(e.currentTarget)}
          >
            <MoreVertRoundedIcon sx={{ fontSize: 20, color: tokens.slate }} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}% of total`;

  const filterSegments = React.useMemo(
    () => [
      {
        id: "search",
        label: "Search by",
        flex: { xs: 1, lg: 1.4 } as const,
        minWidth: { lg: 200 },
        content: (
          <AppSearchField
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            size="small"
            fullWidth
            sx={{
              ...ADMIN_FLUSHED_FIELD_SX,
              width: "100%",
              "& .MuiInputAdornment-root": { ml: 0.5 },
            }}
          />
        ),
      },
      {
        id: "category",
        label: "Category",
        flex: 1,
        minWidth: { lg: 140 },
        content: (
          <AppSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            size="small"
            fullWidth
            sx={{ ...ADMIN_FLUSHED_FIELD_SX, width: "100%" }}
            options={CATEGORY_OPTIONS}
          />
        ),
      },
      {
        id: "status",
        label: "Account Status",
        flex: 1,
        minWidth: { lg: 130 },
        content: (
          <AppSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            fullWidth
            sx={{ ...ADMIN_FLUSHED_FIELD_SX, width: "100%" }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        ),
      },
      {
        id: "verification",
        label: "Verification Status",
        flex: 1,
        minWidth: { lg: 155 },
        content: (
          <AppSelect
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            size="small"
            fullWidth
            sx={{ ...ADMIN_FLUSHED_FIELD_SX, width: "100%" }}
            options={[
              { value: "all", label: "All Verification Status" },
              { value: "validated", label: "Verified" },
              { value: "pending", label: "Pending" },
              { value: "not_validated", label: "Rejected" },
            ]}
          />
        ),
      },
      {
        id: "date",
        label: "Registration date",
        flex: 1.1,
        minWidth: { lg: 180 },
        content: (
          <AdminFilterDateRange
            start={regDateFrom}
            end={regDateTo}
            onChange={(start, end) => {
              setRegDateFrom(start);
              setRegDateTo(end);
            }}
            embedded
          />
        ),
      },
    ],
    [search, categoryFilter, statusFilter, verificationFilter, regDateFrom, regDateTo],
  );

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
        <Typography sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}>Professional Management</Typography>
      </Stack>

      <AdminPageHeader
        title="Professional Management"
        description="View, validate, and manage all registered professionals on the platform."
        actions={
          <>
            <AppButton
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              endIcon={<KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              disabled={filtered.length === 0}
              sx={{ textTransform: "none" }}
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
            <AppButton variant="contained" startIcon={<AddOutlinedIcon />} sx={{ textTransform: "none" }}>
              Add Professional
            </AppButton>
          </>
        }
      />

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
          <AdminKpiCard
            label="Total Professionals"
            value={total}
            trend={growthTrend}
            trendLabel="vs last 30 days"
            icon={GroupsOutlinedIcon}
            compact
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
          <AdminKpiCard
            label="Verified Professionals"
            value={verified}
            sublabel={pct(verified)}
            icon={VerifiedUserOutlinedIcon}
            iconColor={tokens.tealDark}
            iconBg={tokens.mintSoft}
            compact
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
          <AdminKpiCard
            label="Pending Verification"
            value={pending}
            sublabel={pct(pending)}
            icon={PendingOutlinedIcon}
            iconColor="#DC6803"
            iconBg="rgba(255, 181, 71, 0.2)"
            compact
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
          <AdminKpiCard
            label="Rejected Professionals"
            value={rejected}
            sublabel={pct(rejected)}
            icon={CancelOutlinedIcon}
            iconColor="#B42318"
            iconBg="rgba(240, 68, 56, 0.12)"
            compact
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
          <AdminKpiCard
            label="Inactive Professionals"
            value={inactive}
            sublabel={pct(inactive)}
            icon={BlockOutlinedIcon}
            iconColor={tokens.slate}
            iconBg={tokens.sectionSurface}
            compact
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid size={{ xs: 12, xl: 8 }}>
          <AdminSectionCard noPadding sx={{ mb: 2 }}>
            <Stack spacing={1.5} sx={{ px: pad.bodyCompact, py: 1.75 }}>
              <AdminSegmentedFilterBar onReset={resetFilters} segments={filterSegments} />

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
                Total Professionals:{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {filtered.length.toLocaleString()}
                </Box>
              </Typography>
              <AppButton
                variant="outlined"
                size="small"
                endIcon={<KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                disabled={selected.size === 0}
                sx={{ textTransform: "none", fontSize: 12 }}
              >
                Bulk Actions
              </AppButton>
              <Menu
                anchorEl={bulkMenuAnchor}
                open={Boolean(bulkMenuAnchor)}
                onClose={() => setBulkMenuAnchor(null)}
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
                  component={Link}
                  href="/admin/messaging"
                  onClick={() => setBulkMenuAnchor(null)}
                  sx={{ fontSize: 13 }}
                >
                  Send email ({selected.size})
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    const rows = mockProfessionals.filter((p) => selected.has(p.id));
                    const ok = exportProfessionalsToExcel(rows, "professional-management-selected");
                    if (ok) highlightExportedRows(rows);
                    setBulkMenuAnchor(null);
                  }}
                  sx={{ fontSize: 13 }}
                >
                  Export selected
                </MenuItem>
              </Menu>
            </Stack>

            <AdminDataTable
              columns={columns}
              rows={displayed}
              getRowId={(r) => r.id}
              dense
              highlightedIds={highlightedIds}
            />

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
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                {filtered.length > pageSize ? (
                  <AppPagination
                    page={page}
                    count={pageCount}
                    onChange={(_, p) => setPage(p)}
                    size="small"
                    sx={{ "& .MuiPagination-ul": { flexWrap: "nowrap" } }}
                  />
                ) : null}
                <AppDropdown
                  value={String(pageSize)}
                  onChange={(val) => setPageSize(Number(val))}
                  options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
                  size="small"
                  sx={{ minWidth: 110 }}
                />
              </Stack>
            </Stack>
          </AdminSectionCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2}>
            <ProfessionalSummaryWidget />
            <VerificationOverviewWidget />
            <TopCategoriesWidget />
            <RecentlyJoinedWidget />
          </Stack>
        </Grid>
      </Grid>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => setRowMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 160,
              borderRadius: 2,
              border: `1px solid ${tokens.cardBorder}`,
            },
          },
        }}
      >
        <MenuItem onClick={() => setRowMenuAnchor(null)} sx={{ fontSize: 13 }}>
          View details
        </MenuItem>
        <MenuItem onClick={() => setRowMenuAnchor(null)} sx={{ fontSize: 13 }}>
          Suspend
        </MenuItem>
      </Menu>

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
    </>
  );
}
