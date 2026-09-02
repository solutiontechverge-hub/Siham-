"use client";

import * as React from "react";
import {
  useGetAdminReportsQuery,
  useUpdateAdminReportMutation,
} from "../../../../store/services/adminApi";
import type { ReportRow, ReportStatus } from "../../reportsData";
import { exportReportsToExcel } from "../../exportReportsExcel";
import { exportReportsToPdf } from "../../exportReportsPdf";
import { PAGE_SIZE_OPTIONS } from "./reports.data";

export function useAdminReportsPage() {
  const { data, isLoading } = useGetAdminReportsQuery();
  const [updateAdminReport] = useUpdateAdminReportMutation();
  const reports = (data?.data?.items ?? []) as ReportRow[];

  const [drawerReportId, setDrawerReportId] = React.useState<string | null>(
    null,
  );
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [exportMenuAnchor, setExportMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ReportRow | null>(
    null,
  );

  const filteredReports = React.useMemo(
    () =>
      reports.filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (typeFilter !== "all" && row.reasonCategory !== typeFilter) {
          return false;
        }
        if (dateFrom && row.date < dateFrom) return false;
        if (dateTo && row.date > dateTo) return false;
        if (!search.trim()) return true;

        const query = search.trim().toLowerCase();
        return (
          row.reporter.name.toLowerCase().includes(query) ||
          row.reporter.email.toLowerCase().includes(query) ||
          row.reported.name.toLowerCase().includes(query) ||
          row.reported.email.toLowerCase().includes(query) ||
          row.reasonCategory.toLowerCase().includes(query)
        );
      }),
    [reports, statusFilter, typeFilter, dateFrom, dateTo, search],
  );
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pagedReports = filteredReports.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const drawerReport = reports.find((report) => report.id === drawerReportId);
  const exportRows = React.useMemo(() => {
    const selected = reports.filter((report) => selectedRows.has(report.id));
    return selected.length > 0 ? selected : filteredReports;
  }, [reports, selectedRows, filteredReports]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, dateFrom, dateTo, search, pageSize]);

  React.useEffect(() => {
    if (drawerReportId && !reports.some((report) => report.id === drawerReportId)) {
      setDrawerReportId(null);
    }
  }, [reports, drawerReportId]);

  const toggleSelect = (id: string) => {
    setSelectedRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = pagedReports.map((row) => row.id);
    const allSelected = ids.every((id) => selectedRows.has(id));
    setSelectedRows((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const updateReportStatus = async (id: string, status: ReportStatus) => {
    await updateAdminReport({ id, status });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await updateAdminReport({ id: deleteTarget.id, delete: true });
    setDeleteTarget(null);
  };

  const handleExportExcel = () => {
    exportReportsToExcel(exportRows);
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    await exportReportsToPdf(exportRows);
    setExportMenuAnchor(null);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateFrom(start);
    setDateTo(end);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const setDrawerReportIdWithView = (id: string | null) => {
    setDrawerReportId(id);
    if (id) {
      const report = reports.find((row) => row.id === id);
      if (report?.status === "new") {
        void updateReportStatus(id, "viewed");
      }
    }
  };

  return {
    confirmDelete,
    dateFrom,
    dateTo,
    deleteTarget,
    drawerReport,
    drawerReportId,
    exportMenuAnchor,
    filteredReports,
    handleDateRangeChange,
    handleExportExcel,
    handleExportPdf,
    isLoading,
    page,
    pageSize,
    pagedReports,
    resetFilters,
    search,
    selectedRows,
    setDateFrom,
    setDateTo,
    setDeleteTarget,
    setDrawerReportId: setDrawerReportIdWithView,
    setExportMenuAnchor,
    setPage,
    setPageSize,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    toggleSelect,
    toggleSelectAll,
    totalPages,
    typeFilter,
    updateReportStatus,
  };
}
