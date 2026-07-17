"use client";

import * as React from "react";
import { Button, Menu, MenuItem, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingInsetOverlay from "./MessagingInsetOverlay";

export type MessagingChatAction = "clearChat" | "deleteForMe" | "deleteForEveryone" | "block" | "link" | "report";

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: MessagingChatAction) => void;
  embedded?: boolean;
};

export default function MessagingChatActionsMenu({ anchorEl, open, onClose, onAction, embedded = false }: Props) {
  const m = useTheme().palette.mollure;
  const items: { action: MessagingChatAction; label: string }[] = [
    { action: "clearChat", label: "Clear chat" },
    { action: "deleteForMe", label: "Delete for me" },
    { action: "deleteForEveryone", label: "Delete for everyone" },
    { action: "block", label: "Block" },
    { action: "link", label: "Link to Booking" },
    { action: "report", label: "Report" },
  ];

  const handleAction = (action: MessagingChatAction) => {
    onClose();
    onAction(action);
  };

  if (embedded) {
    return (
      <MessagingInsetOverlay open={open} title="Chat actions" onClose={onClose} maxWidth={320}>
        <Stack spacing={1}>
          {items.map((item) => (
            <Button
              key={item.action}
              fullWidth
              variant="outlined"
              onClick={() => handleAction(item.action)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: "10px",
                borderColor: alpha(m.navy, 0.12),
                color: alpha(m.navy, 0.72),
                py: 1.1,
                "&:hover": { borderColor: m.teal, bgcolor: alpha(m.teal, 0.04) },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </MessagingInsetOverlay>
    );
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          borderRadius: "10px",
          minWidth: 180,
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          boxShadow: "0 12px 28px rgba(16, 35, 63, 0.12)",
          py: 0.5,
        },
      }}
    >
      {items.map((item) => (
        <MenuItem
          key={item.action}
          onClick={() => handleAction(item.action)}
          sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.62), py: 1 }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
