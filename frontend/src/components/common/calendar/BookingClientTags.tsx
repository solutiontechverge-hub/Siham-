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

function TagPill({ label }: { label: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        height: 18,
        px: 0.65,
        borderRadius: "999px",
        bgcolor: alpha(m.navy, 0.06),
        color: alpha(m.navy, 0.72),
        border: `1px solid ${alpha(m.navy, 0.14)}`,
        fontSize: 9.5,
        fontWeight: 900,
        lineHeight: 1,
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
          <TagPill label="IC" />
        )
      ) : null}
    </Stack>
  );
}
