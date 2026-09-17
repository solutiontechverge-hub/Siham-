"use client";

import * as React from "react";
import type { ClientBookingStatus } from "../../../app/clients/booking/clientBookingRecords";
import {
  buildAcceptedChangesNote,
  buildRejectedChangesNote,
  resolveClientBookingOutcomeSource,
} from "./buildClientBookingOutcomeNotes";
import type { BookingEditRequestRecord } from "./bookingEditRequest";
import type { ClientBookingDraft } from "./types";

type EditRequestLike = BookingEditRequestRecord & {
  isRejected: boolean;
  isAccepted: boolean;
  suggestedServices?: BookingEditRequestRecord["suggestedServices"];
  suggestedDateISO?: string | null;
};

export function useClientBookingOutcomeNotes(input: {
  editRequest: EditRequestLike;
  bookingStatus: ClientBookingStatus;
  activeBooking: {
    incomingEditRequest?: {
      status?: string | null;
    } | null;
  } | null;
  draft: ClientBookingDraft | null;
  isCancelled: boolean;
}) {
  /** Professional rejected client's post-confirm EBR — keep confirmed booking + show rejected note. */
  const isClientChangeRejected =
    input.editRequest.isRejected &&
    input.bookingStatus === "confirmed" &&
    Boolean(
      input.editRequest.suggestedServices?.length ||
        input.editRequest.suggestedDateISO ||
        input.activeBooking?.incomingEditRequest?.status === "rejected",
    );

  const isClientChangeAccepted =
    (input.editRequest.isAccepted ||
      input.activeBooking?.incomingEditRequest?.status === "accepted") &&
    input.bookingStatus === "confirmed";

  /** ER rejection acknowledgment panel — not used after client-EBR reject (booking stays confirmed). */
  const showRejectedResponsePanel =
    input.editRequest.isRejected &&
    !input.isCancelled &&
    !isClientChangeRejected;

  const outcomeSource = React.useMemo(
    () =>
      resolveClientBookingOutcomeSource(
        input.activeBooking?.incomingEditRequest,
        input.editRequest,
      ),
    [input.activeBooking?.incomingEditRequest, input.editRequest],
  );

  const rejectedChangesNote = React.useMemo(
    () =>
      buildRejectedChangesNote({
        isClientChangeRejected,
        outcomeSource,
        editRequest: input.editRequest,
        draft: input.draft,
      }),
    [input.draft, input.editRequest, isClientChangeRejected, outcomeSource],
  );

  const acceptedChangesNote = React.useMemo(
    () =>
      buildAcceptedChangesNote({
        isClientChangeAccepted,
        outcomeSource,
        editRequest: input.editRequest,
      }),
    [input.editRequest, isClientChangeAccepted, outcomeSource],
  );

  return {
    isClientChangeRejected,
    isClientChangeAccepted,
    showRejectedResponsePanel,
    rejectedChangesNote,
    acceptedChangesNote,
  };
}
