"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Box, Button, Container, Paper, Stack, TextField } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { useForgotPasswordMutation } from "../../../store/services/authApi";
import { MarketingSiteHeader } from "../../../components/common";
import { authLoginHeaderClient } from "../../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../../components/ui/typography";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import { SignupBg, SignupLs, SignupRs } from "../../../../images";

export default function ForgotPasswordPage() {
  const m = useTheme().palette.mollure;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      bgcolor: m.white ?? "#fff",
      "& fieldset": {
        borderColor: m.inputBorder,
      },
      "&:hover fieldset": {
        borderColor: m.inputBorderHover,
      },
      "&.Mui-focused fieldset": {
        borderColor: m.teal,
      },
    },
    "& .MuiInputLabel-root": {
      fontWeight: 600,
      fontSize: "0.8125rem",
      color: alpha(m.navy, 0.88),
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: alpha(m.navy, 0.88),
    },
    "& .MuiOutlinedInput-input::placeholder": {
      color: m.placeholder,
      opacity: 1,
    },
  } as const;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();

      showSnackbar({
        severity: "success",
        message: result.message || "OTP sent to your email if it exists in our system.",
      });
      window.sessionStorage.setItem("mollure_reset_email", email.trim().toLowerCase());
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
        bgcolor: m.white ?? "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupBg}
            alt=""
            width={1440}
            height={553}
            priority
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
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
          <Box
            sx={{
              minHeight: "calc(100vh - 120px)",
              display: "grid",
              placeItems: "center",
              py: 4,
              pb: 6,
            }}
          >
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
                  <SubHeading
                    sx={{
                      fontSize: { xs: "1.5rem", sm: "1.625rem" },
                      fontWeight: 700,
                      color: m.navy,
                      lineHeight: 1.2,
                    }}
                  >
                    Forget Password
                  </SubHeading>
                  <BodyText
                    sx={{
                      mt: 1,
                      color: alpha(m.navy, 0.52),
                      fontSize: "0.875rem",
                      lineHeight: 1.45,
                    }}
                  >
                    No Worries, We&apos;ll Send You Reset Instructions
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.25}>
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
                      sx={textFieldSx}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      fullWidth
                      disabled={isLoading}
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
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>

                    <BodyText textAlign="center" sx={{ color: alpha(m.navy, 0.48), fontSize: "0.8125rem" }}>
                      Remember your password?{" "}
                      <Link href="/auth/login" style={{ color: m.teal, textDecoration: "none", fontWeight: 700 }}>
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
    </Box>
  );
}
