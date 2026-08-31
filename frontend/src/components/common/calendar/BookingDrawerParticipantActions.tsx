"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, ButtonBase, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

export type BookingDrawerParticipantKind =
  | "guest"
  | "model"
  | "planning"
  | "buffer";

type BookingDrawerParticipantActionsProps = {
  kinds: readonly BookingDrawerParticipantKind[];
  disabled?: boolean;
  nameFieldOpen?: boolean;
  onAddGuest?: () => void;
  onAddModel?: () => void;
  onAddPlanning?: () => void;
  onAddBuffer?: () => void;
};

const LABELS: Record<BookingDrawerParticipantKind, string> = {
  guest: "Guest",
  model: "Model",
  planning: "Planning",
  buffer: "Buffer",
};

function AddPersonButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: `1px solid ${alpha(m.navy, 0.14)}`,
        borderRadius: "10px",
        height: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 1.25,
        px: 1.5,
        bgcolor: "#fff",
        "&.Mui-disabled": {
          opacity: 0.55,
          cursor: "not-allowed",
        },
      }}
    >
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "999px",
          bgcolor: m.addSoftBg,
          color: m.addSoftFg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AddRoundedIcon sx={{ fontSize: 16 }} />
      </Box>
      <BodyText
        component="span"
        sx={{
          fontSize: 12.5,
          fontWeight: 800,
          color: alpha(m.navy, 0.6),
          lineHeight: 1,
        }}
      >
        {label}
      </BodyText>
    </ButtonBase>
  );
}

export default function BookingDrawerParticipantActions({
  kinds,
  disabled = false,
  nameFieldOpen = false,
  onAddGuest,
  onAddModel,
  onAddPlanning,
  onAddBuffer,
}: BookingDrawerParticipantActionsProps) {
  const m = useTheme().palette.mollure;
  if (!kinds.length) return null;

  const handlers: Record<
    BookingDrawerParticipantKind,
    (() => void) | undefined
  > = {
    guest: onAddGuest,
    model: onAddModel,
    planning: onAddPlanning,
    buffer: onAddBuffer,
  };

  return (
    <Box
      sx={{
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.025),
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {kinds.map((kind) => {
          const needsNameField = kind === "guest" || kind === "model";
          return (
            <AddPersonButton
              key={kind}
              label={LABELS[kind]}
              onClick={() => handlers[kind]?.()}
              disabled={disabled || (needsNameField && nameFieldOpen)}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
