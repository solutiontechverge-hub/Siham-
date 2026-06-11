"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../lib/api-error";
import SocialSignInButtons from "../../components/auth/SocialSignInButtons";
import { useAuthSessionLogin } from "../../hooks/useAuthSessionLogin";
import { useLoginMutation } from "../../store/services/authApi";
import { SignupBg, SignupLs, SignupRs } from "../../../images";
import { MarketingSiteHeader, MollureAuthLabeledField, MollureAuthLabeledPasswordField } from "../../components/common";
import GuestGuard from "../../components/common/auth/GuestGuard";
import type { AuthStripHeaderConfig } from "../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../components/ui/typography";
import { useSnackbar } from "../../components/common/AppSnackbar";

export type AuthLoginShellProps = {
  header: AuthStripHeaderConfig;
  /** “Create account” link target (client vs professional signup). */
  signupHref: string;
};

export default function AuthLoginShell({ header, signupHref }: AuthLoginShellProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { completeLogin } = useAuthSessionLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      completeLogin(result.data, remember);
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Login failed. Please check your credentials."),
      }); 
    }
  };

  return (
    <GuestGuard>
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
          navItems={[...header.navItems]}
          localeLabel={header.localeLabel}
          loginLabel={header.loginLabel}
          loginHref={header.loginHref}
          professionalLinkLabel={header.professionalLinkLabel}
          professionalHref={header.professionalHref}
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
                    Sign In
                  </SubHeading>
                  <BodyText
                    sx={{
                      mt: 1,
                      color: alpha(m.navy, 0.52),
                      fontSize: "0.875rem",
                      lineHeight: 1.45,
                    }}
                  >
                    Welcome Back! Login To Access Your Account
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <MollureAuthLabeledField
                      type="email"
                      fieldLabel="Email Address"
                      placeholder="e.g Jane"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                    />

                    <MollureAuthLabeledPasswordField
                      typeWhenHidden="password"
                      fieldLabel="Password"
                      placeholder="Enter Password Here"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                    />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={remember}
                            onChange={(event) => setRemember(event.target.checked)}
                            sx={{
                              color: alpha(m.navy, 0.35),
                              "&.Mui-checked": { color: m.teal },
                            }}
                          />
                        }
                        label={
                          <BodyText sx={{ fontSize: "0.8125rem", color: alpha(m.navy, 0.52) }}>
                            Remember Me
                          </BodyText>
                        }
                      />

                      <Link
                        href="/auth/forgot-password"
                        style={{
                          fontSize: "0.8125rem",
                          color: alpha(m.navy, 0.52),
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Forget Password?
                      </Link>
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      disabled={isLoading}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "1rem",
                        py: 1.2,
                        bgcolor: m.teal,
                        color: m.white,
                        "&:hover": { bgcolor: m.tealDark },
                        minHeight: 44,
                      }}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        fontSize: "0.8125rem",
                        color: alpha(m.navy, 0.48),
                      }}
                    >
                      <Box sx={{ height: 1, flex: 1, backgroundColor: alpha(m.navy, 0.12) }} />
                      or continue with
                      <Box sx={{ height: 1, flex: 1, backgroundColor: alpha(m.navy, 0.12) }} />
                    </Box>

                    <SocialSignInButtons
                      disabled={isLoading}
                      onLoginSuccess={(data) => completeLogin(data, remember)}
                      onError={(message) => showSnackbar({ severity: "error", message })}
                    />

                    <BodyText textAlign="center" sx={{ fontSize: "0.8125rem", color: alpha(m.navy, 0.52), pt: 0.5 }}>
                      Don&apos;t have account?{" "}
                      <Link
                        href={signupHref}
                        style={{ color: m.teal, textDecoration: "none", fontWeight: 700 }}
                      >
                        Create account
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
    </GuestGuard>
  );
}
