"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import MollureFormField from "../../common/MollureFormField";
import { BodyText } from "../../ui/typography";
import { useGetBusinessSetupQuery } from "../../../store/services/businessApi";
import { useFinanceInvoiceSettings } from "./useFinanceInvoiceSettings";
import {
  calculateManualEntryDiscountAmount,
  createManualEntryLineFromOption,
  filterClientsByName,
  filterMollureByEmail,
  formatEurAmount,
  formatManualEntryDiscountLabel,
  lineTotal,
  parseFinancePrice,
  selectionLabel,
  type ManualEntryCatalogOption,
  type ManualEntryClientMode,
  type ManualEntryClientSelection,
  type ManualEntryDiscount,
  type ManualEntryLine,
  type ManualEntryLineKind,
  type ManualEntrySavePayload,
} from "./manualEntry.data";
import ManualEntryCatalogDrawer, { ManualEntryCatalogOpenButton } from "./ManualEntryCatalogDrawer";
import ManualEntryDiscountModal from "./ManualEntryDiscountModal";
import ManualEntryLineCard from "./ManualEntryLineCard";
import ManualEntryLineEditModal from "./ManualEntryLineEditModal";
import ManualEntryUniqueItemModal from "./ManualEntryUniqueItemModal";

const STEPS = ["Client", "Items", "Payment", "Summary"] as const;
type ManualEntryStep = (typeof STEPS)[number];

export type ManualEntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSave?: (payload: ManualEntrySavePayload) => void;
};

