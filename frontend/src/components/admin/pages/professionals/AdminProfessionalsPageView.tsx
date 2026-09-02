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
import {
  AppButton,
  AppDropdown,
  AppPagination,
  AppSearchField,
  AppSelect,
} from "../../../common";
import AdminFilterDateRange from "../../AdminFilterDateRange";
import AdminFilterField from "../../AdminFilterField";
import AdminPageHeader from "../../AdminPageHeader";
import AdminSectionCard from "../../AdminSectionCard";
import AdminDataTable, { type AdminTableColumn } from "../../AdminDataTable";
import AdminKpiCard from "../../AdminKpiCard";
import {
  ProfessionalSummaryWidget,
  RecentlyJoinedWidget,
  TopCategoriesWidget,
  VerificationOverviewWidget,
} from "../../AdminProfessionalWidgets";
import {
  type MockProfessional,
  type ProfessionalCategory,
} from "./professionals.types";
import { ADMIN_CARD_PADDING as pad } from "../../adminCardPadding";
import { exportProfessionalsToExcel } from "../../exportProfessionalsExcel";
import { exportProfessionalsToPdf } from "../../exportProfessionalsPdf";
import {
  CATEGORY_CHIP_COLORS,
  CATEGORY_OPTIONS,
  formatDisplayDate,
  getInitials,
  isActiveAccount,
  PAGE_SIZE_OPTIONS,
  VERIFICATION_STYLES,
} from "./professionals.data";
import { useAdminProfessionalsPage } from "./useAdminProfessionalsPage";

function StatusPill({
  bg,
  fg,
  label,
}: {
  bg: string;
  fg: string;
  label: string;
}) {
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
    return (
      <Typography sx={{ fontSize: 12, color: tokens.slate }}>â€”</Typography>
    );
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
                color:
                  star <= Math.round(value)
                    ? "#FAAF00"
                    : alpha(tokens.slate, 0.25),
              }}
            />
          ))}
        </Stack>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}>
          {value.toFixed(1)}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 10.5, color: tokens.bodyText }}>
        ({count} reviews)
      </Typography>
    </Stack>
  );
}

function CategoryChip({ category }: { category: ProfessionalCategory }) {
  const colors = CATEGORY_CHIP_COLORS[category];
  return <StatusPill bg={colors.bg} fg={colors.fg} label={category} />;
}

