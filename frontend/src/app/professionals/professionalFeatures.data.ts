import { professionalsMarketingFooter, professionalsMarketingHeader } from "../../data/marketingShell.data";

export type ProfessionalFeaturesPreviewItem = {
  label: string;
  value?: string;
  tone?: "teal" | "navy" | "slate";
};

export type ProfessionalFeaturesMiniCardIconKey =
  | "fixedLocation"
  | "desiredLocation"
  | "combinable"
  | "project";

export type ProfessionalFeaturesMiniCard = {
  title: string;
  subtitle: string;
  iconKey: ProfessionalFeaturesMiniCardIconKey;
  meta?: string;
};

export type ProfessionalFeaturesSection = {
  title: string;
  intro?: string;
  bullets: readonly string[];
  /**
   * Light-tinted section background, matching the screenshot rhythm.
   * Keep this as a data concern so the component stays reusable.
   */
  tint: "teal" | "mint" | "sand" | "sky";
  /**
   * Optional richer layout (used for the screenshot-style first section).
   */
  detail?: {
    labelBullets?: readonly string[];
    cardsRow?: readonly ProfessionalFeaturesMiniCard[];
    dashedGroup?: {
      title: string;
      cards: readonly ProfessionalFeaturesMiniCard[];
    };
    twoColumnList?: readonly {
      left: readonly string[];
      right: readonly string[];
    }[];
  };
  previewTitle: string;
  previewSubtitle?: string;
  previewItems: readonly ProfessionalFeaturesPreviewItem[];
};

export type ProfessionalFeaturesPageData = {
  header: typeof professionalsMarketingHeader;
  title: string;
  subtitle: string;
  sections: readonly ProfessionalFeaturesSection[];
  footer: typeof professionalsMarketingFooter;
};

export const professionalFeaturesPageData = {
  header: professionalsMarketingHeader,
  title: "Features",
  subtitle:
    "Interactive Booking That Puts Clarity And Communication First. Book With Confidence, Knowing Nothing Important Happens Without Your Approval.",
  sections: [
    {
      tint: "teal",
      title: "Business Setup & Professional Presence",
      intro:
        "Create A Professional Presence That Clearly Reflects Who You Are And How You Work.",
      bullets: [
        "Choose whether you offer services at a Fixed Location, Desired Location, or both",
        "Option to use the same content for both locations or manage them separately",
        "Present your professional name, bio, cover images, and keywords",
        "Define your service locations:",
        "Structure your services and sub-services with clear pricing",
        "Enable optional booking features:",
        "Add team members and define which services they provide",
        "Display key business information on your profile:",
        "Showcase your work with a portfolio of images visible on your public profile",
      ],
      detail: {
        cardsRow: [
          {
            iconKey: "fixedLocation",
            title: "Fixed Location",
            subtitle: "Provide Your Salon Or Workspace Address",
          },
          {
            iconKey: "desiredLocation",
            title: "Desired Location",
            subtitle:
              "Define Your Operating Areas (Nationwide Or Selected Provinces/Municipalities)",
          },
        ],
        dashedGroup: {
          title: "Enable optional booking features:",
          cards: [
            {
              iconKey: "combinable",
              title: "Combinable Services",
              subtitle: "(Fixed Location Only)",
            },
            {
              iconKey: "project",
              title: "Project Bookings",
              subtitle: "(Desired Location Only, For Business Clients)",
            },
          ],
        },
        twoColumnList: [
          {
            left: ["Price Range", "Kilometer Allowance For On-Location Services"],
            right: [
              "Policies (Response Time, Cancellation, Rescheduling, No-Show)",
              "Prepayment Requirements (If Applicable)",
            ],
          },
        ],
      },
      previewTitle: "Business Location",
      previewSubtitle: "Set your business details",
      previewItems: [
        { label: "Remote location", tone: "teal" },
        { label: "Company location", tone: "navy" },
        { label: "On location", tone: "slate" },
      ],
    },
    {
      tint: "mint",
      title: "Calendar & Scheduling",
      bullets: [
        "Control your availability with clear working hours.",
        "Reduce gaps with structured scheduling and smart slots.",
        "Keep everything synced with your booking settings.",
      ],
      previewTitle: "Calendar setup",
      previewSubtitle: "Availability & working hours",
      previewItems: [
        { label: "Set working hours", tone: "teal" },
        { label: "Add breaks", tone: "slate" },
        { label: "Buffer time", tone: "navy" },
      ],
    },
    {
      tint: "sand",
      title: "Interactive Booking Flow",
      bullets: [
        "Approve meaningful changes instead of surprise edits.",
        "Collect the right details before confirming a booking.",
        "Keep communication tied to each booking for clarity.",
      ],
      previewTitle: "Booking request",
      previewSubtitle: "Confirm details & changes",
      previewItems: [
        { label: "Service selection", tone: "teal" },
        { label: "Time slot approval", tone: "navy" },
        { label: "Notes & requirements", tone: "slate" },
      ],
    },
    {
      tint: "sky",
      title: "Client Management & Insights",
      bullets: [
        "Manage client profiles and booking history in one place.",
        "Stay organized with notes and preferences per client.",
        "Understand performance with simple insights.",
      ],
      previewTitle: "Client management",
      previewSubtitle: "History, notes, preferences",
      previewItems: [
        { label: "Client list", tone: "teal" },
        { label: "Booking history", tone: "slate" },
        { label: "Client notes", tone: "navy" },
      ],
    },
    {
      tint: "teal",
      title: "Payments, Invoicing & Financial Control",
      bullets: [
        "Accept payments securely via Stripe.",
        "Keep clear records for invoices and transactions.",
        "Get paid directly into your own Stripe account.",
      ],
      previewTitle: "Payments",
      previewSubtitle: "Stripe connected",
      previewItems: [
        { label: "Direct deposits", tone: "teal" },
        { label: "Invoices", tone: "navy" },
        { label: "Transaction history", tone: "slate" },
      ],
    },
    {
      tint: "mint",
      title: "Analytics & Performance",
      bullets: [
        "Track bookings, revenue, and client retention.",
        "Spot trends quickly with lightweight insights.",
        "Make smarter decisions with clear metrics.",
      ],
      previewTitle: "Analytics",
      previewSubtitle: "Performance overview",
      previewItems: [
        { label: "Bookings", value: "+12%", tone: "teal" },
        { label: "Revenue", value: "+8%", tone: "navy" },
        { label: "Retention", value: "+5%", tone: "slate" },
      ],
    },
    {
      tint: "sky",
      title: "Notifications",
      bullets: [
        "Stay updated with booking confirmations and reminders.",
        "Keep clients informed without manual follow-ups.",
        "Reduce no-shows with timely updates.",
      ],
      previewTitle: "Notifications",
      previewSubtitle: "Confirmations & reminders",
      previewItems: [
        { label: "Booking confirmation", tone: "teal" },
        { label: "Reminder", tone: "navy" },
        { label: "Change request", tone: "slate" },
      ],
    },
  ] satisfies readonly ProfessionalFeaturesSection[],
  footer: professionalsMarketingFooter,
} satisfies ProfessionalFeaturesPageData;

