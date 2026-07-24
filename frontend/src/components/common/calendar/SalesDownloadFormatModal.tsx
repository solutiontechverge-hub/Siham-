"use client";

import AppButton from "../AppButton";
import { Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal from "../AppModal";

export type SalesDownloadFormat = "pdf" | "excel";

type SalesDownloadFormatModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (format: SalesDownloadFormat) => void;
};

export default function SalesDownloadFormatModal({
  open,
  onClose,
  onSelect,
}: SalesDownloadFormatModalProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Download Invoice"
      maxWidth="xs"
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 650,
          color: alpha(m.navy, 0.62),
          mb: 1.5,
        }}
      >
        Choose a file format
      </Typography>
      <Stack spacing={1}>
        <AppButton
          tone="secondary"
          onClick={() => onSelect("pdf")}
          sx={{
            justifyContent: "flex-start",
            py: 1.25,
          }}
        >
          PDF
        </AppButton>
        <AppButton
          tone="secondary"
          onClick={() => onSelect("excel")}
          sx={{
            justifyContent: "flex-start",
            py: 1.25,
          }}
        >
          Excel
        </AppButton>
      </Stack>
    </AppModal>
  );
}
