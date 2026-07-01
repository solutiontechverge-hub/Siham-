"use client";

import * as React from "react";
import Link from "next/link";
import { Checkbox, Chip, IconButton, Stack, Typography, Box } from "@mui/material";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useTheme } from "@mui/material/styles";
import { AppButton, AppSearchField, AppSelect } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { AdminSummaryGrid, type AdminTableColumn } from "../AdminDataTable";
import { mockProfessionals, type MockProfessional } from "../adminMockData";

const statusColor = (
  status: MockProfessional["accountStatus"],
  tokens: { mintSoft: string; tealDark: string; warmwarning: string; requestAccent: string; sectionSurface: string; slate: string; surface: string; bodyText: string }
) => {
  switch (status) {
    case "active":
      return { bg: tokens.mintSoft, fg: tokens.tealDark };
    case "suspended":
      return { bg: tokens.warmwarning, fg: tokens.requestAccent };
    case "disabled":
      return { bg: tokens.sectionSurface, fg: tokens.slate };
    default:
      return { bg: tokens.surface, fg: tokens.bodyText };
  }
};

export default function AdminProfessionalsPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const [search, setSearch] = React.useState("");
  const [modeFilter, setModeFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = mockProfessionals.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.brandName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q);
    const matchesMode = modeFilter === "all" || p.serviceMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: AdminTableColumn<MockProfessional>[] = [
    {
      id: "select",
      label: "",
      minWidth: 40,
      render: (r) => <Checkbox size="small" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />,
    },
    { id: "date", label: "Registration", render: (r) => r.registrationDate },
    {
      id: "details",
      label: "Professional details",
      minWidth: 180,
      render: (r) => (
        <Stack spacing={0.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.brandName}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.legalName}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.email}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>{r.phone}</Typography>
        </Stack>
      ),
    },
    {
      id: "validation",
      label: "Validation",
      render: (r) => (
        <Chip
          label={r.validationStatus.replace("_", " ")}
          size="small"
          sx={{ textTransform: "capitalize", fontSize: 11 }}
        />
      ),
    },
    { id: "mode", label: "Service mode", render: (r) => r.serviceMode },
    {
      id: "categories",
      label: "Categories",
      render: (r) => r.categories.join(", "),
    },
    { id: "online", label: "Online bookings", align: "right", render: (r) => r.onlineBookings },
    { id: "offline", label: "Offline bookings", align: "right", render: (r) => r.offlineBookings },
    { id: "rating", label: "Avg rating", align: "right", render: (r) => r.avgRating.toFixed(1) },
    { id: "ranking", label: "Ranking", align: "right", render: (r) => `#${r.ranking}` },
    {
      id: "status",
      label: "Account status",
      render: (r) => {
        const c = statusColor(r.accountStatus, tokens);
        return (
          <Chip
            label={r.accountStatus.replace("_", " ")}
            size="small"
            sx={{ bgcolor: c.bg, color: c.fg, textTransform: "capitalize", fontSize: 11 }}
          />
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      render: () => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label="Note">
            <NoteAltOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <AppButton size="small" variant="outlined" sx={{ fontSize: 11, textTransform: "none", minWidth: 0, px: 1 }}>
            Suspend
          </AppButton>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Professional management"
        description="View, validate, and manage all registered professionals."
        actions={
          <>
            <AppButton variant="outlined" startIcon={<FileDownloadOutlinedIcon />} sx={{ textTransform: "none" }}>
              Export
            </AppButton>
            <Box
              component={selected.size > 0 ? Link : "span"}
              href={selected.size > 0 ? "/admin/messaging" : undefined}
              sx={{ textDecoration: "none" }}
            >
              <AppButton
                variant="contained"
                startIcon={<EmailOutlinedIcon />}
                sx={{ textTransform: "none" }}
                disabled={selected.size === 0}
              >
                Send email ({selected.size})
              </AppButton>
            </Box>
          </>
        }
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <AppSearchField
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <AppSelect
          label="Service mode"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          options={[
            { value: "all", label: "All modes" },
            { value: "FL", label: "FL" },
            { value: "DL", label: "DL (Normal)" },
            { value: "DL Project", label: "DL (Project)" },
          ]}
        />
      </Stack>

      <AdminSectionCard noPadding>
        <AdminDataTable columns={columns} rows={filtered} getRowId={(r) => r.id} />
      </AdminSectionCard>

      <AdminSummaryGrid
        items={[
          { label: "Total professionals", value: 892 },
          { label: "Total online bookings", value: 8420, sub: "FL 4200 · DL 3120 · DL Project 1100" },
          { label: "Total offline bookings", value: 2180, sub: "FL 980 · DL 890 · DL Project 310" },
          { label: "Total online transactions", value: 7840, sub: "Direct 5200 · Non-direct 2640" },
        ]}
      />
    </>
  );
}
