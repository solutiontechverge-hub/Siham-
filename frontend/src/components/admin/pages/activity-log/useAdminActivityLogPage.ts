import * as React from "react";
import { ACTION_STYLES } from "../../activityLogData";
import { exportActivityLogToExcel } from "../../exportActivityLogExcel";
import { exportActivityLogToPdf } from "../../exportActivityLogPdf";
import { useGetAdminActivityLogQuery } from "../../../../store/services/adminApi";
import { MODULE_ICONS, formatDateRangeLabel } from "./activity-log.data";
import type { ActivityLogAction, ActivityLogModule, ActivityLogRow } from "./activity-log.types";

export function useAdminActivityLogPage() {
  const [drawerLogId, setDrawerLogId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [userFilter, setUserFilter] = React.useState("all");
  const [actionFilter, setActionFilter] = React.useState("all");
  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ActivityLogRow | null>(null);
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(() => new Set());

  const queryArgs = React.useMemo(() => ({
    limit: 200, offset: 0, search: search.trim() || undefined, action: actionFilter,
    module: moduleFilter, user: userFilter, from: dateFrom || undefined, to: dateTo || undefined,
  }), [search, actionFilter, moduleFilter, userFilter, dateFrom, dateTo]);
  const { data, isLoading, isFetching, isError, refetch } = useGetAdminActivityLogQuery(queryArgs, { refetchOnMountOrArgChange: true });
  const logs = React.useMemo<ActivityLogRow[]>(() => (data?.data?.items ?? [])
    .filter((item) => !hiddenIds.has(item.id))
    .map((item) => ({
      id: item.id, date: item.date, time: item.time, user: item.user,
      action: (item.action in ACTION_STYLES ? item.action : "system") as ActivityLogAction,
      actionLabel: item.actionLabel || item.action,
      module: (item.module in MODULE_ICONS ? item.module : "system") as ActivityLogModule,
      moduleLabel: item.moduleLabel || item.module, details: item.details, ipAddress: item.ipAddress || "—",
    })), [data?.data?.items, hiddenIds]);

  const filteredLogs = logs;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const drawerLog = logs.find((log) => log.id === drawerLogId) ?? null;

  React.useEffect(() => setPage(1), [userFilter, actionFilter, moduleFilter, dateFrom, dateTo, search, pageSize]);
  React.useEffect(() => {
    if (drawerLogId && !logs.some((log) => log.id === drawerLogId)) setDrawerLogId(null);
  }, [logs, drawerLogId]);

  const resetFilters = () => {
    setSearch(""); setUserFilter("all"); setActionFilter("all"); setModuleFilter("all");
    setDateFrom(""); setDateTo(""); setPage(1);
  };
  const handleDateRangeChange = (start: string, end: string) => { setDateFrom(start); setDateTo(end); };
  const handleExportExcel = () => { exportActivityLogToExcel(filteredLogs, "activity-log"); setExportMenuAnchor(null); };
  const handleExportPdf = async () => { await exportActivityLogToPdf(filteredLogs, "activity-log"); setExportMenuAnchor(null); };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setHiddenIds((previous) => new Set(previous).add(deleteTarget.id));
    if (drawerLogId === deleteTarget.id) setDrawerLogId(null);
    setDeleteTarget(null);
  };

  return {
    drawerLog, setDrawerLogId, search, setSearch, userFilter, setUserFilter, actionFilter, setActionFilter,
    moduleFilter, setModuleFilter, dateFrom, dateTo, page, setPage, pageSize, setPageSize,
    exportMenuAnchor, setExportMenuAnchor, deleteTarget, setDeleteTarget, logs, filteredLogs, totalPages,
    pagedLogs, dateRangeLabel: formatDateRangeLabel(dateFrom, dateTo), summary: data?.data?.summary ?? { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    isLoading, isFetching, isError, refetch, resetFilters, handleDateRangeChange, handleExportExcel, handleExportPdf, confirmDelete,
  };
}
