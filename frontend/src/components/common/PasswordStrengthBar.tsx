"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getPasswordStrength } from "../../lib/passwordStrength";

type PasswordStrengthBarProps = {
  password: string;
};

const strengthColors = {
  weak: "#e05a47",
  medium: "#f2a93b",
  strong: "#1da672",
} as const;

export default function PasswordStrengthBar({
  password,
}: PasswordStrengthBarProps) {
  if (!password) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const activeBars =
    strength.level === "strong" ? 3 : strength.level === "medium" ? 2 : 1;
  const activeColor = strengthColors[strength.level];

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 0.75,
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              height: 6,
              borderRadius: 999,
              backgroundColor:
                index < activeBars ? activeColor : alpha("#10233f", 0.1),
              transition: "background-color 160ms ease",
            }}
          />
        ))}
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.75,
          color: activeColor,
          fontWeight: 700,
        }}
      >
        Password strength: {strength.label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.25,
          color: alpha("#10233f", 0.68),
        }}
      >
        Only strong passwords are accepted. Use 8+ characters with upper, lower,
        number, and special character.
      </Typography>
    </Box>
  );
}
