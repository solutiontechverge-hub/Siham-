"use client";

import * as React from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton, AppSelect, AppTextField } from "../../common";
import AppModal from "../../common/AppModal";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminUnderlineTabs from "../AdminUnderlineTabs";
import AdminRolesPermissionsPanel from "../AdminRolesPermissionsPanel";
import AdminDataTable, { type AdminTableColumn } from "../AdminDataTable";
import { mockAdminRoles } from "../adminRolesData";
import {
  mockAdminUsers,
  type AdminUser,
  type AdminUserStatus,
} from "../adminMockData";
import { useCreateAdminActivityMutation } from "../../../store/services/adminApi";
import { useAppSelector } from "../../../store/hooks";

const ACCESS_TABS = [
  { id: "users", label: "Admin Users" },
  { id: "permissions", label: "Roles & Permissions" },
] as const;

type AccessTab = (typeof ACCESS_TABS)[number]["id"];

type AccessModal = "add" | "edit" | "disable" | "delete" | null;
type AddModalSource = "users" | "roles";

export default function AdminAccessPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const authUser = useAppSelector((s) => s.auth.user);
  const [createAdminActivity] = useCreateAdminActivityMutation();
  const createRoleRef = React.useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = React.useState<AccessTab>("users");
  const [roles, setRoles] = React.useState(mockAdminRoles);
  const [users, setUsers] = React.useState(mockAdminUsers);
  const [modal, setModal] = React.useState<AccessModal>(null);
  const [addModalSource, setAddModalSource] =
    React.useState<AddModalSource>("users");
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(
    null,
  );
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState(
    mockAdminRoles[0]?.id ?? "super_admin",
  );
  const [status, setStatus] = React.useState<AdminUserStatus>("active");
  const [mounted, setMounted] = React.useState(false);

  const roleLabels: Record<string, string> = React.useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, r.name])),
    [roles],
  );

  const roleOptions = React.useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole(roles[0]?.id ?? "super_admin");
    setStatus("active");
    setSelectedUser(null);
  };

  const closeModal = () => {
    setModal(null);
    setAddModalSource("users");
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setAddModalSource("users");
    setModal("add");
  };

  const openCreateRoleModal = React.useCallback(() => {
    setName("");
    setEmail("");
    setRole(roles[0]?.id ?? "super_admin");
    setStatus("active");
    setSelectedUser(null);
    setAddModalSource("roles");
    setModal("add");
  }, [roles]);

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setModal("edit");
  };

  const openDisableModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModal("disable");
  };

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModal("delete");
  };

  const logActivity = React.useCallback(
    (payload: {
      action: string;
      detail: string;
      color?: "teal" | "navy" | "warning" | "mint";
      action_type?: string;
    }) => {
      void createAdminActivity({
        ...payload,
        module: "access",
        actor_email: authUser?.email,
        actor_name: authUser?.email?.split("@")[0],
      });
    },
    [authUser?.email, createAdminActivity],
  );

  const handleCreate = () => {
    if (!name.trim() || !email.trim()) return;
    setUsers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: name.trim(),
        email: email.trim(),
        role,
        status,
      },
    ]);
    logActivity({
      action: "Created admin user",
      detail: `${name.trim()} (${email.trim()})`,
      color: "teal",
      action_type: "created",
    });
    closeModal();
  };

  const handleUpdate = () => {
    if (!selectedUser || !name.trim() || !email.trim()) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, name: name.trim(), email: email.trim(), role, status }
          : u,
      ),
    );
    logActivity({
      action: "Updated admin user",
      detail: `${name.trim()} (${email.trim()})`,
      color: "navy",
      action_type: "updated",
    });
    closeModal();
  };

  const handleDisable = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, status: "disabled" as const } : u,
      ),
    );
    logActivity({
      action: "Disabled admin user",
      detail: `${selectedUser.name} (${selectedUser.email})`,
      color: "warning",
      action_type: "changed_status",
    });
    closeModal();
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    logActivity({
      action: "Deleted admin user",
      detail: `${selectedUser.name} (${selectedUser.email})`,
      color: "warning",
      action_type: "deleted",
    });
    closeModal();
  };

  const columns: AdminTableColumn<AdminUser>[] = [
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
            bgcolor:
              r.status === "active" ? tokens.mintSoft : tokens.sectionSurface,
            color: r.status === "active" ? tokens.tealDark : tokens.slate,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      ),
    },
    {
      id: "actions",
      label: "Action",
      render: (r) => (
        <Stack direction="row" spacing={1}>
          <AppButton
            size="small"
            variant="outlined"
            onClick={() => openEditModal(r)}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Edit
          </AppButton>
          {r.status === "active" ? (
            <AppButton
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => openDisableModal(r)}
              sx={{ textTransform: "none", fontSize: 12 }}
            >
              Disable
            </AppButton>
          ) : (
            <AppButton
              tone="danger"
              size="small"
              onClick={() => openDeleteModal(r)}
              sx={{ fontSize: 12 }}
            >
              Delete
            </AppButton>
          )}
        </Stack>
      ),
    },
  ];

  const addModalTitle =
    modal === "edit"
      ? "Edit admin user"
      : addModalSource === "roles"
        ? "Create new role"
        : "Add admin user";

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <AdminPageHeader
          title={
            activeTab === "users" ? "Access management" : "Roles & Permissions"
          }
          description={
            activeTab === "users"
              ? "Manage admin users, roles, and account access."
              : "Manage admin roles and their module permissions."
          }
          actions={
            activeTab === "users" ? (
              <AppButton
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={openAddModal}
                sx={{ textTransform: "none" }}
              >
                Add user
              </AppButton>
            ) : (
              <AppButton
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={() => createRoleRef.current?.()}
                sx={{ textTransform: "none" }}
              >
                Create New Role
              </AppButton>
            )
          }
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <AdminUnderlineTabs
          tabs={ACCESS_TABS}
          value={activeTab}
          onChange={(id) => setActiveTab(id as AccessTab)}
        />
      </Box>

      {activeTab === "users" ? (
        <AdminSectionCard
          title="Admin users"
          noPadding
          separateContent
          sx={{ mt: 2 }}
        >
          <AdminDataTable
            columns={columns}
            rows={users}
            getRowId={(r) => r.id}
          />
        </AdminSectionCard>
      ) : (
        <AdminRolesPermissionsPanel
          createRoleRef={createRoleRef}
          roles={roles}
          setRoles={setRoles}
          users={users}
          roleLabels={roleLabels}
          onOpenCreateUser={openCreateRoleModal}
          onEditUser={openEditModal}
          onDisableUser={openDisableModal}
          onDeleteUser={openDeleteModal}
        />
      )}

      {mounted ? (
        <>
          <AppModal
            open={modal === "add" || modal === "edit"}
            onClose={closeModal}
            title={addModalTitle}
            maxWidth="sm"
            fullWidth
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
                  <AppButton
                    variant="outlined"
                    onClick={closeModal}
                    sx={{ textTransform: "none" }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    variant="contained"
                    onClick={modal === "edit" ? handleUpdate : handleCreate}
                    sx={{ textTransform: "none" }}
                  >
                    {modal === "edit"
                      ? "Save changes"
                      : addModalSource === "roles"
                        ? "Create role"
                        : "Create admin"}
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Stack spacing={2} sx={{ p: 2.5 }}>
              <AppTextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <AppTextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <AppSelect
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                fullWidth
                options={roleOptions}
              />
              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.navy,
                    mb: 1,
                  }}
                >
                  Status
                </Typography>
                <RadioGroup
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
                >
                  <FormControlLabel
                    value="active"
                    control={<Radio size="small" />}
                    slotProps={{ typography: { component: "div" } }}
                    label={
                      <Box>
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: tokens.navy,
                          }}
                        >
                          Active
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            fontSize: 12,
                            color: tokens.bodyText,
                          }}
                        >
                          Admin can log in and use whatever their role allows.
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start", mx: 0, mb: 1.5 }}
                  />
                  <FormControlLabel
                    value="disabled"
                    control={<Radio size="small" />}
                    slotProps={{ typography: { component: "div" } }}
                    label={
                      <Box>
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: tokens.navy,
                          }}
                        >
                          Disabled
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            fontSize: 12,
                            color: tokens.bodyText,
                          }}
                        >
                          Admin account exists but cannot log in anymore.
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start", mx: 0 }}
                  />
                </RadioGroup>
              </Box>
            </Stack>
          </AppModal>

          <AppModal
            open={modal === "disable"}
            onClose={closeModal}
            title="Disable admin user"
            maxWidth="sm"
            fullWidth
            headerTone="danger"
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton
                    variant="outlined"
                    onClick={closeModal}
                    sx={{ textTransform: "none", minWidth: 120 }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    variant="contained"
                    onClick={handleDisable}
                    sx={{ textTransform: "none", minWidth: 120 }}
                  >
                    Yes, disable
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon
                sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: alpha(tokens.navy, 0.88),
                  lineHeight: 1.55,
                }}
              >
                Are you sure you want to disable {selectedUser?.name}? They will
                lose access to the admin panel.
              </Typography>
            </Box>
          </AppModal>

          <AppModal
            open={modal === "delete"}
            onClose={closeModal}
            title="Delete admin user"
            maxWidth="sm"
            fullWidth
            headerTone="danger"
            footer={
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" justifyContent="center" spacing={1.25}>
                  <AppButton
                    tone="secondary"
                    onClick={closeModal}
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    tone="danger"
                    onClick={handleDelete}
                    sx={{ minWidth: 120 }}
                  >
                    Yes, delete
                  </AppButton>
                </Stack>
              </Box>
            }
          >
            <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
              <WarningAmberRoundedIcon
                sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: alpha(tokens.navy, 0.88),
                  lineHeight: 1.55,
                }}
              >
                Are you sure you want to permanently delete {selectedUser?.name}
                ? This action cannot be undone.
              </Typography>
            </Box>
          </AppModal>
        </>
      ) : null}
    </>
  );
}
