"use client";

import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../../common/AppButton";
import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Box,
  ButtonBase,
  Checkbox,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import QtyStepper from "../../common/QtyStepper";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import AppSearchField from "../../common/AppSearchField";
import BookingAddUniqueItemScreen from "../../common/calendar/BookingAddUniqueItemScreen";
import BookingEditCatalogItemScreen from "../../common/calendar/BookingEditCatalogItemScreen";
import CatalogItemDeleteDialog from "../../common/calendar/CatalogItemDeleteDialog";
import { BodyText } from "../../ui/typography";
import { roundMoney } from "../../../utils/money";
import {
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
  getUniqueItemDraftErrors,
  normalizeVatRate,
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
        ...mollureLabelSx(m.navy),
        justifyContent: "flex-start",
        borderColor: alpha(m.navy, 0.1),
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

type CatalogScreen = "catalog" | "add-product" | "edit-product";

type DraftItem = { selected: boolean; quantity: number };

function buildDraftFromOption(
  option: ManualEntryCatalogOption,
): BookingUniqueItemDraft {
  return {
    productName: option.label,
    vat: option.vat ?? "",
    price: String(option.unitPrice),
    unit: Math.max(1, option.unit ?? 1),
    discountType: option.discountType ?? "fixed",
    discountAmount: String(option.discountAmount ?? 0),
  };
}

function buildOptionFromDraft(
  draft: BookingUniqueItemDraft,
  id: string,
): ManualEntryCatalogOption | null {
  const line = buildUniqueItemLine(draft);
  if (!line) return null;
  return {
    id,
    label: draft.productName.trim(),
    unitPrice: line.unitPrice,
    vat: normalizeVatRate(draft.vat),
    unit: line.quantity,
    discountType: draft.discountType,
    discountAmount: roundMoney(draft.discountAmount),
  };
}

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
  /** Show edit on every row (default true when allowAddProduct). */
  allowEditProduct?: boolean;
  /** Label for the add CTA (default: "Add Product"). Use "Add Item" for items. */
  addProductLabel?: string;
  /** Title/heading when the unique-item form screen is open. */
  addScreenTitle?: string;
  /** Title/heading when editing an existing option. */
  editScreenTitle?: string;
  /** Persist catalog edits (finance settings / parent state). */
  onUpdateOption?: (option: ManualEntryCatalogOption) => void;
  /** Persist newly created catalog options so they survive reload. */
  onAddOption?: (option: ManualEntryCatalogOption) => void;
  /** Permanently remove a catalog option after confirmation. */
  onDeleteOption?: (option: ManualEntryCatalogOption) => void;
  /** When set, only these options show a delete icon. Defaults to all if onDeleteOption is provided. */
  isDeletable?: (option: ManualEntryCatalogOption) => boolean;
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
  allowEditProduct,
  addProductLabel = "Add Product",
  addScreenTitle,
  editScreenTitle,
  onUpdateOption,
  onAddOption,
  onDeleteOption,
  isDeletable,
  onSave,
}: ManualEntryCatalogDrawerProps) {
  const m = useTheme().palette.mollure;
  const canEdit = allowEditProduct ?? allowAddProduct;
  const isItemMode = addProductLabel === "Add Item";
  const [screen, setScreen] = React.useState<CatalogScreen>("catalog");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState<Record<string, DraftItem>>({});
  const [customOptions, setCustomOptions] = React.useState<
    ManualEntryCatalogOption[]
  >([]);
  const [optionOverrides, setOptionOverrides] = React.useState<
    Record<string, ManualEntryCatalogOption>
  >({});
  const [editingOptionId, setEditingOptionId] = React.useState<string | null>(
    null,
  );
  const [uniqueItemDraft, setUniqueItemDraft] =
    React.useState<BookingUniqueItemDraft>(emptyBookingUniqueItemDraft());
  const [uniqueItemAttempted, setUniqueItemAttempted] = React.useState(false);
  const [pendingDelete, setPendingDelete] =
    React.useState<ManualEntryCatalogOption | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setScreen("catalog");
    setQuery("");
    setDraft({});
    setCustomOptions([]);
    setOptionOverrides({});
    setEditingOptionId(null);
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setPendingDelete(null);
  }, [open]);

  const allOptions = React.useMemo(() => {
    const byId = new Map<string, ManualEntryCatalogOption>();
    for (const option of options) {
      byId.set(option.id, optionOverrides[option.id] ?? option);
    }
    for (const option of customOptions) {
      if (!byId.has(option.id)) {
        byId.set(option.id, optionOverrides[option.id] ?? option);
      }
    }
    return Array.from(byId.values());
  }, [customOptions, optionOverrides, options]);

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
    setEditingOptionId(null);
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setScreen("add-product");
  };

  const openEditProduct = (option: ManualEntryCatalogOption) => {
    setEditingOptionId(option.id);
    setUniqueItemDraft(buildDraftFromOption(option));
    setUniqueItemAttempted(false);
    setScreen("edit-product");
  };

  const applyAddProduct = () => {
    setUniqueItemAttempted(true);
    const line = buildUniqueItemLine(uniqueItemDraft);
    if (!line) return;

    const customOption: ManualEntryCatalogOption = {
      id: line.id,
      label: uniqueItemDraft.productName.trim(),
      unitPrice: line.unitPrice,
      vat: normalizeVatRate(uniqueItemDraft.vat),
      unit: line.quantity,
      discountType: uniqueItemDraft.discountType,
      discountAmount: roundMoney(uniqueItemDraft.discountAmount),
    };

    setCustomOptions((prev) => [...prev, customOption]);
    onAddOption?.(customOption);
    setDraft((prev) => ({
      ...prev,
      [line.id]: { selected: true, quantity: line.quantity },
    }));
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setScreen("catalog");
  };

  const applyEditProduct = () => {
    if (!editingOptionId) return;
    setUniqueItemAttempted(true);
    const nextOption = buildOptionFromDraft(uniqueItemDraft, editingOptionId);
    if (!nextOption) return;

    const isCustom = customOptions.some((o) => o.id === editingOptionId);
    if (isCustom) {
      setCustomOptions((prev) =>
        prev.map((option) =>
          option.id === editingOptionId ? nextOption : option,
        ),
      );
      onAddOption?.(nextOption);
    } else {
      setOptionOverrides((prev) => ({
        ...prev,
        [editingOptionId]: nextOption,
      }));
      onUpdateOption?.(nextOption);
    }

    setDraft((prev) => {
      const current = prev[editingOptionId];
      if (!current) return prev;
      return {
        ...prev,
        [editingOptionId]: {
          ...current,
          quantity: Math.max(1, nextOption.unit ?? current.quantity),
        },
      };
    });

    setEditingOptionId(null);
    setUniqueItemDraft(emptyBookingUniqueItemDraft());
    setUniqueItemAttempted(false);
    setScreen("catalog");
  };

  const handleClose = () => {
    if (screen === "add-product" || screen === "edit-product") {
      setScreen("catalog");
      setEditingOptionId(null);
      setUniqueItemAttempted(false);
      return;
    }
    onClose();
  };

  const isFormScreen = screen === "add-product" || screen === "edit-product";
  const resolvedAddScreenTitle =
    addScreenTitle ??
    (isItemMode ? "Add Unique Item" : addProductLabel);
  const resolvedEditScreenTitle =
    editScreenTitle ??
    (isItemMode ? "Edit Item" : "Edit Product");
  const formHeading =
    screen === "edit-product"
      ? resolvedEditScreenTitle
      : resolvedAddScreenTitle;
  const searchPlaceholder = isItemMode
    ? "Search items..."
    : "Search products...";

  const confirmDeleteOption = () => {
    if (!pendingDelete) return;
    setCustomOptions((prev) =>
      prev.filter((option) => option.id !== pendingDelete.id),
    );
    setDraft((prev) => {
      const next = { ...prev };
      delete next[pendingDelete.id];
      return next;
    });
    onDeleteOption?.(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <>
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isFormScreen ? formHeading : title}
      onBack={handleClose}
      contentVariant="muted"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      footer={
        <FinanceDrawerActionsFooter
          onCancel={handleClose}
          onPrimary={
            screen === "edit-product"
              ? applyEditProduct
              : isFormScreen
                ? applyAddProduct
                : handleSaveCatalog
          }
          primaryLabel="Save"
          primaryDisabled={isFormScreen ? false : selectedCount === 0}
        />
      }
    >
      {isFormScreen ? (
        screen === "edit-product" ? (
          <BookingEditCatalogItemScreen
            draft={uniqueItemDraft}
            errors={uniqueItemErrors}
            heading={formHeading}
            namePlaceholder={isItemMode ? "Item Name" : "Product Name"}
            onChange={(patch) =>
              setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
            }
          />
        ) : (
          <BookingAddUniqueItemScreen
            draft={uniqueItemDraft}
            errors={uniqueItemErrors}
            heading={formHeading}
            namePlaceholder={isItemMode ? "Unique Name" : "Product Name"}
            onChange={(patch) =>
              setUniqueItemDraft((prev) => ({ ...prev, ...patch }))
            }
          />
        )
      ) : (
        <Stack spacing={1.5}>
          {allowAddProduct ? (
            <BodyText
              sx={mollureSectionTitleSx(m.navy)}
            >
              {isItemMode ? "Select Item" : "Select Product"}
            </BodyText>
          ) : null}

          <AppSearchField
            fullWidth
            placeholder={searchPlaceholder}
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
                        sx={mollureLabelSx(m.navy, {
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.25,
                        })}
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

                    {canEdit ? (
                      <IconButton
                        size="small"
                        aria-label={`Edit ${option.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditProduct(option);
                        }}
                        sx={{
                          color: alpha(m.navy, 0.42),
                          "&:hover": {
                            color: m.teal,
                            bgcolor: alpha(m.teal, 0.08),
                          },
                        }}
                      >
                        <EditRoundedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    ) : null}

                    {onDeleteOption &&
                    (isDeletable ? isDeletable(option) : true) ? (
                      <IconButton
                        size="small"
                        aria-label={`Delete ${option.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(option);
                        }}
                        sx={{
                          color: alpha(m.navy, 0.42),
                          "&:hover": {
                            color: "#E85D5D",
                            bgcolor: alpha("#E85D5D", 0.08),
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    ) : null}

                    {withQuantity ? (
                      <QtyStepper
                        value={qty}
                        onDecrement={() => adjustQuantity(option.id, -1)}
                        onIncrement={() => adjustQuantity(option.id, 1)}
                        decrementDisabled={!checked || qty <= 1}
                        incrementDisabled={!checked}
                        stopPropagation
                      />
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
                sx={mollureLabelSx(m.navy, {
                  color: alpha(m.navy, 0.6),
                  lineHeight: 1,
                })}
              >
                {addProductLabel}
              </BodyText>
            </ButtonBase>
          ) : null}
        </Stack>
      )}
    </AppDrawer>
    <CatalogItemDeleteDialog
      open={Boolean(pendingDelete)}
      itemName={pendingDelete?.label}
      onClose={() => setPendingDelete(null)}
      onConfirm={confirmDeleteOption}
    />
    </>
  );
}
