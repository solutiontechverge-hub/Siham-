"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { apiUrl } from "../../../lib/api";

type ForgotPasswordResponse = {
  success: boolean;
  message: string;
  data: null;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send OTP right now.");
      }

      setSuccessMessage(
        result.message || "OTP sent to your email if it exists in our system.",
      );
      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      window.setTimeout(() => {
        router.push("/auth/reset-password/verify-otp");
      }, 700);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while sending the OTP.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, md: 8 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #00c2b8 0%, #1177ff 100%)",
                  boxShadow: "0 12px 30px rgba(17, 119, 255, 0.22)",
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#10233f",
                }}
              >
                Mollure
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                EN
              </Button>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#00b3b3",
                  "&:hover": {
                    backgroundColor: "#009c9c",
                  },
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/auth/professional/login"
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                For professional
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 620,
                borderRadius: "32px",
                px: { xs: 3, sm: 5 },
                py: { xs: 4, sm: 5 },
                backgroundColor: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(16, 35, 63, 0.08)",
                boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)",
              }}
            >
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: "-0.05em",
                      color: "#10233f",
                      fontSize: { xs: "2rem", sm: "2.75rem" },
                    }}
                  >
                    Forget Password
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.5,
                      color: alpha("#10233f", 0.72),
                      fontSize: "1rem",
                    }}
                  >
                    No worries, we&apos;ll send you reset instructions.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      type="email"
                      label="Email Address"
                      placeholder="e.g. jane@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      fullWidth
                      autoComplete="email"
                      InputLabelProps={{ shrink: true }}
                    />

                    {successMessage ? (
                  <Alert severity="success">{successMessage}</Alert>
                    ) : null}

                    {errorMessage ? (
                      <Alert severity="error">{errorMessage}</Alert>
                    ) : null}

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{
                        minHeight: 54,
                        borderRadius: 999,
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
                        boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)",
                      }}
                    >
                      {isSubmitting ? (
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <CircularProgress size={18} sx={{ color: "#fff" }} />
                          <span>Sending...</span>
                        </Stack>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
