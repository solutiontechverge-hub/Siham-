"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import {
  getEffectiveServicePrice,
  type BookingServiceLineItem,
} from "../../../data/bookingServiceEdit.data";
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
  uniqueItems?: readonly SelectedProductItem[];
  showRemoveButtons?: boolean;
  resolveStaffName?: (staffResourceId?: string) => string | undefined;
  resolveServiceEditTag?: (serviceId: string) => BookingEditTagVariant | null;
  onRemoveService?: (serviceId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  onRemoveUniqueItem?: (itemId: string) => void;
  onServiceClick?: (service: BookingServiceLineItem) => void;
};

function serviceTimeRange(service: BookingServiceLineItem) {
  if (service.startTime && service.endTime) {
    return `${service.startTime}–${service.endTime}`;
  }
  return undefined;
}

export default function BookingDrawerSelectedItemsSection({
  services,
  products,
  uniqueItems = [],
  showRemoveButtons = false,
  resolveStaffName,
  resolveServiceEditTag,
  onRemoveService,
  onRemoveProduct,
  onRemoveUniqueItem,
  onServiceClick,
}: BookingDrawerSelectedItemsSectionProps) {
  const m = useTheme().palette.mollure;

  if (!services.length && !products.length && !uniqueItems.length) return null;

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.12)}`,
    px: 1.5,
    py: 1.15,
    bgcolor: "#fff",
  };

  return (
    <Stack spacing={1.5}>
      {services.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Service
          </BodyText>
          {services.map((service) => {
            const editTag = resolveServiceEditTag?.(service.id) ?? null;
            const staffName = resolveStaffName?.(
              service.staffResourceId,
            )?.trim();
            const timeRange = serviceTimeRange(service);

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
                  alignItems="flex-start"
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
                    {staffName ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.45}
                        sx={{ mt: 0.45 }}
                      >
                        <PersonOutlineRoundedIcon
                          sx={{ fontSize: 14, color: alpha(m.navy, 0.4) }}
                        />
                        <BodyText
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.48),
                          }}
                        >
                          {staffName}
                        </BodyText>
                      </Stack>
                    ) : null}
                    <ServiceSummaryMetaLine
                      timeRange={timeRange}
                      durationLabel={`${service.durationMins} Mins`}
                    />
                    {editTag ? (
                      <Box sx={{ mt: 0.55 }}>
                        <BookingEditedTag variant={editTag} />
                      </Box>
                    ) : null}
                  </Box>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    spacing={0.35}
                    sx={{ flexShrink: 0 }}
                  >
                    <BodyText
                      sx={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      €{getEffectiveServicePrice(service)}
                    </BodyText>
                    {showRemoveButtons ? (
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveService?.(service.id);
                        }}
                        sx={{ color: alpha(m.navy, 0.35), mt: -0.35 }}
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
        </Stack>
      ) : null}

      {products.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Product
          </BodyText>
          {products.map((product) => (
            <Box key={`product-${product.id}`} sx={cardSx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
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
                </Box>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  spacing={0.35}
                  sx={{ flexShrink: 0 }}
                >
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.82),
                    }}
                  >
                    €{product.price.toFixed(2)}
                  </BodyText>
                  {showRemoveButtons ? (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveProduct?.(product.id)}
                      sx={{ color: alpha(m.navy, 0.35), mt: -0.35 }}
                      aria-label={`Remove ${product.name}`}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  ) : null}
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}

      {uniqueItems.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}
          >
            Unique Item
          </BodyText>
          {uniqueItems.map((item) => (
            <Box key={`unique-${item.id}`} sx={cardSx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
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
                </Box>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  spacing={0.35}
                  sx={{ flexShrink: 0 }}
                >
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.82),
                    }}
                  >
                    €{item.price.toFixed(2)}
                  </BodyText>
                  {showRemoveButtons ? (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveUniqueItem?.(item.id)}
                      sx={{ color: alpha(m.navy, 0.35), mt: -0.35 }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  ) : null}
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
