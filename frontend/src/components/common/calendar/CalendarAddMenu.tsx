"use client";

import { Menu, MenuItem } from "@mui/material";

type CalendarAddMenuProps = {
  anchorEl: HTMLElement | null;
  onBlockedTime: () => void;
  onBooking: () => void;
  onDesign: () => void;
  onPublicBusinessHours: () => void;
  onClose: () => void;
  onMockAction: (label: string) => void;
};

const addMenuItems = [
  { label: "Booking", key: "booking" },
  { label: "Blocked time", key: "blocked" },
] as const;

export default function CalendarAddMenu({
  anchorEl,
  onBlockedTime,
  onBooking,
  onClose,
}: CalendarAddMenuProps) {
  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      {addMenuItems.map((item) => (
        <MenuItem
          key={item.key}
          onClick={() => {
            onClose();
            if (item.key === "booking") {
              onBooking();
              return;
            }
            onBlockedTime();
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
