"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, ButtonBase, Checkbox, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../AppSearchField";
import { BodyText } from "../../ui/typography";
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
  onEdit?: (product: BookingCatalogProduct) => void;
  disabled?: boolean;
};

function ProductRow({
  product,
  draft,
  disabled,
  onToggle,
  onQuantityChange,
  onEdit,
}: {
  product: BookingCatalogProduct;
  draft: BookingProductSelectionDraft;
  disabled: boolean;
  onToggle: (product: BookingCatalogProduct) => void;
  onQuantityChange: (productId: string, delta: number) => void;
  onEdit?: (product: BookingCatalogProduct) => void;
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
            fontSize: 12.5,
            fontWeight: 900,
            color: alpha(m.navy, 0.82),
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

      {onEdit ? (
        <IconButton
          size="small"
          onClick={() => {
            if (disabled) return;
            onEdit(product);
          }}
          disabled={disabled}
          aria-label={`Edit ${product.name}`}
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

      <Stack
        direction="row"
        alignItems="center"
        sx={{
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          borderRadius: "8px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <IconButton
          size="small"
          disabled={disabled || !checked || qty <= 1}
          onClick={() => onQuantityChange(product.id, -1)}
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
          disabled={disabled || !checked}
          onClick={() => onQuantityChange(product.id, 1)}
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
  onEdit,
  disabled = false,
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
      <BodyText
        sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15 }}
      >
        Select Product
      </BodyText>

      <AppSearchField
        fullWidth
        placeholder="Search products..."
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
            onEdit={onEdit}
          />
        ))}

        <ButtonBase
          onClick={onAddProduct}
          disabled={disabled || !onAddProduct}
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
            "&:hover": { bgcolor: disabled ? "#fff" : alpha(m.navy, 0.02) },
            "&.Mui-disabled": {
              opacity: 0.55,
              cursor: "not-allowed",
            },
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
            Add Product
          </BodyText>
        </ButtonBase>
      </Stack>
    </Stack>
  );
}
