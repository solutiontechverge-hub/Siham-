"use client";

import * as React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useSnackbar } from "../AppSnackbar";

async function copyBookingId(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  }
}

function stopCardClick(event: React.SyntheticEvent) {
  event.stopPropagation();
  event.preventDefault();
}

export type BookingIdTooltipLabelProps = {
  bookingId: string;
};

export default function BookingIdTooltipLabel({
  bookingId,
}: BookingIdTooltipLabelProps) {
  const { showSnackbar } = useSnackbar();
  const isTouch = useMediaQuery("(hover: none)", { noSsr: true });
  const [touchOpen, setTouchOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copiedResetRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      if (copiedResetRef.current) clearTimeout(copiedResetRef.current);
    };
  }, []);

  const copyId = async () => {
    const ok = await copyBookingId(bookingId);
    if (!ok) {
      showSnackbar({
        severity: "error",
        message: "Could not copy booking ID",
      });
      return;
    }
    setCopied(true);
    if (copiedResetRef.current) clearTimeout(copiedResetRef.current);
    copiedResetRef.current = setTimeout(() => setCopied(false), 1600);
    showSnackbar({
      severity: "success",
      message: "Booking ID copied",
    });
  };

  const handleCopy = async (event: React.MouseEvent<HTMLElement>) => {
    stopCardClick(event);
    await copyId();
  };

  const handleDoubleClick = async (event: React.MouseEvent<HTMLElement>) => {
    stopCardClick(event);
    await copyId();
  };

  const tooltipBody = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      onClick={stopCardClick}
      onMouseDown={stopCardClick}
    >
      <Box
        component="span"
        sx={{ fontWeight: 700, letterSpacing: "0.02em", userSelect: "all" }}
      >
        {bookingId}
      </Box>
      <IconButton
        size="small"
        aria-label={copied ? "Copied booking ID" : "Copy booking ID"}
        onClick={handleCopy}
        onMouseDown={stopCardClick}
        sx={{ color: "inherit", p: 0.25 }}
      >
        {copied ? (
          <CheckRoundedIcon sx={{ fontSize: 14 }} />
        ) : (
          <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Stack>
  );

  return (
    <Tooltip
      title={tooltipBody}
      placement="top-start"
      enterDelay={200}
      leaveDelay={200}
      open={isTouch ? touchOpen : undefined}
      onClose={() => setTouchOpen(false)}
      disableHoverListener={isTouch}
      disableFocusListener={isTouch}
      disableTouchListener
      slotProps={{
        popper: {
          onClick: stopCardClick,
          onMouseDown: stopCardClick,
          sx: { zIndex: 2000 },
        },
        tooltip: {
          sx: { maxWidth: 360 },
        },
      }}
    >
      <Box
        component="span"
        role="button"
        tabIndex={0}
        aria-label="Show booking ID. Double-click to copy."
        onClick={(event) => {
          stopCardClick(event);
          if (isTouch) setTouchOpen((open) => !open);
        }}
        onDoubleClick={handleDoubleClick}
        onMouseDown={stopCardClick}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          stopCardClick(event);
          if (isTouch) setTouchOpen((open) => !open);
        }}
        sx={{
          pointerEvents: "auto",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          borderBottom: "1px dotted currentColor",
          userSelect: "none",
        }}
      >
        ID
      </Box>
    </Tooltip>
  );
}
