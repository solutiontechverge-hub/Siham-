"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Dialog,
  IconButton,
  Stack,
  type DialogProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  mollurePageSubtitleSx,
  mollurePageTitleSx,
} from "../../theme/mollureHierarchy";
import { BodyText, SubHeading } from "../ui/typography";
import useOverlayScrollLock from "../../hooks/useOverlayScrollLock";
import { isModKey } from "../../lib/keyboard";
import AppButton from "./AppButton";
import MessagingInsetOverlay from "./messaging/MessagingInsetOverlay";

type AppModalCloseHandler = DialogProps["onClose"] | (() => void);

type AppModalProps = Omit<DialogProps, "children" | "title" | "onClose"> & {
  /** Required heading — shown in soft teal header bar (same as AppDrawer). */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentMinHeight?: number;
  contentSx?: SxProps<Theme>;
  hideDivider?: boolean;
  /** Messaging widget inset overlay instead of centered dialog */
  embedded?: boolean;
  /** `actions` centers footer buttons with padding (messaging dialogs). Default plain. */
  footerVariant?: "plain" | "actions";
  /** Soft teal by default; soft red for cancel/delete/destructive confirmations. */
  headerTone?: "default" | "danger";
  /**
   * When set, body + footer wrap in a `<form>`. Use with primary `type="submit"`.
   * Caller should `preventDefault` (helpers do this before invoking).
   */
  onFormSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose?: AppModalCloseHandler;
};

function invokeClose(onClose: AppModalCloseHandler | undefined) {
  if (!onClose) return;
  // Supports both Dialog onClose(event, reason) and plain () => void
  (onClose as (event?: object, reason?: string) => void)({}, "backdropClick");
}

/** Single shared Mollure modal — soft teal header, body, optional footer. */
export default function AppModal({
  title,
  subtitle,
  children,
  footer,
  contentMinHeight,
  contentSx,
  hideDivider = false,
  embedded = false,
  footerVariant = "plain",
  headerTone = "default",
  onFormSubmit,
  onClose,
  maxWidth = "sm",
  fullWidth = true,
  PaperProps,
  open = false,
  ...props
}: AppModalProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  useOverlayScrollLock(Boolean(open) && !embedded);
  const { sx: paperSx, ...restPaperProps } = PaperProps ?? {};
  const isDanger = headerTone === "danger";
  const headerBg = isDanger ? alpha("#E85D5D", 0.14) : alpha(m.teal, 0.12);

  const headerIconBtnSx = {
    width: 30,
    height: 30,
    borderRadius: "999px",
    color: alpha(m.navy, 0.55),
    bgcolor: alpha(m.navy, 0.06),
    "&:hover": { bgcolor: alpha(m.navy, 0.12) },
  } as const;

  const header = (
    <Stack
      direction="row"
      alignItems={subtitle ? "flex-start" : "center"}
      justifyContent="space-between"
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        flexShrink: 0,
        bgcolor: headerBg,
        color: m.navy,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
        <SubHeading
          sx={mollurePageTitleSx(m.navy, {
            fontSize: subtitle ? undefined : 16,
          })}
        >
          {title}
        </SubHeading>
        {subtitle ? (
          <BodyText sx={mollurePageSubtitleSx(m.navy, { mt: 0.4 })}>
            {subtitle}
          </BodyText>
        ) : null}
      </Box>
      <IconButton
        size="small"
        onClick={() => invokeClose(onClose)}
        aria-label="Close modal"
        sx={headerIconBtnSx}
      >
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Stack>
  );

  const body = (
    <Box
      sx={[
        {
          minHeight: contentMinHeight ?? 0,
          overflowY: "auto",
          minWidth: 0,
          // Keep content clear of the teal/danger header across all modals.
          pt: 2,
        },
        ...(Array.isArray(contentSx)
          ? contentSx
          : contentSx
            ? [contentSx]
            : []),
      ]}
    >
      {children}
    </Box>
  );

  const footerBlock = footer ? (
    <Box
      sx={{
        flexShrink: 0,
        borderTop: hideDivider ? "none" : `1px solid ${alpha(m.navy, 0.08)}`,
        ...(footerVariant === "actions"
          ? {
              px: 2.5,
              pb: 2.5,
              pt: hideDivider ? 0 : 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }
          : null),
      }}
    >
      {footer}
    </Box>
  ) : null;

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onFormSubmit?.(event);
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    // Multiline fields: Cmd/Ctrl+Enter submits (Enter alone inserts newline).
    if (event.key !== "Enter" || !isModKey(event)) return;
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag !== "TEXTAREA") return;
    event.preventDefault();
    event.currentTarget.requestSubmit();
  };

  const mainContent = onFormSubmit ? (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      onKeyDown={handleFormKeyDown}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: 1,
      }}
    >
      {body}
      {footerBlock}
    </Box>
  ) : (
    <>
      {body}
      {footerBlock}
    </>
  );

  if (embedded) {
    return (
      <MessagingInsetOverlay
        open={Boolean(open)}
        title={typeof title === "string" ? title : "Dialog"}
        onClose={() => invokeClose(onClose)}
        footer={footer}
        hideDivider={hideDivider}
        headerTone={headerTone}
        maxWidth={maxWidth === "sm" ? 440 : 400}
        onFormSubmit={onFormSubmit ? handleFormSubmit : undefined}
      >
        {children}
      </MessagingInsetOverlay>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose as DialogProps["onClose"]}
      scroll="paper"
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
      PaperProps={{
        ...restPaperProps,
        sx: [
          {
            borderRadius: "14px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 20px 55px rgba(16,35,63,0.18)",
            overflow: "hidden",
            margin: 2,
            width: "100%",
            maxHeight: "calc(100vh - 48px)",
          },
          ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
        ],
      }}
      {...props}
    >
      <Stack sx={{ maxHeight: "inherit", minHeight: 0 }}>
        {header}
        {mainContent}
      </Stack>
    </Dialog>
  );
}

function AppModalActionButton({
  onClick,
  label,
  disabled,
  tone,
  type = "button",
}: {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  tone: "primary" | "secondary" | "danger";
  type?: "button" | "submit" | "reset";
}) {
  return (
    <AppButton
      tone={tone}
      presetSize="lg"
      type={type}
      onClick={onClick}
      disabled={disabled}
      sx={{ minWidth: 100, px: 3 }}
    >
      {label}
    </AppButton>
  );
}

export function AppModalCancelButton({
  onClick,
  label = "Cancel",
  disabled,
  type = "button",
}: {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <AppModalActionButton
      onClick={onClick}
      label={label}
      disabled={disabled}
      tone="secondary"
      type={type}
    />
  );
}

export function AppModalPrimaryButton({
  onClick,
  label,
  disabled,
  tone = "primary",
  type = "button",
}: {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  tone?: "primary" | "danger";
  type?: "button" | "submit" | "reset";
}) {
  return (
    <AppModalActionButton
      onClick={type === "submit" ? undefined : onClick}
      label={label}
      disabled={disabled}
      tone={tone}
      type={type}
    />
  );
}

/** @deprecated Use AppModalCancelButton */
export const MessagingModalCancelButton = AppModalCancelButton;
/** @deprecated Use AppModalPrimaryButton */
export const MessagingModalPrimaryButton = AppModalPrimaryButton;
