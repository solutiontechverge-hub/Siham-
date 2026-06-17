import type { ClientRecord } from "../../../app/professionals/fixed-location/client/data/clientList";
import type { ApiProfessionalClient } from "../../../store/services/businessApi";

export function mapApiProfessionalClientToRecord(row: ApiProfessionalClient): ClientRecord {
  const tags: ClientRecord["tags"] = [];
  if (row.is_mollure) tags.push("Mollure");
  if (row.client_kind === "company") tags.push("CC");

  return {
    id: row.id,
    name: row.display_name,
    email: row.email,
    phone: row.phone ?? "—",
    totalSales: row.total_sales_label ?? `€${row.total_sales}`,
    lastBooking: row.last_booking_label ?? "—",
    tags,
    kind: row.client_kind,
    addedOn: row.added_on,
    detailEmail: row.detail_email ?? undefined,
    legalName: row.legal_name ?? undefined,
    coc: row.coc ?? undefined,
    vat: row.vat ?? undefined,
    contactPersonName: row.contact_person_name ?? undefined,
    gender: row.gender ?? undefined,
    businessAddress: row.business_address ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    residentialAddress: row.residential_address ?? undefined,
    bookingsCompleted: row.bookings_completed,
    averageBookingValue: row.average_booking_value_label ?? `€${row.average_booking_value}`,
    statsLastBooking: row.stats_last_booking,
    recentServices: row.recent_services ?? [],
    bookingHistory: row.booking_history ?? [],
    isBlocked: row.is_blocked,
    hasNoShow: row.has_no_show,
    technicalNote: row.technical_note ?? undefined,
  };
}
