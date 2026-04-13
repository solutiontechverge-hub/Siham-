"use client";

import Link from "next/link";
import Image from "next/image";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Paper, Stack } from "@mui/material";
import { Logo } from "../../../../../images";
import { BodyText, SubHeading } from "../../../../components/ui/typography";

export default function PasswordResetSuccessPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 88% 42%, rgba(33, 184, 191, 0.10), transparent 42%)",
          pointerEvents: "none",
        },
        "&:after": {
          content: '""',
          position: "absolute",
          left: -120,
          bottom: -130,
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: `14px solid ${alpha(m.teal, 0.10)}`,
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            pt: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: 84, sm: 96 },
              height: { xs: 20, sm: 24 },
              flexShrink: 0,
            }}
          >
            <Image
              src={Logo}
              alt="Mollure"
              fill
              priority
              sizes="96px"
              style={{ objectFit: "contain" }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 999,
                borderColor: alpha(m.navy, 0.14),
                color: m.navy,
                px: 1.25,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
              }}
            >
              EN
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="contained"
              size="small"
              sx={{
                borderRadius: 999,
                px: 1.8,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              login
            </Button>
            <Button
              component={Link}
              href="/auth/professional/login"
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 999,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                px: 1.8,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 30,
              }}
            >
              for professional
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            minHeight: "calc(100vh - 72px)",
            display: "grid",
            placeItems: "center",
            pb: 6,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 620,
              borderRadius: "6px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              boxShadow: "0 10px 30px rgba(16, 35, 63, 0.06)",
              px: { xs: 3, sm: 4.5 },
              py: { xs: 3, sm: 3.5 },
              textAlign: "center",
            }}
          >
            <Stack spacing={1.5} alignItems="center">
              <SubHeading sx={{ fontSize: 22, color: m.navy, lineHeight: 1.2 }}>Password Reset</SubHeading>
              <BodyText sx={{ color: alpha(m.navy, 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
                Your Password Has Been Successfully Reset
              </BodyText>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                disableElevation
                sx={{
                  mt: 1,
                  width: "100%",
                  maxWidth: 360,
                  borderRadius: "4px",
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: m.teal,
                  "&:hover": { bgcolor: m.tealDark },
                  minHeight: 38,
                }}
              >
                Login
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
