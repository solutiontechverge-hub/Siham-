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
import type { SvgIconComponent } from "@mui/icons-material";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  badge?: number;
};

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: DashboardOutlinedIcon },
  { label: "Access management", href: "/admin/access-management", icon: AdminPanelSettingsOutlinedIcon },
  { label: "Listing & ranking", href: "/admin/listing-ranking", icon: SortOutlinedIcon },
  { label: "Professional management", href: "/admin/professionals", icon: BusinessOutlinedIcon },
  { label: "Client management", href: "/admin/clients", icon: PeopleOutlinedIcon },
  { label: "Rating & reviews", href: "/admin/reviews", icon: StarOutlineOutlinedIcon },
  { label: "Reports", href: "/admin/reports", icon: ReportOutlinedIcon },
  { label: "Messaging & email", href: "/admin/messaging", icon: EmailOutlinedIcon, badge: 3 },
  { label: "SEO", href: "/admin/seo", icon: SearchOutlinedIcon },
  { label: "Activity log", href: "/admin/activity-log", icon: HistoryOutlinedIcon },
];
