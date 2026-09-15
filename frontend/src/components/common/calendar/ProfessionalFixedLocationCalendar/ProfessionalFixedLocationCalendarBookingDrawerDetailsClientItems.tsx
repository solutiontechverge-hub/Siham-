"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

import {
  Box,
  ButtonBase,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import BookingDrawerSelectedItemsSection from "../BookingDrawerSelectedItemsSection";

import {
  ACTIVITY_COMPARISON_SIGNPOST,
} from "../buildActivityComparison";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItemsBag = Pick<
  Vm,
  | "addMenuButtonRef"
  | "addMenuTarget"
  | "beginExistingBookingEdit"
  | "bookingUniqueItems"
  | "canEditBookingLineItems"
  | "canMutateDrawerContents"
  | "changeBookingServiceStaff"
  | "getServiceStaffOptions"
  | "incomingRequestEditMode"
  | "m"
  | "mainCancelledServices"
  | "openBookingStaffProfile"
  | "openDrawerLineTagComparison"
  | "openEditBookingProductLine"
  | "openEditBookingUniqueLine"
  | "openEditServiceFromLineItem"
  | "primaryMainClientServices"
  | "removeClientService"
  | "reorderClientServices"
  | "resolveBookingStaff"
  | "resolveProductEditTag"
  | "resolveServiceEditTag"
  | "resourceNameById"
  | "selectedProducts"
  | "setAddMenuTarget"
  | "setBookingUniqueItems"
  | "setProductSelectionDraft"
  | "setSelectedProducts"
  | "setSlotAddMenuAnchor"
  | "showLineItemRemoveButton"
  | "slotAddMenuAnchor"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItemsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsClientItems({
  bag,
}: Props) {
  const {
    addMenuButtonRef,
    addMenuTarget,
    beginExistingBookingEdit,
    bookingUniqueItems,
    canEditBookingLineItems,
    canMutateDrawerContents,
    changeBookingServiceStaff,
    getServiceStaffOptions,
    incomingRequestEditMode,
    m,
    mainCancelledServices,
    openBookingStaffProfile,
    openDrawerLineTagComparison,
    openEditBookingProductLine,
    openEditBookingUniqueLine,
    openEditServiceFromLineItem,
    primaryMainClientServices,
    removeClientService,
    reorderClientServices,
    resolveBookingStaff,
    resolveProductEditTag,
    resolveServiceEditTag,
    resourceNameById,
    selectedProducts,
    setAddMenuTarget,
    setBookingUniqueItems,
    setProductSelectionDraft,
    setSelectedProducts,
    setSlotAddMenuAnchor,
    showLineItemRemoveButton,
    slotAddMenuAnchor,
  } = bag;

  return (
    <>
      <BookingDrawerSelectedItemsSection
        nested
        services={primaryMainClientServices}
        products={selectedProducts}
        uniqueItems={bookingUniqueItems}
        cancelledServices={mainCancelledServices}
        showRemoveButtons={showLineItemRemoveButton}
        onReorderServices={
          showLineItemRemoveButton ? reorderClientServices : undefined
        }
        resolveStaffName={(staffResourceId) =>
          staffResourceId
            ? resourceNameById.get(staffResourceId)
            : undefined
        }
        resolveStaff={resolveBookingStaff}
        onStaffClick={openBookingStaffProfile}
        staffOptionsForService={
          canEditBookingLineItems ? getServiceStaffOptions : undefined
        }
        onStaffChange={
          canEditBookingLineItems ? changeBookingServiceStaff : undefined
        }
        resolveServiceEditTag={resolveServiceEditTag}
        resolveProductEditTag={resolveProductEditTag}
        editTagSignpostTitle={ACTIVITY_COMPARISON_SIGNPOST}
        onEditTagSignpostClick={openDrawerLineTagComparison}
        onRemoveService={removeClientService}
        onRemoveProduct={(productId) => {
          setSelectedProducts((prev) =>
            prev.filter((item) => item.id !== productId),
          );
          setProductSelectionDraft((prev) => {
            if (!prev[productId]) return prev;
            return {
              ...prev,
              [productId]: {
                ...prev[productId],
                selected: false,
              },
            };
          });
        }}
        onRemoveUniqueItem={(itemId) => {
          setBookingUniqueItems((prev) =>
            prev.filter((item) => item.id !== itemId),
          );
        }}
        onEditProduct={
          canEditBookingLineItems
            ? (product) => {
                beginExistingBookingEdit();
                openEditBookingProductLine(product, "client");
              }
            : undefined
        }
        onEditUniqueItem={
          canEditBookingLineItems
            ? (item) => {
                beginExistingBookingEdit();
                openEditBookingUniqueLine(item, "client");
              }
            : undefined
        }
        onEditService={
          canEditBookingLineItems
            ? (service) => {
                beginExistingBookingEdit();
                openEditServiceFromLineItem(service, "client");
              }
            : undefined
        }
        onServiceClick={
          incomingRequestEditMode
            ? (service) => {
                openEditServiceFromLineItem(service, "client");
              }
            : undefined
        }
      />

      {/* Guest / model / buffer stay in the drawer footer, not beside Add. */}
      {canMutateDrawerContents ? (
        <ButtonBase
          ref={addMenuButtonRef}
          onClick={(e) => {
            const el = e.currentTarget;
            if (slotAddMenuAnchor && addMenuTarget === "client") {
              setSlotAddMenuAnchor(null);
              return;
            }
            setAddMenuTarget("client");
            setSlotAddMenuAnchor(el);
          }}
          aria-label="Add menu"
          sx={{
            width: "100%",
            maxWidth: 220,
            border: `1px solid ${alpha(m.navy, 0.14)}`,
            borderRadius: "10px",
            height: 44,
            px: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.25,
            bgcolor: "#fff",
            textAlign: "left",
            transition: "border-color 0.15s, background-color 0.15s",
            "&:hover": {
              bgcolor: alpha(m.navy, 0.02),
              borderColor: m.teal,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "999px",
                bgcolor: m.addSoftBg,
                color: m.addSoftFg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${alpha(m.teal, 0.22)}`,
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
            <BodyText
              component="span"
              sx={{
                ...mollureLabelSx(m.navy),
                lineHeight: 1,
              }}
            >
              Add
            </BodyText>
          </Box>
          <KeyboardArrowDownRoundedIcon
            sx={{
              fontSize: 18,
              color:
                slotAddMenuAnchor && addMenuTarget === "client"
                  ? m.teal
                  : alpha(m.navy, 0.45),
              flexShrink: 0,
              transform:
                slotAddMenuAnchor && addMenuTarget === "client"
                  ? "rotate(180deg)"
                  : "none",
              transition: "transform 0.15s, color 0.15s",
            }}
          />
        </ButtonBase>
      ) : null}
    </>
  );
}
