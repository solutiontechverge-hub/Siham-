"use client";

import { Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureModal from "../MollureModal";

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
    <MollureModal open={open} onClose={onClose} title="Download Invoice" maxWidth="xs">
      <Typography sx={{ fontSize: 13, fontWeight: 650, color: alpha(m.navy, 0.62), mb: 1.5 }}>
        Choose a file format
      </Typography>
      <Stack spacing={1}>
        <Button
          variant="outlined"
          onClick={() => onSelect("pdf")}
          sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "10px",
            borderColor: alpha(m.navy, 0.14),
            color: alpha(m.navy, 0.8),
            py: 1.25,
          }}
        >
          PDF
        </Button>
        <Button
          variant="outlined"
          onClick={() => onSelect("excel")}
          sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "10px",
            borderColor: alpha(m.navy, 0.14),
            color: alpha(m.navy, 0.8),
            py: 1.25,
          }}
        >
          Excel
        </Button>
      </Stack>
    </MollureModal>
  );
}
