"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Checkbox, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FinanceDrawer from "../../common/FinanceDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import MollureFormField from "../../common/MollureFormField";
import type { ManualEntryCatalogOption } from "./manualEntry.data";
import { formatEurAmount } from "./manualEntry.data";

type ManualEntryCatalogOpenButtonProps = {
  label: string;
  onClick: () => void;
};

export function ManualEntryCatalogOpenButton({ label, onClick }: ManualEntryCatalogOpenButtonProps) {
  const m = useTheme().palette.mollure;

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={onClick}
      startIcon={<AddRoundedIcon sx={{ fontSize: 18, color: m.teal }} />}
      sx={{
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 800,
        fontSize: 12.5,
        justifyContent: "flex-start",
        borderColor: alpha(m.navy, 0.1),
        color: alpha(m.navy, 0.78),
        bgcolor: "#fff",
        height: 42,
        px: 1.5,
        "&:hover": {
          borderColor: m.teal,
          bgcolor: alpha(m.teal, 0.02),
        },
      }}
    >
      {label}
    </Button>
  );
}

type ManualEntryCatalogDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  options: ManualEntryCatalogOption[];
  emptyLabel?: string;
  onSave: (selected: ManualEntryCatalogOption[]) => void;
};

export default function ManualEntryCatalogDrawer({
  open,
  onClose,
  title,
  options,
  emptyLabel = "No options available",
  onSave,
}: ManualEntryCatalogDrawerProps) {
  const m = useTheme().palette.mollure;
  const [query, setQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIds(new Set());
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggleOption = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const selected = options.filter((option) => selectedIds.has(option.id));
    if (selected.length === 0) return;
    onSave(selected);
    onClose();
  };

  return (
    <FinanceDrawer
      open={open}
      onClose={onClose}
      title={title}
      onBack={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      footer={
        <FinanceDrawerActionsFooter
          onCancel={onClose}
          onPrimary={handleSave}
          primaryLabel="Save"
          primaryDisabled={selectedIds.size === 0}
        />
      }
    >
      <Stack spacing={1.5}>
        <MollureFormField
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#fff" } }}
        />

        {filteredOptions.length === 0 ? (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.5), py: 2, textAlign: "center" }}>
            {emptyLabel}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {filteredOptions.map((option) => {
              const checked = selectedIds.has(option.id);
              return (
                <Box
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 1,
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: `1px solid ${checked ? m.teal : alpha(m.navy, 0.1)}`,
                    bgcolor: checked ? alpha(m.teal, 0.06) : "#fff",
                    "&:hover": { bgcolor: checked ? alpha(m.teal, 0.08) : alpha(m.navy, 0.02) },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    size="small"
                    tabIndex={-1}
                    sx={{
                      p: 0.25,
                      color: alpha(m.navy, 0.35),
                      "&.Mui-checked": { color: m.teal },
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                      {option.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.55), flexShrink: 0 }}>
                    {formatEurAmount(option.unitPrice)}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </FinanceDrawer>
  );
}
