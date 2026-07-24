"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";

export type NoShowParticipant = {
  id: string;
  name: string;
};

type CalendarNoShowModalProps = {
  open: boolean;
  participants: readonly NoShowParticipant[];
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
};

const ALL_ID = "__all__";

export default function CalendarNoShowModal({
  open,
  participants,
  onClose,
  onConfirm,
}: CalendarNoShowModalProps) {
  const m = useTheme().palette.mollure;
  const hasAllOption = participants.length > 1;

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) {
      setSelected(new Set(participants.map((p) => p.id)));
    }
  }, [open, participants]);

  const allSelected =
    participants.length > 0 && selected.size === participants.length;

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(participants.map((p) => p.id)),
    );
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkboxSx = {
    color: alpha(m.navy, 0.3),
    p: 0.5,
    "&.Mui-checked": { color: m.teal },
  } as const;

  const rows: Array<{
    id: string;
    name: string;
    checked: boolean;
    onToggle: () => void;
  }> = [
    ...(hasAllOption
      ? [
          {
            id: ALL_ID,
            name: "All Participant",
            checked: allSelected,
            onToggle: toggleAll,
          },
        ]
      : []),
    ...participants.map((p) => ({
      id: p.id,
      name: p.name,
      checked: selected.has(p.id),
      onToggle: () => toggleOne(p.id),
    })),
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="No Show"
      maxWidth="sm"
      fullWidth
      headerTone="danger"
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: alpha(m.navy, 0.02),
            p: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color: alpha(m.navy, 0.6),
              mb: 1.25,
            }}
          >
            Mark The Entire Booking As No Show Or Select Individual Persons
          </Typography>
          <Stack spacing={1}>
            {rows.map((row) => (
              <Stack
                key={row.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={row.onToggle}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  bgcolor: "#fff",
                  px: 1.5,
                  py: 1.1,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  "&:hover": { borderColor: alpha(m.teal, 0.4) },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.75),
                  }}
                >
                  {row.name}
                </Typography>
                <Checkbox
                  checked={row.checked}
                  onChange={row.onToggle}
                  sx={checkboxSx}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" justifyContent="center" spacing={1.5}>
          <AppButton
            tone="secondary"
            onClick={onClose}
            sx={{
              height: 40,
              minWidth: 120,
            }}
          >
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            disabled={selected.size === 0}
            onClick={() => onConfirm([...selected])}
            sx={{
              height: 40,
              minWidth: 120,
            }}
          >
            Save
          </AppButton>
        </Stack>
      </Box>
    </AppModal>
  );
}
