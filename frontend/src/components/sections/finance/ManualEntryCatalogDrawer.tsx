"use client";

import AppButton from "../../common/AppButton";
import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, ButtonBase, Checkbox, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import AppSearchField from "../../common/AppSearchField";
import BookingAddUniqueItemScreen from "../../common/calendar/BookingAddUniqueItemScreen";
import { BodyText } from "../../ui/typography";
import {
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
  getUniqueItemDraftErrors,
  type BookingUniqueItemDraft,
} from "../../../data/bookingUniqueItem.data";
import {
  formatEurAmount,
  type ManualEntryCatalogOption,
} from "./manualEntry.data";

type ManualEntryCatalogOpenButtonProps = {
  label: string;
  onClick: () => void;
};

export function ManualEntryCatalogOpenButton({
  label,
  onClick,
}: ManualEntryCatalogOpenButtonProps) {
  const m = useTheme().palette.mollure;

  return (
    <AppButton
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
    </AppButton>
  );
}

export type ManualEntryCatalogSelection = ManualEntryCatalogOption & {
  quantity: number;
};

type CatalogScreen = "catalog" | "add-product";

type DraftItem = { selected: boolean; quantity: number };

type ManualEntryCatalogDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  options: ManualEntryCatalogOption[];
  emptyLabel?: string;
  /** Calendar-style qty steppers on each row. */
  withQuantity?: boolean;
  /** Calendar-style “Add …” → unique-item form in the same drawer. */
  allowAddProduct?: boolean;
  /** Label for the add CTA (default: "Add Product"). Use "Add Item" for items. */
  addProductLabel?: string;
  onSave: (selected: ManualEntryCatalogSelection[]) => void;
};

