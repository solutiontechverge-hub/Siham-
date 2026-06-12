export type MollureSnackbarSeverity = "success" | "error" | "warning" | "info";

export type MollureSnackbarColors = {
  background: string;
  foreground: string;
};

/** Light snackbar surfaces — very pale bg + stronger tone for text/close icon */
export const MOLLURE_SNACKBAR_COLORS: Record<MollureSnackbarSeverity, MollureSnackbarColors> = {
  success: {
    background: "#F0FDFA",
    foreground: "#149CA7",
  },
  error: {
    background: "#FEF2F2",
    foreground: "#DC2626",
  },
  warning: {
    background: "#FFFBEB",
    foreground: "#D97706",
  },
  info: {
    background: "#F0F9FF",
    foreground: "#0284C7",
  },
};

export function getMollureSnackbarColors(severity: MollureSnackbarSeverity): MollureSnackbarColors {
  return MOLLURE_SNACKBAR_COLORS[severity];
}
