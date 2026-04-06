import {
  marketingShellFooter,
  marketingShellHeader,
} from "../../data/marketingShell.data";

export type ClientFeatureIconKey =
  | "location"
  | "booking"
  | "communication"
  | "personal"
  | "payment"
  | "verified";

export type ClientFeature = {
  iconKey: ClientFeatureIconKey;
  title: string;
  body: string;
  description: string;
};

export type ClientStep = {
  number: string;
  title: string;
  body: string;
};

export type ClientTestimonial = {
  id: number;
  name: string;
  role: string;
  text: string;
};

export type ClientFooterColumn = {
  title: string;
  items: string[];
};

export type ClientFilter = {
  label: string;
  placeholder: string;
  options?: string[];
};

export const clientsPageData = {
  header: marketingShellHeader,
  hero: {
    eyebrow: "Beauty & Grooming For Your Time",
    title: "Book Beauty And Grooming Professionals On Your Terms",
    description:
      "Find verified professionals for salon or on-location services. Review, confirm, and manage bookings in one place for personal or business needs.",
    primaryAction: "Browse Professionals",
    filters: [
      { label: "Select Category", placeholder: "Hair stylist", options: ['helo','hehjhe']},
      { label: "Location", placeholder: "Select city", options: ['helo','hehjhe'] },
      { label: "Select Municipality", placeholder: "Select municipality", options: ['helo','hehjhe'] },
    ] satisfies ClientFilter[],
    searchAction: "Search",
  },
  whyChooseSection: {
    title: "Why Choose Mollure?",
    items: [
      {
        iconKey: "location",
        title: "Flexible Service Locations",
        body:
          "Salon or on-location, done right.",
          description:' Book at Mollure-listed shops or request a professional to come to your place.'
      },
      {
        iconKey: "booking",
        title: "Interactive Booking Flow",
        body:
          "Full confirmations for both sides ",
        description:' Instant confirmations or review-first bookings — changes that matter always require approval.'
        },
      {
        iconKey: "communication",
        title: "Direct Communication",
        body:
          "Ask questions anytime. ",
          description:' After booking confirmation, your chat and booking conversations stay active for appointment follow-up.'
      },
      {
        iconKey: "personal",
        title: "Personal & Business Friendly",
        body:
          "From self-care to company projects,",
          description:' book for personal needs or business use including photo shoots and campaigns.'
      },
      {
        iconKey: "payment",
        title: "Secure Payments & Invoicing",
        body:
          "Payments that work for real life",
          description:'Pay online securely. Business clients receive tax-compliant invoices automatically.'
      },
      {
        iconKey: "verified",
        title: "Verified Professionals",
        body:
          "Book with confidence. ",
          description:' View verified profiles and real client reviews before choosing your beauty specialist.'
      },
    ] satisfies ClientFeature[],
  },
  stepsSection: {
    title: "Get Started In A Few Steps",
    items: [
      { number: "1", title: "Sign Up", body: "Create a personal or business account." },
      {
        number: "2",
        title: "Find A Professional",
        body: "Browse verified beauty & grooming experts.",
      },
      {
        number: "3",
        title: "Set Up Your Booking",
        body: "Choose date, location, and services — instant or request-based.",
      },
      {
        number: "4",
        title: "Get Confirmation",
        body: "Confirm instantly or after review. Manage updates and payments in one place.",
      },
    ] satisfies ClientStep[],
  },
  testimonialsSection: {
    title: "Testimonials",
    items: Array.from({ length: 4 }).map(
      (_, index): ClientTestimonial => ({
        id: index,
        name: "Emily Jef",
        role: "Hairstylist",
        text:
          "The platform helped me get more consistent appointments and smoother communication with my clients.",
      })
    ),
  },
  professionalCta: {
    title: "For Beauty And Grooming Professionals",
    description:
      "Join thousands of salon owners and freelancers who are saving time and growing their revenue with Mollure.",
    action: "Partner with Mollure",
    supportingText: "Credit card required - free for first 50 transactions",
  },
  footer: marketingShellFooter,
} as const;
