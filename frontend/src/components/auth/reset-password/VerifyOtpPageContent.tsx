"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useForgotPasswordMutation, useVerifyOtpMutation } from "../../../store/services/authApi";
import { MarketingSiteHeader } from "../../common";
import { authLoginHeaderClient } from "../../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../ui/typography";
import { useSnackbar } from "../../common/AppSnackbar";
import { SignupBg, SignupLs, SignupRs } from "../../../../images";

const OTP_LEN = 4;

export default function VerifyOtpPageContent() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [digits, setDigits] = React.useState<string[]>(() => Array(OTP_LEN).fill(""));
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  React.useEffect(() => {
    const savedEmail = window.sessionStorage.getItem("mollure_reset_email") || "";
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (value.length > 0 && digit === "") return;

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < OTP_LEN - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const otp = digits.join("");
    if (otp.length !== OTP_LEN) {
      showSnackbar({ severity: "error", message: "Please enter the 4-digit verification code." });
      return;
    }

    try {
      const result = await verifyOtp({ email: email.trim().toLowerCase(), otp }).unwrap();

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      window.sessionStorage.setItem("mollure_reset_user_id", String(result.data.user_id));
      showSnackbar({ severity: "success", message: "OTP verified. You can now set a new password." });

      window.setTimeout(() => {
        router.push("/auth/reset-password/new");
      }, 700);
    } catch (error) {
      showSnackbar({ severity: "error", message: getApiErrorMessage(error, "OTP verification failed.") });
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showSnackbar({ severity: "error", message: "Enter your email address first." });
      return;
    }

    try {
      const result = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();

      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
      showSnackbar({ severity: "success", message: result.message || "OTP sent again." });
    } catch (error) {
      showSnackbar({ severity: "error", message: getApiErrorMessage(error, "Unable to resend OTP.") });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: m.white ?? "#fff", position: "relative", overflow: "hidden" }}>
      <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, lineHeight: 0 }}>
          <Image
            src={SignupBg}
            alt=""
            width={1440}
            height={553}
            priority
            sizes="100vw"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(52vw, 240px)", sm: 280, md: 323 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupLs}
            alt=""
            width={323}
            height={469}
            sizes="(max-width: 600px) 52vw, 323px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(56vw, 260px)", sm: 300, md: 364 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupRs}
            alt=""
            width={364}
            height={413}
            sizes="(max-width: 600px) 56vw, 364px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <MarketingSiteHeader
          navItems={[...authLoginHeaderClient.navItems]}
          localeLabel={authLoginHeaderClient.localeLabel}
          loginLabel={authLoginHeaderClient.loginLabel}
          loginHref={authLoginHeaderClient.loginHref}
          professionalLinkLabel={authLoginHeaderClient.professionalLinkLabel}
          professionalHref={authLoginHeaderClient.professionalHref}
          homeHref="/"
        />

        <Container maxWidth="lg">
          <Box sx={{ minHeight: "calc(100vh - 120px)", display: "grid", placeItems: "center", py: 4, pb: 6 }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 620,
                borderRadius: "14px",
                border: `1px solid ${cardBorder}`,
                boxShadow: `0 18px 48px ${alpha(m.navy, 0.08)}, 0 4px 14px ${alpha(m.navy, 0.04)}`,
                bgcolor: m.white ?? "#fff",
                px: { xs: 3, sm: 4.75 },
                py: { xs: 3.5, sm: 4.25 },
              }}
            >
              <Stack spacing={2.75}>
                <Box textAlign="center">
                  <SubHeading sx={{ fontSize: { xs: "1.5rem", sm: "1.625rem" }, fontWeight: 700, color: m.navy, lineHeight: 1.2 }}>
                    Reset Password
                  </SubHeading>
                  <BodyText sx={{ mt: 1, color: alpha(m.navy, 0.52), fontSize: "0.875rem", lineHeight: 1.45 }}>
                    Enter The 4 Digit Verification Code That Was Sent To Your Email To Change Your Password
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.25}>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                      {digits.map((digit, index) => (
                        <TextField
                          key={index}
                          value={digit}
                          onChange={(event) => handleDigitChange(index, event.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(index, e)}
                          inputRef={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          inputProps={{
                            maxLength: 1,
                            inputMode: "numeric",
                            "aria-label": `Digit ${index + 1} of ${OTP_LEN}`,
                            style: {
                              textAlign: "center",
                              fontSize: "1.25rem",
                              fontWeight: 700,
                              color: m.navy,
                              padding: theme.spacing(1.25, 0),
                            },
                          }}
                          sx={{
                            width: { xs: 58, sm: 64 },
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "10px",
                              bgcolor: alpha(m.navy, 0.045),
                              "& fieldset": { borderColor: alpha(m.teal, 0.45) },
                              "&:hover fieldset": { borderColor: alpha(m.teal, 0.75) },
                              "&.Mui-focused fieldset": { borderColor: m.teal, borderWidth: "2px" },
                            },
                          }}
                        />
                      ))}
                    </Stack>

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      fullWidth
                      disabled={isVerifying}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        py: 1.2,
                        minHeight: 44,
                        bgcolor: m.teal,
                        color: m.white,
                        "&:hover": { bgcolor: m.tealDark },
                      }}
                    >
                      {isVerifying ? "Verifying..." : "Send OTP"}
                    </Button>

                    <Box textAlign="center">
                      <Typography component="span" sx={{ fontSize: "0.8125rem", color: alpha(m.navy, 0.52) }}>
                        Didn&apos;t receive a code?{" "}
                      </Typography>
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
                          fontSize: "0.8125rem",
                          color: m.navy,
                          verticalAlign: "baseline",
                          "&:hover": { bgcolor: "transparent", color: m.tealDark },
                        }}
                      >
                        {isResending ? "Resending..." : "Resend"}
                      </Button>
                    </Box>

                    <BodyText textAlign="center" sx={{ color: alpha(m.navy, 0.48), fontSize: "0.8125rem" }}>
                      <Link href="/auth/forgot-password" style={{ color: m.teal, textDecoration: "none", fontWeight: 600 }}>
                        Back to forgot password
                      </Link>
                    </BodyText>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

