type ApiErrorShape = {
  data?: {
    message?: string;
  };
  message?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as ApiErrorShape).data?.message === "string"
  ) {
    return (error as ApiErrorShape).data?.message ?? fallbackMessage;
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
