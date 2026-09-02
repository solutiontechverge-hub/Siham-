"use client";

import { Menu, MenuItem } from "@mui/material";

export type CalendarSlotAddAction = "booking" | "blocked";

type CalendarSlotAddMenuProps = {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onSelect: (action: CalendarSlotAddAction) => void;
};

const menuItems = [
  { label: "Booking", key: "booking" as const },
  { label: "Blocked time", key: "blocked" as const },
];

export default function CalendarSlotAddMenu({
  anchorPosition,
  onClose,
  onSelect,
}: CalendarSlotAddMenuProps) {
  return (
    <Menu
      open={Boolean(anchorPosition)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      {menuItems.map((item) => (
        <MenuItem
          key={item.key}
          onClick={() => {
            onSelect(item.key);
            onClose();
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
