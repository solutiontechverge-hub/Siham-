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
  /** No schedule that day, or past selected date. */
  bookingDisabled?: boolean;
  /** Past selected date — cannot add blocked time either. */
  blockedDisabled?: boolean;
};

export default function CalendarAddMenu({
  anchorEl,
  onBlockedTime,
  onBooking,
  onClose,
  bookingDisabled = false,
  blockedDisabled = false,
}: CalendarAddMenuProps) {
  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      {CALENDAR_ADD_MENU_ITEMS.map((item) => {
        const isBooking = item.key === "booking";
        const disabled = isBooking ? bookingDisabled : blockedDisabled;
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
