"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CompanyClientTag from "./CompanyClientTag";

export function bookingClientTypeTag(
  clientKind?: "individual" | "company" | null,
): "IC" | "CC" {
  return clientKind === "company" ? "CC" : "IC";
}

export function bookingClientOptionLabel(input: {
  name: string;
  isMollure?: boolean;
  clientKind?: "individual" | "company" | null;
}): string {
  const tags: string[] = [];
  if (input.isMollure) tags.push("Mollure");
  tags.push(bookingClientTypeTag(input.clientKind));
  return `${input.name} · ${tags.join(" · ")}`;
}

function TagPill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "type";
}) {
  const m = useTheme().palette.mollure;
  const isType = tone === "type";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        height: 18,
        px: 0.85,
        borderRadius: "999px",
        bgcolor: isType ? alpha(m.teal, 0.12) : alpha(m.navy, 0.06),
        color: isType ? m.teal : alpha(m.navy, 0.72),
        border: `1px solid ${isType ? alpha(m.teal, 0.28) : alpha(m.navy, 0.14)}`,
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: isType ? "0.04em" : 0,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

export default function BookingClientTags({
  isMollure,
  clientKind,
  showType = true,
}: {
  isMollure?: boolean;
  clientKind?: "individual" | "company" | null;
  showType?: boolean;
}) {
  const type = bookingClientTypeTag(clientKind);
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
      {isMollure ? <TagPill label="Mollure" /> : null}
      {showType ? (
        type === "CC" ? (
          <CompanyClientTag variant="pill" />
        ) : (
          <TagPill label="IC" tone="type" />
        )
      ) : null}
    </Stack>
  );
}
