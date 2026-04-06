"use client";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { ClientFeatureIconKey } from "./clients.data";

export function useClientsPageTokens() {
  return useTheme().palette.mollure;
}

export function LogoMark() {
  const tokens = useClientsPageTokens();

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.1 }}>
      <Box
        sx={{
          width: 30,
          height: 24,
          position: "relative",
          "& span": {
            position: "absolute",
            display: "block",
            borderRadius: "999px",
            bgcolor: tokens.logoPrimary,
          },
          "& span:nth-of-type(1)": {
            inset: "1px 11px 1px 11px",
            transform: "rotate(50deg)",
          },
          "& span:nth-of-type(2)": {
            inset: "1px 11px 1px 11px",
            transform: "rotate(-50deg)",
          },
          "& span:nth-of-type(3)": {
            inset: "8px 0 8px 0",
            bgcolor: tokens.logoAccent,
          },
          "& span:nth-of-type(4)": {
            inset: "0 6px 0 6px",
            transform: "rotate(90deg)",
            bgcolor: tokens.logoSecondary,
          },
        }}
      >
        <span />
        <span />
        <span />
        <span />
      </Box>
      <Typography
        sx={{
          fontSize: 22,
          fontWeight: 700,
          color: tokens.logoText,
          letterSpacing: "-0.02em",
        }}
      >
        Mollure
      </Typography>
    </Box>
  );
}

export function FilterField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const tokens = useClientsPageTokens();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          mb: 0.75,
          fontSize: 11,
          fontWeight: 700,
          color: tokens.slate,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        placeholder={placeholder}
        size="small"
        InputProps={{
          endAdornment: <ArrowDropDownRoundedIcon sx={{ color: tokens.placeholder }} />,
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 42,
            bgcolor: "#fff",
            borderRadius: 2,
            fontSize: 13,
            color: tokens.navy,
            "& fieldset": {
              borderColor: tokens.inputBorder,
            },
            "&:hover fieldset": {
              borderColor: tokens.inputBorderHover,
            },
            "&.Mui-focused fieldset": {
              borderColor: tokens.teal,
              borderWidth: 1,
            },
          },
          "& input::placeholder": {
            color: tokens.placeholder,
            opacity: 1,
          },
        }}
      />
    </Box>
  );
}

export function getFeatureIcon(iconKey: ClientFeatureIconKey) {
  const iconStyles = { fontSize: 26 };

  switch (iconKey) {
    case "location":
      return <FmdGoodOutlinedIcon sx={iconStyles} />;
    case "booking":
      return <AccessTimeRoundedIcon sx={iconStyles} />;
    case "communication":
      return <CallRoundedIcon sx={iconStyles} />;
    case "personal":
      return <CheckCircleRoundedIcon sx={iconStyles} />;
    case "payment":
      return <CreditCardRoundedIcon sx={iconStyles} />;
    case "verified":
      return <VerifiedRoundedIcon sx={iconStyles} />;
    default:
      return <VerifiedRoundedIcon sx={iconStyles} />;
  }
}
