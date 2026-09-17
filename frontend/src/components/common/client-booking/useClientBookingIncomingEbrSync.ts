"use client";

import * as React from "react";
import {
  clearBookingEditRequest,
  getBookingEditRequest,
  professionalRejectEditRequest,
  professionalSuggestBookingChanges,
  professionalAcceptClientEditRequest,
} from "./bookingEditRequest";
import { syncEditRequestFromBookingApi } from "./syncEditRequestFromApi";
import type { ClientBookingDetailsPendingEbrSuggestSend } from "./clientBookingDetails.helpers";

type IncomingEditRequest = {
  status?: string | null;
  professionalNote?: string | null;
  clientNote?: string | null;
  editedServiceIds?: string[] | null;
  editedProductIds?: string[] | null;
  addedServiceIds?: string[] | null;
  cancelledServiceIds?: string[] | null;
  addedProductIds?: string[] | null;
  cancelledProductIds?: string[] | null;
  suggestedServices?: unknown;
  suggestedProducts?: unknown;
  suggestedDateISO?: string | null;
  suggestedTime?: string | null;
  originalDateISO?: string | null;
  originalTime?: string | null;
} | null;

type EditRequestApi = {
  refresh: () => void;
  editRequest?: unknown;
};

/** Hydrate local EBR/ER cache + pending suggest-send from sessionStorage. */
export function useClientBookingIncomingEbrSync(input: {
  bookingRef: string;
  editRequest: EditRequestApi;
  apiEditRequest: unknown;
  incomingEditRequest: IncomingEditRequest;
  setPendingEbrSuggestSend: React.Dispatch<
    React.SetStateAction<ClientBookingDetailsPendingEbrSuggestSend | null>
  >;
}) {
  // Hydrate Confirmed ER from backend edit_request only (ignore stale notes/local cache).
  React.useEffect(() => {
    if (!input.bookingRef) return;
    syncEditRequestFromBookingApi(
      input.bookingRef,
      (input.apiEditRequest as never) ?? null,
    );
    input.editRequest.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.apiEditRequest, input.bookingRef]);

  // After editing services for an EBR suggestion, auto-send once booking session is ready.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("mollure:ebr_suggest_return") !== "1")
      return;
    window.sessionStorage.removeItem("mollure:ebr_suggest_return");

    const note =
      window.sessionStorage.getItem("mollure:ebr_suggest_note") ?? "";
    window.sessionStorage.removeItem("mollure:ebr_suggest_note");

    let editedIds: string[] = [];
    try {
      editedIds = JSON.parse(
        window.sessionStorage.getItem("mollure:ebr_suggest_edited_ids") ?? "[]",
      ) as string[];
    } catch {
      editedIds = [];
    }
    window.sessionStorage.removeItem("mollure:ebr_suggest_edited_ids");
    input.setPendingEbrSuggestSend({ note, editedIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate local EBR state from API notes so client UI works across browsers/sessions.
  // Accept / Suggest / Reject only when professional sent EBR — clear stale local suggested state.
  React.useEffect(() => {
    if (!input.bookingRef) return;
    const incoming = input.incomingEditRequest;
    if (incoming?.status === "suggested") {
      const current = getBookingEditRequest(input.bookingRef);
      if (current.status !== "suggested") {
        professionalSuggestBookingChanges(input.bookingRef, {
          professionalNote: incoming.professionalNote ?? undefined,
          editedServiceIds: incoming.editedServiceIds ?? undefined,
          editedProductIds: incoming.editedProductIds ?? undefined,
          addedServiceIds: incoming.addedServiceIds ?? undefined,
          cancelledServiceIds: incoming.cancelledServiceIds ?? undefined,
          addedProductIds: incoming.addedProductIds ?? undefined,
          cancelledProductIds: incoming.cancelledProductIds ?? undefined,
          suggestedServices: incoming.suggestedServices as never,
          suggestedProducts: incoming.suggestedProducts as never,
        });
        input.editRequest.refresh();
      }
      return;
    }
    if (incoming?.status === "rejected") {
      const current = getBookingEditRequest(input.bookingRef);
      if (current.status !== "rejected") {
        professionalRejectEditRequest(input.bookingRef, {
          clientNote: incoming.clientNote ?? undefined,
          editedServiceIds: incoming.editedServiceIds ?? undefined,
          editedProductIds: incoming.editedProductIds ?? undefined,
          suggestedServices: incoming.suggestedServices as never,
          suggestedProducts: incoming.suggestedProducts as never,
          suggestedDateISO: incoming.suggestedDateISO ?? undefined,
          suggestedTime: incoming.suggestedTime ?? undefined,
          originalDateISO: incoming.originalDateISO ?? undefined,
          originalTime: incoming.originalTime ?? undefined,
        });
        input.editRequest.refresh();
      }
      return;
    }
    if (incoming?.status === "accepted") {
      const current = getBookingEditRequest(input.bookingRef);
      if (current.status !== "accepted") {
        professionalAcceptClientEditRequest(input.bookingRef, {
          clientNote: incoming.clientNote ?? undefined,
          editedServiceIds: incoming.editedServiceIds ?? undefined,
          editedProductIds: incoming.editedProductIds ?? undefined,
          suggestedServices: incoming.suggestedServices as never,
          suggestedProducts: incoming.suggestedProducts as never,
          suggestedDateISO: incoming.suggestedDateISO ?? undefined,
          suggestedTime: incoming.suggestedTime ?? undefined,
          originalDateISO: incoming.originalDateISO ?? undefined,
          originalTime: incoming.originalTime ?? undefined,
        });
        input.editRequest.refresh();
      }
      return;
    }
    if (getBookingEditRequest(input.bookingRef).status === "suggested") {
      clearBookingEditRequest(input.bookingRef);
      input.editRequest.refresh();
    }
    // Only re-run when the API-sourced EBR payload changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.incomingEditRequest, input.bookingRef]);
}
