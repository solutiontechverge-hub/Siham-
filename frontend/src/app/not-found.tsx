import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: 28, fontWeight: 900, color: "text.primary" }}>404</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary" }}>
            Page not found
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.7 }}>
            The page you’re looking for doesn’t exist or was moved.
          </Typography>
          <Button component={Link} href="/" variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 700 }}>
            Back to home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

