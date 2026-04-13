import Link from "next/link";
import { Box, Button, Container, Stack } from "@mui/material";
import { BodyText, MainHeading, SubHeading } from "../components/ui/typography";

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <MainHeading sx={{ fontSize: 28, color: "text.primary" }}>404</MainHeading>
          <SubHeading sx={{ fontSize: 16, color: "text.primary" }}>Page not found</SubHeading>
          <BodyText sx={{ color: "text.secondary", lineHeight: 1.7 }}>
            The page you’re looking for doesn’t exist or was moved.
          </BodyText>
          <Button component={Link} href="/" variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 700 }}>
            Back to home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

