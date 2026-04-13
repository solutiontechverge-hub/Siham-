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
import MollureDrawer from "../../../../../components/common/MollureDrawer";
import { useSnackbar } from "../../../../../components/common/AppSnackbar";

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
  const [invoiceLogoUrl, setInvoiceLogoUrl] = React.useState<string | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = React.useState(false);
  const [invoiceType, setInvoiceType] = React.useState<"individual" | "company">("individual");

  const downloadInvoicePdf = React.useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const left = 48;
      const right = 48;
      const top = 56;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - left - right;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Invoice", left, top);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text("Service Date: 12/04/2023", left, top + 18);
      doc.text("Due Date: 12/04/2023", left, top + 34);

      doc.text("Invoice Date: 12/04/2023", left + usableWidth - 150, top + 18, { align: "left" });
      doc.text("Invoice Number: 0535833", left + usableWidth - 150, top + 34, { align: "left" });

      // Logo (optional)
      if (invoiceLogoUrl) {
        const m = /^data:image\/(png|jpeg|jpg);base64,/.exec(invoiceLogoUrl);
        const fmt = m?.[1]?.toUpperCase() === "JPG" ? "JPEG" : m?.[1]?.toUpperCase();
        if (fmt === "PNG" || fmt === "JPEG") {
          doc.addImage(invoiceLogoUrl, fmt, left + usableWidth / 2 - 22, top - 6, 44, 44);
        }
      }

      doc.setTextColor(70);
      doc.setFontSize(10.5);
      doc.text("Late payment fee: 1% of the outstanding amount applies after the due date.", left, top + 62);

      // Business info blocks
      let y = top + 92;
      const blockH = invoiceType === "company" ? 86 : 64;
      const blockGap = 10;

      const drawBlock = (title: string, lines: string[]) => {
        doc.setDrawColor(220);
        doc.setFillColor("#FAFAFA");
        doc.roundedRect(left, y, usableWidth, blockH, 8, 8, "FD");
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, left + 14, y + 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        lines.forEach((ln, idx) => {
          doc.text(ln, left + 14, y + 36 + idx * 16);
        });
        y += blockH + blockGap;
      };

      drawBlock("Professional's Business Info", [
        "Legal Name: Craig Martha",
        "Professional Address: 2464 Royal Ln, Mesa, New Jersey",
        ...(invoiceType === "company"
          ? ["Professional VAT No: 123456789", "Professional COC No: 123456789"]
          : []),
      ]);

      drawBlock("Company Clients Business Info", [
        "Legal Name: Sara Johnson",
        "Client Address: 2464 Royal Ln, Mesa, New Jersey",
        ...(invoiceType === "company" ? ["Client VAT No: 123456789", "Client COC No: 123456789"] : []),
      ]);

      // Booking related info
      doc.setDrawColor(220);
      doc.setFillColor("#FAFAFA");
      doc.roundedRect(left, y, usableWidth, 82, 8, 8, "FD");
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Booking Related Info", left + 14, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text("Scissor Cut", left + 14, y + 38);
      doc.text("€100.00", left + usableWidth - 14, y + 38, { align: "right" });
      doc.text("Blow Dry", left + 14, y + 54);
      doc.text("€150.00", left + usableWidth - 14, y + 54, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text("Total Price:", left + 14, y + 72);
      doc.text("€250", left + usableWidth - 14, y + 72, { align: "right" });
      y += 82 + 10;

      // Line items table (simple)
      const tableTop = y + 10;
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      const cols = [
        { label: "Description", w: 180 },
        { label: "Quantity", w: 70 },
        { label: "VAT %", w: 60 },
        { label: "Price/Unit", w: 90 },
        { label: "Total", w: 60 },
      ] as const;

      let x = left;
      cols.forEach((c) => {
        doc.text(c.label, x, tableTop);
        x += c.w;
      });

      doc.setDrawColor(220);
      doc.line(left, tableTop + 6, left + cols.reduce((s, c) => s + c.w, 0), tableTop + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const rows = [
        ["Service 1", "2", "10%", "13 EUR", "€13"],
        ["Service 2", "2", "9%", "13 EUR", "€13"],
      ];
      rows.forEach((r, idx) => {
        let cx = left;
        const ry = tableTop + 26 + idx * 18;
        doc.text(r[0], cx, ry);
        cx += cols[0].w;
        doc.text(r[1], cx, ry);
        cx += cols[1].w;
        doc.text(r[2], cx, ry);
        cx += cols[2].w;
        doc.text(r[3], cx, ry);
        cx += cols[3].w;
        doc.text(r[4], cx, ry);
      });

      doc.setFont("helvetica", "bold");
      doc.text("Total (incl. VAT)", left, tableTop + 26 + rows.length * 18 + 22);
      doc.text("€13", left + usableWidth - 20, tableTop + 26 + rows.length * 18 + 22, { align: "right" });

      doc.save(`invoice-${invoiceType}.pdf`);
      showSnackbar({ severity: "success", message: "Invoice downloaded successfully." });
    } catch {
      showSnackbar({ severity: "error", message: "Failed to download invoice PDF." });
    }
  }, [invoiceLogoUrl, invoiceType, showSnackbar]);

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

  const [products, setProducts] = React.useState<Array<{ id: string; name: string; price: string; vat: string }>>([
    { id: "p1", name: "Shampoo", price: "30EUR", vat: "30%" },
    { id: "p2", name: "Eye Lashes", price: "50EUR", vat: "10%" },
  ]);

  const [services, setServices] = React.useState<Array<{ id: string; category: string; service: string; vat: string }>>([
    { id: "s1", category: "Hair", service: "Dye", vat: "20%" },
    { id: "s2", category: "Makeup", service: "Eye Makeup", vat: "10%" },
  ]);

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showSnackbar({ severity: "success", message: "Product deleted successfully." });
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showSnackbar({ severity: "success", message: "Service deleted successfully." });
  };

  const handleAddProductSaveOrUpdate = () => {
    const name = addProductDraft.productName.trim();
    if (!name) return;
    const vat = addProductDraft.vat.trim() || "0%";
    const priceRaw = addProductDraft.price.trim();
    const price = priceRaw ? `${priceRaw}EUR` : "0EUR";

    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...p, name, price, vat } : p)));
      showSnackbar({ severity: "success", message: "Product updated successfully." });
    } else {
      setProducts((prev) => [{ id: `p-${Date.now()}`, name, price, vat }, ...prev]);
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
      setServices((prev) =>
        prev.map((s) => (s.id === editingServiceId ? { ...s, category, service, vat } : s)),
      );
      showSnackbar({ severity: "success", message: "Service updated successfully." });
    } else {
      setServices((prev) => [{ id: `s-${Date.now()}`, category, service, vat }, ...prev]);
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
    const p = products.find((x) => x.id === id);
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
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setEditingServiceId(id);
    setAddServiceDraft({ service: s.service, vat: s.vat });
    setAddServiceOpen(true);
  };

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
                      <UploadFileRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }} />
                      <BodyText sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.72) }}>
                        Upload logo for invoice
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
                        setInvoiceLogoUrl(url);
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
                      borderColor: alpha(m.navy, 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setInvoiceType("individual");
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
                      borderColor: alpha(m.navy, 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setInvoiceType("company");
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
                        {products.map((p) => (
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
                        {services.map((s) => (
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
                            <MollureFormField disabled={!paymentsEditing} placeholder="2" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="Weeks" />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField disabled={!paymentsEditing} placeholder="10" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="%" />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText sx={{ mt: 2, fontWeight: 900, color: alpha(m.navy, 0.78) }}>First Reissue</BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField disabled={!paymentsEditing} placeholder="Automatic" />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField disabled={!paymentsEditing} placeholder="2" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="Weeks" />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField disabled={!paymentsEditing} placeholder="20EUR" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="%" />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText sx={{ mt: 2, fontWeight: 900, color: alpha(m.navy, 0.78) }}>Second Reissue</BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField disabled={!paymentsEditing} placeholder="Automatic" />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField disabled={!paymentsEditing} placeholder="2" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="Weeks" />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                            <MollureFormField disabled={!paymentsEditing} placeholder="20EUR" />
                            <MollureFormField disabled={!paymentsEditing} placeholder="%" />
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
                          <MollureFormField disabled={!paymentsEditing} placeholder="2" />
                          <MollureFormField disabled={!paymentsEditing} placeholder="Weeks" />
                        </Stack>
                      </Stack>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mt: 1.25 }}>
                        <BodyText sx={rowLabelSx}>Reminder 2</BodyText>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
                          <MollureFormField disabled={!paymentsEditing} placeholder="2" />
                          <MollureFormField disabled={!paymentsEditing} placeholder="Weeks" />
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

      <MollureDrawer
        anchor="right"
        open={invoiceDrawerOpen}
        onClose={() => setInvoiceDrawerOpen(false)}
        title="View Invoice"
        width={{ xs: "100%", sm: 560 }}
        contentSx={{ p: 2.25 }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ borderBottom: `1px solid ${alpha(m.navy, 0.08)}`, pb: 1 }}>
            {["Booking", "Sales", "Activity"].map((t, idx) => (
              <BodyText
                key={t}
                sx={{
                  fontWeight: 800,
                  fontSize: 12.5,
                  color: idx === 1 ? m.teal : alpha(m.navy, 0.55),
                  borderBottom: idx === 1 ? `2px solid ${m.teal}` : "2px solid transparent",
                  pb: 0.75,
                }}
              >
                {t}
              </BodyText>
            ))}
          </Stack>

          <Box
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              bgcolor: "#fff",
              p: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "start",
                columnGap: 2,
              }}
            >
              <Box>
                <SubHeading sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.86) }}>Invoice</SubHeading>
                <BodyText sx={{ mt: 0.5, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                  Service Date: 12/04/2023
                </BodyText>
                <BodyText sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Due Date: 12/04/2023</BodyText>
              </Box>

              <Box sx={{ pt: 0.25, display: "flex", justifyContent: "center" }}>
                {invoiceLogoUrl ? (
                  <Box
                    component="img"
                    src={invoiceLogoUrl}
                    alt="Invoice logo"
                    sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: "10px" }}
                  />
                ) : null}
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Invoice Date: 12/04/2023</BodyText>
                <BodyText sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                  Invoice Number: 0535833
                </BodyText>
              </Box>
            </Box>

            <BodyText sx={{ mt: 1.4, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
              Late payment fee: 1% of the outstanding amount applies after the due date.
            </BodyText>

            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.015),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                }}
              >
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Professional&apos;s Business Info</BodyText>
                <Stack spacing={0.5} sx={{ mt: 1.1 }}>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Legal Name: Craig Martha</BodyText>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                    Professional Address: 2464 Royal Ln, Mesa, New Jersey
                  </BodyText>
                  {invoiceType === "company" ? (
                    <>
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Professional VAT No: 123456789</BodyText>
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Professional COC No: 123456789</BodyText>
                    </>
                  ) : null}
                </Stack>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.015),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                }}
              >
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Company Clients Business Info</BodyText>
                <Stack spacing={0.5} sx={{ mt: 1.1 }}>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Legal Name: Sara Johnson</BodyText>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                    Client Address: 2464 Royal Ln, Mesa, New Jersey
                  </BodyText>
                  {invoiceType === "company" ? (
                    <>
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Client VAT No: 123456789</BodyText>
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Client COC No: 123456789</BodyText>
                    </>
                  ) : null}
                </Stack>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.015),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                }}
              >
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Booking Related Info</BodyText>
                <Stack spacing={0.75} sx={{ mt: 1.1 }}>
                  {[
                    { label: "Scissor Cut", value: "€100.00" },
                    { label: "Blow Dry", value: "€150.00" },
                  ].map((r) => (
                    <Stack key={r.label} direction="row" alignItems="center" justifyContent="space-between">
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>{r.label}</BodyText>
                      <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>{r.value}</BodyText>
                    </Stack>
                  ))}

                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.25 }}>
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>Total Price:</BodyText>
                    <BodyText sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.82) }}>€250</BodyText>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Description", "Quantity", "VAT %", "Price Per Unit", "Total Price"].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.65), borderBottom: `1px solid ${alpha(m.navy, 0.08)}` }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { d: "Service 1", q: "2", v: "10%", p: "13 EUR", t: "13" },
                    { d: "Service 2", q: "2", v: "9%", p: "13 EUR", t: "13" },
                  ].map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{r.d}</TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{r.q}</TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{r.v}</TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{r.p}</TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>€{r.t}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.65) }}>Total (incl. VAT)</BodyText>
                <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>€13</BodyText>
              </Stack>
            </Box>

            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={downloadInvoicePdf}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: alpha(m.navy, 0.16),
                  color: alpha(m.navy, 0.70),
                  "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
                }}
              >
                Download Invoice
              </Button>
            </Stack>
          </Box>
        </Stack>
      </MollureDrawer>
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
