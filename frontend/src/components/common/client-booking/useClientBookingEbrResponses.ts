"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { BookingListTab } from "../../../app/clients/booking/clientBookingRecords";
import type { ClientBookingRecord } from "../../../app/clients/booking/clientBookingRecords";
import { recalculateServiceStartEndTimes } from "../../../data/bookingServiceEdit.data";
import {
  getActiveBookingSession,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useSnackbar } from "../AppSnackbar";
import {
  buildAcceptAckDetails,
  buildEditRequestAckDetails,
  clearBookingAckDetails,
} from "../calendar/bookingAcknowledgment";
import {
  clearEbrSuggestionsFromNotes,
  markClientEbrAcceptedInNotes,
  markClientEbrRejectedInNotes,
  parseCalendarEntryNotes,
  parseStoredEbrFromNotes,
  parseStoredErFromNotes,
  serializeCalendarEntryNotes,
} from "../calendar/bookingEventDetails";
import { prepareBookingMessagingOpen } from "../messaging/openBookingMessaging";
import { useMessagingWidgetOptional } from "../messaging";
import type { ClientEbrActionKind } from "./ClientEbrActionDialog";
import {
  clientAcceptSuggestedChanges,
  clientAcknowledgeRejectedEdit,
  clientRejectSuggestedChanges,
  clearBookingEditRequest,
} from "./bookingEditRequest";
import { syncEditRequestFromBookingApi } from "./syncEditRequestFromApi";
import type {
  ClientBookingDetailsActionFeedback,
  ClientBookingDetailsActiveDocument,
} from "./clientBookingDetails.helpers";
import type { UpdateMyBookingRequest } from "../../../store/services/businessApi";

type EditRequestApi = {
  refresh: () => void;
  suggestedServices?: Array<{
    id: string;
    name: string;
    durationMins: number;
    price: number;
    startTime?: string;
    endTime?: string;
    guestId?: string | null;
    teamMemberId?: string | null;
  }> | null;
  suggestedProducts?: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }> | null;
  editedServiceIds?: string[];
  editedProductIds?: string[];
  addedServiceIds?: string[];
  cancelledServiceIds?: string[];
  addedProductIds?: string[];
  cancelledProductIds?: string[];
};

