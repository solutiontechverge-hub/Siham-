export type CalendarSubTab = "Overview" | "Schedule" | "Settings";
export type CalendarViewMode = "day" | "week" | "month";

export type CalendarBookingStatus =
  | "Requested"
  | "Cancelled"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "No Show"
  | "Invalid";

export type CalendarBookingLocation = "FL" | "DL";

export type CalendarBookingType = "Online" | "Offline" | "Project";

export type CalendarBookingScenario = "BR" | "EBR" | "ER" | "E";

export type CalendarLineDiscount = {
  type: "fixed" | "percentage";
  amount: number;
};

export type CalendarBookingServiceItem = {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  staffResourceId?: string;
  guestId?: string | null;
  teamMemberId?: string | null;
  teamMemberName?: string | null;
  priceType?: "fixed" | "starting_from";
  discount?: CalendarLineDiscount | null;
  originalPrice?: number;
  discountPct?: number;
};

export type CalendarBookingProductItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: CalendarLineDiscount | null;
};

export type CalendarBookingGuestItem = {
  id: string;
  name: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  services: CalendarBookingServiceItem[];
  products: CalendarBookingProductItem[];
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
  planningActivity?: string;
  planningDuration?: string;
  bufferTeamMemberId?: string;
  bufferEndTime?: string;
};

export type CalendarBookingClientSnapshot = {
  people?: Array<{
    id: string;
    name: string;
    email?: string;
    phoneCode?: string;
    phoneNumber?: string;
    isRequester?: boolean;
    participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
    planningActivity?: string;
    planningDuration?: string;
    planningIsLocked?: boolean;
    bufferTeamMemberId?: string;
    bufferEndTime?: string;
  }>;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    durationMins: number;
    guestId?: string | null;
    teamMemberId?: string | null;
    teamMemberName?: string | null;
    originalPrice?: number;
    discountPct?: number;
    discount?: CalendarLineDiscount | null;
  }>;
  projectDetails?: {
    description: string;
    uploads: Array<{
      id: string;
      name: string;
      url?: string;
      mimeType?: string;
      kind?: "image" | "document";
      previewUrl?: string;
    }>;
  };
  teamMembers?: Array<{ id: string; name: string }>;
};

export type CalendarBookingDetails = {
  clientEmail?: string;
  /** Booking customer user id — used to match Mollure clients in Client List. */
  customerId?: string | null;
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
  /** Desired-location project + people snapshot from client booking request. */
  clientSnapshot?: CalendarBookingClientSnapshot;
  prepaymentPercent?: string;
  showPrepayment?: boolean;
  prepaymentStatus?: "pending" | "confirmed" | "canceled" | "invalid";
  responseStatus?: "suggestion_for_change" | "overdue_response";
  /** When the current negotiation response window started (ISO). */
  responseStartedAt?: string;
  /** Deadline for the counterparty to respond (ISO). */
  respondBy?: string;
  /** Response window length in minutes (from business setup at send time). */
  responseWindowMinutes?: number;
  paymentMethod?: "online" | "offline";
  lateCancellationFeePercent?: string;
  showLateCancellation?: boolean;
  /** Policy ceiling at the moment the late-cancel section was enabled (decrease-only). */
  lateCancellationFeePercentCeiling?: string;
  lateRescheduleFeePercent?: string;
  showLateRescheduling?: boolean;
  /** Policy ceiling when late-reschedule section was enabled (decrease-only). */
  lateRescheduleFeePercentCeiling?: string;
  noShowFeePercent?: string;
  showNoShowFee?: boolean;
  /** Policy ceiling when no-show fee section was enabled (decrease-only). */
  noShowFeePercentCeiling?: string;
  /** ISO timestamp when a cancellation fee was attached / invoiced. */
  cancellationFeeAt?: string;
  /** Whether cancel exceeded the business-template notice window. */
  exceededCancellationWindow?: boolean;
  internalNote?: string;
  showInternalNote?: boolean;
  /** Note written by the client on the original booking request. */
  clientNote?: string;
  /** Client-provided reason when cancelling; enables Activity detail arrow */
  cancellationReason?: string;
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
  /** Product ids edited by the professional (BR update / EBR) */
  editedProductIds?: string[];
  /** Service ids edited by the client when returning an EBR */
  clientEditedServiceIds?: string[];
  /** Who last edited before the current negotiation round */
  lastEditedBy?: "professional" | "client";
  /** Incoming Confirmed ER note (receiver UI). */
  editRequestNote?: string;
  editRequestInitiatedBy?: "professional" | "client";
  /** Keep BR/EBR/ER/E visible until the counterparty taps OK. */
  needsOk?: boolean;
  /** Scenario to show while needsOk is true (status may already be Confirmed). */
  ackScenario?: CalendarBookingScenario;
  /** Soft-delete: hide from professional calendar without changing status. */
  hiddenForProfessional?: boolean;
  /** Soft-delete: hide from client booking list without changing status. */
  hiddenForCustomer?: boolean;
  /** Company client (CC) vs individual — used for professional-end CC tag. */
  clientKind?: "individual" | "company";
  /**
   * Walk-in guest booking: name/phone live on the calendar entry only.
   * Never upsert a professional_clients row for this person.
   */
  isGuest?: boolean;
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  /** Guest name / contact-only change — tag Updated, do not start ER. */
  silentUpdated?: boolean;
  /**
   * Prior contact/guest values captured when a silent update is saved,
   * so Activity can show original → new comparison lines.
   */
  silentUpdateSnapshot?: {
    phoneCode?: string;
    phoneNumber?: string;
    guests?: CalendarBookingGuestItem[];
    desiredLocation?: {
      street: string;
      number: string;
      postalCode: string;
      province: string;
      municipality: string;
    };
  };
  /** Date/time changed on a Confirmed booking after ER/EBR accept. */
  scheduleEdited?: boolean;
  refunded?: boolean;
  waitingForPayment?: boolean;
  invoiceDueDate?: string;
  splitBill?: Record<string, unknown>;
};

export type CalendarResource = {
  id: string;
  name: string;
  avatarText: string;
  photoSrc?: string;
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
  /** Raw booking notes (includes mollure EBR meta) for accept/reject apply. */
  notes?: string | null;
  /** Server updated_at for unseen-update indicators. */
  updatedAt?: string | null;
  showClientName?: string;
  details?: CalendarBookingDetails;
  /** Company client (CC) vs individual — shown as CC tag on professional calendar. */
  clientKind?: "individual" | "company";
};

/** In-app chat is only available for linked Mollure clients. */
export function calendarEventCanChat(
  event?: Pick<CalendarEvent, "details"> | null,
): boolean {
  return Boolean(String(event?.details?.customerId ?? "").trim());
}

/** Guest-only walk-in: no Client List record, even when an optional email is stored. */
export function calendarEventIsGuest(
  event?: Pick<CalendarEvent, "bookingType" | "details"> | null,
): boolean {
  if (!event) return false;
  if (event.details?.isGuest) return true;
  if (String(event.details?.customerId ?? "").trim()) return false;
  return (
    event.bookingType === "Offline" &&
    !String(event.details?.clientEmail ?? "").trim()
  );
}

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
