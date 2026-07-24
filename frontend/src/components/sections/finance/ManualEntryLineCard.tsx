"use client";

import * as React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ManualEntryLine } from "./manualEntry.data";
import { formatEurAmount, lineTotal } from "./manualEntry.data";

type ManualEntryLineCardProps = {
  line: ManualEntryLine;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ManualEntryLineCard({
  line,
  onEdit,
  onDelete,
}: ManualEntryLineCardProps) {
  const m = useTheme().palette.mollure;
  const total = lineTotal(line);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.86) }}
        >
          {line.name}{" "}
          <Box
            component="span"
            sx={{ fontWeight: 600, color: alpha(m.navy, 0.65) }}
          >
            {line.quantity}x
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: alpha(m.navy, 0.5),
            mt: 0.35,
          }}
        >
          €{line.unitPrice}
        </Typography>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.25}
        sx={{ flexShrink: 0 }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 800,
            color: alpha(m.navy, 0.86),
            mr: 0.5,
          }}
        >
          {formatEurAmount(total)}
        </Typography>
        <IconButton
          size="small"
          aria-label={`Edit ${line.name}`}
          onClick={onEdit}
          sx={{
            width: 30,
            height: 30,
            color: alpha(m.navy, 0.45),
            "&:hover": { bgcolor: alpha(m.navy, 0.05) },
          }}
        >
          <EditRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label={`Delete ${line.name}`}
          onClick={onDelete}
          sx={{
            width: 30,
            height: 30,
            color: alpha(m.navy, 0.45),
            "&:hover": { bgcolor: alpha(m.navy, 0.05) },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
