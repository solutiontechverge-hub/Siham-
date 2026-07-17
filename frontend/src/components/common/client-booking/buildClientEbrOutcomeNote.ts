export type EbrOutcomeLine = { name: string; price: number };

export type ClientEbrOutcomeNote = {
  scheduleLabel?: string;
  services: EbrOutcomeLine[];
  products: EbrOutcomeLine[];
};

type SuggestedService = {
  id: string;
  name: string;
  price: number;
  durationMins?: number;
};

type SuggestedProduct = {
  id: string;
  name: string;
  price: number;
};

type OriginalService = {
  id: string;
  name: string;
  price: number;
  durationMins?: number;
};

function formatScheduleLabel(dateIso?: string, timeLabel?: string) {
  if (!dateIso) return "";
  const dt = new Date(`${dateIso}T00:00:00`);
  const datePart = Number.isNaN(dt.getTime())
    ? dateIso
    : dt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  return [datePart, timeLabel?.trim()].filter(Boolean).join(" · ");
}

function pickEditedServices(
  suggested: SuggestedService[],
  editedServiceIds: string[] | undefined,
  originalServices: OriginalService[],
): EbrOutcomeLine[] {
  if (!suggested.length) return [];

  const edited = new Set((editedServiceIds ?? []).map(String));
  if (edited.size > 0) {
    return suggested
      .filter((service) => edited.has(service.id) || edited.has(service.name))
      .map((service) => ({ name: service.name, price: service.price }));
  }

  // Fallback when ids weren't stored: only true diffs vs the confirmed booking.
  if (!originalServices.length) return [];

  return suggested
    .filter((service) => {
      const original =
        originalServices.find((row) => row.id === service.id) ??
        originalServices.find((row) => row.name === service.name);
      if (!original) return true;
      return (
        original.name !== service.name ||
        original.price !== service.price ||
        (original.durationMins ?? 0) !== (service.durationMins ?? 0)
      );
    })
    .map((service) => ({ name: service.name, price: service.price }));
}

function pickEditedProducts(
  suggested: SuggestedProduct[],
  editedProductIds: string[] | undefined,
): EbrOutcomeLine[] {
  if (!suggested.length) return [];
  const edited = new Set((editedProductIds ?? []).map(String));
  if (edited.size === 0) return [];
  return suggested
    .filter((product) => edited.has(product.id) || edited.has(product.name))
    .map((product) => ({ name: product.name, price: product.price }));
}

/** Build the accept/reject banner content — schedule/services/products that actually changed. */
export function buildClientEbrOutcomeNote(input: {
  suggestedDateISO?: string;
  suggestedTime?: string;
  suggestedServices?: SuggestedService[];
  suggestedProducts?: SuggestedProduct[];
  editedServiceIds?: string[];
  editedProductIds?: string[];
  originalDateISO?: string;
  originalTime?: string;
  originalServices?: OriginalService[];
}): ClientEbrOutcomeNote | null {
  const scheduleChanged =
    Boolean(input.suggestedDateISO || input.suggestedTime) &&
    (String(input.suggestedDateISO ?? "") !== String(input.originalDateISO ?? "") ||
      String(input.suggestedTime ?? "").trim() !== String(input.originalTime ?? "").trim());

  const scheduleLabel = scheduleChanged
    ? formatScheduleLabel(input.suggestedDateISO, input.suggestedTime)
    : undefined;

  const services = pickEditedServices(
    input.suggestedServices ?? [],
    input.editedServiceIds,
    input.originalServices ?? [],
  );
  const products = pickEditedProducts(input.suggestedProducts ?? [], input.editedProductIds);

  if (!scheduleLabel && !services.length && !products.length) return null;
  return { scheduleLabel, services, products };
}
