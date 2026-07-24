import * as React from "react";
import {
  mockProfessionals,
  professionalManagementSummary,
} from "../../adminMockData";
import { exportProfessionalsToExcel } from "../../exportProfessionalsExcel";
import { exportProfessionalsToPdf } from "../../exportProfessionalsPdf";
import { isActiveAccount } from "./professionals.data";
import type { MockProfessional } from "./professionals.types";

export function useAdminProfessionalsPage() {
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

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return mockProfessionals.filter((professional) =>
      (!q || professional.brandName.toLowerCase().includes(q) || professional.email.toLowerCase().includes(q) || professional.phone.includes(q) || professional.id.toLowerCase().includes(q)) &&
      (categoryFilter === "all" || professional.primaryCategory === categoryFilter) &&
      (statusFilter === "all" || (statusFilter === "active" ? isActiveAccount(professional.accountStatus) : !isActiveAccount(professional.accountStatus))) &&
      (verificationFilter === "all" || professional.validationStatus === verificationFilter) &&
      (!regDateFrom || professional.registrationDate >= regDateFrom) &&
      (!regDateTo || professional.registrationDate <= regDateTo),
    );
  }, [search, categoryFilter, statusFilter, verificationFilter, regDateFrom, regDateTo]);

  React.useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, verificationFilter, regDateFrom, regDateTo, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = React.useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  React.useEffect(() => {
    if (!exportNotice) return;
    const timer = window.setTimeout(() => setExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  const toggleSelect = (id: string) => setSelected((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleSelectAll = () => {
    const pageIds = displayed.map((row) => row.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((previous) => {
      const next = new Set(previous);
      pageIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };
  const resetFilters = () => {
    setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); setVerificationFilter("all");
    setRegDateFrom(""); setRegDateTo(""); setPage(1); setHighlightedIds(new Set());
  };
  const highlightExportedRows = (rows: MockProfessional[]) => {
    const ids = new Set(rows.map((row) => row.id));
    setSelected(ids); setHighlightedIds(ids);
    window.setTimeout(() => setHighlightedIds(new Set()), 2400);
  };
  const handleExportExcel = () => {
    const ok = exportProfessionalsToExcel(filtered, "professional-management");
    setExportNotice(ok ? `Exported ${filtered.length} professional${filtered.length === 1 ? "" : "s"} to Excel.` : "No professionals to export for the current filters.");
    if (ok) highlightExportedRows(filtered);
    setExportMenuAnchor(null);
  };
  const handleExportPdf = async () => {
    const ok = await exportProfessionalsToPdf(filtered, "professional-management");
    setExportNotice(ok ? `Exported ${filtered.length} professional${filtered.length === 1 ? "" : "s"} to PDF.` : "No professionals to export for the current filters.");
    if (ok) highlightExportedRows(filtered);
    setExportMenuAnchor(null);
  };

  return {
    ...professionalManagementSummary, search, setSearch, categoryFilter, setCategoryFilter, statusFilter, setStatusFilter,
    verificationFilter, setVerificationFilter, regDateFrom, setRegDateFrom, regDateTo, setRegDateTo, selected, page,
    setPage, pageSize, setPageSize, bulkMenuAnchor, setBulkMenuAnchor, exportMenuAnchor, setExportMenuAnchor,
    rowMenuAnchor, setRowMenuAnchor, exportNotice, highlightedIds, filtered, pageCount, displayed,
    showingFrom: filtered.length === 0 ? 0 : (page - 1) * pageSize + 1,
    showingTo: Math.min(page * pageSize, filtered.length),
    allPageSelected: displayed.length > 0 && displayed.every((row) => selected.has(row.id)),
    somePageSelected: displayed.some((row) => selected.has(row.id)) && !displayed.every((row) => selected.has(row.id)),
    toggleSelect, toggleSelectAll, resetFilters, highlightExportedRows, handleExportExcel, handleExportPdf,
  };
}
