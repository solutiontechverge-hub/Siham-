export type CalendarSubTab = "Overview" | "Schedule" | "Hours and Rules";
export type CalendarViewMode = "day" | "week" | "month";

export type CalendarBookingStatus =
  | "Requested"
  | "Cancelled"
  | "Confirmed"
  | "Completed"
  | "No Show";

export type CalendarBookingLocation = "FL" | "DL";

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
  availability: readonly ResourceAvailability[];
  timeGrid: {
    startHour: number;
    endHour: number;
    stepMinutes: number;
  };
  events: readonly CalendarEvent[];
  blocks: readonly CalendarBlock[];
};

export const professionalFixedLocationCalendarData: ProfessionalFixedLocationCalendarData = {
  subTabs: ["Overview", "Schedule", "Hours and Rules"],
  initialSubTab: "Overview",
  initialView: "day",
  initialDate: "2022-05-27",
  resources: [
    { id: "r-1", name: "Abril Lewis", avatarText: "A" },
    { id: "r-2", name: "Jordan Smith", avatarText: "J" },
    { id: "r-3", name: "Maya Patel", avatarText: "M" },
  ],
  availability: [
    {
      resourceId: "r-1",
      weekly: {
        5: [{ start: "08:00", end: "17:00" }], // Friday
      },
    },
    {
      resourceId: "r-2",
      weekly: {
        5: [{ start: "09:00", end: "18:00" }], // Friday
      },
    },
    {
      resourceId: "r-3",
      weekly: {
        5: [{ start: "08:30", end: "16:30" }], // Friday
      },
    },
  ],
  timeGrid: { startHour: 8, endHour: 10, stepMinutes: 15 },
  events: [
    {
      id: "b-34009-a",
      resourceId: "r-1",
      date: "2022-05-27",
      start: "08:00",
      end: "08:15",
      title: "Hot stone full body massage",
      status: "Requested",
      location: "FL",
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
      showClientName: "Liam R",
    },
  ],
  blocks: [
    { id: "blk-1", resourceId: "r-1", date: "2022-05-27", start: "08:45", end: "09:00", title: "Lunch Break", kind: "break" },
    { id: "blk-2", resourceId: "r-2", date: "2022-05-27", start: "08:00", end: "09:00", title: "Unavailable", kind: "unavailable" },
    { id: "blk-3", resourceId: "r-3", date: "2022-05-27", start: "09:00", end: "09:15", title: "Break", kind: "break" },
  ],
};

