export type BookingActivityActor = "client" | "professional" | "guest" | "system";

export type BookingActivityKind =
  | "booking_created"
  | "booking_request_sent"
  | "booking_accepted"
  | "booking_confirmed"
  | "booking_in_progress"
  | "booking_completed"
  | "booking_prepaid"
  | "edit_request_sent"
  | "edit_request_suggest"
  | "edit_request_accepted"
  | "booking_cancelled"
  | "booking_updated"
  | "post_booking_paid"
  | "fee_paid"
  | "addon_paid"
  | "refund_completed";

export type BookingActivityDetailType = "cancellation" | "ebr" | "comparison";

export type BookingActivityDetailLine = {
  label: string;
  value: string;
};

export type BookingActivityItem = {
  id: string;
  bookingId: string;
  bookingCode?: string;
  kind: BookingActivityKind;
  actor: BookingActivityActor;
  actorLabel: string;
  title: string;
  subtitle?: string;
  occurredAt: string; // ISO
  dateLabel: string;
  timeLabel: string;
  /**
   * Arrow for Edit Request sent, silent Updated, or cancelled bookings that include a client reason.
   * Simple cancels (no reason) have no arrow.
   */
  hasDetailArrow: boolean;
  detailType?: BookingActivityDetailType;
  detailLines?: BookingActivityDetailLine[];
  /** Before/after field comparison for EBR, ER, or silent Updated. */
  comparison?: import("./buildActivityComparison").ActivityComparison | null;
  /** Cancellation reason when client provided one */
  cancellationReason?: string;
  professionalName?: string;
};

export type BookingActivityApiEvent = {
  id: string;
  bookingId?: string | null;
  bookingCode?: string | null;
  kind: string;
  /** Server action contract (mirrors kind). */
  action_type?: string;
  actionType?: string;
  title: string;
  actor?: string;
  actor_role?: string;
  actorRole?: string;
  user_id?: string | null;
  userId?: string | null;
  actorLabel?: string | null;
  subtitle?: string | null;
  payload?: Record<string, unknown> | null;
  occurredAt: string;
};

export type BookingActivityBuildInput = {
  bookings: Array<{
    id: string;
    unique_code?: string | null;
    status: string;
    prepayment_status?: string | null;
    total_price?: string | number | null;
    booking_type?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    client_name?: string | null;
    service_title?: string | null;
    team_member_name?: string | null;
    business_name?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    booking_date?: string | null;
    start_time?: string | null;
  }>;
  clientEmail?: string | null;
  clientName?: string | null;
  currentBookingId?: string | null;
  currentBookingCode?: string | null;
  /** Current drawer event scenario when viewing an open booking */
  currentScenario?: "BR" | "EBR" | "ER" | "E" | null;
  currentStatus?: string | null;
  currentCancellationReason?: string | null;
  currentProfessionalName?: string | null;
  currentBookingType?: string | null;
  /** Freshest details from the open drawer (preferred over notes alone). */
  currentDetails?: {
    originalServices?: Array<{
      id: string;
      name: string;
      price: number;
      durationMins?: number;
      startTime?: string;
      endTime?: string;
      teamMemberName?: string | null;
      staffResourceId?: string | null;
      guestId?: string | null;
    }> | null;
    originalGuests?: Array<{
      id?: string;
      name?: string | null;
      participantType?: "guest" | "model" | "planning" | "buffer" | "notes";
      services?: Array<{
        id: string;
        name: string;
        price: number;
        durationMins?: number;
        startTime?: string;
        endTime?: string;
        guestId?: string | null;
      }> | null;
    }> | null;
    services?: Array<{
      id: string;
      name: string;
      price: number;
      durationMins?: number;
      startTime?: string;
      endTime?: string;
      teamMemberName?: string | null;
      staffResourceId?: string | null;
      guestId?: string | null;
    }> | null;
    products?: Array<{
      id: string;
      name: string;
      price: number;
      quantity?: number;
    }> | null;
    editedServiceIds?: string[] | null;
    clientEditedServiceIds?: string[] | null;
    editedProductIds?: string[] | null;
    addedServiceIds?: string[] | null;
    cancelledServiceIds?: string[] | null;
    phoneCode?: string | null;
    phoneNumber?: string | null;
    guests?: Array<{
      id?: string;
      name?: string | null;
      participantType?: "guest" | "model" | "planning" | "buffer" | "notes";
      services?: Array<{
        id: string;
        name: string;
        price: number;
        durationMins?: number;
        startTime?: string;
        endTime?: string;
        guestId?: string | null;
      }> | null;
    }> | null;
    clientSnapshot?: {
      people?: Array<{
        id?: string;
        name?: string;
        email?: string;
        phoneCode?: string;
        phoneNumber?: string;
        isRequester?: boolean;
        participantType?: "guest" | "model" | "planning" | "buffer" | "notes";
      }> | null;
      services?: Array<{
        id: string;
        name: string;
        price: number;
        durationMins?: number;
        startTime?: string;
        endTime?: string;
        guestId?: string | null;
        teamMemberName?: string | null;
      }> | null;
    } | null;
    desiredLocation?: string | {
      street?: string;
      number?: string;
      postalCode?: string;
      province?: string;
      municipality?: string;
    } | null;
    silentUpdated?: boolean;
    silentUpdateSnapshot?: {
      phoneCode?: string | null;
      phoneNumber?: string | null;
      guests?: Array<{
        id?: string;
        name?: string | null;
        email?: string | null;
        phoneCode?: string | null;
        phoneNumber?: string | null;
        participantType?: "guest" | "model" | "planning" | "buffer" | "notes";
        services?: Array<{
          id: string;
          name: string;
          price: number;
          durationMins?: number;
          startTime?: string;
          endTime?: string;
          guestId?: string | null;
        }> | null;
      }> | null;
      services?: Array<{
        id: string;
        name: string;
        price: number;
        durationMins?: number;
        startTime?: string;
        endTime?: string;
        guestId?: string | null;
      }> | null;
      products?: Array<{
        id: string;
        name: string;
        price: number;
        quantity?: number;
      }> | null;
      people?: Array<{
        id?: string;
        name?: string;
        email?: string;
        phoneCode?: string;
        phoneNumber?: string;
        isRequester?: boolean;
        participantType?: "guest" | "model" | "planning" | "buffer" | "notes";
      }> | null;
      desiredLocation?: string | {
        street?: string;
        number?: string;
        postalCode?: string;
        province?: string;
        municipality?: string;
      } | null;
    } | null;
    lastEditedBy?: "professional" | "client" | null;
    scheduleEdited?: boolean;
  } | null;
  currentDateISO?: string | null;
  currentStart?: string | null;
  /**
   * Persisted API events. When non-null (including []), timeline is server-driven —
   * no browser synthesis / localStorage invent. Null = legacy synthesize path.
   */
  apiEvents?: BookingActivityApiEvent[] | null;
  mode: "activity" | "sales";
};
