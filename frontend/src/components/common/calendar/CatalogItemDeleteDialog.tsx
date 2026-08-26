"use client";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppButton from "../AppButton";
import AppModal from "../AppModal";

type CatalogItemDeleteDialogProps = {
  open: boolean;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CatalogItemDeleteDialog({
  open,
  itemName,
  onClose,
  onConfirm,
}: CatalogItemDeleteDialogProps) {
  const m = useTheme().palette.mollure;
  const label = itemName?.trim() ? `"${itemName.trim()}"` : "this item";

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Delete item"
      maxWidth="sm"
      fullWidth
      headerTone="danger"
      footer={
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="center" spacing={1.25}>
            <AppButton
              tone="secondary"
              onClick={onClose}
              sx={{ height: 40, minWidth: 120 }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="danger"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              sx={{ height: 40, minWidth: 120 }}
            >
              Yes, Delete
            </AppButton>
          </Stack>
        </Box>
      }
    >
      <Box sx={{ py: 3, px: 2.5, textAlign: "center" }}>
        <WarningAmberRoundedIcon
          sx={{ fontSize: 56, color: "#E85D5D", mb: 1.75 }}
        />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 14,
            color: alpha(m.navy, 0.88),
            lineHeight: 1.55,
            px: 1,
          }}
        >
          Are you sure you want to permanently delete {label}? This cannot be
          undone.
        </Typography>
      </Box>
    </AppModal>
  );
}
