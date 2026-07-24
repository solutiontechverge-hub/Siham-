"use client";

import * as React from "react";
import { Box, Checkbox, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerFiltersFooter } from "../../common/FinanceDrawerFooter";

type Option = { key: string; label: string };
export type FinanceFiltersSection = {
  title: string;
  options: readonly Option[];
};

export type FinanceFiltersValue = Record<string, boolean>;

export type FinanceFiltersDrawerProps = {
  open: boolean;
  value: FinanceFiltersValue;
  onChange: (next: FinanceFiltersValue) => void;
  onClose: () => void;
  onApply: () => void;
  onCancel: () => void;
  sections?: readonly FinanceFiltersSection[];
};

const DEFAULT_SECTIONS: readonly FinanceFiltersSection[] = [
  {
    title: "Entry ID",
    options: [
      { key: "entry:onlineBooking", label: "Online booking" },
      { key: "entry:offlineBooking", label: "Offline booking" },
      { key: "entry:manualEntry", label: "Manual entry" },
    ],
  },
  {
    title: "Client",
    options: [
      { key: "client:ic", label: "IC" },
      { key: "client:bc", label: "BC" },
      { key: "client:mollure", label: "Mollure Client" },
      { key: "client:nonMollure", label: "Non-Mollure Client" },
      { key: "client:guest", label: "Guest" },
    ],
  },
  {
    title: "Transaction types",
    options: [
      { key: "tx:onlineDirect", label: "Online (immediate)" },
      { key: "tx:onlineInvoice", label: "Online – invoice with due date" },
      { key: "tx:offlineDirect", label: "Offline (immediate)" },
      { key: "tx:offlineInvoice", label: "Offline – invoice with due date" },
    ],
  },
  {
    title: "Payment status",
    options: [
      { key: "status:prepaid", label: "Prepaid" },
      { key: "status:paid", label: "Paid" },
      { key: "status:refunded", label: "Refunded" },
      { key: "status:pending", label: "Pending" },
      { key: "status:prepaymentDue", label: "Prepayment due" },
      { key: "status:paymentDue", label: "Payment due" },
      { key: "status:failed", label: "Failed" },
      { key: "status:overdueInvoice", label: "Overdue (past due date)" },
      {
        key: "status:overdueResponse",
        label: "Overdue (late response/prepayment)",
      },
      { key: "status:voided", label: "Voided" },
    ],
  },
];

function FilterRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const m = useTheme().palette.mollure;

  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        margin: 0,
        padding: "2px 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disableRipple
        sx={{
          padding: 0,
          margin: 0,
          width: 18,
          height: 18,
          color: alpha(m.navy, 0.35),
          "&.Mui-checked": { color: m.teal },
          "& .MuiSvgIcon-root": { fontSize: 18 },
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 500,
          color: alpha(m.navy, 0.72),
          margin: 0,
          padding: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const m = useTheme().palette.mollure;
  return (
    <Typography
      component="div"
      sx={{
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1.2,
        color: alpha(m.navy, 0.7),
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

export default function FinanceFiltersDrawerView({
  open,
  value,
  onChange,
  onClose,
  onApply,
  onCancel,
  sections = DEFAULT_SECTIONS,
}: FinanceFiltersDrawerProps) {
  const m = useTheme().palette.mollure;
  const [draft, setDraft] = React.useState<FinanceFiltersValue>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Filter transactions"
      contentVariant="muted"
      footer={
        <FinanceDrawerFiltersFooter
          onCancel={() => {
            setDraft(value);
            onCancel();
          }}
          onReset={() => {
            setDraft({});
            onChange({});
          }}
          onApply={() => {
            onChange(draft);
            onApply();
          }}
        />
      }
    >
      <Stack spacing={2}>
        {sections.map((section, idx) => (
          <Box key={section.title}>
            <SectionHeading>{section.title}</SectionHeading>
            <Stack spacing={0.75}>
              {section.options.map((opt) => (
                <FilterRow
                  key={opt.key}
                  label={opt.label}
                  checked={Boolean(draft[opt.key])}
                  onChange={(checked) =>
                    setDraft((prev) => ({
                      ...prev,
                      [opt.key]: checked,
                    }))
                  }
                />
              ))}
            </Stack>
            {idx !== sections.length - 1 ? (
              <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} />
            ) : null}
          </Box>
        ))}
      </Stack>
    </AppDrawer>
  );
}
