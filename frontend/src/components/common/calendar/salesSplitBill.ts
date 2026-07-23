import type {
  CalendarBookingDetails,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { SalesLineItem } from "./salesOverview.types";

export type SalesPayerRole = "main_client" | "guest" | "model";

export type SalesPayerShare = {
  key: string;
  role: SalesPayerRole;
  /** Card heading label: client name, or "Guest" / "Model". */
  label: string;
  /** Real person name shown under Guest/Model label. */
  displayName: string;
  email?: string;
  phone?: string;
  lines: SalesLineItem[];
  subtotal: number;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isPlanningPerson(person: {
  participantType?: string;
  name?: string;
}): boolean {
  return person.participantType === "planning" || person.name?.trim() === "Planning";
}

/**
 * Resolve per-payer service lines for split billing (main client / guests / models).
 * Prefers clientSnapshot people+services; falls back to details.guests; else all lines on main client.
 */
export function resolveSalesPayerShares(input: {
  event: CalendarEvent;
  allLines: SalesLineItem[];
  mainClientName: string;
  mainClientEmail?: string;
  mainClientPhone?: string;
}): SalesPayerShare[] {
  const { event, allLines, mainClientName, mainClientEmail, mainClientPhone } = input;
  const details = event.details;
  const snapshot = details?.clientSnapshot;
  const people = snapshot?.people ?? [];
  const snapshotServices = snapshot?.services ?? [];

  const serviceLineById = new Map(allLines.map((line) => [line.id, line]));

  const lineFromService = (service: {
    id: string;
    name: string;
    price: number;
  }): SalesLineItem => {
    const existing = serviceLineById.get(service.id);
    if (existing) return existing;
    return { id: service.id, label: service.name, amount: roundMoney(service.price) };
  };

  if (people.length && snapshotServices.length) {
    const requester = people.find((p) => p.isRequester) ?? people[0];
    const groups = new Map<string, SalesLineItem[]>();

    for (const service of snapshotServices) {
      const assigneeId = service.guestId?.trim() || requester.id;
      const prev = groups.get(assigneeId) ?? [];
      prev.push(lineFromService(service));
      groups.set(assigneeId, prev);
    }

    // Unassigned / unknown guestId → main client
    const knownIds = new Set(people.map((p) => p.id));
    for (const [key, lines] of [...groups.entries()]) {
      if (key !== requester.id && !knownIds.has(key)) {
        const mainLines = groups.get(requester.id) ?? [];
        groups.set(requester.id, [...mainLines, ...lines]);
        groups.delete(key);
      }
    }

    // Products stay on main client
    const productLines = allLines.filter((line) => !snapshotServices.some((s) => s.id === line.id));
    if (productLines.length) {
      groups.set(requester.id, [...(groups.get(requester.id) ?? []), ...productLines]);
    }

    const shares: SalesPayerShare[] = [];
    let modelOrdinal = 0;
    let guestOrdinal = 0;

    for (const person of people) {
      if (isPlanningPerson(person)) continue;
      const lines = groups.get(person.id) ?? [];
      if (!lines.length && !person.isRequester) continue;

      const trimmed = person.name?.trim() ?? "";
      let role: SalesPayerRole = "guest";
      let label = "Guest";
      let displayName = trimmed || "Guest";

      if (person.isRequester || person.id === requester.id) {
        role = "main_client";
        label = mainClientName;
        displayName = mainClientName;
      } else if (person.participantType === "model") {
        role = "model";
        modelOrdinal += 1;
        label = "Model";
        displayName =
          trimmed && trimmed.toLowerCase() !== "model" ? trimmed : `Model ${modelOrdinal}`;
      } else {
        role = "guest";
        guestOrdinal += 1;
        label = "Guest";
        displayName =
          trimmed && trimmed.toLowerCase() !== "guest" ? trimmed : `Guest ${guestOrdinal}`;
      }

      const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
      if (!lines.length && role !== "main_client") continue;

      shares.push({
        key: person.id,
        role,
        label,
        displayName,
        email: role === "main_client" ? mainClientEmail : undefined,
        phone: role === "main_client" ? mainClientPhone : undefined,
        lines,
        subtotal,
      });
    }

    if (shares.some((s) => s.role === "main_client")) return shares;
  }

  // Legacy guests[] on booking details
  const guests = details?.guests ?? [];
  if (guests.length) {
    const assignedIds = new Set<string>();
    const guestShares: SalesPayerShare[] = [];
    let modelOrdinal = 0;
    let guestOrdinal = 0;

    for (const guest of guests) {
      const lines: SalesLineItem[] = [
        ...(guest.services ?? []).map((s) => lineFromService(s)),
        ...(guest.products ?? []).map((p) => ({
          id: p.id,
          label: p.quantity > 1 ? `${p.name} ×${p.quantity}` : p.name,
          amount: roundMoney(p.price),
        })),
      ];
      for (const line of lines) assignedIds.add(line.id);
      if (!lines.length) continue;

      const trimmed = guest.name?.trim() ?? "";
      const isModel = guest.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;

      guestShares.push({
        key: guest.id,
        role: isModel ? "model" : "guest",
        label: isModel ? "Model" : "Guest",
        displayName: isModel
          ? trimmed && trimmed.toLowerCase() !== "model"
            ? trimmed
            : `Model ${modelOrdinal}`
          : trimmed && trimmed.toLowerCase() !== "guest"
            ? trimmed
            : `Guest ${guestOrdinal}`,
        lines,
        subtotal: roundMoney(lines.reduce((sum, line) => sum + line.amount, 0)),
      });
    }

    const mainLines = allLines.filter((line) => !assignedIds.has(line.id));
    return [
      {
        key: "main-client",
        role: "main_client",
        label: mainClientName,
        displayName: mainClientName,
        email: mainClientEmail,
        phone: mainClientPhone,
        lines: mainLines.length ? mainLines : allLines,
        subtotal: roundMoney(
          (mainLines.length ? mainLines : allLines).reduce((sum, line) => sum + line.amount, 0),
        ),
      },
      ...guestShares,
    ];
  }

  return [
    {
      key: "main-client",
      role: "main_client",
      label: mainClientName,
      displayName: mainClientName,
      email: mainClientEmail,
      phone: mainClientPhone,
      lines: allLines,
      subtotal: roundMoney(allLines.reduce((sum, line) => sum + line.amount, 0)),
    },
  ];
}

export function buildSplitPaymentAmounts(input: {
  shares: SalesPayerShare[];
  prepaidAmount: number;
}): Array<SalesPayerShare & { paymentAmount: number }> {
  const { shares, prepaidAmount } = input;
  return shares.map((share) => {
    if (share.role === "main_client") {
      return {
        ...share,
        paymentAmount: roundMoney(Math.max(0, share.subtotal - prepaidAmount)),
      };
    }
    return {
      ...share,
      paymentAmount: roundMoney(Math.max(0, share.subtotal)),
    };
  });
}

/** Serialize split payers into booking notes meta for finance sync / persistence. */
export function buildSplitBillNotesPatch(
  details: CalendarBookingDetails | undefined,
  shares: Array<SalesPayerShare & { paymentAmount: number }>,
  prepaidAmount: number,
): Record<string, unknown> {
  return {
    splitBill: {
      prepaidAmount,
      prepaidBy: "main_client",
      payers: shares.map((share) => ({
        key: share.key,
        role: share.role,
        label: share.label,
        displayName: share.displayName,
        subtotal: share.subtotal,
        paymentAmount: share.paymentAmount,
        lineIds: share.lines.map((line) => line.id),
      })),
    },
    ...(details?.clientSnapshot ? { clientSnapshot: details.clientSnapshot } : {}),
    ...(details?.guests?.length ? { guests: details.guests } : {}),
  };
}
