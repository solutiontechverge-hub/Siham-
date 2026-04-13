import type { MarketingNavItem } from "../components/common/MarketingSiteHeader";
import type { MarketingFooterColumn } from "../components/common/MarketingSiteFooter";

/** Shared marketing header — fixed nav set only (no per-page additions). */
export const marketingShellHeader = {
  navItems: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about", match: "exact" as const },
    { label: "Contact Us", href: "/contact-us", match: "exact" as const },
  ] satisfies MarketingNavItem[],
  localeLabel: "EN",
  loginLabel: "Login",
  professionalLinkLabel: "For Professional",
  /** Outlined header button — professional signup */
  professionalHref: "/auth/signup/professional",
} as const;

export const marketingShellFooter = {
  columns: [
    {
      title: "Mollure",
      items: [
        "The all-in-one platform for salon and freelance appointment management.",
      ],
    },
    {
      title: "Product",
      items: ["How It Works", "Browse Professionals", "Pricing"],
    },
    {
      title: "Company",
      items: ["About", "Careers", "Contact"],
    },
    {
      title: "Legal",
      items: ["Privacy", "Terms", "Security"],
    },
  ] satisfies MarketingFooterColumn[],
  copyright: "2026 Mollure. All rights reserved.",
} as const;
