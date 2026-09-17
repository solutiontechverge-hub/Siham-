import type { BookingEditSuggestedProduct, BookingEditSuggestedService } from "./bookingEditRequest";
import type { ClientBookingDraft } from "./types";

export type BuildClientBookingDisplayDraftEditSlice = {
  isSuggested: boolean;
  isPending: boolean;
  suggestedServices?: BookingEditSuggestedService[] | null;
  suggestedProducts?: BookingEditSuggestedProduct[] | null;
  suggestedDateISO?: string | null;
  suggestedTime?: string | null;
};

/** Merge pending/suggested EBR services into the client draft for display. */
export function buildClientBookingDisplayDraft(
  draft: ClientBookingDraft | null,
  editRequest: BuildClientBookingDisplayDraftEditSlice,
): ClientBookingDraft | null {
  if (!draft) return null;

  // After Save & return the session draft already has the client's edited services — prefer it.
  const suggested = editRequest.suggestedServices;
  const sessionDiffersFromSuggested =
    Boolean(suggested?.length) &&
    (draft.services.length !== suggested!.length ||
      draft.services.some((service) => {
        const match = suggested!.find((row) => row.id === service.id);
        return (
          !match ||
          match.name !== service.name ||
          match.price !== service.price ||
          match.durationMins !== service.durationMins
        );
      }));

  if (sessionDiffersFromSuggested) return draft;

  const useSuggested =
    (editRequest.isSuggested || editRequest.isPending) &&
    Boolean(suggested?.length);
  if (!useSuggested || !suggested?.length) return draft;

  const teamMembers = [...(draft.teamMembers ?? [])];
  for (const service of suggested) {
    if (!service.teamMemberId || !service.teamMemberName) continue;
    if (teamMembers.some((member) => member.id === service.teamMemberId))
      continue;
    teamMembers.push({
      id: service.teamMemberId,
      name: service.teamMemberName,
    });
  }

  const services = suggested.map((service) => {
    const original =
      draft.services.find((row) => row.id === service.id) ??
      draft.services.find((row) => row.name === service.name);
    return {
      id: service.id,
      name: service.name,
      durationMins: service.durationMins,
      price: service.price,
      startTime: service.startTime ?? original?.startTime,
      endTime: service.endTime ?? original?.endTime,
      // Keep Model/Guest assignment from original draft when EBR omits guestId.
      guestId: service.guestId ?? original?.guestId ?? null,
      teamMemberId: service.teamMemberId ?? original?.teamMemberId ?? null,
    };
  });
  const productTotal = (editRequest.suggestedProducts ?? []).reduce(
    (sum, product) => sum + product.price,
    0,
  );
  const serviceTotal = services.reduce(
    (sum, service) => sum + service.price,
    0,
  );

  return {
    ...draft,
    selectedDateISO: editRequest.suggestedDateISO || draft.selectedDateISO,
    selectedTime: editRequest.suggestedTime || draft.selectedTime,
    // Preserve people + projectDetails via spread — EBR only updates service lines/totals.
    services,
    teamMembers,
    total: serviceTotal + productTotal,
  };
}
