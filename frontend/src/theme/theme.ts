"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#21B8BF",
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
    mollure: {
      teal: "#21B8BF",
      tealDark: "#149CA7",
      navy: "#344A66",
      slate: "#71819A",
      surface: "#F7FBFD",
      footer: "#223648",
      footerText: "#D7E3EC",
      footerMuted: "rgba(215,227,236,0.68)",
      mintSoft: "#E8FBF7",
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
      cardbg: "#F8FFFF",
      textcolorgrey700:"#344054",
      warmwarning:'#FFFCF5'
    },
    
  },


  shape: {
    borderRadius: 12,
  },
});

export default theme;
