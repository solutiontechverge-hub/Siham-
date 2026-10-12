"use client";

import AppButton from "../../../../../components/common/AppButton";
import * as React from "react";
import { Box, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { SETTINGS_TAB_LABELS } from "./setting.data";
import { useFinanceSettingPage } from "./useFinanceSettingPage";
import InvoiceSettings from "./InvoiceSettings";
import FinanceSettingStripe from "./FinanceSettingStripe";
import FinanceSettingTransactionOptions from "./FinanceSettingTransactionOptions";

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <AppButton
      size="small"
      disableElevation
      onClick={onClick}
      sx={{
        minHeight: 28,
        height: 28,
        px: 1.1,
        borderRadius: "7px",
        textTransform: "none",
        fontWeight: 600,
        fontSize: 12,
        bgcolor: active ? m.teal : alpha(m.navy, 0.02),
        color: active ? "#fff" : alpha(m.navy, 0.58),
        border: `1px solid ${active ? alpha(m.tealDark, 0.35) : alpha(m.navy, 0.12)}`,
        "&:hover": { bgcolor: active ? m.tealDark : alpha(m.navy, 0.04) },
      }}
    >
      {children}
    </AppButton>
  );
}

export default function FinanceSettingPageView() {
  const { m, tab, setTab } = useFinanceSettingPage();

  return (
    <Box
      sx={{
        borderRadius: "10px",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.25, pt: 2.1, pb: 1.25 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <TabButton
              active={tab === "stripe"}
              onClick={() => setTab("stripe")}
            >
              {SETTINGS_TAB_LABELS.stripe}
            </TabButton>
            <TabButton
              active={tab === "transaction"}
              onClick={() => setTab("transaction")}
            >
              {SETTINGS_TAB_LABELS.transaction}
            </TabButton>
            <TabButton
              active={tab === "invoice"}
              onClick={() => setTab("invoice")}
            >
              {SETTINGS_TAB_LABELS.invoice}
            </TabButton>
          </Stack>
        </Box>

        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <Box sx={{ display: tab === "stripe" ? "block" : "none" }}>
            <FinanceSettingStripe />
          </Box>
          <Box sx={{ display: tab === "transaction" ? "block" : "none" }}>
            <FinanceSettingTransactionOptions />
          </Box>
          <Box sx={{ display: tab === "invoice" ? "block" : "none" }}>
            <InvoiceSettings />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
