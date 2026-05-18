"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { apiUrl } from "../../../lib/api";
import {
  useResendVerificationMutation,
  useVerifyEmailOtpMutation,
} from "../../../store/services/authApi";
import { MarketingSiteHeader } from "../../../components/common";
import { authLoginHeaderClient } from "../../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../../components/ui/typography";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { SignupBg, SignupLs, SignupRs } from "../../../../images";

const OTP_LEN = 6;

export default function VerifyEmailPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState<string[]>(() => Array(OTP_LEN).fill(""));
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [verifyEmailOtp, { isLoading: isVerifying }] = useVerifyEmailOtpMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [isVerifyingLink, setIsVerifyingLink] = React.useState(false);

  const loginPath = searchParams.get("login") || "/auth/login";
  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  React.useEffect(() => {
    const savedEmail =
      searchParams.get("email") ||
      window.sessionStorage.getItem("mollure_verify_email") ||
      "";
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      return;
    }

    const verifyFromLink = async () => {
      setIsVerifyingLink(true);
      try {
        const response = await fetch(
          apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
          { method: "GET" },
        );
        const data = (await response.json()) as { success?: boolean; message?: string };

        if (!response.ok || !data.success) {
          showSnackbar({
            severity: "error",
            message: data.message || "Verification link is invalid or expired.",
          });
          return;
        }

        showSnackbar({
          severity: "success",
          message: data.message || "Email verified. You can log in now.",
        });
        window.setTimeout(() => router.push(loginPath), 700);
      } catch {
        showSnackbar({ severity: "error", message: "Unable to verify email from link." });
      } finally {
        setIsVerifyingLink(false);
      }
    };

    void verifyFromLink();
  }, [loginPath, router, searchParams, showSnackbar]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (value.length > 0 && digit === "") {
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < OTP_LEN - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const otp = digits.join("");
    if (otp.length !== OTP_LEN) {
      showSnackbar({ severity: "error", message: "Please enter the 6-digit verification code." });
      return;
    }

    if (!email.trim()) {
      showSnackbar({ severity: "error", message: "Enter your email address first." });
      return;
    }

    try {
      const result = await verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp,
      }).unwrap();

      window.sessionStorage.removeItem("mollure_verify_email");
      showSnackbar({
        severity: "success",
        message: result.message || "Email verified. You can log in now.",
      });
      window.setTimeout(() => router.push(loginPath), 700);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Verification failed."),
      });
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showSnackbar({ severity: "error", message: "Enter your email address first." });
      return;
    }

    try {
      const result = await resendVerification({
        email: email.trim().toLowerCase(),
      }).unwrap();

      showSnackbar({
        severity: "success",
        message: result.message || "Verification code sent.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to resend verification code."),
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: m.white ?? "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MarketingSiteHeader {...authLoginHeaderClient} />
      <Box
        component="img"
        src={SignupBg.src}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 4, md: 8 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: `1px solid ${cardBorder}`,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <Box sx={{ display: { xs: "none", md: "block" }, position: "relative", minHeight: 480 }}>
            <Image src={SignupLs} alt="" fill style={{ objectFit: "cover" }} />
          </Box>
          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <SubHeading sx={{ mb: 1 }}>Verify your email</SubHeading>
            <BodyText sx={{ mb: 3, color: m.textSecondary }}>
              Enter the 6-digit code sent to your email, or open the verification link from that
              email. If you did not receive a code, use Resend (when email is configured) or try
              logging in—accounts may be activated automatically when email cannot be sent.
            </BodyText>

            {isVerifyingLink ? (
              <Typography>Verifying from link…</Typography>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    fullWidth
                    required
                  />
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {digits.map((digit, index) => (
                      <TextField
                        key={index}
                        inputRef={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        value={digit}
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        onKeyDown={(event) => handleDigitKeyDown(index, event)}
                        inputProps={{
                          maxLength: 1,
                          inputMode: "numeric",
                          style: { textAlign: "center", fontSize: "1.25rem" },
                        }}
                        sx={{ width: 48 }}
                      />
                    ))}
                  </Stack>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isVerifying}
                    sx={{ py: 1.5 }}
                  >
                    {isVerifying ? "Verifying…" : "Verify email"}
                  </Button>
                  <Button type="button" variant="text" onClick={handleResend} disabled={isResending}>
                    {isResending ? "Sending…" : "Resend code"}
                  </Button>
                  <Typography variant="body2" textAlign="center">
                    <Link href={loginPath}>Back to login</Link>
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "relative",
              minHeight: 480,
              gridColumn: { md: "2" },
              gridRow: { md: "1" },
            }}
          >
            <Image src={SignupRs} alt="" fill style={{ objectFit: "cover" }} />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
