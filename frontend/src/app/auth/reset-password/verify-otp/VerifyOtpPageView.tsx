"use client";

import AppButton from "../../../../components/common/AppButton";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MarketingSiteHeader } from "../../../../components/common";
import { authLoginHeaderClient } from "../../../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../../../components/ui/typography";
import { SignupBg, SignupLs, SignupRs } from "../../../../../images";
import { verifyOtpPageData as copy } from "./verifyOtp.data";
import { OTP_LEN, useVerifyOtpPage } from "./useVerifyOtpPage";

export default function VerifyOtpPageView() {
  const {
    theme,
    m,
    cardBorder,
    digits,
    inputRefs,
    isVerifying,
    isResending,
    handleDigitChange,
    handleDigitKeyDown,
    handleSubmit,
    handleResend,
  } = useVerifyOtpPage();

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
                      fontSize: 20,
                      fontWeight: 700,
                      color: m.navy,
                      lineHeight: 1.2,
                    }}
                  >
                    {copy.title}
                  </SubHeading>
                  <BodyText
                    sx={{
                      mt: 1,
                      color: alpha(m.navy, 0.52),
                      fontSize: "0.875rem",
                      lineHeight: 1.45,
                    }}
                  >
                    {copy.subtitle}
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.25}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      justifyContent="center"
                    >
                      {digits.map((digit, index) => (
                        <TextField
                          key={index}
                          value={digit}
                          onChange={(event) =>
                            handleDigitChange(index, event.target.value)
                          }
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
                              "& fieldset": {
                                borderColor: alpha(m.teal, 0.45),
                              },
                              "&:hover fieldset": {
                                borderColor: alpha(m.teal, 0.75),
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: m.teal,
                                borderWidth: "2px",
                              },
                            },
                          }}
                        />
                      ))}
                    </Stack>

                    <AppButton
                      tone="primary"
                      type="submit"
                      fullWidth
                      disabled={isVerifying}
                      sx={{
                        letterSpacing: "0.04em",
                        fontSize: "0.9375rem",
                        py: 1.2,
                        minHeight: 44,
                        color: m.white,
                      }}
                    >
                      {isVerifying
                        ? copy.actions.submitting
                        : copy.actions.submit}
                    </AppButton>

                    <Box textAlign="center">
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "0.8125rem",
                          color: alpha(m.navy, 0.52),
                        }}
                      >
                        {copy.didntReceivePrefix}{" "}
                      </Typography>
                      <AppButton
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
                          "&:hover": {
                            bgcolor: "transparent",
                            color: m.tealDark,
                          },
                        }}
                      >
                        {isResending
                          ? copy.actions.resending
                          : copy.actions.resend}
                      </AppButton>
                    </Box>

                    <BodyText
                      textAlign="center"
                      sx={{ color: alpha(m.navy, 0.48), fontSize: "0.8125rem" }}
                    >
                      <Link
                        href={copy.backToForgotPassword.href}
                        style={{
                          color: m.teal,
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {copy.backToForgotPassword.label}
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
