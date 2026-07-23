"use client";

import * as React from "react";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SalesLineItem, SalesOverviewCardData, SalesSubCardData } from "./salesOverview.types";

export type SalesCardMenuAction =
  | "editSales"
  | "cancelSales"
  | "downloadInvoicePdf"
  | "downloadInvoiceExcel"
  | "addNote"
  | "reissueOverdue";

type SalesOverviewCardProps = {
  card: SalesOverviewCardData;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
  onAddOns?: () => void;
  onMenuAction?: (action: SalesCardMenuAction) => void;
  onOverdueAction?: () => void;
  onSubViewInvoice?: (sub: SalesSubCardData) => void;
  onSubViewReceipt?: (sub: SalesSubCardData) => void;
  onSubAddOns?: (sub: SalesSubCardData) => void;
  onSubMenuAction?: (sub: SalesSubCardData, action: SalesCardMenuAction) => void;
};

function formatEur(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const abs = Math.abs(rounded);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(2);
  return `${rounded < 0 ? "-" : ""}€${text}`;
}

function formatDueDateDisplay(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function MethodDateLine({
  methodDateLine,
  dueDate,
  paymentMethodLabel,
}: {
  methodDateLine?: string;
  dueDate?: string | null;
  paymentMethodLabel?: string;
}) {
  const m = useTheme().palette.mollure;
  if (!methodDateLine && !dueDate) return null;

  const dueLabel = formatDueDateDisplay(dueDate);
  const showCalendar = Boolean(dueDate && dueLabel);
  const line =
    methodDateLine ||
    (dueLabel
      ? `${paymentMethodLabel || "Payment"} (Due date ${dueLabel})`
      : "");

  if (!line) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.85 }}>
      {showCalendar ? (
        <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.45), flexShrink: 0 }} />
      ) : null}
      <Typography sx={{ fontSize: 11.5, fontWeight: 650, color: alpha(m.navy, 0.5) }}>{line}</Typography>
    </Stack>
  );
}

function LineRow({ line }: { line: SalesLineItem }) {
  const m = useTheme().palette.mollure;
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
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
  );
}

function statusBadgeSx(badge?: string) {
  const value = String(badge ?? "").toLowerCase();
  if (value === "prepaid" || value === "paid") {
    return { color: "#039855", bgcolor: alpha("#12B76A", 0.14) };
  }
  if (
    value === "prepayment due" ||
    value === "payment due" ||
    value === "pending" ||
    value === "not paid" ||
    value === "overdue"
  ) {
    return { color: "#B54708", bgcolor: alpha("#F79009", 0.16) };
  }
  return { color: "#475467", bgcolor: alpha("#98A2B3", 0.16) };
}

function useActionsMenu(onAction?: (action: SalesCardMenuAction) => void) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [downloadAnchor, setDownloadAnchor] = React.useState<null | HTMLElement>(null);

  const closeAll = () => {
    setMenuAnchor(null);
    setDownloadAnchor(null);
  };

  const run = (action: SalesCardMenuAction) => {
    closeAll();
    onAction?.(action);
  };

  return { menuAnchor, setMenuAnchor, downloadAnchor, setDownloadAnchor, closeAll, run };
}

function SalesActionsMenu({
  limitedMenu,
  menuAnchor,
  downloadAnchor,
  setDownloadAnchor,
  closeAll,
  run,
}: {
  limitedMenu?: boolean;
  menuAnchor: HTMLElement | null;
  downloadAnchor: HTMLElement | null;
  setDownloadAnchor: (el: HTMLElement | null) => void;
  closeAll: () => void;
  run: (action: SalesCardMenuAction) => void;
}) {
  const m = useTheme().palette.mollure;
  const items: Array<{ id: SalesCardMenuAction | "downloadInvoice"; label: string }> = limitedMenu
    ? [
        { id: "editSales", label: "Edit Sales" },
        { id: "downloadInvoice", label: "Download Invoice" },
        { id: "addNote", label: "Add note" },
      ]
    : [
        { id: "editSales", label: "Edit Sales" },
        { id: "cancelSales", label: "Cancel Sales" },
        { id: "downloadInvoice", label: "Download Invoice" },
        { id: "addNote", label: "Add note" },
      ];

  return (
    <>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeAll}
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
        {items.map((item, index, arr) =>
          item.id === "downloadInvoice" ? (
            <MenuItem
              key={item.id}
              onClick={(e) => setDownloadAnchor(e.currentTarget)}
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: alpha(m.navy, 0.78),
                py: 1.1,
                display: "flex",
                justifyContent: "space-between",
                borderBottom: index < arr.length - 1 ? `1px solid ${alpha(m.navy, 0.06)}` : "none",
              }}
            >
              {item.label}
              <ChevronRightRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.4) }} />
            </MenuItem>
          ) : (
            <MenuItem
              key={item.id}
              onClick={() => run(item.id)}
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
          ),
        )}
      </Menu>

      <Menu
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={() => setDownloadAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            ml: 0.5,
            minWidth: 120,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            boxShadow: "0 10px 28px rgba(16, 35, 63, 0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => run("downloadInvoicePdf")}
          sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78), py: 1.1 }}
        >
          PDF
        </MenuItem>
        <MenuItem
          onClick={() => run("downloadInvoiceExcel")}
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: alpha(m.navy, 0.78),
            py: 1.1,
            borderTop: `1px solid ${alpha(m.navy, 0.06)}`,
          }}
        >
          Excel
        </MenuItem>
      </Menu>
    </>
  );
}

