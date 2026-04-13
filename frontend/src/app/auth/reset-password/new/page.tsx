"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { useResetPasswordMutation } from "../../../../store/services/authApi";
import { BodyText, CardTitle, MainHeading } from "../../../../components/ui/typography";
import { useSnackbar } from "../../../../components/common/AppSnackbar";

export default function NewPasswordPage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  React.useEffect(() => {
    const savedEmail = window.sessionStorage.getItem("mollure_reset_email") || "";
    const savedUserId = window.sessionStorage.getItem("mollure_reset_user_id") || "";
    setEmail(savedEmail);
    setUserId(savedUserId);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showSnackbar({ severity: "error", message: "Password and confirm password must match." });
      return;
    }

    if (!userId) {
      showSnackbar({ severity: "error", message: "OTP verification is required before resetting the password." });
      return;
    }

    try {
      await resetPassword({
        user_id: Number(userId),
        new_password: password,
        confirm_password: confirmPassword,
      }).unwrap();

      window.sessionStorage.removeItem("mollure_reset_user_id");
      showSnackbar({ severity: "success", message: "Password reset successfully." });
      router.push("/auth/reset-password/success");
    } catch (error) {
      showSnackbar({ severity: "error", message: getApiErrorMessage(error, "Unable to reset password.") });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, md: 8 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 46, height: 46, borderRadius: "16px", background: "linear-gradient(135deg, #00c2b8 0%, #1177ff 100%)", boxShadow: "0 12px 30px rgba(17, 119, 255, 0.22)" }} />
              <CardTitle sx={{ fontSize: "1.25rem", letterSpacing: "-0.04em", color: "#10233f" }}>Mollure</CardTitle>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper elevation={0} sx={{ width: "100%", maxWidth: 620, borderRadius: "32px", px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 }, backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(16, 35, 63, 0.08)", boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)" }}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <MainHeading sx={{ letterSpacing: "-0.05em", color: "#10233f", fontSize: { xs: "2rem", sm: "2.75rem" } }}>
                    Set New Password?
                  </MainHeading>
                  <BodyText sx={{ mt: 1.5, color: alpha("#10233f", 0.72), fontSize: "1rem" }}>
                    Your new password must be different from the previous one.
                  </BodyText>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={Boolean(email)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      InputLabelProps={{ shrink: true }}
                    />

                    <Button type="submit" variant="contained" disabled={isLoading} sx={{ minHeight: 54, borderRadius: 999, textTransform: "none", fontSize: "1rem", fontWeight: 800, background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)", boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)" }}>
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>

                    <BodyText textAlign="center" color="text.secondary">
                      <Link href="/auth/reset-password/verify-otp" style={{ color: "#00a9b4", textDecoration: "none", fontWeight: 700 }}>
                        Back to OTP verification
                      </Link>
                    </BodyText>
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
