import * as React from "react";
import { Box, Checkbox, Divider, FormControlLabel, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FinanceDrawer from "../../common/FinanceDrawer";
import { FinanceDrawerFiltersFooter } from "../../common/FinanceDrawerFooter";
import { BodyText, CardTitle } from "../../ui/typography";

type Option = { key: string; label: string };
export type FinanceFiltersSection = { title: string; options: readonly Option[] };

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
      { key: "entry:newSale", label: "New sale" },
    ],
  },
  {
    title: "Client type",
    options: [
      { key: "client:ic", label: "IC" },
      { key: "client:cc", label: "CC" },
      { key: "client:mollure", label: "Mollure" },
      { key: "client:nonMollure", label: "non-mollure" },
    ],
  },
  {
    title: "Transaction types",
    options: [
      { key: "tx:onlineDirect", label: "Online — direct" },
      { key: "tx:onlineNonDirect", label: "Online — non-direct" },
      { key: "tx:offlineDirect", label: "Offline — direct" },
      { key: "tx:offlineNonDirect", label: "Offline — non-direct" },
    ],
  },
  {
    title: "Payment status",
    options: [
      { key: "status:all", label: "All" },
      { key: "status:prepaid", label: "Prepaid" },
      { key: "status:paid", label: "Paid" },
      { key: "status:pending", label: "Pending" },
      { key: "status:cancelled", label: "Cancelled" },
      { key: "status:failed", label: "Failed" },
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
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [draft, setDraft] = React.useState<FinanceFiltersValue>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <FinanceDrawer
      open={open}
      onClose={onClose}
      title="Filters"
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
              <CardTitle sx={{ fontSize: 12, color: alpha(m.navy, 0.7), mb: 0.75 }}>{section.title}</CardTitle>
              <Stack spacing={0.5}>
                {section.options.map((opt) => (
                  <FormControlLabel
                    key={opt.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(draft[opt.key])}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                      />
                    }
                    label={<BodyText sx={{ fontSize: 12, color: alpha(m.navy, 0.72) }}>{opt.label}</BodyText>}
                    sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { mt: "2px" } }}
                  />
                ))}
              </Stack>
              {idx !== sections.length - 1 ? <Divider sx={{ mt: 1.5, borderColor: alpha(m.navy, 0.08) }} /> : null}
            </Box>
          ))}
        </Stack>
    </FinanceDrawer>
  );
}

