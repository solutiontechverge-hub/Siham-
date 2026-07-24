"use client";

import * as React from "react";
import {
  mockReportRows,
  type ReportRow,
  type ReportStatus,
} from "../../reportsData";
import { exportReportsToExcel } from "../../exportReportsExcel";
import { exportReportsToPdf } from "../../exportReportsPdf";
import { PAGE_SIZE_OPTIONS } from "./reports.data";

export function useAdminReportsPage() {
  const [reports, setReports] = React.useState(mockReportRows);
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
    if (selectedRows.size === pagedReports.length) {
      setSelectedRows(new Set());
      return;
    }
    setSelectedRows(new Set(pagedReports.map((report) => report.id)));
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

  const handleExportExcel = () => {
    exportReportsToExcel(exportRows, "reports");
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    await exportReportsToPdf(exportRows, "reports");
    setExportMenuAnchor(null);
  };

  const deleteReport = (id: string) => {
    setReports((previous) => previous.filter((report) => report.id !== id));
    setSelectedRows((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteReport(deleteTarget.id);
    if (drawerReportId === deleteTarget.id) setDrawerReportId(null);
    setDeleteTarget(null);
  };

  const updateReportStatus = (id: string, status: ReportStatus) => {
    setReports((previous) =>
      previous.map((report) =>
        report.id === id ? { ...report, status } : report,
      ),
    );
  };

  return {
    drawerReport,
    deleteTarget,
    exportMenuAnchor,
    filteredReports,
    page,
    pageSize,
    pagedReports,
    selectedRows,
    search,
    statusFilter,
    totalPages,
    typeFilter,
    dateFrom,
    dateTo,
    setDeleteTarget,
    setDrawerReportId,
    setExportMenuAnchor,
    setPage,
    setPageSize,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    toggleSelect,
    toggleSelectAll,
    resetFilters,
    handleDateRangeChange,
    handleExportExcel,
    handleExportPdf,
    confirmDelete,
    updateReportStatus,
  };
}
