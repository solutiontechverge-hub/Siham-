"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { apiUrl } from "../../../../lib/api";

type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data?: {
    user_id: number;
  };
};

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    const savedEmail = window.sessionStorage.getItem("mollure_reset_email") || "";
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = value;
    setDigits(nextDigits);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const otp = digits.join("");
    if (otp.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
        }),
      });

      const result = (await response.json()) as VerifyOtpResponse;

      if (!response.ok || !result.success || !result.data?.user_id) {
        throw new Error(result.message || "OTP verification failed.");
      }

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      window.sessionStorage.setItem("mollure_reset_user_id", String(result.data.user_id));
      setSuccessMessage("OTP verified. You can now set a new password.");

      window.setTimeout(() => {
        router.push("/auth/reset-password/new");
      }, 700);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "OTP verification failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage("Enter your email address first.");
      return;
    }

    setIsResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const result = (await response.json()) as { success: boolean; message: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to resend OTP.");
      }

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      setSuccessMessage(result.message || "OTP sent again.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to resend OTP.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, md: 8 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 46, height: 46, borderRadius: "16px", background: "linear-gradient(135deg, #00c2b8 0%, #1177ff 100%)", boxShadow: "0 12px 30px rgba(17, 119, 255, 0.22)" }} />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.04em", color: "#10233f" }}>
                Mollure
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper elevation={0} sx={{ width: "100%", maxWidth: 620, borderRadius: "32px", px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 }, backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(16, 35, 63, 0.08)", boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)" }}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.05em", color: "#10233f", fontSize: { xs: "2rem", sm: "2.75rem" } }}>
                    Reset Password
                  </Typography>
                  <Typography sx={{ mt: 1.5, color: alpha("#10233f", 0.72), fontSize: "1rem" }}>
                    Enter the 6 digit verification code sent to your email to change your password.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                    />

                    <Stack direction="row" spacing={1.5} justifyContent="center">
                      {digits.map((digit, index) => (
                        <TextField
                          key={index}
                          value={digit}
                          onChange={(event) => handleDigitChange(index, event.target.value)}
                          inputProps={{
                            maxLength: 1,
                            inputMode: "numeric",
                            style: { textAlign: "center", fontSize: "1.2rem", fontWeight: 700 },
                          }}
                          sx={{ width: 56 }}
                        />
                      ))}
                    </Stack>

                    {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

                    <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minHeight: 54, borderRadius: 999, textTransform: "none", fontSize: "1rem", fontWeight: 800, background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)", boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)" }}>
                      {isSubmitting ? "Verifying..." : "Verify OTP"}
                    </Button>

                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      Didn&apos;t receive a code?{" "}
                      <Button type="button" variant="text" onClick={handleResend} disabled={isResending} sx={{ textTransform: "none", p: 0, minWidth: 0, fontWeight: 700 }}>
                        {isResending ? "Resending..." : "Resend"}
                      </Button>
                    </Typography>

                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      <Link href="/auth/forgot-password" style={{ color: "#00a9b4", textDecoration: "none", fontWeight: 700 }}>
                        Back to forgot password
                      </Link>
                    </Typography>
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
