"use client";

import * as React from "react";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, CardTitle, SubHeading } from "../../../../../components/ui/typography";
import AppCard from "../../../../../components/common/AppCard";
import MollureFormField from "../../../../../components/common/MollureFormField";
import MollureModal from "../../../../../components/common/MollureModal";
import { useSnackbar } from "../../../../../components/common/AppSnackbar";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import { useFinanceInvoiceSettings } from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import { useGetProfileQuery } from "../../../../../store/services/profileApi";

type SettingsTab = "stripe" | "transaction" | "invoice";

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Button
      size="small"
      disableElevation
      onClick={onClick}
      sx={{
        minHeight: 28,
        height: 28,
        px: 1.1,
        borderRadius: "7px",
        textTransform: "none",
        fontWeight: 800,
        fontSize: 12,
        bgcolor: active ? m.teal : alpha(m.navy, 0.02),
        color: active ? "#fff" : alpha(m.navy, 0.58),
        border: `1px solid ${active ? alpha(m.tealDark, 0.35) : alpha(m.navy, 0.12)}`,
        "&:hover": { bgcolor: active ? m.tealDark : alpha(m.navy, 0.04) },
      }}
    >
      {children}
    </Button>
  );
}

function StripeSettings() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  // Replace these with real API-driven values when available.
  const subscriptionActive = false;
  const paymentsConnected = false;

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.10)}`,
    boxShadow: "0 6px 14px rgba(16, 35, 63, 0.05)",
    bgcolor: "#fff",
    overflow: "hidden",
  } as const;

  const sectionTitleSx = {
    px: 2,
    py: 1.6,
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
  } as const;

  const labelSx = { color: alpha(m.navy, 0.58) } as const;

  const actionBtnSx = {
    borderRadius: "7px",
    textTransform: "none",
    fontWeight: 800,
    fontSize: 12,
    height: 30,
    px: 1.25,
    bgcolor: "primary.main",
    color: "#fff",
    "&:hover": { bgcolor: "mollure.tealDark" },
  } as const;

  const expectItems = [
    {
      icon: <BusinessCenterRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.75) }} />,
      title: "Business Information",
      desc: "Enter your legal business details, business type, and contact information.",
    },
    {
      icon: <PersonRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.75) }} />,
      title: "Representative Details",
      desc: "Provide personal information for the account owner or legal representative.",
    },
    {
      icon: <PublicRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.75) }} />,
      title: "Public Business Information",
      desc: "Set how your business appears on client bank statements and provide customer contact details.",
    },
    {
      icon: <AccountBalanceRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.75) }} />,
      title: "Payout Details",
      desc: "Connect your bank account (IBAN) to receive payouts.",
    },
    {
      icon: <FactCheckRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.75) }} />,
      title: "Review & Submit",
      desc: "Confirm your information before activating online payments.",
    },
  ] as const;

  const payoutBullets = [
    "Instant payout (typically 7–10 business days)",
    "Future payouts follow your selected payout schedule",
    "Your payouts may pause only if Stripe requires additional verification",
  ] as const;

  const managingBullets = [
    "Update bank account (IBAN)",
    "Edit statement descriptor",
    "Update business contact details",
    "Review payout history",
    "Check balances and payments",
    "Complete any verification tasks required by Stripe",
    "And more (disputes, fraud checks, settings, etc.)",
  ] as const;

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
          px: 2,
          py: 1.6,
        }}
      >
        <SubHeading sx={{ color: alpha(m.navy, 0.86) }}>Stripe</SubHeading>
        <BodyText sx={{ mt: 0.35, color: alpha(m.navy, 0.50), fontSize: 12.5 }}>
          Stripe Mollure partnership
        </BodyText>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Mollure Subscription</CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: subscriptionActive ? "success.main" : alpha(m.navy, 0.70),
                fontWeight: 800,
              }}
            >
              {subscriptionActive ? "Active" : "Not Active"}
            </Box>
          </BodyText>
          <BodyText sx={{ mt: 0.6, fontSize: 12.5, color: alpha(m.navy, 0.60) }}>
            Your 15 EUR/month is billed securely via Stripe Billing. A valid credit card is required
          </BodyText>
          <Box sx={{ mt: 1.25 }}>
            <Button variant="contained" disableElevation sx={actionBtnSx}>
              {subscriptionActive ? "Deactivate Subscription" : "Activate Subscription"}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Accept Online Payment</CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: paymentsConnected ? "success.main" : alpha(m.navy, 0.70),
                fontWeight: 800,
              }}
            >
              {paymentsConnected ? "Connected" : "Not Connected"}
            </Box>
          </BodyText>

          <Box sx={{ mt: 1.1 }}>
            <Button variant="contained" disableElevation sx={actionBtnSx}>
              {paymentsConnected ? "Stripe Dashboard" : "Start Onboarding"}
            </Button>
          </Box>

          {!subscriptionActive ? (
            <Box sx={{ mt: 2 }}>
              <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>What To Expect</CardTitle>
              <BodyText sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}>
                Stripe&apos;s onboarding takes 2–5 minutes and guides you through a standard compliance verification
                flow. During onboarding, Stripe will request the following information:
              </BodyText>

              <Stack spacing={1.25} sx={{ mt: 1.4 }}>
                {expectItems.map((it) => (
                  <Stack key={it.title} direction="row" spacing={1} alignItems="flex-start">
                    <Box
                      sx={{
                        mt: 0.25,
                        width: 22,
                        height: 22,
                        borderRadius: "6px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(m.navy, 0.04),
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        flex: "0 0 auto",
                      }}
                    >
                      {it.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <BodyText sx={{ fontWeight: 800, color: alpha(m.navy, 0.78) }}>{it.title}</BodyText>
                      <BodyText sx={{ mt: 0.2, fontSize: 12, color: alpha(m.navy, 0.55) }}>{it.desc}</BodyText>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Payout</CardTitle>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {payoutBullets.map((t) => (
                  <BodyText key={t} sx={{ fontSize: 12, color: alpha(m.navy, 0.58), display: "list-item" }}>
                    {t}
                  </BodyText>
                ))}
              </Stack>

              <CardTitle sx={{ mt: 2, color: alpha(m.navy, 0.86) }}>Managing Your Stripe Account</CardTitle>
              <BodyText sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}>
                After onboarding, you can manage key payment information directly in your Stripe dashboard:
              </BodyText>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {managingBullets.map((t) => (
                  <BodyText key={t} sx={{ fontSize: 12, color: alpha(m.navy, 0.58), display: "list-item" }}>
                    {t}
                  </BodyText>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}

function TransactionOptionsSettings() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const [editing, setEditing] = React.useState(false);
  const [methods, setMethods] = React.useState({
    onlineDirect: true,
    onlineNonDirectCcOnly: true,
    offlineDirect: true,
    offlineNonDirectCcOnly: false,
  });

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.10)}`,
    boxShadow: "0 6px 14px rgba(16, 35, 63, 0.05)",
    bgcolor: "#fff",
    overflow: "hidden",
  } as const;

  return (
    <Paper elevation={0} sx={cardSx}>
      <Box
        sx={{
          px: 2,
          py: 1.6,
          bgcolor: alpha(m.navy, 0.02),
          borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ flex: 1 }}>
            <SubHeading sx={{ color: alpha(m.navy, 0.86) }}>Payment Methods</SubHeading>
            <BodyText sx={{ mt: 0.35, color: alpha(m.navy, 0.55), fontSize: 12.5 }}>
              View bookings, sales, performance and review analytics.
            </BodyText>
          </Box>

          <IconButton
            size="small"
            onClick={() => setEditing((v) => !v)}
            sx={{
              mt: 0.25,
              width: 28,
              height: 28,
              borderRadius: "8px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              bgcolor: alpha(m.navy, 0.02),
              color: alpha(m.navy, 0.55),
              "&:hover": { bgcolor: alpha(m.navy, 0.04) },
            }}
          >
            {editing ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <EditRoundedIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 1.6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Post-Booking</CardTitle>
        </Stack>
        <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.55), fontSize: 12 }}>
          Select transaction option that are facture at checkout
        </BodyText>

        <Stack spacing={0.25} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={methods.onlineDirect}
              disabled={!editing}
              onChange={(e) => setMethods((p) => ({ ...p, onlineDirect: e.target.checked }))}
              size="small"
              sx={{ p: 0.5 }}
            />
            <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, editing ? 0.75 : 0.45), fontWeight: 700 }}>
              Online direct (by default selected)
            </BodyText>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={methods.onlineNonDirectCcOnly}
              disabled={!editing}
              onChange={(e) => setMethods((p) => ({ ...p, onlineNonDirectCcOnly: e.target.checked }))}
              size="small"
              sx={{ p: 0.5 }}
            />
            <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, editing ? 0.75 : 0.45), fontWeight: 700 }}>
              Online non-direct (only for CC)
            </BodyText>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={methods.offlineDirect}
              disabled={!editing}
              onChange={(e) => setMethods((p) => ({ ...p, offlineDirect: e.target.checked }))}
              size="small"
              sx={{ p: 0.5 }}
            />
            <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, editing ? 0.75 : 0.45), fontWeight: 700 }}>
              Offline direct
            </BodyText>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={methods.offlineNonDirectCcOnly}
              disabled={!editing}
              onChange={(e) => setMethods((p) => ({ ...p, offlineNonDirectCcOnly: e.target.checked }))}
              size="small"
              sx={{ p: 0.5 }}
            />
            <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, editing ? 0.75 : 0.45), fontWeight: 700 }}>
              Offline non-direct (only for CC)
            </BodyText>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

