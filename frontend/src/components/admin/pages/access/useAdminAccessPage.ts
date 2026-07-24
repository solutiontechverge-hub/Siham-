import * as React from "react";
import { mockAdminRoles } from "../../adminRolesData";
import { mockAdminUsers, type AdminUser, type AdminUserStatus } from "../../adminMockData";
import { useCreateAdminActivityMutation } from "../../../../store/services/adminApi";
import { useAppSelector } from "../../../../store/hooks";
import type { AccessModal, AccessTab, AddModalSource } from "./access.types";

export function useAdminAccessPage() {
  const authUser = useAppSelector((state) => state.auth.user);
  const [createAdminActivity] = useCreateAdminActivityMutation();
  const createRoleRef = React.useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = React.useState<AccessTab>("users");
  const [roles, setRoles] = React.useState(mockAdminRoles);
  const [users, setUsers] = React.useState(mockAdminUsers);
  const [modal, setModal] = React.useState<AccessModal>(null);
  const [addModalSource, setAddModalSource] = React.useState<AddModalSource>("users");
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState(mockAdminRoles[0]?.id ?? "super_admin");
  const [status, setStatus] = React.useState<AdminUserStatus>("active");
  const [mounted, setMounted] = React.useState(false);

  const roleLabels = React.useMemo(() => Object.fromEntries(roles.map((roleItem) => [roleItem.id, roleItem.name])), [roles]);
  const roleOptions = React.useMemo(() => roles.map((roleItem) => ({ value: roleItem.id, label: roleItem.name })), [roles]);
  React.useEffect(() => { setMounted(true); }, []);

  const resetForm = () => {
    setName(""); setEmail(""); setRole(roles[0]?.id ?? "super_admin");
    setStatus("active"); setSelectedUser(null);
  };
  const closeModal = () => { setModal(null); setAddModalSource("users"); resetForm(); };
  const openAddModal = () => { resetForm(); setAddModalSource("users"); setModal("add"); };
  const openCreateRoleModal = React.useCallback(() => {
    setName(""); setEmail(""); setRole(roles[0]?.id ?? "super_admin"); setStatus("active");
    setSelectedUser(null); setAddModalSource("roles"); setModal("add");
  }, [roles]);
  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user); setName(user.name); setEmail(user.email); setRole(user.role); setStatus(user.status); setModal("edit");
  };
  const openDisableModal = (user: AdminUser) => { setSelectedUser(user); setModal("disable"); };
  const openDeleteModal = (user: AdminUser) => { setSelectedUser(user); setModal("delete"); };
  const logActivity = React.useCallback((payload: { action: string; detail: string; color?: "teal" | "navy" | "warning" | "mint"; action_type?: string }) => {
    void createAdminActivity({ ...payload, module: "access", actor_email: authUser?.email, actor_name: authUser?.email?.split("@")[0] });
  }, [authUser?.email, createAdminActivity]);
  const handleCreate = () => {
    if (!name.trim() || !email.trim()) return;
    setUsers((previous) => [...previous, { id: String(Date.now()), name: name.trim(), email: email.trim(), role, status }]);
    logActivity({ action: "Created admin user", detail: `${name.trim()} (${email.trim()})`, color: "teal", action_type: "created" });
    closeModal();
  };
  const handleUpdate = () => {
    if (!selectedUser || !name.trim() || !email.trim()) return;
    setUsers((previous) => previous.map((user) => user.id === selectedUser.id ? { ...user, name: name.trim(), email: email.trim(), role, status } : user));
    logActivity({ action: "Updated admin user", detail: `${name.trim()} (${email.trim()})`, color: "navy", action_type: "updated" });
    closeModal();
  };
  const handleDisable = () => {
    if (!selectedUser) return;
    setUsers((previous) => previous.map((user) => user.id === selectedUser.id ? { ...user, status: "disabled" } : user));
    logActivity({ action: "Disabled admin user", detail: `${selectedUser.name} (${selectedUser.email})`, color: "warning", action_type: "changed_status" });
    closeModal();
  };
  const handleDelete = () => {
    if (!selectedUser) return;
    setUsers((previous) => previous.filter((user) => user.id !== selectedUser.id));
    logActivity({ action: "Deleted admin user", detail: `${selectedUser.name} (${selectedUser.email})`, color: "warning", action_type: "deleted" });
    closeModal();
  };

  return {
    createRoleRef, activeTab, setActiveTab, roles, setRoles, users, modal, addModalSource, selectedUser,
    name, setName, email, setEmail, role, setRole, status, setStatus, mounted, roleLabels, roleOptions,
    closeModal, openAddModal, openCreateRoleModal, openEditModal, openDisableModal, openDeleteModal,
    handleCreate, handleUpdate, handleDisable, handleDelete,
  };
}
