"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppButton,
  AppPagination,
  AppSearchField,
  AppSelect,
  AppTextField,
  KeywordTagsInput,
} from "../../../common";
import AppModal from "../../../common/AppModal";
import AdminFilterDateRange from "../../AdminFilterDateRange";
import AdminFilterPanel, { AdminFilterPanelRow } from "../../AdminFilterPanel";
import AdminSectionCard from "../../AdminSectionCard";
import AdminUnderlineTabs from "../../AdminUnderlineTabs";
import AdminDataTable, {
  AdminSummaryGrid,
  type AdminTableColumn,
} from "../../AdminDataTable";
import { AdminDashboardFooter } from "../../AdminDashboardHeader";
import { ADMIN_CARD_PADDING as pad } from "../../adminCardPadding";
import {
  PROFESSIONAL_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  ratingCategoryConfig,
  REVIEW_TABS,
  reviewSummaryStats,
  type FlaggedReviewRow,
  type ReviewTabId,
} from "../../reviewsData";
import { PAGE_SIZE_OPTIONS, formatDisplayDate } from "./reviews.data";
import type { AdminReviewsPageProps, RatingRanges } from "./reviews.types";
import { useAdminReviewsPage } from "./useAdminReviewsPage";

function StarRating({ value }: { value: number }) {
  const tokens = useTheme().palette.mollure;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Stack direction="row" spacing={0.15}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarRoundedIcon
            key={star}
            sx={{
              fontSize: 14,
              color: star <= value ? "#FAAF00" : alpha(tokens.slate, 0.25),
            }}
          />
        ))}
      </Stack>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}>
        {value.toFixed(1)}
      </Typography>
    </Stack>
  );
}

