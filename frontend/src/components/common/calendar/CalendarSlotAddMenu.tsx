"use client";

import { Menu, MenuItem } from "@mui/material";
import { CALENDAR_ADD_MENU_ITEMS } from "./calendarAddMenuItems";

export type CalendarSlotAddAction = "booking" | "blocked";

type CalendarSlotAddMenuProps = {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onSelect: (action: CalendarSlotAddAction) => void;
};

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
      {CALENDAR_ADD_MENU_ITEMS.map((item) => (
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
