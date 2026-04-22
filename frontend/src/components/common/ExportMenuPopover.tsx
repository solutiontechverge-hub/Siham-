"use client";

import * as React from "react";
import { Divider, Menu, MenuItem } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

export type ExportMenuOption = {
  id: string;
  label: string;
};

export type ExportMenuPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  options: readonly ExportMenuOption[];
  onSelect: (opt: ExportMenuOption) => void;
};

export default function ExportMenuPopover({ anchorEl, open, onClose, options, onSelect }: ExportMenuPopoverProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          mt: 0.75,
          minWidth: 250,
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.10)}`,
          boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
          overflow: "hidden",
          p: 0,
        },
      }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      {options.map((opt, idx) => (
        <React.Fragment key={opt.id}>
          <MenuItem
            onClick={() => onSelect(opt)}
            sx={{
              px: 1.6,
              py: 1.25,
              borderRadius: 0,
              "&:hover": { bgcolor: alpha(m.navy, 0.03) },
            }}
          >
            <BodyText sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.72) }}>{opt.label}</BodyText>
          </MenuItem>
          {idx < options.length - 1 ? <Divider sx={{ borderColor: alpha(m.navy, 0.10), m: 0 }} /> : null}
        </React.Fragment>
      ))}
    </Menu>
  );
}

