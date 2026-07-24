"use client";

import AppButton from "../../../../../components/common/AppButton";
import * as React from "react";
import Image from "next/image";
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
import {
  BodyText,
  CardTitle,
  SubHeading,
} from "../../../../../components/ui/typography";
import AppCard from "../../../../../components/common/AppCard";
import MollureFormField from "../../../../../components/common/MollureFormField";
import AppModal from "../../../../../components/common/AppModal";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import {
  EXPECT_ITEMS,
  MANAGING_BULLETS,
  PAYOUT_BULLETS,
  PRODUCT_NAME_OPTIONS,
  SERVICE_OPTIONS,
  SETTINGS_TAB_LABELS,
  TRANSACTION_OPTION_ITEMS,
} from "./setting.data";
import type { ExpectItemKey } from "./setting.types";
import {
  useFinanceSettingPage,
  useInvoiceSettingsSection,
  useStripeSettingsSection,
  useTransactionOptionsSettingsSection,
} from "./useFinanceSettingPage";

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
    <AppButton
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
    </AppButton>
  );
}

function expectIcon(key: ExpectItemKey, m: { navy: string }) {
  const sx = { fontSize: 16, color: alpha(m.navy, 0.75) };
  switch (key) {
    case "business":
      return <BusinessCenterRoundedIcon sx={sx} />;
    case "representative":
      return <PersonRoundedIcon sx={sx} />;
    case "public":
      return <PublicRoundedIcon sx={sx} />;
    case "payout":
      return <AccountBalanceRoundedIcon sx={sx} />;
    case "review":
      return <FactCheckRoundedIcon sx={sx} />;
  }
}

