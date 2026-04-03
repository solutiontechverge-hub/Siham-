import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function PasswordResetSuccessPage() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, #d8ffff 0%, #f6fffd 34%, #f5f7fb 100%)", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <Paper elevation={0} sx={{ width: "100%", maxWidth: 620, borderRadius: "32px", px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 }, textAlign: "center", backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(16, 35, 63, 0.08)", boxShadow: "0 24px 80px rgba(16, 35, 63, 0.10)" }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.05em", color: "#10233f", fontSize: { xs: "2rem", sm: "2.75rem" } }}>
                Password Reset
              </Typography>
              <Typography color="text.secondary">
                Your password has been successfully reset.
              </Typography>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                sx={{
                  minWidth: 220,
                  minHeight: 54,
                  borderRadius: 999,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
                }}
              >
                Login
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
