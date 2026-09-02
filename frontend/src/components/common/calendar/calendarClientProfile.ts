import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { ApiProfessionalClient } from "../../../store/services/businessApi";

export const CALENDAR_CLIENT_NOT_IN_LIST_COPY =
  "Not yet added to your Client List — profile unavailable";

export type CalendarClientIdentity = {
  name?: string;
  email?: string;
  customerId?: string | null;
  clientKind?: "individual" | "company";
  phone?: string;
};

export function identityFromCalendarEvent(
  event: CalendarEvent,
): CalendarClientIdentity {
  const phone = [event.details?.phoneCode, event.details?.phoneNumber]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return {
    name: event.showClientName,
    email: event.details?.clientEmail,
    customerId: event.details?.customerId ?? null,
    clientKind: event.clientKind ?? event.details?.clientKind,
    phone: phone || undefined,
  };
}

export function findListedProfessionalClient(
  identity: CalendarClientIdentity,
  clients: readonly ApiProfessionalClient[],
): ApiProfessionalClient | undefined {
  const email = identity.email?.trim().toLowerCase();
  const customerId = String(identity.customerId ?? "").trim();
  return clients.find((client) => {
    if (
      customerId &&
      client.mollure_user_id &&
      String(client.mollure_user_id) === customerId
    ) {
      return true;
    }
    if (email && client.email.trim().toLowerCase() === email) {
      return true;
    }
    return false;
  });
}

export function canAddIdentityToClientList(
  identity: CalendarClientIdentity,
): { ok: true } | { ok: false; reason: string } {
  if (String(identity.customerId ?? "").trim()) return { ok: true };
  if (identity.email?.trim().includes("@")) return { ok: true };
  return {
    ok: false,
    reason: "An email address is required to add this client.",
  };
}

export function getAddToClientListDisabledReason(
  identity: CalendarClientIdentity,
): string | undefined {
  const result = canAddIdentityToClientList(identity);
  return result.ok ? undefined : result.reason;
}
export function splitDisplayName(name: string): {
  first_name: string;
  last_name: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Client", last_name: "-" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "-" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}
