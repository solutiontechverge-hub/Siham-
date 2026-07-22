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

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
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
    "message" in error &&
    typeof (error as ApiErrorShape).message === "string"
  ) {
    return (error as ApiErrorShape).message ?? fallbackMessage;
  }

  return fallbackMessage;
};
