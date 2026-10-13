"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DenseRowIconActions from "../../../../../components/common/DenseRowIconActions";
import {
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../../../theme/mollureHierarchy";
import { BodyText, SubHeading } from "../../../../../components/ui/typography";
import AppButton from "../../../../../components/common/AppButton";
import {
  formatVatPercent,
  parseVatRate,
  VAT_EXCEPTION_INFO_TOOLTIP,
} from "../../../../../lib/financeVat";
import type { InvoiceSettingsSx } from "./invoiceSettings.styles";

function displayVat(value: string): string {
  const rate = parseVatRate(value);
  return rate == null ? value : formatVatPercent(rate);
}

type Product = { id: string; name: string; price: number; vat: string };
type Service = {
  id: string;
  service_id?: string;
  category: string;
  service: string;
  vat: string;
};

export function InvoiceSettingsProducts(props: {
  m: { navy: string; tealDark: string; teal: string; addSoftBg: string; addSoftFg: string };
  sx: InvoiceSettingsSx;
  settings: { products: Product[]; services: Service[] };
  openAddProduct: () => void;
  openEditProduct: (id: string) => void;
  handleDeleteProduct: (id: string) => void;
  openAddService: () => void;
  openEditService: (id: string) => void;
  handleDeleteService: (id: string) => void;
}) {
  const {
    m,
    sx: { sectionCardSx, headerSx, tinyBtnSx, tableHeadCellSx, tableBodyCellSx },
    settings,
    openAddProduct,
    openEditProduct,
    handleDeleteProduct,
    openAddService,
    openEditService,
    handleDeleteService,
  } = props;

  return (
            <Box sx={{ ...sectionCardSx, boxShadow: "none" }}>
              <Box sx={headerSx}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <SubHeading sx={mollureSectionTitleSx(m.navy)}>
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
                      <SubHeading sx={mollureSectionTitleSx(m.navy)}>
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
                            sx={mollureLabelSx(m.navy, { color: "inherit" })}
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
                                  {`EUR ${p.price.toFixed(2)}`}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  {p.vat}
                                </TableCell>
                                <TableCell sx={tableBodyCellSx}>
                                  <DenseRowIconActions
                                    spacing={0.5}
                                    onEdit={() => openEditProduct(p.id)}
                                    onDelete={() => handleDeleteProduct(p.id)}
                                  />
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
                        <SubHeading sx={mollureSectionTitleSx(m.navy)}>
                          Service List
                        </SubHeading>
                        <Tooltip title={VAT_EXCEPTION_INFO_TOOLTIP} arrow>
                          <Box
                            component="span"
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
                              cursor: "help",
                            }}
                          >
                            i
                          </Box>
                        </Tooltip>
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
                            sx={mollureLabelSx(m.navy, { color: "inherit" })}
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
                                  <DenseRowIconActions
                                    spacing={0.5}
                                    onEdit={() => openEditService(s.id)}
                                    onDelete={() => handleDeleteService(s.id)}
                                  />
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

  );
}
