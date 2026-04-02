"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0d47a1",
    },
    secondary: {
      main: "#00695f",
    },
    background: {
      default: "#f5f7fb",
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
