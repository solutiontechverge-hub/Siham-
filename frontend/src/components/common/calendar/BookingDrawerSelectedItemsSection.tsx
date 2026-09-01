"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import {
  getEffectiveServicePrice,
  type BookingServiceLineItem,
} from "../../../data/bookingServiceEdit.data";
import {
  formatLineDiscountLabel,
  type BookingLineDiscount,
} from "../../../data/bookingLinePricing";
import BookingEditedTag from "./BookingEditedTag";
import BookingLineAmount from "./BookingLineAmount";
import type { BookingEditTagVariant } from "./bookingRequestNegotiation";

type SelectedProductItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
};

type BookingDrawerSelectedItemsSectionProps = {
  services: readonly BookingServiceLineItem[];
  products: readonly SelectedProductItem[];
  uniqueItems?: readonly SelectedProductItem[];
  /** Display-only cancelled lines (after EBR accept). */
  cancelledServices?: readonly BookingServiceLineItem[];
  /** Nest inside a parent card (tighter spacing, white item rows). */
  nested?: boolean;
  showRemoveButtons?: boolean;
  resolveStaffName?: (staffResourceId?: string) => string | undefined;
  resolveServiceEditTag?: (serviceId: string) => BookingEditTagVariant | null;
  resolveProductEditTag?: (productId: string) => BookingEditTagVariant | null;
  onRemoveService?: (serviceId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  onRemoveUniqueItem?: (itemId: string) => void;
  onServiceClick?: (service: BookingServiceLineItem) => void;
};

export default function BookingDrawerSelectedItemsSection({
  services,
  products,
  uniqueItems = [],
  cancelledServices = [],
  nested = false,
  showRemoveButtons = false,
  resolveStaffName,
  resolveServiceEditTag,
  resolveProductEditTag,
  onRemoveService,
  onRemoveProduct,
  onRemoveUniqueItem,
  onServiceClick,
}: BookingDrawerSelectedItemsSectionProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const primaryLight = theme.palette.secondary.main;

  if (!services.length && !products.length && !uniqueItems.length && !cancelledServices.length)
    return null;

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.12)}`,
    px: 1.5,
    py: 1.15,
    bgcolor: nested ? "#fff" : primaryLight,
  };

  return (
    <Stack spacing={nested ? 1 : 1.5}>
      {services.length > 0 || cancelledServices.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Service
          </BodyText>
          {services.map((service) => {
            const editTag = resolveServiceEditTag?.(service.id) ?? null;
            const staffName = resolveStaffName?.(service.staffResourceId);

            return (
              <Box
                key={`service-${service.id}`}
                onClick={() => onServiceClick?.(service)}
                sx={{
                  ...cardSx,
                  cursor: onServiceClick ? "pointer" : "default",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.25}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <BodyText
                      sx={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.86),
                        lineHeight: 1.25,
                      }}
                    >
                      {service.name}
                    </BodyText>
                    <ServiceSummaryMetaLine
                      timeRange={
                        service.startTime
                          ? service.endTime
                            ? `${service.startTime}–${service.endTime}`
                            : service.startTime
                          : undefined
                      }
                      durationLabel={`${service.durationMins} Mins`}
                      staffName={staffName}
                    />
                    {editTag ? (
                      <Box sx={{ mt: 0.55 }}>
                        <BookingEditedTag variant={editTag} />
                      </Box>
                    ) : null}
                  </Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.35}
                    sx={{ flexShrink: 0 }}
                  >
                    <BookingLineAmount
                      amount={getEffectiveServicePrice(service)}
                      originalAmount={
                        service.discount?.amount ? service.price : undefined
                      }
                      discountLabel={formatLineDiscountLabel(service.discount)}
                    />
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
                </Stack>
              </Box>
            );
          })}
          {cancelledServices.map((service) => {
            const staffName = resolveStaffName?.(service.staffResourceId);
            return (
              <Box key={`cancelled-${service.id}`} sx={cardSx}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.25}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <BodyText
                      sx={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.86),
                        lineHeight: 1.25,
                      }}
                    >
                      {service.name}
                    </BodyText>
                    <ServiceSummaryMetaLine
                      timeRange={
                        service.startTime
                          ? service.endTime
                            ? `${service.startTime}–${service.endTime}`
                            : service.startTime
                          : undefined
                      }
                      durationLabel={`${service.durationMins} Mins`}
                      staffName={staffName}
                    />
                    <Box sx={{ mt: 0.55 }}>
                      <BookingEditedTag variant="cancelled" />
                    </Box>
                  </Box>
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.82),
                    }}
                  >
                    €{getEffectiveServicePrice(service)}
                  </BodyText>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : null}

      {products.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Product
          </BodyText>
          {products.map((product) => {
            const editTag = resolveProductEditTag?.(product.id) ?? null;
            return (
            <Box key={`product-${product.id}`} sx={cardSx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1.25}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.86),
                      lineHeight: 1.25,
                    }}
                  >
                    {product.name}
                  </BodyText>
                  <BodyText
                    sx={{
                      mt: 0.35,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.48),
                    }}
                  >
                    Qty {product.quantity} · €{product.unitPrice.toFixed(2)}{" "}
                    each
                  </BodyText>
                  {editTag ? (
                    <Box sx={{ mt: 0.55 }}>
                      <BookingEditedTag variant={editTag} />
                    </Box>
                  ) : null}
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.35}
                  sx={{ flexShrink: 0 }}
                >
                  <BookingLineAmount
                    amount={product.price}
                    originalAmount={product.originalPrice}
                    discountLabel={formatLineDiscountLabel(product.discount)}
                  />
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
              </Stack>
            </Box>
            );
          })}
        </Stack>
      ) : null}

      {uniqueItems.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Unique item
          </BodyText>
          {uniqueItems.map((item) => {
            const editTag = resolveProductEditTag?.(item.id) ?? null;
            return (
            <Box key={`unique-${item.id}`} sx={cardSx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1.25}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.86),
                      lineHeight: 1.25,
                    }}
                  >
                    {item.name}
                  </BodyText>
                  <BodyText
                    sx={{
                      mt: 0.35,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.48),
                    }}
                  >
                    Qty {item.quantity} · €{item.unitPrice.toFixed(2)} each
                  </BodyText>
                  {editTag ? (
                    <Box sx={{ mt: 0.55 }}>
                      <BookingEditedTag variant={editTag} />
                    </Box>
                  ) : null}
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.35}
                  sx={{ flexShrink: 0 }}
                >
                  <BookingLineAmount
                    amount={item.price}
                    originalAmount={item.originalPrice}
                    discountLabel={formatLineDiscountLabel(item.discount)}
                  />
                  {showRemoveButtons ? (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveUniqueItem?.(item.id)}
                      sx={{ color: alpha(m.navy, 0.35) }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  ) : null}
                </Stack>
              </Stack>
            </Box>
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}
