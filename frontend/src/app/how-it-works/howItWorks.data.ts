import {
  HowItWorksChangesApprovalIcon,
  HowItWorksChangesWithoutApprovalIcon,
  HowItWorksClientCreatedIcon,
  HowItWorksProfessionalCreatedIcon,
} from "../../../images";

export type HowItWorksInfoRow = {
  title: string;
  sub: string;
};

export type HowItWorksKeyPrinciple = {
  title: string;
  description: string;
  icon: typeof HowItWorksClientCreatedIcon;
};

export type HowItWorksServiceCategory = {
  label: string;
  iconId: "hair" | "makeup" | "lashes" | "brows" | "facial" | "body" | "waxing";
};

export const howItWorksData = {
  hero: {
    title: "How Booking Works On Mollure",
    subtitle:
      "Interactive booking that puts clarity and communication first. Book with confidence, knowing nothing important happens without your approval.",
  },
  gettingStarted: {
    individualPoints: [
      "Sign Up Via Social Login Or Personal Registration",
      "Manage Profile",
      "Control Over Profile Visibility",
      "Book Services For Personal Needs",
      "Receive Invoices For Online Payment",
    ],
    businessPoints: [
      "Register With Business Details",
      "Manage Profile",
      "Project Booking Access",
      "Book Services For Personal Or Business Needs",
      "Receive Tax-Compliant Invoices (Online Or Offline)",
    ],
    note:
      "Client Profile Information Is Controlled By The Client. Professional Can View Relevant Details Once A Booking Is Confirmed And The Client Has Been Added To The Client List Of The Professional, But Professional Cannot Edit Client User Information.",
  },
  professionalGettingStarted: {
    requirements: {
      intro: "To get listed on Mollure, professionals must meet the following requirements:",
      points: [
        "Be based in the Netherlands",
        "Be a registered professional with a valid KvK and VAT number",
        "Offer services in at least one supported category:",
      ],
      categories: [
        { label: "Hair", iconId: "hair" },
        { label: "Make-Up", iconId: "makeup" },
        { label: "Lashes", iconId: "lashes" },
        { label: "Eyebrows", iconId: "brows" },
        { label: "Face Treatments", iconId: "facial" },
        { label: "Body Treatments", iconId: "body" },
        { label: "Hair Removal", iconId: "waxing" },
      ] satisfies readonly HowItWorksServiceCategory[],
    },
    validation: {
      intro: "Mollure uses a one-step validation process to keep onboarding fast and secure.",
      points: [
        "After signing up, your details are reviewed to confirm you are a legitimate professional.",
        "Once approved, you set up your monthly subscription set up and Stripe onboarding to receive online payments",
        "After you can set up your business profile for fixed location and or desired location and go live",
      ],
    },
  },
  professionalBookingTypes: {
    online: {
      title: "Online Bookings",
      intro:
        "Online bookings can be created by the client or the professional.",
      points: [
        "Always include at least one Mollure client (a registered client with an active Mollure account).",
        "Follow Mollure’s interactive booking process.",
      ],
    },
    offline: {
      title: "Offline Bookings",
      intro:
        "Offline bookings are created directly by the professional and are confirmed immediately. There are two types of offline bookings:",
      nonMollure: {
        title: "Offline booking with a non-Mollure client:",
        points: [
          "The professional creates and manages the client profile.",
          "The client does not have a Mollure account.",
        ],
      },
      guest: {
        title: "Guest booking:",
        points: ["No client profile is created."],
      },
    },
  },
  professionalServiceLocationSetup: {
    title: "Service Location Setup",
    subtitle:
      "Each service location type comes with specific booking capabilities. Below is an overview of the key features available per location.",
    fixedLocation: {
      intro: "Bookings take place at the professional's location.",
      features: [
        {
          title: "Flexible Client & Guest Setup",
          sub: "Add a client with guests, or create a booking with guests only",
        },
        {
          title: "Service Timing Logic",
          sub: "Follow-up or sequential",
        },
        {
          title: "Team Member Assignment",
          sub: "Assign different team members per service",
        },
        {
          title: "Scheduling Controls",
          sub: "Override time interval between bookings if set",
        },
      ] satisfies readonly HowItWorksInfoRow[],
    },
    desiredLocation: {
      intro: "Services take place at a location of the client’s choice.",
      standard: [
        {
          title: "Client & Guest Setup",
          sub: "Add a client with guests, or create a booking with guests only",
        },
        {
          title: "Service Timing Logic",
          sub: "Follow-up or sequential",
        },
        {
          title: "Team Member Assignment",
          sub: "Assign different team members per service",
        },
        {
          title: "Scheduling Controls",
          sub: "Override time interval set between bookings",
        },
        {
          title: "Add Buffer",
          sub: "Add internal buffer time if needed",
        },
      ] satisfies readonly HowItWorksInfoRow[],
      project: [
        {
          title: "Client & Model Setup",
          sub: "Add the client and as many model as needed",
        },
        {
          title: "Service Timing Logic",
          sub: "Follow-up or sequential",
        },
        {
          title: "Team Member Assignment",
          sub: "Assign different team members per service",
        },
        {
          title: "Scheduling Controls",
          sub: "Override time interval between bookings and minimum timeslot block if set",
        },
        {
          title: "Add Buffer & Planning",
          sub: "Add planning details and internal buffer time",
        },
        {
          title: "Project Details & File Uploads",
          sub: "Include comprehensive project information",
        },
      ] satisfies readonly HowItWorksInfoRow[],
    },
    note: "Fixed and desired location online bookings are always sent as a booking request when created by the professional.",
  },
  keyPrinciples: [
    {
      title: "Client-Created Bookings",
      description:
        "Fixed location bookings are confirmed instantly. Desired location bookings are always sent as a booking request when created by a client.",
      icon: HowItWorksClientCreatedIcon,
    },
    {
      title: "Professional-Created Bookings",
      description:
        "Bookings created by professionals are always sent as a booking request, regardless of location.",
      icon: HowItWorksProfessionalCreatedIcon,
    },
    {
      title: "Changes Requiring Approval",
      description:
        "Major changes require approval, so nothing important changes without you knowing.",
      icon: HowItWorksChangesApprovalIcon,
    },
    {
      title: "Changes Without Approval",
      description:
        "Some changes are applied directly and clearly marked. When relevant, you'll be notified that the booking has been edited.",
      icon: HowItWorksChangesWithoutApprovalIcon,
    },
  ] satisfies readonly HowItWorksKeyPrinciple[],
  bookingTypes: {
    fixedLocation: [
      { title: "Guest policy", sub: "Book for yourself and add up to one guest" },
      { title: "Service Timing", sub: "Services start at the same time by default" },
      { title: "Combinable Services", sub: "Select multiple services if offered" },
      { title: "Team Selection", sub: "Assign different team members per service" },
    ] satisfies readonly HowItWorksInfoRow[],
    desiredLocationStandard: [
      { title: "Multiple Guests", sub: "Add as many guests as needed" },
      { title: "Sequential Services", sub: "Services scheduled one after another" },
      { title: "Single Team Member", sub: "All services under one professional" },
      {
        title: "Minimum Time Block",
        sub: "Some professionals may require minimum duration",
      },
    ] satisfies readonly HowItWorksInfoRow[],
    desiredLocationProject: [
      { title: "Multiple Models", sub: "Add As Many Model As Needed" },
      { title: "Sequential Services", sub: "Services Scheduled One After Another" },
      { title: "Single Team Member", sub: "All Services Under One Professional" },
      {
        title: "Minimum Time Block",
        sub: "Some Professionals May Require Minimum Duration",
      },
      {
        title: "Project Details & File Uploads",
        sub: "Include Comprehensive Project Information",
      },
      { title: "Planning Details", sub: "Upload Files And Images For Reference" },
    ] satisfies readonly HowItWorksInfoRow[],
  },
} as const;
