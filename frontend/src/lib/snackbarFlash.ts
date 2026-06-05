import type { SnackbarSeverity } from "../components/common/AppSnackbar";

export type SnackbarFlashPayload = {
  message: string;
  severity?: SnackbarSeverity;
  autoHideDurationMs?: number;
};

const STORAGE_KEY = "mollure:snackbar_flash";

export function queueSnackbarFlash(payload: SnackbarFlashPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore (storage disabled)
  }
}

export function peekSnackbarFlash(): SnackbarFlashPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SnackbarFlashPayload;
  } catch {
    return null;
  }
}

export function clearSnackbarFlash() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function consumeSnackbarFlash(): SnackbarFlashPayload | null {
  const flash = peekSnackbarFlash();
  if (flash) clearSnackbarFlash();
  return flash;
}
