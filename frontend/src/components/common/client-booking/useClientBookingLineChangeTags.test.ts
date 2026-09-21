/**
 * Run with: npx --yes tsx src/components/common/client-booking/useClientBookingLineChangeTags.test.ts
 */
import assert from "node:assert/strict";
import {
  resolveHasProfessionalSuggestedEdits,
  resolveLineTagComparisonMode,
} from "./useClientBookingLineChangeTags";

// Fresh Requested booking: no professional suggestion → no awaiting / no Edited.
assert.equal(
  resolveHasProfessionalSuggestedEdits({
    isCancelled: false,
    isEbrIncoming: false,
    isIncomingConfirmedEr: false,
    editRequest: {
      status: "none",
      isAccepted: false,
      isRejected: false,
      isSuggested: false,
    },
    bookingNotesMeta: {
      // originalServices alone must not count as a professional edit.
      originalServices: [
        { id: "hair", name: "hair dye", price: 44, durationMins: 60 },
      ],
      services: [
        { id: "hair", name: "hair dye", price: 44, durationMins: 60 },
        {
          id: "buzz",
          name: "buzz cutt",
          price: 44,
          durationMins: 15,
          guestId: "g1",
        },
      ],
    },
  }),
  false,
  "fresh create must not flag professional suggested edits",
);

assert.equal(
  resolveLineTagComparisonMode({
    clientChangesAwaitingApproval: false,
    isEbrIncoming: false,
    bookingStatus: "requested",
    bookingNotesMeta: null,
    clientVisibleEditedServiceIds: undefined,
    clientVisibleAddedServiceIds: [],
    clientVisibleCancelledServiceIds: [],
  }),
  "ebr",
  "requested without line edits still uses ebr mode for Activity drill-in",
);

assert.equal(
  resolveLineTagComparisonMode({
    clientChangesAwaitingApproval: false,
    isEbrIncoming: false,
    bookingStatus: "requested",
    bookingNotesMeta: null,
    clientVisibleEditedServiceIds: undefined,
    clientVisibleAddedServiceIds: [],
    clientVisibleCancelledServiceIds: [],
  }) === "ebr" &&
    !resolveHasProfessionalSuggestedEdits({
      isCancelled: false,
      isEbrIncoming: false,
      isIncomingConfirmedEr: false,
      editRequest: {
        status: "none",
        isAccepted: false,
        isRejected: false,
        isSuggested: false,
      },
    }),
  true,
  "new booking → no Edited badges path (no awaiting / no suggested)",
);

console.log("useClientBookingLineChangeTags.test.ts passed");