export default function ManualEntryCatalogDrawer({
  open,
  onClose,
  title,
  options,
  emptyLabel = "No options available",
  withQuantity = false,
  allowAddProduct = false,
  addProductLabel = "Add Product",
  onSave,
}: ManualEntryCatalogDrawerProps) {
  const m = useTheme().palette.mollure;
  const [screen, setScreen] = React.useState<CatalogScreen>("catalog");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState<Record<string, DraftItem>>({});
  const [customOptions, setCustomOptions] = React.useState<
    ManualEntryCatalogOption[]
  >([]);
  const [uniqueItemDraft, setUniqueItemDraft] =
    React.useState<BookingUniqueItemDraft>(emptyBookingUniqueItemDraft());
  const [uniqueItemAttempted, setUniqueItemAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setScreen("catalog");
    setQuery("");
    setDraft({});
    setCustomOptions([]);
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
  }, [open]);

  const allOptions = React.useMemo(
    () => [...options, ...customOptions],
    [customOptions, options],
  );

  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [allOptions, query]);

  const selectedCount = React.useMemo(
    () => Object.values(draft).filter((item) => item.selected).length,
    [draft],
  );

  const uniqueItemErrors = React.useMemo(
    () =>
      uniqueItemAttempted ? getUniqueItemDraftErrors(uniqueItemDraft) : {},
    [uniqueItemAttempted, uniqueItemDraft],
  );

  const getDraftItem = (id: string): DraftItem =>
    draft[id] ?? { selected: false, quantity: 1 };

  const toggleOption = (id: string) => {
    setDraft((prev) => {
      const current = prev[id] ?? { selected: false, quantity: 1 };
      return {
        ...prev,
        [id]: { ...current, selected: !current.selected },
      };
    });
  };

  const adjustQuantity = (id: string, delta: number) => {
    setDraft((prev) => {
      const current = prev[id] ?? { selected: false, quantity: 1 };
      if (!current.selected) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          quantity: Math.max(1, current.quantity + delta),
        },
      };
    });
  };

  const handleSaveCatalog = () => {
    const selected = allOptions
      .filter((option) => draft[option.id]?.selected)
      .map((option) => ({
        ...option,
        quantity: Math.max(1, draft[option.id]?.quantity ?? 1),
      }));
    if (selected.length === 0) return;
    onSave(selected);
    onClose();
  };

  const openAddProduct = () => {
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setScreen("add-product");
  };

  const applyAddProduct = () => {
    setUniqueItemAttempted(true);
    const line = buildUniqueItemLine(uniqueItemDraft);
    if (!line) return;

    const customOption: ManualEntryCatalogOption = {
      id: line.id,
      label: uniqueItemDraft.productName.trim(),
      unitPrice: line.unitPrice,
    };

    setCustomOptions((prev) => [...prev, customOption]);
    setDraft((prev) => ({
      ...prev,
      [line.id]: { selected: true, quantity: line.quantity },
    }));
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setScreen("catalog");
  };

  const handleClose = () => {
    if (screen === "add-product") {
      setScreen("catalog");
      setUniqueItemAttempted(false);
      return;
    }
    onClose();
  };

  const isAddProductScreen = screen === "add-product";

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isAddProductScreen ? "Add Unique Item" : title}
      onBack={handleClose}
      contentVariant="muted"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      footer={
        <FinanceDrawerActionsFooter
          onCancel={handleClose}
          onPrimary={isAddProductScreen ? applyAddProduct : handleSaveCatalog}
          primaryLabel="Save"
          primaryDisabled={isAddProductScreen ? false : selectedCount === 0}
        />
      }
    >
      {isAddProductScreen ? (
        <BookingAddUniqueItemScreen
          draft={uniqueItemDraft}
          errors={uniqueItemErrors}
          onChange={(patch) =>
            setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {allowAddProduct ? (
            <BodyText
              sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
            >
              {addProductLabel === "Add Item"
                ? "Select Item"
                : "Select Product"}
            </BodyText>
          ) : null}

          <AppSearchField
            fullWidth
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
              },
            }}
          />

          {filteredOptions.length === 0 ? (
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: alpha(m.navy, 0.5),
                py: 2,
                textAlign: "center",
              }}
            >
              {emptyLabel}
            </Typography>
          ) : (
            <Stack spacing={0.75}>
              {filteredOptions.map((option) => {
                const item = getDraftItem(option.id);
                const checked = item.selected;
                const qty = item.quantity;

                return (
                  <Box
                    key={option.id}
                    sx={{
                      width: "100%",
                      border: `1px solid ${
                        checked ? m.teal : alpha(m.navy, 0.1)
                      }`,
                      borderRadius: "10px",
                      px: 1.25,
                      py: 1.1,
                      bgcolor: checked ? alpha(m.teal, 0.06) : "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: checked
                          ? alpha(m.teal, 0.08)
                          : alpha(m.navy, 0.02),
                      },
                    }}
                    onClick={() => toggleOption(option.id)}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.25,
                        }}
                      >
                        {withQuantity && qty > 1
                          ? `${option.label} x${qty}`
                          : option.label}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.48),
                          lineHeight: 1.2,
                        }}
                      >
                        {formatEurAmount(option.unitPrice)}
                      </Typography>
                    </Box>

                    {withQuantity ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          border: `1px solid ${alpha(m.navy, 0.12)}`,
                          borderRadius: "8px",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <IconButton
                          size="small"
                          disabled={!checked || qty <= 1}
                          onClick={() => adjustQuantity(option.id, -1)}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 0,
                            color: alpha(m.navy, 0.55),
                          }}
                        >
                          <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <BodyText
                          component="span"
                          sx={{
                            width: 24,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.78),
                            lineHeight: 1,
                          }}
                        >
                          {qty}
                        </BodyText>
                        <IconButton
                          size="small"
                          disabled={!checked}
                          onClick={() => adjustQuantity(option.id, 1)}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 0,
                            color: alpha(m.navy, 0.55),
                          }}
                        >
                          <AddRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    ) : null}

                    <Checkbox
                      checked={checked}
                      size="small"
                      tabIndex={-1}
                      sx={{
                        p: 0.25,
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          )}

          {allowAddProduct ? (
            <ButtonBase
              onClick={openAddProduct}
              sx={{
                alignSelf: "flex-start",
                border: `1px solid ${alpha(m.navy, 0.14)}`,
                borderRadius: "10px",
                height: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1.25,
                px: 1.5,
                bgcolor: "#fff",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { bgcolor: alpha(m.navy, 0.02) },
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "999px",
                  bgcolor: alpha(m.navy, 0.06),
                  color: alpha(m.navy, 0.45),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 16 }} />
              </Box>
              <BodyText
                component="span"
                sx={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.6),
                  lineHeight: 1,
                }}
              >
                {addProductLabel}
              </BodyText>
            </ButtonBase>
          ) : null}
        </Stack>
      )}
    </AppDrawer>
  );
}
