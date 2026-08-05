"use client";

import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import Box from "@mui/material/Box";
import SvgIcon from "@mui/material/SvgIcon";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import type { ClientFeatureIconKey } from "./clients.data";
import { BodyText, CardTitle } from "../../components/ui/typography";

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
      <CardTitle
        sx={{
          fontSize: 22,
          color: tokens.logoText,
          letterSpacing: "-0.02em",
        }}
      >
        Mollure
      </CardTitle>
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
      <BodyText
        sx={{
          mb: 0.75,
          fontSize: 11,
          color: tokens.slate,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </BodyText>
      <TextField
        fullWidth
        placeholder={placeholder}
        size="small"
        InputProps={{
          endAdornment: (
            <ArrowDropDownRoundedIcon sx={{ color: tokens.placeholder }} />
          ),
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

function PersonalBusinessIcon({ sx }: { sx?: { fontSize?: number } }) {
  return (
    <SvgIcon sx={sx} viewBox="0 0 24 24">
      <path d="M3.5 21V6.75C3.5 5.78 4.28 5 5.25 5h7.5c.97 0 1.75.78 1.75 1.75V21H3.5zm3.25-11.5h2v2h-2v-2zm0 3.5h2v2h-2v-2zm0 3.5h2v2h-2v-2zm3.5-7h2v2h-2v-2zm0 3.5h2v2h-2v-2zm0 3.5h2v2h-2v-2z" />
      <circle cx="17.75" cy="12.25" r="2.35" />
      <path d="M17.75 15.2c-2.35 0-4.25 1.15-4.25 2.55V21h8.5v-3.25c0-1.4-1.9-2.55-4.25-2.55z" />
    </SvgIcon>
  );
}

export function getFeatureIcon(iconKey: ClientFeatureIconKey) {
  const iconStyles = { fontSize: 26 };

  switch (iconKey) {
    case "location":
      return <FmdGoodRoundedIcon sx={iconStyles} />;
    case "booking":
      return <SyncRoundedIcon sx={iconStyles} />;
    case "communication":
      return <ForumRoundedIcon sx={iconStyles} />;
    case "personal":
      return <PersonalBusinessIcon sx={iconStyles} />;
    case "payment":
      return <GppGoodRoundedIcon sx={iconStyles} />;
    case "verified":
      return <VerifiedRoundedIcon sx={iconStyles} />;
    default:
      return <VerifiedRoundedIcon sx={iconStyles} />;
  }
}
