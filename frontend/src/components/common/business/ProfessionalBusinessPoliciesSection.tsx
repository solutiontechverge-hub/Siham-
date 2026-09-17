"use client";

import * as React from "react";
import {
  Box,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import MollureFormField from "../MollureFormField";
import { mollureWhiteFieldInputSx } from "../mollureFormSx";
import { Typography } from "../../ui/typography";
import {
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import {
  SetupSectionsGroup,
  SetupSubSection,
} from "./professionalFixedLocationSetupShell";

type NotesData = {
  title: string;
  notesLabel: string;
  placeholder: string;
};

type BizPriceNotes = {
  notes: string;
  priceRangeFrom: string;
  priceRangeTo: string;
  prepaymentPercent: string;
  prepaymentInstructions: string;
};

type PolicyValues = {
  kilometerAllowance: string;
  kilometerAllowanceInstructions: string;
  policyResponseHours: string;
  policyResponseMinutes: string;
  policyInstructions: string;
  rescheduleMinimumHours: string;
  rescheduleMinimumMinutes: string;
  rescheduleLateFeePercent: string;
  rescheduleInstructions: string;
  cancelMinimumHours: string;
  cancelMinimumMinutes: string;
  cancelLateFeePercent: string;
  cancelInstructions: string;
  noShowFeePercent: string;
  noShowInstructions: string;
};

export type ProfessionalBusinessPoliciesSectionProps = {
  m: Theme["palette"]["mollure"];
  data: { generalNotes: NotesData };
  biz: BizPriceNotes;
  values: PolicyValues;
  setBizField: (key: keyof BizPriceNotes, value: string) => void;
  setPublishableFormField: (key: keyof PolicyValues, value: string) => void;
  renderSectionEditAction: (
    sectionId: "generalNotes",
    extra?: React.ReactNode,
  ) => React.ReactNode;
  generalNotesDisabled: boolean;
  priceDisabled: boolean;
  policyDisabled: boolean;
  reschedulingPolicyDisabled: boolean;
  cancellationPolicyDisabled: boolean;
  noShowPolicyDisabled: boolean;
  showKilometerAllowance: boolean;
};

export function ProfessionalBusinessPoliciesSection({
  m,
  data,
  biz,
  values,
  setBizField,
  setPublishableFormField,
  renderSectionEditAction,
  generalNotesDisabled,
  priceDisabled,
  policyDisabled,
  reschedulingPolicyDisabled,
  cancellationPolicyDisabled,
  noShowPolicyDisabled,
  showKilometerAllowance,
}: ProfessionalBusinessPoliciesSectionProps) {
  return (
      <SetupSectionsGroup>
        <SetupSubSection
          title={
            <Typography
              sx={mollureSectionTitleSx(m.navy, {
                lineHeight: 1.2,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {data.generalNotes.title}
            </Typography>
          }
          action={renderSectionEditAction("generalNotes")}
        >
          <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
            {data.generalNotes.notesLabel}
          </Typography>
          <MollureFormField
            placeholder={data.generalNotes.placeholder}
            value={biz.notes}
            onChange={(e) => setBizField("notes", e.target.value)}
            multiline
            minRows={4}
            disabled={generalNotesDisabled}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha(m.navy, 0.01),
              },
            }}
          />
        </SetupSubSection>

        <SetupSubSection title="Price" toned>
          <Stack spacing={2}>
            <Box>
              <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                Price Range
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    select
                    value={biz.priceRangeFrom}
                    onChange={(e) =>
                      setBizField("priceRangeFrom", e.target.value)
                    }
                    disabled={priceDisabled}
                    sx={mollureWhiteFieldInputSx}
                  >
                    {["Low", "Medium", "High"].map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    select
                    value={biz.priceRangeTo}
                    onChange={(e) =>
                      setBizField("priceRangeTo", e.target.value)
                    }
                    disabled={priceDisabled}
                    sx={mollureWhiteFieldInputSx}
                  >
                    {["Low", "Medium", "High"].map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                Prepayment (Optional)
              </Typography>
              <MollureFormField
                value={biz.prepaymentPercent}
                onChange={(e) =>
                  setBizField("prepaymentPercent", e.target.value)
                }
                placeholder="0"
                disabled={priceDisabled}
                sx={mollureWhiteFieldInputSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                  inputMode: "numeric",
                }}
              />
              <Box sx={{ mt: 1 }}>
                <MollureFormField
                  placeholder="Custom instructions for prepayment"
                  value={biz.prepaymentInstructions}
                  onChange={(e) =>
                    setBizField("prepaymentInstructions", e.target.value)
                  }
                  multiline
                  minRows={3}
                  disabled={priceDisabled}
                  sx={mollureWhiteFieldInputSx}
                />
              </Box>
            </Box>

            {showKilometerAllowance ? (
              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Kilometer Allowance (Optional)
                </Typography>
                <MollureFormField
                  value={values.kilometerAllowance}
                  onChange={(e) =>
                    setPublishableFormField(
                      "kilometerAllowance",
                      e.target.value,
                    )
                  }
                  placeholder="€ 0"
                  disabled={priceDisabled}
                  sx={mollureWhiteFieldInputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        EUR/Kilometer
                      </InputAdornment>
                    ),
                    inputMode: "decimal",
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <MollureFormField
                    placeholder="Custom instructions for Kilometer Allowance"
                    value={values.kilometerAllowanceInstructions}
                    onChange={(e) =>
                      setPublishableFormField(
                        "kilometerAllowanceInstructions",
                        e.target.value,
                      )
                    }
                    multiline
                    minRows={3}
                    disabled={priceDisabled}
                    sx={mollureWhiteFieldInputSx}
                  />
                </Box>
              </Box>
            ) : null}
          </Stack>
        </SetupSubSection>

        <Box
          sx={{
            mx: 2.25,
            borderRadius: "10px",
            bgcolor: "#F9FAFB",
            overflow: "hidden",
            pb: 2,
          }}
        >
          <SetupSubSection
            title={
              <Typography
                sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.2 })}
              >
                Policy Section
              </Typography>
            }
          >
            <Stack spacing={1.6}>
              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Prepayment/Response Time
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Hour"
                      value={values.policyResponseHours}
                      onChange={(e) =>
                        setPublishableFormField("policyResponseHours", e.target.value)
                      }
                      disabled={policyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">H</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Minutes"
                      value={values.policyResponseMinutes}
                      onChange={(e) =>
                        setPublishableFormField("policyResponseMinutes", e.target.value)
                      }
                      disabled={policyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">Min</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <MollureFormField
                placeholder="Custom instructions for Policy"
                value={values.policyInstructions}
                onChange={(e) =>
                  setPublishableFormField("policyInstructions", e.target.value)
                }
                multiline
                minRows={3}
                disabled={policyDisabled}
                sx={mollureWhiteFieldInputSx}
              />
            </Stack>
          </SetupSubSection>

          <SetupSubSection
            title={
              <Typography
                sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.2 })}
              >
                Rescheduling
              </Typography>
            }
          >
            <Stack spacing={1.6}>
              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Minimum Time Before Appointment
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Hour"
                      value={values.rescheduleMinimumHours}
                      onChange={(e) =>
                        setPublishableFormField("rescheduleMinimumHours", e.target.value)
                      }
                      disabled={reschedulingPolicyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">H</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Minutes"
                      value={values.rescheduleMinimumMinutes}
                      onChange={(e) =>
                        setPublishableFormField("rescheduleMinimumMinutes", e.target.value)
                      }
                      disabled={reschedulingPolicyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">Min</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Late Rescheduling Fee
                </Typography>
                <MollureFormField
                  placeholder="0"
                  value={values.rescheduleLateFeePercent}
                  onChange={(e) =>
                    setPublishableFormField("rescheduleLateFeePercent", e.target.value)
                  }
                  disabled={reschedulingPolicyDisabled}
                  sx={mollureWhiteFieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
              </Box>

              <MollureFormField
                placeholder="Custom instructions for rescheduling Policy"
                value={values.rescheduleInstructions}
                onChange={(e) =>
                  setPublishableFormField("rescheduleInstructions", e.target.value)
                }
                multiline
                minRows={3}
                disabled={reschedulingPolicyDisabled}
                sx={mollureWhiteFieldInputSx}
              />
            </Stack>
          </SetupSubSection>

          <SetupSubSection
            title={
              <Typography
                sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.2 })}
              >
                Cancellation Policy
              </Typography>
            }
          >
            <Stack spacing={1.6}>
              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Minimum Time Before Appointment
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Hour"
                      value={values.cancelMinimumHours}
                      onChange={(e) =>
                        setPublishableFormField("cancelMinimumHours", e.target.value)
                      }
                      disabled={cancellationPolicyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">H</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Minutes"
                      value={values.cancelMinimumMinutes}
                      onChange={(e) =>
                        setPublishableFormField("cancelMinimumMinutes", e.target.value)
                      }
                      disabled={cancellationPolicyDisabled}
                      sx={mollureWhiteFieldInputSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">Min</InputAdornment>
                        ),
                        inputMode: "numeric",
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  Late Cancellation Fee
                </Typography>
                <MollureFormField
                  placeholder="0"
                  value={values.cancelLateFeePercent}
                  onChange={(e) =>
                    setPublishableFormField("cancelLateFeePercent", e.target.value)
                  }
                  disabled={cancellationPolicyDisabled}
                  sx={mollureWhiteFieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
              </Box>

              <MollureFormField
                placeholder="Custom instructions for cancellation Policy"
                value={values.cancelInstructions}
                onChange={(e) =>
                  setPublishableFormField("cancelInstructions", e.target.value)
                }
                multiline
                minRows={3}
                disabled={cancellationPolicyDisabled}
                sx={mollureWhiteFieldInputSx}
              />
            </Stack>
          </SetupSubSection>

          <SetupSubSection
            title={
              <Typography
                sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.2 })}
              >
                No show Policy
              </Typography>
            }
          >
            <Stack spacing={1.6}>
              <Box>
                <Typography sx={mollureLabelSx(m.navy, { mb: 0.75 })}>
                  No Show Fee
                </Typography>
                <MollureFormField
                  placeholder="0"
                  value={values.noShowFeePercent}
                  onChange={(e) =>
                    setPublishableFormField("noShowFeePercent", e.target.value)
                  }
                  disabled={noShowPolicyDisabled}
                  sx={mollureWhiteFieldInputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                    inputMode: "numeric",
                  }}
                />
              </Box>

              <MollureFormField
                placeholder="Custom instructions for no show Policy"
                value={values.noShowInstructions}
                onChange={(e) =>
                  setPublishableFormField("noShowInstructions", e.target.value)
                }
                multiline
                minRows={3}
                disabled={noShowPolicyDisabled}
                sx={mollureWhiteFieldInputSx}
              />
            </Stack>
          </SetupSubSection>
        </Box>
      </SetupSectionsGroup>
  );
}