function HighlightedReviewText({
  text,
  keywords,
}: {
  text: string;
  keywords: string[];
}) {
  const tokens = useTheme().palette.mollure;
  const pattern = new RegExp(
    `\\b(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <Typography sx={{ fontSize: 12, color: tokens.bodyText, lineHeight: 1.5 }}>
      {parts.map((part, i) => {
        const isMatch = keywords.some(
          (k) => k.toLowerCase() === part.toLowerCase(),
        );
        if (!isMatch) return <span key={i}>{part}</span>;
        return (
          <Box
            key={i}
            component="span"
            sx={{
              display: "inline",
              px: 0.5,
              py: 0.1,
              mx: 0.15,
              borderRadius: 0.75,
              border: `1px solid ${alpha("#D92D20", 0.35)}`,
              bgcolor: alpha("#D92D20", 0.08),
              color: "#B42318",
              fontWeight: 600,
              fontSize: 11.5,
            }}
          >
            {part}
          </Box>
        );
      })}
    </Typography>
  );
}

function ReviewsSidebar({
  keywords,
  onKeywordsChange,
  newKeyword,
  onNewKeywordChange,
  onAddKeyword,
  ranges,
  onRangesChange,
  onTabChange,
}: {
  keywords: string[];
  onKeywordsChange: (kw: string[]) => void;
  newKeyword: string;
  onNewKeywordChange: (v: string) => void;
  onAddKeyword: () => void;
  ranges: RatingRanges;
  onRangesChange: (
    next: RatingRanges | ((prev: RatingRanges) => RatingRanges),
  ) => void;
  onTabChange: (tab: ReviewTabId) => void;
}) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack spacing={1.5}>
      <AdminSectionCard title="Flagged Keywords" compact>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <AppTextField
            placeholder="Add keyword..."
            value={newKeyword}
            onChange={(e) => onNewKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddKeyword()}
            fullWidth
            size="small"
          />
          <AppButton
            variant="contained"
            onClick={onAddKeyword}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            Add
          </AppButton>
        </Stack>
        <KeywordTagsInput
          value={keywords}
          onChange={onKeywordsChange}
          maxKeywords={50}
          placeholder=""
        />
        <Typography
          component="button"
          type="button"
          onClick={() => onTabChange("flagged-keywords")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1.5,
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: tokens.teal,
            p: 0,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          View all keywords
          <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
        </Typography>
      </AdminSectionCard>

      <AdminSectionCard title="Rating Category Settings" compact>
        <Stack spacing={1}>
          {ratingCategoryConfig.map((cat) => (
            <Stack
              key={cat.id}
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: cat.bg,
                border: `1px solid ${alpha(cat.color, 0.15)}`,
              }}
            >
              <Typography sx={{ fontSize: 18, lineHeight: 1 }}>
                {cat.emoji}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
                >
                  {cat.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
                  {ranges[cat.id].min.toFixed(1)} â€“{" "}
                  {ranges[cat.id].max.toFixed(1)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                aria-label={`Edit ${cat.label} range`}
                onClick={() => onTabChange("rating-categories")}
                sx={{ color: tokens.slate }}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </AdminSectionCard>
    </Stack>
  );
}

export default function AdminReviewsPageView({
  embedded = false,
}: AdminReviewsPageProps) {
  const tokens = useTheme().palette.mollure;
  const {
    activeTab,
    dateFrom,
    dateTo,
    deleteTarget,
    exportMenuAnchor,
    filteredReviews,
    keywords,
    newKeyword,
    page,
    pageSize,
    pagedReviews,
    professionalFilter,
    ranges,
    ratingFilter,
    search,
    totalPages,
    setActiveTab,
    setDeleteTarget,
    setExportMenuAnchor,
    setKeywords,
    setNewKeyword,
    setPage,
    setPageSize,
    setProfessionalFilter,
    setRanges,
    setRatingFilter,
    setSearch,
    addKeyword,
    confirmDelete,
    handleDateRangeChange,
    handleExportExcel,
    handleExportPdf,
    resetFilters,
  } = useAdminReviewsPage();

  const reviewColumns: AdminTableColumn<FlaggedReviewRow>[] = [
    {
      id: "professional",
      label: "Professional",
      minWidth: 180,
      render: (r) => (
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
            {r.professionalInitials}
          </Avatar>
          <Box>
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
            >
              {r.professional}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
              {r.professionalCategory}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: "client",
      label: "Client (Reviewer)",
      minWidth: 160,
      render: (r) => (
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: alpha(tokens.navy, 0.08),
              color: tokens.navy,
            }}
          >
            {r.clientInitials}
          </Avatar>
          <Box>
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, color: tokens.navy }}
            >
              {r.client}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
              {r.clientType}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: "rating",
      label: "Rating",
      minWidth: 120,
      render: (r) => <StarRating value={r.rating} />,
    },
    {
      id: "review",
      label: "Review",
      minWidth: 240,
      render: (r) => (
        <HighlightedReviewText text={r.text} keywords={keywords} />
      ),
    },
    {
      id: "date",
      label: "Date",
      minWidth: 120,
      render: (r) => (
        <Box>
          <Typography sx={{ fontSize: 12, color: tokens.navy }}>
            {formatDisplayDate(r.date)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: tokens.slate }}>
            {r.time}
          </Typography>
        </Box>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center",
      render: (r) => (
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <IconButton
            size="small"
            aria-label="View review"
            sx={{ color: tokens.slate }}
          >
            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Hide review"
            sx={{ color: tokens.slate }}
          >
            <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Delete review"
            onClick={() => setDeleteTarget(r)}
            sx={{ color: "#D92D20" }}
          >
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const summaryItems = [
    {
      label: "Flagged Reviews",
      value: reviewSummaryStats.flaggedReviews,
      sub: "Total flagged reviews",
      icon: RateReviewOutlinedIcon,
      iconBg: "rgba(217, 45, 32, 0.12)",
      iconColor: "#D92D20",
    },
    {
      label: "Pending Action",
      value: reviewSummaryStats.pendingAction,
      sub: "Require your attention",
      icon: PendingActionsOutlinedIcon,
      iconBg: "rgba(220, 104, 3, 0.14)",
      iconColor: "#DC6803",
    },
    {
      label: "Removed",
      value: reviewSummaryStats.removed,
      sub: "From public listing",
      icon: DeleteOutlineOutlinedIcon,
      iconBg: "rgba(76, 175, 80, 0.12)",
      iconColor: "#2E7D32",
    },
    {
      label: "Hidden (Admin Only)",
      value: reviewSummaryStats.hidden,
      sub: "Removed from admin list",
      icon: VisibilityOffOutlinedIcon,
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563EB",
    },
  ];

  const renderFlaggedReviewsTab = () => (
    <>
      <AdminSummaryGrid items={summaryItems} embedded />

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
                    placeholder="Search reviews..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={professionalFilter}
                    onChange={(e) =>
                      setProfessionalFilter(e.target.value as string)
                    }
                    options={PROFESSIONAL_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 160 } }}
                  />
                </AdminFilterPanelRow>
                <AdminFilterPanelRow horizontal>
                  <AppSelect
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value as string)}
                    options={RATING_FILTER_OPTIONS}
                    size="small"
                    fullWidth
                    sx={{ minWidth: { lg: 130 } }}
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
                <AdminFilterPanelRow horizontal>
                  <AppButton
                    variant="outlined"
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      height: 40,
                    }}
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
                    <MenuItem
                      onClick={handleExportPdf}
                      sx={{ fontSize: 13, gap: 1.25 }}
                    >
                      <PictureAsPdfOutlinedIcon
                        sx={{ fontSize: 18, color: "#D92D20" }}
                      />
                      Download PDF
                    </MenuItem>
                    <MenuItem
                      onClick={handleExportExcel}
                      sx={{ fontSize: 13, gap: 1.25 }}
                    >
                      <TableChartOutlinedIcon
                        sx={{ fontSize: 18, color: "#2E7D32" }}
                      />
                      Download Excel
                    </MenuItem>
                  </Menu>
                </AdminFilterPanelRow>
              </AdminFilterPanel>
            </Box>

            <AdminDataTable
              columns={reviewColumns}
              rows={pagedReviews}
              getRowId={(r) => r.id}
              dense
            />

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
                  {filteredReviews.length === 0 ? 0 : (page - 1) * pageSize + 1}{" "}
                  to {Math.min(page * pageSize, filteredReviews.length)} of{" "}
                  {filteredReviews.length} results
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
          <ReviewsSidebar
            keywords={keywords}
            onKeywordsChange={setKeywords}
            newKeyword={newKeyword}
            onNewKeywordChange={setNewKeyword}
            onAddKeyword={addKeyword}
            ranges={ranges}
            onRangesChange={setRanges}
            onTabChange={setActiveTab}
          />
        </Grid>
      </Grid>
    </>
  );

  const renderFlaggedKeywordsTab = () => (
    <AdminSectionCard title="Flagged keyword settings">
      <Typography sx={{ fontSize: 13, color: tokens.bodyText, mb: 2 }}>
        Words that automatically flag a review for admin review.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2, maxWidth: 480 }}>
        <AppTextField
          placeholder="Add keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          fullWidth
          size="small"
        />
        <AppButton
          variant="contained"
          onClick={addKeyword}
          sx={{ textTransform: "none" }}
        >
          Add
        </AppButton>
      </Stack>
      <KeywordTagsInput
        value={keywords}
        onChange={setKeywords}
        maxKeywords={50}
        placeholder="Manage flagged keywords"
      />
    </AdminSectionCard>
  );

  const renderRatingCategoriesTab = () => (
    <AdminSectionCard title="Rating category settings">
      <Stack spacing={2} sx={{ maxWidth: 520 }}>
        {ratingCategoryConfig.map((cat) => (
          <Stack
            key={cat.id}
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: cat.bg,
              border: `1px solid ${alpha(cat.color, 0.15)}`,
            }}
          >
            <Typography sx={{ fontSize: 22 }}>{cat.emoji}</Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: tokens.navy,
                minWidth: 80,
              }}
            >
              {cat.label}
            </Typography>
            <AppTextField
              label="Min"
              type="number"
              size="small"
              value={ranges[cat.id].min}
              onChange={(e) =>
                setRanges((prev) => ({
                  ...prev,
                  [cat.id]: {
                    ...prev[cat.id],
                    min: parseFloat(e.target.value) || 0,
                  },
                }))
              }
              sx={{ width: 90 }}
            />
            <Typography sx={{ color: tokens.slate }}>â€“</Typography>
            <AppTextField
              label="Max"
              type="number"
              size="small"
              value={ranges[cat.id].max}
              onChange={(e) =>
                setRanges((prev) => ({
                  ...prev,
                  [cat.id]: {
                    ...prev[cat.id],
                    max: parseFloat(e.target.value) || 0,
                  },
                }))
              }
              sx={{ width: 90 }}
            />
          </Stack>
        ))}
        <AppButton
          variant="contained"
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
        >
          Save ranges
        </AppButton>
      </Stack>
    </AdminSectionCard>
  );

  const tabPanels: Record<ReviewTabId, React.ReactNode> = {
    "flagged-reviews": renderFlaggedReviewsTab(),
    "flagged-keywords": renderFlaggedKeywordsTab(),
    "rating-categories": renderRatingCategoriesTab(),
  };

  return (
    <>
      {!embedded ? (
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
            <Typography sx={{ fontSize: 12, color: tokens.bodyText }}>
              /
            </Typography>
            <Typography
              sx={{ fontSize: 12, color: tokens.navy, fontWeight: 500 }}
            >
              Rating & Review Management
            </Typography>
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="mainHeading"
              sx={{
                fontSize: { xs: 24, md: 28 },
                color: tokens.textcolorgrey700,
                mb: 0.5,
              }}
            >
              Rating & Review Management
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: tokens.bodyText, maxWidth: 640 }}
            >
              Manage flagged keywords, review moderation and rating categories.
            </Typography>
          </Box>
        </>
      ) : null}

      <AdminUnderlineTabs
        tabs={REVIEW_TABS}
        value={activeTab}
        onChange={(id) => setActiveTab(id as ReviewTabId)}
      />

      <Box role="tabpanel">{tabPanels[activeTab]}</Box>

      {!embedded ? <AdminDashboardFooter /> : null}

      <AppModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete review"
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
                Are you sure you want to delete this review?
              </Typography>
              {deleteTarget ? (
                <Typography
                  sx={{ fontSize: 13, color: tokens.bodyText, mt: 0.75 }}
                >
                  Review by <strong>{deleteTarget.client}</strong> for{" "}
                  <strong>{deleteTarget.professional}</strong> will be
                  permanently removed.
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>
      </AppModal>
    </>
  );
}
