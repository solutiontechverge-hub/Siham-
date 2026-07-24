"use client";

import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton } from "../common";
import type { AdminUser } from "./adminMockData";

/** Identical box for every row action — no tone/presetSize (those change height/width). */
const rootSx = {
  boxSizing: "border-box",
  textTransform: "none",
  width: 88,
  minWidth: 88,
  maxWidth: 88,
  height: 32,
  minHeight: 32,
  maxHeight: 32,
  px: 0,
  py: 0,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "30px",
  borderRadius: "8px",
  borderWidth: 1,
  borderStyle: "solid",
  "&.MuiButton-root": {
    width: 88,
    minWidth: 88,
    maxWidth: 88,
    height: 32,
    minHeight: 32,
    maxHeight: 32,
    padding: 0,
    lineHeight: "30px",
  },
} as const;

type AdminUserRowActionsProps = {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onDisable: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
};

export default function AdminUserRowActions({
  user,
  onEdit,
  onDisable,
  onDelete,
}: AdminUserRowActionsProps) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="flex-start"
      sx={{ height: 32, minHeight: 32 }}
    >
      <AppButton
        variant="outlined"
        disableElevation
        onClick={() => onEdit(user)}
        sx={{
          ...rootSx,
          borderColor: tokens.teal,
          color: tokens.teal,
          bgcolor: "#fff",
          "&:hover": {
            borderColor: tokens.tealDark,
            color: tokens.tealDark,
            bgcolor: alpha(tokens.teal, 0.06),
          },
        }}
      >
        Edit
      </AppButton>
      {user.status === "active" ? (
        <AppButton
          variant="outlined"
          disableElevation
          onClick={() => onDisable(user)}
          sx={{
            ...rootSx,
            borderColor: alpha(tokens.navy, 0.22),
            color: alpha(tokens.navy, 0.78),
            bgcolor: "#fff",
            "&:hover": {
              borderColor: alpha(tokens.navy, 0.4),
              color: tokens.navy,
              bgcolor: alpha(tokens.navy, 0.04),
            },
          }}
        >
          Disable
        </AppButton>
      ) : (
        <AppButton
          variant="outlined"
          disableElevation
          onClick={() => onDelete(user)}
          sx={{
            ...rootSx,
            borderColor: alpha("#E85D5D", 0.7),
            color: "#E85D5D",
            bgcolor: "#fff",
            "&:hover": {
              borderColor: "#E85D5D",
              color: "#D14C4C",
              bgcolor: alpha("#E85D5D", 0.06),
            },
          }}
        >
          Delete
        </AppButton>
      )}
    </Stack>
  );
}
