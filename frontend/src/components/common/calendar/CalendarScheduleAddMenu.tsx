"use client";

import { Menu, MenuItem } from "@mui/material";

type CalendarScheduleAddMenuProps = {
  anchorEl: HTMLElement | null;
  onAvailability: () => void;
  onBlockedTime: () => void;
  onClose: () => void;
};

const menuItems = [
  { label: "Availability", key: "availability" },
  { label: "Blocked time", key: "blocked" },
] as const;

export default function CalendarScheduleAddMenu({
  anchorEl,
  onAvailability,
  onBlockedTime,
  onClose,
}: CalendarScheduleAddMenuProps) {
  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      {menuItems.map((item) => (
        <MenuItem
          key={item.key}
          onClick={() => {
            onClose();
            if (item.key === "availability") {
              onAvailability();
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
