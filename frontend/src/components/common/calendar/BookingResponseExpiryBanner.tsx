"use client";

import AppButton from "../AppButton";
import { Box, Stack, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";

type Props = {
  message?: string;
  onRestart?: () => void;
  restartDisabled?: boolean;
};

const DEFAULT_MESSAGE =
  "The Client Hasn't Responded In Time And Is Still Able To Respond. You Can Restart The Response Time Or You Can Discard The BR.";

export default function BookingResponseExpiryBanner({
  message = DEFAULT_MESSAGE,
  onRestart,
  restartDisabled = false,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.teal, 0.28)}`,
        bgcolor: alpha(m.teal, 0.08),
        px: 1.5,
        py: 1.25,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <InfoOutlinedIcon
          sx={{ fontSize: 20, color: m.teal, mt: 0.15, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={mollureLabelSx(m.teal, {
              color: m.teal,
              lineHeight: 1.45,
            })}
          >
            {message}
          </Typography>
          {onRestart ? (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.1 }}>
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
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
