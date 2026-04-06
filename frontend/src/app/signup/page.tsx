"use client";

import LanguageIcon from "@mui/icons-material/Language";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

const userTypes = [
  {
    label: "Individual Client (IC)",
    icon: <PersonOutlineOutlinedIcon sx={{ fontSize: 32 }} />,
    selected: true,
  },
  {
    label: "Company Client (CC)",
    icon: <BusinessOutlinedIcon sx={{ fontSize: 30 }} />,
    selected: false,
  },
  {
    label: "Professional",
    icon: <Groups2OutlinedIcon sx={{ fontSize: 30 }} />,
    selected: false,
  },
];

export default function SignupPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 16% 55%, rgba(64, 206, 214, 0.14), transparent 22%), radial-gradient(circle at 86% 53%, rgba(187, 243, 244, 0.18), transparent 16%)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          left: -68,
          bottom: -70,
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: "20px solid rgba(165, 225, 228, 0.30)",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            borderRadius: "50%",
            inset: 16,
            border: "16px solid rgba(165, 225, 228, 0.20)",
          },
          "&::after": {
            inset: 40,
            border: "12px solid rgba(165, 225, 228, 0.15)",
          },
        }}
      />

      <Box
        sx={{
          position: "absolute",
          right: -62,
          bottom: -88,
          width: 205,
          height: 205,
          borderRadius: "50%",
          border: "18px solid rgba(165, 225, 228, 0.30)",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            borderRadius: "50%",
            inset: 22,
            border: "16px solid rgba(165, 225, 228, 0.20)",
          },
          "&::after": {
            inset: 48,
            border: "12px solid rgba(165, 225, 228, 0.14)",
          },
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          border: "3px solid #1c95f3",
        }}
      >
        <Box
          component="header"
          sx={{
            px: { xs: 2, md: 5.5 },
            py: 2,
            borderBottom: "3px solid #1c95f3",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 1.5,
                py: 0.75,
                border: "1px dashed #1c95f3",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px 8px 2px 8px",
                  position: "relative",
                  border: "2px solid #32c9d5",
                  "&::before, &::after": {
                    content: '""',
                    position: "absolute",
                    inset: 4,
                    borderRadius: "50%",
                    borderTop: "2px solid #32c9d5",
                  },
                  "&::after": {
                    inset: 8,
                    borderTopColor: "#8ecf53",
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 22, md: 26 },
                  lineHeight: 1,
                  color: "#50607a",
                  fontWeight: 500,
                }}
              >
                Mollure
              </Typography>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                px: 1.25,
                py: 0.5,
                border: "1px dashed #1c95f3",
                borderRadius: 1,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{
                  px: 0.75,
                  py: 0.5,
                  border: "1px solid #111111",
                  borderRadius: 4,
                }}
              >
                <LanguageIcon sx={{ fontSize: 14, color: "#111111" }} />
                <Typography sx={{ fontSize: 11, color: "#111111" }}>EN</Typography>
              </Stack>
              <Button
                disableElevation
                sx={{
                  minWidth: 76,
                  height: 31,
                  px: 2.5,
                  borderRadius: 999,
                  textTransform: "lowercase",
                  fontSize: 12,
                  bgcolor: "#27c3cf",
                  color: "#ffffff",
                  "&:hover": {
                    bgcolor: "#1fb5c1",
                  },
                }}
              >
                login
              </Button>
              <Typography sx={{ fontSize: 11, color: "#7e8697" }}>
                for professional
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Container maxWidth="lg" sx={{ px: { xs: 3, md: 8 } }}>
          <Box
            sx={{
              pt: { xs: 8, md: 9.5 },
              pb: { xs: 10, md: 14 },
            }}
          >
            <Typography
              sx={{
                color: "#9aa5bd",
                fontSize: { xs: 28, md: 34 },
                mb: 1,
                lineHeight: 1,
              }}
            >
              Hi,
            </Typography>

            <Typography
              component="h1"
              sx={{
                color: "#4b5870",
                fontSize: { xs: 34, md: 50 },
                fontWeight: 600,
                lineHeight: 1.1,
                mb: { xs: 5, md: 6 },
              }}
            >
              Select User Type
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              sx={{ mb: { xs: 5, md: 8 } }}
            >
              {userTypes.map((type) => (
                <Box
                  key={type.label}
                  sx={{
                    flex: 1,
                    minHeight: 135,
                    borderRadius: "6px",
                    border: type.selected
                      ? "2px solid #4fcfe0"
                      : "1px solid #e6e7eb",
                    bgcolor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: type.selected
                      ? "0 8px 22px rgba(79, 207, 224, 0.08)"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Stack alignItems="center" spacing={1.5}>
                    <Box sx={{ color: "#657088" }}>{type.icon}</Box>
                    <Typography
                      sx={{
                        color: "#4d5870",
                        fontSize: 24,
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      {type.label}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Button
              fullWidth
              disableElevation
              sx={{
                height: 38,
                borderRadius: "4px",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                bgcolor: "#27c3cf",
                color: "#ffffff",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#20b6c2",
                  boxShadow: "none",
                },
              }}
            >
              Continue
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