export default function ManualEntryDrawer({ open, onClose, onSave }: ManualEntryDrawerProps) {
  const m = useTheme().palette.mollure;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { settings } = useFinanceInvoiceSettings();
  const { data: businessSetupResponse } = useGetBusinessSetupQuery(undefined, { skip: !open });
  const businessSetup = businessSetupResponse?.data ?? null;

  const [clientOpen, setClientOpen] = React.useState(false);
  const [clientMode, setClientMode] = React.useState<ManualEntryClientMode | null>(null);
  const [clientQuery, setClientQuery] = React.useState("");
  const [clientSelection, setClientSelection] = React.useState<ManualEntryClientSelection | null>(null);
  const [lines, setLines] = React.useState<ManualEntryLine[]>([]);
  const [discount, setDiscount] = React.useState<ManualEntryDiscount | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<"onlineDirect" | "offlineDirect">("offlineDirect");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [step, setStep] = React.useState(0);
  const [uniqueItemOpen, setUniqueItemOpen] = React.useState(false);
  const [productDrawerOpen, setProductDrawerOpen] = React.useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = React.useState(false);
  const [guestContactError, setGuestContactError] = React.useState(false);

  const hasGuestContact = Boolean(guestName.trim() || guestEmail.trim());
  const isGuestClientStepValid =
    clientSelection?.type !== "guest" || hasGuestContact;

  React.useEffect(() => {
    if (!open) return;
    setClientOpen(false);
    setClientMode(null);
    setClientQuery("");
    setClientSelection(null);
    setLines([]);
    setDiscount(null);
    setDiscountModalOpen(false);
    setEditingLine(null);
    setPaymentMethod("offlineDirect");
    setGuestEmail("");
    setGuestName("");
    setStep(0);
    setUniqueItemOpen(false);
    setProductDrawerOpen(false);
    setItemDrawerOpen(false);
    setGuestContactError(false);
  }, [open]);

  const productOptions = React.useMemo<ManualEntryCatalogOption[]>(
    () =>
      settings.products.map((product) => ({
        id: product.id,
        label: product.name,
        unitPrice: parseFinancePrice(product.price),
      })),
    [settings.products],
  );

  const itemOptions = React.useMemo<ManualEntryCatalogOption[]>(() => {
    const setupServices = businessSetup?.service_details ?? [];
    if (setupServices.length > 0) {
      return setupServices.map((service) => ({
        id: service.id,
        label: service.service_title || service.category_title || "Service",
        unitPrice: parseFinancePrice(String(service.price ?? "")),
      }));
    }

    return settings.services.map((service) => ({
      id: service.id,
      label: service.service ? `${service.category} - ${service.service}` : service.category,
      unitPrice: 0,
    }));
  }, [businessSetup?.service_details, settings.services]);

  const productLines = React.useMemo(() => lines.filter((l) => l.kind === "product"), [lines]);
  const itemLines = React.useMemo(() => lines.filter((l) => l.kind === "item"), [lines]);
  const subtotal = React.useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const discountAmount = React.useMemo(
    () => calculateManualEntryDiscountAmount(subtotal, discount),
    [discount, subtotal],
  );
  const totalPrice = Math.max(0, subtotal - discountAmount);
  const hasItems = lines.length > 0;

  React.useEffect(() => {
    if (!clientOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setClientOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [clientOpen]);

  const listResults = React.useMemo(
    () => (clientMode === "list" ? filterClientsByName(clientQuery) : []),
    [clientMode, clientQuery],
  );
  const platformResults = React.useMemo(
    () => (clientMode === "platform" ? filterMollureByEmail(clientQuery) : []),
    [clientMode, clientQuery],
  );

  const displayClient = selectionLabel(clientSelection) || "Search Client";

  const pickGuest = () => {
    setClientMode("guest");
    setClientSelection({ type: "guest", name: guestName || undefined });
    setClientOpen(false);
  };

  const canNext =
    (step === 0 && Boolean(clientSelection) && isGuestClientStepValid) ||
    (step === 1 && hasItems) ||
    step === 2;

  const handlePrimary = () => {
    if (step === 0 && clientSelection?.type === "guest" && !hasGuestContact) {
      setGuestContactError(true);
      return;
    }
    if (step < 3) {
      if (canNext) setStep((s) => s + 1);
      return;
    }
    if (!clientSelection || !hasItems) return;
    onSave?.({
      clientSelection:
        clientSelection.type === "guest"
          ? { type: "guest", name: guestName.trim() || clientSelection.name }
          : clientSelection,
      lines,
      totalPrice,
      discount,
      discountAmount,
      paymentMethod,
      guestEmail: clientSelection?.type === "guest" ? guestEmail : undefined,
      guestName: clientSelection?.type === "guest" ? guestName : undefined,
    });
  };

  const pickListClient = (client: (typeof listResults)[number]) => {
    setGuestEmail("");
    setGuestName("");
    setClientSelection({ type: "list", client });
    setClientOpen(false);
  };

  const pickPlatformClient = (client: (typeof platformResults)[number]) => {
    setGuestEmail("");
    setGuestName("");
    setClientSelection({ type: "platform", client });
    setClientOpen(false);
    setClientQuery("");
  };

  const addLinesFromCatalog = (kind: ManualEntryLineKind, options: ManualEntryCatalogOption[]) => {
    setLines((prev) => [...prev, ...options.map((option) => createManualEntryLineFromOption(kind, option))]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (next: ManualEntryLine) => {
    setLines((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  };

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
          onCancel={step === 0 ? onClose : () => setStep((s) => Math.max(0, s - 1))}
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
          <BodyText sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>Client</BodyText>
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
                color: clientSelection ? alpha(m.navy, 0.78) : alpha(m.navy, 0.45),
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
                <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78) }}>
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
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78), pl: 3.25 }}>
                  Search on Mollure platform by email
                </Typography>
              </Box>
              <Box onClick={pickGuest} sx={{ ...modeRowSx(clientMode === "guest"), borderBottom: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78), pl: 3.25 }}>
                  Guest
                </Typography>
              </Box>

              {clientMode === "list" ? (
                <Box sx={{ px: 1.5, py: 1.25, bgcolor: alpha(m.navy, 0.02), borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                  <MollureFormField
                    placeholder="Search by name"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                    InputProps={{
                      endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
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
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                          {client.name}
                        </Typography>
                        {client.tags.includes("Mollure") ? (
                          <Chip
                            label="Mollure"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                            }}
                          />
                        ) : null}
                      </Stack>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                        {client.email}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {clientMode === "platform" ? (
                <Box sx={{ px: 1.5, py: 1.25, bgcolor: alpha(m.navy, 0.02), borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                  <MollureFormField
                    placeholder="Search by email"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                    InputProps={{
                      endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
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
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                            {row.name}
                          </Typography>
                          <Chip
                            label="Mollure"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                          {row.email}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        disableElevation
                        onClick={(e) => {
                          e.stopPropagation();
                          pickPlatformClient(row);
                        }}
                        sx={{
                          flexShrink: 0,
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 800,
                          fontSize: 11,
                          bgcolor: m.teal,
                          "&:hover": { bgcolor: m.tealDark },
                          height: 32,
                          px: 1.25,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Add To Client List
                      </Button>
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
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
              Provide at least a guest name or email to continue.
            </Typography>
            <MollureFormField
              label="Guest name"
              placeholder="Personalize guest name"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setGuestContactError(false);
                setClientSelection({ type: "guest", name: e.target.value });
              }}
              fullWidth
              size="small"
              error={guestContactError && !guestName.trim() && !guestEmail.trim()}
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
              onChange={(e) => {
                setGuestEmail(e.target.value);
                setGuestContactError(false);
              }}
              fullWidth
              size="small"
              error={guestContactError && !guestName.trim() && !guestEmail.trim()}
            />
          </Stack>
        ) : null}

        {step === 1 ? (
        <Box>
          <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86), mb: 1.25 }}>Items</BodyText>

          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
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
                <ManualEntryCatalogOpenButton label="Product" onClick={() => setProductDrawerOpen(true)} />
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
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
                <ManualEntryCatalogOpenButton label="Item" onClick={() => setItemDrawerOpen(true)} />
                <Button
                  variant="outlined"
                  onClick={() => setUniqueItemOpen(true)}
                  sx={{
                    mt: 0.5,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: 12.5,
                    borderColor: alpha(m.navy, 0.14),
                    color: m.teal,
                  }}
                >
                  + Unique item
                </Button>
              </Stack>
            </Box>

            {hasItems ? (
              <Box sx={{ pt: 0.5 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                      Subtotal:
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                      {formatEurAmount(subtotal)}
                    </Typography>
                  </Stack>

                  {discount && discount.amount > 0 ? (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                        Discount ({discount.type === "fixed" ? "Fixed" : "Percentage"}):{" "}
                        {formatManualEntryDiscountLabel(discount)}
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                        -{formatEurAmount(discountAmount)}
                      </Typography>
                    </Stack>
                  ) : null}

                  <Button
                    variant="text"
                    onClick={() => setDiscountModalOpen(true)}
                    sx={{
                      alignSelf: "flex-start",
                      p: 0,
                      minWidth: 0,
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: 12.5,
                      color: m.teal,
                      textDecoration: "underline",
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    {discount && discount.amount > 0 ? "Edit Discount" : "+ Discount"}
                  </Button>

                  <Stack
                    direction="row"
                    alignItems="baseline"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ pt: 0.25 }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                      Final Price:
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
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
          <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86), mb: 1 }}>Payment Method</BodyText>
          <Stack spacing={0.75}>
            {(
              [
                { id: "onlineDirect", label: "Online direct" },
                { id: "offlineDirect", label: "Offline direct" },
              ] as const
            ).map((option) => (
              <Button
                key={option.id}
                variant={paymentMethod === option.id ? "contained" : "outlined"}
                disableElevation
                onClick={() => setPaymentMethod(option.id)}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 12.5,
                  borderRadius: "8px",
                  height: 36,
                  bgcolor: paymentMethod === option.id ? m.teal : "#fff",
                  borderColor: alpha(m.navy, 0.14),
                  color: paymentMethod === option.id ? "#fff" : alpha(m.navy, 0.72),
                  "&:hover": {
                    bgcolor: paymentMethod === option.id ? m.tealDark : alpha(m.navy, 0.02),
                  },
                }}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Box>
        ) : null}

        {step === 3 ? (
          <Stack spacing={1.25}>
            <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>Final summary</BodyText>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.65) }}>
              Client: {selectionLabel(clientSelection)}
            </Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.65) }}>
              Items: {lines.length} · Payment: {paymentMethod === "onlineDirect" ? "Online direct" : "Offline direct"}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
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
        onSave={(selected) => addLinesFromCatalog("product", selected)}
      />

      <ManualEntryCatalogDrawer
        open={itemDrawerOpen}
        onClose={() => setItemDrawerOpen(false)}
        title="Select items"
        options={itemOptions}
        emptyLabel="No services configured yet."
        onSave={(selected) => addLinesFromCatalog("item", selected)}
      />

      <ManualEntryUniqueItemModal
        open={uniqueItemOpen}
        onClose={() => setUniqueItemOpen(false)}
        onSave={(line) => setLines((prev) => [...prev, line])}
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
