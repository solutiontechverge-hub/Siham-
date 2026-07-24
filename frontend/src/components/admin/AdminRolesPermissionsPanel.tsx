"use client";

import * as React from "react";
import {
  Box,
  Chip,
  Grid2 as Grid,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppSearchField, AppTextField } from "../common";
import AppCard from "../common/AppCard";
import AdminUnderlineTabs from "./AdminUnderlineTabs";
import AdminDataTable, { type AdminTableColumn } from "./AdminDataTable";
import AdminUserRowActions from "./AdminUserRowActions";
import { ADMIN_CARD_PADDING as pad } from "./adminCardPadding";
import {
  adminPermissionModules,
  mockAdminRoles,
  ROLE_ICONS,
  type AdminRole,
  type PermissionLevel,
} from "./adminRolesData";
import type { AdminUser } from "./adminMockData";

type DetailTab = "permissions" | "users";

type AdminRolesPermissionsPanelProps = {
  createRoleRef?: React.MutableRefObject<(() => void) | null>;
  roles: AdminRole[];
  setRoles: React.Dispatch<React.SetStateAction<AdminRole[]>>;
  users: AdminUser[];
  roleLabels: Record<string, string>;
  onOpenCreateUser: () => void;
  onEditUser: (user: AdminUser) => void;
  onDisableUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
};

const DETAIL_TABS = [
  { id: "permissions", label: "Permissions" },
  { id: "users", label: "Admin Users" },
] as const;

