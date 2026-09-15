import * as React from "react";
import {
  useGetAdminClientsQuery,
  useUpdateAdminClientMutation,
  type AdminClient,
} from "../../../../store/services/adminApi";
import { exportClientsToExcel } from "../../exportClientsExcel";
import { exportClientsToPdf } from "../../exportClientsPdf";
import { INITIAL_VISIBLE, PAGE_SIZE } from "./adminClients.data";
import type { ClientModal, SortOption } from "./adminClients.types";
import { INPUT_LIMITS, parseText } from "../../../../lib/inputSchema";

type MockClient = AdminClient;

export function useAdminClientsPage() {
  const { data, isLoading, isError, refetch } = useGetAdminClientsQuery();
  const [updateAdminClient] = useUpdateAdminClientMutation();
  const clients = (data?.data?.items ?? []) as MockClient[];
  const summary = data?.data?.summary ?? {
    totalIC: 0,
    totalCC: 0,
    totalClients: 0,
    totalBookings: 0,
  };

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [regDateFrom, setRegDateFrom] = React.useState("");
  const [regDateTo, setRegDateTo] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("reg_desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE);
  const [usePagination, setUsePagination] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [modal, setModal] = React.useState<ClientModal>(null);
  const [activeClient, setActiveClient] = React.useState<MockClient | null>(
    null,
  );
  const [draftNote, setDraftNote] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const exportMenuOpen = Boolean(exportMenuAnchor);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resetListView = React.useCallback(() => {
    setVisibleCount(INITIAL_VISIBLE);
    setUsePagination(false);
    setPage(1);
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients
      .filter((client) => {
        const matchesSearch =
          !q ||
          client.name.toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q) ||
          client.phone.includes(q);
        const matchesType =
          typeFilter.length === 0 || typeFilter.includes(client.type);
        const matchesStatus =
          statusFilter === "all" || client.accountStatus === statusFilter;
        const matchesFrom =
          !regDateFrom || client.registrationDate >= regDateFrom;
        const matchesTo = !regDateTo || client.registrationDate <= regDateTo;
        return (
          matchesSearch &&
          matchesType &&
          matchesStatus &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => {
        const field = sortBy.startsWith("reg")
          ? "registrationDate"
          : "lastBookingDate";
        const comparison = a[field].localeCompare(b[field]);
        return sortBy.endsWith("_desc") ? -comparison : comparison;
      });
  }, [
    clients,
    search,
    typeFilter,
    statusFilter,
    regDateFrom,
    regDateTo,
    sortBy,
  ]);

  React.useEffect(() => {
    resetListView();
  }, [
    search,
    typeFilter,
    statusFilter,
    regDateFrom,
    regDateTo,
    sortBy,
    resetListView,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const displayed = React.useMemo(() => {
    if (usePagination) {
      const start = (page - 1) * PAGE_SIZE;
      return filtered.slice(start, start + PAGE_SIZE);
    }

    return filtered.slice(0, visibleCount);
  }, [filtered, usePagination, page, visibleCount]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const showLoadMore =
    !usePagination &&
    visibleCount === INITIAL_VISIBLE &&
    filtered.length > INITIAL_VISIBLE;
  const showPagination = usePagination && filtered.length > PAGE_SIZE;
  const showingFrom =
    filtered.length === 0 ? 0 : usePagination ? (page - 1) * PAGE_SIZE + 1 : 1;
  const showingTo = usePagination
    ? Math.min(page * PAGE_SIZE, filtered.length)
    : Math.min(visibleCount, filtered.length);

  const openClientModal = (client: MockClient, type: ClientModal) => {
    setActiveClient(client);
    setModal(type);
    if (type === "note") setDraftNote(client.note ?? "");
  };

  const closeModal = () => {
    setModal(null);
    setActiveClient(null);
    setDraftNote("");
  };

  const handleLoadMore = () => {
    setVisibleCount(PAGE_SIZE);
    if (filtered.length > PAGE_SIZE) {
      setUsePagination(true);
      setPage(1);
    }
  };

  const handleApplyStatus = async () => {
    if (!activeClient || activeClient.accountStatus === "deleted") return;
    const nextStatus =
      activeClient.accountStatus === "active" ? "disabled" : "active";
    await updateAdminClient({ id: activeClient.id, accountStatus: nextStatus });
    closeModal();
  };

  const handleApplyDelete = async () => {
    if (!activeClient) return;
    const id = activeClient.id;
    await updateAdminClient({ id, delete: true });
    setSelected((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
    closeModal();
  };

  const handleSaveNote = async () => {
    if (!activeClient) return;
    const parsed = parseText(draftNote, {
      required: false,
      label: "Note",
      min: INPUT_LIMITS.notesMin,
      max: null,
    });
    if (!parsed.ok) return;
    await updateAdminClient({ id: activeClient.id, note: parsed.value });
    closeModal();
  };

  const clientHasNote = (client: MockClient) =>
    Boolean(client.note?.trim() || client.hasNotes);

  const toggleSelect = (id: string) => {
    setSelected((previousSelection) => {
      const nextSelection = new Set(previousSelection);
      if (nextSelection.has(id)) nextSelection.delete(id);
      else nextSelection.add(id);
      return nextSelection;
    });
  };

  const toggleSelectAll = () => {
    const displayedIds = displayed.map((row) => row.id);
    const allSelected = displayedIds.every((id) => selected.has(id));
    setSelected((previousSelection) => {
      const nextSelection = new Set(previousSelection);
      if (allSelected) displayedIds.forEach((id) => nextSelection.delete(id));
      else displayedIds.forEach((id) => nextSelection.add(id));
      return nextSelection;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const resetFilters = () => {
    setSearch("");
    setTypeFilter([]);
    setStatusFilter("all");
    setRegDateFrom("");
    setRegDateTo("");
    setSortBy("reg_desc");
    resetListView();
  };

  const handleExportExcel = () => {
    const exported = exportClientsToExcel(filtered, "client-management");
    setExportNotice(
      exported
        ? `Exported ${filtered.length} client${filtered.length === 1 ? "" : "s"} to Excel.`
        : "No clients to export for the current filters.",
    );
    setExportMenuAnchor(null);
  };

  const handleExportPdf = async () => {
    const exported = await exportClientsToPdf(filtered, "client-management");
    setExportNotice(
      exported
        ? `Exported ${filtered.length} client${filtered.length === 1 ? "" : "s"} to PDF.`
        : "No clients to export for the current filters.",
    );
    setExportMenuAnchor(null);
  };

  React.useEffect(() => {
    if (!exportNotice) return;
    const timer = window.setTimeout(() => setExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  const allPageSelected =
    displayed.length > 0 && displayed.every((row) => selected.has(row.id));
  const somePageSelected =
    displayed.some((row) => selected.has(row.id)) && !allPageSelected;
  const isDisabling = activeClient?.accountStatus === "active";
  const { totalIC, totalCC, totalClients, totalBookings } = summary;
  const icPct = totalClients ? ((totalIC / totalClients) * 100).toFixed(1) : "0.0";
  const ccPct = totalClients ? ((totalCC / totalClients) * 100).toFixed(1) : "0.0";

  return {
    activeClient,
    allPageSelected,
    ccPct,
    clearSelection,
    clientHasNote,
    closeModal,
    displayed,
    draftNote,
    exportMenuAnchor,
    exportMenuOpen,
    exportNotice,
    filtered,
    handleApplyDelete,
    handleApplyStatus,
    handleExportExcel,
    handleExportPdf,
    handleLoadMore,
    handleSaveNote,
    icPct,
    isDisabling,
    isError,
    isLoading,
    modal,
    mounted,
    openClientModal,
    page,
    pageCount,
    refetch,
    regDateFrom,
    regDateTo,
    resetFilters,
    search,
    selected,
    setDraftNote,
    setExportMenuAnchor,
    setPage,
    setRegDateFrom,
    setRegDateTo,
    setSearch,
    setSortBy,
    setStatusFilter,
    setTypeFilter,
    showLoadMore,
    showPagination,
    showingFrom,
    showingTo,
    somePageSelected,
    sortBy,
    statusFilter,
    toggleSelect,
    toggleSelectAll,
    totalBookings,
    totalCC,
    totalClients,
    totalIC,
    typeFilter,
  };
}
