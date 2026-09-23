/**
 * Run with: npx --yes tsx src/components/common/client-booking/useClientBookingLineChangeTags.test.ts
 */
import assert from "node:assert/strict";
import {
  resolveClientChangesAwaitingApproval,
  resolveClientVisibleEditedServiceIds,
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

// Silent Updated + leftover edited ids must NOT invent Pending/Edited approval.
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
      silentUpdated: true,
      lastEditedBy: "professional",
      editedServiceIds: ["eyelash", "guest-eyelash"],
      responseStatus: undefined,
    },
  }),
  false,
  "silent Updated must not await approval from leftover editedServiceIds",
);

// Real professional suggestion still awaits approval.
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
      lastEditedBy: "professional",
      editedServiceIds: ["eyelash"],
      responseStatus: "suggestion_for_change",
    },
  }),
  true,
  "suggestion_for_change still awaits client approval",
);

assert.equal(
  resolveLineTagComparisonMode({
    clientChangesAwaitingApproval: false,
    isEbrIncoming: false,
    bookingStatus: "confirmed",
    bookingNotesMeta: { silentUpdated: true },
    clientVisibleEditedServiceIds: undefined,
    clientVisibleAddedServiceIds: [],
    clientVisibleCancelledServiceIds: [],
  }),
  "silent_updated",
  "silent Updated opens silent_updated comparison mode",
);

// Screenshot regression: silent-only + leftover editedServiceIds + stale
// editRequest.isSuggested must show Updated path, never Edited on every line.
const screenshotSilentMeta = {
  silentUpdated: true,
  lastEditedBy: "professional" as const,
  editedServiceIds: [
    "eyelash",
    "muhammad-umer-arshad",
    "guest-eyelash",
    "guest-muhammad",
  ],
  responseStatus: "suggestion_for_change" as const,
};
assert.equal(
  resolveHasProfessionalSuggestedEdits({
    isCancelled: false,
    isEbrIncoming: false,
    isIncomingConfirmedEr: false,
    editRequest: {
      status: "suggested",
      isAccepted: false,
      isRejected: false,
      isSuggested: true,
    },
    bookingNotesMeta: screenshotSilentMeta,
  }),
  false,
  "stale suggested editRequest must not override silentUpdated",
);
assert.equal(
  resolveClientChangesAwaitingApproval({
    hasProfessionalSuggestedEdits: false,
    isEbrIncoming: false,
    editRequestIsSuggested: true,
    silentOnlyVisit: true,
  }),
  false,
  "silentUpdated wins over stale editRequest.isSuggested for awaiting",
);
assert.equal(
  resolveClientVisibleEditedServiceIds({
    silentOnlyVisit: true,
    mergedIds: screenshotSilentMeta.editedServiceIds,
    healedEdited: screenshotSilentMeta.editedServiceIds,
    allowHealed: true,
  }),
  undefined,
  "screenshot silent-only must not surface Edited line ids",
);
assert.equal(
  resolveLineTagComparisonMode({
    clientChangesAwaitingApproval: false,
    isEbrIncoming: false,
    bookingStatus: "confirmed",
    bookingNotesMeta: screenshotSilentMeta,
    clientVisibleEditedServiceIds: undefined,
    clientVisibleAddedServiceIds: [],
    clientVisibleCancelledServiceIds: [],
  }),
  "silent_updated",
  "screenshot silent-only opens Updated comparison, not Edited ER",
);

console.log("useClientBookingLineChangeTags.test.ts passed");
