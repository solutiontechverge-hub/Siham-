"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import { AppSelect } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { type AdminTableColumn } from "../AdminDataTable";
import { mockActivityLog } from "../adminMockData";

type LogEntry = (typeof mockActivityLog)[number];

export default function AdminActivityLogPage() {
  const [adminFilter, setAdminFilter] = React.useState("all");

  const admins = Array.from(new Set(mockActivityLog.map((l) => l.admin)));
  const filtered =
    adminFilter === "all" ? mockActivityLog : mockActivityLog.filter((l) => l.admin === adminFilter);

  const columns: AdminTableColumn<LogEntry>[] = [
    { id: "timestamp", label: "Timestamp", render: (r) => r.timestamp },
    { id: "admin", label: "Admin", render: (r) => r.admin },
    { id: "action", label: "Action type", render: (r) => r.action },
    { id: "description", label: "Description", minWidth: 240, render: (r) => r.description },
  ];

  return (
    <>
      <AdminPageHeader
        title="Activity log"
        description="Audit trail of admin actions across the platform."
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <AppSelect
          label="Filter by admin"
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          sx={{ minWidth: 220 }}
          options={[
            { value: "all", label: "All admins" },
            ...admins.map((a) => ({ value: a, label: a })),
          ]}
        />
      </Stack>

      <AdminSectionCard noPadding>
        <AdminDataTable columns={columns} rows={filtered} getRowId={(r) => r.id} dense />
      </AdminSectionCard>
    </>
  );
}
