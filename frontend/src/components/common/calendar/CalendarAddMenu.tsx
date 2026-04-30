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
  { label: "Public Business Hours", key: "public-hours" },
  { label: "Design", key: "design" },
  { label: "Add Note", key: "note" },
] as const;

export default function CalendarAddMenu({
  anchorEl,
  onBlockedTime,
  onBooking,
  onDesign,
  onPublicBusinessHours,
  onClose,
  onMockAction,
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
            if (item.key === "blocked") {
              onBlockedTime();
              return;
            }
            if (item.key === "public-hours") {
              onPublicBusinessHours();
              return;
            }
            if (item.key === "design") {
              onDesign();
              return;
            }
            onMockAction(item.label);
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
