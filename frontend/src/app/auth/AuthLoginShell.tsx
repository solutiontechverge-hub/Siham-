"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppleIcon from "@mui/icons-material/Apple";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  SvgIcon,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../lib/api-error";
import { persistAuthSession } from "../../lib/auth-storage";
import { useAppDispatch } from "../../store/hooks";
import { setAuthSession } from "../../store/slices/authSlice";
import { useLoginMutation } from "../../store/services/authApi";
import { SignupBg, SignupLs, SignupRs } from "../../../images";
import { MarketingSiteHeader, MollureAuthLabeledField, MollureAuthLabeledPasswordField } from "../../components/common";
import type { AuthStripHeaderConfig } from "../../data/marketingShell.data";
import { BodyText, SubHeading } from "../../components/ui/typography";
import { useSnackbar } from "../../components/common/AppSnackbar";

function GoogleLogoIcon(props: React.ComponentProps<typeof SvgIcon>) {
  return (
    <SvgIcon viewBox="0 0 24 24" fontSize="small" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </SvgIcon>
  );
}

export type AuthLoginShellProps = {
  header: AuthStripHeaderConfig;
  /** “Create account” link target (client vs professional signup). */
  signupHref: string;
};

export default function AuthLoginShell({ header, signupHref }: AuthLoginShellProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
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

      const isClientLogin = header.loginHref === "/auth/login";
      const isProfessionalLogin = header.loginHref === "/auth/professional/login";

      if (isClientLogin && result.data.user.user_type === "professional") {
        showSnackbar({ severity: "error", message: "This email is registered with a professional" });
        return;
      }

      if (isProfessionalLogin && result.data.user.user_type === "individual") {
        showSnackbar({ severity: "error", message: "This email is registered as a client" });
        return;
      }

      dispatch(
        setAuthSession({
          accessToken: result.data.access_token,
          refreshToken: result.data.refresh_token,
          user: result.data.user,
        }),
      );
      persistAuthSession({
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        user: result.data.user,
        remember,
      });

      router.push(
        result.data.user.user_type === "individual"
          ? "/clients/listing"
          : result.data.user.user_type === "professional"
            ? "/professionals/fixed-location/profile"
            : "/clients/profile",
      );
      showSnackbar({ severity: "success", message: "Signed in successfully." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Login failed. Please check your credentials."),
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

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button
                        type="button"
                        fullWidth
                        sx={{
                          minHeight: 42,
                          borderRadius: "8px",
                          textTransform: "none",
                          bgcolor: alpha(m.navy, 0.045),
                          color: alpha(m.navy, 0.78),
                          fontWeight: 600,
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          "&:hover": { bgcolor: alpha(m.navy, 0.07), borderColor: alpha(m.navy, 0.12) },
                        }}
                        startIcon={<GoogleLogoIcon sx={{ fontSize: 20 }} />}
                      >
                        Continue with Google
                      </Button>
                      <Button
                        type="button"
                        fullWidth
                        sx={{
                          minHeight: 42,
                          borderRadius: "8px",
                          textTransform: "none",
                          bgcolor: alpha(m.navy, 0.045),
                          color: alpha(m.navy, 0.78),
                          fontWeight: 600,
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          "&:hover": { bgcolor: alpha(m.navy, 0.07), borderColor: alpha(m.navy, 0.12) },
                        }}
                        startIcon={<AppleIcon sx={{ fontSize: 20 }} />}
                      >
                        Continue With Apple
                      </Button>
                    </Stack>

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
  );
}
