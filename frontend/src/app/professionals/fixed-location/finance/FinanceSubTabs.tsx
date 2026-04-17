"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const OVERVIEW_HREF = "/professionals/fixed-location/finance/overview";
const SETTING_HREF = "/professionals/fixed-location/finance/setting";

export default function FinanceSubTabs() {
  const pathname = usePathname();
  const theme = useTheme();
  const m = theme.palette.mollure;

  const isOverview = pathname === OVERVIEW_HREF || pathname === "/professionals/fixed-location/finance";
  const isSetting = pathname?.includes("/finance/setting") ?? false;

  const tabSx = (active: boolean) => ({
    textTransform: "none" as const,
    fontWeight: 800,
    fontSize: 14,
    borderRadius: "10px",
    px: 2.5,
    py: 1.15,
    minHeight: 44,
    flex: "1 1 0",
    bgcolor: active ? "primary.main" : "transparent",
    color: active ? "#fff" : alpha(m.navy, 0.62),
    boxShadow: "none",
    "&:hover": { bgcolor: active ? "mollure.tealDark" : alpha(m.navy, 0.04) },
  });

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#fff",
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.12)}`,
        p: 0.5,
        display: "flex",
        gap: 0.75,
      }}
    >
      <Button component={Link} href={OVERVIEW_HREF} disableElevation sx={tabSx(isOverview)}>
        Overview
      </Button>
      <Button component={Link} href={SETTING_HREF} disableElevation sx={tabSx(isSetting)}>
        Setting
      </Button>
    </Box>
  );
}
