type ApiErrorShape = {
  data?: {
    message?: string;
    data?: {
      errors?: Array<{ message?: string; msg?: string; path?: string }>;
      error?: string;
    };
    errors?: Array<{ message?: string; msg?: string; path?: string }>;
  };
  message?: string;
};

const SERVER_UNREACHABLE =
  "Unable to connect right now. Please check your connection and try again.";

function readErrorText(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  if (
    "error" in error &&
    typeof (error as { error?: unknown }).error === "string"
  ) {
    const raw = String((error as { error: string }).error).trim();
    if (raw) return raw;
  }
  if (
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return String((error as { message: string }).message).trim();
  }
  if (error instanceof Error) return error.message.trim();
  return "";
}

/** RTK Query / fetch aborts — not offline; callers should skip user-facing toasts. */
export function isApiRequestAborted(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const status = (error as { status?: unknown }).status;
  if (status === "ABORT_ERROR" || status === "CANCELLED") return true;
  return /abort(ed|error)?|cancell?ed/i.test(readErrorText(error));
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (isApiRequestAborted(error)) {
    return "";
  }

  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as ApiErrorShape).data;
    if (typeof data?.message === "string" && data.message.trim()) {
      const nestedErrors = data.data?.errors ?? data.errors;
      if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
        const detail = nestedErrors
          .map((item) => item.message || item.msg)
          .filter(Boolean)
          .join(" ");
        if (detail) return `${data.message} ${detail}`.trim();
      }
      if (typeof data.data?.error === "string" && data.data.error.trim()) {
        return `${data.message} (${data.data.error})`.trim();
      }
      return data.message;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "string" &&
    String((error as { error: string }).error).trim()
  ) {
    const raw = String((error as { error: string }).error).trim();
    if (/failed to fetch|networkerror|load failed/i.test(raw)) {
      return SERVER_UNREACHABLE;
    }
    return raw;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === "FETCH_ERROR"
  ) {
    return SERVER_UNREACHABLE;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiErrorShape).message === "string"
  ) {
    const msg = (error as ApiErrorShape).message ?? fallbackMessage;
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return SERVER_UNREACHABLE;
    }
    return msg;
  }

  return fallbackMessage;
};
