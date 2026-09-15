import { alpha, type Theme } from "@mui/material/styles";

export function getProfileMenuInitials(emailOrName?: string) {
  const base = (emailOrName ?? "").trim();
  if (!base) return "U";
  const cleaned = base.split("@")[0] ?? base;
  const parts = cleaned.split(/[._\s-]+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

export function profileMenuOutlinedBtnSx(tokens: Theme["palette"]["mollure"]) {
  return {
    borderRadius: "8px",
    textTransform: "none" as const,
    fontWeight: 700,
    color: tokens.navy,
    borderColor: tokens.border,
    py: 1.1,
    "&:hover": {
      borderColor: tokens.inputBorderHover,
      bgcolor: "rgba(52, 74, 102, 0.03)",
    },
  } as const;
}

export function profileMenuActiveBtnSx(tokens: Theme["palette"]["mollure"]) {
  const outlined = profileMenuOutlinedBtnSx(tokens);
  return {
    ...outlined,
    fontWeight: 800,
    color: tokens.tealDark,
    borderColor: tokens.teal,
    bgcolor: alpha(tokens.teal, 0.12),
    "&:hover": {
      borderColor: tokens.tealDark,
      bgcolor: alpha(tokens.teal, 0.18),
    },
  } as const;
}
