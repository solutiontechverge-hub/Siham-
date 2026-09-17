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
import { useTheme } from "@mui/material/styles";
import { AppButton, AppSelect, AppTextField } from "../../../common";
import AppModal from "../../../common/AppModal";
import ModalConfirmBody from "../../../common/ModalConfirmBody";
import MessagingDangerModal from "../../../common/messaging/MessagingDangerModal";
import AdminPageHeader from "../../AdminPageHeader";
import AdminSectionCard from "../../AdminSectionCard";
import AdminUnderlineTabs from "../../AdminUnderlineTabs";
import AdminRolesPermissionsPanel from "../../AdminRolesPermissionsPanel";
import AdminDataTable, { type AdminTableColumn } from "../../AdminDataTable";
import AdminUserRowActions from "../../AdminUserRowActions";
import type { AdminUser, AdminUserStatus } from "../../adminMockData";
import {
  mollureLabelSx,
  mollureBodySx,
  mollureBodyMutedSx,
} from "../../../../theme/mollureHierarchy";
import { ACCESS_TABS } from "./access.data";
import type { AccessTab } from "./access.types";
import { useAdminAccessPage } from "./useAdminAccessPage";

export default function AdminAccessPageView() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const {
    createRoleRef, activeTab, setActiveTab, roles, setRoles, users, modal,
    addModalSource, selectedUser, name, setName, email, setEmail, role, setRole,
    status, setStatus, mounted, roleLabels, roleOptions, closeModal,
    openAddModal, openCreateRoleModal, openEditModal, openDisableModal,
    openDeleteModal, handleCreate, handleUpdate, handleDisable, handleDelete,
  } = useAdminAccessPage();

  const columns: AdminTableColumn<AdminUser>[] = [
    { id: "name", label: "Name", render: (r) => r.name },
    { id: "email", label: "Email", render: (r) => r.email },
    {
      id: "role",
      label: "Role",
      render: (r) => (
        <Typography
          component="span"
          sx={mollureBodySx(tokens.navy, { color: tokens.navy })}
        >
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
          onEdit={openEditModal}
          onDisable={openDisableModal}
          onDelete={openDeleteModal}
        />
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
                    tone="secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    tone="primary"
                    onClick={modal === "edit" ? handleUpdate : handleCreate}
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
                  sx={mollureLabelSx(tokens.navy, {
                    fontWeight: 600,
                    color: tokens.navy,
                    mb: 1,
                  })}
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
                          sx={mollureLabelSx(tokens.navy, {
                            display: "block",
                            fontWeight: 600,
                            color: tokens.navy,
                          })}
                        >
                          Active
                        </Typography>
                        <Typography
                          component="span"
                          sx={mollureBodyMutedSx(tokens.navy, {
                            display: "block",
                            color: tokens.bodyText,
                          })}
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
                          sx={mollureLabelSx(tokens.navy, {
                            display: "block",
                            fontWeight: 600,
                            color: tokens.navy,
                          })}
                        >
                          Disabled
                        </Typography>
                        <Typography
                          component="span"
                          sx={mollureBodyMutedSx(tokens.navy, {
                            display: "block",
                            color: tokens.bodyText,
                          })}
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

          <MessagingDangerModal
            open={modal === "disable"}
            onClose={closeModal}
            title="Disable admin user"
            maxWidth="sm"
            primaryLabel="Yes, disable"
            contentSx={{ px: 0 }}
            onPrimary={handleDisable}
          >
            <ModalConfirmBody
              showWarning
              iconSize={56}
              iconMb={1.75}
              py={3}
              px={2.5}
              bodySx={{ fontWeight: 700 }}
              body={`Are you sure you want to disable ${selectedUser?.name}? They will lose access to the admin panel.`}
            />
          </MessagingDangerModal>

          <MessagingDangerModal
            open={modal === "delete"}
            onClose={closeModal}
            title="Delete admin user"
            maxWidth="sm"
            primaryLabel="Delete"
            primaryTone="danger"
            contentSx={{ px: 0 }}
            onPrimary={handleDelete}
          >
            <ModalConfirmBody
              showWarning
              iconSize={56}
              iconMb={1.75}
              py={3}
              px={2.5}
              bodySx={{ fontWeight: 700 }}
              body={`Are you sure you want to permanently delete ${selectedUser?.name}? This action cannot be undone.`}
            />
          </MessagingDangerModal>
        </>
      ) : null}
    </>
  );
}
