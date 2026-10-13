import type { BookingCatalogService } from "../../../../data/bookingServiceCatalog.data";
import type { BusinessPublicProfileDesiredLocation } from "../../../../data/businessPublicProfile.data";
import type { TemplateCategoryRow } from "../../../../lib/businessTemplateCatalog";
import type { ProfessionalFixedLocationCalendarData } from "../../../../app/professionals/fixed-location/calendar/calendar.data";
import type {
  BookingNotificationEvent,
  CalendarEntry,
  CreateCalendarEntryRequest,
  UpsertCalendarSettingsRequest,
} from "../../../../store/services/businessApi";
import type { CalendarQueryDateRange } from "../calendar.utils";
import type {
  ParsedCalendarSettings,
  ServiceOrderSettings,
} from "../calendar-settings.types";

export type ProfessionalFixedLocationCalendarProps = {
  data: ProfessionalFixedLocationCalendarData;
  calendarSettings?: ParsedCalendarSettings | null;
  serviceOptions?: string[];
  categoryOptions?: readonly { key: string; label: string }[];
  /** Business Template category rows (categories that have ≥1 service). */
  templateCategoryRows?: readonly TemplateCategoryRow[];
  /** Exact service title → template category key for appearance colouring. */
  serviceNameToCategoryKey?: Readonly<Record<string, string>>;
  serviceCatalog?: readonly BookingCatalogService[];
  serviceOrderDefaults?: ServiceOrderSettings;
  fixedLocationAddress?: string;
  lateRescheduleFeePercentDefault?: string;
  lateCancellationFeePercentDefault?: string;
  noShowFeePercentDefault?: string;
  prepaymentPercentDefault?: string;
  kilometerAllowanceEurPerKmDefault?: string;
  appointmentBeforeHours?: number | null;
  appointmentBeforeMinutes?: number | null;
  cancellationBeforeHours?: number | null;
  cancellationBeforeMinutes?: number | null;
  responseTimeHours?: number | null;
  responseTimeMinutes?: number | null;
  desiredLocationSetup?: BusinessPublicProfileDesiredLocation | null;
  clientOptions?: readonly {
    name: string;
    email: string;
    mollureUserId?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    clientKind?: "individual" | "company";
    isMollure?: boolean;
  }[];
  professionalClients?: import("../../../../store/services/businessApi").ApiProfessionalClient[];
  isSaving?: boolean;
  onCreateCalendarEntry?: (
    payload: CreateCalendarEntryRequest,
  ) => Promise<CalendarEntry | void>;
  onUpdateCalendarEntry?: (
    id: string,
    payload: Omit<CreateCalendarEntryRequest, never>,
  ) => Promise<CalendarEntry | void>;
  onSaveCalendarSettings?: (
    payload: UpsertCalendarSettingsRequest,
  ) => Promise<void>;
  onSyncServiceOrderToSetup?: (
    serviceOrder: ServiceOrderSettings,
  ) => Promise<void>;
  onDeleteCalendarEntry?: (id: string) => Promise<void>;
  onUpdateBookingStatus?: (
    id: string,
    status:
      | "requested"
      | "br_accepted"
      | "cancelled"
      | "completed"
      | "confirmed"
      | "in_progress"
      | "no_show"
      | "invalid",
    options?: {
      notification_event?: BookingNotificationEvent;
      notify_incoming_er?: boolean;
      initiated_by?: "client" | "professional";
      notes?: string | null;
      total_price?: number | null;
      booking_date?: string | null;
      start_time?: string | null;
      end_time?: string | null;
    },
  ) => Promise<void>;
  onDispatchBookingNotification?: (
    id: string,
    event: BookingNotificationEvent,
    options?: { initiated_by?: "client" | "professional"; message?: string },
  ) => Promise<void>;
  onUpdateCalendarEntryStatus?: (
    id: string,
    status:
      | "requested"
      | "cancelled"
      | "completed"
      | "confirmed"
      | "in_progress"
      | "no_show"
      | "invalid",
  ) => Promise<void>;
  onDateRangeChange?: (range: CalendarQueryDateRange) => void;
};

export type InlineGuestDraftState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
};

export type SlotBookingScreen =
  | "new-booking"
  | "add-client-choice"
  | "non-mollure-individual"
  | "non-mollure-company"
  | "guest"
  | "select-services"
  | "edit-service"
  | "select-products"
  | "select-unique-items"
  | "add-unique-item"
  | "add-buffer";
