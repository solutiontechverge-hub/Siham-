export type CalendarSubTab = "Overview" | "Schedule" | "Settings";
export type CalendarViewMode = "day" | "week" | "month";

export type CalendarBookingStatus =
  | "Requested"
  | "Cancelled"
  | "Confirmed"
  | "Completed"
  | "No Show"
  | "Invalid";

export type CalendarBookingLocation = "FL" | "DL";

export type CalendarBookingType = "Online" | "Offline" | "Project" | "Requests";

export type CalendarBookingScenario = "BR" | "EBR" | "ER" | "E";

export type CalendarBookingServiceItem = {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  staffResourceId?: string;
};

export type CalendarBookingProductItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
};

export type CalendarBookingGuestItem = {
  id: string;
  name: string;
  services: CalendarBookingServiceItem[];
  products: CalendarBookingProductItem[];
};

export type CalendarBookingDetails = {
  clientEmail?: string;
  services?: CalendarBookingServiceItem[];
  products?: CalendarBookingProductItem[];
  guests?: CalendarBookingGuestItem[];
  phoneCode?: string;
  phoneNumber?: string;
  desiredLocation?: {
    street: string;
    number: string;
    postalCode: string;
    province: string;
    municipality: string;
  };
  prepaymentPercent?: string;
  showPrepayment?: boolean;
  prepaymentStatus?: "pending" | "confirmed" | "canceled" | "invalid";
  responseStatus?: "suggestion_for_change" | "overdue_response";
  paymentMethod?: "online" | "offline";
  lateCancellationFeePercent?: string;
  showLateCancellation?: boolean;
  internalNote?: string;
  showInternalNote?: boolean;
  totalDiscount?: {
    type: "fixed" | "percentage";
    amount: number;
  } | null;
  kilometerAllowance?: {
    eurPerKm: string;
    totalKilometer: string;
  };
  showKilometerAllowance?: boolean;
  /** incoming = client sent request; outgoing = professional sent request */
  requestDirection?: "incoming" | "outgoing";
  /** Baseline services from the client — used to detect professional edits */
  originalServices?: CalendarBookingServiceItem[];
  /** Service ids edited by the professional before sending EBR */
  editedServiceIds?: string[];
  /** Service ids edited by the client when returning an EBR */
  clientEditedServiceIds?: string[];
  /** Who last edited before the current negotiation round */
  lastEditedBy?: "professional" | "client";
};

export type CalendarResource = {
  id: string;
  name: string;
  avatarText: string;
};

