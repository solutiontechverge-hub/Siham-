import { ADMIN_QUICK_LINKS } from "../../dashboardData";

export const SEO_LINKS = [
  {
    title: ADMIN_QUICK_LINKS[0].title,
    label: "Link to Google Console",
    description: "Monitor search performance, indexing, and site visibility.",
    href: ADMIN_QUICK_LINKS[0].href,
    logoLabel: ADMIN_QUICK_LINKS[0].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[0].logoBg,
    logoColor: ADMIN_QUICK_LINKS[0].logoColor,
  },
  {
    title: ADMIN_QUICK_LINKS[1].title,
    label: "Link to Google Analytics",
    description: "Track website traffic, user behavior, and conversions.",
    href: ADMIN_QUICK_LINKS[1].href,
    logoLabel: ADMIN_QUICK_LINKS[1].logoLabel,
    logoBg: ADMIN_QUICK_LINKS[1].logoBg,
    logoColor: ADMIN_QUICK_LINKS[1].logoColor,
  },
] as const;
