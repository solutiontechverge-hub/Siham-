"use client";

import {
  mollureBodyMutedSx,
  mollureBodySx,
  mollureLabelSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import AppButton from "../../common/AppButton";
import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import AppSearchField from "../../common/AppSearchField";
import MollureFormField from "../../common/MollureFormField";
import { BodyText } from "../../ui/typography";
import {
  STEPS,
  formatEurAmount,
  formatManualEntryDiscountLabel,
  selectionLabel,
} from "./manualEntry.data";
import ManualEntryCatalogDrawer, {
  ManualEntryCatalogOpenButton,
} from "./ManualEntryCatalogDrawer";
import ManualEntryDiscountModal from "./ManualEntryDiscountModal";
import ManualEntryLineCard from "./ManualEntryLineCard";
import ManualEntryLineEditModal from "./ManualEntryLineEditModal";
import ManualEntryUniqueItemModal from "./ManualEntryUniqueItemModal";
import {
  useManualEntryDrawer,
  type ManualEntryDrawerProps,
} from "./useManualEntryDrawer";

export type { ManualEntryDrawerProps } from "./useManualEntryDrawer";
export type { ManualEntryStep } from "./useManualEntryDrawer";

export default function ManualEntryDrawer({
  open,
  onClose,
  onSave,
}: ManualEntryDrawerProps) {
  const m = useTheme().palette.mollure;
  const {
    rootRef,
    step,
    goBack,
    clientOpen,
    setClientOpen,
    clientMode,
    setClientMode,
    clientQuery,
    setClientQuery,
    clientSelection,
    lines,
    discount,
    setDiscount,
    discountModalOpen,
    setDiscountModalOpen,
    editingLine,
    setEditingLine,
    paymentMethod,
    setPaymentMethod,
    guestEmail,
    guestName,
    uniqueItemOpen,
    setUniqueItemOpen,
    productDrawerOpen,
    setProductDrawerOpen,
    itemDrawerOpen,
    setItemDrawerOpen,
    guestContactError,
    productOptions,
    resolvedItemOptions,
    handleAddProductOption,
    handleDeleteProductOption,
    handleAddItemOption,
    handleDeleteItemOption,
    isDeletableItemOption,
    handleUpdateProductOption,
    handleUpdateItemOption,
    productLines,
    itemLines,
    subtotal,
    discountAmount,
    totalPrice,
    hasItems,
    listResults,
    platformResults,
    displayClient,
    pickGuest,
    canNext,
    handlePrimary,
    pickListClient,
    pickPlatformClient,
    addLinesFromCatalog,
    removeLine,
    updateLine,
    handleGuestNameChange,
    handleGuestEmailChange,
    handleUniqueItemSave,
  } = useManualEntryDrawer({ open, onSave });

  const modeRowSx = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.75,
    py: 1.15,
    cursor: "pointer",
    bgcolor: active ? alpha(m.teal, 0.06) : "#fff",
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    "&:hover": { bgcolor: alpha(m.navy, 0.02) },
  });

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={`New Sales — ${STEPS[step]}`}
      contentVariant="muted"
      footer={
        <FinanceDrawerActionsFooter
          onCancel={step === 0 ? onClose : goBack}
          cancelLabel={step === 0 ? "Cancel" : "Back"}
          primaryLabel={step < 3 ? "Next" : "Finalize checkout"}
          primaryDisabled={step < 3 ? !canNext : !clientSelection || !hasItems}
          onPrimary={handlePrimary}
        />
      }
    >
      <Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
        {STEPS.map((label, idx) => (
          <Chip
            key={label}
            label={label}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: 10.5,
              bgcolor: idx === step ? alpha(m.teal, 0.12) : alpha(m.navy, 0.04),
              color: idx === step ? m.teal : alpha(m.navy, 0.45),
            }}
          />
        ))}
      </Stack>

      <Stack spacing={2.5}>
        {step === 0 ? (
          <Box ref={rootRef}>
            <BodyText
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Client
            </BodyText>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setClientOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setClientOpen((prev) => !prev);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 1.1,
                borderRadius: "10px",
                border: `1px solid ${clientOpen || clientSelection ? m.teal : alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
                cursor: "pointer",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: clientSelection
                    ? alpha(m.navy, 0.78)
                    : alpha(m.navy, 0.45),
                }}
              >
                {displayClient}
              </Typography>
              <ExpandMoreRoundedIcon
                sx={{
                  fontSize: 20,
                  color: alpha(m.navy, 0.45),
                  transform: clientOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            </Box>

            {clientOpen ? (
              <Paper
                elevation={0}
                sx={{
                  mt: 1,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  boxShadow: "0 10px 22px rgba(16, 35, 63, 0.06)",
                  overflow: "hidden",
                }}
              >
                <Box
                  onClick={() => {
                    setClientMode("list");
                    setClientQuery("");
                  }}
                  sx={modeRowSx(clientMode === "list")}
                >
                  <SearchRoundedIcon
                    sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.78),
                    }}
                  >
                    Search from Client list by name
                  </Typography>
                </Box>
                <Box
                  onClick={() => {
                    setClientMode("platform");
                    setClientQuery("");
                  }}
                  sx={modeRowSx(clientMode === "platform")}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.78),
                      pl: 3.25,
                    }}
                  >
                    Search on Mollure platform by email
                  </Typography>
                </Box>
                <Box
                  onClick={pickGuest}
                  sx={{ ...modeRowSx(clientMode === "guest"), borderBottom: 0 }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.78),
                      pl: 3.25,
                    }}
                  >
                    Guest
                  </Typography>
                </Box>

                {clientMode === "list" ? (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      bgcolor: alpha(m.navy, 0.02),
                      borderTop: `1px solid ${alpha(m.navy, 0.06)}`,
                    }}
                  >
                    <AppSearchField
                      fullWidth
                      placeholder="Search by name"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      onClear={() => setClientQuery("")}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                        },
                      }}
                    />
                    {listResults.map((client) => (
                      <Box
                        key={client.id}
                        onClick={() => pickListClient(client)}
                        sx={{
                          mt: 1,
                          px: 1.25,
                          py: 1,
                          borderRadius: "8px",
                          cursor: "pointer",
                          bgcolor: "#fff",
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          "&:hover": { bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                        >
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.86),
                              lineHeight: 1.2,
                            }}
                          >
                            {client.name}
                          </Typography>
                          {client.tags.includes("Mollure") ? (
                            <Chip
                              label="Mollure"
                              size="small"
                              sx={{
                                height: 16,
                                borderRadius: "999px",
                                fontWeight: 700,
                                bgcolor: alpha(m.teal, 0.12),
                                color: m.teal,
                                "& .MuiChip-label": {
                                  fontSize: 9,
                                  px: 0.65,
                                  py: 0,
                                  lineHeight: 1.2,
                                },
                              }}
                            />
                          ) : null}
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.5),
                            mt: 0.25,
                          }}
                        >
                          {client.email}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}

                {clientMode === "platform" ? (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      bgcolor: alpha(m.navy, 0.02),
                      borderTop: `1px solid ${alpha(m.navy, 0.06)}`,
                    }}
                  >
                    <AppSearchField
                      fullWidth
                      placeholder="Search by email"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      onClear={() => setClientQuery("")}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                        },
                      }}
                    />
                    {platformResults.map((row) => (
                      <Box
                        key={row.id}
                        sx={{
                          mt: 1,
                          px: 1.25,
                          py: 1,
                          borderRadius: "8px",
                          bgcolor: "#fff",
                          border: `1px solid ${alpha(m.navy, 0.08)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            flexWrap="wrap"
                          >
                            <Typography
                              sx={{
                                fontSize: 13.5,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.86),
                                lineHeight: 1.2,
                              }}
                            >
                              {row.name}
                            </Typography>
                            <Chip
                              label="Mollure"
                              size="small"
                              sx={{
                                height: 16,
                                borderRadius: "999px",
                                fontWeight: 700,
                                bgcolor: alpha(m.teal, 0.12),
                                color: m.teal,
                                "& .MuiChip-label": {
                                  fontSize: 9,
                                  px: 0.65,
                                  py: 0,
                                  lineHeight: 1.2,
                                },
                              }}
                            />
                          </Stack>
                          <Typography
                            sx={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: alpha(m.navy, 0.5),
                              mt: 0.25,
                            }}
                          >
                            {row.email}
                          </Typography>
                        </Box>
                        <AppButton
                          tone="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            pickPlatformClient(row);
                          }}
                          sx={{
                            flexShrink: 0,
                            fontSize: 11,
                            height: 32,
                            px: 1.25,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Add To Client List
                        </AppButton>
                      </Box>
                    ))}
                  </Box>
                ) : null}
              </Paper>
            ) : null}
          </Box>
        ) : null}

        {clientSelection?.type === "guest" && step === 0 ? (
          <Stack spacing={1.5}>
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}
            >
              Provide at least a guest name or email to continue.
            </Typography>
            <MollureFormField
              label="Guest name"
              placeholder="Personalize guest name"
              value={guestName}
              onChange={(e) => handleGuestNameChange(e.target.value)}
              fullWidth
              size="small"
              error={
                guestContactError && !guestName.trim() && !guestEmail.trim()
              }
              helperText={
                guestContactError && !guestName.trim() && !guestEmail.trim()
                  ? "Enter a name or email"
                  : undefined
              }
            />
            <MollureFormField
              label="Guest email"
              placeholder="Email for invoice and receipt"
              value={guestEmail}
              onChange={(e) => handleGuestEmailChange(e.target.value)}
              fullWidth
              size="small"
              error={
                guestContactError && !guestName.trim() && !guestEmail.trim()
              }
            />
          </Stack>
        ) : null}

        {step === 1 ? (
          <Box>
            <BodyText
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: alpha(m.navy, 0.86),
                mb: 1.25,
              }}
            >
              Items
            </BodyText>

            <Stack spacing={2}>
              <Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    mb: 0.75,
                  }}
                >
                  Product
                </Typography>
                <Stack spacing={0.75}>
                  {productLines.map((line) => (
                    <ManualEntryLineCard
                      key={line.id}
                      line={line}
                      onEdit={() => setEditingLine(line)}
                      onDelete={() => removeLine(line.id)}
                    />
                  ))}
                  <ManualEntryCatalogOpenButton
                    label="Product"
                    onClick={() => setProductDrawerOpen(true)}
                  />
                </Stack>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    mb: 0.75,
                  }}
                >
                  Unique Item
                </Typography>
                <Stack spacing={0.75}>
                  {itemLines.map((line) => (
                    <ManualEntryLineCard
                      key={line.id}
                      line={line}
                      onEdit={() => setEditingLine(line)}
                      onDelete={() => removeLine(line.id)}
                    />
                  ))}
                  <ManualEntryCatalogOpenButton
                    label="Item"
                    onClick={() => setItemDrawerOpen(true)}
                  />
                  <AppButton
                    tone="secondary"
                    onClick={() => setUniqueItemOpen(true)}
                    sx={mollureLabelSx(m.navy, {
                      mt: 0.5,
                      color: m.teal,
                    })}
                  >
                    + Unique item
                  </AppButton>
                </Stack>
              </Box>

              {hasItems ? (
                <Box sx={{ pt: 0.5 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      alignItems="baseline"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                        }}
                      >
                        Subtotal:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        {formatEurAmount(subtotal)}
                      </Typography>
                    </Stack>

                    {discount && discount.amount > 0 ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography sx={mollureBodyMutedSx(m.navy)}>
                          Discount (
                          {discount.type === "fixed" ? "Fixed" : "Percentage"}):{" "}
                          {formatManualEntryDiscountLabel(discount)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.78),
                          }}
                        >
                          -{formatEurAmount(discountAmount)}
                        </Typography>
                      </Stack>
                    ) : null}

                    <AppButton
                      variant="text"
                      onClick={() => setDiscountModalOpen(true)}
                      sx={{
                        alignSelf: "flex-start",
                        p: 0,
                        minWidth: 0,
                        textTransform: "none",
                        ...mollureLabelSx(m.navy, { color: m.teal }),
                        textDecoration: "underline",
                        "&:hover": {
                          bgcolor: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {discount && discount.amount > 0
                        ? "Edit Discount"
                        : "+ Discount"}
                    </AppButton>

                    <Stack
                      direction="row"
                      alignItems="baseline"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ pt: 0.25 }}
                    >
                      <Typography sx={mollureBodyMutedSx(m.navy)}>
                        Final Price:
                      </Typography>
                      <Typography sx={mollurePageTitleSx(m.navy)}>
                        {formatEurAmount(totalPrice)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </Box>
        ) : null}

        {step === 2 ? (
          <Box>
            <BodyText
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: alpha(m.navy, 0.86),
                mb: 1,
              }}
            >
              Payment Method
            </BodyText>
            <Stack spacing={0.75}>
              {(
                [
                  { id: "onlineDirect", label: "Online direct" },
                  { id: "offlineDirect", label: "Offline direct" },
                ] as const
              ).map((option) => (
                <AppButton
                  tone="secondary"
                  key={option.id}
                  variant={
                    paymentMethod === option.id ? "contained" : "outlined"
                  }
                  disableElevation
                  onClick={() => setPaymentMethod(option.id)}
                  sx={{
                    justifyContent: "flex-start",
                    ...mollureBodySx(m.navy),
                    bgcolor: paymentMethod === option.id ? m.teal : "#fff",
                    color:
                      paymentMethod === option.id
                        ? "#fff"
                        : alpha(m.navy, 0.72),
                    "&:hover": {
                      bgcolor:
                        paymentMethod === option.id
                          ? m.tealDark
                          : alpha(m.navy, 0.02),
                    },
                  }}
                >
                  {option.label}
                </AppButton>
              ))}
            </Stack>
          </Box>
        ) : null}

        {step === 3 ? (
          <Stack spacing={1.25}>
            <BodyText sx={mollureLabelSx(m.navy)}>
              Final summary
            </BodyText>
            <Typography
              sx={mollureBodySx(m.navy, { color: alpha(m.navy, 0.65) })}
            >
              Client: {selectionLabel(clientSelection)}
            </Typography>
            <Typography
              sx={mollureBodySx(m.navy, { color: alpha(m.navy, 0.65) })}
            >
              Items: {lines.length} · Payment:{" "}
              {paymentMethod === "onlineDirect"
                ? "Online direct"
                : "Offline direct"}
            </Typography>
            <Typography sx={mollureSectionTitleSx(m.navy)}>
              Total: {formatEurAmount(totalPrice)}
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <ManualEntryCatalogDrawer
        open={productDrawerOpen}
        onClose={() => setProductDrawerOpen(false)}
        title="Select products"
        options={productOptions}
        emptyLabel="No products configured yet."
        withQuantity
        allowAddProduct
        addScreenTitle="Add Product"
        editScreenTitle="Edit Product"
        onUpdateOption={handleUpdateProductOption}
        onAddOption={handleAddProductOption}
        onDeleteOption={handleDeleteProductOption}
        onSave={(selected) => addLinesFromCatalog("product", selected)}
      />

      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        onClose={() => setItemDrawerOpen(false)}
        title="Select items"
        options={resolvedItemOptions}
        emptyLabel="No services configured yet."
        withQuantity
        allowAddProduct
        addProductLabel="Add Item"
        addScreenTitle="Add Unique Item"
        editScreenTitle="Edit Item"
        onUpdateOption={handleUpdateItemOption}
        onAddOption={handleAddItemOption}
        onDeleteOption={handleDeleteItemOption}
        isDeletable={isDeletableItemOption}
        onSave={(selected) => addLinesFromCatalog("item", selected)}
      />

      <ManualEntryUniqueItemModal
        open={uniqueItemOpen}
        onClose={() => setUniqueItemOpen(false)}
        onSave={handleUniqueItemSave}
      />

      <ManualEntryLineEditModal
        open={Boolean(editingLine)}
        line={editingLine}
        onClose={() => setEditingLine(null)}
        onSave={updateLine}
      />

      <ManualEntryDiscountModal
        open={discountModalOpen}
        initialValue={discount}
        onClose={() => setDiscountModalOpen(false)}
        onApply={setDiscount}
      />
    </AppDrawer>
  );
}
