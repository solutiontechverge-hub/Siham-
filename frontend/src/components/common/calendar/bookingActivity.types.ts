export type BookingActivityActor = "client" | "professional" | "guest" | "system";

export type BookingActivityKind =
  | "booking_request_sent"
  | "booking_accepted"
  | "booking_prepaid"
  | "edit_request_sent"
  | "edit_request_suggest"
  | "edit_request_accepted"
  | "booking_cancelled"
  | "post_booking_paid"
  | "fee_paid"
  | "addon_paid";

export type BookingActivityDetailType = "cancellation" | "ebr";

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
   * Arrow for Edit Request sent, or cancelled bookings that include a client reason.
   * Simple cancels (no reason) have no arrow.
   */
  hasDetailArrow: boolean;
  detailType?: BookingActivityDetailType;
  detailLines?: BookingActivityDetailLine[];
  /** Cancellation reason when client provided one */
  cancellationReason?: string;
  professionalName?: string;
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
  mode: "activity" | "sales";
};
