/**
 * Run with: node src/services/professionalClientMollure.test.js
 */
import assert from "node:assert/strict";
import {
  MOLLURE_EMAIL_ALREADY_REGISTERED,
  mollureClientEmailCreateConflict,
  shouldPromoteProfessionalClientToMollure,
} from "./professional-clients.service.js";

assert.equal(shouldPromoteProfessionalClientToMollure(null), true);
assert.equal(
  shouldPromoteProfessionalClientToMollure({ is_mollure: true, mollure_user_id: null }),
  true,
);
assert.equal(
  shouldPromoteProfessionalClientToMollure({
    is_mollure: true,
    mollure_user_id: "u-1",
  }),
  true,
);
assert.equal(
  shouldPromoteProfessionalClientToMollure({
    is_mollure: false,
    mollure_user_id: "u-1",
  }),
  true,
);
assert.equal(
  shouldPromoteProfessionalClientToMollure({
    is_mollure: false,
    mollure_user_id: null,
  }),
  false,
);

assert.equal(
  MOLLURE_EMAIL_ALREADY_REGISTERED,
  "This email is already registered as a Mollure client.",
);
assert.equal(mollureClientEmailCreateConflict(null), null);
assert.equal(
  mollureClientEmailCreateConflict({ id: "u-1" }),
  "This email is already registered as a Mollure client.",
);

console.log("professionalClientMollure.test.js: ok");
