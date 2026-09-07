"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppTextField from "../AppTextField";
import AppTimePicker from "../AppTimePicker";
import {
  formatTimeWindowDurationLabel,
} from "../../../data/bookingServiceEdit.data";

export type BookingDrawerPlanningItem = {
  id: string;
  planningActivity?: string;
  planningDuration?: string;
  planningStartTime?: string;
  planningEndTime?: string;
};

type BookingDrawerPlanningGroupProps = {
  items: readonly BookingDrawerPlanningItem[];
  disabled?: boolean;
  showRemove?: boolean;
  onActivityChange: (id: string, value: string) => void;
  onStartTimeChange: (id: string, startTime: string) => void;
  onEndTimeChange: (id: string, endTime: string) => void;
  onRemove: (id: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
};

export default function BookingDrawerPlanningGroup({
  items,
  disabled = false,
  showRemove = false,
  onActivityChange,
  onStartTimeChange,
  onEndTimeChange,
  onRemove,
  onReorder,
}: BookingDrawerPlanningGroupProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const canReorder = Boolean(onReorder) && items.length > 1 && !disabled;

  if (!items.length) return null;

  return (
    <Box>
      <BodyText
        sx={{
          fontSize: 12,
          fontWeight: 900,
          color: alpha(m.navy, 0.65),
          mb: 0.75,
        }}
      >
        Planning
      </BodyText>
      <Box
        sx={{
          borderRadius: "12px",
          bgcolor: theme.palette.secondary.main,
          border: `1px solid ${alpha(m.teal, 0.22)}`,
          p: 1.5,
        }}
      >
        <Stack spacing={1.5}>
          {items.map((item) => {
            const durationLabel = formatTimeWindowDurationLabel(
              item.planningStartTime,
              item.planningEndTime,
              item.planningDuration,
            );

            return (
              <Box
                key={item.id}
                onDragOver={(event) => {
                  if (!canReorder) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  if (!canReorder || !draggingId) return;
                  event.preventDefault();
                  onReorder?.(draggingId, item.id);
                  setDraggingId(null);
                }}
                sx={{
                  opacity: draggingId === item.id ? 0.55 : 1,
                  outline:
                    draggingId && draggingId !== item.id
                      ? `2px dashed ${alpha(m.teal, 0.45)}`
                      : "none",
                  outlineOffset: 2,
                  borderRadius: "10px",
                  transition: "opacity 0.15s, outline-color 0.15s",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    draggable={canReorder}
                    onDragStart={(event) => {
                      if (!canReorder) return;
                      setDraggingId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      py: 0.25,
                      userSelect: "none",
                      cursor: canReorder ? "grab" : "default",
                      "&:active": canReorder ? { cursor: "grabbing" } : undefined,
                    }}
                    aria-label={
                      canReorder
                        ? `Reorder ${item.planningActivity || "planning"}`
                        : undefined
                    }
                  >
                    {canReorder ? (
                      <Box
                        sx={{
                          display: "flex",
                          color: alpha(m.navy, 0.38),
                          flexShrink: 0,
                        }}
                        aria-hidden
                      >
                        <DragIndicatorRoundedIcon sx={{ fontSize: 18 }} />
                      </Box>
                    ) : null}
                    <BodyText
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      Planning
                    </BodyText>
                  </Stack>
                  {showRemove ? (
                    <IconButton
                      size="small"
                      onClick={() => onRemove(item.id)}
                      onMouseDown={(event) => event.stopPropagation()}
                      sx={{ color: alpha(m.navy, 0.35) }}
                      aria-label={`Remove ${item.planningActivity || "planning"}`}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  ) : null}
                </Stack>

                <Box
                  sx={{
                    borderRadius: "10px",
                    bgcolor: "#fff",
                    p: 1.25,
                  }}
                >
                  <BodyText
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.62),
                      mb: 0.5,
                    }}
                  >
                    Activity
                  </BodyText>
                  <AppTextField
                    value={item.planningActivity ?? ""}
                    onChange={(event) =>
                      onActivityChange(item.id, event.target.value)
                    }
                    placeholder="Photoshoot"
                    fullWidth
                    disabled={disabled}
                    sx={{ mb: 1.5 }}
                  />
                  <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AppTimePicker
                        label="Start Time"
                        value={item.planningStartTime ?? ""}
                        onChange={(startTime) =>
                          onStartTimeChange(item.id, startTime)
                        }
                        minuteStep={15}
                        fullWidth
                        disabled={disabled}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AppTimePicker
                        label="End Time"
                        value={item.planningEndTime ?? ""}
                        onChange={(endTime) =>
                          onEndTimeChange(item.id, endTime)
                        }
                        minuteStep={15}
                        fullWidth
                        disabled={disabled}
                      />
                    </Box>
                  </Stack>
                  <AppTextField
                    label="Duration"
                    placeholder="—"
                    value={durationLabel}
                    fullWidth
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
