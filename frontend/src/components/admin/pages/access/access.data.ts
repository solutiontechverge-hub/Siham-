import type { AccessTab } from "./access.types";

export const ACCESS_TABS: ReadonlyArray<{ id: AccessTab; label: string }> = [
  { id: "users", label: "Admin Users" },
  { id: "permissions", label: "Roles & Permissions" },
];