function PermissionLegend() {
  const tokens = useTheme().palette.mollure;
  const items = [
    {
      label: "Full Access",
      icon: (
        <RadioButtonCheckedIcon sx={{ fontSize: 14, color: tokens.tealDark }} />
      ),
    },
    {
      label: "View Only",
      icon: <VisibilityOutlinedIcon sx={{ fontSize: 14, color: "#3B82F6" }} />,
    },
    {
      label: "No Access",
      icon: <LockOutlinedIcon sx={{ fontSize: 14, color: tokens.slate }} />,
    },
  ];

  return (
    <Stack
      direction="row"
      spacing={2}
      flexWrap="wrap"
      justifyContent="flex-end"
    >
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          spacing={0.5}
          alignItems="center"
        >
          {item.icon}
          <Typography sx={{ fontSize: 11, color: tokens.bodyText }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function RoleBadge({ kind }: { kind: AdminRole["kind"] }) {
  const tokens = useTheme().palette.mollure;
  const isSystem = kind === "system";
  return (
    <Chip
      label={isSystem ? "System Role" : "Custom Role"}
      size="small"
      sx={{
        height: 22,
        fontSize: 10,
        fontWeight: 600,
        bgcolor: isSystem ? tokens.mintSoft : alpha("#3B82F6", 0.1),
        color: isSystem ? tokens.tealDark : "#2563EB",
      }}
    />
  );
}

export default function AdminRolesPermissionsPanel({
  createRoleRef,
  roles,
  setRoles,
  users,
  roleLabels,
  onOpenCreateUser,
  onEditUser,
  onDisableUser,
  onDeleteUser,
}: AdminRolesPermissionsPanelProps) {
  const tokens = useTheme().palette.mollure;
  const [selectedRoleId, setSelectedRoleId] = React.useState(
    mockAdminRoles[0].id,
  );
  const [roleSearch, setRoleSearch] = React.useState("");
  const [detailTab, setDetailTab] = React.useState<DetailTab>("permissions");
  const [draftName, setDraftName] = React.useState("");
  const [draftDescription, setDraftDescription] = React.useState("");
  const [draftPermissions, setDraftPermissions] = React.useState<
    Record<string, PermissionLevel>
  >({});

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  const loadDraft = React.useCallback((role: AdminRole) => {
    setDraftName(role.name);
    setDraftDescription(role.description);
    setDraftPermissions({ ...role.permissions });
  }, []);

  React.useEffect(() => {
    if (selectedRole) loadDraft(selectedRole);
  }, [selectedRole, loadDraft]);

  const filteredRoles = roles.filter((role) => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      role.name.toLowerCase().includes(q) ||
      role.description.toLowerCase().includes(q)
    );
  });

  const roleUsers = users.filter((u) => u.role === selectedRoleId);
  const selectedRoleAdminCount = roleUsers.length;

  React.useEffect(() => {
    if (createRoleRef) createRoleRef.current = onOpenCreateUser;
    return () => {
      if (createRoleRef) createRoleRef.current = null;
    };
  }, [createRoleRef, onOpenCreateUser]);

  const handleSave = () => {
    if (!selectedRole || !draftName.trim()) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              name: draftName.trim(),
              description: draftDescription.trim(),
              permissions: { ...draftPermissions },
            }
          : r,
      ),
    );
  };

  const handleCancel = () => {
    if (selectedRole) loadDraft(selectedRole);
  };

  const handleDelete = () => {
    if (!selectedRole || selectedRole.kind === "system") return;
    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== selectedRole.id);
      if (next.length > 0) setSelectedRoleId(next[0].id);
      return next;
    });
  };

  const setPermission = (moduleId: string, level: PermissionLevel) => {
    setDraftPermissions((prev) => ({ ...prev, [moduleId]: level }));
  };

  const userColumns: AdminTableColumn<AdminUser>[] = [
    { id: "name", label: "Name", render: (r) => r.name },
    { id: "email", label: "Email", render: (r) => r.email },
    {
      id: "role",
      label: "Role",
      render: (r) => (
        <Typography component="span" sx={{ fontSize: 13 }}>
          {roleLabels[r.role] ?? r.role}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (r) => (
        <Chip
          label={r.status === "active" ? "Active" : "Disabled"}
          size="small"
          sx={{
            height: 24,
            borderRadius: "999px",
            bgcolor:
              r.status === "active"
                ? tokens.mintSoft
                : "rgba(16, 35, 63, 0.08)",
            color: r.status === "active" ? tokens.tealDark : tokens.slate,
            fontWeight: 600,
            fontSize: 11,
            "& .MuiChip-label": { px: 1.25 },
          }}
        />
      ),
    },
    {
      id: "actions",
      label: "Action",
      render: (r) => (
        <AdminUserRowActions
          user={r}
          onEdit={onEditUser}
          onDisable={onDisableUser}
          onDelete={onDeleteUser}
        />
      ),
    },
  ];

  const detailTabs = DETAIL_TABS.map((t) => ({
    ...t,
    label:
      t.id === "users" ? `Admin Users (${selectedRoleAdminCount})` : t.label,
  }));

  return (
    <>
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 4 }}>
          <AppCard
            sx={{
              height: "100%",
              borderRadius: 3,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "0 8px 24px rgba(16, 35, 63, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ px: pad.headerX, pt: 2.5, pb: 2 }}>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: tokens.textcolorgrey700,
                }}
              >
                Roles ({roles.length})
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: tokens.bodyText, mt: 0.5 }}
              >
                Create and manage roles for admin users.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <AppSearchField
                  placeholder="Search role..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  onClear={() => setRoleSearch("")}
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>

            <Stack spacing={1.25} sx={{ px: pad.headerX, pb: 2, flex: 1 }}>
              {filteredRoles.map((role) => {
                const Icon = ROLE_ICONS[role.icon];
                const selected = role.id === selectedRoleId;
                return (
                  <Box
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRoleId(role.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedRoleId(role.id);
                    }}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${selected ? tokens.teal : tokens.cardBorder}`,
                      bgcolor: selected ? tokens.mintSoft : tokens.white,
                      cursor: "pointer",
                      transition:
                        "border-color 160ms ease, background-color 160ms ease",
                      "&:hover": {
                        borderColor: selected
                          ? tokens.teal
                          : alpha(tokens.teal, 0.45),
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: selected
                            ? alpha(tokens.teal, 0.12)
                            : tokens.surface,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: 20,
                            color: selected ? tokens.tealDark : tokens.slate,
                          }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: tokens.navy,
                            }}
                          >
                            {role.name}
                          </Typography>
                          <RoleBadge kind={role.kind} />
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: tokens.bodyText,
                            mt: 0.5,
                            lineHeight: 1.45,
                          }}
                        >
                          {role.description}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: tokens.slate,
                            mt: 1,
                            fontWeight: 600,
                          }}
                        >
                          {users.filter((u) => u.role === role.id).length}{" "}
                          Admins
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Box sx={{ px: pad.headerX, pb: 2.5, pt: 0.5 }}>
              <AppButton
                variant="outlined"
                fullWidth
                startIcon={<AddOutlinedIcon />}
                onClick={onOpenCreateUser}
                sx={{
                  textTransform: "none",
                  borderColor: tokens.cardBorder,
                  color: tokens.navy,
                }}
              >
                Create New Role
              </AppButton>
            </Box>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <AppCard
            sx={{
              height: "100%",
              borderRadius: 3,
              border: `1px solid ${tokens.cardBorder}`,
              boxShadow: "0 8px 24px rgba(16, 35, 63, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ px: pad.headerX, pt: 2.5, pb: 2 }}>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: tokens.textcolorgrey700,
                }}
              >
                Role Details
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: tokens.bodyText, mt: 0.5 }}
              >
                Manage role information and module permissions.
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ px: pad.headerX, pb: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Role Name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Role Description"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ borderBottom: `1px solid ${tokens.cardBorder}` }}>
                <AdminUnderlineTabs
                  tabs={detailTabs}
                  value={detailTab}
                  onChange={(id) => setDetailTab(id as DetailTab)}
                  embedded
                />
              </Box>

              {detailTab === "permissions" ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <PermissionLegend />
                  </Box>
                  <TableContainer
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${tokens.cardBorder}`,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: tokens.mintSoft }}>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: 12,
                              color: tokens.slate,
                              py: 1.5,
                            }}
                          >
                            Module
                          </TableCell>
                          {(["full", "view", "none"] as const).map((level) => (
                            <TableCell
                              key={level}
                              align="center"
                              sx={{
                                fontWeight: 600,
                                fontSize: 12,
                                color: tokens.slate,
                                py: 1.5,
                                width: 110,
                              }}
                            >
                              {level === "full"
                                ? "Full Access"
                                : level === "view"
                                  ? "View Only"
                                  : "No Access"}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {adminPermissionModules.map((mod) => {
                          const ModIcon = mod.icon;
                          const value = draftPermissions[mod.id] ?? "none";
                          return (
                            <TableRow key={mod.id} hover>
                              <TableCell
                                sx={{
                                  py: 1.75,
                                  borderColor: tokens.cardBorder,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="flex-start"
                                >
                                  <Box
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 1.5,
                                      bgcolor: tokens.surface,
                                      display: "grid",
                                      placeItems: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <ModIcon
                                      sx={{ fontSize: 18, color: tokens.slate }}
                                    />
                                  </Box>
                                  <Box>
                                    <Typography
                                      sx={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: tokens.navy,
                                      }}
                                    >
                                      {mod.label}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: 11,
                                        color: tokens.bodyText,
                                        mt: 0.25,
                                      }}
                                    >
                                      {mod.description}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </TableCell>
                              {(["full", "view", "none"] as const).map(
                                (level) => (
                                  <TableCell
                                    key={level}
                                    align="center"
                                    sx={{ borderColor: tokens.cardBorder }}
                                  >
                                    <Radio
                                      size="small"
                                      checked={value === level}
                                      onChange={() =>
                                        setPermission(mod.id, level)
                                      }
                                      sx={{
                                        color: tokens.slate,
                                        "&.Mui-checked": {
                                          color:
                                            level === "full"
                                              ? tokens.tealDark
                                              : level === "view"
                                                ? "#3B82F6"
                                                : tokens.slate,
                                        },
                                      }}
                                    />
                                  </TableCell>
                                ),
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <AdminDataTable
                  columns={userColumns}
                  rows={roleUsers}
                  getRowId={(r) => r.id}
                  emptyMessage="No admin users assigned to this role yet."
                />
              )}
            </Stack>

            <Box
              sx={{
                mt: "auto",
                px: pad.headerX,
                py: 2,
                borderTop: `1px solid ${tokens.cardBorder}`,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <AppButton
                tone="danger"
                onClick={handleDelete}
                disabled={selectedRole?.kind === "system"}
                sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
              >
                Delete Role
              </AppButton>
              <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                <AppButton tone="secondary" onClick={handleCancel}>
                  Cancel
                </AppButton>
                <AppButton tone="primary" onClick={handleSave}>
                  Save Changes
                </AppButton>
              </Stack>
            </Box>
          </AppCard>
        </Grid>
      </Grid>
    </>
  );
}
