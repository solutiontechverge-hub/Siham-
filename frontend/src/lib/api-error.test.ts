/**
 * Run with: npx --yes tsx src/lib/api-error.test.ts
 */
import assert from "node:assert/strict";
import { getApiErrorMessage, isApiRequestAborted } from "./api-error";

const aborted = {
  status: "FETCH_ERROR",
  error: "AbortError: The user aborted a request.",
};
assert.equal(isApiRequestAborted(aborted), true);
assert.equal(getApiErrorMessage(aborted, "fallback"), "");

const offline = {
  status: "FETCH_ERROR",
  error: "TypeError: Failed to fetch",
};
assert.equal(isApiRequestAborted(offline), false);
assert.equal(
  getApiErrorMessage(offline, "fallback"),
  "Unable to connect right now. Please check your connection and try again.",
);

assert.equal(
  getApiErrorMessage(
    {
      status: 400,
      data: {
        message: "Validation failed.",
        data: { errors: [{ message: "business_setup_id must be a valid UUID." }] },
      },
    },
    "fallback",
  ),
  "Validation failed. business_setup_id must be a valid UUID.",
);

console.log("api-error.test.ts: ok");
