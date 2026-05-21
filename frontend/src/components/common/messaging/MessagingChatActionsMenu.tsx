"use client";

import * as React from "react";
import { Menu, MenuItem } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type MessagingChatAction = "delete" | "block" | "link" | "report";

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: MessagingChatAction) => void;
};

export default function MessagingChatActionsMenu({ anchorEl, open, onClose, onAction }: Props) {
  const m = useTheme().palette.mollure;
  const items: { action: MessagingChatAction; label: string }[] = [
    { action: "delete", label: "Delete" },
    { action: "block", label: "Block" },
    { action: "link", label: "Link to Booking" },
    { action: "report", label: "Report" },
  ];

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
          onClick={() => {
            onClose();
            onAction(item.action);
          }}
          sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.62), py: 1 }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
