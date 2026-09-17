"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, ButtonBase, Checkbox, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../AppSearchField";
import QtyStepper from "../QtyStepper";
import { BodyText } from "../../ui/typography";
import { bookingScreenTitleSx } from "./calendar.utils";
import {
  formatProductUnitPrice,
  type BookingCatalogProduct,
  type BookingProductSelectionDraft,
} from "../../../data/bookingProductCatalog.data";

type BookingSelectProductsScreenProps = {
  draft: BookingProductSelectionDraft;
  /** Professional product list from finance settings. */
  catalog?: readonly BookingCatalogProduct[];
  customProducts?: readonly BookingCatalogProduct[];
  onToggle: (product: BookingCatalogProduct) => void;
  onQuantityChange: (productId: string, delta: number) => void;
  onAddProduct?: () => void;
  disabled?: boolean;
  heading?: string;
  searchPlaceholder?: string;
  addButtonLabel?: string;
};

function ProductRow({
  product,
  draft,
  disabled,
  onToggle,
  onQuantityChange,
}: {
  product: BookingCatalogProduct;
  draft: BookingProductSelectionDraft;
  disabled: boolean;
  onToggle: (product: BookingCatalogProduct) => void;
  onQuantityChange: (productId: string, delta: number) => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const item = draft[product.id] ?? { selected: false, quantity: 1 };
  const checked = item.selected;
  const qty = item.quantity;

  return (
    <Box
      sx={{
        width: "100%",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        borderRadius: "10px",
        px: 1.25,
        py: 1.1,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        component="button"
        type="button"
        disabled={disabled}
        onClick={() => onToggle(product)}
        sx={{
          flex: 1,
          minWidth: 0,
          border: 0,
          p: 0,
          bgcolor: "transparent",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <BodyText
          sx={{
            ...mollureLabelSx(m.navy),
            lineHeight: 1.25,
          }}
        >
          {qty > 1 ? `${product.name} x${qty}` : product.name}
        </BodyText>
        <BodyText
          sx={{
            mt: 0.35,
            fontSize: 11.5,
            fontWeight: 700,
            color: alpha(m.navy, 0.48),
            lineHeight: 1.2,
          }}
        >
          {formatProductUnitPrice(product.price)}
        </BodyText>
      </Box>

      <QtyStepper
        value={qty}
        onDecrement={() => onQuantityChange(product.id, -1)}
        onIncrement={() => onQuantityChange(product.id, 1)}
        decrementDisabled={disabled || !checked || qty <= 1}
        incrementDisabled={disabled || !checked}
      />

      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(product)}
        sx={{
          p: 0.25,
          color: alpha(m.navy, 0.28),
          "&.Mui-checked": { color: m.teal },
        }}
      />
    </Box>
  );
}

export default function BookingSelectProductsScreen({
  draft,
  catalog = [],
  customProducts = [],
  onToggle,
  onQuantityChange,
  onAddProduct,
  disabled = false,
  heading = "Select Product",
  searchPlaceholder = "Search products...",
  addButtonLabel = "Add Product",
}: BookingSelectProductsScreenProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [query, setQuery] = React.useState("");

  const allProducts = React.useMemo(
    () => [...catalog, ...customProducts],
    [catalog, customProducts],
  );

  const filteredProducts = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(q),
    );
  }, [allProducts, query]);

  return (
    <Stack spacing={1.5}>
      <BodyText sx={bookingScreenTitleSx(m.navy)}>
        {heading}
      </BodyText>

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

      <Stack spacing={0.75}>
        {filteredProducts.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            draft={draft}
            disabled={disabled}
            onToggle={onToggle}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </Stack>

      {onAddProduct ? (
        <ButtonBase
          disabled={disabled}
          onClick={onAddProduct}
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
            "&.Mui-disabled": { opacity: 0.55 },
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
            sx={mollureLabelSx(m.navy, { color: alpha(m.navy, 0.6), lineHeight: 1 })}
          >
            {addButtonLabel}
          </BodyText>
        </ButtonBase>
      ) : null}
    </Stack>
  );
}
