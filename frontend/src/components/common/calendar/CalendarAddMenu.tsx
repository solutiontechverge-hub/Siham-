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
  /** Disabled only when the selected day is marked Not Availability. */
  bookingDisabled?: boolean;
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
  bookingDisabled = false,
}: CalendarAddMenuProps) {
  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      {addMenuItems.map((item) => {
        const isBooking = item.key === "booking";
        const disabled = isBooking && bookingDisabled;
        return (
          <MenuItem
            key={item.key}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              // Run action before closing so the handler is not dropped.
              if (isBooking) onBooking();
              else onBlockedTime();
              onClose();
            }}
          >
            {item.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
