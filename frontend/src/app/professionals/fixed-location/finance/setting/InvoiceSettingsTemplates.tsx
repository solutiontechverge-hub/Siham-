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
                      <BodyText sx={mollureLabelSx(m.navy)}>
                        {settings.logoDataUrl
                          ? "Change invoice logo"
                          : "Upload logo for invoice"}
                      </BodyText>
                      <BodyText sx={mollureBodyMutedSx(m.navy, { fontSize: 10.5 })}>
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
