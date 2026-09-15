"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paper, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";
import {
  locationTopTabLinkSx,
  locationTopTabsPaperSx,
  locationTopTabsStackSx,
} from "./locationTopTabs.styles";

export type FixedLocationTopTab = {
  label: string;
  href: string;
};

export type FixedLocationTopTabsProps = {
  tabs: readonly FixedLocationTopTab[];
  activeLabel: string;
};

export default function FixedLocationTopTabs({
  tabs,
  activeLabel,
}: FixedLocationTopTabsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [, startTransition] = React.useTransition();

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
              prefetch
              scroll={false}
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                if (active) return;
                startTransition(() => {
                  router.push(t.href, { scroll: false });
                });
              }}
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
