import { describe, expect, it } from "vitest";
import { getApiErrorMessage, isApiRequestAborted } from "./api-error";

describe("api-error", () => {
  it("does not treat aborted requests as offline", () => {
    const aborted = {
      status: "FETCH_ERROR",
      error: "AbortError: The user aborted a request.",
    };
    expect(isApiRequestAborted(aborted)).toBe(true);
    expect(getApiErrorMessage(aborted, "fallback")).toBe("");
  });

  it("maps failed fetch to the shared offline message", () => {
    const offline = {
      status: "FETCH_ERROR",
      error: "TypeError: Failed to fetch",
    };
    expect(isApiRequestAborted(offline)).toBe(false);
    expect(getApiErrorMessage(offline, "fallback")).toBe(
      "Unable to connect right now. Please check your connection and try again.",
    );
  });

  it("prefers API validation messages", () => {
    expect(
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
    ).toBe("Validation failed. business_setup_id must be a valid UUID.");
  });
});
