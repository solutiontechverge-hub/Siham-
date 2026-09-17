"use client";

import * as React from "react";
import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollureBodySx,
  mollureLabelSx,
} from "../../../theme/mollureHierarchy";
import AppButton from "../../../components/common/AppButton";
import AppModal from "../../../components/common/AppModal";
import QtyStepper from "../../../components/common/QtyStepper";
import type { CatalogService } from "./booking.page.types";

export type ClientBookingAddServiceDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  catalog: CatalogService[];
  selectedIds: Record<string, boolean>;
  qtyById: Record<string, number>;
  onToggle: (id: string, checked: boolean) => void;
  onAdjustQty: (id: string, delta: number) => void;
};

export default function ClientBookingAddServiceDialog({
  open,
  onClose,
  onConfirm,
  catalog,
  selectedIds,
  qtyById,
  onToggle,
  onAdjustQty,
}: ClientBookingAddServiceDialogProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add service to assignment list"
      maxWidth="sm"
      contentSx={{ px: 2.5, pt: 0.5, pb: 1 }}
      footer={
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="flex-end"
          sx={{ px: 2.5, py: 2 }}
        >
          <AppButton tone="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            onClick={onConfirm}
            disabled={!Object.values(selectedIds).some(Boolean)}
          >
            Add service
          </AppButton>
        </Stack>
      }
    >
      <Typography
        sx={mollureBodySx(m.navy, {
          fontWeight: 900,
          mb: 0.75,
        })}
      >
        Services
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {catalog.map((item) => {
          const checked = Boolean(selectedIds[item.id]);
          const qty = qtyById[item.id] ?? 1;
          return (
            <Box
              key={item.id}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                px: 1.25,
                py: 1,
                bgcolor: alpha(m.navy, 0.015),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={mollureLabelSx(m.navy, {
                      fontWeight: 900,
                    })}
                  >
                    {item.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: m.teal,
                    }}
                  >
                    {item.durationMins} Mins
                  </Typography>
                </Box>
                <Typography
                  sx={mollureLabelSx(m.navy, {
                    fontWeight: 900,
                    mr: 0.5,
                  })}
                >
                  {item.price} €
                </Typography>
                <QtyStepper
                  value={qty}
                  onDecrement={() => onAdjustQty(item.id, -1)}
                  onIncrement={() => onAdjustQty(item.id, 1)}
                  decrementDisabled={!checked || qty <= 1}
                  incrementDisabled={!checked}
                  valueWidth={22}
                />
                <Checkbox
                  checked={checked}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                  sx={{
                    p: 0.25,
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </AppModal>
  );
}
