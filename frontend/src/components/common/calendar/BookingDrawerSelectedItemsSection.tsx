"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { getEffectiveServicePrice, type BookingServiceLineItem } from "../../../data/bookingServiceEdit.data";
import { formatProductLineName } from "../../../data/bookingProductCatalog.data";
import BookingEditedTag from "./BookingEditedTag";
import type { BookingEditTagVariant } from "./bookingRequestNegotiation";

type SelectedProductItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
};

type BookingDrawerSelectedItemsSectionProps = {
  services: readonly BookingServiceLineItem[];
  products: readonly SelectedProductItem[];
  showRemoveButtons?: boolean;
  resolveServiceEditTag?: (serviceId: string) => BookingEditTagVariant | null;
  onRemoveService?: (serviceId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  onServiceClick?: (service: BookingServiceLineItem) => void;
};

export default function BookingDrawerSelectedItemsSection({
  services,
  products,
  showRemoveButtons = false,
  resolveServiceEditTag,
  onRemoveService,
  onRemoveProduct,
  onServiceClick,
}: BookingDrawerSelectedItemsSectionProps) {
  const m = useTheme().palette.mollure;

  if (!services.length && !products.length) return null;

  const rowSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.12)}`,
    px: 1.25,
    minHeight: 44,
    bgcolor: "#fff",
  };

  return (
    <Stack spacing={0.75}>
      {services.map((service) => {
        const editTag = resolveServiceEditTag?.(service.id) ?? null;

        return (
          <Box
            key={`service-${service.id}`}
            onClick={() => onServiceClick?.(service)}
            sx={{
              ...rowSx,
              py: editTag ? 1 : 0,
              cursor: onServiceClick ? "pointer" : "default",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
                {service.name}
              </BodyText>
              {editTag ? (
                <Box sx={{ mt: 0.5 }}>
                  <BookingEditedTag variant={editTag} />
                </Box>
              ) : null}
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
              <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
                €{getEffectiveServicePrice(service)}
              </BodyText>
              {showRemoveButtons ? (
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveService?.(service.id);
                  }}
                  sx={{ color: alpha(m.navy, 0.35) }}
                  aria-label={`Remove ${service.name}`}
                >
                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              ) : null}
            </Stack>
          </Box>
        );
      })}

      {products.map((product) => (
        <Box key={`product-${product.id}`} sx={rowSx}>
          <BodyText sx={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.82), lineHeight: 1.25 }}>
            {formatProductLineName(product.name, product.quantity)}
          </BodyText>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.55) }}>
              €{product.price.toFixed(2)}
            </BodyText>
            {showRemoveButtons ? (
              <IconButton
                size="small"
                onClick={() => onRemoveProduct?.(product.id)}
                sx={{ color: alpha(m.navy, 0.35) }}
                aria-label={`Remove ${product.name}`}
              >
                <CloseRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            ) : null}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
