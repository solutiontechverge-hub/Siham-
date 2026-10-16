"use client";

import AppButton from "../AppButton";
import * as React from "react";
import NextLink from "next/link";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Avatar,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../AppSearchField";
import MessagingAvatar from "./MessagingAvatar";
import MessagingThreadPreviewLine from "./MessagingThreadPreviewLine";
import {
  getMessagingBookingHref,
  getMessagingPeerProfileHref,
  messagingSearchPlaceholder,
  type MessagingAudience,
} from "./messagingRoutes";
import type { MessagingThread } from "./messagingTypes";


type Props = {
  audience: MessagingAudience;
  currentUserName: string;
  currentUserAvatarSrc?: string;
  embedded?: boolean;
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
  onClose?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  showBulkActions?: boolean;
  /** When false, disable settings / filters / bulk actions (search stays enabled). */
  actionsEnabled?: boolean;
};

export default function MessagingConversationSidebar({
  audience,
  currentUserName,
  currentUserAvatarSrc,
  embedded = false,
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
  onClose,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  showBulkActions = true,
  actionsEnabled = true,
}: Props) {
  const m = useTheme().palette.mollure;
  const hasThreads = threads.length > 0;
  const canUseListActions = actionsEnabled && hasThreads;

  return (
    <Box
      sx={{
        width: { xs: "100%", md: embedded ? "38%" : "34%" },
        minWidth: { md: embedded ? 220 : 300 },
        maxWidth: { md: embedded ? 320 : 380 },
        flex: {
          xs: threads.length === 0 ? "0 0 auto" : "1 1 auto",
          md: embedded ? "0 0 38%" : undefined,
        },
        borderRight: { md: `1px solid ${alpha(m.navy, 0.08)}` },
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          px: { xs: 1.25, sm: 1.5, md: embedded ? 1.5 : 2 },
          pt: { xs: 1, sm: embedded ? 1.25 : 2 },
          pb: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ minWidth: 0 }}
          >
            <Avatar
              src={currentUserAvatarSrc}
              alt={currentUserName}
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                fontWeight: 900,
                bgcolor: alpha(m.teal, 0.15),
                color: m.teal,
                flexShrink: 0,
              }}
            >
              {currentUserName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 13, sm: embedded ? 14 : 15 },
                  color: alpha(m.navy, 0.92),
                  lineHeight: 1.25,
                }}
              >
                {currentUserName}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 11, sm: 12 },
                  color: alpha(m.navy, 0.48),
                  lineHeight: 1.2,
                }}
              >
                Messaging
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              aria-label="Settings"
              onClick={onOpenSettings}
              disabled={!canUseListActions}
            >
              <SettingsRoundedIcon
                sx={{
                  fontSize: 20,
                  color: alpha(m.navy, canUseListActions ? 0.45 : 0.22),
                }}
              />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Filter"
              onClick={onOpenFilters}
              disabled={!canUseListActions}
            >
              <TuneRoundedIcon
                sx={{
                  fontSize: 20,
                  color: alpha(m.navy, canUseListActions ? 0.45 : 0.22),
                }}
              />
            </IconButton>
            {embedded && onClose ? (
              <IconButton
                size="small"
                aria-label="Close messaging"
                onClick={onClose}
              >
                <CloseRoundedIcon
                  sx={{ fontSize: 20, color: alpha(m.navy, 0.45) }}
                />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>

        <Box sx={{ mt: { xs: 1.25, sm: 1.75 } }}>
          <AppSearchField
            fullWidth
            placeholder={messagingSearchPlaceholder(audience)}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                fontSize: { xs: 12, sm: 13 },
                "& fieldset": { borderColor: alpha(m.navy, 0.14) },
              },
            }}
          />
        </Box>

        {showBulkActions ? (
          <Stack spacing={1} sx={{ mt: { xs: 1.25, sm: 1.5 } }}>
            <AppButton
              variant="outlined"
              size="small"
              disabled={!canUseListActions}
              onClick={onRequestDelete}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                borderRadius: "8px",
                color: "#D32F2F",
                borderColor: alpha("#D32F2F", 0.45),
                px: 2,
                py: 0.55,
                "&:hover": {
                  borderColor: "#D32F2F",
                  bgcolor: alpha("#D32F2F", 0.04),
                },
                "&.Mui-disabled": {
                  color: alpha("#D32F2F", 0.35),
                  borderColor: alpha("#D32F2F", 0.2),
                },
              }}
            >
              Delete
            </AppButton>
            <FormControlLabel
              disabled={!canUseListActions}
              control={
                <Checkbox
                  size="small"
                  checked={selectAll}
                  onChange={onSelectAll}
                  disabled={!canUseListActions}
                  sx={{
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, canUseListActions ? 0.55 : 0.3),
                  }}
                >
                  Select All
                </Typography>
              }
              sx={{ mr: 0, ml: 0, alignSelf: "flex-end" }}
            />
          </Stack>
        ) : null}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {threads.length === 0 ? (
          search.trim() ? (
            <Typography
              sx={{
                px: 2,
                py: 3,
                fontSize: 13,
                color: alpha(m.navy, 0.45),
                fontWeight: 600,
              }}
            >
              {audience === "professional"
                ? "No client conversations match your search. Try a client name or booking ID."
                : "No professionals match your search. Try a name or booking ID (e.g. B500844)."}
            </Typography>
          ) : null
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
                  px: { xs: 1.25, sm: 2 },
                  py: { xs: 1.25, sm: 1.6 },
                  cursor: "pointer",
                  bgcolor: active ? alpha(m.navy, 0.04) : "transparent",
                  borderLeft: active
                    ? `4px solid ${m.teal}`
                    : "4px solid transparent",
                  "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                }}
              >
                <MessagingAvatar seed={thread.avatarSeed} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ minWidth: 0, flexWrap: "wrap" }}
                    >
                      <Link
                        component={NextLink}
                        href={getMessagingPeerProfileHref(audience, thread)}
                        underline="hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose?.();
                        }}
                        sx={{
                          fontWeight: 900,
                          fontSize: 13,
                          color: alpha(m.navy, 0.88),
                          maxWidth: "100%",
                        }}
                      >
                        {thread.name}
                      </Link>
                      {!thread.unlinked ? (
                        <Link
                          component={NextLink}
                          href={getMessagingBookingHref(audience, thread)}
                          underline="hover"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.45),
                          }}
                        >
                          {thread.bookingMeta}
                        </Link>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.45),
                          }}
                          noWrap
                        >
                          Unlinked
                        </Typography>
                      )}
                      <CheckCircleRoundedIcon
                        sx={{ fontSize: 13, color: "#4CAF50" }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.42),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {thread.timeLabel}
                    </Typography>
                  </Stack>
                  <MessagingThreadPreviewLine thread={thread} />
                </Box>
                <Checkbox
                  size="small"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleSelect(thread.id)}
                  sx={{
                    mt: -0.25,
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                    visibility: showBulkActions ? "visible" : "hidden",
                  }}
                />
              </Box>
            );
          })
        )}
        {hasMore && onLoadMore ? (
          <Box sx={{ px: 2, py: 1.5 }}>
            <AppButton
              fullWidth
              variant="outlined"
              disabled={loadingMore}
              onClick={onLoadMore}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
                borderRadius: "8px",
                borderColor: alpha(m.teal, 0.45),
                color: m.teal,
                py: 0.85,
                "&:hover": {
                  borderColor: m.teal,
                  bgcolor: alpha(m.teal, 0.04),
                },
              }}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </AppButton>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
