"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { alpha } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../lib/api-error";
import { persistAuthSession } from "../../../lib/auth-storage";
import { useAppDispatch } from "../../../store/hooks";
import { setAuthSession } from "../../../store/slices/authSlice";
import { useLoginMutation } from "../../../store/services/authApi";

export default function LoginPage() {
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
        background:
          "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, md: 8 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #00c2b8 0%, #1177ff 100%)",
                  boxShadow: "0 12px 30px rgba(17, 119, 255, 0.22)",
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.04em", color: "#10233f" }}>
                Mollure
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                EN
              </Button>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#00b3b3",
                  "&:hover": { backgroundColor: "#009c9c" },
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/auth/professional/login"
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha("#10233f", 0.14),
                  color: "#10233f",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                For professional
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 620,
                borderRadius: "32px",
                px: { xs: 3, sm: 5 },
                py: { xs: 4, sm: 5 },
                backgroundColor: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(16, 35, 63, 0.08)",
                boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)",
              }}
            >
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.05em", color: "#10233f", fontSize: { xs: "2rem", sm: "2.75rem" } }}>
                    Sign In
                  </Typography>
                  <Typography sx={{ mt: 1.5, color: alpha("#10233f", 0.72), fontSize: "1rem" }}>
                    Welcome back! Login to access your account.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      InputLabelProps={{ shrink: true }}
                    />

                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#10233f" }}>
                          Password
                        </Typography>
                        <Link href="/auth/forgot-password" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>
                          Forget Password?
                        </Link>
                      </Box>
                      <TextField
                        fullWidth
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                      }
                      label={<Typography variant="body2" color="text.secondary">Remember Me</Typography>}
                    />

                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        minHeight: 54,
                        borderRadius: 999,
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
                        boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)",
                      }}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 12, color: "#94a3b8" }}>
                      <Box sx={{ height: 1, flex: 1, backgroundColor: "#e2e8f0" }} />
                      or continue with
                      <Box sx={{ height: 1, flex: 1, backgroundColor: "#e2e8f0" }} />
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button type="button" variant="outlined" fullWidth sx={{ minHeight: 44, textTransform: "none" }}>
                        Continue with Google
                      </Button>
                      <Button type="button" variant="outlined" fullWidth sx={{ minHeight: 44, textTransform: "none" }}>
                        Continue with Apple
                      </Button>
                    </Stack>

                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      Don&apos;t have account?{" "}
                      <Link href="/auth/signup/individual" style={{ color: "#00a9b4", textDecoration: "none", fontWeight: 700 }}>
                        Create account
                      </Link>
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
