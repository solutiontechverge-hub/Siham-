"use client";

import * as React from "react";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SalesOverviewCardData } from "./salesOverview.types";

export type SalesCardMenuAction = "refund" | "void" | "downloadInvoice" | "downloadReceipt" | "addNote";

type SalesOverviewCardProps = {
  card: SalesOverviewCardData;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
  onAddOns?: () => void;
  onMenuAction?: (action: SalesCardMenuAction) => void;
};

function formatEur(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const abs = Math.abs(rounded);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(2);
  return `${rounded < 0 ? "-" : ""}€${text}`;
}

export default function SalesOverviewCard({
  card,
  onViewInvoice,
  onViewReceipt,
  onAddOns,
  onMenuAction,
}: SalesOverviewCardProps) {
  const m = useTheme().palette.mollure;
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const muted = Boolean(card.voided || card.refunded);

  const closeMenu = () => setMenuAnchor(null);

  const runMenu = (action: SalesCardMenuAction) => {
    closeMenu();
    onMenuAction?.(action);
  };

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        px: 1.75,
        py: 1.5,
        opacity: muted ? 0.62 : 1,
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88), mb: 1.1 }}>
        {card.title}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.35, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
          {card.clientName}
        </Typography>
        {card.statusBadge ? (
          <Typography sx={{ fontSize: 11, fontWeight: 900, color: m.teal, letterSpacing: 0.3 }}>
            {card.statusBadge}
          </Typography>
        ) : null}
        {card.voided ? (
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#C62828" }}>VOIDED</Typography>
        ) : null}
        {card.refunded ? (
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "#C62828" }}>REFUNDED</Typography>
        ) : null}
      </Stack>

      {card.clientPhone ? (
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5) }}>
          {card.clientPhone}
        </Typography>
      ) : null}
      {card.clientEmail ? (
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mb: 1.15 }}>
          {card.clientEmail}
        </Typography>
      ) : (
        <Box sx={{ mb: 1.15 }} />
      )}

      <Stack spacing={0.65} sx={{ mb: 1.15 }}>
        {card.lines.map((line) => (
          <Stack key={line.id} direction="row" justifyContent="space-between" spacing={1.5}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
              {line.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 800,
                color: line.amount < 0 ? alpha(m.navy, 0.55) : alpha(m.navy, 0.82),
                flexShrink: 0,
              }}
            >
              {formatEur(line.amount)}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.85 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>Total</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {formatEur(card.total)}
        </Typography>
      </Stack>

      {card.secondaryRows?.map((row) => (
        <Stack key={row.id} direction="row" justifyContent="space-between" sx={{ mb: 0.55 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.62) }}>
            {row.label}
          </Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
            {formatEur(row.amount)}
          </Typography>
        </Stack>
      ))}

      <Box sx={{ mt: 0.75, mb: 0.85 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.2 }}>
          {card.highlightLabel}
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 900, color: m.teal, lineHeight: 1.1 }}>
          {formatEur(card.highlightAmount)}
        </Typography>
      </Box>

      {card.metaLines?.map((line) => (
        <Typography
          key={line}
          sx={{ fontSize: 11.5, fontWeight: 650, color: alpha(m.navy, 0.5), mb: 0.2 }}
        >
          {line}
        </Typography>
      ))}

      {card.note ? (
        <Typography sx={{ mt: 0.75, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
          Note: {card.note}
        </Typography>
      ) : null}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.35 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onViewInvoice}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            fontSize: 11.5,
            borderRadius: "8px",
            borderColor: alpha(m.navy, 0.16),
            color: alpha(m.navy, 0.7),
            bgcolor: "#fff",
            px: 1.25,
            height: 32,
          }}
        >
          View Invoice
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onViewReceipt}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            fontSize: 11.5,
            borderRadius: "8px",
            borderColor: alpha(m.navy, 0.16),
            color: alpha(m.navy, 0.7),
            bgcolor: "#fff",
            px: 1.25,
            height: 32,
          }}
        >
          View Receipt
        </Button>
        <IconButton
          size="small"
          aria-label="Sale actions"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            ml: "auto",
            width: 32,
            height: 32,
            color: alpha(m.navy, 0.55),
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            borderRadius: "8px",
          }}
        >
          <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {card.showAddOns ? (
        <Button
          onClick={onAddOns}
          startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            mt: 1.1,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 800,
            fontSize: 13,
            color: m.teal,
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          + Add-ons
        </Button>
      ) : null}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 180,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            boxShadow: "0 10px 28px rgba(16, 35, 63, 0.12)",
          },
        }}
      >
        {(
          [
            { id: "refund", label: "Refund" },
            { id: "void", label: "Void sale" },
            { id: "downloadInvoice", label: "Download Invoice" },
            { id: "downloadReceipt", label: "Download Receipt" },
            { id: "addNote", label: "Add note" },
          ] as const
        ).map((item, index, arr) => (
          <MenuItem
            key={item.id}
            onClick={() => runMenu(item.id)}
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: alpha(m.navy, 0.78),
              py: 1.1,
              borderBottom: index < arr.length - 1 ? `1px solid ${alpha(m.navy, 0.06)}` : "none",
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
