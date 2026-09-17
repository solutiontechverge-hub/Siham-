"use client";

import * as React from "react";
import {
  useAddAdminKeywordMutation,
  useDeleteAdminReviewMutation,
  useGetAdminReviewsModerationQuery,
  useRemoveAdminKeywordMutation,
  useUpdateAdminRatingRangesMutation,
} from "../../../../store/services/adminApi";
import type { FlaggedReviewRow, ReviewTabId } from "../../reviewsData";
import { ratingCategoryDefaults } from "../../adminMockData";
import { exportReviewsToExcel } from "../../exportReviewsExcel";
import { exportReviewsToPdf } from "../../exportReviewsPdf";
import { PAGE_SIZE_OPTIONS } from "./reviews.data";
import type { RatingRanges } from "./reviews.types";
import { parseText } from "../../../../lib/inputSchema";

const DEFAULT_RANGES: RatingRanges = ratingCategoryDefaults;

export function useAdminReviewsPage() {
  const { data, isLoading } = useGetAdminReviewsModerationQuery();
  const [deleteAdminReview] = useDeleteAdminReviewMutation();
  const [addAdminKeyword] = useAddAdminKeywordMutation();
  const [removeAdminKeyword] = useRemoveAdminKeywordMutation();
  const [updateAdminRatingRanges] = useUpdateAdminRatingRangesMutation();

  const reviews = (data?.data?.items ?? []) as FlaggedReviewRow[];
  const keywords = data?.data?.keywords ?? [];
  const ranges: RatingRanges = {
    ...DEFAULT_RANGES,
    ...(data?.data?.ranges as Partial<RatingRanges> | undefined),
  };

  const [activeTab, setActiveTab] =
    React.useState<ReviewTabId>("flagged-reviews");
  const [newKeyword, setNewKeyword] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [professionalFilter, setProfessionalFilter] = React.useState("all");
  const [ratingFilter, setRatingFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [exportMenuAnchor, setExportMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<FlaggedReviewRow | null>(null);

  const addKeyword = async () => {
    const parsed = parseText(newKeyword, {
      label: "Keyword",
      min: 1,
      max: 64,
    });
    if (!parsed.ok) return;
    const keyword = parsed.value.toLowerCase();
    if (keywords.includes(keyword)) return;
    await addAdminKeyword(keyword);
    setNewKeyword("");
  };

  const setKeywords = async (next: string[] | ((prev: string[]) => string[])) => {
    const resolved = typeof next === "function" ? next(keywords) : next;
    const removed = keywords.filter((k) => !resolved.includes(k));
    for (const keyword of removed) {
      await removeAdminKeyword(keyword);
    }
  };

  const setRanges = async (
    next: RatingRanges | ((prev: RatingRanges) => RatingRanges),
  ) => {
    const resolved = typeof next === "function" ? next(ranges) : next;
    await updateAdminRatingRanges(resolved);
  };

  const filteredReviews = React.useMemo(
    () =>
      reviews.filter((review) => {
        if (
          professionalFilter !== "all" &&
          review.professional !== professionalFilter
        ) {
          return false;
        }
        if (ratingFilter !== "all" && review.rating !== Number(ratingFilter)) {
          return false;
        }
        if (dateFrom && review.date < dateFrom) return false;
        if (dateTo && review.date > dateTo) return false;
        if (!search.trim()) return true;

        const query = search.trim().toLowerCase();
        return (
          review.professional.toLowerCase().includes(query) ||
          review.client.toLowerCase().includes(query) ||
          review.text.toLowerCase().includes(query)
        );
      }),
    [
      reviews,
      professionalFilter,
      ratingFilter,
      dateFrom,
      dateTo,
      search,
    ],
  );
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const pagedReviews = filteredReviews.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  React.useEffect(() => {
    setPage(1);
  }, [professionalFilter, ratingFilter, dateFrom, dateTo, search, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setProfessionalFilter("all");
    setRatingFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateFrom(start);
    setDateTo(end);
  };

  const handleExportExcel = () => {
    exportReviewsToExcel(filteredReviews);
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    await exportReviewsToPdf(filteredReviews);
    setExportMenuAnchor(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAdminReview(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    activeTab,
    dateFrom,
    dateTo,
    deleteTarget,
    exportMenuAnchor,
    filteredReviews,
    isLoading,
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
  };
}
