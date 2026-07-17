import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type PermissionLevel = "full" | "view" | "none";

export type AdminRoleKind = "system" | "custom";

export type AdminRoleIcon = "crown" | "code" | "content";

export type AdminPermissionModule = {
  id: string;
  label: string;
  description: string;
  icon: SvgIconComponent;
};

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  kind: AdminRoleKind;
  icon: AdminRoleIcon;
  adminCount: number;
  permissions: Record<string, PermissionLevel>;
};

export const ROLE_ICONS: Record<AdminRoleIcon, SvgIconComponent> = {
  crown: WorkspacePremiumOutlinedIcon,
  code: CodeOutlinedIcon,
  content: ManageAccountsOutlinedIcon,
};

export const adminPermissionModules: AdminPermissionModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview of platform metrics and KPIs",
    icon: DashboardOutlinedIcon,
  },
  {
    id: "access_management",
    label: "Access Management",
    description: "Manage admin users and roles",
    icon: AdminPanelSettingsOutlinedIcon,
  },
  {
    id: "listing_ranking",
    label: "Listing & Ranking",
    description: "Control search result rankings",
    icon: SortOutlinedIcon,
  },
  {
    id: "professional_management",
    label: "Professional Management",
    description: "Manage hair & beauty professionals",
    icon: BusinessOutlinedIcon,
  },
  {
    id: "client_management",
    label: "Client Management",
    description: "Manage individual and company clients",
    icon: PeopleOutlinedIcon,
  },
  {
    id: "rating_reviews",
    label: "Rating & Reviews",
    description: "Manage reviews and reported content",
    icon: StarOutlineOutlinedIcon,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Review flagged content and reports",
    icon: ReportOutlinedIcon,
  },
  {
    id: "messaging_email",
    label: "Messaging & Email",
    description: "Admin email and messaging tools",
    icon: EmailOutlinedIcon,
  },
  {
    id: "seo",
    label: "SEO",
    description: "Configure SEO tags and metadata",
    icon: SearchOutlinedIcon,
  },
  {
    id: "activity_log",
    label: "Activity Log",
    description: "Audit trail of admin actions",
    icon: HistoryOutlinedIcon,
  },
];

const allFull = (): Record<string, PermissionLevel> =>
  Object.fromEntries(adminPermissionModules.map((m) => [m.id, "full"]));

const devSupportPermissions = (): Record<string, PermissionLevel> => ({
  dashboard: "full",
  access_management: "none",
  listing_ranking: "full",
  professional_management: "none",
  client_management: "none",
  rating_reviews: "view",
  reports: "full",
  messaging_email: "full",
  seo: "view",
  activity_log: "none",
});

const contentAdminPermissions = (): Record<string, PermissionLevel> => ({
  dashboard: "view",
  access_management: "none",
  listing_ranking: "view",
  professional_management: "none",
  client_management: "none",
  rating_reviews: "full",
  reports: "view",
  messaging_email: "full",
  seo: "full",
  activity_log: "none",
});

export const mockAdminRoles: AdminRole[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Access to everything",
    kind: "system",
    icon: "crown",
    adminCount: 5,
    permissions: allFull(),
  },
  {
    id: "developer_support",
    name: "Developer / Support Admin",
    description: "Developer and support tools without professional/client management or activity log access",
    kind: "custom",
    icon: "code",
    adminCount: 8,
    permissions: devSupportPermissions(),
  },
  {
    id: "content_admin",
    name: "Content Admin",
    description: "Manage content, reviews, and platform messaging",
    kind: "custom",
    icon: "content",
    adminCount: 8,
    permissions: contentAdminPermissions(),
  },
];

export function createEmptyRolePermissions(): Record<string, PermissionLevel> {
  return Object.fromEntries(adminPermissionModules.map((m) => [m.id, "none"]));
}

export function cloneRole(role: AdminRole): AdminRole {
  return {
    ...role,
    permissions: { ...role.permissions },
  };
}
