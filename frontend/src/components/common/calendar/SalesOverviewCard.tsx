"use client";

import AppButton from "../AppButton";
import * as React from "react";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureSectionTitleSx, mollureLabelSx, mollureBodySx } from "../../../theme/mollureHierarchy";
import { clientPlatformTagToneColors } from "../ClientPlatformTag";
import {
  formatCompactEuro,
  formatFinanceDueDate,
} from "../booking-finance/formatBookingFinance";
import type {
  SalesLineItem,
  SalesOverviewCardData,
  SalesPaymentState,
  SalesSubCardData,
} from "./salesOverview.types";

export type SalesCardMenuAction =
  | "editSales"
  | "cancelSales"
  | "refundSales"
  | "markUnpaid"
  | "downloadInvoicePdf"
  | "downloadInvoiceExcel"
  | "addNote"
  | "reissueOverdue";

type SalesOverviewCardProps = {
  card: SalesOverviewCardData;
  highlighted?: boolean;
  highlightId?: string | null;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
  onAddOns?: () => void;
  onMenuAction?: (action: SalesCardMenuAction) => void;
  onSubViewInvoice?: (sub: SalesSubCardData) => void;
  onSubViewReceipt?: (sub: SalesSubCardData) => void;
  onSubAddOns?: (sub: SalesSubCardData) => void;
  onSubMenuAction?: (
    sub: SalesSubCardData,
    action: SalesCardMenuAction,
  ) => void;
};

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

  const dueLabel = formatFinanceDueDate(dueDate);
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
        <CalendarMonthRoundedIcon
          sx={{ fontSize: 16, color: alpha(m.navy, 0.45), flexShrink: 0 }}
        />
      ) : null}
      <Typography
        sx={{ fontSize: 11.5, fontWeight: 650, color: alpha(m.navy, 0.5) }}
      >
        {line}
      </Typography>
    </Stack>
  );
}

function LineRow({ line }: { line: SalesLineItem }) {
  const m = useTheme().palette.mollure;
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
      <Typography
        sx={mollureBodySx(m.navy)}
      >
        {line.label}
      </Typography>
      <Typography
        sx={mollureLabelSx(m.navy, {
          color: line.amount < 0 ? alpha(m.navy, 0.55) : alpha(m.navy, 0.82),
          flexShrink: 0,
        })}
      >
        {formatCompactEuro(line.amount)}
      </Typography>
    </Stack>
  );
}

function statusBadgeSx(
  badge: string | undefined,
  m: {
    statusOrangeBg: string;
    statusOrangeFg: string;
    statusGreenBg: string;
    statusGreenFg: string;
    statusRedBg: string;
    statusRedFg: string;
    statusGreyFg: string;
    fxGrayF2F4F7: string;
  },
  paymentState?: SalesPaymentState,
) {
  if (paymentState === "overdue_invoice" || paymentState === "unpaid") {
    return { color: m.statusRedFg, bgcolor: m.statusRedBg };
  }
  const value = String(badge ?? "")
    .toLowerCase()
    .replace(/^!/, "")
    .trim();
  if (value === "prepaid" || value === "paid") {
    return { color: m.statusGreenFg, bgcolor: m.statusGreenBg };
  }
  if (
    value === "payment due" ||
    value === "pending" ||
    value === "failed" ||
    value === "overdue" ||
    paymentState === "overdue" ||
    paymentState === "failed" ||
    paymentState === "payment_due" ||
    paymentState === "pending"
  ) {
    return { color: m.statusOrangeFg, bgcolor: m.statusOrangeBg };
  }
  return { color: m.statusGreyFg, bgcolor: m.fxGrayF2F4F7 };
}

function useActionsMenu(onAction?: (action: SalesCardMenuAction) => void) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [downloadAnchor, setDownloadAnchor] =
    React.useState<null | HTMLElement>(null);

  const closeAll = () => {
    setMenuAnchor(null);
    setDownloadAnchor(null);
  };

  const run = (action: SalesCardMenuAction) => {
    closeAll();
    onAction?.(action);
  };

  return {
    menuAnchor,
    setMenuAnchor,
    downloadAnchor,
    setDownloadAnchor,
    closeAll,
    run,
  };
}

