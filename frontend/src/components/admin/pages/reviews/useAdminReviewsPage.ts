"use client";

import * as React from "react";
import { ratingCategoryDefaults } from "../../adminMockData";
import {
  mockFlaggedKeywordsList,
  mockFlaggedReviewRows,
  type FlaggedReviewRow,
  type ReviewTabId,
} from "../../reviewsData";
import { exportReviewsToExcel } from "../../exportReviewsExcel";
import { exportReviewsToPdf } from "../../exportReviewsPdf";
import { PAGE_SIZE_OPTIONS } from "./reviews.data";

export function useAdminReviewsPage() {
  const [activeTab, setActiveTab] =
    React.useState<ReviewTabId>("flagged-reviews");
  const [reviews, setReviews] = React.useState(mockFlaggedReviewRows);
  const [keywords, setKeywords] = React.useState(mockFlaggedKeywordsList);
  const [newKeyword, setNewKeyword] = React.useState("");
  const [ranges, setRanges] = React.useState(ratingCategoryDefaults);
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

  const addKeyword = () => {
    const keyword = newKeyword.trim().toLowerCase();
    if (!keyword || keywords.includes(keyword)) return;
    setKeywords((previous) => [...previous, keyword]);
    setNewKeyword("");
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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setReviews((previous) =>
      previous.filter((review) => review.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  };

  return {
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
  };
}
