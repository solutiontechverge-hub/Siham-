"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#10233f",
    },
    secondary: {
      main: "#00a9b4",
    },
    text: {
      primary: "#10233f",
      secondary: "#64748b",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`,
    h6: {
      fontWeight: 800,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #10233f 0%, #00a9b4 100%)",
          boxShadow: "0 18px 40px rgba(0, 169, 180, 0.24)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#fbfdff",
          transition: "all 0.2s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(16, 35, 63, 0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 169, 180, 0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00a9b4",
            borderWidth: 2,
          },
        },
        input: {
          paddingTop: 15,
          paddingBottom: 15,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#64748b",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 20,
        },
      },
    },
  },
});

export default theme;