function SubSummaryCard({
  sub,
  limitedMenu,
  onViewInvoice,
  onViewReceipt,
  onAddOns,
  onMenuAction,
}: {
  sub: SalesSubCardData;
  limitedMenu?: boolean;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
  onAddOns?: () => void;
  onMenuAction?: (action: SalesCardMenuAction) => void;
}) {
  const m = useTheme().palette.mollure;
  const badge = statusBadgeSx(sub.statusBadge);
  const { menuAnchor, setMenuAnchor, downloadAnchor, setDownloadAnchor, closeAll, run } =
    useActionsMenu(onMenuAction);
  const showReceipt = sub.paymentState === "paid";

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1.5px dashed ${alpha(m.navy, 0.28)}`,
        bgcolor: alpha(m.navy, 0.015),
        px: 1.25,
        py: 1.1,
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
            {sub.payerLabel}
          </Typography>
          {sub.payerName && sub.payerName !== sub.payerLabel ? (
            <Typography sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}>
              {sub.payerName}
            </Typography>
          ) : null}
        </Box>
        {sub.statusBadge ? (
          <Box sx={{ px: 0.85, py: 0.25, borderRadius: "999px", ...badge }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>{sub.statusBadge}</Typography>
          </Box>
        ) : null}
      </Stack>

      <Stack spacing={0.55} sx={{ mb: 0.85 }}>
        {sub.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
          {sub.highlightLabel}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.teal, lineHeight: 1.1 }}>
          {formatEur(sub.highlightAmount)}
        </Typography>
      </Stack>

      {sub.methodDateLine || sub.dueDate ? (
        <MethodDateLine
          methodDateLine={sub.methodDateLine}
          dueDate={sub.dueDate}
        />
      ) : null}

      <Stack direction="row" alignItems="center" spacing={1}>
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
        {showReceipt ? (
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
        ) : null}
        <IconButton
          size="small"
          aria-label={`${sub.payerLabel} sale actions`}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            ml: "auto",
            width: 32,
            height: 32,
            color: alpha(m.navy, 0.55),
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            borderRadius: "8px",
            bgcolor: "#fff",
          }}
        >
          <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {sub.showAddOns ? (
        <Button
          onClick={onAddOns}
          startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            mt: 1,
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

      <SalesActionsMenu
        limitedMenu={limitedMenu}
        menuAnchor={menuAnchor}
        downloadAnchor={downloadAnchor}
        setDownloadAnchor={setDownloadAnchor}
        closeAll={closeAll}
        run={run}
      />
    </Box>
  );
}

export default function SalesOverviewCard({
  card,
  onViewInvoice,
  onViewReceipt,
  onAddOns,
  onMenuAction,
  onOverdueAction,
  onSubViewInvoice,
  onSubViewReceipt,
  onSubAddOns,
  onSubMenuAction,
}: SalesOverviewCardProps) {
  const m = useTheme().palette.mollure;
  const muted = Boolean(card.voided || card.refunded || card.canceled);
  const { menuAnchor, setMenuAnchor, downloadAnchor, setDownloadAnchor, closeAll, run } =
    useActionsMenu(onMenuAction);

  const highlightSet = React.useMemo(
    () => new Set(card.highlightedLineIds ?? []),
    [card.highlightedLineIds],
  );
  const useHighlightBox = highlightSet.size > 0 && !card.subCards?.length;
  const highlightedLines = useHighlightBox
    ? card.lines.filter((line) => highlightSet.has(line.id))
    : card.lines;
  const otherLines = useHighlightBox
    ? card.lines.filter((line) => !highlightSet.has(line.id))
    : [];

  const isGuestOrModel = card.payerRole === "guest" || card.payerRole === "model";
  const badge = statusBadgeSx(card.statusBadge);
  const clientBadge =
    card.clientKind === "company" ? "CC Client" : card.clientKind === "individual" ? "IC Client" : null;
  const showReceipt = card.paymentState === "prepaid" || card.paymentState === "paid";

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
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
          {card.title}
        </Typography>
        {card.statusBadge ? (
          <Box sx={{ px: 1, py: 0.3, borderRadius: "999px", ...badge }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800 }}>{card.statusBadge}</Typography>
          </Box>
        ) : null}
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.15, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}>
          {isGuestOrModel ? card.payerLabel || card.clientName : card.clientName}
        </Typography>
        {clientBadge ? (
          <Box
            sx={{
              px: 0.7,
              py: 0.15,
              borderRadius: "999px",
              bgcolor: alpha(m.teal, 0.12),
            }}
          >
            <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: m.teal }}>{clientBadge}</Typography>
          </Box>
        ) : null}
      </Stack>

      {isGuestOrModel && card.clientName ? (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.35 }}>
          {card.clientName}
        </Typography>
      ) : null}

      {card.clientEmail ? (
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mb: 1.15 }}>
          {card.clientEmail}
        </Typography>
      ) : (
        <Box sx={{ mb: 1.15 }} />
      )}

      <Stack spacing={0.85} sx={{ mb: 1.15 }}>
        {useHighlightBox && highlightedLines.length ? (
          <Box
            sx={{
              borderRadius: "8px",
              border: `1.5px dashed ${alpha(m.navy, 0.28)}`,
              bgcolor: alpha(m.navy, 0.015),
              px: 1.1,
              py: 0.85,
            }}
          >
            <Stack spacing={0.65}>
              {highlightedLines.map((line) => (
                <LineRow key={line.id} line={line} />
              ))}
            </Stack>
          </Box>
        ) : null}

        {(useHighlightBox ? otherLines : card.lines).map((line) => (
          <LineRow key={line.id} line={line} />
        ))}

        {card.subCards?.map((sub) => (
          <SubSummaryCard
            key={sub.id}
            sub={sub}
            limitedMenu={card.limitedMenu}
            onViewInvoice={() => onSubViewInvoice?.(sub)}
            onViewReceipt={() => onSubViewReceipt?.(sub)}
            onAddOns={() => onSubAddOns?.(sub)}
            onMenuAction={(action) => onSubMenuAction?.(sub, action)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.85 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}>
          {card.totalLabel || "Total"}
        </Typography>
        <Typography
          sx={{
            fontSize: card.kind === "reissued_invoice" ? 22 : 13,
            fontWeight: 900,
            color: card.kind === "reissued_invoice" ? m.teal : alpha(m.navy, 0.88),
          }}
        >
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

      {card.methodDateLine || card.dueDate ? (
        <MethodDateLine
          methodDateLine={card.methodDateLine}
          dueDate={card.dueDate}
          paymentMethodLabel={card.paymentMethodLabel}
        />
      ) : null}

      {card.note ? (
        <Typography sx={{ mt: 0.75, fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
          Note: {card.note}
        </Typography>
      ) : null}

      {card.paymentState === "overdue" && onOverdueAction ? (
        <Button
          variant="outlined"
          size="small"
          onClick={onOverdueAction}
          sx={{
            mt: 1,
            mb: 0.5,
            textTransform: "none",
            fontWeight: 800,
            fontSize: 12,
            borderRadius: "8px",
            borderColor: alpha("#F79009", 0.45),
            color: "#B54708",
          }}
        >
          Add penalty & reissue due date
        </Button>
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
        {showReceipt ? (
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
        ) : null}
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

      <SalesActionsMenu
        limitedMenu={card.limitedMenu}
        menuAnchor={menuAnchor}
        downloadAnchor={downloadAnchor}
        setDownloadAnchor={setDownloadAnchor}
        closeAll={closeAll}
        run={run}
      />
    </Box>
  );
}
