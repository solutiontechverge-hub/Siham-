"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../../../components/common/AppDrawer";
import { FinanceDrawerFiltersFooter } from "../../../../components/common/FinanceDrawerFooter";
import {
  CLIENT_LIST_FILTER_OPTIONS,
  type ClientListFilterKey,
} from "./data/clientListFilters";

type Props = {
  open: boolean;
  activeFilters: ReadonlySet<ClientListFilterKey>;
  onClose: () => void;
  onToggle: (key: ClientListFilterKey) => void;
  onClear: () => void;
};

export default function ClientListFilterDrawer({
  open,
  activeFilters,
  onClose,
  onToggle,
  onClear,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Filter clients"
      footer={
        <FinanceDrawerFiltersFooter
          onCancel={onClose}
          onReset={onClear}
          onApply={onClose}
          resetLabel="All clients"
          spacing={1}
          stackSx={{ py: 2, width: "100%" }}
        />
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.55),
            mb: 1.5,
          }}
        >
          Select one or more client types. Matching any selected filter will
          show the client.
        </Typography>
        <Stack spacing={0.5}>
          {CLIENT_LIST_FILTER_OPTIONS.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  size="small"
                  checked={activeFilters.has(key)}
                  onChange={() => onToggle(key)}
                  sx={{ "&.Mui-checked": { color: m.teal } }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {label}
                </Typography>
              }
              sx={{ mx: 0, py: 0.35 }}
            />
          ))}
        </Stack>
      </Box>
    </AppDrawer>
  );
}
