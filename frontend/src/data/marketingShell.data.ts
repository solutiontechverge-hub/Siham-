import type { MarketingNavItem } from "../components/common/MarketingSiteHeader";
import type { MarketingFooterColumn } from "../components/common/MarketingSiteFooter";

/** Client marketing pages: How it works, About, Contact (shared with root URLs). */
export const clientPrimaryNavItems = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about", match: "exact" as const },
  { label: "Contact Us", href: "/contact-us", match: "exact" as const },
] as const satisfies readonly MarketingNavItem[];

/** `/professionals` marketing: Features, How it works, Pricing, About, Contact (scoped under `/professionals/...`). */
export const marketingPrimaryNavItems = [
  { label: "Features", href: "/professionals/features", match: "prefix" as const },
  { label: "How It Works", href: "/professionals/how-it-works" },
  { label: "Pricing", href: "/professionals/pricing", match: "exact" as const },
  { label: "About", href: "/professionals/about", match: "exact" as const },
  { label: "Contact Us", href: "/professionals/contact-us", match: "exact" as const },
] as const satisfies readonly MarketingNavItem[];

/** Header preset for `/clients` and client-audience info pages (3 links + “for professional” on the right). */
export const clientsShellHeader = {
  navItems: clientPrimaryNavItems,
  localeLabel: "EN",
  loginLabel: "login",
  professionalLinkLabel: "for professional",
  professionalHref: "/professionals",
} as const;

/** Shared shape for auth pages using `MarketingSiteHeader` (no centre nav). */
export type AuthStripHeaderConfig = {
  navItems: MarketingNavItem[];
  localeLabel: string;
  loginLabel: string;
  loginHref: string;
  professionalLinkLabel: string;
  professionalHref: string;
};

/** `/auth/login` — audience pill goes to professional login. */
export const authLoginHeaderClient: AuthStripHeaderConfig = {
  navItems: [] as MarketingNavItem[],
  localeLabel: "EN",
  loginLabel: "login",
  loginHref: "/auth/login",
  professionalLinkLabel: "for professional",
  professionalHref: "/auth/professional/login",
};

/** `/auth/professional/login` — audience pill returns to client login. */
export const authLoginHeaderProfessional: AuthStripHeaderConfig = {
  navItems: [] as MarketingNavItem[],
  localeLabel: "EN",
  loginLabel: "login",
  loginHref: "/auth/professional/login",
  professionalLinkLabel: "for clients",
  professionalHref: "/auth/login",
};

/** Client signup routes — “for professional” opens professional signup. */
export const authSignupHeaderClient: AuthStripHeaderConfig = {
  navItems: [] as MarketingNavItem[],
  localeLabel: "EN",
  loginLabel: "login",
  loginHref: "/auth/login",
  professionalLinkLabel: "for professional",
  professionalHref: "/auth/signup/professional",
};

/** `/auth/signup/professional` — “for clients” returns to the client signup chooser. */
export const authSignupHeaderProfessional: AuthStripHeaderConfig = {
  navItems: [] as MarketingNavItem[],
  localeLabel: "EN",
  loginLabel: "login",
  loginHref: "/auth/professional/login",
  professionalLinkLabel: "for clients",
  professionalHref: "/auth/signup",
};

/** @deprecated Use `authSignupHeaderClient` or `authLoginHeaderClient`. */
export const authClientMarketingHeader = authSignupHeaderClient;

export type ClientsShellHeaderConfig = typeof clientsShellHeader;

/** @deprecated Use `clientsShellHeader` or `professionalsMarketingHeader`; kept as alias for older imports. */
export const marketingShellHeader = clientsShellHeader;

/** `/professionals` landing, features, pricing, and scoped info pages. */
export const professionalsMarketingHeader = {
  navItems: marketingPrimaryNavItems,
  localeLabel: "EN",
  loginLabel: "login",
  professionalLinkLabel: "for clients",
  professionalHref: "/clients",
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
      items: [
        { label: "How It Works", href: "/how-it-works" },
        { label: "Browse Professionals", href: "/clients" },
        { label: "Pricing", href: "/professionals/pricing" },
        "Integrations",
        "API",
      ],
    },
    {
      title: "Company",
      items: [
        { label: "About", href: "/about" },
        "Careers",
        { label: "Contact", href: "/contact-us" },
      ],
    },
    {
      title: "Legal",
      items: ["Privacy", "Terms", "Security"],
    },
  ] satisfies MarketingFooterColumn[],
  copyright: "2026 Mollure. All rights reserved.",
} as const;

/** Footer for `/professionals` marketing (matches Features/Pricing link set). */
export const professionalsMarketingFooter = {
  columns: [
    {
      title: "Mollure",
      items: [
        "The All-In-One Platform For Salon And Freelancer Appointment Management",
      ],
    },
    {
      title: "Product",
      items: [
        { label: "Features", href: "/professionals/features" },
        { label: "Pricing", href: "/professionals/pricing" },
        "Integrations",
        "API",
      ],
    },
    {
      title: "Company",
      items: [
        { label: "About", href: "/about" },
        "FAQ",
        { label: "Contact", href: "/contact-us" },
      ],
    },
    {
      title: "Legal",
      items: ["Privacy", "Terms", "Security"],
    },
  ] satisfies MarketingFooterColumn[],
  copyright: "2026 Mollure. All rights reserved.",
} as const;
