"use client";

import { Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { type AdminTableColumn } from "../AdminDataTable";
import { mockReports } from "../adminMockData";

type Report = (typeof mockReports)[number];

export default function AdminReportsPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;

  const columns: AdminTableColumn<Report>[] = [
    { id: "reporter", label: "Reporter", render: (r) => r.reporter },
    { id: "reported", label: "Reported user", render: (r) => r.reported },
    { id: "reason", label: "Reason", minWidth: 160, render: (r) => r.reason },
    { id: "date", label: "Date reported", render: (r) => r.date },
    {
      id: "status",
      label: "Status",
      render: (r) => (
        <Chip
          label={r.status === "new" ? "New" : "Viewed"}
          size="small"
          sx={{
            bgcolor: r.status === "new" ? tokens.mintSoft : tokens.surface,
            color: r.status === "new" ? tokens.tealDark : tokens.slate,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      render: () => (
        <Stack direction="row" spacing={1}>
          <AppButton size="small" variant="outlined" sx={{ fontSize: 11, textTransform: "none" }}>
            Mark viewed
          </AppButton>
          <AppButton size="small" variant="outlined" color="inherit" sx={{ fontSize: 11, textTransform: "none" }}>
            Delete from list
          </AppButton>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Review user reports submitted by clients and professionals."
      />

      <AdminSectionCard noPadding>
        <AdminDataTable columns={columns} rows={mockReports} getRowId={(r) => r.id} />
      </AdminSectionCard>
    </>
  );
}
