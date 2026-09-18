import { ProfessionalsHeroSrc } from "../../../images";
import { professionalsMarketingFooter, professionalsMarketingHeader } from "../../data/marketingShell.data";

export type ProfessionalFeatureIconKey =
  | "locations"
  | "business"
  | "chat"
  | "flow";

export type ProfessionalResultIconKey =
  | "moreBookings"
  | "onePlace"
  | "moreTime";

export type ProfessionalFeature = {
  iconKey: ProfessionalFeatureIconKey;
  title: string;
  description: string;
};

export type ProfessionalResultCard = {
  iconKey: ProfessionalResultIconKey;
  title: string;
  description: string;
};

export type ProfessionalStep = {
  number: string;
  title: string;
  description: string;
};

export const professionalsPageData = {
  header: professionalsMarketingHeader,
  hero: {
    eyebrow: "For Salons & Freelancers",
    title: "Let Mollure Work\nFor You",
    description:
      "Manage Appointments, Payments And Customer\nCommunication, All In One Place.",
    primaryAction: "Get Started",
    primaryActionHref: "/auth/login",
    imageSrc: ProfessionalsHeroSrc,
    heroCards: [
      { title: "Built for", subtitle: "Salons & Freelancers" },
      { title: "Structured", subtitle: "Booking logic" },
      { title: "Direct", subtitle: "Payouts" },
      { title: "Business", subtitle: "Project support" },
    ],
  },
  whyChoose: {
    title: "Why Choose MOLLURE?",
    items: [
      {
        iconKey: "locations",
        title: "Flexible Service Location",
        description:
          "Offer services at fixed locations and/or locations of your choice.",
      },
      {
        iconKey: "business",
        title: "Built For Individual & Company Clients",
        description:
          "Support regular bookings and project bookings for company clients, with client-specific, tax-compliant invoices.",
      },
      {
        iconKey: "chat",
        title: "Built-in Communication",
        description:
          "Communicate with clients through in-platform conversations, with messages linked to bookings when relevant.",
      },
      {
        iconKey: "flow",
        title: "Interactive Booking Flow",
        description:
          "Professionals and clients can both create and confirm bookings, making complex requests easier to manage.",
      },
    ] satisfies readonly ProfessionalFeature[],
  },
  results: {
    title: "Results You Can Expect",
    subtitle:
      "Join thousands of salon owners and freelancers who are saving time and growing revenue.",
    items: [
      {
        iconKey: "moreBookings",
        title: "More Bookings, Fewer Gaps",
        description:
          "Fill your agenda more consistently with a smoother booking flow and fewer back-and-forths.",
      },
      {
        iconKey: "onePlace",
        title: "Everything in One Place",
        description:
          "See bookings, clients, payments, and messages at a glance, no switching between tools.",
      },
      {
        iconKey: "moreTime",
        title: "More Time For What You Love",
        description:
          "Spend less time on admin and more time focusing on your clients and your work.",
      },
    ] satisfies readonly ProfessionalResultCard[],
  },
  pricing: {
    title: "Simple, Transparent Pricing",
    highlights: [
      {
        title: "No Sign-Up Fee",
        description: "Get Started Instantly Without Upfront Costs.",
      },
      {
        title: "No New Or Repeat Client Fees",
        description: "Mollure Doesn’t Take A Cut When You Gain Or Retain Clients.",
      },
      {
        title: "Transparent, Predictable Pricing",
        description: "Small Online Transaction Fee, No Hidden Costs.",
      },
      {
        title: "Direct Deposits Via Stripe",
        description: "Receive Earnings Straight Into Your Own Stripe Account.",
      },
    ],
    features: [
      "Business Setup & Management",
      "Booking & Calendar Management",
      "Client Management",
      "Payments & Invoicing",
      "Business Insights & Analytics",
      "Built-in Communication",
    ],
    cardTitle: "Mollure Professional",
    cardSubtitle: "stripe fee + 1% Mollure fee",
    cardFootnote: "(per online transaction)",
    cardSubnote: "VAT excluded for Mollure fee",
    cardCta: "Choose",
  },
  steps: {
    title: "Let’s Get Started",
    subtitle: "Get started in four simple steps",
    items: [
      {
        number: "1",
        title: "Sign Up",
        description: "Create a personal or business account.",
      },
      {
        number: "2",
        title: "Find A Professional",
        description: "Browse verified beauty & grooming experts.",
      },
      {
        number: "3",
        title: "Set Up Your Booking",
        description:
          "Choose date, location, and services, instant or request-based.",
      },
      {
        number: "4",
        title: "Get Confirmation",
        description:
          "Confirm instantly or after review. Manage updates and payments in one place.",
      },
    ] satisfies readonly ProfessionalStep[],
  },
  cta: {
    title: "Ready To Transform Your Business?",
    subtitle:
      "Join thousands of salon owners and freelancers who are saving time and growing revenue with Mollure.",
    action: "Continue Now",
  },
  footer: professionalsMarketingFooter,
} as const;

