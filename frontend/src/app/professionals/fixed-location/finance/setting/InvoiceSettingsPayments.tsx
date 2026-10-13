"use client";

import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../../../theme/mollureHierarchy";
import {
  BodyText,
  CardTitle,
} from "../../../../../components/ui/typography";
import MollureFormField from "../../../../../components/common/MollureFormField";
import type { FinanceInvoiceSettings } from "../../../../../components/sections/finance/useFinanceInvoiceSettings";
import type { InvoiceSettingsSx } from "./invoiceSettings.styles";

/** Value + Percentage|Fixed type pair; value is required (non-removable blank). */
function PenaltyFeeFields(props: {
  rowLabelSx: InvoiceSettingsSx["rowLabelSx"] | object;
  editing: boolean;
  value: string;
  unit: string;
  onValue: (value: string) => void;
  onUnit: (unit: string) => void;
}) {
  const { rowLabelSx, editing, value, unit, onValue, onUnit } = props;
  return (
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
          required
          type="number"
          inputProps={{ min: 0, step: "any" }}
          disabled={!editing}
          value={value}
          onChange={(e) => onValue(e.target.value)}
        />
        <MollureFormField
          select
          required
          disabled={!editing}
          value={unit === "fixed" ? "fixed" : "%"}
          onChange={(e) => onUnit(e.target.value)}
          SelectProps={{ native: true }}
        >
          <option value="%">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </MollureFormField>
      </Stack>
    </Stack>
  );
}

export function InvoiceSettingsPayments(props: {
  m: { navy: string };
  sx: InvoiceSettingsSx;
  showDueDateSettings: boolean;
  paymentsEditing: boolean;
  setPaymentsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  settings: Pick<FinanceInvoiceSettings, "paymentTerms" | "reminders">;
  updatePaymentTerm: (key: keyof FinanceInvoiceSettings["paymentTerms"], value: string) => void;
  updateReminder: (key: keyof FinanceInvoiceSettings["reminders"], value: string) => void;
}) {
  const {
    m,
    sx: { sectionCardSx, headerSx, formPanelSx, rowLabelSx },
    showDueDateSettings,
    paymentsEditing,
    setPaymentsEditing,
    settings,
    updatePaymentTerm,
    updateReminder,
  } = props;

  return (
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
                  <CardTitle sx={mollureSectionTitleSx(m.navy)}>
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
                    <CardTitle sx={mollureSectionTitleSx(m.navy)}>
                      Payment Terms
                    </CardTitle>
                    <Box sx={{ mt: 1.25, ...formPanelSx, bgcolor: "#fff" }}>
                      <BodyText sx={mollureLabelSx(m.navy)}>
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
                              select
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.originalDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "originalDueUnit",
                                  e.target.value,
                                )
                              }
                              SelectProps={{ native: true }}
                            >
                              <option value="Days">Days</option><option value="Weeks">Weeks</option>
                            </MollureFormField>
                          </Stack>
                        </Stack>

                        <PenaltyFeeFields
                          rowLabelSx={rowLabelSx}
                          editing={paymentsEditing}
                          value={settings.paymentTerms.originalPenaltyValue}
                          unit={settings.paymentTerms.originalPenaltyUnit}
                          onValue={(v) =>
                            updatePaymentTerm("originalPenaltyValue", v)
                          }
                          onUnit={(v) =>
                            updatePaymentTerm("originalPenaltyUnit", v)
                          }
                        />
                      </Stack>

                      <BodyText sx={mollureLabelSx(m.navy, { mt: 2 })}>
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
                              select
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueTrigger}
                            onChange={(e) =>
                              updatePaymentTerm(
                                "firstReissueTrigger",
                                e.target.value,
                              )
                            }
                              SelectProps={{ native: true }}
                            ><option value="Automatic">Automatic</option><option value="Manual">Manual</option></MollureFormField>
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
                              select
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.firstReissueDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "firstReissueDueUnit",
                                  e.target.value,
                                )
                              }
                              SelectProps={{ native: true }}
                            ><option value="Days">Days</option><option value="Weeks">Weeks</option></MollureFormField>
                          </Stack>
                        </Stack>

                        <PenaltyFeeFields
                          rowLabelSx={rowLabelSx}
                          editing={paymentsEditing}
                          value={settings.paymentTerms.firstReissuePenaltyValue}
                          unit={settings.paymentTerms.firstReissuePenaltyUnit}
                          onValue={(v) =>
                            updatePaymentTerm("firstReissuePenaltyValue", v)
                          }
                          onUnit={(v) =>
                            updatePaymentTerm("firstReissuePenaltyUnit", v)
                          }
                        />
                      </Stack>

                      <BodyText sx={mollureLabelSx(m.navy, { mt: 2 })}>
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
                              select
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissueTrigger}
                            onChange={(e) =>
                              updatePaymentTerm(
                                "secondReissueTrigger",
                                e.target.value,
                              )
                            }
                              SelectProps={{ native: true }}
                            ><option value="Automatic">Automatic</option><option value="Manual">Manual</option></MollureFormField>
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
                              select
                              disabled={!paymentsEditing}
                              value={settings.paymentTerms.secondReissueDueUnit}
                              onChange={(e) =>
                                updatePaymentTerm(
                                  "secondReissueDueUnit",
                                  e.target.value,
                                )
                              }
                              SelectProps={{ native: true }}
                            ><option value="Days">Days</option><option value="Weeks">Weeks</option></MollureFormField>
                          </Stack>
                        </Stack>

                        <PenaltyFeeFields
                          rowLabelSx={rowLabelSx}
                          editing={paymentsEditing}
                          value={settings.paymentTerms.secondReissuePenaltyValue}
                          unit={settings.paymentTerms.secondReissuePenaltyUnit}
                          onValue={(v) =>
                            updatePaymentTerm("secondReissuePenaltyValue", v)
                          }
                          onUnit={(v) =>
                            updatePaymentTerm("secondReissuePenaltyUnit", v)
                          }
                        />
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <CardTitle sx={mollureSectionTitleSx(m.navy)}>
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
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Value}
                            onChange={(e) =>
                              updateReminder("reminder1Value", e.target.value)
                            }
                          />
                          <MollureFormField
                            select
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder1Unit}
                            onChange={(e) =>
                              updateReminder("reminder1Unit", e.target.value)
                            }
                            SelectProps={{ native: true }}
                          ><option value="Days">Days</option><option value="Weeks">Weeks</option></MollureFormField>
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
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Value}
                            onChange={(e) =>
                              updateReminder("reminder2Value", e.target.value)
                            }
                          />
                          <MollureFormField
                            select
                            disabled={!paymentsEditing}
                            value={settings.reminders.reminder2Unit}
                            onChange={(e) =>
                              updateReminder("reminder2Unit", e.target.value)
                            }
                            SelectProps={{ native: true }}
                          ><option value="Days">Days</option><option value="Weeks">Weeks</option></MollureFormField>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Box>
  );
}
