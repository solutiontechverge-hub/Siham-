"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { persistAuthSession } from "../../../lib/auth-storage";
import { useAppDispatch } from "../../../store/hooks";
import { setAuthSession } from "../../../store/slices/authSlice";
import { useLoginMutation } from "../../../store/services/authApi";
import { Logo } from "../../../../images";

export default function LoginPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      const result = await login({
          email: email.trim().toLowerCase(),
          password,
      }).unwrap();

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

      router.push("/");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Login failed. Please check your credentials."),
      );
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
                  Sign In
                </Typography>
                <Typography sx={{ mt: 0.75, color: alpha(m.navy, 0.55), fontSize: 12.5, lineHeight: 1.4 }}>
                  Welcome Back! Login To Access Your Account
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={1.6}>
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
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="Password"
                    placeholder="Enter Password Here"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    size="small"
                    InputLabelProps={{ shrink: true }}
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
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: 12, color: alpha(m.navy, 0.55) }}>
                          Remember Me
                        </Typography>
                      }
                    />

                    <Link
                      href="/auth/forgot-password"
                      style={{
                        fontSize: 12,
                        color: alpha(m.navy, 0.55),
                        textDecoration: "none",
                      }}
                    >
                      Forget Password?
                    </Link>
                  </Box>

                  {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={isLoading}
                    sx={{
                      borderRadius: "4px",
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: m.teal,
                      "&:hover": { bgcolor: m.tealDark },
                      minHeight: 38,
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 12, color: alpha(m.navy, 0.55) }}>
                    <Box sx={{ height: 1, flex: 1, backgroundColor: alpha(m.navy, 0.10) }} />
                    or continue with
                    <Box sx={{ height: 1, flex: 1, backgroundColor: alpha(m.navy, 0.10) }} />
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <Button
                      type="button"
                      fullWidth
                      sx={{
                        minHeight: 34,
                        borderRadius: "6px",
                        textTransform: "none",
                        bgcolor: alpha(m.navy, 0.04),
                        color: alpha(m.navy, 0.75),
                        fontWeight: 600,
                        "&:hover": { bgcolor: alpha(m.navy, 0.06) },
                      }}
                    >
                      Continue with Google
                    </Button>
                    <Button
                      type="button"
                      fullWidth
                      sx={{
                        minHeight: 34,
                        borderRadius: "6px",
                        textTransform: "none",
                        bgcolor: alpha(m.navy, 0.04),
                        color: alpha(m.navy, 0.75),
                        fontWeight: 600,
                        "&:hover": { bgcolor: alpha(m.navy, 0.06) },
                      }}
                    >
                      Continue With Apple
                    </Button>
                  </Stack>

                  <Typography textAlign="center" sx={{ fontSize: 12, color: alpha(m.navy, 0.55) }}>
                    Don&apos;t have account?{" "}
                    <Link
                      href="/auth/signup/individual"
                      style={{ color: m.teal, textDecoration: "none", fontWeight: 700 }}
                    >
                      Create account
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