export function useClientBookingEbrResponses(input: {
  bookingRef: string;
  apiBookingId: string | null;
  activeBooking: ClientBookingRecord | null;
  prepaymentPercent: number;
  isPrepaymentPaid: boolean;
  isOfflinePay: boolean;
  isIncomingBr: boolean;
  isIncomingConfirmedEr: boolean;
  listTab: BookingListTab;
  ebrRespondParam: string | null;
  searchParams: { toString: () => string };
  editRequest: EditRequestApi;
  persistBookingPatch: (payload: UpdateMyBookingRequest) => Promise<unknown>;
  refreshActiveBooking: () => Promise<unknown> | unknown;
  updateMyBooking: (payload: UpdateMyBookingRequest) => {
    unwrap: () => Promise<unknown>;
  };
  manageBookingEditRequest: (payload: {
    id: string;
    action: "accept" | "reject";
  }) => { unwrap: () => Promise<{ data?: { edit_request?: unknown } }> };
  openMessagingForBooking: (payload: { bookingRef: string }) => {
    unwrap: () => Promise<unknown>;
  };
  handlePayNow: () => Promise<void> | void;
  pendingAcceptBrAfterPrepay: React.MutableRefObject<boolean>;
  setEbrAction: React.Dispatch<React.SetStateAction<ClientEbrActionKind | null>>;
  setEbrSuggestDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setResponseActionsDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<
    React.SetStateAction<ClientBookingDetailsActionFeedback | null>
  >;
  setActiveDocument: React.Dispatch<
    React.SetStateAction<ClientBookingDetailsActiveDocument>
  >;
  setStripeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    bookingRef,
    apiBookingId,
    activeBooking,
    prepaymentPercent,
    isPrepaymentPaid,
    isOfflinePay,
    isIncomingBr,
    isIncomingConfirmedEr,
    listTab,
    ebrRespondParam,
    searchParams,
    editRequest,
    persistBookingPatch,
    refreshActiveBooking,
    updateMyBooking,
    manageBookingEditRequest,
    openMessagingForBooking,
    handlePayNow,
    pendingAcceptBrAfterPrepay,
    setEbrAction,
    setEbrSuggestDrawerOpen,
    setResponseActionsDismissed,
    setActionFeedback,
    setActiveDocument,
    setStripeDialogOpen,
  } = input;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const messagingWidget = useMessagingWidgetOptional();

  const returnToBookingDetailsStart = React.useCallback(
    async (mode: "accept_suggested" | "acknowledge_rejected" | "accept_br") => {
      if (mode === "accept_suggested") {
        clientAcceptSuggestedChanges(bookingRef);
      } else if (mode === "acknowledge_rejected") {
        clientAcknowledgeRejectedEdit(bookingRef);
      }

      const prepayPct =
        Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
      const alreadyPaid = Boolean(activeBooking?.prepaid) || isPrepaymentPaid;
      const shouldRequirePrepay =
        mode === "accept_br" &&
        prepayPct > 0 &&
        !alreadyPaid &&
        !isOfflinePay;

      if (apiBookingId) {
        try {
          if (mode === "accept_suggested") {
            const ebr = parseStoredEbrFromNotes(activeBooking?.notes);
            const priorNotes = parseCalendarEntryNotes(activeBooking?.notes);
            const suggestedServices =
              ebr?.suggestedServices?.length
                ? ebr.suggestedServices
                : editRequest.suggestedServices?.map((service) => ({
                    id: service.id,
                    name: service.name,
                    durationMins: service.durationMins,
                    price: service.price,
                    startTime: service.startTime,
                    endTime: service.endTime,
                    guestId: service.guestId ?? null,
                    teamMemberId: service.teamMemberId ?? null,
                  }));
            const suggestedProducts =
              ebr?.suggestedProducts?.length
                ? ebr.suggestedProducts
                : editRequest.suggestedProducts?.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: product.quantity || 1,
                    unitPrice: product.price,
                  }));
            const suggestedStart = ebr?.suggestedStart;
            const suggestedEnd = ebr?.suggestedEnd;
            const suggestedDate = ebr?.suggestedDateISO;
            // Accepted schedule wins: re-sequence the lines from the new start.
            const resolvedServices =
              suggestedStart && suggestedServices?.length
                ? recalculateServiceStartEndTimes(
                    suggestedServices,
                    suggestedStart,
                  )
                : suggestedServices;
            const appliedNotes = markClientEbrAcceptedInNotes(
              activeBooking?.notes,
              {
                internalNote: priorNotes?.internalNote ?? "",
                services: resolvedServices,
                products: suggestedProducts,
                lastEditedBy: ebr?.lastEditedBy ?? "professional",
                editedServiceIds:
                  ebr?.editedServiceIds ?? editRequest.editedServiceIds,
                editedProductIds:
                  ebr?.editedProductIds ?? editRequest.editedProductIds,
                addedServiceIds:
                  ebr?.addedServiceIds ?? editRequest.addedServiceIds,
                cancelledServiceIds:
                  ebr?.cancelledServiceIds ?? editRequest.cancelledServiceIds,
                addedProductIds:
                  ebr?.addedProductIds ?? editRequest.addedProductIds,
                cancelledProductIds:
                  ebr?.cancelledProductIds ?? editRequest.cancelledProductIds,
                clientSnapshot: {
                  ...(priorNotes?.clientSnapshot ?? {}),
                  ...(resolvedServices?.length
                    ? {
                        services: resolvedServices.map((service) => ({
                          id: service.id,
                          name: service.name,
                          price: service.price,
                          durationMins: service.durationMins,
                          startTime: service.startTime,
                          endTime: service.endTime,
                          guestId: service.guestId ?? null,
                          teamMemberId: service.teamMemberId ?? null,
                        })),
                      }
                    : {}),
                  ...(ebr?.suggestedProjectDetails
                    ? { projectDetails: ebr.suggestedProjectDetails }
                    : {}),
                },
              },
            );
            const suggestedTotal =
              ebr?.suggestedTotalPrice ??
              (suggestedServices ?? []).reduce(
                (sum, service) => sum + (Number(service.price) || 0),
                0,
              ) +
                (suggestedProducts ?? []).reduce(
                  (sum, product) =>
                    sum +
                    (Number(product.price) || 0) * (product.quantity || 1),
                  0,
                );
            await persistBookingPatch({
              id: apiBookingId,
              status: "confirmed",
              notes: appliedNotes,
              ...(Number.isFinite(suggestedTotal) && suggestedTotal > 0
                ? { total_price: suggestedTotal }
                : {}),
              ...(suggestedDate &&
              suggestedStart &&
              suggestedEnd &&
              /^\d{2}:\d{2}$/.test(suggestedStart) &&
              /^\d{2}:\d{2}$/.test(suggestedEnd)
                ? {
                    booking_date: suggestedDate,
                    start_time: `${suggestedDate}T${suggestedStart}:00`,
                    end_time: `${suggestedDate}T${suggestedEnd}:00`,
                  }
                : {}),
              ...(shouldRequirePrepay
                ? { prepayment_status: "required" as const }
                : {}),
            });
          } else if (mode === "accept_br") {
            const prior = parseCalendarEntryNotes(activeBooking?.notes) ?? {};
            const ackDetails = buildAcceptAckDetails({
              prepayRequired: Boolean(shouldRequirePrepay),
              prepayPaid: alreadyPaid || isOfflinePay,
              requestDirection: "outgoing",
              ackScenario: "BR",
              base: prior,
            });
            const nextNotes = serializeCalendarEntryNotes(
              ackDetails.internalNote ?? "",
              ackDetails,
              parseStoredEbrFromNotes(activeBooking?.notes),
              parseStoredErFromNotes(activeBooking?.notes),
            );
            await persistBookingPatch({
              id: apiBookingId,
              status: "br_accepted",
              notes: nextNotes,
              ...(shouldRequirePrepay
                ? { prepayment_status: "required" as const }
                : {}),
            });
          } else {
            const prior = parseCalendarEntryNotes(activeBooking?.notes) ?? {};
            const cleared = clearBookingAckDetails(prior);
            const nextNotes = serializeCalendarEntryNotes(
              cleared.internalNote ?? "",
              cleared,
              parseStoredEbrFromNotes(activeBooking?.notes),
              null,
            );
            await persistBookingPatch({
              id: apiBookingId,
              status: "confirmed",
              notes: nextNotes,
            });
          }
          await refreshActiveBooking();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              mode === "accept_br"
                ? "Unable to accept booking request."
                : "Unable to confirm booking changes.",
            ),
          });
          return;
        }
      }

      editRequest.refresh();
      setActiveDocument(null);
      setStripeDialogOpen(false);

      showSnackbar({
        severity: "success",
        message:
          mode === "accept_br"
            ? "Booking request accepted."
            : mode === "accept_suggested"
              ? "Changes accepted. Your booking is confirmed."
              : "Booking details updated.",
      });

      if (mode === "accept_br" && shouldRequirePrepay) {
        router.push(`/clients/booking/checkout/prepaid?tab=${listTab}`);
        return;
      }

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      activeBooking?.notes,
      activeBooking?.prepaid,
      activeBooking?.prepaymentPercent,
      apiBookingId,
      bookingRef,
      editRequest,
      isOfflinePay,
      isPrepaymentPaid,
      listTab,
      persistBookingPatch,
      prepaymentPercent,
      refreshActiveBooking,
      router,
      setActiveDocument,
      setStripeDialogOpen,
      showSnackbar,
    ],
  );

  const handleConfirmEbrAccept = React.useCallback(async () => {
    if (isIncomingBr) {
      const prepayPct =
        Number(activeBooking?.prepaymentPercent ?? prepaymentPercent) || 0;
      const needsPrepay = prepayPct > 0 && !isPrepaymentPaid && !isOfflinePay;
      if (needsPrepay) {
        pendingAcceptBrAfterPrepay.current = true;
        setEbrAction(null);
        setResponseActionsDismissed(false);
        setActionFeedback({
          severity: "error",
          message: "Prepayment is required to accept this booking.",
        });
        void handlePayNow();
        return;
      }
    }
    if (isIncomingConfirmedEr) {
      if (!apiBookingId || !bookingRef) return;
      try {
        const result = await manageBookingEditRequest({
          id: apiBookingId,
          action: "accept",
        }).unwrap();
        const er = result.data?.edit_request as Parameters<
          typeof syncEditRequestFromBookingApi
        >[1];
        syncEditRequestFromBookingApi(bookingRef, er);
        const initiatedBy =
          er?.initiated_by === "professional" ? "professional" : "client";
        const prior = parseCalendarEntryNotes(activeBooking?.notes) ?? {};
        const ackDetails = buildEditRequestAckDetails({
          initiatedBy,
          editRequestStatus: "approved",
          base: prior,
        });
        const nextNotes = serializeCalendarEntryNotes(
          ackDetails.internalNote ?? "",
          ackDetails,
          parseStoredEbrFromNotes(activeBooking?.notes),
          parseStoredErFromNotes(activeBooking?.notes),
        );
        await persistBookingPatch({
          id: apiBookingId,
          status: "confirmed",
          notes: nextNotes,
        });
        await refreshActiveBooking();
        editRequest.refresh();
      } catch (error) {
        setResponseActionsDismissed(false);
        setActionFeedback(null);
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to accept edit request."),
        });
      }
      return;
    }
    void returnToBookingDetailsStart(
      isIncomingBr ? "accept_br" : "accept_suggested",
    );
  }, [
    activeBooking?.notes,
    activeBooking?.prepaymentPercent,
    apiBookingId,
    bookingRef,
    editRequest,
    handlePayNow,
    isIncomingBr,
    isIncomingConfirmedEr,
    isOfflinePay,
    isPrepaymentPaid,
    manageBookingEditRequest,
    pendingAcceptBrAfterPrepay,
    persistBookingPatch,
    prepaymentPercent,
    refreshActiveBooking,
    returnToBookingDetailsStart,
    setActionFeedback,
    setEbrAction,
    setResponseActionsDismissed,
    showSnackbar,
  ]);

  const handleConfirmEbrReject = React.useCallback(async () => {
    if (!bookingRef) return;

    // Confirmed ER: keep Confirmed + ER tag until initiator OKs (never Invalid).
    if (isIncomingConfirmedEr) {
      if (!apiBookingId) return;
      try {
        const result = await manageBookingEditRequest({
          id: apiBookingId,
          action: "reject",
        }).unwrap();
        const er = result.data?.edit_request as Parameters<
          typeof syncEditRequestFromBookingApi
        >[1];
        syncEditRequestFromBookingApi(bookingRef, er);
        const initiatedBy =
          er?.initiated_by === "professional" ? "professional" : "client";
        const prior = parseCalendarEntryNotes(activeBooking?.notes) ?? {};
        const ackDetails = buildEditRequestAckDetails({
          initiatedBy,
          editRequestStatus: "rejected",
          base: {
            ...prior,
            editRequestNote: er?.note ?? prior.editRequestNote,
            editRequestInitiatedBy:
              er?.initiated_by ?? prior.editRequestInitiatedBy,
          },
        });
        const nextNotes = serializeCalendarEntryNotes(
          ackDetails.internalNote ?? "",
          ackDetails,
          parseStoredEbrFromNotes(activeBooking?.notes),
          parseStoredErFromNotes(activeBooking?.notes),
        );
        await persistBookingPatch({
          id: apiBookingId,
          status: "confirmed",
          notes: nextNotes,
        });
        await refreshActiveBooking();
        editRequest.refresh();
      } catch (error) {
        setResponseActionsDismissed(false);
        setActionFeedback(null);
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to reject edit request."),
        });
      }
      return;
    }

    // Invalid only for pending BR/EBR (requested). Confirmed stays confirmed.
    const bookingIsRequested =
      String(activeBooking?.status ?? "").toLowerCase() === "requested";

    if (!isIncomingBr) {
      clientRejectSuggestedChanges(bookingRef);
    }
    if (apiBookingId) {
      try {
        const nextNotes = bookingIsRequested
          ? clearEbrSuggestionsFromNotes(activeBooking?.notes)
          : markClientEbrRejectedInNotes(activeBooking?.notes);
        await updateMyBooking({
          id: apiBookingId,
          status: bookingIsRequested || isIncomingBr ? "invalid" : "confirmed",
          notes: nextNotes,
        }).unwrap();
        await refreshActiveBooking();
      } catch (error) {
        setResponseActionsDismissed(false);
        setActionFeedback(null);
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(
            error,
            isIncomingBr
              ? "Unable to reject booking request."
              : "Unable to reject edited booking request.",
          ),
        });
        return;
      }
    }
    if (bookingIsRequested || isIncomingBr) {
      clearBookingEditRequest(bookingRef);
    }
    editRequest.refresh();
  }, [
    activeBooking?.notes,
    activeBooking?.status,
    apiBookingId,
    bookingRef,
    editRequest,
    isIncomingBr,
    isIncomingConfirmedEr,
    manageBookingEditRequest,
    persistBookingPatch,
    refreshActiveBooking,
    setActionFeedback,
    setResponseActionsDismissed,
    showSnackbar,
    updateMyBooking,
  ]);

  const handleConfirmEbrSuggest = React.useCallback(async () => {
    setEbrAction(null);
    setEbrSuggestDrawerOpen(false);
    if (!bookingRef) return;
    try {
      const result = await openMessagingForBooking({ bookingRef }).unwrap();
      messagingWidget?.openMessaging(
        prepareBookingMessagingOpen(result as never),
      );
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Unable to open chat for this booking.",
        ),
      });
    }
  }, [
    bookingRef,
    messagingWidget,
    openMessagingForBooking,
    setEbrAction,
    setEbrSuggestDrawerOpen,
    showSnackbar,
  ]);

  const ebrRespondHandledRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ebrRespondParam || !bookingRef) return;
    const key = `${bookingRef}:${ebrRespondParam}`;
    if (ebrRespondHandledRef.current === key) return;
    ebrRespondHandledRef.current = key;

    if (ebrRespondParam === "suggest") {
      void handleConfirmEbrSuggest();
    } else if (ebrRespondParam === "accept") {
      setEbrAction("accept");
    } else if (ebrRespondParam === "reject") {
      setEbrAction("reject");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ebr");
    const nextQuery = params.toString();
    router.replace(
      nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname,
      { scroll: false },
    );
  }, [
    bookingRef,
    ebrRespondParam,
    handleConfirmEbrSuggest,
    router,
    searchParams,
    setEbrAction,
  ]);

  const handleAcknowledgeRejected = React.useCallback(() => {
    returnToBookingDetailsStart("acknowledge_rejected");
  }, [returnToBookingDetailsStart]);

  const handleAcknowledgeCounterpartyAction = React.useCallback(async () => {
    if (!apiBookingId || String(apiBookingId).startsWith("bk_draft_")) {
      showSnackbar({
        severity: "error",
        message: "Unable to acknowledge booking.",
      });
      return;
    }
    const currentNotes = activeBooking?.notes ?? null;
    const nextDetails = clearBookingAckDetails({
      ...(parseCalendarEntryNotes(currentNotes) ?? {}),
    });
    const nextNotes = serializeCalendarEntryNotes(
      nextDetails.internalNote ?? "",
      nextDetails,
      parseStoredEbrFromNotes(currentNotes),
      parseStoredErFromNotes(currentNotes),
    );
    try {
      await updateMyBooking({
        id: apiBookingId,
        status: "confirmed",
        notes: nextNotes,
      }).unwrap();
      if (activeBooking) {
        setActiveBookingSession({
          ...activeBooking,
          status: "confirmed",
          needsOk: false,
          ackRecipient: undefined,
          ackScenario: undefined,
          notes: nextNotes,
        });
      }
      await refreshActiveBooking();
      showSnackbar({
        severity: "success",
        message: "Booking acknowledged.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to acknowledge booking."),
      });
    }
  }, [
    activeBooking,
    apiBookingId,
    refreshActiveBooking,
    showSnackbar,
    updateMyBooking,
  ]);

  const [isWithdrawingEr, setIsWithdrawingEr] = React.useState(false);
  const handleWithdrawEr = React.useCallback(async () => {
    if (!bookingRef || !apiBookingId) return;
    setIsWithdrawingEr(true);
    try {
      const result = await manageBookingEditRequest({
        id: apiBookingId,
        action: "reject",
      }).unwrap();
      syncEditRequestFromBookingApi(
        bookingRef,
        result.data?.edit_request as Parameters<
          typeof syncEditRequestFromBookingApi
        >[1],
      );
      await refreshActiveBooking();
      editRequest.refresh();
      showSnackbar({
        severity: "success",
        message: "Edit request withdrawn.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to withdraw edit request."),
      });
    } finally {
      setIsWithdrawingEr(false);
    }
  }, [
    apiBookingId,
    bookingRef,
    editRequest,
    manageBookingEditRequest,
    refreshActiveBooking,
    showSnackbar,
  ]);

  return {
    returnToBookingDetailsStart,
    handleConfirmEbrAccept,
    handleConfirmEbrReject,
    handleConfirmEbrSuggest,
    handleAcknowledgeRejected,
    handleAcknowledgeCounterpartyAction,
    handleWithdrawEr,
    isWithdrawingEr,
  };
}