function SalesActionsMenu({
  isAddon,
  limitedMenu,
  showRefund,
  showMarkUnpaid,
  menuAnchor,
  downloadAnchor,
  setDownloadAnchor,
  closeAll,
  run,
}: {
  isAddon?: boolean;
  limitedMenu?: boolean;
  /** Show Refund when the sale has received money and is not already muted. */
  showRefund?: boolean;
  showMarkUnpaid?: boolean;
  menuAnchor: HTMLElement | null;
  downloadAnchor: HTMLElement | null;
  setDownloadAnchor: (el: HTMLElement | null) => void;
  closeAll: () => void;
  run: (action: SalesCardMenuAction) => void;
}) {
  const m = useTheme().palette.mollure;
  const items: Array<{
    id: SalesCardMenuAction | "downloadInvoice";
    label: string;
  }> = limitedMenu
    ? [
        { id: "editSales", label: "Edit Sales" },
        { id: "cancelSales", label: "Void sale" },
        ...(showRefund ? [{ id: "refundSales" as const, label: "Refund" }] : []),
        { id: "downloadInvoice", label: "Download Invoice" },
        { id: "addNote", label: "Add note" },
      ]
    : [
        { id: "editSales", label: "Edit Sales" },
        { id: "cancelSales", label: "Void sale" },
        ...(showMarkUnpaid ? [{ id: "markUnpaid" as const, label: "Mark as Unpaid" }] : []),
        ...(showRefund ? [{ id: "refundSales" as const, label: "Refund" }] : []),
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
                borderBottom:
                  index < arr.length - 1
                    ? `1px solid ${alpha(m.navy, 0.06)}`
                    : "none",
              }}
            >
              {item.label}
              <ChevronRightRoundedIcon
                sx={{ fontSize: 18, color: alpha(m.navy, 0.4) }}
              />
            </MenuItem>
          ) : (
            <MenuItem
              key={item.id}
              onClick={() => {
                if (item.id !== "downloadInvoice") run(item.id);
              }}
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: alpha(m.navy, 0.78),
                py: 1.1,
                borderBottom:
                  index < arr.length - 1
                    ? `1px solid ${alpha(m.navy, 0.06)}`
                    : "none",
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
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: alpha(m.navy, 0.78),
            py: 1.1,
          }}
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
  highlighted = false,
  onViewInvoice,
  onViewReceipt,
  onAddOns,
  onMenuAction,
}: {
  sub: SalesSubCardData;
  limitedMenu?: boolean;
  highlighted?: boolean;
  onViewInvoice?: () => void;
  onViewReceipt?: () => void;
  onAddOns?: () => void;
  onMenuAction?: (action: SalesCardMenuAction) => void;
}) {
  const m = useTheme().palette.mollure;
  const badge = statusBadgeSx(sub.statusBadge, m, sub.paymentState);
  const {
    menuAnchor,
    setMenuAnchor,
    downloadAnchor,
    setDownloadAnchor,
    closeAll,
    run,
  } = useActionsMenu(onMenuAction);
  const showReceipt = sub.paymentState === "paid";

  return (
    <Box
      data-sales-card-id={sub.id}
      sx={{
        borderRadius: "10px",
        border: `1.5px dashed ${highlighted ? alpha(m.teal, 0.55) : alpha(m.navy, 0.28)}`,
        bgcolor: highlighted ? alpha(m.teal, 0.06) : alpha(m.navy, 0.015),
        px: 1.25,
        py: 1.1,
        scrollMarginTop: 12,
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 0.75 }}
      >
        <Box>
          <Typography
            sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}
          >
            {sub.payerLabel}
          </Typography>
          {sub.payerName && sub.payerName !== sub.payerLabel ? (
            <Typography
              sx={{ fontSize: 12, fontWeight: 650, color: alpha(m.navy, 0.5) }}
            >
              {sub.payerName}
            </Typography>
          ) : null}
        </Box>
        {sub.statusBadge ? (
          <Box sx={{ px: 0.85, py: 0.25, borderRadius: "999px", ...badge }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
              {sub.statusBadge}
            </Typography>
          </Box>
        ) : null}
      </Stack>

      <Stack spacing={0.55} sx={{ mb: 0.85 }}>
        {sub.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: 0.75 }}
      >
        <Typography
          sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}
        >
          {sub.highlightLabel}
        </Typography>
        <Typography
          sx={{ fontSize: 22, fontWeight: 900, color: m.teal, lineHeight: 1.1 }}
        >
          {formatCompactEuro(sub.highlightAmount)}
        </Typography>
      </Stack>

      {sub.methodDateLine || sub.dueDate ? (
        <MethodDateLine
          methodDateLine={sub.methodDateLine}
          dueDate={sub.dueDate}
        />
      ) : null}

      <Stack direction="row" alignItems="center" spacing={1}>
        <AppButton
          tone="secondary"
          size="small"
          onClick={onViewInvoice}
          sx={{
            fontSize: 11.5,
            px: 1.25,
            height: 32,
          }}
        >
          View Invoice
        </AppButton>
        {showReceipt ? (
          <AppButton
            tone="secondary"
            size="small"
            onClick={onViewReceipt}
            sx={{
              fontSize: 11.5,
              px: 1.25,
              height: 32,
            }}
          >
            View Receipt
          </AppButton>
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
        <AppButton
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
        </AppButton>
      ) : null}

      <SalesActionsMenu
        isAddon={sub.kind === "addon"}
        limitedMenu={limitedMenu}
        showRefund={
          sub.paymentState === "paid" || sub.paymentState === "prepaid"
        }
        showMarkUnpaid={sub.paymentState === "pending"}
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
  highlighted = false,
  highlightId = null,
  onViewInvoice,
  onViewReceipt,
  onAddOns,
  onMenuAction,
  onSubViewInvoice,
  onSubViewReceipt,
  onSubAddOns,
  onSubMenuAction,
}: SalesOverviewCardProps) {
  const m = useTheme().palette.mollure;
  const {
    menuAnchor,
    setMenuAnchor,
    downloadAnchor,
    setDownloadAnchor,
    closeAll,
    run,
  } = useActionsMenu(onMenuAction);

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

  const isGuestOrModel =
    card.payerRole === "guest" || card.payerRole === "model";
  const badge = statusBadgeSx(card.statusBadge, m, card.paymentState);
  const clientBadge =
    card.clientKind === "company"
      ? "BC Client"
      : card.clientKind === "individual"
        ? "IC Client"
        : null;
  const showReceipt =
    card.paymentState === "prepaid" || card.paymentState === "paid";

  return (
    <Box
      data-sales-card-id={card.id}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${highlighted ? alpha(m.teal, 0.55) : alpha(m.navy, 0.1)}`,
        bgcolor: highlighted ? alpha(m.teal, 0.05) : "#fff",
        boxShadow: highlighted ? `0 0 0 3px ${alpha(m.teal, 0.12)}` : "none",
        px: 1.75,
        py: 1.5,
        scrollMarginTop: 12,
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 1.1 }}
      >
        <Typography
          sx={mollureSectionTitleSx(m.navy)}
        >
          {card.title}
        </Typography>
        {card.statusBadge ? (
          <Box sx={{ px: 1, py: 0.3, borderRadius: "999px", ...badge }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
              {card.statusBadge}
            </Typography>
          </Box>
        ) : null}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ mb: 0.15, flexWrap: "wrap" }}
      >
        <Typography
          sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}
        >
          {isGuestOrModel
            ? card.payerLabel || card.clientName
            : card.clientName}
        </Typography>
        {clientBadge ? (
          <Box
            sx={{
              px: 0.7,
              py: 0.15,
              borderRadius: "999px",
              ...clientPlatformTagToneColors(m, "teal"),
            }}
          >
            <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
              {clientBadge}
            </Typography>
          </Box>
        ) : null}
      </Stack>

      {isGuestOrModel && card.clientName ? (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.55),
            mb: 0.35,
          }}
        >
          {card.clientName}
        </Typography>
      ) : null}

      {card.clientEmail ? (
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            color: alpha(m.navy, 0.5),
            mb: 1.15,
          }}
        >
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
            highlighted={highlightId === sub.id}
            onViewInvoice={() => onSubViewInvoice?.(sub)}
            onViewReceipt={() => onSubViewReceipt?.(sub)}
            onAddOns={() => onSubAddOns?.(sub)}
            onMenuAction={(action) => onSubMenuAction?.(sub, action)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.85 }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 900, color: alpha(m.navy, 0.82) }}
        >
          {card.totalLabel || "Total"}
        </Typography>
        <Typography
          sx={{
            fontSize: card.kind === "reissued_invoice" ? 22 : 13,
            fontWeight: 900,
            color:
              card.kind === "reissued_invoice" ? m.teal : alpha(m.navy, 0.88),
          }}
        >
          {formatCompactEuro(card.total)}
        </Typography>
      </Stack>

      {card.secondaryRows?.map((row) => (
        <Stack
          key={row.id}
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 0.55 }}
        >
          <Typography
            sx={mollureBodySx(m.navy)}
          >
            {row.label}
          </Typography>
          <Typography
            sx={mollureLabelSx(m.navy)}
          >
            {formatCompactEuro(row.amount)}
          </Typography>
        </Stack>
      ))}

      <Box sx={{ mt: 0.75, mb: 0.85 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.55),
            mb: 0.2,
          }}
        >
          {card.highlightLabel}
        </Typography>
        <Typography
          sx={{ fontSize: 28, fontWeight: 900, color: m.teal, lineHeight: 1.1 }}
        >
          {formatCompactEuro(card.highlightAmount)}
        </Typography>
      </Box>

      {card.methodDateLine || card.dueDate ? (
        <MethodDateLine
          methodDateLine={card.methodDateLine}
          dueDate={card.dueDate}
          paymentMethodLabel={card.paymentMethodLabel}
        />
      ) : null}

      {card.metaLines?.length ? (
        <Stack spacing={0.25} sx={{ mt: 0.75 }}>
          {card.metaLines.map((line) => (
            <Typography
              key={line}
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
              }}
            >
              {line}
            </Typography>
          ))}
        </Stack>
      ) : null}

      {card.note ? (
        <Typography
          sx={{
            mt: 0.75,
            fontSize: 11.5,
            fontWeight: 700,
            color: alpha(m.navy, 0.55),
          }}
        >
          Note: {card.note}
        </Typography>
      ) : null}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.35 }}>
        <AppButton
          tone="secondary"
          size="small"
          onClick={onViewInvoice}
          sx={{
            fontSize: 11.5,
            px: 1.25,
            height: 32,
          }}
        >
          View Invoice
        </AppButton>
        {showReceipt ? (
          <AppButton
            tone="secondary"
            size="small"
            onClick={onViewReceipt}
            sx={{
              fontSize: 11.5,
              px: 1.25,
              height: 32,
            }}
          >
            View Receipt
          </AppButton>
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
        <AppButton
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
        </AppButton>
      ) : null}

      <SalesActionsMenu
        isAddon={card.kind === "addon"}
        limitedMenu={card.limitedMenu}
        showRefund={
          card.paymentState === "paid" || card.paymentState === "prepaid"
        }
        showMarkUnpaid={card.paymentState === "pending"}
        menuAnchor={menuAnchor}
        downloadAnchor={downloadAnchor}
        setDownloadAnchor={setDownloadAnchor}
        closeAll={closeAll}
        run={run}
      />
    </Box>
  );
}
