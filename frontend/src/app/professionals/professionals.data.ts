import { professionalsMarketingFooter, professionalsMarketingHeader } from "../../data/marketingShell.data";

export type ProfessionalFeatureIconKey =
  | "locations"
  | "business"
  | "chat"
  | "flow";

export type ProfessionalFeature = {
  iconKey: ProfessionalFeatureIconKey;
  title: string;
  description: string;
};

export type ProfessionalResultCard = {
  iconKey: ProfessionalFeatureIconKey;
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
    primaryAction: "Get started",
    imageSrc: "/professionals/hero.png",
    heroCards: [
      { title: "Built for", subtitle: "professionals" },
      { title: "Structured", subtitle: "bookings" },
      { title: "Direct", subtitle: "communication" },
      { title: "Business", subtitle: "ready" },
    ],
  },
  whyChoose: {
    title: "Why Choose MOLLURE?",
    items: [
      {
        iconKey: "locations",
        title: "Flexible Service Location",
        description: "Offer salon, on-location, or client-requested bookings with clarity.",
      },
      {
        iconKey: "business",
        title: "Built For Individual & Company Clients",
        description: "Handle both personal clients and business bookings in one flow.",
      },
      {
        iconKey: "chat",
        title: "Built-in Communication",
        description: "Keep every conversation connected to the booking—no lost context.",
      },
      {
        iconKey: "flow",
        title: "Interactive Booking Flow",
        description: "Approve meaningful changes, confirm details, and stay in control.",
      },
    ] satisfies readonly ProfessionalFeature[],
  },
  results: {
    title: "Results You Can Expect",
    subtitle:
      "Join thousands of salon owners and freelancers who are saving time and growing revenue.",
    items: [
      {
        iconKey: "locations",
        title: "More Bookings, Fewer Gaps",
        description: "Stay discoverable and fill your calendar with better scheduling.",
      },
      {
        iconKey: "business",
        title: "Everything in One Place",
        description: "Bookings, chat, changes, and payments—organized and searchable.",
      },
      {
        iconKey: "chat",
        title: "More Time For What You Love",
        description: "Reduce admin work so you can focus on clients and craft.",
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
    subtitle: "Get started in three simple steps",
    items: [
      { number: "1", title: "Sign Up", description: "Create your professional account." },
      { number: "2", title: "Find A Professional", description: "Set up your services and profile." },
      { number: "3", title: "Set Up Your Booking", description: "Choose your booking types and availability." },
      { number: "4", title: "Get Confirmation", description: "Start receiving bookings and confirmations." },
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

