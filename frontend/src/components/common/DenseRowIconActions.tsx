"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureDenseIconButtonSx } from "./mollureFormSx";

/** Compact centered Edit/Delete icon pair for dense table rows. */
export default function DenseRowIconActions({
  onEdit,
  onDelete,
  spacing = 0.35,
}: {
  onEdit?: (() => void) | null;
  onDelete: () => void;
  spacing?: number;
}) {
  const m = useTheme().palette.mollure;
  const iconSx = { fontSize: 16, color: alpha(m.navy, 0.55) };
  return (
    <Stack direction="row" spacing={spacing} justifyContent="center">
      {onEdit ? (
        <IconButton size="small" onClick={onEdit} sx={mollureDenseIconButtonSx}>
          <EditOutlinedIcon sx={iconSx} />
        </IconButton>
      ) : null}
      <IconButton size="small" onClick={onDelete} sx={mollureDenseIconButtonSx}>
        <DeleteOutlineRoundedIcon sx={iconSx} />
      </IconButton>
    </Stack>
  );
}
