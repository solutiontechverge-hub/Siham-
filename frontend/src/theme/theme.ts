"use client";

import { createTheme } from "@mui/material/styles";
import { MOLLURE_SNACKBAR_COLORS } from "./mollureSnackbar";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#21B8BF",
      dark: "#149CA7",
    },
    secondary: {
      main: "#E9F8F9",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#344A66",
      secondary: "#71819A",
    },
    success: {
      main: "#4CAF50",
      dark: "#2E7D32",
      light: "#E8F5E9",
      contrastText: "#FFFFFF",
    },
    mollure: {
      teal: "#21B8BF",
      tealDark: "#149CA7",
      success: "#4CAF50",
      successDark: "#2E7D32",
      navy: "#344A66",
      slate: "#71819A",
      surface: "#F7FBFD",
      footer: "#223648",
      footerText: "#D7E3EC",
      footerMuted: "rgba(215,227,236,0.68)",
      mintSoft: "#E8FBF7",
      /** Mint → aqua for brand line icons (e.g. service category slider) */
      iconGradientStart: "#A8E6CF",
      iconGradientEnd: "#88D8D0",
      iconGradient: "linear-gradient(180deg, #A8E6CF 0%, #88D8D0 100%)",
      heroGradientStart: "#DCF7EE",
      heroGradientEnd: "#B4EEE9",
      heroGlow:
        "radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 34%), radial-gradient(circle at right center, rgba(103,224,217,0.28), transparent 28%)",
      chipBg: "rgba(255,255,255,0.72)",
      whiteOverlay: "rgba(255,255,255,0.92)",
      border: "rgba(228,236,243,0.8)",
      cardBorder: "#E6EEF4",
      inputBorder: "#D5E3EC",
      inputBorderHover: "#B9CDD9",
      placeholder: "#9AA9B9",
      headerHint: "#90A0B1",
      bodyText: "#698096",
      avatarBg: "#EAF6FF",
      star: "#FFB547",
      logoPrimary: "#6AD6D4",
      logoSecondary: "#56C7D2",
      logoAccent: "#A7E9A8",
      logoText: "#62758A",
      bgshadow: "#F9FAFB",
      /** Muted section panels (e.g. How it works — Changes Without Approval) */
      sectionSurface: "#F9FAFB",
      sectionSurfaceShadow: "0 10px 28px rgba(16, 35, 63, 0.10)",
      cardbg: "#F8FFFF",
      textcolorgrey700: "#344054",
      headingText: "#333333",
      descriptionText: "#5A5A5A",
      warmwarning: "#FFFCF5",
      /** Request-type accents (How it works — Types of Requests icon chips) */
      requestAccent: "#DC6803",
      requestAccentSoft: "rgba(220, 104, 3, 0.14)",
      white: "#FFFFFF",
      // Fixed-location schedule palette (from provided design)
      fxLavenderTint: "#FAF6FFCF",
      fxMintTint: "#EFFDF199",
      fxGrayF2F4F7: "#F2F4F7",
      fxGrayF4F4F4: "#F4F4F4",
      fxGrayDCDFE3: "#DCDFE3",
      fxGrayF9FAFB: "#F9FAFB",
      fxSurface: "#FFFFFF",
      fxPillTrack: "#EFFDF199",
      fxPillBorder: "#DCDFE3",
      // Shared "Add" affordance colors (icon chip / small add buttons)
      addSoftBg: "#BAE9EB",
      addSoftBgHover: "#A6E2E5",
      addSoftFg: "#149CA7",
      addSoftBorder: "rgba(20,156,167,0.18)",
      /** Sales Volume stacked bar chart — 4-step teal gradient (Figma) */
      salesVolumeStackDark: "#169BA1",
      salesVolumeStackMid: "#21B8BF",
      salesVolumeStackLight: "#62C4C8",
      salesVolumeStackPale: "#9DD8DB",
    },
    
  },

  typography: {
    fontFamily:
      "var(--font-poppins), Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    mainHeading: {
      fontFamily: "inherit",
      fontWeight: 600,
      fontSize: "30px",
      lineHeight: 1.2,
      color: "#344054",
    },
    subHeading: {
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "24px",
      lineHeight: "normal",
      color: "#333333",
    },
    description: {
      fontFamily: "inherit",
      fontWeight: 400,
      fontSize: "14px",
      lineHeight: "normal",
      color: "#5A5A5A",
    },
    cardTitle: {
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "14px",
      lineHeight: "20px",
      color: "#344054",
    },
    bodyText: {
      fontFamily: "inherit",
      fontWeight: 400,
      fontSize: "14px",
      lineHeight: "normal",
      color: "#5A5A5A",
    },
    headerNav: {
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "18px",
      lineHeight: "22px",
      letterSpacing: "0.01em",
    },
    formLabel: {
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "14px",
      lineHeight: "normal",
      color: "#71819A",
    },
  },

  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          mainHeading: "h1",
          subHeading: "h2",
          description: "p",
          cardTitle: "h3",
          bodyText: "p",
          headerNav: "span",
          formLabel: "span",
        },
      },
    },
    MuiAlert: {
      defaultProps: {
        variant: "standard",
      },
      styleOverrides: {
        root: ({ ownerState }) => {
          const severity = (ownerState.severity ?? "info") as keyof typeof MOLLURE_SNACKBAR_COLORS;
          const colors = MOLLURE_SNACKBAR_COLORS[severity] ?? MOLLURE_SNACKBAR_COLORS.info;
          return {
            borderRadius: 14,
            fontWeight: 500,
            fontSize: "0.875rem",
            alignItems: "center",
            backgroundColor: colors.background,
            color: colors.foreground,
            "& .MuiAlert-icon": {
              color: colors.foreground,
              opacity: 1,
            },
            "& .MuiAlert-action": {
              color: colors.foreground,
              paddingTop: 0,
              marginRight: 0,
            },
            "& .MuiAlert-message": {
              color: colors.foreground,
              padding: "2px 0",
            },
          };
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: "top", horizontal: "center" },
      },
    },
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;
