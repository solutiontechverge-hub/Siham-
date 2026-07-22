"use client";

import { createTheme } from "@mui/material/styles";
import { MOLLURE_SNACKBAR_COLORS } from "./mollureSnackbar";
import {
  MOLLURE_FONT_CONTENT_PX,
  MOLLURE_FONT_HEADING_PX,
  MOLLURE_FONT_SUBHEADING_PX,
  mollureFontSizes,
} from "./typography";

const headingStyle = {
  fontFamily: "inherit",
  fontWeight: 500,
  fontSize: mollureFontSizes.heading,
  lineHeight: 1,
  letterSpacing: 0,
  color: "#333333",
} as const;

const subheadingStyle = {
  fontFamily: "inherit",
  fontWeight: 500,
  fontSize: mollureFontSizes.subheading,
  lineHeight: 1.2,
  letterSpacing: 0,
  color: "#333333",
} as const;

const contentStyle = {
  fontFamily: "inherit",
  fontWeight: 400,
  fontSize: mollureFontSizes.content,
  lineHeight: 1.5,
  letterSpacing: 0,
  color: "#5A5A5A",
} as const;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#21B8BF",
      dark: "#149CA7",
      contrastText: "#FFFFFF",
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
      /** Shared page background for client and professional pages */
      pageBg: "#EAF9FB",
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
      /** Booking details card when status is cancelled */
      cancelledSurface: "#F9FAFB",
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
      /** Calendar blocked-time slot */
      blockedTimeBg: "#FEE4E2",
      blockedTimeFg: "#F04438",
      /** Sales Volume stacked bar chart — 4-step teal gradient (Figma) */
      salesVolumeStackDark: "#169BA1",
      salesVolumeStackMid: "#21B8BF",
      salesVolumeStackLight: "#62C4C8",
      salesVolumeStackPale: "#9DD8DB",
      /** Layout rhythm — 40px between sections, 16px heading-to-body */
      sectionGapPx: 40,
      headingBodyGapPx: 16,
    },
    
  },

  typography: {
    fontFamily:
      "var(--font-poppins), Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: MOLLURE_FONT_CONTENT_PX,
    h1: { ...headingStyle, fontWeight: 600 },
    h2: headingStyle,
    h3: subheadingStyle,
    h4: subheadingStyle,
    h5: subheadingStyle,
    h6: subheadingStyle,
    subtitle1: subheadingStyle,
    subtitle2: contentStyle,
    body1: contentStyle,
    body2: contentStyle,
    button: {
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: mollureFontSizes.content,
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none" as const,
    },
    mainHeading: {
      ...headingStyle,
      fontWeight: 600,
      color: "#344054",
    },
    subHeading: subheadingStyle,
    description: contentStyle,
    cardTitle: {
      ...subheadingStyle,
      color: "#344054",
    },
    bodyText: contentStyle,
    headerNav: {
      ...contentStyle,
      fontWeight: 500,
      color: "#344A66",
    },
    formLabel: {
      ...contentStyle,
      fontWeight: 500,
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
      styleOverrides: {
        root: {
          letterSpacing: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
        contained: {
          color: "#FFFFFF",
          "&:hover": {
            color: "#FFFFFF",
          },
          "& .MuiButton-startIcon, & .MuiButton-endIcon": {
            color: "inherit",
          },
        },
        containedPrimary: {
          color: "#FFFFFF",
          "&:hover": {
            color: "#FFFFFF",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
        input: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          fontSize: mollureFontSizes.content,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: mollureFontSizes.content,
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
            fontSize: mollureFontSizes.content,
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
