/**
 * Safe HTTP error responses: log full details server-side; never send
 * stack traces, DB/driver text, or raw Error.message for 5xx to clients.
 */

export function logError(context, error) {
  console.error(context, error);
}

export function isClientError(error) {
  const code = Number(error?.statusCode);
  return Number.isInteger(code) && code >= 400 && code < 500;
}

/** Multer / upload filter errors are authored for clients. */
function isUploadClientError(error) {
  if (error?.code === "LIMIT_FILE_SIZE") return true;
  if (error?.code === "LIMIT_UNEXPECTED_FILE") return true;
  if (typeof error?.message !== "string") return false;
  return (
    /\ballowed\b/i.test(error.message) ||
    /file content/i.test(error.message) ||
    /unsupported file/i.test(error.message) ||
    /empty file upload/i.test(error.message)
  );
}

export function clientErrorStatus(error, fallback = 500) {
  if (isUploadClientError(error)) return 400;
  return isClientError(error) ? error.statusCode : fallback;
}

export function clientErrorMessage(error, fallback) {
  if (error?.code === "LIMIT_FILE_SIZE") return "File too large.";
  if (error?.code === "LIMIT_UNEXPECTED_FILE") return "Unexpected file field.";
  if (isUploadClientError(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  if (
    isClientError(error) &&
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }
  return fallback;
}

/** Express catch helper: log full error, return sanitized JSON envelope. */
export function sendCaughtError(
  res,
  error,
  { fallbackMessage, context, fallbackStatus = 500 } = {},
) {
  const label = context || fallbackMessage || "Request failed";
  logError(label, error);
  return res.status(clientErrorStatus(error, fallbackStatus)).json({
    success: false,
    message: clientErrorMessage(error, fallbackMessage || "Internal server error."),
    data: null,
  });
}
