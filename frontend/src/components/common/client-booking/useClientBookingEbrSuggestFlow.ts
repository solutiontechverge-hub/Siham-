"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
import { enrichClientBookingRecord } from "../../../app/clients/booking/clientBookingDraftCache";
import {
  setActiveBookingSession,
  unlockEbrDraft,
} from "../../../app/clients/booking/clientBookingSession";
import { clearPublicProfileBookingSelection } from "../../../data/publicProfileBookingSelection";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useSnackbar } from "../AppSnackbar";
import type { ClientBookingDetailsPendingEbrSuggestSend } from "./clientBookingDetails.helpers";
import {
  persistClientEbrSuggestion,
  persistConfirmedGrantEdit,
} from "./persistClientEbrEdits";
import type { BookingEditSuggestedProduct } from "./bookingEditRequest";
import type { ClientBookingDraft } from "./types";
import type { UpdateMyBookingRequest } from "../../../store/services/businessApi";

type EditRequestApi = {
  refresh: () => void;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  professionalNote?: string;
  suggestedProducts?: BookingEditSuggestedProduct[] | null;
};

export function useClientBookingEbrSuggestFlow(input: {
  bookingRef: string;
  apiBookingId: string | null;
  activeBooking: ClientBookingRecord | null;
  displayDraft: ClientBookingDraft | null;
  draft: ClientBookingDraft | null;
  editRequest: EditRequestApi;
  locationMode: string;
  pendingEbrSuggestSend: ClientBookingDetailsPendingEbrSuggestSend | null;
  setPendingEbrSuggestSend: React.Dispatch<
    React.SetStateAction<ClientBookingDetailsPendingEbrSuggestSend | null>
  >;
  setEbrSuggestDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  persistBookingPatch: (payload: UpdateMyBookingRequest) => Promise<unknown>;
  refreshActiveBooking: () => Promise<unknown> | unknown;
  updateMyBooking: (payload: UpdateMyBookingRequest) => {
    unwrap: () => Promise<unknown>;
  };
}) {
  const {
    bookingRef,
    apiBookingId,
    activeBooking,
    displayDraft,
    draft,
    editRequest,
    locationMode,
    pendingEbrSuggestSend,
    setPendingEbrSuggestSend,
    setEbrSuggestDrawerOpen,
    persistBookingPatch,
    refreshActiveBooking,
    updateMyBooking,
  } = input;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const runPersistClientEbrSuggestion = React.useCallback(
    async (note: string, editedServiceIdsOverride?: string[]) => {
      await persistClientEbrSuggestion({
        note,
        editedServiceIdsOverride,
        bookingRef,
        apiBookingId,
        activeBookingNotes: activeBooking?.notes,
        displayDraft,
        draft,
        editRequest,
        locationMode,
        persistBookingPatch,
        refreshActiveBooking,
        showSnackbar,
      });
    },
    [
      activeBooking?.notes,
      apiBookingId,
      bookingRef,
      displayDraft,
      draft,
      editRequest,
      locationMode,
      persistBookingPatch,
      refreshActiveBooking,
      showSnackbar,
    ],
  );

  const handleEbrSuggestEditServices = React.useCallback(
    (note: string) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("mollure:ebr_suggest_note", note);
      }
      setEbrSuggestDrawerOpen(false);
      if (activeBooking) {
        setActiveBookingSession(enrichClientBookingRecord(activeBooking));
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mollure:ebr_baseline_schedule",
            JSON.stringify({
              dateISO: activeBooking.draft?.selectedDateISO ?? "",
              time: activeBooking.draft?.selectedTime ?? "",
            }),
          );
        }
      }
      clearPublicProfileBookingSelection();
      router.push("/clients/booking?mode=create&ebrSuggest=1&ebrFocus=services");
    },
    [activeBooking, router, setEbrSuggestDrawerOpen],
  );

  const handleEbrSuggestSend = React.useCallback(
    async (note: string) => {
      try {
        await runPersistClientEbrSuggestion(note);
        setEbrSuggestDrawerOpen(false);
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            "Unable to send suggested changes.",
          ),
        });
      }
    },
    [runPersistClientEbrSuggestion, setEbrSuggestDrawerOpen, showSnackbar],
  );

  const runPersistConfirmedGrantEdit = React.useCallback(async () => {
    if (!bookingRef || !apiBookingId) return;
    await persistConfirmedGrantEdit({
      bookingRef,
      apiBookingId,
      activeBooking,
      editRequest,
      updateMyBooking,
      refreshActiveBooking,
      showSnackbar,
    });
  }, [
    activeBooking,
    apiBookingId,
    bookingRef,
    editRequest,
    refreshActiveBooking,
    showSnackbar,
    updateMyBooking,
  ]);

  React.useEffect(() => {
    if (!pendingEbrSuggestSend || !bookingRef) return;
    setPendingEbrSuggestSend(null);
    void (async () => {
      try {
        await runPersistConfirmedGrantEdit();
      } catch (error) {
        unlockEbrDraft();
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to update booking."),
        });
      }
    })();
  }, [
    bookingRef,
    pendingEbrSuggestSend,
    runPersistConfirmedGrantEdit,
    setPendingEbrSuggestSend,
    showSnackbar,
  ]);

  const openConfirmedEbrEditor = React.useCallback(
    // Client confirmed edit: schedule + Desired Location only (not services/project).
    (focus: "datetime" | "location") => {
      if (activeBooking) {
        // Enrich from local draft snapshot so Desired Model/Planning/Project data survives reopen.
        setActiveBookingSession(enrichClientBookingRecord(activeBooking));
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mollure:ebr_baseline_schedule",
            JSON.stringify({
              dateISO: activeBooking.draft?.selectedDateISO ?? "",
              time: activeBooking.draft?.selectedTime ?? "",
            }),
          );
        }
      }
      // Prevent leftover public-profile catalog from wiping the booking draft on Edit.
      clearPublicProfileBookingSelection();
      router.push(
        `/clients/booking?mode=create&ebrSuggest=1&ebrFocus=${focus}`,
      );
    },
    [activeBooking, router],
  );

  return {
    handleEbrSuggestEditServices,
    handleEbrSuggestSend,
    openConfirmedEbrEditor,
  };
}
