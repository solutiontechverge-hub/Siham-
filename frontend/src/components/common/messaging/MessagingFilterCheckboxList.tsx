"use client";

import * as React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Checkbox, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type MessagingFilterOption = {
  key: string;
  label: string;
  info?: boolean;
};

type Props = {
  title?: string;
  options: MessagingFilterOption[];
  checked: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
  singleSelect?: boolean;
};

export default function MessagingFilterCheckboxList({ title, options, checked, onToggle, singleSelect }: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Box>
      {title ? (
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.75), mb: 1 }}>{title}</Typography>
      ) : null}
      <Stack divider={<Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />}>
        {options.map((opt) => (
          <Stack
            key={opt.key}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.1 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: alpha(m.navy, 0.62) }}>{opt.label}</Typography>
              {opt.info ? <InfoOutlinedIcon sx={{ fontSize: 15, color: m.teal }} /> : null}
            </Stack>
            <Checkbox
              size="small"
              checked={Boolean(checked[opt.key])}
              onChange={(_, value) => {
                if (singleSelect) {
                  const next: Record<string, boolean> = {};
                  options.forEach((o) => {
                    next[o.key] = o.key === opt.key ? value : false;
                  });
                  options.forEach((o) => onToggle(o.key, Boolean(next[o.key])));
                } else {
                  onToggle(opt.key, value);
                }
              }}
              sx={{ color: alpha(m.navy, 0.3), "&.Mui-checked": { color: m.teal } }}
            />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
