"use client";

import AppButton from "../../components/common/AppButton";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SocialSignInButtons from "../../components/auth/SocialSignInButtons";
import { SignupBg, SignupLs, SignupRs } from "../../../images";
import {
  MarketingSiteHeader,
  MollureAuthLabeledField,
  MollureAuthLabeledPasswordField,
} from "../../components/common";
import GuestGuard from "../../components/common/auth/GuestGuard";
import { BodyText, SubHeading } from "../../components/ui/typography";
import { authLoginCopy } from "./authLogin.data";
import {
  useAuthLoginShell,
  type AuthLoginShellProps,
} from "./useAuthLoginShell";

export type { AuthLoginShellProps };

export default function AuthLoginShell({
  header,
  signupHref,
}: AuthLoginShellProps) {
  const {
    m,
    cardBorder,
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    rememberRef,
    isLoading,
    handleSubmit,
    completeLogin,
    showSnackbar,
  } = useAuthLoginShell();

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
                        fontSize: 20,
                        fontWeight: 700,
                        color: m.navy,
                        lineHeight: 1.2,
                      }}
                    >
                      {authLoginCopy.title}
                    </SubHeading>
                    <BodyText
                      sx={{
                        mt: 1,
                        color: alpha(m.navy, 0.52),
                        fontSize: "0.875rem",
                        lineHeight: 1.45,
                      }}
                    >
                      {authLoginCopy.subtitle}
                    </BodyText>
                  </Box>

                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                      <MollureAuthLabeledField
                        type="email"
                        fieldLabel={authLoginCopy.emailLabel}
                        placeholder={authLoginCopy.emailPlaceholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                      />

                      <MollureAuthLabeledPasswordField
                        typeWhenHidden="password"
                        fieldLabel={authLoginCopy.passwordLabel}
                        placeholder={authLoginCopy.passwordPlaceholder}
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
                          sx={{
                            mr: 0,
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            WebkitTapHighlightColor: "transparent",
                            // Safari sometimes clips the checkbox hit area.
                            "& .MuiCheckbox-root": {
                              p: 0.75,
                            },
                          }}
                          control={
                            <Checkbox
                              size="small"
                              name="remember"
                              checked={remember}
                              onChange={(event) =>
                                setRemember(event.target.checked)
                              }
                              inputProps={{
                                "aria-label": authLoginCopy.rememberMe,
                              }}
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
                              {authLoginCopy.rememberMe}
                            </BodyText>
                          }
                        />

                        <Link
                          href={authLoginCopy.forgotPasswordHref}
                          style={{
                            fontSize: "0.8125rem",
                            color: alpha(m.navy, 0.52),
                            textDecoration: "none",
                            fontWeight: 500,
                          }}
                        >
                          {authLoginCopy.forgotPassword}
                        </Link>
                      </Box>

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
                        {isLoading
                          ? authLoginCopy.submitting
                          : authLoginCopy.submit}
                      </AppButton>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          width: "100%",
                          fontSize: "0.8125rem",
                          color: alpha(m.navy, 0.48),
                        }}
                      >
                        <Box
                          sx={{
                            height: "1px",
                            flex: 1,
                            backgroundColor: alpha(m.navy, 0.16),
                          }}
                        />
                        {authLoginCopy.orContinueWith}
                        <Box
                          sx={{
                            height: "1px",
                            flex: 1,
                            backgroundColor: alpha(m.navy, 0.16),
                          }}
                        />
                      </Box>

                      <SocialSignInButtons
                        disabled={isLoading}
                        onLoginSuccess={(data) =>
                          completeLogin(data, rememberRef.current)
                        }
                        onError={(message) =>
                          showSnackbar({ severity: "error", message })
                        }
                      />

                      <BodyText
                        textAlign="center"
                        sx={{
                          fontSize: "0.8125rem",
                          color: alpha(m.navy, 0.52),
                          pt: 0.5,
                        }}
                      >
                        {authLoginCopy.noAccount}{" "}
                        <Link
                          href={signupHref}
                          style={{
                            color: m.teal,
                            textDecoration: "none",
                            fontWeight: 700,
                          }}
                        >
                          {authLoginCopy.createAccount}
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
