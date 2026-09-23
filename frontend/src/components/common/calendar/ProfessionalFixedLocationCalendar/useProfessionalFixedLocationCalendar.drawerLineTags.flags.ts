import * as React from "react";
import { parseStoredEbrFromNotes } from "../bookingEventDetails";
import {
  shouldShowExpiredResponseBanner,
} from "../bookingResponseDeadline";
import {
  canDiscardEbr,
  canRespondToConfirmedEr,
  canRespondToIncomingRequest,
  isAwaitingClientChangeApproval,
  isAwaitingIncomingClientEdit,
} from "../bookingRequestNegotiation";
import { getBookingEditRequest } from "../../client-booking/bookingEditRequest";
import { extractBookingId } from "../calendar.utils";
import type { UseProfessionalFixedLocationCalendarDrawerLineTagsArgs } from "./useProfessionalFixedLocationCalendar.drawerLineTags";

/** Incoming request/ER action flags + notes (ponytail: subdomain of drawerLineTags). */
export function useProfessionalFixedLocationCalendarDrawerLineTagsFlags(
  args: UseProfessionalFixedLocationCalendarDrawerLineTagsArgs,
) {
  const {
    viewingBookingEvent,
    isViewingBooking,
    isEditingExisting,
    businessResponseWindowInput,
  } = args;

  const showIncomingRequestActions =
    isViewingBooking &&
    canRespondToIncomingRequest(viewingBookingEvent) &&
    !isEditingExisting;
  const showIncomingErActions =
    isViewingBooking &&
    canRespondToConfirmedEr(viewingBookingEvent) &&
    !isEditingExisting;
  const incomingClientNote =
    viewingBookingEvent?.details?.clientNote?.trim() || "";
  const incomingErNote = React.useMemo(() => {
    if (!showIncomingErActions || !viewingBookingEvent) return null;
    const detailsNote = viewingBookingEvent.details?.editRequestNote?.trim();
    if (
      detailsNote &&
      viewingBookingEvent.details?.editRequestInitiatedBy === "client"
    ) {
      return detailsNote;
    }
    const bookingRef =
      viewingBookingEvent.bookingCode ??
      extractBookingId(viewingBookingEvent.id);
    const rec = getBookingEditRequest(bookingRef);
    if (
      rec.status === "pending" &&
      rec.initiatedBy === "client" &&
      rec.note?.trim()
    ) {
      return rec.note.trim();
    }
    return null;
  }, [showIncomingErActions, viewingBookingEvent]);
  const showDiscardEbr =
    isViewingBooking &&
    canDiscardEbr(viewingBookingEvent) &&
    !isEditingExisting;
  /** Initiator can withdraw pending Confirmed ER until the other party accepts. */
  const showWithdrawEr =
    isViewingBooking &&
    viewingBookingEvent?.status === "Confirmed" &&
    viewingBookingEvent?.bookingScenario === "ER" &&
    viewingBookingEvent?.details?.requestDirection === "outgoing" &&
    viewingBookingEvent?.details?.editRequestStatus !== "approved" &&
    viewingBookingEvent?.details?.editRequestStatus !== "rejected" &&
    !viewingBookingEvent?.details?.needsOk;
  const showExpiredResponseBanner = shouldShowExpiredResponseBanner(
    viewingBookingEvent,
    businessResponseWindowInput,
  );
  const negotiationDetails = viewingBookingEvent?.details;
  const drawerEbrNotes = viewingBookingEvent?.notes;
  const awaitingClientChangeApproval = React.useMemo(() => {
    const ebr = parseStoredEbrFromNotes(drawerEbrNotes);
    return isAwaitingClientChangeApproval(negotiationDetails, ebr);
  }, [drawerEbrNotes, negotiationDetails]);
  const awaitingLineApproval =
    awaitingClientChangeApproval ||
    isAwaitingIncomingClientEdit(viewingBookingEvent);
  const savedBookingDetails = viewingBookingEvent?.details;

  return {
    showIncomingRequestActions,
    showIncomingErActions,
    incomingClientNote,
    incomingErNote,
    showDiscardEbr,
    showWithdrawEr,
    showExpiredResponseBanner,
    negotiationDetails,
    drawerEbrNotes,
    awaitingClientChangeApproval,
    awaitingLineApproval,
    savedBookingDetails,
  };
}

export type DrawerLineTagsFlags = ReturnType<
  typeof useProfessionalFixedLocationCalendarDrawerLineTagsFlags
>;
