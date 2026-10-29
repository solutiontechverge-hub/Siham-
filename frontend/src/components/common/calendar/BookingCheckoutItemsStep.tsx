"use client";

import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import { clientPlatformTagToneColors } from "../ClientPlatformTag";
import ManualEntryCatalogDrawer from "../../sections/finance/ManualEntryCatalogDrawer";
import ManualEntryDiscountModal from "../../sections/finance/ManualEntryDiscountModal";
import ManualEntryLineCard from "../../sections/finance/ManualEntryLineCard";
import ManualEntryLineEditModal from "../../sections/finance/ManualEntryLineEditModal";
import ManualEntryUniqueItemModal from "../../sections/finance/ManualEntryUniqueItemModal";
import {
  buildManualEntryCatalogOptions,
  calculateManualEntryDiscountAmount,
  createManualEntryLineFromOption,
  formatEurAmount,
  formatManualEntryDiscountLabel,
  lineTotal,
  type ManualEntryCatalogOption,
  type ManualEntryDiscount,
  type ManualEntryLine,
  type ManualEntryLineKind,
} from "../../sections/finance/manualEntry.data";
import { useFinanceInvoiceSettings } from "../../sections/finance/useFinanceInvoiceSettings";
import {
  financeProductFromCatalogOption,
  removeFinanceProduct,
  removeFinanceUniqueItem,
  toFinanceCatalogProduct,
  upsertFinanceProduct,
  upsertFinanceUniqueItem,
} from "../../sections/finance/financeCatalogPersist";
import {
  filterLinesForParty,
  stampLinesForParty,
  type CheckoutItemParty,
} from "./bookingCheckoutItems";

type BookingCheckoutItemsStepProps = {
  party: CheckoutItemParty;
  clientPhotoSrc?: string | null;
  lines: ManualEntryLine[];
  onChangeLines: (next: ManualEntryLine[]) => void;
  discount: ManualEntryDiscount | null;
  onChangeDiscount: (next: ManualEntryDiscount | null) => void;
  /** Hide the Client card (e.g. already rendered above on split step). */
  hideClient?: boolean;
  /** Combined bill: show every line; new adds still stamp to `party.key`. */
  showAllLines?: boolean;
  /** Split "For Who?": only these parties' services/products/unique (no mix). */
  filterParties?: CheckoutItemParty[];
  /** Prefer share line ids (For Who?) — strongest no-mix filter. */
  visibleLineIds?: ReadonlySet<string>;
  /** Confirmed booking prepayment — shown under Total so due matches Pay Full Bill. */
  prepaidAmount?: number;
  /** SSOT bill total (share pool) — keeps footer aligned with Pay Full Bill. */
  totalPriceOverride?: number;
  /** SSOT amount due after prepaid (same as Pay Full Bill). */
  amountDueOverride?: number;
  /** When true, totals render in parent sticky footer instead. */
  hideTotals?: boolean;
};

export function BookingCheckoutTotalsBar(props: {
  displayedTotal: number;
  amountDue: number;
  prepaidApplied: number;
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  onDiscountClick: () => void;
}) {
  const m = useTheme().palette.mollure;
  const {
    displayedTotal,
    amountDue,
    prepaidApplied,
    discount,
    discountAmount,
    onDiscountClick,
  } = props;
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography
          sx={mollureSectionTitleSx(m.navy, { color: m.headingText })}
        >
          Total Price:
        </Typography>
        <Typography
          sx={mollurePageTitleSx(m.navy, { color: m.headingText })}
        >
          {formatEurAmount(displayedTotal)}
        </Typography>
      </Stack>
      {discount && discount.amount > 0 ? (
        <Typography sx={mollureBodyMutedSx(m.navy)}>
          Discount ({formatManualEntryDiscountLabel(discount)}): -
          {formatEurAmount(discountAmount)}
        </Typography>
      ) : null}
      {prepaidApplied > 0 ? (
        <Stack spacing={0.35}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={mollureBodyMutedSx(m.navy)}>Prepaid:</Typography>
            <Typography sx={mollureBodyMutedSx(m.navy)}>
              -{formatEurAmount(prepaidApplied)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography
              sx={mollureSectionTitleSx(m.navy, { color: m.headingText })}
            >
              Amount due:
            </Typography>
            <Typography
              sx={mollurePageTitleSx(m.navy, { color: m.headingText })}
            >
              {formatEurAmount(amountDue)}
            </Typography>
          </Stack>
        </Stack>
      ) : null}
      <AppButton
        variant="text"
        onClick={onDiscountClick}
        sx={mollureLabelSx(m.navy, {
          alignSelf: "flex-start",
          p: 0,
          minWidth: 0,
          textTransform: "none",
          color: m.teal,
        })}
      >
        {discount && discount.amount > 0 ? "Edit Discount" : "+ Discount"}
      </AppButton>
    </Stack>
  );
}

