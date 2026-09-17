"use client";

import { Menu, MenuItem } from "@mui/material";
import { CALENDAR_ADD_MENU_ITEMS } from "./calendarAddMenuItems";

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

export default function CalendarAddMenu({
  anchorEl,
  onBlockedTime,
  onBooking,
  onClose,
  bookingDisabled = false,
}: CalendarAddMenuProps) {
  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      {CALENDAR_ADD_MENU_ITEMS.map((item) => {
        const isBooking = item.key === "booking";
        const disabled = isBooking && bookingDisabled;
        return (
          <MenuItem
            key={item.key}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
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
