import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PublicOffOutlinedIcon from "@mui/icons-material/PublicOffOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  badge?: number;
  showTrailingArrow?: boolean;
};

export type AdminNavSection = {
  id: string;
  label: string;
  collapsible?: boolean;
  items: AdminNavItem[];
};

export const adminDashboardNavItem: AdminNavItem = {
  label: "Dashboard",
  href: "/admin/dashboard",
  icon: HomeOutlinedIcon,
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "user-management",
    label: "User Management",
    collapsible: true,
    items: [
      {
        label: "Access Management",
        href: "/admin/access-management",
        icon: AdminPanelSettingsOutlinedIcon,
      },
      {
        label: "Professional Management",
        href: "/admin/professionals",
        icon: BusinessOutlinedIcon,
      },
      {
        label: "Client Management",
        href: "/admin/clients",
        icon: PeopleOutlinedIcon,
      },
    ],
  },
  {
    id: "platform-management",
    label: "Platform Management",
    collapsible: true,
    items: [
      {
        label: "Listing & Ranking Management",
        href: "/admin/listing-ranking",
        icon: SortOutlinedIcon,
      },
      {
        label: "Rating & Review Management",
        href: "/admin/reviews",
        icon: StarOutlineOutlinedIcon,
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: ReportOutlinedIcon,
      },
      {
        label: "Messaging & Email",
        href: "/admin/messaging",
        icon: EmailOutlinedIcon,
        badge: 3,
        showTrailingArrow: true,
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { label: "SEO", href: "/admin/seo", icon: PublicOffOutlinedIcon },
      { label: "Activity Log", href: "/admin/activity-log", icon: HistoryOutlinedIcon },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = [
  adminDashboardNavItem,
  ...adminNavSections.flatMap((section) => section.items),
];
