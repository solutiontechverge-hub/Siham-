"use client";

import * as React from "react";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../AppSearchField";
import MessagingAvatar from "./MessagingAvatar";
import type { MessagingThread } from "./messagingTypes";
import { messagingSearchPlaceholder, type MessagingAudience } from "./messagingRoutes";

type Props = {
  audience: MessagingAudience;
  currentUserName: string;
  currentUserAvatarSrc?: string;
  search: string;
  onSearchChange: (value: string) => void;
  threads: MessagingThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  selectedIds: Set<string>;
  selectAll: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: (event: unknown, checked: boolean) => void;
  onRequestDelete: () => void;
  onOpenSettings: () => void;
  onOpenFilters: () => void;
};

export default function MessagingConversationSidebar({
  audience,
  currentUserName,
  currentUserAvatarSrc,
  search,
  onSearchChange,
  threads,
  activeThreadId,
  onSelectThread,
  selectedIds,
  selectAll,
  onToggleSelect,
  onSelectAll,
  onRequestDelete,
  onOpenSettings,
  onOpenFilters,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "34%" },
        minWidth: { md: 300 },
        maxWidth: { md: 380 },
        borderRight: { md: `1px solid ${alpha(m.navy, 0.08)}` },
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              src={currentUserAvatarSrc}
              sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 900, bgcolor: alpha(m.teal, 0.15), color: m.teal }}
            >
              {currentUserName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Typography sx={{ fontWeight: 900, fontSize: 18, color: alpha(m.navy, 0.9) }}>Messaging</Typography>
          </Stack>
          <Stack direction="row" spacing={0.25}>
            <IconButton size="small" aria-label="Settings" onClick={onOpenSettings}>
              <SettingsRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }} />
            </IconButton>
            <IconButton size="small" aria-label="Filter" onClick={onOpenFilters}>
              <TuneRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }} />
            </IconButton>
          </Stack>
        </Stack>

        <Box sx={{ mt: 1.75 }}>
          <AppSearchField
            fullWidth
            placeholder={messagingSearchPlaceholder(audience)}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
                fontSize: 13,
                "& fieldset": { borderColor: alpha(m.navy, 0.14) },
              },
            }}
          />
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onRequestDelete}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: 12,
              borderRadius: "8px",
              color: "#D32F2F",
              borderColor: alpha("#D32F2F", 0.45),
              px: 2,
              py: 0.55,
              "&:hover": { borderColor: "#D32F2F", bgcolor: alpha("#D32F2F", 0.04) },
            }}
          >
            Delete
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={selectAll}
                onChange={onSelectAll}
                sx={{ color: alpha(m.navy, 0.35), "&.Mui-checked": { color: m.teal } }}
              />
            }
            label={<Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}>Select All</Typography>}
          />
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
        {threads.length === 0 ? (
          <Typography sx={{ px: 2, py: 3, fontSize: 13, color: alpha(m.navy, 0.45), fontWeight: 600 }}>
            {search.trim()
              ? "No professionals match your search. Try a name or booking ID (e.g. B500844)."
              : "No conversations match the current filters."}
          </Typography>
        ) : (
          threads.map((thread) => {
            const active = thread.id === activeThreadId;
            const checked = selectedIds.has(thread.id);
            return (
              <Box
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  px: 2,
                  py: 1.6,
                  cursor: "pointer",
                  bgcolor: active ? alpha(m.navy, 0.04) : "transparent",
                  borderLeft: active ? `4px solid ${m.teal}` : "4px solid transparent",
                  "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                }}
              >
                <MessagingAvatar seed={thread.avatarSeed} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.88) }} noWrap>
                        {thread.name}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.45) }} noWrap>
                        {thread.bookingMeta}
                      </Typography>
                      <CheckCircleRoundedIcon sx={{ fontSize: 13, color: "#4CAF50" }} />
                    </Stack>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.42), whiteSpace: "nowrap" }}>
                      {thread.timeLabel}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 11.5,
                      lineHeight: 1.45,
                      fontWeight: 500,
                      color: alpha(m.navy, 0.5),
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {thread.preview}
                  </Typography>
                </Box>
                <Checkbox
                  size="small"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleSelect(thread.id)}
                  sx={{ mt: -0.25, color: alpha(m.navy, 0.35), "&.Mui-checked": { color: m.teal } }}
                />
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
