import type { SvgIconComponent } from "@mui/icons-material";
import {
  LocationOnOutlined,
  TuneOutlined,
  ErrorOutlineOutlined,
  BoltOutlined,
} from "@mui/icons-material";

export type HowItWorksInfoRow = {
  title: string;
  sub: string;
};

export type HowItWorksKeyPrinciple = {
  title: string;
  description: string;
  Icon: SvgIconComponent;
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
      "Register with business details",
      "Manage Profile",
      "Project booking access",
      "Book services for personal or Business needs",
      "Receive tax-compliant invoices (online or offline)",
    ],
    note:
      "Client profile information is controlled by the client. Professional can view relevant details once a booking is confirmed and the client has been added to the client list of the professional, but professional cannot edit client user information.",
  },
  keyPrinciples: [
    {
      title: "Client-Created Bookings",
      description:
        "Fixed location bookings are confirmed instantly. Desired location bookings are always sent as a booking request when created by a client.",
      Icon: LocationOnOutlined,
    },
    {
      title: "Professional-Created Bookings",
      description:
        "Bookings created by professionals are always sent as a booking request, regardless of location.",
      Icon: TuneOutlined,
    },
    {
      title: "Changes Requiring Approval",
      description:
        "Major changes require approval, so nothing important changes without you knowing.",
      Icon: ErrorOutlineOutlined,
    },
    {
      title: "Changes Without Approval",
      description:
        "Some changes are applied directly and clearly marked. When relevant, you'll be notified that the booking has been edited.",
      Icon: BoltOutlined,
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

