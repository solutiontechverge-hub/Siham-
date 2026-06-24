"use client";

import * as React from "react";
import { Box, Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureModal from "../MollureModal";
import { BodyText } from "../../ui/typography";

type CalendarServiceColorEditModalProps = {
  open: boolean;
  serviceLabel: string;
  color: string;
  onClose: () => void;
  onApply: (color: string) => void;
};

export default function CalendarServiceColorEditModal({
  open,
  serviceLabel,
  color,
  onClose,
  onApply,
}: CalendarServiceColorEditModalProps) {
  const m = useTheme().palette.mollure;
  const [draftColor, setDraftColor] = React.useState(color || "#22B8A7");

  React.useEffect(() => {
    if (open) setDraftColor(color || "#22B8A7");
  }, [color, open]);

  return (
    <MollureModal
      open={open}
      onClose={onClose}
      title={`${serviceLabel} colour`}
      maxWidth="xs"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 38,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                minWidth: 110,
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 1.25 }}>
          Choose a background colour for this service on the calendar.
        </BodyText>
        <Button
          component="label"
          variant="outlined"
          fullWidth
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 800,
            height: 42,
            borderColor: alpha(m.navy, 0.12),
            color: alpha(m.navy, 0.72),
            justifyContent: "flex-start",
            px: 1.5,
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "6px",
              bgcolor: draftColor,
              border: `1px solid ${alpha(m.navy, 0.14)}`,
            }}
          />
          <span>Choose color</span>
          <input
            type="color"
            value={draftColor}
            onChange={(e) => {
              const nextColor = e.target.value;
              setDraftColor(nextColor);
              onApply(nextColor);
              e.currentTarget.blur();
            }}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          />
        </Button>
      </Box>
    </MollureModal>
  );
}