function InvoiceSettings() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const { settings, setSettings } = useFinanceInvoiceSettings();
  const { data: profileResponse } = useGetProfileQuery();
  const [paymentsEditing, setPaymentsEditing] = React.useState(false);
  const [addProductOpen, setAddProductOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [addProductDraft, setAddProductDraft] = React.useState({
    productName: "Hair Protein",
    vat: "20%",
    price: "0",
  });
  const [addServiceOpen, setAddServiceOpen] = React.useState(false);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(null);
  const [addServiceDraft, setAddServiceDraft] = React.useState({ service: "Hair Protein", vat: "20%" });

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = React.useState(false);

  const sectionCardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.10)}`,
    boxShadow: "0 6px 14px rgba(16, 35, 63, 0.05)",
    bgcolor: "#fff",
    overflow: "hidden",
  } as const;

  const headerSx = {
    px: 2,
    py: 1.4,
    bgcolor: alpha(m.navy, 0.02),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
  } as const;

  const tinyBtnSx = {
    borderRadius: "7px",
    textTransform: "none",
    fontWeight: 800,
    fontSize: 12,
    height: 28,
    px: 1.1,
  } as const;

  const productNameOptions = ["Hair Protein", "Shampoo", "Eye Lashes"] as const;
  const serviceOptions = [
    { label: "Hair Protein", category: "Hair" },
    { label: "Dye", category: "Hair" },
    { label: "Eye Makeup", category: "Makeup" },
  ] as const;

  const handleDeleteProduct = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
    showSnackbar({ severity: "success", message: "Product deleted successfully." });
  };

  const handleDeleteService = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id),
    }));
    showSnackbar({ severity: "success", message: "Service deleted successfully." });
  };

  const handleAddProductSaveOrUpdate = () => {
    const name = addProductDraft.productName.trim();
    if (!name) return;
    const vat = addProductDraft.vat.trim() || "0%";
    const priceRaw = addProductDraft.price.trim();
    const price = priceRaw ? `${priceRaw}EUR` : "0EUR";

    if (editingProductId) {
      setSettings((prev) => ({
        ...prev,
        products: prev.products.map((product) =>
          product.id === editingProductId ? { ...product, name, price, vat } : product,
        ),
      }));
      showSnackbar({ severity: "success", message: "Product updated successfully." });
    } else {
      setSettings((prev) => ({
        ...prev,
        products: [{ id: `p-${Date.now()}`, name, price, vat }, ...prev.products],
      }));
      showSnackbar({ severity: "success", message: "Successfully added product." });
    }

    setAddProductOpen(false);
    setEditingProductId(null);
  };

  const handleAddServiceSaveOrUpdate = () => {
    const service = addServiceDraft.service.trim();
    if (!service) return;
    const vat = addServiceDraft.vat.trim() || "0%";
    const match = serviceOptions.find((s) => s.label === service);
    const category = match?.category ?? "Other";

    if (editingServiceId) {
      setSettings((prev) => ({
        ...prev,
        services: prev.services.map((item) =>
          item.id === editingServiceId ? { ...item, category, service, vat } : item,
        ),
      }));
      showSnackbar({ severity: "success", message: "Service updated successfully." });
    } else {
      setSettings((prev) => ({
        ...prev,
        services: [{ id: `s-${Date.now()}`, category, service, vat }, ...prev.services],
      }));
      showSnackbar({ severity: "success", message: "Successfully added service." });
    }

    setAddServiceOpen(false);
    setEditingServiceId(null);
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    setAddProductDraft({ productName: "Hair Protein", vat: "20%", price: "0" });
    setAddProductOpen(true);
  };

  const openEditProduct = (id: string) => {
    const p = settings.products.find((x) => x.id === id);
    if (!p) return;
    setEditingProductId(id);
    setAddProductDraft({
      productName: p.name,
      vat: p.vat,
      price: p.price.replace(/EUR$/i, ""),
    });
    setAddProductOpen(true);
  };

  const openAddService = () => {
    setEditingServiceId(null);
    setAddServiceDraft({ service: "Hair Protein", vat: "20%" });
    setAddServiceOpen(true);
  };

  const openEditService = (id: string) => {
    const s = settings.services.find((x) => x.id === id);
    if (!s) return;
    setEditingServiceId(id);
    setAddServiceDraft({ service: s.service, vat: s.vat });
    setAddServiceOpen(true);
  };

  const updatePaymentTerm = React.useCallback(
    (key: keyof typeof settings.paymentTerms, value: string) => {
      setSettings((prev) => ({
        ...prev,
        paymentTerms: {
          ...prev.paymentTerms,
          [key]: value,
        },
      }));
    },
    [setSettings, settings.paymentTerms],
  );

  const updateReminder = React.useCallback(
    (key: keyof typeof settings.reminders, value: string) => {
      setSettings((prev) => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          [key]: value,
        },
      }));
    },
    [setSettings, settings.reminders],
  );

  const templateTileSx = () =>
    ({
      borderRadius: "10px",
      border: `1px dashed ${alpha(m.navy, 0.16)}`,
      bgcolor: "#fff",
      px: 1.25,
      py: 1.25,
      minHeight: 108,
      minWidth: 170,
      flex: "1 1 0",
      boxShadow: "none",
    }) as const;

  const tableHeadCellSx = {
    fontSize: 12,
    fontWeight: 900,
    color: alpha(m.navy, 0.65),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: alpha(m.navy, 0.03),
    py: 1.25,
    textAlign: "center",
  } as const;

  const tableBodyCellSx = {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: "100%",
    color: alpha(m.navy, 0.82),
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    py: 1.2,
    textAlign: "center",
  } as const;

  const rowActions = (opts: { onEdit: () => void; onDelete: () => void }) => (
    <Stack direction="row" spacing={0.5} justifyContent="center">
      <IconButton size="small" onClick={opts.onEdit} sx={{ width: 28, height: 28, borderRadius: "8px" }}>
        <EditOutlinedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={opts.onDelete}
        sx={{ width: 28, height: 28, borderRadius: "8px" }}
      >
        <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
      </IconButton>
    </Stack>
  );

  const formPanelSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.10)}`,
    bgcolor: alpha(m.navy, 0.01),
    p: 2,
  } as const;

  const rowLabelSx = {
    width: 86,
    minWidth: 86,
    fontSize: 12,
    fontWeight: 800,
    color: alpha(m.navy, 0.70),
    pt: 1.25,
  } as const;

  return (
    <Stack spacing={2}>
      <AppCard sx={{ ...sectionCardSx, borderRadius: "10px" }}>
        <Box sx={headerSx}>
          <SubHeading sx={{ color: alpha(m.navy, 0.86) }}>Invoice Setting</SubHeading>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <SubHeading sx={{ color: alpha(m.navy, 0.86), fontSize: 24, fontWeight: 500, lineHeight: "36px" }}>
                  Invoice Templates
                </SubHeading>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                  <Box
                    sx={{
                      ...templateTileSx(),
                      borderColor: alpha(m.navy, 0.18),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Stack spacing={0.55} alignItems="center">
                      {settings.logoDataUrl ? (
                        <Box
                          component="img"
                          src={settings.logoDataUrl}
                          alt="Invoice logo"
                          sx={{ width: 52, height: 52, objectFit: "contain", borderRadius: "10px" }}
                        />
                      ) : (
                        <UploadFileRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }} />
                      )}
                      <BodyText sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.72) }}>
                        {settings.logoDataUrl ? "Change invoice logo" : "Upload logo for invoice"}
                      </BodyText>
                      <BodyText sx={{ fontSize: 10.5, color: alpha(m.navy, 0.52) }}>PNG, JPG, SVG up to 5MB</BodyText>
                    </Stack>
                  </Box>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = typeof reader.result === "string" ? reader.result : null;
                        setSettings((prev) => ({ ...prev, logoDataUrl: url }));
                        showSnackbar({ severity: "success", message: "Logo uploaded successfully." });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <Box
                    sx={{
                      ...templateTileSx(),
                      borderStyle: "solid",
                      borderColor:
                        settings.defaultInvoiceType === "individual" ? alpha(m.teal, 0.5) : alpha(m.navy, 0.12),
                      bgcolor: settings.defaultInvoiceType === "individual" ? alpha(m.teal, 0.04) : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, defaultInvoiceType: "individual" }));
                      setInvoiceDrawerOpen(true);
                    }}
                  >
                    <Stack spacing={0.45} alignItems="center" sx={{ textAlign: "center" }}>
                      <PersonRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
                      <BodyText sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.78) }}>
                        Individual Client
                      </BodyText>
                      <BodyText sx={{ fontSize: 10.5, color: alpha(m.navy, 0.55) }}>
                        A simplified template for freelance and personal invoices.
                      </BodyText>
                      <Button
                        variant="outlined"
                        disableElevation
                        sx={{
                          ...tinyBtnSx,
                          mt: 0.55,
                          borderColor: alpha(m.navy, 0.16),
                          color: alpha(m.navy, 0.65),
                          bgcolor: "#fff",
                          "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        View invoice
                      </Button>
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      ...templateTileSx(),
                      borderStyle: "solid",
                      borderColor:
                        settings.defaultInvoiceType === "company" ? alpha(m.teal, 0.5) : alpha(m.navy, 0.12),
                      bgcolor: settings.defaultInvoiceType === "company" ? alpha(m.teal, 0.04) : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, defaultInvoiceType: "company" }));
                      setInvoiceDrawerOpen(true);
                    }}
                  >
                    <Stack spacing={0.45} alignItems="center" sx={{ textAlign: "center" }}>
                      <PersonRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
                      <BodyText sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.78) }}>
                        Company Client
                      </BodyText>
                      <BodyText sx={{ fontSize: 10.5, color: alpha(m.navy, 0.55) }}>
                        A professional template with company details and VAT.
                      </BodyText>
                      <Button
                        variant="outlined"
                        disableElevation
                        sx={{
                          ...tinyBtnSx,
                          mt: 0.55,
                          borderColor: alpha(m.navy, 0.16),
                          color: alpha(m.navy, 0.65),
                          bgcolor: "#fff",
                          "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        View invoice
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <SubHeading sx={{ color: alpha(m.navy, 0.86), fontSize: 24, fontWeight: 500, lineHeight: "100%" }}>
                    Products And Services
                  </SubHeading>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        bgcolor: "#fff",
                        borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <SubHeading sx={{ color: alpha(m.navy, 0.86), fontSize: 24, fontWeight: 500, lineHeight: "100%" }}>
                        Product List
                      </SubHeading>
                      <Button
                        variant="outlined"
                        onClick={openAddProduct}
                        sx={{
                          ...tinyBtnSx,
                          height: 34,
                          px: 1.25,
                          borderRadius: "10px",
                          borderColor: alpha(m.navy, 0.16),
                          color: alpha(m.navy, 0.65),
                          bgcolor: "#fff",
                          "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "8px",
                              bgcolor: alpha(m.teal, 0.14),
                              color: m.teal,
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <BodyText sx={{ fontWeight: 800, fontSize: 12.5, color: "inherit" }}>Product</BodyText>
                        </Stack>
                      </Button>
                    </Box>
                    <Box sx={{ p: 1.25 }}>
                      <Box
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.10)}`,
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={tableHeadCellSx}>Product Name</TableCell>
                          <TableCell sx={tableHeadCellSx}>Price (Including Vat)</TableCell>
                          <TableCell sx={tableHeadCellSx}>VAT%</TableCell>
                          <TableCell sx={tableHeadCellSx}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {settings.products.map((p) => (
                          <TableRow key={p.id} hover>
                            <TableCell sx={tableBodyCellSx}>{p.name}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{p.price}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{p.vat}</TableCell>
                            <TableCell sx={tableBodyCellSx}>
                              {rowActions({ onEdit: () => openEditProduct(p.id), onDelete: () => handleDeleteProduct(p.id) })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        bgcolor: "#fff",
                        borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SubHeading sx={{ color: alpha(m.navy, 0.86), fontSize: 24, fontWeight: 500, lineHeight: "100%" }}>
                          Service List
                        </SubHeading>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: `1px solid ${alpha(m.tealDark, 0.35)}`,
                            color: m.teal,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          i
                        </Box>
                      </Stack>
                      <Button
                        variant="outlined"
                        onClick={openAddService}
                        sx={{
                          ...tinyBtnSx,
                          height: 34,
                          px: 1.25,
                          borderRadius: "10px",
                          borderColor: alpha(m.navy, 0.16),
                          color: alpha(m.navy, 0.65),
                          bgcolor: "#fff",
                          "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "8px",
                              bgcolor: alpha(m.teal, 0.14),
                              color: m.teal,
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <BodyText sx={{ fontWeight: 800, fontSize: 12.5, color: "inherit" }}>Service</BodyText>
                        </Stack>
                      </Button>
                    </Box>
                    <Box sx={{ p: 1.25 }}>
                      <Box
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.10)}`,
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={tableHeadCellSx}>Category</TableCell>
                          <TableCell sx={tableHeadCellSx}>Service</TableCell>
                          <TableCell sx={tableHeadCellSx}>VAT% of invoice</TableCell>
                          <TableCell sx={tableHeadCellSx}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {settings.services.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell sx={tableBodyCellSx}>{s.category}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{s.service}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{s.vat}</TableCell>
                            <TableCell sx={tableBodyCellSx}>
                              {rowActions({ onEdit: () => openEditService(s.id), onDelete: () => handleDeleteService(s.id) })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Payments And Reminders</CardTitle>
                  <IconButton
                    size="small"
                    onClick={() => setPaymentsEditing((v) => !v)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      bgcolor: alpha(m.navy, 0.02),
                      color: alpha(m.navy, 0.55),
                      "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                    }}
                  >
                    {paymentsEditing ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <EditRoundedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Payment Terms</CardTitle>
                    <Box sx={{ mt: 1.25, ...formPanelSx, bgcolor: "#fff" }}>
                      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Original Invoice</BodyText>

                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalDueValue}
                              onChange={(e) => updatePaymentTerm("originalDueValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalDueUnit}
                              onChange={(e) => updatePaymentTerm("originalDueUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalPenaltyValue}
                              onChange={(e) => updatePaymentTerm("originalPenaltyValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalPenaltyUnit}
                              onChange={(e) => updatePaymentTerm("originalPenaltyUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText sx={{ mt: 2, fontWeight: 900, color: alpha(m.navy, 0.78) }}>First Reissue</BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.paymentTerms.firstReissueTrigger}
                            onChange={(e) => updatePaymentTerm("firstReissueTrigger", e.target.value)}
                          />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueDueValue}
                              onChange={(e) => updatePaymentTerm("firstReissueDueValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueDueUnit}
                              onChange={(e) => updatePaymentTerm("firstReissueDueUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissuePenaltyValue}
                              onChange={(e) => updatePaymentTerm("firstReissuePenaltyValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissuePenaltyUnit}
                              onChange={(e) => updatePaymentTerm("firstReissuePenaltyUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText sx={{ mt: 2, fontWeight: 900, color: alpha(m.navy, 0.78) }}>Second Reissue</BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.paymentTerms.secondReissueTrigger}
                            onChange={(e) => updatePaymentTerm("secondReissueTrigger", e.target.value)}
                          />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissueDueValue}
                              onChange={(e) => updatePaymentTerm("secondReissueDueValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissueDueUnit}
                              onChange={(e) => updatePaymentTerm("secondReissueDueUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissuePenaltyValue}
                              onChange={(e) => updatePaymentTerm("secondReissuePenaltyValue", e.target.value)}
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissuePenaltyUnit}
                              onChange={(e) => updatePaymentTerm("secondReissuePenaltyUnit", e.target.value)}
                            />
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Invoice Reminders</CardTitle>
                    <Box sx={{ mt: 1.25, ...formPanelSx, bgcolor: "#fff" }}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mt: 0.25 }}>
                        <BodyText sx={rowLabelSx}>Reminder 1</BodyText>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Value}
                            onChange={(e) => updateReminder("reminder1Value", e.target.value)}
                          />
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Unit}
                            onChange={(e) => updateReminder("reminder1Unit", e.target.value)}
                          />
                        </Stack>
                      </Stack>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mt: 1.25 }}>
                        <BodyText sx={rowLabelSx}>Reminder 2</BodyText>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Value}
                            onChange={(e) => updateReminder("reminder2Value", e.target.value)}
                          />
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Unit}
                            onChange={(e) => updateReminder("reminder2Unit", e.target.value)}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Box>
      </AppCard>

      <MollureModal
        open={addProductOpen}
        onClose={() => {
          setAddProductOpen(false);
          setEditingProductId(null);
        }}
        title={editingProductId ? "Edit Product" : "Add Product"}
        PaperProps={{ sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" } }}
        footer={
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ px: 2.5, py: 1.75 }}>
            <Button
              variant="outlined"
              onClick={() => setAddProductOpen(false)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 36,
                px: 3,
                borderColor: alpha(m.navy, 0.16),
                color: alpha(m.navy, 0.65),
                bgcolor: "#fff",
                "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleAddProductSaveOrUpdate}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                height: 36,
                px: 4,
                bgcolor: m.teal,
                color: "#fff",
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              {editingProductId ? "Update" : "Save"}
            </Button>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65), mb: 0.5 }}>
                Product Name
              </BodyText>
              <MollureFormField
                select
                value={addProductDraft.productName}
                onChange={(e) => setAddProductDraft((p) => ({ ...p, productName: String(e.target.value) }))}
                SelectProps={{ native: true }}
              >
                {productNameOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </MollureFormField>
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65), mb: 0.5 }}>VAT</BodyText>
              <MollureFormField
                value={addProductDraft.vat}
                onChange={(e) => setAddProductDraft((p) => ({ ...p, vat: e.target.value }))}
              />
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65), mb: 0.5 }}>Price</BodyText>
              <MollureFormField
                value={addProductDraft.price}
                onChange={(e) => setAddProductDraft((p) => ({ ...p, price: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  endAdornment: <InputAdornment position="end">EUR</InputAdornment>,
                }}
              />
            </Box>
          </Stack>
        </Box>
      </MollureModal>

      <MollureModal
        open={addServiceOpen}
        onClose={() => {
          setAddServiceOpen(false);
          setEditingServiceId(null);
        }}
        title={editingServiceId ? "Edit Service" : "Add Service"}
        PaperProps={{ sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" } }}
        footer={
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ px: 2.5, py: 1.75 }}>
            <Button
              variant="outlined"
              onClick={() => setAddServiceOpen(false)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                height: 36,
                px: 3,
                borderColor: alpha(m.navy, 0.16),
                color: alpha(m.navy, 0.65),
                bgcolor: "#fff",
                "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleAddServiceSaveOrUpdate}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                height: 36,
                px: 4,
                bgcolor: m.teal,
                color: "#fff",
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              {editingServiceId ? "Update" : "Save"}
            </Button>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65), mb: 0.5 }}>
                Select Service
              </BodyText>
              <MollureFormField
                select
                value={addServiceDraft.service}
                onChange={(e) => setAddServiceDraft((p) => ({ ...p, service: String(e.target.value) }))}
                SelectProps={{ native: true }}
              >
                {serviceOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </MollureFormField>
            </Box>

            <Box>
              <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.65), mb: 0.5 }}>VAT</BodyText>
              <MollureFormField
                value={addServiceDraft.vat}
                onChange={(e) => setAddServiceDraft((p) => ({ ...p, vat: e.target.value }))}
              />
            </Box>
          </Stack>
        </Box>
      </MollureModal>

      <FinanceDocumentPreviewDrawer
        open={invoiceDrawerOpen}
        onClose={() => setInvoiceDrawerOpen(false)}
        documentType="invoice"
        invoiceType={settings.defaultInvoiceType}
        settings={settings}
        profileData={profileResponse?.data ?? null}
      />
    </Stack>
  );
}

export default function FinanceSettingPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [tab, setTab] = React.useState<SettingsTab>("stripe");

  return (
    <Box
      sx={{
        borderRadius: "10px",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.25, pt: 2.1, pb: 1.25 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <TabButton active={tab === "stripe"} onClick={() => setTab("stripe")}>
              Stripe
            </TabButton>
            <TabButton active={tab === "transaction"} onClick={() => setTab("transaction")}>
              Transaction Options
            </TabButton>
            <TabButton active={tab === "invoice"} onClick={() => setTab("invoice")}>
              Invoice
            </TabButton>
          </Stack>
        </Box>

        <Box sx={{ px: 2.25, pb: 2.25 }}>
          {tab === "stripe" ? <StripeSettings /> : null}
          {tab === "transaction" ? (
            <TransactionOptionsSettings />
          ) : null}
          {tab === "invoice" ? (
            <InvoiceSettings />
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
}
