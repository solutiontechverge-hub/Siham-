"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import {
  ServiceSummaryMetaLine,
  type ServiceSummaryStaffOption,
} from "../ServiceSummaryMetaLine";
import {
  getEffectiveServicePrice,
  formatServiceTimeRange,
  type BookingServiceLineItem,
} from "../../../data/bookingServiceEdit.data";
import {
  formatLineDiscountLabel,
  type BookingLineDiscount,
} from "../../../data/bookingLinePricing";
import { BookingChangeTags } from "./BookingEditedTag";
import BookingLineAmount from "./BookingLineAmount";
import type {
  BookingEditTagResult,
  BookingEditTagVariant,
} from "./bookingRequestNegotiation";
import { normalizeBookingEditTags } from "./bookingRequestNegotiation";

type SelectedProductItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
};

export type BookingDrawerStaffInfo = {
  name?: string;
  photoSrc?: string | null;
  avatarText?: string;
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
  /** Richer staff lookup (photo + initials). Falls back to resolveStaffName. */
  resolveStaff?: (staffResourceId?: string) => BookingDrawerStaffInfo | undefined;
  /** Open team member profile / details when avatar/name is clicked. */
  onStaffClick?: (staffResourceId: string) => void;
  /** Available team members for a service (by availability). */
  staffOptionsForService?: (
    service: BookingServiceLineItem,
  ) => readonly ServiceSummaryStaffOption[];
  /** Persist reassignment from the service-card dropdown. */
  onStaffChange?: (serviceId: string, staffResourceId: string) => void;
  resolveServiceEditTag?: (serviceId: string) => BookingEditTagResult;
  resolveProductEditTag?: (productId: string) => BookingEditTagResult;
  editTagSignpostTitle?: string;
  onEditTagSignpostClick?: () => void;
  onRemoveService?: (serviceId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  onRemoveUniqueItem?: (itemId: string) => void;
  onServiceClick?: (service: BookingServiceLineItem) => void;
  /** Hover edit icon → Edit Service screen (client + guest). */
  onEditService?: (service: BookingServiceLineItem) => void;
  /** Reorder services inside this container when more than one is present. */
  onReorderServices?: (fromId: string, toId: string) => void;
  /** Booking-scoped edit (does not mutate the master catalog). */
  onEditProduct?: (product: SelectedProductItem) => void;
  onEditUniqueItem?: (item: SelectedProductItem) => void;
};

function serviceStaffId(service: BookingServiceLineItem) {
  return String(
    service.staffResourceId ||
      service.teamMemberId ||
      "",
  ).trim();
}

function firstName(value: string | undefined) {
  return value?.trim() || "";
}

export default function BookingDrawerSelectedItemsSection({
  services,
  products,
  uniqueItems = [],
  cancelledServices = [],
  nested = false,
  showRemoveButtons = false,
  resolveStaffName,
  resolveStaff,
  onStaffClick,
  staffOptionsForService,
  onStaffChange,
  resolveServiceEditTag,
  resolveProductEditTag,
  editTagSignpostTitle,
  onEditTagSignpostClick,
  onRemoveService,
  onRemoveProduct,
  onRemoveUniqueItem,
  onServiceClick,
  onEditService,
  onEditProduct,
  onEditUniqueItem,
  onReorderServices,
}: BookingDrawerSelectedItemsSectionProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const primaryLight = theme.palette.secondary.main;
  const [draggingServiceId, setDraggingServiceId] = React.useState<string | null>(
    null,
  );
  const didDragServiceRef = React.useRef(false);
  const canReorderServices =
    Boolean(onReorderServices) && services.length > 1;

  const resolveServiceStaff = (service: BookingServiceLineItem) => {
    const staffId = serviceStaffId(service);
    const fromResolve = staffId ? resolveStaff?.(staffId) : undefined;
    const nameFromMap = staffId ? resolveStaffName?.(staffId)?.trim() : "";
    const displayName =
      firstName(fromResolve?.name) ||
      firstName(nameFromMap) ||
      firstName(service.teamMemberName ?? undefined) ||
      (staffId ? "" : "Unassigned") ||
      "Unassigned";
    return {
      staffId,
      staffName: displayName,
      staffPhotoSrc: fromResolve?.photoSrc,
      staffInitials: fromResolve?.avatarText,
      onStaffClick:
        staffId && onStaffClick
          ? () => onStaffClick(staffId)
          : undefined,
    };
  };

  if (!services.length && !products.length && !uniqueItems.length && !cancelledServices.length)
    return null;

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.12)}`,
    px: 1.5,
    py: 1.15,
    bgcolor: nested ? "#fff" : primaryLight,
    // Keep hover-reveal on the card, not the IconButton — MUI button `sx`
    // opacity otherwise wins over `&:hover .class` and the pencil never shows.
    "& .booking-line-edit-btn": {
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 0.15s, color 0.15s, background-color 0.15s",
    },
    "&:hover .booking-line-edit-btn, &:focus-within .booking-line-edit-btn": {
      opacity: 1,
      pointerEvents: "auto",
    },
  };

  const renderHoverEditButton = (
    label: string,
    onEdit: () => void,
  ) => (
    <IconButton
      className="booking-line-edit-btn"
      size="small"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onEdit();
      }}
      sx={{
        color: alpha(m.navy, 0.42),
        "&:hover": {
          color: m.teal,
          bgcolor: alpha(m.teal, 0.08),
        },
      }}
      aria-label={`Edit ${label}`}
    >
      <EditRoundedIcon sx={{ fontSize: 17 }} />
    </IconButton>
  );

  return (
    <Stack spacing={nested ? 1 : 1.5}>
      {services.length > 0 || cancelledServices.length > 0 ? (
        <Stack spacing={0.75}>
          <BodyText
            sx={mollureLabelSx(m.navy)}
          >
            Service
          </BodyText>
          {services.map((service) => {
            const editTags = normalizeBookingEditTags(
              resolveServiceEditTag?.(service.id),
            );
            const staff = resolveServiceStaff(service);

            return (
              <Box
                key={`service-${service.id}-${service.guestId ?? ""}-${service.startTime ?? ""}`}
                draggable={canReorderServices}
                onDragStart={(event) => {
                  if (!canReorderServices) return;
                  didDragServiceRef.current = true;
                  setDraggingServiceId(service.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", service.id);
                }}
                onDragEnd={() => {
                  setDraggingServiceId(null);
                  window.setTimeout(() => {
                    didDragServiceRef.current = false;
                  }, 0);
                }}
                onDragOver={(event) => {
                  if (!canReorderServices) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  if (!canReorderServices || !draggingServiceId) return;
                  event.preventDefault();
                  event.stopPropagation();
                  onReorderServices?.(draggingServiceId, service.id);
                  setDraggingServiceId(null);
                }}
                onClick={() => {
                  if (didDragServiceRef.current) return;
                  onServiceClick?.(service);
                }}
                sx={{
                  ...cardSx,
                  cursor: canReorderServices
                    ? draggingServiceId === service.id
                      ? "grabbing"
                      : "grab"
                    : onServiceClick
                      ? "pointer"
                      : "default",
                  opacity: draggingServiceId === service.id ? 0.55 : 1,
                  outline:
                    draggingServiceId && draggingServiceId !== service.id
                      ? `2px dashed ${alpha(m.teal, 0.45)}`
                      : "none",
                  outlineOffset: 2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.25}
                >
                  {canReorderServices ? (
                    <Box
                      sx={{
                        display: "flex",
                        color: alpha(m.navy, 0.35),
                        flexShrink: 0,
                      }}
                      aria-hidden
                    >
                      <DragIndicatorRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  ) : null}
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
                      timeRange={formatServiceTimeRange(
                        service.startTime,
                        service.endTime,
                      )}
                      durationLabel={`${service.durationMins} Mins`}
                      staffName={staff.staffName}
                      staffId={staff.staffId || undefined}
                      staffPhotoSrc={staff.staffPhotoSrc}
                      staffInitials={staff.staffInitials}
                      onStaffClick={staff.onStaffClick}
                      staffOptions={staffOptionsForService?.(service)}
                      onStaffChange={
                        onStaffChange
                          ? (nextId) => onStaffChange(service.id, nextId)
                          : undefined
                      }
                    />
                    {editTags.length ? (
                      <BookingChangeTags
                        variants={editTags}
                        signpostTitle={editTagSignpostTitle}
                        onSignpostClick={onEditTagSignpostClick}
                      />
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
                    {onEditService
                      ? renderHoverEditButton(service.name, () =>
                          onEditService(service),
                        )
                      : null}
                    {showRemoveButtons ? (
                      <IconButton
                        size="small"
                        onMouseDown={(event) => event.stopPropagation()}
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
            const staffName =
              resolveStaffName?.(
                service.staffResourceId ||
                  (service as { teamMemberId?: string }).teamMemberId,
              )?.trim() || "Unassigned";
            const cancelledTags = normalizeBookingEditTags(
              resolveServiceEditTag?.(service.id),
            );
            const tags = cancelledTags.length
              ? cancelledTags
              : (["cancelled"] as BookingEditTagVariant[]);
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
                      timeRange={formatServiceTimeRange(
                        service.startTime,
                        service.endTime,
                      )}
                      durationLabel={`${service.durationMins} Mins`}
                      staffName={staffName}
                    />
                    <BookingChangeTags
                      variants={tags}
                      signpostTitle={editTagSignpostTitle}
                      onSignpostClick={onEditTagSignpostClick}
                    />
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
            sx={mollureLabelSx(m.navy)}
          >
            Product
          </BodyText>
          {products.map((product, productIndex) => {
            const editTags = normalizeBookingEditTags(
              resolveProductEditTag?.(product.id),
            );
            return (
            <Box
              key={`product-${product.id}-${productIndex}`}
              sx={cardSx}
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
                  {editTags.length ? (
                    <BookingChangeTags
                      variants={editTags}
                      signpostTitle={editTagSignpostTitle}
                      onSignpostClick={onEditTagSignpostClick}
                    />
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
                  {onEditProduct
                    ? renderHoverEditButton(product.name, () =>
                        onEditProduct(product),
                      )
                    : null}
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
            sx={mollureLabelSx(m.navy)}
          >
            Unique item
          </BodyText>
          {uniqueItems.map((item, itemIndex) => {
            const editTags = normalizeBookingEditTags(
              resolveProductEditTag?.(item.id),
            );
            return (
            <Box key={`unique-${item.id}-${itemIndex}`} sx={cardSx}>
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
                  {editTags.length ? (
                    <BookingChangeTags
                      variants={editTags}
                      signpostTitle={editTagSignpostTitle}
                      onSignpostClick={onEditTagSignpostClick}
                    />
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
                  {onEditUniqueItem
                    ? renderHoverEditButton(item.name, () =>
                        onEditUniqueItem(item),
                      )
                    : null}
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
