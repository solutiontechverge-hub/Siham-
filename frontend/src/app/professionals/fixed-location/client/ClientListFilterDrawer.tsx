"use client";

import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureDrawer from "../../../../components/common/MollureDrawer";
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
    <MollureDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      width={{ xs: "100%", sm: 360 }}
      title="Filter clients"
      footer={
        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ px: 2.5, py: 2, width: "100%" }}>
          <Button
            onClick={onClear}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
            }}
          >
            All clients
          </Button>
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 900,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
            }}
          >
            Apply
          </Button>
        </Stack>
      }
    >
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 1.5 }}>
          Select one or more client types. Matching any selected filter will show the client.
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
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78) }}>
                  {label}
                </Typography>
              }
              sx={{ mx: 0, py: 0.35 }}
            />
          ))}
        </Stack>
      </Box>
    </MollureDrawer>
  );
}
