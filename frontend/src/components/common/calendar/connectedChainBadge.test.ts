/**
 * Run with: npx --yes tsx src/components/common/calendar/connectedChainBadge.test.ts
 */
import assert from "node:assert/strict";
import {
  hideConnectedChainStatusBadge,
  resolveConnectedChainBlockStatus,
} from "./connectedChainBadge";

assert.equal(
  hideConnectedChainStatusBadge({
    isAnchor: true,
    blockStatus: "Confirmed",
    chainStatus: "Confirmed",
  }),
  false,
  "anchor always shows badge",
);

assert.equal(
  hideConnectedChainStatusBadge({
    isAnchor: false,
    blockStatus: "Confirmed",
    chainStatus: "Confirmed",
  }),
  true,
  "uniform non-anchor hides badge",
);

assert.equal(
  hideConnectedChainStatusBadge({
    isAnchor: false,
    blockStatus: "No Show",
    chainStatus: "Confirmed",
  }),
  false,
  "divergent non-anchor shows own badge",
);

assert.equal(
  resolveConnectedChainBlockStatus(
    {
      status: "Confirmed",
      details: { cancelledServiceIds: ["svc-2"] },
    },
    { serviceId: "svc-2" },
  ),
  "Cancelled",
);

assert.equal(
  resolveConnectedChainBlockStatus(
    {
      status: "Confirmed",
      details: { noShowParticipantIds: ["guest-1"] },
    },
    { guestId: "guest-1", serviceId: "svc-g" },
  ),
  "No Show",
);

assert.equal(
  resolveConnectedChainBlockStatus(
    {
      status: "Confirmed",
      details: { noShowParticipantIds: ["client"] },
    },
    { serviceId: "svc-main", guestId: null },
  ),
  "No Show",
);

assert.equal(
  resolveConnectedChainBlockStatus(
    {
      status: "Confirmed",
      details: { noShowParticipantIds: ["guest-1"] },
    },
    { serviceId: "svc-main", guestId: null },
  ),
  "Confirmed",
);

console.log("connectedChainBadge.test.ts: ok");