function StripeSettings() {
  const {
    m,
    hydrated,
    subscriptionActive,
    paymentsConnected,
    showOnboardingBanner,
    showDisconnectedBanner,
    handleSubscriptionClick,
    handlePaymentsClick,
  } = useStripeSettingsSection();

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.1)}`,
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

  if (!hydrated) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {showOnboardingBanner ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha("#E65100", 0.25)}`,
            bgcolor: alpha("#E65100", 0.06),
            px: 2,
            py: 1.4,
          }}
        >
          <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: "#E65100" }}>
            Onboarding not completed — please proceed with your onboarding
            process.
          </BodyText>
        </Paper>
      ) : null}

      {showDisconnectedBanner ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha("#C62828", 0.3)}`,
            bgcolor: alpha("#C62828", 0.06),
            px: 2,
            py: 1.4,
          }}
        >
          <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: "#C62828" }}>
            Public profile has temporarily been deactivated — Status: Not
            Connected
          </BodyText>
        </Paper>
      ) : null}

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
        <BodyText sx={{ mt: 0.35, color: alpha(m.navy, 0.5), fontSize: 12.5 }}>
          Stripe Mollure partnership
        </BodyText>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
            Mollure Subscription
          </CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7) }}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: subscriptionActive ? "success.main" : alpha(m.navy, 0.7),
                fontWeight: 800,
              }}
            >
              {subscriptionActive ? "Active" : "Not Active"}
            </Box>
          </BodyText>
          <BodyText sx={{ mt: 0.6, fontSize: 12.5, color: alpha(m.navy, 0.6) }}>
            Your 15 EUR/month is billed securely via Stripe Billing. A valid
            credit card is required
          </BodyText>
          <Box sx={{ mt: 1.25 }}>
            <AppButton
              variant="contained"
              disableElevation
              sx={actionBtnSx}
              onClick={handleSubscriptionClick}
            >
              {subscriptionActive
                ? "Deactivate Subscription"
                : "Activate Subscription"}
            </AppButton>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
            Accept Online Payment
          </CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7) }}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: paymentsConnected ? "success.main" : alpha(m.navy, 0.7),
                fontWeight: 800,
              }}
            >
              {paymentsConnected ? "Connected" : "Not Connected"}
            </Box>
          </BodyText>

          <Box sx={{ mt: 1.1 }}>
            <AppButton
              variant="contained"
              disableElevation
              sx={actionBtnSx}
              onClick={handlePaymentsClick}
            >
              {paymentsConnected
                ? "Stripe Mollure Dashboard"
                : subscriptionActive
                  ? "Complete Onboarding"
                  : "Start Onboarding"}
            </AppButton>
          </Box>

          {!subscriptionActive ? (
            <Box sx={{ mt: 2 }}>
              <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
                What To Expect
              </CardTitle>
              <BodyText
                sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}
              >
                Stripe&apos;s onboarding takes 2–5 minutes and guides you
                through a standard compliance verification flow. During
                onboarding, Stripe will request the following information:
              </BodyText>

              <Stack spacing={1.25} sx={{ mt: 1.4 }}>
                {EXPECT_ITEMS.map((it) => (
                  <Stack
                    key={it.title}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
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
                      {expectIcon(it.key, m)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <BodyText
                        sx={{ fontWeight: 800, color: alpha(m.navy, 0.78) }}
                      >
                        {it.title}
                      </BodyText>
                      <BodyText
                        sx={{
                          mt: 0.2,
                          fontSize: 12,
                          color: alpha(m.navy, 0.55),
                        }}
                      >
                        {it.desc}
                      </BodyText>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : paymentsConnected ? (
            <Box sx={{ mt: 2 }}>
              <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>Payout</CardTitle>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {PAYOUT_BULLETS.map((t) => (
                  <BodyText
                    key={t}
                    sx={{
                      fontSize: 12,
                      color: alpha(m.navy, 0.58),
                      display: "list-item",
                    }}
                  >
                    {t}
                  </BodyText>
                ))}
              </Stack>

              <CardTitle sx={{ mt: 2, color: alpha(m.navy, 0.86) }}>
                Managing Your Stripe Account
              </CardTitle>
              <BodyText
                sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}
              >
                After onboarding, you can manage key payment information
                directly in your Stripe dashboard:
              </BodyText>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {MANAGING_BULLETS.map((t) => (
                  <BodyText
                    key={t}
                    sx={{
                      fontSize: 12,
                      color: alpha(m.navy, 0.58),
                      display: "list-item",
                    }}
                  >
                    {t}
                  </BodyText>
                ))}
              </Stack>
              <BodyText
                sx={{ mt: 1.25, fontSize: 11.5, color: alpha(m.navy, 0.48) }}
              >
                (Note: Stripe handles KYC, AML, etc.)
              </BodyText>
            </Box>
          ) : (
            <BodyText
              sx={{ mt: 1.5, fontSize: 12.5, color: alpha(m.navy, 0.58) }}
            >
              Your subscription is active. Complete Stripe onboarding to accept
              online payments and view payout details.
            </BodyText>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}

function TransactionOptionsSettings() {
  const { m, editing, draft, setDraft, handleEditToggle } =
    useTransactionOptionsSettingsSection();

  const cardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.1)}`,
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
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box sx={{ flex: 1 }}>
            <SubHeading sx={{ color: alpha(m.navy, 0.86) }}>
              Post-booking payment methods
            </SubHeading>
            <BodyText
              sx={{ mt: 0.35, color: alpha(m.navy, 0.55), fontSize: 12.5 }}
            >
              Select transaction options featured at checkout for post-booking.
            </BodyText>
          </Box>

          <IconButton
            size="small"
            onClick={handleEditToggle}
            sx={{
              mt: 0.25,
              width: 28,
              height: 28,
              borderRadius: "8px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: alpha(m.navy, 0.02),
              color: alpha(m.navy, 0.55),
              "&:hover": { bgcolor: alpha(m.navy, 0.04) },
            }}
          >
            {editing ? (
              <CheckRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <EditRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 1.6 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
            Post-Booking
          </CardTitle>
        </Stack>
        <BodyText sx={{ mt: 0.4, color: alpha(m.navy, 0.55), fontSize: 12 }}>
          Options available at checkout after a booking is made.
        </BodyText>

        <Stack spacing={0.25} sx={{ mt: 1 }}>
          {TRANSACTION_OPTION_ITEMS.map((item) => (
            <Stack
              key={item.key}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Checkbox
                checked={draft[item.key]}
                disabled={!editing}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, [item.key]: e.target.checked }))
                }
                size="small"
                sx={{ p: 0.5 }}
              />
              <BodyText
                sx={{
                  fontSize: 12.5,
                  color: alpha(m.navy, editing ? 0.75 : 0.45),
                  fontWeight: 700,
                }}
              >
                {item.label}
              </BodyText>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

function InvoiceSettings() {
  const {
    m,
    settings,
    profileResponse,
    showDueDateSettings,
    paymentsEditing,
    setPaymentsEditing,
    addProductOpen,
    setAddProductOpen,
    editingProductId,
    setEditingProductId,
    addProductDraft,
    setAddProductDraft,
    addServiceOpen,
    setAddServiceOpen,
    editingServiceId,
    setEditingServiceId,
    addServiceDraft,
    setAddServiceDraft,
    logoInputRef,
    invoiceDrawerOpen,
    setInvoiceDrawerOpen,
    handleDeleteProduct,
    handleDeleteService,
    handleAddProductSaveOrUpdate,
    handleAddServiceSaveOrUpdate,
    openAddProduct,
    openEditProduct,
    openAddService,
    openEditService,
    updatePaymentTerm,
    updateReminder,
    handleLogoChange,
    selectIndividualInvoice,
    selectCompanyInvoice,
  } = useInvoiceSettingsSection();

  const sectionCardSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.1)}`,
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
      <IconButton
        size="small"
        onClick={opts.onEdit}
        sx={{ width: 28, height: 28, borderRadius: "8px" }}
      >
        <EditOutlinedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={opts.onDelete}
        sx={{ width: 28, height: 28, borderRadius: "8px" }}
      >
        <DeleteOutlineRoundedIcon
          sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }}
        />
      </IconButton>
    </Stack>
  );

  const formPanelSx = {
    borderRadius: "10px",
    border: `1px solid ${alpha(m.navy, 0.1)}`,
    bgcolor: alpha(m.navy, 0.01),
    p: 2,
  } as const;

  const rowLabelSx = {
    width: 86,
    minWidth: 86,
    fontSize: 12,
    fontWeight: 800,
    color: alpha(m.navy, 0.7),
    pt: 1.25,
  } as const;

  return (
    <Stack spacing={2}>
      <AppCard sx={{ ...sectionCardSx, borderRadius: "10px" }}>
        <Box sx={headerSx}>
          <SubHeading sx={{ color: alpha(m.navy, 0.86) }}>
            Invoice Setting
          </SubHeading>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <SubHeading
                  sx={{
                    color: alpha(m.navy, 0.86),
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: "36px",
                  }}
                >
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
                          sx={{ position: "relative", width: 52, height: 52 }}
                        >
                          <Image
                            src={settings.logoDataUrl}
                            alt="Invoice logo"
                            fill
                            unoptimized
                            style={{
                              objectFit: "contain",
                              borderRadius: "10px",
                            }}
                          />
                        </Box>
                      ) : (
                        <UploadFileRoundedIcon
                          sx={{ fontSize: 20, color: alpha(m.navy, 0.55) }}
                        />
                      )}
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          fontSize: 12.5,
                          color: alpha(m.navy, 0.72),
                        }}
                      >
                        {settings.logoDataUrl
                          ? "Change invoice logo"
                          : "Upload logo for invoice"}
                      </BodyText>
                      <BodyText
                        sx={{ fontSize: 10.5, color: alpha(m.navy, 0.52) }}
                      >
                        PNG, JPG, SVG up to 5MB
                      </BodyText>
                    </Stack>
                  </Box>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  <Box
                    sx={{
                      ...templateTileSx(),
                      borderStyle: "solid",
                      borderColor:
                        settings.defaultInvoiceType === "individual"
                          ? alpha(m.teal, 0.5)
                          : alpha(m.navy, 0.12),
                      bgcolor:
                        settings.defaultInvoiceType === "individual"
                          ? alpha(m.teal, 0.04)
                          : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={selectIndividualInvoice}
                  >
                    <Stack
                      spacing={0.45}
                      alignItems="center"
                      sx={{ textAlign: "center" }}
                    >
                      <PersonRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          fontSize: 12.5,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        Individual Client
                      </BodyText>
                      <BodyText
                        sx={{ fontSize: 10.5, color: alpha(m.navy, 0.55) }}
                      >
                        A simplified template for freelance and personal
                        invoices.
                      </BodyText>
                      <AppButton
                        tone="secondary"
                        disableElevation
                        sx={{
                          ...tinyBtnSx,
                          mt: 0.55,
                        }}
                      >
                        View invoice
                      </AppButton>
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      ...templateTileSx(),
                      borderStyle: "solid",
                      borderColor:
                        settings.defaultInvoiceType === "company"
                          ? alpha(m.teal, 0.5)
                          : alpha(m.navy, 0.12),
                      bgcolor:
                        settings.defaultInvoiceType === "company"
                          ? alpha(m.teal, 0.04)
                          : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={selectCompanyInvoice}
                  >
                    <Stack
                      spacing={0.45}
                      alignItems="center"
                      sx={{ textAlign: "center" }}
                    >
                      <PersonRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
                      <BodyText
                        sx={{
                          fontWeight: 900,
                          fontSize: 12.5,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        Company Client
                      </BodyText>
                      <BodyText
                        sx={{ fontSize: 10.5, color: alpha(m.navy, 0.55) }}
                      >
                        A professional template with company details and VAT.
                      </BodyText>
                      <AppButton
                        tone="secondary"
                        disableElevation
                        sx={{
                          ...tinyBtnSx,
                          mt: 0.55,
                        }}
                      >
                        View invoice
                      </AppButton>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <SubHeading
                    sx={{
                      color: alpha(m.navy, 0.86),
                      fontSize: 24,
                      fontWeight: 500,
                      lineHeight: "100%",
                    }}
                  >
                    Products And Services
                  </SubHeading>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
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
                      <SubHeading
                        sx={{
                          color: alpha(m.navy, 0.86),
                          fontSize: 24,
                          fontWeight: 500,
                          lineHeight: "100%",
                        }}
                      >
                        Product List
                      </SubHeading>
                      <AppButton
                        tone="secondary"
                        onClick={openAddProduct}
                        sx={{
                          ...tinyBtnSx,
                          height: 34,
                          px: 1.25,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.6}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "5px",
                              bgcolor: m.addSoftBg,
                              color: m.addSoftFg,
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 14 }} />
                          </Box>
                          <BodyText
                            sx={{
                              fontWeight: 800,
                              fontSize: 12.5,
                              color: "inherit",
                            }}
                          >
                            Product
                          </BodyText>
                        </Stack>
                      </AppButton>
                    </Box>
                    <Box sx={{ p: 1.25 }}>
                      <Box
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.1)}`,
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={tableHeadCellSx}>
                                Product Name
                              </TableCell>
                              <TableCell sx={tableHeadCellSx}>
                                Price (Including Vat)
                              </TableCell>
                              <TableCell sx={tableHeadCellSx}>VAT%</TableCell>
                              <TableCell sx={tableHeadCellSx}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {settings.products.map((p) => (
                              <TableRow key={p.id} hover>
                                <TableCell sx={tableBodyCellSx}>
                                  {p.name}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {p.price}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {p.vat}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {rowActions({
                                    onEdit: () => openEditProduct(p.id),
                                    onDelete: () => handleDeleteProduct(p.id),
                                  })}
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
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
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
                        <SubHeading
                          sx={{
                            color: alpha(m.navy, 0.86),
                            fontSize: 24,
                            fontWeight: 500,
                            lineHeight: "100%",
                          }}
                        >
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
                      <AppButton
                        tone="secondary"
                        onClick={openAddService}
                        sx={{
                          ...tinyBtnSx,
                          height: 34,
                          px: 1.25,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.6}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "5px",
                              bgcolor: alpha(m.teal, 0.14),
                              color: m.teal,
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 14 }} />
                          </Box>
                          <BodyText
                            sx={{
                              fontWeight: 800,
                              fontSize: 12.5,
                              color: "inherit",
                            }}
                          >
                            Service
                          </BodyText>
                        </Stack>
                      </AppButton>
                    </Box>
                    <Box sx={{ p: 1.25 }}>
                      <Box
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.1)}`,
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={tableHeadCellSx}>
                                Category
                              </TableCell>
                              <TableCell sx={tableHeadCellSx}>
                                Service
                              </TableCell>
                              <TableCell sx={tableHeadCellSx}>
                                VAT% of invoice
                              </TableCell>
                              <TableCell sx={tableHeadCellSx}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {settings.services.map((s) => (
                              <TableRow key={s.id} hover>
                                <TableCell sx={tableBodyCellSx}>
                                  {s.category}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {s.service}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {s.vat}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {rowActions({
                                    onEdit: () => openEditService(s.id),
                                    onDelete: () => handleDeleteService(s.id),
                                  })}
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

            <Box
              sx={{
                ...sectionCardSx,
                boxShadow: "none",
                display: showDueDateSettings ? "block" : "none",
              }}
            >
              <Box sx={headerSx}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
                    Payments And Reminders
                  </CardTitle>
                  <IconButton
                    size="small"
                    onClick={() => setPaymentsEditing((v) => !v)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      bgcolor: alpha(m.navy, 0.02),
                      color: alpha(m.navy, 0.55),
                      "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                    }}
                  >
                    {paymentsEditing ? (
                      <CheckRoundedIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <EditRoundedIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
                      Payment Terms
                    </CardTitle>
                    <Box sx={{ mt: 1.25, ...formPanelSx, bgcolor: "#fff" }}>
                      <BodyText
                        sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}
                      >
                        Original Invoice
                      </BodyText>

                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalDueValue}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "originalDueValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "originalDueUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalPenaltyValue}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "originalPenaltyValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalPenaltyUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "originalPenaltyUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText
                        sx={{
                          mt: 2,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        First Reissue
                      </BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.paymentTerms.firstReissueTrigger}
                            onChange={(e) =>
                              updatePaymentTerm(
                                "firstReissueTrigger",
                                e.target.value,
                              )
                            }
                          />
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueDueValue}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "firstReissueDueValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "firstReissueDueUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={
                                settings.paymentTerms.firstReissuePenaltyValue
                              }
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "firstReissuePenaltyValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={
                                settings.paymentTerms.firstReissuePenaltyUnit
                              }
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "firstReissuePenaltyUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>
                      </Stack>

                      <BodyText
                        sx={{
                          mt: 2,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        Second Reissue
                      </BodyText>
                      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Trigger:</BodyText>
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.paymentTerms.secondReissueTrigger}
                            onChange={(e) =>
                              updatePaymentTerm(
                                "secondReissueTrigger",
                                e.target.value,
                              )
                            }
                          />
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Due Date:</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={
                                settings.paymentTerms.secondReissueDueValue
                              }
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "secondReissueDueValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissueDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "secondReissueDueUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                          alignItems={{ md: "flex-start" }}
                        >
                          <BodyText sx={rowLabelSx}>Penalty Fee</BodyText>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            sx={{ flex: 1 }}
                          >
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={
                                settings.paymentTerms.secondReissuePenaltyValue
                              }
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "secondReissuePenaltyValue",
                                  e.target.value,
                                )
                              }
                            />
                            <MollureFormField
                              disabled={!paymentsEditing}
                              value={
                                settings.paymentTerms.secondReissuePenaltyUnit
                              }
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "secondReissuePenaltyUnit",
                                  e.target.value,
                                )
                              }
                            />
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <CardTitle sx={{ color: alpha(m.navy, 0.86) }}>
                      Invoice Reminders
                    </CardTitle>
                    <Box sx={{ mt: 1.25, ...formPanelSx, bgcolor: "#fff" }}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.25}
                        sx={{ mt: 0.25 }}
                      >
                        <BodyText sx={rowLabelSx}>Reminder 1</BodyText>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.25}
                          sx={{ flex: 1 }}
                        >
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Value}
                            onChange={(e) =>
                              updateReminder("reminder1Value", e.target.value)
                            }
                          />
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Unit}
                            onChange={(e) =>
                              updateReminder("reminder1Unit", e.target.value)
                            }
                          />
                        </Stack>
                      </Stack>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.25}
                        sx={{ mt: 1.25 }}
                      >
                        <BodyText sx={rowLabelSx}>Reminder 2</BodyText>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.25}
                          sx={{ flex: 1 }}
                        >
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Value}
                            onChange={(e) =>
                              updateReminder("reminder2Value", e.target.value)
                            }
                          />
                          <MollureFormField
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Unit}
                            onChange={(e) =>
                              updateReminder("reminder2Unit", e.target.value)
                            }
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

      <AppModal
        open={addProductOpen}
        onClose={() => {
          setAddProductOpen(false);
          setEditingProductId(null);
        }}
        title={editingProductId ? "Edit Product" : "Add Product"}
        PaperProps={{
          sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" },
        }}
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddProductOpen(false)}
              sx={{
                px: 3,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={handleAddProductSaveOrUpdate}
              sx={{
                px: 4,
              }}
            >
              {editingProductId ? "Update" : "Save"}
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.65),
                  mb: 0.5,
                }}
              >
                Product Name
              </BodyText>
              <MollureFormField
                select
                value={addProductDraft.productName}
                onChange={(e) =>
                  setAddProductDraft((p) => ({
                    ...p,
                    productName: String(e.target.value),
                  }))
                }
                SelectProps={{ native: true }}
              >
                {PRODUCT_NAME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </MollureFormField>
            </Box>

            <Box>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.65),
                  mb: 0.5,
                }}
              >
                VAT
              </BodyText>
              <MollureFormField
                value={addProductDraft.vat}
                onChange={(e) =>
                  setAddProductDraft((p) => ({ ...p, vat: e.target.value }))
                }
              />
            </Box>

            <Box>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.65),
                  mb: 0.5,
                }}
              >
                Price
              </BodyText>
              <MollureFormField
                value={addProductDraft.price}
                onChange={(e) =>
                  setAddProductDraft((p) => ({ ...p, price: e.target.value }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">€</InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">EUR</InputAdornment>
                  ),
                }}
              />
            </Box>
          </Stack>
        </Box>
      </AppModal>

      <AppModal
        open={addServiceOpen}
        onClose={() => {
          setAddServiceOpen(false);
          setEditingServiceId(null);
        }}
        title={editingServiceId ? "Edit Service" : "Add Service"}
        PaperProps={{
          sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" },
        }}
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddServiceOpen(false)}
              sx={{
                px: 3,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={handleAddServiceSaveOrUpdate}
              sx={{
                px: 4,
              }}
            >
              {editingServiceId ? "Update" : "Save"}
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.65),
                  mb: 0.5,
                }}
              >
                Select Service
              </BodyText>
              <MollureFormField
                select
                value={addServiceDraft.service}
                onChange={(e) =>
                  setAddServiceDraft((p) => ({
                    ...p,
                    service: String(e.target.value),
                  }))
                }
                SelectProps={{ native: true }}
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </MollureFormField>
            </Box>

            <Box>
              <BodyText
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.65),
                  mb: 0.5,
                }}
              >
                VAT
              </BodyText>
              <MollureFormField
                value={addServiceDraft.vat}
                onChange={(e) =>
                  setAddServiceDraft((p) => ({ ...p, vat: e.target.value }))
                }
              />
            </Box>
          </Stack>
        </Box>
      </AppModal>

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

export default function FinanceSettingPageView() {
  const { m, tab, setTab } = useFinanceSettingPage();

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
            <TabButton
              active={tab === "stripe"}
              onClick={() => setTab("stripe")}
            >
              {SETTINGS_TAB_LABELS.stripe}
            </TabButton>
            <TabButton
              active={tab === "transaction"}
              onClick={() => setTab("transaction")}
            >
              {SETTINGS_TAB_LABELS.transaction}
            </TabButton>
            <TabButton
              active={tab === "invoice"}
              onClick={() => setTab("invoice")}
            >
              {SETTINGS_TAB_LABELS.invoice}
            </TabButton>
          </Stack>
        </Box>

        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <Box sx={{ display: tab === "stripe" ? "block" : "none" }}>
            <StripeSettings />
          </Box>
          <Box sx={{ display: tab === "transaction" ? "block" : "none" }}>
            <TransactionOptionsSettings />
          </Box>
          <Box sx={{ display: tab === "invoice" ? "block" : "none" }}>
            <InvoiceSettings />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
