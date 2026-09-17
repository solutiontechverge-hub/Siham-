"use client";

import * as React from "react";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import {
  FilterDrawerCheckboxRow,
  FilterDrawerSectionHeading,
} from "../../common/FilterDrawerFields";
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
            <FilterDrawerSectionHeading>
              {section.title}
            </FilterDrawerSectionHeading>
            <Stack spacing={0.75}>
              {section.options.map((opt) => (
                <FilterDrawerCheckboxRow
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
