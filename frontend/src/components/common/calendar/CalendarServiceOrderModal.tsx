"use client";

import { ModalCancelApplyFooter } from "../FinanceDrawerFooter";
import * as React from "react";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppModal from "../AppModal";
import {
  normalizeServiceOrderSettings,
  type ServiceOrderSettings,
} from "./calendar-settings.types";
import { dedupeServiceOrderSettings } from "./serviceOrder.utils";

type CalendarServiceOrderModalProps = {
  draft: ServiceOrderSettings;
  onApply: () => void;
  onClose: () => void;
  open: boolean;
  setDraft: React.Dispatch<React.SetStateAction<ServiceOrderSettings>>;
};

function reorderList<T>(list: readonly T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function CalendarServiceOrderModal({
  draft,
  onApply,
  onClose,
  open,
  setDraft,
}: CalendarServiceOrderModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [dragCategory, setDragCategory] = React.useState<string | null>(null);
  const [dragService, setDragService] = React.useState<{
    category: string;
    service: string;
  } | null>(null);
  const categories = draft.categories ?? [];
  const servicesByCategory = draft.servicesByCategory ?? {};

  const moveCategory = (from: number, to: number) => {
    setDraft((prev) => {
      const normalized = dedupeServiceOrderSettings(
        normalizeServiceOrderSettings(prev),
      );
      return {
        ...normalized,
        categories: reorderList(normalized.categories, from, to),
      };
    });
  };

  const moveService = (category: string, from: number, to: number) => {
    setDraft((prev) => {
      const normalized = dedupeServiceOrderSettings(
        normalizeServiceOrderSettings(prev),
      );
      return {
        ...normalized,
        servicesByCategory: {
          ...normalized.servicesByCategory,
          [category]: reorderList(
            normalized.servicesByCategory[category] ?? [],
            from,
            to,
          ),
        },
      };
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Service Order Rules"
      maxWidth="sm"
      fullWidth
      footer={
        <ModalCancelApplyFooter
          onCancel={onClose}
          onPrimary={onApply}
          primaryLabel="Save"
          buttonSx={{ height: 38 }}
        />
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          {categories.map((category, categoryIndex) => (
            <Box
              key={category}
              draggable
              onDragStart={() => setDragCategory(category)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragCategory) return;
                const from = categories.indexOf(dragCategory);
                if (from >= 0) moveCategory(from, categoryIndex);
                setDragCategory(null);
              }}
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                p: 1.25,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <DragIndicatorRoundedIcon
                  sx={{ fontSize: 18, color: alpha(m.navy, 0.35) }}
                />
                <BodyText
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {category}
                </BodyText>
              </Stack>

              <Stack spacing={0.75} sx={{ mt: 1, pl: 3 }}>
                {(servicesByCategory[category] ?? []).map(
                  (service, serviceIndex) => (
                    <Box
                      key={`${category}-${service}`}
                      draggable
                      onDragStart={() => setDragService({ category, service })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragService || dragService.category !== category)
                          return;
                        const from = (
                          servicesByCategory[category] ?? []
                        ).indexOf(dragService.service);
                        if (from >= 0)
                          moveService(category, from, serviceIndex);
                        setDragService(null);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        borderRadius: "8px",
                        px: 1,
                        py: 0.75,
                        bgcolor: alpha(m.navy, 0.02),
                      }}
                    >
                      <DragIndicatorRoundedIcon
                        sx={{ fontSize: 16, color: alpha(m.navy, 0.3) }}
                      />
                      <BodyText
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.68),
                        }}
                      >
                        {service}
                      </BodyText>
                    </Box>
                  ),
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </AppModal>
  );
}
