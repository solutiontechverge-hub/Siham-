export type CalendarSubTab = "Overview" | "Schedule" | "Hours and Rules";
export type CalendarViewMode = "day" | "week" | "month";

export type CalendarBookingStatus =
  | "Requested"
  | "Cancelled"
  | "Confirmed"
  | "Completed"
  | "No Show";

export type CalendarBookingLocation = "FL" | "DL";

export type CalendarBookingType = "Online" | "Offline" | "Project" | "Requests";

export type CalendarResource = {
  id: string;
  name: string;
  avatarText: string;
};

export type CalendarEvent = {
  id: string;
  resourceId: string;
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  title: string;
  status: CalendarBookingStatus;
  location: CalendarBookingLocation;
  bookingType?: CalendarBookingType;
  showClientName?: string;
};

export type CalendarBlock = {
  id: string;
  resourceId: string;
  date: string; // "YYYY-MM-DD"
  start: string;
  end: string;
  title: string;
  kind: "break" | "unavailable";
};

export type AvailabilityWindow = {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type ResourceAvailability = {
  resourceId: string;
  /**
   * Weekly availability template. Keys follow JS `Date.getDay()`:
   * 0=Sun ... 6=Sat
   */
  weekly: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, readonly AvailabilityWindow[]>>;
};

export type ProfessionalFixedLocationCalendarData = {
  subTabs: readonly CalendarSubTab[];
  initialSubTab: CalendarSubTab;
  initialView: CalendarViewMode;
  initialDate: string; // "YYYY-MM-DD"
  resources: readonly CalendarResource[];
  supportedLocations: readonly CalendarBookingLocation[];
  availability: readonly ResourceAvailability[];
  timeGrid: {
    startHour: number;
    endHour: number;
    stepMinutes: number;
  };
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
};

const everyDayAvailability = (start: string, end: string): ResourceAvailability["weekly"] => ({
  0: [{ start, end }],
  1: [{ start, end }],
  2: [{ start, end }],
  3: [{ start, end }],
  4: [{ start, end }],
  5: [{ start, end }],
  6: [{ start, end }],
});

export const professionalFixedLocationCalendarData: ProfessionalFixedLocationCalendarData = {
  subTabs: ["Overview", "Schedule", "Hours and Rules"],
  initialSubTab: "Overview",
  initialView: "day",
  // Mock seed: keep initial view in April so activities are visible immediately.
  initialDate: "2026-04-15",
  resources: [
    { id: "r-1", name: "Abril Lewis", avatarText: "A" },
    { id: "r-2", name: "Jordan Smith", avatarText: "J" },
    { id: "r-3", name: "Maya Patel", avatarText: "M" },
  ],
  supportedLocations: ["FL", "DL"],
  availability: [
    {
      resourceId: "r-1",
      weekly: everyDayAvailability("08:00", "17:00"),
    },
    {
      resourceId: "r-2",
      weekly: everyDayAvailability("09:00", "18:00"),
    },
    {
      resourceId: "r-3",
      weekly: everyDayAvailability("08:30", "16:30"),
    },
  ],
  timeGrid: { startHour: 8, endHour: 10, stepMinutes: 15 },
  events: [
    // April mock activities
    {
      id: "b-24001-a",
      resourceId: "r-1",
      date: "2026-04-15",
      start: "08:00",
      end: "08:30",
      title: "Deep tissue massage",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Emma S",
    },
    {
      id: "b-24001-b",
      resourceId: "r-1",
      date: "2026-04-15",
      start: "08:30",
      end: "08:45",
      title: "Brow shaping",
      status: "Requested",
      location: "DL",
      bookingType: "Requests",
      showClientName: "Noah P",
    },
    {
      id: "b-24001-c",
      resourceId: "r-1",
      date: "2026-04-15",
      start: "09:15",
      end: "09:45",
      title: "Haircut + wash",
      status: "Completed",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Lissa J",
    },
    {
      id: "b-24002-a",
      resourceId: "r-2",
      date: "2026-04-15",
      start: "09:00",
      end: "09:30",
      title: "Make-up (trial)",
      status: "Confirmed",
      location: "FL",
      bookingType: "Project",
      showClientName: "Ava K",
    },
    {
      id: "b-24002-b",
      resourceId: "r-2",
      date: "2026-04-18",
      start: "08:45",
      end: "09:15",
      title: "Lash refill",
      status: "No Show",
      location: "DL",
      bookingType: "Online",
      showClientName: "Yuki T",
    },
    {
      id: "b-24003-a",
      resourceId: "r-3",
      date: "2026-04-18",
      start: "08:30",
      end: "09:00",
      title: "Express facial",
      status: "Cancelled",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Liam R",
    },
    {
      id: "b-24003-b",
      resourceId: "r-3",
      date: "2026-04-22",
      start: "09:00",
      end: "09:30",
      title: "Color consultation",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Priya S",
    },
    {
      id: "b-24002-c",
      resourceId: "r-2",
      date: "2026-04-22",
      start: "09:30",
      end: "09:45",
      title: "Quick check-in",
      status: "Completed",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Alex M",
    },
    {
      id: "b-24030-a",
      resourceId: "r-1",
      date: "2026-04-30",
      start: "08:00",
      end: "08:30",
      title: "Hair styling",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Sara J",
    },
    {
      id: "b-24030-b",
      resourceId: "r-1",
      date: "2026-04-30",
      start: "09:00",
      end: "09:30",
      title: "Deep tissue massage",
      status: "Requested",
      location: "DL",
      bookingType: "Requests",
      showClientName: "Liam R",
    },
    {
      id: "b-24030-c",
      resourceId: "r-2",
      date: "2026-04-30",
      start: "08:45",
      end: "09:15",
      title: "Manicure",
      status: "Completed",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Emma S",
    },
    {
      id: "b-24030-d",
      resourceId: "r-3",
      date: "2026-04-30",
      start: "09:15",
      end: "09:45",
      title: "Express facial",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Noah P",
    },
    {
      id: "b-34009-a",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "08:00",
      end: "08:15",
      title: "Hot stone full body massage",
      status: "Requested",
      location: "FL",
      bookingType: "Requests",
      showClientName: "Lissa J",
    },
    {
      id: "b-34009-b",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "08:00",
      end: "08:15",
      title: "Hot stone full body massage",
      status: "Requested",
      location: "FL",
      bookingType: "Requests",
      showClientName: "Lissa J",
    },
    {
      id: "b-34009-c",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "08:15",
      end: "08:30",
      title: "Hair Cut",
      status: "Cancelled",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Lissa J",
    },
    {
      id: "b-34009-d",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "09:00",
      end: "09:15",
      title: "Hair Cut",
      status: "Confirmed",
      location: "DL",
      bookingType: "Online",
      showClientName: "Lissa J",
    },
    {
      id: "b-34009-e",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "09:15",
      end: "09:30",
      title: "Hair Cut",
      status: "Completed",
      location: "DL",
      bookingType: "Project",
      showClientName: "Lissa J",
    },
    {
      id: "b-34009-f",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "09:30",
      end: "09:45",
      title: "Hair Cut",
      status: "No Show",
      location: "DL",
      bookingType: "Offline",
      showClientName: "Lissa J",
    },
    {
      id: "b-44001-a",
      resourceId: "r-2",
      date: "2022-05-27",
      start: "09:00",
      end: "09:30",
      title: "Make-up",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Ava K",
    },
    {
      id: "b-44001-b",
      resourceId: "r-2",
      date: "2022-05-27",
      start: "09:30",
      end: "09:45",
      title: "Brows",
      status: "Requested",
      location: "DL",
      bookingType: "Requests",
      showClientName: "Noah P",
    },
    {
      id: "b-55002-a",
      resourceId: "r-3",
      date: "2022-05-27",
      start: "08:30",
      end: "09:00",
      title: "Lashes",
      status: "Completed",
      location: "FL",
      bookingType: "Project",
      showClientName: "Emma S",
    },
    {
      id: "b-55002-b",
      resourceId: "r-3",
      date: "2022-05-27",
      start: "09:15",
      end: "09:45",
      title: "Hair Wash",
      status: "Cancelled",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Liam R",
    },
  ],
  blocks: [
    { id: "blk-apr-1", resourceId: "r-1", date: "2026-04-15", start: "08:45", end: "09:00", title: "Break", kind: "break" },
    { id: "blk-apr-2", resourceId: "r-2", date: "2026-04-18", start: "08:00", end: "08:45", title: "Unavailable", kind: "unavailable" },
    { id: "blk-apr-3", resourceId: "r-3", date: "2026-04-22", start: "08:30", end: "09:00", title: "Training", kind: "break" },
    { id: "blk-apr-4", resourceId: "r-2", date: "2026-04-30", start: "09:15", end: "09:30", title: "Break", kind: "break" },
    { id: "blk-1", resourceId: "r-1", date: "2022-05-27", start: "08:45", end: "09:00", title: "Lunch Break", kind: "break" },
    { id: "blk-2", resourceId: "r-2", date: "2022-05-27", start: "08:00", end: "09:00", title: "Unavailable", kind: "unavailable" },
    { id: "blk-3", resourceId: "r-3", date: "2022-05-27", start: "09:00", end: "09:15", title: "Break", kind: "break" },
  ],
};
