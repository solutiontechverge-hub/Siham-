"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useForgotPasswordMutation } from "../../../store/services/authApi";
import { Logo } from "../../../../images";
import { BodyText, SubHeading } from "../../../components/ui/typography";
import { useSnackbar } from "../../../components/common/AppSnackbar";

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await forgotPassword({ email }).unwrap();

      showSnackbar({
        severity: "success",
        message: result.message || "OTP sent to your email if it exists in our system.",
      });
      window.sessionStorage.setItem(
        "mollure_reset_email",
        email.trim().toLowerCase(),
      );
      window.setTimeout(() => {
        router.push("/auth/reset-password/verify-otp");
      }, 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Something went wrong while sending the OTP."),
      });
    }
  };

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
          border: `14px solid ${alpha(m.teal, 0.1)}`,
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

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
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
              maxWidth: 520,
              borderRadius: "6px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 10px 30px rgba(16, 35, 63, 0.06)",
              px: { xs: 3, sm: 4.5 },
              py: { xs: 3, sm: 3.5 },
            }}
          >
            <Stack spacing={2.25}>
              <Box textAlign="center">
                <SubHeading sx={{ fontSize: 22, color: m.navy, lineHeight: 1.2 }}>Forget Password</SubHeading>
                <BodyText sx={{ mt: 0.75, color: alpha(m.navy, 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
                  No Worries, We&apos;ll Send You Reset Instructions
                </BodyText>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    placeholder="e.g Jane"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={isLoading}
                    sx={{
                      borderRadius: "4px",
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.tealDark },
                      minHeight: 38,
                    }}
                  >
                    {isLoading ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                        <span>Sending...</span>
                      </Stack>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>

                  <BodyText textAlign="center" sx={{ color: alpha(m.navy, 0.55), fontSize: 12 }}>
                    Remember your password?{" "}
                    <Link
                      href="/auth/login"
                      style={{
                        color: m.teal,
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      Back to login
                    </Link>
                  </BodyText>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