export type CalendarEvent = {
  id: string;
  bookingCode?: string;
  resourceId: string;
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  title: string;
  status: CalendarBookingStatus;
  location: CalendarBookingLocation;
  bookingType?: CalendarBookingType;
  /** Online booking scenario indicator (BR, EBR, ER, E). */
  bookingScenario?: CalendarBookingScenario;
  showClientName?: string;
  details?: CalendarBookingDetails;
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

export type TeamScheduleTimeRange = {
  start: string;
  end: string;
};

export type TeamScheduleAvailabilityEntry = {
  id: string;
  resourceId: string;
  location: CalendarBookingLocation;
  dateFrom: string;
  dateTo: string;
  dayFrom: string;
  dayTo: string;
  times: readonly TeamScheduleTimeRange[];
  bookedDates?: readonly string[];
  archived?: boolean;
};

export type TeamScheduleBlockedEntry = {
  id: string;
  resourceId: string;
  activity: string;
  dateFrom: string;
  dateTo: string;
  dayFrom: string;
  dayTo: string;
  times: readonly TeamScheduleTimeRange[];
  archived?: boolean;
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
  scheduleAvailability: readonly TeamScheduleAvailabilityEntry[];
  scheduleBlocked: readonly TeamScheduleBlockedEntry[];
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
  subTabs: ["Overview", "Schedule", "Settings"],
  initialSubTab: "Overview",
  initialView: "day",
  initialDate: "",
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
  timeGrid: { startHour: 8, endHour: 22, stepMinutes: 15 },
  events: [
    // Today's mock activities
    {
      id: "b-61201-a-accepted",
      bookingCode: "34011",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "10:00",
      end: "10:30",
      title: "Hot stone full body massage",
      status: "Confirmed",
      location: "FL",
      bookingType: "Requests",
      bookingScenario: "BR",
      showClientName: "Mia R",
      details: {
        clientEmail: "mia.r@example.com",
        services: [{ id: "svc-hot-stone", name: "Hot stone full body massage", durationMins: 30, price: 165 }],
        phoneCode: "+31",
        phoneNumber: "698765432",
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "confirmed",
      },
    },
    {
      id: "b-61201-a-rejected",
      bookingCode: "34012",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "11:00",
      end: "11:30",
      title: "Hot stone full body massage",
      status: "Invalid",
      location: "FL",
      bookingType: "Requests",
      bookingScenario: "BR",
      showClientName: "Sara Johnson",
      details: {
        clientEmail: "sarajohnson@gmail.com",
        requestDirection: "incoming",
        services: [{ id: "svc-hot-stone", name: "Hot stone full body massage", durationMins: 30, price: 165 }],
        phoneCode: "+31",
        phoneNumber: "612345679",
      },
    },
    {
      id: "b-61201-a",
      bookingCode: "34009",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "08:00",
      end: "08:30",
      title: "Hot stone full body massage",
      status: "Requested",
      location: "FL",
      bookingType: "Requests",
      bookingScenario: "BR",
      showClientName: "Lissa J",
      details: {
        clientEmail: "lissa.j@example.com",
        requestDirection: "incoming",
        originalServices: [
          { id: "svc-hot-stone", name: "Hot stone full body massage", durationMins: 30, price: 165 },
        ],
        services: [
          { id: "svc-hot-stone", name: "Hot stone full body massage", durationMins: 30, price: 165 },
        ],
        phoneCode: "+31",
        phoneNumber: "612345678",
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "pending",
        showLateCancellation: true,
        lateCancellationFeePercent: "100",
        internalNote: "Client requested extra focus on shoulders.",
        showInternalNote: true,
      },
    },
    {
      id: "b-61201-b",
      bookingCode: "34009",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "08:30",
      end: "08:45",
      title: "Hair Cut",
      status: "Cancelled",
      location: "FL",
      bookingType: "Offline",
      showClientName: "Lissa J",
      details: {
        clientEmail: "lissa.j@example.com",
        services: [{ id: "svc-hair-cut", name: "Hair Cut", durationMins: 15, price: 45 }],
        phoneCode: "+31",
        phoneNumber: "612345678",
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "canceled",
      },
    },
    {
      id: "b-61201-c",
      bookingCode: "34009",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "09:00",
      end: "09:15",
      title: "Hair Cut",
      status: "Confirmed",
      location: "DL",
      bookingType: "Online",
      bookingScenario: "ER",
      showClientName: "Lissa J",
      details: {
        clientEmail: "lissa.j@example.com",
        services: [{ id: "svc-hair-cut", name: "Hair Cut", durationMins: 15, price: 45 }],
        phoneCode: "+31",
        phoneNumber: "612345678",
        desiredLocation: {
          street: "Keizersgracht",
          number: "123",
          postalCode: "1015 CJ",
          province: "North Holland",
          municipality: "Amsterdam",
        },
        showPrepayment: true,
        prepaymentPercent: "50",
        prepaymentStatus: "confirmed",
        responseStatus: "overdue_response",
        paymentMethod: "online",
      },
    },
    {
      id: "b-61201-d",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "09:15",
      end: "09:30",
      title: "Hair Cut",
      status: "Completed",
      location: "DL",
      bookingType: "Project",
      showClientName: "Lissa J",
    },
    {
      id: "b-61201-e",
      resourceId: "r-1",
      date: "2026-06-12",
      start: "09:30",
      end: "09:45",
      title: "Hair Cut",
      status: "No Show",
      location: "DL",
      bookingType: "Offline",
      showClientName: "Lissa J",
    },
    {
      id: "b-61202-a",
      resourceId: "r-2",
      date: "2026-06-12",
      start: "09:00",
      end: "09:30",
      title: "Make-up",
      status: "Confirmed",
      location: "FL",
      bookingType: "Online",
      showClientName: "Ava K",
    },
    {
      id: "b-61203-a",
      bookingCode: "55002",
      resourceId: "r-3",
      date: "2026-06-12",
      start: "08:30",
      end: "09:00",
      title: "Lashes",
      status: "Completed",
      location: "FL",
      bookingType: "Project",
      showClientName: "Emma S",
      details: {
        clientEmail: "emma.s@example.com",
        services: [{ id: "svc-lashes", name: "Lashes", durationMins: 30, price: 85 }],
        phoneCode: "+31",
        phoneNumber: "698765432",
      },
    },
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
      bookingScenario: "EBR",
      showClientName: "Noah P",
      details: {
        requestDirection: "incoming",
        lastEditedBy: "client",
        showPrepayment: true,
        prepaymentPercent: "30",
        prepaymentStatus: "pending",
        responseStatus: "suggestion_for_change",
        originalServices: [
          { id: "svc-brow-shaping", name: "Brow shaping", durationMins: 15, price: 35, startTime: "08:30", endTime: "08:45" },
        ],
        services: [
          { id: "svc-brow-shaping", name: "Brow shaping", durationMins: 20, price: 40, startTime: "08:30", endTime: "08:50" },
        ],
        clientEditedServiceIds: ["svc-brow-shaping"],
      },
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
      bookingScenario: "BR",
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
      bookingScenario: "BR",
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
    { id: "blk-today-1", resourceId: "r-1", date: "2026-06-12", start: "08:45", end: "09:00", title: "Lunch Break", kind: "break" },
    { id: "blk-today-2", resourceId: "r-2", date: "2026-06-12", start: "08:00", end: "09:00", title: "Unavailable", kind: "unavailable" },
    { id: "blk-today-3", resourceId: "r-3", date: "2026-06-12", start: "09:00", end: "09:15", title: "Break", kind: "break" },
    { id: "blk-apr-1", resourceId: "r-1", date: "2026-04-15", start: "08:45", end: "09:00", title: "Break", kind: "break" },
    { id: "blk-apr-2", resourceId: "r-2", date: "2026-04-18", start: "08:00", end: "08:45", title: "Unavailable", kind: "unavailable" },
    { id: "blk-apr-3", resourceId: "r-3", date: "2026-04-22", start: "08:30", end: "09:00", title: "Training", kind: "break" },
    { id: "blk-apr-4", resourceId: "r-2", date: "2026-04-30", start: "09:15", end: "09:30", title: "Break", kind: "break" },
    { id: "blk-1", resourceId: "r-1", date: "2022-05-27", start: "08:45", end: "09:00", title: "Lunch Break", kind: "break" },
    { id: "blk-2", resourceId: "r-2", date: "2022-05-27", start: "08:00", end: "09:00", title: "Unavailable", kind: "unavailable" },
    { id: "blk-3", resourceId: "r-3", date: "2022-05-27", start: "09:00", end: "09:15", title: "Break", kind: "break" },
  ],
  scheduleAvailability: [
    {
      id: "avail-1",
      resourceId: "r-1",
      location: "FL",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Fri",
      times: [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "18:00" },
        { start: "13:00", end: "18:00" },
      ],
      bookedDates: ["2025-01-02", "2025-01-02", "2025-01-02", "2025-01-02"],
    },
    {
      id: "avail-2",
      resourceId: "r-1",
      location: "DL",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Fri",
      times: [{ start: "13:00", end: "17:00" }],
    },
    {
      id: "avail-3",
      resourceId: "r-2",
      location: "FL",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Sat",
      times: [{ start: "08:00", end: "16:00" }],
    },
    {
      id: "avail-archived",
      resourceId: "r-1",
      location: "FL",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Fri",
      times: [{ start: "10:00", end: "14:00" }],
      archived: true,
    },
  ],
  scheduleBlocked: [
    {
      id: "blocked-1",
      resourceId: "r-1",
      activity: "ABC",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Fri",
      times: [{ start: "09:00", end: "12:00" }],
    },
    {
      id: "blocked-2",
      resourceId: "r-1",
      activity: "ABC",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Fri",
      times: [{ start: "13:00", end: "17:00" }],
    },
    {
      id: "blocked-3",
      resourceId: "r-2",
      activity: "Training",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Wed",
      dayTo: "Wed",
      times: [{ start: "14:00", end: "16:00" }],
    },
    {
      id: "blocked-archived",
      resourceId: "r-1",
      activity: "Holiday",
      dateFrom: "2020-01-01",
      dateTo: "2030-12-31",
      dayFrom: "Mon",
      dayTo: "Sun",
      times: [{ start: "00:00", end: "23:59" }],
      archived: true,
    },
  ],
};
