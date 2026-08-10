"use client";

import AppButton from "../../components/common/AppButton";
import * as React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../lib/api-error";
import { useAuthSessionLogin } from "../../hooks/useAuthSessionLogin";
import { useAdminLoginMutation } from "../../store/services/adminApi";
import { SignupBg, SignupLs, SignupRs } from "../../../images";
import {
  MarketingSiteHeader,
  MollureAuthLabeledField,
  MollureAuthLabeledPasswordField,
} from "../../components/common";
import GuestGuard from "../../components/common/auth/GuestGuard";
import { authLoginHeaderClient } from "../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../components/ui/typography";
import { useSnackbar } from "../../components/common/AppSnackbar";

export default function AdminAuthLoginShell() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { showSnackbar } = useSnackbar();
  const { completeLogin } = useAuthSessionLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const rememberRef = React.useRef(remember);
  rememberRef.current = remember;
  const [login, { isLoading }] = useAdminLoginMutation();

  const cardBorder = m.cardBorder ?? alpha(m.navy, 0.12);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const rememberMe = rememberRef.current;
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      completeLogin(result.data, rememberMe, redirectTo || "/admin/dashboard");
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          "Login failed. Please check your admin credentials.",
        ),
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
              left: 0,
              bottom: 0,
              lineHeight: 0,
              display: { xs: "none", md: "block" },
            }}
          >
            <Image
              src={SignupLs}
              alt=""
              width={420}
              height={420}
              style={{ width: "min(28vw, 420px)", height: "auto" }}
            />
          </Box>

          <Box
            sx={{
              position: "absolute",
              right: 0,
              bottom: 0,
              lineHeight: 0,
              display: { xs: "none", md: "block" },
            }}
          >
            <Image
              src={SignupRs}
              alt=""
              width={420}
              height={420}
              style={{ width: "min(28vw, 420px)", height: "auto" }}
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

          <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  maxWidth: 440,
                  px: { xs: 2.5, sm: 4 },
                  py: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  border: `1px solid ${cardBorder}`,
                  bgcolor: m.white,
                  boxShadow: `0 18px 50px ${alpha(m.navy, 0.08)}`,
                }}
              >
                <Stack spacing={3}>
                  <Box>
                    <SubHeading
                      sx={{
                        fontSize: { xs: "1.5rem", sm: "1.75rem" },
                        fontWeight: 700,
                        color: m.navy,
                      }}
                    >
                      Admin Sign In
                    </SubHeading>
                    <BodyText
                      sx={{
                        mt: 1,
                        color: alpha(m.navy, 0.52),
                        fontSize: "0.875rem",
                        lineHeight: 1.45,
                      }}
                    >
                      Sign in with your Mollure admin credentials to manage the
                      platform.
                    </BodyText>
                  </Box>

                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                      <MollureAuthLabeledField
                        type="email"
                        fieldLabel="Admin Email"
                        placeholder="admin@molur.com"
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

                      <FormControlLabel
                        sx={{
                          mr: 0,
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          WebkitTapHighlightColor: "transparent",
                          "& .MuiCheckbox-root": { p: 0.75 },
                        }}
                        control={
                          <Checkbox
                            size="small"
                            name="remember"
                            checked={remember}
                            onChange={(event) =>
                              setRemember(event.target.checked)
                            }
                            inputProps={{ "aria-label": "Remember Me" }}
                            sx={{
                              color: alpha(m.navy, 0.35),
                              "&.Mui-checked": { color: m.teal },
                            }}
                          />
                        }
                        label={
                          <BodyText
                            component="span"
                            sx={{
                              fontSize: "0.8125rem",
                              color: alpha(m.navy, 0.52),
                            }}
                          >
                            Remember Me
                          </BodyText>
                        }
                      />

                      <AppButton
                        tone="primary"
                        type="submit"
                        disabled={isLoading}
                        sx={{
                          fontSize: "1rem",
                          py: 1.2,
                          color: m.white,
                          minHeight: 44,
                        }}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </AppButton>
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
