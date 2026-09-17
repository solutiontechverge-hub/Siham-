"use client";

import {
  mollureLabelSx,
} from "../../../../theme/mollureHierarchy";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  Box,
  ButtonBase,
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

import {
  sanitizeDecimalInput,
} from "../../../../lib/field-input";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepaymentBag = Pick<
  Vm,
  | "beginExistingBookingEdit"
  | "canMutateDrawerContents"
  | "drawerPaymentMethod"
  | "isDrawerPrepaymentPaid"
  | "m"
  | "paymentMethod"
  | "paymentMethodPolicy"
  | "persistedPaymentIsOffline"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "prepaymentSectionTitle"
  | "remainingAfterPrepayment"
  | "setPaymentMethod"
  | "setPrepaymentPercent"
  | "setShowPrepayment"
  | "showPrepayment"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepaymentBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment({ bag }: Props) {
  const {
    beginExistingBookingEdit,
    canMutateDrawerContents,
    drawerPaymentMethod,
    isDrawerPrepaymentPaid,
    m,
    paymentMethod,
    paymentMethodPolicy,
    persistedPaymentIsOffline,
    prepaymentAmount,
    prepaymentPercent,
    prepaymentSectionTitle,
    remainingAfterPrepayment,
    setPaymentMethod,
    setPrepaymentPercent,
    setShowPrepayment,
    showPrepayment,
  } = bag;

  return (
    <>
            {showPrepayment ? (
              <>
                <Box
                  sx={{
                    borderRadius: "12px",
                    bgcolor: "#fff",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    boxShadow: "0 10px 26px rgba(16, 35, 63, 0.08)",
                    p: 1.5,
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
                      {prepaymentSectionTitle}
                    </BodyText>
                    {canMutateDrawerContents ? (
                    <IconButton
                      size="small"
                      onClick={() => {
                        beginExistingBookingEdit();
                        setShowPrepayment(false);
                      }}
                      sx={{ color: alpha(m.navy, 0.35) }}
                      aria-label="Remove prepayment"
                    >
                      <CloseRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                    ) : null}
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 1 }}
                  >
                    <BodyText
                      sx={mollureLabelSx(m.navy, {
                        flex: 1,
                        fontWeight: 850,
                        color: alpha(m.navy, 0.62),
                      })}
                    >
                      {prepaymentSectionTitle}:
                    </BodyText>
                    <AppTextField
                      placeholder="%"
                      value={prepaymentPercent}
                      disabled={!canMutateDrawerContents}
                      onChange={(e) => {
                        beginExistingBookingEdit();
                        setPrepaymentPercent(
                          sanitizeDecimalInput(e.target.value),
                        );
                      }}
                      inputProps={{ inputMode: "decimal" }}
                      sx={{ maxWidth: 86 }}
                    />
                    <BodyText
                      sx={{
                        fontSize: 16,
                        fontWeight: 950,
                        color: alpha(m.navy, 0.85),
                      }}
                    >
                      €{prepaymentAmount}
                    </BodyText>
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 1 }}
                  >
                    <BodyText
                      sx={mollureLabelSx(m.navy, {
                        flex: 1,
                        fontWeight: 850,
                        color: alpha(m.navy, 0.55),
                      })}
                    >
                      {isDrawerPrepaymentPaid
                        ? "Remaining after prepaid"
                        : "Remaining after prepayment"}
                    </BodyText>
                    <BodyText
                      sx={{
                        fontSize: 16,
                        fontWeight: 950,
                        color: alpha(m.navy, 0.85),
                      }}
                    >
                      €{remainingAfterPrepayment}
                    </BodyText>
                  </Stack>

                  <Box
                    sx={{
                      mt: 1.25,
                      pt: 1.25,
                      borderTop: `1px solid ${alpha(m.navy, 0.08)}`,
                    }}
                  >
                    <BodyText
                      sx={{
                        ...mollureLabelSx(m.navy),
                        mb: 0.75,
                      }}
                    >
                      Payment method
                    </BodyText>

                    {isDrawerPrepaymentPaid ? (
                      <BodyText
                        sx={{
                          fontSize: 12.75,
                          fontWeight: 850,
                          color: alpha(m.navy, 0.74),
                          py: 0.65,
                        }}
                      >
                        {persistedPaymentIsOffline ||
                        drawerPaymentMethod === "offline"
                          ? "Prepaid â€“ Offline Direct"
                          : "Prepaid â€“ Online Direct"}
                      </BodyText>
                    ) : (
                      (
                        [
                          {
                            key: "online" as const,
                            label: "Online Direct",
                          },
                          {
                            key: "offline" as const,
                            label: "Offline Direct",
                          },
                        ] as const
                      )
                        .filter((pm) => {
                          if (paymentMethodPolicy === "online-only") {
                            return pm.key === "online";
                          }
                          if (paymentMethodPolicy === "offline-only") {
                            return pm.key === "offline";
                          }
                          return true;
                        })
                        .map((pm) => {
                          const active = paymentMethod === pm.key;
                          return (
                            <ButtonBase
                              key={pm.key}
                              disabled={!canMutateDrawerContents}
                              onClick={() => {
                                if (!canMutateDrawerContents) return;
                                beginExistingBookingEdit();
                                setPaymentMethod(pm.key);
                              }}
                              sx={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                py: 0.65,
                                borderRadius: "10px",
                                "&:hover": {
                                  bgcolor: canMutateDrawerContents
                                    ? alpha(m.navy, 0.03)
                                    : "transparent",
                                },
                                "&.Mui-disabled": {
                                  opacity: 1,
                                  cursor: "default",
                                },
                              }}
                            >
                              <BodyText
                                sx={{
                                  fontSize: 12.75,
                                  fontWeight: 850,
                                  color: alpha(m.navy, 0.74),
                                }}
                              >
                                {pm.label}
                              </BodyText>
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "999px",
                                  border: `2px solid ${active ? m.teal : alpha(m.navy, 0.22)}`,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                {active ? (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "999px",
                                      bgcolor: m.teal,
                                    }}
                                  />
                                ) : null}
                              </Box>
                            </ButtonBase>
                          );
                        })
                    )}
                  </Box>
                </Box>
              </>
            ) : null}
    </>
  );
}
