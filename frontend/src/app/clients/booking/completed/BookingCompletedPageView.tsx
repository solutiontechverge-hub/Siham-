"use client";

import AppButton from "../../../../components/common/AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureBodyMutedSx, mollurePageTitleSx } from "../../../../theme/mollureHierarchy";
import { useBookingCompletedPage } from "./useBookingCompletedPage";

export default function BookingCompletedPageView() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { title, secondsLeft, goToBookings, copy } = useBookingCompletedPage();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "mollure.pageBg",
        py: { xs: 2.5, md: 3.5 },
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
            minHeight: { xs: 360, md: 460 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Box sx={{ px: 3 }}>
            <Stack spacing={1.6} alignItems="center">
              <Box
                sx={{
                  width: 62,
                  height: 62,
                  borderRadius: "999px",
                  border: `2px solid ${m.teal}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: m.teal,
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 34 }} />
              </Box>
              <Typography sx={mollurePageTitleSx(m.navy)}>
                {title}
              </Typography>
              <Typography
                sx={mollureBodyMutedSx(m.navy)}
              >
                {copy.redirectLabel(secondsLeft)}
              </Typography>
              <AppButton
                tone="primary"
                onClick={goToBookings}
                sx={{ mt: 0.5, borderRadius: "8px" }}
              >
                {copy.viewBookingLabel}
              </AppButton>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
