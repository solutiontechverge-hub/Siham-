"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ManualEntryCatalogOption } from "./manualEntry.data";
import { formatEurAmount } from "./manualEntry.data";

type ManualEntryCatalogPickerProps = {
  label: string;
  options: ManualEntryCatalogOption[];
  emptyLabel?: string;
  onSelect: (option: ManualEntryCatalogOption) => void;
};

export default function ManualEntryCatalogPicker({
  label,
  options,
  emptyLabel = "No options available",
  onSelect,
}: ManualEntryCatalogPickerProps) {
  const m = useTheme().palette.mollure;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleSelect = (option: ManualEntryCatalogOption) => {
    onSelect(option);
    setOpen(false);
  };

  return (
    <Box ref={rootRef}>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setOpen((prev) => !prev)}
        startIcon={<AddRoundedIcon sx={{ fontSize: 18, color: m.teal }} />}
        endIcon={
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 20,
              color: alpha(m.navy, 0.45),
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          />
        }
        sx={{
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 800,
          fontSize: 12.5,
          justifyContent: "flex-start",
          borderColor: open ? m.teal : alpha(m.navy, 0.1),
          color: alpha(m.navy, 0.78),
          bgcolor: "#fff",
          height: 42,
          px: 1.5,
        }}
      >
        {label}
      </Button>

      {open ? (
        <Paper
          elevation={0}
          sx={{
            mt: 0.75,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.06)",
            overflow: "hidden",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {options.length === 0 ? (
            <Box sx={{ px: 1.5, py: 1.25 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
                {emptyLabel}
              </Typography>
            </Box>
          ) : (
            options.map((option) => (
              <Box
                key={option.id}
                onClick={() => handleSelect(option)}
                sx={{
                  px: 1.5,
                  py: 1.1,
                  cursor: "pointer",
                  borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
                  "&:last-of-type": { borderBottom: 0 },
                  "&:hover": { bgcolor: alpha(m.navy, 0.02) },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                    {option.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), flexShrink: 0 }}>
                    {formatEurAmount(option.unitPrice)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Paper>
      ) : null}
    </Box>
  );
}
