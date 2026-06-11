"use client";

import * as React from "react";
import { Box, ButtonBase, Checkbox, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { DesiredLocationIcon, FixedLocationIcon } from "../../../../images";

export type ListingLocationMode = "fixed" | "desired";

export type ListingLocationModeCardsProps = {
  value: ListingLocationMode[];
  onChange: (next: ListingLocationMode[]) => void;
};

function LocationModeCard({
  mode,
  active,
  onToggle,
}: {
  mode: ListingLocationMode;
  active: boolean;
  onToggle: () => void;
}) {
  const tokens = useTheme().palette.mollure;
  const icon = mode === "fixed" ? FixedLocationIcon : DesiredLocationIcon;
  const label = mode === "fixed" ? "Fixed Location" : "Desired Location";

  return (
    <ButtonBase
      onClick={onToggle}
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.5,
        py: 1.15,
        borderRadius: "10px",
        bgcolor: tokens.fxGrayF2F4F7,
        border: `1px solid ${active ? alpha(tokens.teal, 0.35) : alpha(tokens.navy, 0.08)}`,
        textAlign: "left",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Box sx={{ width: 20, height: 20, flexShrink: 0, display: "grid", placeItems: "center" }}>
          <Image src={icon} alt="" width={20} height={20} />
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(tokens.navy, 0.78) }} noWrap>
          {label}
        </Typography>
      </Stack>
      <Checkbox
        checked={active}
        size="small"
        tabIndex={-1}
        disableRipple
        sx={{
          p: 0.25,
          color: alpha(tokens.navy, 0.28),
          "&.Mui-checked": { color: tokens.teal },
        }}
      />
    </ButtonBase>
  );
}

export default function ListingLocationModeCards({ value, onChange }: ListingLocationModeCardsProps) {
  const toggleMode = (mode: ListingLocationMode) => {
    const selected = value.includes(mode);
    onChange(selected ? value.filter((item) => item !== mode) : [...value, mode]);
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <LocationModeCard
        mode="fixed"
        active={value.includes("fixed")}
        onToggle={() => toggleMode("fixed")}
      />
      <LocationModeCard
        mode="desired"
        active={value.includes("desired")}
        onToggle={() => toggleMode("desired")}
      />
    </Stack>
  );
}
