"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, ButtonBase, Stack, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

export type BookingDrawerParticipantKind =
  | "guest"
  | "model"
  | "guestModel"
  | "planning"
  | "buffer";

type BookingDrawerParticipantActionsProps = {
  kinds: readonly BookingDrawerParticipantKind[];
  disabled?: boolean;
  nameFieldOpen?: boolean;
  /** `inline` sits beside other add controls; `panel` is the sticky footer strip. */
  variant?: "panel" | "inline";
  onAddGuest?: () => void;
  onAddModel?: () => void;
  onAddGuestModel?: () => void;
  onAddPlanning?: () => void;
  onAddBuffer?: () => void;
};

const LABELS: Record<BookingDrawerParticipantKind, string> = {
  guest: "Add Guest",
  model: "Add Model",
  guestModel: "Add Guest/Model",
  planning: "Add Planning",
  buffer: "Add Buffer",
};

const HINTS: Partial<Record<BookingDrawerParticipantKind, string>> = {
  planning: "Client-facing",
  buffer: "Internal-only",
};

function AddPersonButton({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const m = useTheme().palette.mollure;
  const button = (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-label={hint ? `${label} (${hint})` : label}
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
        flexShrink: 0,
        whiteSpace: "nowrap",
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
        sx={mollureLabelSx(m.navy, {
          color: alpha(m.navy, 0.6),
          lineHeight: 1,
        })}
      >
        {label}
      </BodyText>
    </ButtonBase>
  );

  if (!hint) return button;
  return (
    <Tooltip title={hint} enterDelay={400}>
      <Box component="span" sx={{ display: "inline-flex", flexShrink: 0 }}>
        {button}
      </Box>
    </Tooltip>
  );
}

export default function BookingDrawerParticipantActions({
  kinds,
  disabled = false,
  nameFieldOpen = false,
  variant = "panel",
  onAddGuest,
  onAddModel,
  onAddGuestModel,
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
    guestModel: onAddGuestModel ?? onAddGuest ?? onAddModel,
    planning: onAddPlanning,
    buffer: onAddBuffer,
  };

  const buttons = (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{
        flexWrap: "nowrap",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        "&::-webkit-scrollbar": { height: 0 },
      }}
    >
      {kinds.map((kind) => {
        const needsNameField =
          kind === "guest" || kind === "model" || kind === "guestModel";
        return (
          <AddPersonButton
            key={kind}
            label={LABELS[kind]}
            hint={HINTS[kind]}
            onClick={() => handlers[kind]?.()}
            disabled={disabled || (needsNameField && nameFieldOpen)}
          />
        );
      })}
    </Stack>
  );

  if (variant === "inline") return buttons;

  return (
    <Box
      sx={{
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.025),
        p: 1.5,
      }}
    >
      {buttons}
    </Box>
  );
}
