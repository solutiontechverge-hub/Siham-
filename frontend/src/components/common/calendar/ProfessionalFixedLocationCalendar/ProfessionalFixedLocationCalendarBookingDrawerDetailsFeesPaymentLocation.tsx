"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  Box,
  IconButton,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import AppDropdown from "../../AppDropdown";

import {
  sanitizeDecimalInput,
} from "../../../../lib/field-input";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocationBag = Pick<
  Vm,
  | "beginExistingBookingEdit"
  | "canMutateDrawerContents"
  | "desiredLocationDraft"
  | "desiredVisitMunicipalityOptions"
  | "fixedLocationAddress"
  | "isViewingExisting"
  | "kilometerAllowanceAmount"
  | "kilometerAllowanceDraft"
  | "m"
  | "setDesiredLocationDraft"
  | "setKilometerAllowanceDraft"
  | "setShowKilometerAllowance"
  | "showKilometerAllowance"
  | "slotLocation"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocationBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation({ bag }: Props) {
  const {
    beginExistingBookingEdit,
    canMutateDrawerContents,
    desiredLocationDraft,
    desiredVisitMunicipalityOptions,
    fixedLocationAddress,
    isViewingExisting,
    kilometerAllowanceAmount,
    kilometerAllowanceDraft,
    m,
    setDesiredLocationDraft,
    setKilometerAllowanceDraft,
    setShowKilometerAllowance,
    showKilometerAllowance,
    slotLocation,
  } = bag;

  return (
            <Box
              sx={{
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.025),
                p: 1.5,
                ...(slotLocation === "FL"
                  ? {
                      backgroundImage: `repeating-linear-gradient(90deg, ${alpha(m.teal, 0.1)} 0 2px, transparent 2px 13px)`,
                      backgroundSize: "15px 100%",
                    }
                  : slotLocation === "DL"
                    ? {
                        backgroundImage: `radial-gradient(${alpha(m.navy, 0.14)} 1px, transparent 1.35px)`,
                        backgroundSize: "17px 17px",
                      }
                    : {}),
              }}
            >
              <BodyText
                sx={{
                  ...mollureLabelSx(m.navy),
                  mb: 1,
                }}
              >
                Location
              </BodyText>
              {slotLocation === "FL" ? (
                <Stack direction="row" spacing={4}>
                  <BodyText
                    sx={mollureLabelSx(m.navy, {
                      color: alpha(m.navy, 0.68),
                    })}
                  >
                    Fixed Location
                  </BodyText>
                  <BodyText
                    sx={mollureLabelSx(m.navy, {
                      color: alpha(m.navy, 0.42),
                    })}
                  >
                    {fixedLocationAddress ||
                      "Fixed location address"}
                  </BodyText>
                </Stack>
              ) : (
                <Box>
                  {showKilometerAllowance ? (
                    <Box
                      sx={{
                        borderRadius: "12px",
                        bgcolor: "#fff",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        boxShadow:
                          "0 10px 26px rgba(16, 35, 63, 0.08)",
                        p: 1.5,
                        mb: 1.25,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <BodyText
                          sx={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.82),
                          }}
                        >
                          Kilometer Allowance
                        </BodyText>
                        {canMutateDrawerContents ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            beginExistingBookingEdit();
                            setShowKilometerAllowance(false);
                          }}
                          sx={{ color: alpha(m.navy, 0.35) }}
                          aria-label="Remove kilometer allowance"
                        >
                          <CloseRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                        ) : null}
                      </Stack>

                      <BodyText
                        sx={{
                          fontSize: 12.25,
                          fontWeight: 850,
                          color: alpha(m.navy, 0.6),
                          mt: 1,
                          mb: 0.75,
                        }}
                      >
                        Amount/Per Kilometer
                      </BodyText>

                      <Stack direction="row" spacing={1}>
                        <AppTextField
                          label="EUR/Km"
                          placeholder="0"
                          value={kilometerAllowanceDraft.eurPerKm}
                          disabled={!canMutateDrawerContents}
                          onChange={(e) => {
                            beginExistingBookingEdit();
                            setKilometerAllowanceDraft((p) => ({
                              ...p,
                              eurPerKm: sanitizeDecimalInput(
                                e.target.value,
                              ),
                            }));
                          }}
                          fullWidth
                          inputProps={{ inputMode: "decimal" }}
                        />
                        <AppTextField
                          label="Total Kilometer"
                          placeholder="0"
                          value={
                            kilometerAllowanceDraft.totalKilometer
                          }
                          disabled={!canMutateDrawerContents}
                          onChange={(e) =>
                            setKilometerAllowanceDraft((p) => ({
                              ...p,
                              totalKilometer: sanitizeDecimalInput(
                                e.target.value,
                              ),
                            }))
                          }
                          fullWidth
                          inputProps={{ inputMode: "decimal" }}
                        />
                      </Stack>

                      <Box
                        sx={{
                          mt: 1.25,
                          pt: 1.25,
                          borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <BodyText
                          sx={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: m.headingText,
                          }}
                        >
                          Amount
                        </BodyText>
                        <BodyText
                          sx={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: m.headingText,
                          }}
                        >
                          {`${
                            Number.isInteger(kilometerAllowanceAmount)
                              ? kilometerAllowanceAmount
                              : kilometerAllowanceAmount.toFixed(2)
                          }€`}
                        </BodyText>
                      </Box>
                    </Box>
                  ) : null}

                  <BodyText
                    sx={mollureLabelSx(m.navy, {
                      color: alpha(m.navy, 0.68),
                      mb: 1,
                    })}
                  >
                    Visit Address
                  </BodyText>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <AppTextField
                      label="Street"
                      placeholder="Enter street"
                      value={desiredLocationDraft.street}
                      onChange={(e) =>
                        setDesiredLocationDraft((p) => ({
                          ...p,
                          street: e.target.value,
                        }))
                      }
                      disabled={isViewingExisting}
                      fullWidth
                    />
                    <AppTextField
                      label="Number"
                      placeholder="Enter number"
                      value={desiredLocationDraft.number}
                      onChange={(e) =>
                        setDesiredLocationDraft((p) => ({
                          ...p,
                          number: e.target.value,
                        }))
                      }
                      disabled={isViewingExisting}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <AppTextField
                      label="Postal Code"
                      placeholder="Enter postal code"
                      value={desiredLocationDraft.postalCode}
                      onChange={(e) =>
                        setDesiredLocationDraft((p) => ({
                          ...p,
                          postalCode: e.target.value,
                        }))
                      }
                      disabled={isViewingExisting}
                      fullWidth
                    />
                    {isViewingExisting ? (
                      <AppTextField
                        label="Municipality"
                        value={desiredLocationDraft.municipality}
                        disabled
                        fullWidth
                      />
                    ) : (
                      <AppDropdown
                        label="Municipality"
                        value={desiredLocationDraft.municipality}
                        onChange={(val) =>
                          setDesiredLocationDraft((p) => ({
                            ...p,
                            municipality: String(val ?? ""),
                            province: "",
                          }))
                        }
                        options={[
                          ...(desiredLocationDraft.municipality &&
                          !desiredVisitMunicipalityOptions.includes(
                            desiredLocationDraft.municipality,
                          )
                            ? [
                                {
                                  label:
                                    desiredLocationDraft.municipality,
                                  value:
                                    desiredLocationDraft.municipality,
                                },
                              ]
                            : []),
                          ...desiredVisitMunicipalityOptions.map(
                            (municipality) => ({
                              label: municipality,
                              value: municipality,
                            }),
                          ),
                        ]}
                        fullWidth
                        placeholder="Select municipality"
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
  );
}
