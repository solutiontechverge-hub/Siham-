import assert from "node:assert/strict";
import { isClientIncomingProfessionalEbr } from "./bookingEventDetails";

assert.equal(
  isClientIncomingProfessionalEbr({
    status: "pending",
    lastEditedBy: "professional",
  }),
  true,
  "Restart→EBR pending from professional",
);

assert.equal(
  isClientIncomingProfessionalEbr({
    status: "pending",
    lastEditedBy: "client",
  }),
  false,
  "Client-sent pending EBR is not incoming to client",
);

assert.equal(
  isClientIncomingProfessionalEbr(
    { status: "pending" },
    "outgoing",
  ),
  true,
  "Pro-POV outgoing notes → client incoming EBR",
);

assert.equal(
  isClientIncomingProfessionalEbr({ status: "suggested" }),
  true,
  "Legacy suggested EBR without editor",
);

assert.equal(
  isClientIncomingProfessionalEbr({ status: "accepted" }),
  false,
  "Settled EBR is not incoming",
);

console.log("isClientIncomingProfessionalEbr.test.ts: ok");