export default function BookingCheckoutItemsStep({
  party,
  clientPhotoSrc,
  lines,
  onChangeLines,
  discount,
  onChangeDiscount,
  hideClient = false,
  showAllLines = false,
  filterParties,
  visibleLineIds,
  prepaidAmount = 0,
  totalPriceOverride,
  amountDueOverride,
  hideTotals = false,
}: BookingCheckoutItemsStepProps) {
  const m = useTheme().palette.mollure;
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const businessSetup = businessSetupResponse?.data ?? null;

  const [discountModalOpen, setDiscountModalOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(
    null,
  );
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);
  const [addMenuAnchor, setAddMenuAnchor] =
    React.useState<null | HTMLElement>(null);

  const partyLines = React.useMemo(() => {
    if (visibleLineIds) {
      return lines.filter((line) => visibleLineIds.has(line.id));
    }
    if (filterParties && filterParties.length > 0) {
      const allowed = new Set(
        filterParties.flatMap((p) =>
          filterLinesForParty(lines, p).map((line) => line.id),
        ),
      );
      return lines.filter((line) => allowed.has(line.id));
    }
    if (showAllLines) return lines;
    return filterLinesForParty(lines, party);
  }, [filterParties, lines, party, showAllLines, visibleLineIds]);
  const serviceLines = React.useMemo(
    () =>
      partyLines.filter(
        (line) =>
          line.kind === "item" && !String(line.id).startsWith("unique-") &&
          !String(line.sourceReference ?? "").startsWith("unique-"),
      ),
    [partyLines],
  );
  const productLines = React.useMemo(
    () => partyLines.filter((line) => line.kind === "product"),
    [partyLines],
  );
  const uniqueLines = React.useMemo(
    () =>
      partyLines.filter(
        (line) =>
          line.kind === "item" &&
          (String(line.id).includes("unique-") ||
            String(line.sourceReference ?? "").startsWith("unique-")),
      ),
    [partyLines],
  );

  const subtotal = React.useMemo(
    () => partyLines.reduce((sum, line) => sum + lineTotal(line), 0),
    [partyLines],
  );
  const discountAmount = React.useMemo(
    () => calculateManualEntryDiscountAmount(subtotal, discount),
    [discount, subtotal],
  );
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const displayedTotal =
    typeof totalPriceOverride === "number"
      ? Math.max(0, totalPriceOverride)
      : totalPrice;
  const amountDue =
    typeof amountDueOverride === "number"
      ? Math.max(0, amountDueOverride)
      : Math.max(
          0,
          displayedTotal - Math.min(Math.max(0, prepaidAmount), displayedTotal),
        );
  // Actual credit on this bill (may be capped to main share when guests exist).
  const prepaidApplied = Math.max(0, displayedTotal - amountDue);

  const { productOptions, itemOptions, uniqueItemOptions } = React.useMemo(
    () =>
      buildManualEntryCatalogOptions({
        products: settings.products,
        services: settings.services,
        uniqueItems: settings.uniqueItems,
        setupServices: businessSetup?.service_details,
      }),
    [
      businessSetup?.service_details,
      settings.products,
      settings.services,
      settings.uniqueItems,
    ],
  );

  const [itemCatalogOverrides, setItemCatalogOverrides] = React.useState<
    Record<string, ManualEntryCatalogOption>
  >({});

  const resolvedItemOptions = React.useMemo(() => {
    const base = itemOptions.map(
      (option) => itemCatalogOverrides[option.id] ?? option,
    );
    const extras = uniqueItemOptions.filter(
      (option) => !base.some((item) => item.id === option.id),
    );
    return [...base, ...extras];
  }, [itemCatalogOverrides, itemOptions, uniqueItemOptions]);

  const addLinesFromCatalog = (
    kind: ManualEntryLineKind,
    options: Array<ManualEntryCatalogOption & { quantity?: number }>,
  ) => {
    const created = stampLinesForParty(
      options.map((option) =>
        createManualEntryLineFromOption(kind, option, option.quantity ?? 1),
      ),
      party.key,
    );
    onChangeLines([...lines, ...created]);
  };

  const removeLine = (id: string) =>
    onChangeLines(lines.filter((line) => line.id !== id));
  const updateLine = (next: ManualEntryLine) =>
    onChangeLines(lines.map((line) => (line.id === next.id ? next : line)));

  const initials =
    party.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "C";

  const renderSection = (
    title: string,
    sectionLines: ManualEntryLine[],
  ) =>
    sectionLines.length ? (
      <Box>
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            color: alpha(m.navy, 0.45),
            mb: 0.6,
          }}
        >
          {title}
        </Typography>
        <Stack spacing={0.75}>
          {sectionLines.map((line) => (
            <ManualEntryLineCard
              key={line.id}
              line={line}
              onEdit={() => setEditingLine(line)}
              onDelete={() => removeLine(line.id)}
            />
          ))}
        </Stack>
      </Box>
    ) : null;

  return (
    <Stack spacing={2}>
      {!hideClient ? (
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: alpha(m.navy, 0.55),
              mb: 0.75,
            }}
          >
            Client
          </Typography>
          <Box
            sx={{
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: alpha(m.navy, 0.03),
              px: 1.5,
              py: 1.25,
            }}
          >
            {party.variant === "main" ? (
              <Stack direction="row" alignItems="center" spacing={1.15}>
                <Avatar
                  src={clientPhotoSrc || undefined}
                  sx={{ width: 40, height: 40, fontSize: 14, fontWeight: 800 }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{ mb: 0.15, flexWrap: "wrap" }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      {party.name}
                    </Typography>
                    {party.clientBadge ? (
                      <Box
                        sx={{
                          px: 0.7,
                          py: 0.15,
                          borderRadius: "999px",
                          ...clientPlatformTagToneColors(m, "teal"),
                        }}
                      >
                        <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
                          {party.clientBadge}
                        </Typography>
                      </Box>
                    ) : null}
                  </Stack>
                  {party.email ? (
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 650,
                        color: alpha(m.navy, 0.5),
                      }}
                    >
                      {party.email}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            ) : (
              <Box>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  {party.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 650,
                    color: alpha(m.navy, 0.5),
                    mt: 0.2,
                  }}
                >
                  Guest User
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : null}

      <Box>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.55),
            mb: 0.75,
          }}
        >
          Items
        </Typography>
        <Stack spacing={1.25}>
          {renderSection("Service", serviceLines)}
          {renderSection("Product", productLines)}
          {renderSection("Unique Item", uniqueLines)}
          <AppButton
            fullWidth
            variant="outlined"
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            startIcon={<AddRoundedIcon sx={{ fontSize: 18, color: m.teal }} />}
            endIcon={
              <KeyboardArrowDownRoundedIcon
                sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }}
              />
            }
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              ...mollureLabelSx(m.navy),
              justifyContent: "flex-start",
              borderColor: alpha(m.navy, 0.1),
              bgcolor: "#fff",
              height: 42,
              px: 1.5,
              "& .MuiButton-endIcon": { ml: "auto" },
            }}
          >
            Service
          </AppButton>
          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor)}
            onClose={() => setAddMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAddMenuAnchor(null);
                setItemDrawerOpen(true);
              }}
            >
              Service
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchor(null);
                setProductDrawerOpen(true);
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddMenuAnchor(null);
                setUniqueItemOpen(true);
              }}
            >
              Unique Item
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {!hideTotals && partyLines.length ? (
        <BookingCheckoutTotalsBar
          displayedTotal={displayedTotal}
          amountDue={amountDue}
          prepaidApplied={prepaidApplied}
          discount={discount}
          discountAmount={discountAmount}
          onDiscountClick={() => setDiscountModalOpen(true)}
        />
      ) : null}

      <ManualEntryDiscountModal
        open={discountModalOpen}
        initialValue={discount}
        onClose={() => setDiscountModalOpen(false)}
        onApply={onChangeDiscount}
      />
      <ManualEntryLineEditModal
        open={Boolean(editingLine)}
        line={editingLine}
        onClose={() => setEditingLine(null)}
        onSave={(next) => {
          updateLine(next);
          setEditingLine(null);
        }}
      />
      <ManualEntryCatalogDrawer
        open={productDrawerOpen}
        title="Add product"
        options={productOptions}
        withQuantity
        allowAddProduct
        addScreenTitle="Add Product"
        editScreenTitle="Edit Product"
        onUpdateOption={(option) => {
          setSettings((prev) => ({
            ...prev,
            products: prev.products.map((product) =>
              product.id === option.id
                ? {
                    ...product,
                    name: option.label,
                    price: option.unitPrice,
                    vat: option.vat?.trim() || product.vat,
                  }
                : product,
            ),
          }));
        }}
        onAddOption={(option) => {
          setSettings((prev) =>
            upsertFinanceProduct(prev, financeProductFromCatalogOption(option)),
          );
        }}
        onDeleteOption={(option) => {
          setSettings((prev) => removeFinanceProduct(prev, option.id));
        }}
        onClose={() => setProductDrawerOpen(false)}
        onSave={(selected) => {
          addLinesFromCatalog("product", selected);
          setProductDrawerOpen(false);
        }}
      />
      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        title="Add service"
        options={resolvedItemOptions}
        withQuantity
        allowAddProduct
        addProductLabel="Add Item"
        addScreenTitle="Add Service"
        editScreenTitle="Edit Item"
        onUpdateOption={(option) => {
          setItemCatalogOverrides((prev) => ({ ...prev, [option.id]: option }));
          setSettings((prev) => {
            const hasService = prev.services.some((s) => s.id === option.id);
            if (!hasService) return prev;
            return {
              ...prev,
              services: prev.services.map((service) =>
                service.id === option.id
                  ? {
                      ...service,
                      service: option.label,
                      vat: option.vat?.trim() || service.vat,
                    }
                  : service,
              ),
            };
          });
        }}
        onAddOption={(option) => {
          setSettings((prev) =>
            upsertFinanceUniqueItem(
              prev,
              financeProductFromCatalogOption(option),
            ),
          );
        }}
        onDeleteOption={(option) => {
          setSettings((prev) => removeFinanceUniqueItem(prev, option.id));
        }}
        isDeletable={(option) =>
          option.id.startsWith("unique-") ||
          (settings.uniqueItems ?? []).some((item) => item.id === option.id)
        }
        onClose={() => setItemDrawerOpen(false)}
        onSave={(selected) => {
          addLinesFromCatalog("item", selected);
          setItemDrawerOpen(false);
        }}
      />
      <ManualEntryUniqueItemModal
        open={uniqueItemOpen}
        onClose={() => setUniqueItemOpen(false)}
        onSave={(line) => {
          const [stamped] = stampLinesForParty([line], party.key);
          onChangeLines([...lines, stamped]);
          setUniqueItemOpen(false);
          setSettings((prev) =>
            upsertFinanceUniqueItem(
              prev,
              toFinanceCatalogProduct({
                id: line.id,
                name: line.name,
                price: line.unitPrice,
              }),
            ),
          );
        }}
      />
    </Stack>
  );
}
