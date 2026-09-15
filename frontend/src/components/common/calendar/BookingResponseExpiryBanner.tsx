"use client";

import AppButton from "../AppButton";
import { Box, Stack, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

type Props = {
  message?: string;
  onRestart?: () => void;
  onDiscard?: () => void;
  restartDisabled?: boolean;
  discardDisabled?: boolean;
};

export default function BookingResponseExpiryBanner({
  message = "This request has not been responded to in time.",
  onRestart,
  onDiscard,
  restartDisabled = false,
  discardDisabled = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const showActions = Boolean(onRestart || onDiscard);

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha("#E85D5D", 0.35)}`,
        bgcolor: alpha("#E85D5D", 0.06),
        px: 1.5,
        py: 1.25,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <WarningAmberRoundedIcon
          sx={{ fontSize: 20, color: "#E85D5D", mt: 0.15, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={mollureLabelSx(m.navy, {
              color: alpha(m.navy, 0.82),
              lineHeight: 1.45,
            })}
          >
            {message}
          </Typography>
          {showActions ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.1 }} flexWrap="wrap">
              {onRestart ? (
                <AppButton
                  tone="secondary"
                  disabled={restartDisabled}
                  onClick={onRestart}
                  sx={{
                    borderRadius: "8px",
                    fontSize: 12,
                    fontWeight: 800,
                    height: 32,
                    px: 1.75,
                  }}
                >
                  Restart
                </AppButton>
              ) : null}
              {onDiscard ? (
                <AppButton
                  tone="secondary"
                  disabled={discardDisabled}
                  onClick={onDiscard}
                  sx={{
                    borderRadius: "8px",
                    fontSize: 12,
                    fontWeight: 800,
                    height: 32,
                    px: 1.75,
                  }}
                >
                  Discard
                </AppButton>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
