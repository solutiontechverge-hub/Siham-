"use client";

import Link from "next/link";
import { Paper, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import {
  locationTopTabLinkSx,
  locationTopTabsPaperSx,
  locationTopTabsStackSx,
} from "../locationTopTabs.styles";

export type DesiredLocationTopTab = {
  label: string;
  href: string;
};

export type DesiredLocationTopTabsProps = {
  tabs: readonly DesiredLocationTopTab[];
  activeLabel: string;
};

export default function DesiredLocationTopTabs({
  tabs,
  activeLabel,
}: DesiredLocationTopTabsProps) {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={locationTopTabsPaperSx()}>
      <Stack direction="row" spacing={0} sx={locationTopTabsStackSx(theme)}>
        {tabs.map((t) => {
          const active = t.label === activeLabel;
          return (
            <BodyText
              key={t.href}
              component={Link}
              href={t.href}
              sx={locationTopTabLinkSx(theme, active)}
            >
              {t.label}
            </BodyText>
          );
        })}
      </Stack>
    </Paper>
  );
}
