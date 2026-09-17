"use client";

import { mollureBodySx } from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";
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
    <AppModal
      open={open}
      onClose={onClose}
      title={`${serviceLabel} colour`}
      maxWidth="xs"
      fullWidth
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="flex-end">
            <AppButton
              tone="secondary"
              onClick={onClose}
              sx={{
                height: 38,
                minWidth: 110,
              }}
            >
              Cancel
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <BodyText
          sx={{
            ...mollureBodySx(m.navy),
            mb: 1.25,
          }}
        >
          Choose a background colour for this service on the calendar.
        </BodyText>
        <AppButton
          tone="secondary"
          component="label"
          fullWidth
          sx={{
            height: 42,
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
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </AppButton>
      </Box>
    </AppModal>
  );
}
