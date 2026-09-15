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

/** Inline copy with optional bold spans (Payments bullets). */
export type HowItWorksRichPart = { text: string; bold?: boolean };
export type HowItWorksRichLine = readonly HowItWorksRichPart[];

export type HowItWorksRequestCard = {
  key: "bookingRequest" | "editedBookingRequest" | "editRequest";
  iconId: "bookingRequest" | "editedBooking" | "editConfirmed";
  title: string;
  body: string;
  respondLabel: string;
  actions: readonly ("accept" | "suggestion" | "reject")[];
  suggestionLabel?: string;
  /** Edit-request expanded panel extras */
  examplesIntro?: string;
  examples?: readonly string[];
  reassignNote?: string;
  whenReceivedLabel?: string;
  cancelNote?: string;
};

export type HowItWorksChangesBlock = {
  title: string;
  body: string;
  items: readonly { kind: "check" | "bell"; text: string }[];
  footer: string;
};

export const howItWorksData = {
  hero: {
    title: "How Booking Works On Mollure",
    subtitle:
      "Interactive booking that puts clarity and communication first. Book with confidence, knowing nothing important happens without your approval.",
  },
  interactiveProcess: {
    title: "Interactive Booking Process",
    description:
      "Mollure uses an interactive online booking process. This means bookings are not always instantly confirmed. Some bookings require review and approval before they are finalized. In certain situations, changes made before or after confirmation also require approval, ensuring both parties stay aligned throughout the booking process.",
  },
  sectionTitles: {
    gettingStarted: "Getting Started",
    keyPrinciples: "Key Principles of Mollure",
    bookingTypesAndSetup: "Booking Types and Setup",
    bookingTypes: "Booking Types",
    typesOfRequests: "Types of Requests",
    changesWithoutApproval: "Changes Without Approval",
  },
  responseActionLabels: {
    accept: "Accept",
    suggestion: "Suggestion for change",
    reject: "Reject",
  },
  gettingStarted: {
    individualTitle: "Individual Clients",
    businessTitle: "Business Clients",
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
      title: "Requirements",
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
      title: "Validation & Onboarding",
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
      title: "Fixed Location",
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
      title: "Desired Location Bookings",
      intro: "Services take place at a location of the client’s choice.",
      standardBadge: "Standard",
      projectBadge: "Project (only for business clients)",
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
    fixedLocationTitle: "Fixed Location",
    fixedLocationIntro:
      "Bookings take place at the professional's location.",
    fixedLocationConfirmBanner:
      "Client-created bookings are confirmed immediately.",
    desiredLocationTitle: "Desired Location Bookings",
    desiredLocationIntro: "Services take place at a location of your choice.",
    standardBadge: "Standard (for individual and business clients)",
    projectBadge: "Project (only for business clients)",
    desiredLocationRequestBanner:
      "Desired location bookings are always sent as a booking request when created by a client.",
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
  typesOfRequests: {
    title: "Types of Requests",
    cards: [
      {
        key: "bookingRequest",
        iconId: "bookingRequest",
        title: "Booking Request",
        body: "When the professional sends a booking request to the client.",
        respondLabel: "Client can respond with:",
        actions: ["accept", "suggestion", "reject"],
        suggestionLabel: "Suggest change via message",
      },
      {
        key: "editedBookingRequest",
        iconId: "editedBooking",
        title: "Edited Booking Request",
        body: "When the professional edits a booking request from the client or the booking request you sent to the client.",
        respondLabel: "Client can respond with:",
        actions: ["accept", "suggestion", "reject"],
        suggestionLabel: "Suggest change via message",
      },
      {
        key: "editRequest",
        iconId: "editConfirmed",
        title: "Edit Request",
        body: "An edit request is required for any change made by the professional to a confirmed booking that affects booking details, except for minor updates and standalone service order adjustments. The edit request clearly highlights what has changed compared to the original confirmation.",
        respondLabel: "Examples of changes that require an edit request:",
        actions: ["accept", "suggestion"],
        examplesIntro: "Examples of changes that require an edit request:",
        examples: [
          "Date and/or time",
          "Address for desired location",
          "Assigned team member",
          "Add or cancel items",
          "Duration & pricing",
          "Project-related details",
        ],
        reassignNote:
          "Note: If the professional reassigns a team member without changing the price or duration, client approval is not required. The client will still be notified of the update.",
        whenReceivedLabel: "When client receives an edit request, client can:",
        cancelNote:
          "Client can always cancel a confirmed booking with an incoming or outgoing edit request.",
      },
    ] satisfies readonly HowItWorksRequestCard[],
    /** @deprecated prefer cards[].examples — kept for any external reads */
    editRequestExamples: [
      "Date and/or time",
      "Address for desired location",
      "Assigned team member",
      "Add or cancel items",
      "Duration & pricing",
      "Project-related details",
    ],
  },
  changesWithoutApproval: {
    title: "Changes Without Approval",
    detailChanges: {
      title: "Detail Changes",
      body: "Applied directly and shown as 'updated'. No approval needed",
      items: [
        { kind: "check", text: "Contact details" },
        { kind: "check", text: "Guest names" },
      ],
      footer: "This applies to both clients and professionals.",
    } satisfies HowItWorksChangesBlock,
    serviceOrder: {
      title: "Service Order Change",
      body: "If a professional only changes the service order:",
      items: [
        { kind: "check", text: "The booking remains confirmed" },
        {
          kind: "bell",
          text: "The client will be notified that the booking has been updated",
        },
      ],
      footer:
        "If service order is changed with other details, it becomes part of a request.",
    } satisfies HowItWorksChangesBlock,
    /** @deprecated prefer detailChanges.items */
    detailItems: ["Contact details", "Guest names"],
  },
  professionalResponse: {
    title: "How Professionals Respond To Requests",
    intro:
      "When a professional receives a request from a client, whether it is a booking request or an edit request, The professional can always respond in one of three ways.",
    actions: [
      {
        key: "accept",
        title: "Accept the request",
        body: "Confirm the requested booking and changes.",
      },
      {
        key: "edit",
        title: "Edit the request",
        body: "Edit details and send a new request back for review:",
        bullets: [
          "You may send an edited booking request when the client needs to review your updates before confirmation.",
          "You may send an edit request when changes apply to an already confirmed booking.",
        ],
      },
      {
        key: "reject",
        title: "Reject the request",
        body: "Decline the booking or changes.",
      },
    ],
    footnote:
      "The type of request sent depends on the current state of the booking, but the response options remain the same.",
  },
  discardingRequests: {
    title: "Discarding Requests",
    description:
      "Any Active Booking Request Or Edit Request Can Be Discarded By The Party Who Sent It. Once Discarded, The Request Is Removed And No Further Action Is Required From The Other Party.",
  },
  clientRescheduling: {
    title: "Client Rescheduling",
    fixedLocation: {
      title: "Fixed Location",
      body: "Rescheduling Updates The Booking Directly And Notifies The Professional That The Booking Has Been Edited.",
      badge: "Instant Update",
    },
    desiredLocation: {
      title: "Desired Location",
      body: "Rescheduling Sends An Edit Request To The Professional For Approval.",
      badge: "Requires Approval",
    },
  },
  paymentsAndInvoices: {
    title: "Payments & Invoices",
    prepayment: {
      title: "Prepayment",
      intro: {
        professionals:
          "Professionals Can Require Prepayment For Online And Offline Bookings.",
        clients: "Prepayment May Be Required Before A Booking Is Confirmed.",
      },
      bullets: {
        professionals: [
          [
            { text: "Online Bookings:", bold: true },
            { text: " Prepayment Is Always Completed Online " },
            { text: "Within The Response Time.", bold: true },
          ],
          [
            { text: "Offline Bookings:", bold: true },
            { text: " Prepayment Can Be Collected Online " },
            { text: "Within 15 Minutes After Sending The Payment Link", bold: true },
            { text: ", Or " },
            { text: "Offline Immediately After Checkout.", bold: true },
          ],
          [
            { text: "Prepayment Is Completed " },
            { text: "During Booking For Fixed Location", bold: true },
            { text: " And " },
            { text: "After Request Approval For Desired Location.", bold: true },
          ],
        ] satisfies readonly HowItWorksRichLine[],
        clients: [
          [
            { text: "Prepayment Is Completed " },
            { text: "Online Within The Response Time.", bold: true },
          ],
          [
            { text: "Prepayment Is Completed " },
            { text: "During Booking For Fixed Location.", bold: true },
          ],
          [
            { text: "Prepayment Is Completed " },
            { text: "After Request Approval For Desired Location.", bold: true },
          ],
        ] satisfies readonly HowItWorksRichLine[],
      },
    },
    postBooking: {
      title: "Post-Booking Payment",
      intro: {
        professionals:
          "Professional Can Collect Payments After The Booking For Both Online And Offline Bookings.",
        clients: "Payments Completed After The Service",
      },
      bullets: {
        professionals: [
          [{ text: "Online Or Offline Payments", bold: true }],
          [
            { text: "Immediate Payments", bold: true },
            { text: " (Within 15 Minutes After Receiving The Payment Link)" },
          ],
          [
            { text: "Deadline-Based Payments", bold: true },
            { text: " (Paid Before The Invoice Due Date)" },
          ],
          [
            { text: "Invoices With Due Date", bold: true },
            {
              text: " Are Used For Business Clients Or Fees As No-Show Charges For Individual Clients.",
            },
          ],
        ] satisfies readonly HowItWorksRichLine[],
        clients: [
          [
            { text: "Payments Can Be Completed " },
            { text: "Online Using A Payment Link", bold: true },
          ],
          [
            { text: "Immediate Payments", bold: true },
            { text: " (Within 15 Minutes After Receiving The Payment Link)" },
          ],
          [
            { text: "Deadline-Based Payments", bold: true },
            { text: " (Paid Before The Invoice Due Date)" },
          ],
        ] satisfies readonly HowItWorksRichLine[],
      },
    },
    invoices: {
      title: "Invoices & Payment",
      intro: "Clients Receive Pdf Invoices, Payment Links And Receipts",
      bullets: [
        [
          { text: "When A Client Or Guest Pays " },
          { text: "Online", bold: true },
          { text: ", An " },
          { text: "Invoice, Payment Link And Receipt", bold: true },
          { text: " Are Automatically Sent By Email." },
        ],
        [
          { text: "Mollure Clients Can Also Access " },
          { text: "Invoices, Payment Links And Receipts", bold: true },
          { text: " In Their " },
          { text: "Booking Overview.", bold: true },
        ],
        [
          { text: "Business Clients Always Receive " },
          { text: "Tax-Compliant Invoices And Receipts", bold: true },
          { text: " Even When Paying " },
          { text: "Offline.", bold: true },
        ],
      ] satisfies readonly HowItWorksRichLine[],
    },
  },
  groupedBookings: {
    title: "Paying For Grouped Bookings",
    fullPayment: {
      title: "Full Payment",
      body: "One Person Can Pay The Full Amount.",
    },
    split: {
      title: "Split Between Participants",
      body: "Each Participant Can Pay Their Own Share, Or One Person Can Cover Multiple Participants In A Single Payment.",
    },
  },
  bookingCommunication: {
    title: "Booking Communication",
    body: "Use Built-In Messaging To Contact A Professional Before Booking Or Communicate About An Existing Appointment. Once A Booking Request Or Confirmation Exists, All Messages, Edits, And Change Suggestions Are Automatically Linked To That Booking. This Keeps Every Conversation In One Place And Makes Complex Bookings Easy To Manage Without Losing Context.",
  },
} as const;