export default function AdminProfessionalsPageView() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const {
    total, verified, pending, rejected, inactive, growthTrend, search, setSearch,
    categoryFilter, setCategoryFilter, statusFilter, setStatusFilter,
    verificationFilter, setVerificationFilter, regDateFrom, setRegDateFrom,
    regDateTo, setRegDateTo, selected, page, setPage, pageSize, setPageSize,
    bulkMenuAnchor, setBulkMenuAnchor, exportMenuAnchor, setExportMenuAnchor,
    rowMenuAnchor, setRowMenuAnchor, exportNotice, highlightedIds, filtered,
    pageCount, displayed, showingFrom, showingTo, allPageSelected, somePageSelected,
    toggleSelect, toggleSelectAll, resetFilters, highlightExportedRows,
    handleExportExcel, handleExportPdf,
  } = useAdminProfessionalsPage();

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
        <Checkbox
          size="small"
          checked={selected.has(r.id)}
          onChange={() => toggleSelect(r.id)}
        />
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
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}
                noWrap
              >
                {r.brandName}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: tokens.bodyText }}>
                ID: {r.id.toUpperCase()}
              </Typography>
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
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>
            {r.email}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
            {r.phone}
          </Typography>
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
            <VisibilityOutlinedIcon
              sx={{ fontSize: 18, color: tokens.slate }}
            />
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
          Professional Management
        </Typography>
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
            <AppButton
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              sx={{ textTransform: "none" }}
            >
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
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", lg: "flex-end" }}
              >
                <AdminFilterField label="Search by">
                  <AppSearchField
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", lg: 160 },
                      width: { xs: "100%", lg: 160 },
                      height: 40,
                      "& .MuiOutlinedInput-root": { height: 40 },
                      "& .MuiInputBase-input": { fontSize: 12, py: 0 },
                    }}
                  />
                </AdminFilterField>

                <AdminFilterField label="Category">
                  <AppSelect
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", lg: 120 },
                      width: { lg: 120 },
                      height: 40,
                      "& .MuiOutlinedInput-root": { height: 40 },
                      "& .MuiSelect-select": { fontSize: 12, py: "10px !important" },
                    }}
                    options={CATEGORY_OPTIONS}
                  />
                </AdminFilterField>

                <AdminFilterField label="Account Status">
                  <AppSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", lg: 120 },
                      width: { lg: 120 },
                      height: 40,
                      "& .MuiOutlinedInput-root": { height: 40 },
                      "& .MuiSelect-select": { fontSize: 12, py: "10px !important" },
                    }}
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </AdminFilterField>

                <AdminFilterField label="Verification Status">
                  <AppSelect
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", lg: 130 },
                      width: { lg: 130 },
                      height: 40,
                      "& .MuiOutlinedInput-root": { height: 40 },
                      "& .MuiSelect-select": { fontSize: 12, py: "10px !important" },
                    }}
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "validated", label: "Verified" },
                      { value: "pending", label: "Pending" },
                      { value: "not_validated", label: "Rejected" },
                    ]}
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
                    minWidth={{ xs: "100%", lg: 160 }}
                    height={40}
                  />
                </AdminFilterField>

                <AppButton
                  variant="text"
                  startIcon={<RefreshOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={resetFilters}
                  sx={{
                    textTransform: "none",
                    color: tokens.teal,
                    fontWeight: 600,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    alignSelf: { xs: "flex-start", lg: "flex-end" },
                    height: 40,
                    minWidth: "auto",
                    px: 0.75,
                    ml: { lg: 0.5 },
                  }}
                >
                  Reset Filters
                </AppButton>
              </Stack>

              {exportNotice ? (
                <Typography
                  sx={{ fontSize: 12, color: tokens.tealDark, fontWeight: 500 }}
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
                sx={{ fontSize: 13, fontWeight: 600, color: tokens.navy }}
              >
                Total Professionals:{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {filtered.length.toLocaleString()}
                </Box>
              </Typography>
              <AppButton
                variant="outlined"
                size="small"
                endIcon={
                  <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18 }} />
                }
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
                    const rows = filtered.filter((p) =>
                      selected.has(p.id),
                    );
                    const ok = exportProfessionalsToExcel(
                      rows,
                      "professional-management-selected",
                    );
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
              alignItems="center"
              spacing={2}
              useFlexGap
              sx={{
                px: pad.tableCellX,
                py: 2,
                borderTop: `1px solid ${tokens.cardBorder}`,
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
                Showing {showingFrom.toLocaleString()} to{" "}
                {showingTo.toLocaleString()} of{" "}
                {filtered.length.toLocaleString()} results
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                useFlexGap
                flexWrap="wrap"
                justifyContent={{ xs: "center", md: "flex-end" }}
                sx={{ gap: 1.5, flexShrink: 0 }}
              >
                {filtered.length > pageSize ? (
                  <Box sx={{ width: "fit-content", flexShrink: 0 }}>
                    <AppPagination
                      page={page}
                      count={pageCount}
                      onChange={(_, p) => setPage(p)}
                      size="small"
                      sx={{ "& .MuiPagination-ul": { flexWrap: "nowrap" } }}
                    />
                  </Box>
                ) : null}
                <AppDropdown
                  value={String(pageSize)}
                  onChange={(val) => setPageSize(Number(val))}
                  options={PAGE_SIZE_OPTIONS.map((n) => ({
                    value: String(n),
                    label: `${n} / page`,
                  }))}
                  size="small"
                  sx={{ minWidth: 110, flexShrink: 0 }}
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
        Â© 2025 Molur. All rights reserved.
      </Typography>
    </>
  );
}
