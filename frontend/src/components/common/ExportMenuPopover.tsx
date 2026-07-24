"use client";

import AppButton from "./AppButton";
import * as React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, ButtonBase, Divider, Menu, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

export type ExportMenuOption = {
  id: string;
  label: string;
};

export type ExportMenuPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  options: readonly ExportMenuOption[];
  selectedIds: readonly string[];
  allSelected: boolean;
  onSelectAll: () => void;
  onToggle: (opt: ExportMenuOption) => void;
  onDownloadSelected: () => void;
};

function ExportCheckbox({ checked }: { checked: boolean }) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      sx={{
        width: 27,
        height: 27,
        borderRadius: "7px",
        border: `2px solid ${checked ? m.teal : "rgba(101, 115, 141, 0.24)"}`,
        bgcolor: checked ? m.teal : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {checked ? (
        <CheckRoundedIcon sx={{ fontSize: 21, color: "#fff" }} />
      ) : null}
    </Box>
  );
}

export default function ExportMenuPopover({
  anchorEl,
  open,
  onClose,
  options,
  selectedIds,
  allSelected,
  onSelectAll,
  onToggle,
  onDownloadSelected,
}: ExportMenuPopoverProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const selectedCount = allSelected ? options.length : selectedIds.length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 372,
          borderRadius: "18px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 24px 50px rgba(16,35,63,0.24)",
          overflow: "hidden",
          p: 0,
        },
      }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      <Stack sx={{ px: 2.6, py: 2.2, bgcolor: "#fff" }}>
        <ButtonBase
          onClick={onSelectAll}
          sx={{
            width: "100%",
            py: 1.05,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            textAlign: "left",
          }}
        >
          <BodyText
            sx={{ fontSize: 20, fontWeight: 700, color: alpha(m.navy, 0.68) }}
          >
            All
          </BodyText>
          <ExportCheckbox checked={allSelected} />
        </ButtonBase>

        <Divider sx={{ borderColor: alpha(m.navy, 0.16), m: 0 }} />

        {options.map((opt, idx) => (
          <React.Fragment key={opt.id}>
            <ButtonBase
              onClick={() => onToggle(opt)}
              sx={{
                width: "100%",
                py: 1.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                textAlign: "left",
              }}
            >
              <BodyText
                sx={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.68),
                }}
              >
                {opt.label}
              </BodyText>
              <ExportCheckbox
                checked={!allSelected && selectedIds.includes(opt.id)}
              />
            </ButtonBase>
            {idx < options.length - 1 ? (
              <Divider sx={{ borderColor: alpha(m.navy, 0.16), m: 0 }} />
            ) : null}
          </React.Fragment>
        ))}

        <AppButton
          tone="primary"
          disabled={!selectedCount}
          onClick={onDownloadSelected}
          sx={{
            mt: 1.8,
          }}
        >
          Download
        </AppButton>
      </Stack>
    </Menu>
  );
}
