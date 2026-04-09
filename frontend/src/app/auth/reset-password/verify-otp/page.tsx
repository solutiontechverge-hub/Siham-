"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
} from "../../../../store/services/authApi";
import { Logo } from "../../../../../images";

export default function VerifyOtpPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

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
    if (otp.length !== 4) {
      setErrorMessage("Please enter the 4-digit verification code.");
      return;
    }

    try {
      const result = await verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
      }).unwrap();

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      window.sessionStorage.setItem("mollure_reset_user_id", String(result.data.user_id));
      setSuccessMessage("OTP verified. You can now set a new password.");

      window.setTimeout(() => {
        router.push("/auth/reset-password/new");
      }, 700);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "OTP verification failed."));
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage("Enter your email address first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await forgotPassword({
        email: email.trim().toLowerCase(),
      }).unwrap();

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      setSuccessMessage(result.message || "OTP sent again.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to resend OTP."));
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
            }}
          >
            <Stack spacing={2.25}>
              <Box textAlign="center">
                <Typography sx={{ fontWeight: 700, color: m.navy, fontSize: 22, lineHeight: 1.2 }}>
                  Reset Password
                </Typography>
                <Typography sx={{ mt: 0.75, color: alpha(m.navy, 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
                  Enter The 4 Digit Verification Code That Was Sent To Your Email To Change Your Password
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={1.8}>
                  <Stack direction="row" spacing={1.25} justifyContent="center">
                    {digits.map((digit, index) => (
                      <TextField
                        key={index}
                        value={digit}
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        inputProps={{
                          maxLength: 1,
                          inputMode: "numeric",
                          style: {
                            textAlign: "center",
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            color: m.navy,
                          },
                        }}
                        size="small"
                        sx={{
                          width: 64,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            bgcolor: alpha(m.navy, 0.02),
                          },
                        }}
                      />
                    ))}
                  </Stack>

                  {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
                  {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={isVerifying}
                    sx={{
                      borderRadius: "4px",
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.tealDark },
                      minHeight: 38,
                    }}
                  >
                    {isVerifying ? "Verifying..." : "send OTP"}
                  </Button>

                  <Typography textAlign="center" sx={{ color: alpha(m.navy, 0.55), fontSize: 12 }}>
                    Didn&apos;t receive a code?{" "}
                    <Button
                      type="button"
                      variant="text"
                      onClick={handleResend}
                      disabled={isResending}
                      sx={{
                        textTransform: "none",
                        p: 0,
                        minWidth: 0,
                        fontWeight: 700,
                        color: m.navy,
                        "&:hover": { bgcolor: "transparent" },
                      }}
                    >
                      {isResending ? "Resending..." : "Resend"}
                    </Button>
                  </Typography>

                  <Typography textAlign="center" sx={{ color: alpha(m.navy, 0.55), fontSize: 12 }}>
                    <Link
                      href="/auth/forgot-password"
                      style={{ color: m.teal, textDecoration: "none", fontWeight: 700 }}
                    >
                      Back to forgot password
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
