"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppButton from "../AppButton";
import { BodyText } from "../../ui/typography";
import { CALENDAR_CLIENT_NOT_IN_LIST_COPY } from "./calendarClientProfile";

export type CalendarClientNotInListHintProps = {
  addDisabled?: boolean;
  addDisabledReason?: string;
  adding?: boolean;
  onAdd: () => void;
};

export default function CalendarClientNotInListHint({
  addDisabled = false,
  addDisabledReason,
  adding = false,
  onAdd,
}: CalendarClientNotInListHintProps) {
  const m = useTheme().palette.mollure;
  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <BodyText
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: alpha(m.navy, 0.62),
          lineHeight: 1.35,
        }}
      >
        {CALENDAR_CLIENT_NOT_IN_LIST_COPY}
      </BodyText>
      {addDisabled && addDisabledReason ? (
        <BodyText
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: alpha(m.navy, 0.46),
            lineHeight: 1.3,
          }}
        >
          {addDisabledReason}
        </BodyText>
      ) : null}
      <Box>
        <AppButton
          variant="contained"
          disableElevation
          disabled={addDisabled || adding}
          onClick={onAdd}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 800,
            fontSize: 12,
            height: 32,
            px: 1.5,
            bgcolor: "primary.main",
            color: "#fff",
            "&:hover": { bgcolor: "mollure.tealDark" },
          }}
        >
          {adding ? "Adding…" : "Add to Client List"}
        </AppButton>
      </Box>
    </Stack>
  );
}
