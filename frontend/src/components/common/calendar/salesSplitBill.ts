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

function sumLines(lines: SalesLineItem[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
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

  const serviceLineById = new Map(allLines.map((line) => [String(line.id), line]));

  const lineFromService = (service: {
    id: string;
    name: string;
    price: number;
  }): SalesLineItem => {
    const existing = serviceLineById.get(String(service.id));
    if (existing) return existing;
    return { id: String(service.id), label: service.name, amount: roundMoney(service.price) };
  };

  if (people.length && snapshotServices.length) {
    const requester = people.find((p) => p.isRequester) ?? people[0];
    const requesterId = String(requester.id);
    const peopleById = new Map(people.map((p) => [String(p.id), p]));
    const groups = new Map<string, SalesLineItem[]>();

    for (const service of snapshotServices) {
      const rawGuestId =
        service.guestId != null && String(service.guestId).trim() !== ""
          ? String(service.guestId).trim()
          : "";
      // Keep guest/model assignee ids even if that person row is briefly missing —
      // never fold those lines into the main client.
      const assigneeId = rawGuestId || requesterId;
      const prev = groups.get(assigneeId) ?? [];
      prev.push(lineFromService(service));
      groups.set(assigneeId, prev);
    }

    // Products stay on main client
    const productLines = allLines.filter(
      (line) => !snapshotServices.some((s) => String(s.id) === String(line.id)),
    );
    if (productLines.length) {
      groups.set(requesterId, [...(groups.get(requesterId) ?? []), ...productLines]);
    }

    const shares: SalesPayerShare[] = [];
    const usedKeys = new Set<string>();
    let modelOrdinal = 0;
    let guestOrdinal = 0;

    for (const person of people) {
      if (isPlanningPerson(person)) continue;
      const personId = String(person.id);
      const lines = groups.get(personId) ?? [];

      let role: SalesPayerRole = "guest";
      let label = "Guest";
      const trimmed = person.name?.trim() ?? "";
      let displayName = trimmed || "Guest";

      if (person.isRequester || personId === requesterId) {
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

      // Guests/models with no assigned services are skipped; main client always kept.
      if (!lines.length && role !== "main_client") continue;

      usedKeys.add(personId);
      shares.push({
        key: personId,
        role,
        label,
        displayName,
        email: role === "main_client" ? mainClientEmail : undefined,
        phone: role === "main_client" ? mainClientPhone : undefined,
        lines,
        subtotal: sumLines(lines),
      });
    }

    // Orphan assignee ids (services still tagged to a guest/model id) → own sub-card
    for (const [key, lines] of groups.entries()) {
      if (usedKeys.has(key) || !lines.length) continue;
      if (key === requesterId) {
        if (!shares.some((s) => s.role === "main_client")) {
          shares.unshift({
            key: requesterId,
            role: "main_client",
            label: mainClientName,
            displayName: mainClientName,
            email: mainClientEmail,
            phone: mainClientPhone,
            lines,
            subtotal: sumLines(lines),
          });
          usedKeys.add(requesterId);
        }
        continue;
      }

      const person = peopleById.get(key);
      const isModel = person?.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;
      const trimmed = person?.name?.trim() ?? "";
      shares.push({
        key,
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
        subtotal: sumLines(lines),
      });
      usedKeys.add(key);
    }

    // Legacy details.guests[] not already represented
    for (const guest of details?.guests ?? []) {
      const guestId = String(guest.id);
      if (usedKeys.has(guestId)) continue;
      const lines: SalesLineItem[] = [
        ...(guest.services ?? []).map((s) => lineFromService(s)),
        ...(guest.products ?? []).map((p) => ({
          id: String(p.id),
          label: p.quantity > 1 ? `${p.name} ×${p.quantity}` : p.name,
          amount: roundMoney(p.price),
        })),
      ];
      if (!lines.length) continue;

      const trimmed = guest.name?.trim() ?? "";
      const isModel = guest.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;

      shares.push({
        key: guestId,
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
        subtotal: sumLines(lines),
      });
      usedKeys.add(guestId);
    }

    if (!shares.some((s) => s.role === "main_client")) {
      const mainLines = groups.get(requesterId) ?? allLines;
      shares.unshift({
        key: requesterId,
        role: "main_client",
        label: mainClientName,
        displayName: mainClientName,
        email: mainClientEmail,
        phone: mainClientPhone,
        lines: mainLines,
        subtotal: sumLines(mainLines),
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
          id: String(p.id),
          label: p.quantity > 1 ? `${p.name} ×${p.quantity}` : p.name,
          amount: roundMoney(p.price),
        })),
      ];
      for (const line of lines) assignedIds.add(String(line.id));
      if (!lines.length) continue;

      const trimmed = guest.name?.trim() ?? "";
      const isModel = guest.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;

      guestShares.push({
        key: String(guest.id),
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
        subtotal: sumLines(lines),
      });
    }

    const mainLines = allLines.filter((line) => !assignedIds.has(String(line.id)));
    return [
      {
        key: "main-client",
        role: "main_client",
        label: mainClientName,
        displayName: mainClientName,
        email: mainClientEmail,
        phone: mainClientPhone,
        lines: mainLines.length ? mainLines : allLines,
        subtotal: sumLines(mainLines.length ? mainLines : allLines),
      },
      ...guestShares,
    ];
  }

  // Derive guest/model cards from snapshot people even when the snapshot services
  // branch above did not return (e.g. empty services array but people present).
  const snapshotPeople = snapshot?.people ?? [];
  const snapshotGuestPeople = snapshotPeople.filter(
    (p) => !p.isRequester && !isPlanningPerson(p),
  );
  if (snapshotGuestPeople.length && (snapshot?.services?.length || allLines.length)) {
    const requester = snapshotPeople.find((p) => p.isRequester) ?? snapshotPeople[0];
    const requesterId = requester ? String(requester.id) : "main-client";
    const services = snapshot?.services ?? [];
    let modelOrdinal = 0;
    let guestOrdinal = 0;
    const guestShares: SalesPayerShare[] = [];
    const assignedIds = new Set<string>();

    for (const person of snapshotGuestPeople) {
      const personId = String(person.id);
      const personServices = services.filter((s) => String(s.guestId ?? "") === personId);
      const lines = personServices.length
        ? personServices.map((s) => lineFromService(s))
        : [];
      if (!lines.length) continue;
      for (const line of lines) assignedIds.add(String(line.id));

      const trimmed = person.name?.trim() ?? "";
      const isModel = person.participantType === "model";
      if (isModel) modelOrdinal += 1;
      else guestOrdinal += 1;

      guestShares.push({
        key: personId,
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
        subtotal: sumLines(lines),
      });
    }

    if (guestShares.length) {
      const mainLines = allLines.filter((line) => !assignedIds.has(String(line.id)));
      return [
        {
          key: requesterId,
          role: "main_client",
          label: mainClientName,
          displayName: mainClientName,
          email: mainClientEmail,
          phone: mainClientPhone,
          lines: mainLines.length ? mainLines : allLines,
          subtotal: sumLines(mainLines.length ? mainLines : allLines),
        },
        ...guestShares,
      ];
    }
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
      subtotal: sumLines(allLines),
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
