"use client";

import * as React from "react";
import Image from "next/image";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Box, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../../../theme/mollureHierarchy";
import { BodyText, SubHeading } from "../../../../../components/ui/typography";
import AppButton from "../../../../../components/common/AppButton";
import AppModal, {
  AppModalCancelButton,
  AppModalPrimaryButton,
} from "../../../../../components/common/AppModal";
import {
  INVOICE_LOGO_ACCEPT,
  INVOICE_LOGO_HINT,
} from "../../../../../lib/invoiceLogoUpload";
import type { InvoiceSettingsSx } from "./invoiceSettings.styles";

type Settings = {
  logoDataUrl?: string | null;
  defaultInvoiceType: "individual" | "company";
};

export function InvoiceSettingsTemplates(props: {
  m: { navy: string; teal: string };
  sx: InvoiceSettingsSx;
  settings: Settings;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectIndividualInvoice: () => void;
  selectCompanyInvoice: () => void;
}) {
  const {
    m,
    sx: { sectionCardSx, headerSx, templateTileSx, tinyBtnSx },
    settings,
    logoInputRef,
    handleLogoChange,
    selectIndividualInvoice,
    selectCompanyInvoice,
  } = props;

  const hasLogo = Boolean(settings.logoDataUrl);
  const [logoChoiceOpen, setLogoChoiceOpen] = React.useState(false);
  const [logoPreviewOpen, setLogoPreviewOpen] = React.useState(false);

  const openFileChooser = () => logoInputRef.current?.click();

  const handleLogoTileClick = () => {
    if (!hasLogo) {
      openFileChooser();
      return;
    }
    setLogoChoiceOpen(true);
  };

  return (
            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <SubHeading sx={mollureSectionTitleSx(m.navy)}>
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
                    onClick={handleLogoTileClick}
                  >
                    <Stack spacing={0.55} alignItems="center">
                      {hasLogo ? (
                        <Box
                          sx={{ position: "relative", width: 52, height: 52 }}
                        >
                          <Image
                            src={settings.logoDataUrl!}
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
                      <BodyText sx={mollureLabelSx(m.navy)}>
                        {hasLogo
                          ? "Change invoice logo"
                          : "Upload logo for invoice"}
                      </BodyText>
                      <BodyText sx={mollureBodyMutedSx(m.navy, { fontSize: 10.5 })}>
                        {INVOICE_LOGO_HINT}
                      </BodyText>
                    </Stack>
                  </Box>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept={INVOICE_LOGO_ACCEPT}
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  <AppModal
                    open={logoChoiceOpen}
                    onClose={() => setLogoChoiceOpen(false)}
                    title="Invoice logo"
                    maxWidth="xs"
                    fullWidth
                    contentSx={{ px: 2.5, py: 1 }}
                    footerVariant="actions"
                    footer={
                      <>
                        {hasLogo ? (
                          <AppButton
                            tone="secondary"
                            presetSize="lg"
                            onClick={() => {
                              setLogoChoiceOpen(false);
                              setLogoPreviewOpen(true);
                            }}
                            sx={{ minWidth: 100, px: 3 }}
                          >
                            View picture
                          </AppButton>
                        ) : null}
                        <AppModalPrimaryButton
                          label="Change picture"
                          onClick={() => {
                            setLogoChoiceOpen(false);
                            openFileChooser();
                          }}
                        />
                        <AppModalCancelButton
                          onClick={() => setLogoChoiceOpen(false)}
                        />
                      </>
                    }
                  >
                    <BodyText sx={mollureBodyMutedSx(m.navy, { fontSize: 13 })}>
                      Do you want to view this logo or upload a new one?
                    </BodyText>
                  </AppModal>
                  <AppModal
                    open={logoPreviewOpen}
                    onClose={() => setLogoPreviewOpen(false)}
                    title="Invoice logo"
                    maxWidth="sm"
                    fullWidth
                    contentSx={{ px: 2.5, py: 2 }}
                    footerVariant="actions"
                    footer={
                      <AppModalCancelButton
                        label="Close"
                        onClick={() => setLogoPreviewOpen(false)}
                      />
                    }
                  >
                    {settings.logoDataUrl ? (
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          minHeight: 220,
                          borderRadius: "12px",
                          border: `1px solid ${alpha(m.navy, 0.12)}`,
                          bgcolor: alpha(m.navy, 0.03),
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={settings.logoDataUrl}
                          alt="Invoice logo preview"
                          fill
                          unoptimized
                          style={{ objectFit: "contain", padding: 16 }}
                        />
                      </Box>
                    ) : null}
                  </AppModal>
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
                      <BodyText sx={mollureLabelSx(m.navy)}>
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
                      <BodyText sx={mollureLabelSx(m.navy)}>
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

  );
}
