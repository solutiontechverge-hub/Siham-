"use client";

import * as React from "react";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import {
  Divider,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import AppButton from "../../AppButton";

import {
  canCheckoutProtectiveFee,
} from "../bookingGroupAddOns";

import {
  resolveProfessionalBookingActions,
  showProfessionalActionMenu,
} from "../bookingStatusActions";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActionsBag = Pick<
  Vm,
  | "bookingActionAnchor"
  | "businessResponseWindowInput"
  | "handleBookingActionSelect"
  | "lateCancellationFeeAmount"
  | "m"
  | "noShowFeeAmount"
  | "setBookingActionAnchor"
  | "showLateCancellation"
  | "showNoShowFee"
  | "viewingBookingEvent"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActionsBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActions({ bag }: Props) {
  const {
    bookingActionAnchor,
    businessResponseWindowInput,
    handleBookingActionSelect,
    lateCancellationFeeAmount,
    m,
    noShowFeeAmount,
    setBookingActionAnchor,
    showLateCancellation,
    showNoShowFee,
    viewingBookingEvent,
  } = bag;

  if (!viewingBookingEvent) return null;

  return (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <BodyText
                sx={{
                  fontWeight: 900,
                  color: alpha(m.navy, 0.88),
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Booking Details
              </BodyText>
              {(() => {
                return showProfessionalActionMenu(
                  viewingBookingEvent,
                  { responseTime: businessResponseWindowInput },
                ) ? (
                <>
                  <AppButton
                    onClick={(e) =>
                      setBookingActionAnchor(e.currentTarget)
                    }
                    endIcon={
                      <KeyboardArrowDownRoundedIcon
                        sx={{ fontSize: 18 }}
                      />
                    }
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 800,
                      height: 34,
                      px: 1.5,
                      color: alpha(m.navy, 0.72),
                      bgcolor: alpha(m.navy, 0.04),
                      "&:hover": { bgcolor: alpha(m.navy, 0.08) },
                    }}
                  >
                    Actions
                  </AppButton>
                  <Menu
                    anchorEl={bookingActionAnchor}
                    open={Boolean(bookingActionAnchor)}
                    onClose={() => setBookingActionAnchor(null)}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 0.5,
                          minWidth: 180,
                          borderRadius: "12px",
                          border: `1px solid ${alpha(m.navy, 0.1)}`,
                          boxShadow:
                            "0 14px 30px rgba(16, 35, 63, 0.12)",
                        },
                      },
                    }}
                  >
                    {(() => {
                      const protectiveFeeCheckoutApplicable =
                        canCheckoutProtectiveFee({
                          status: viewingBookingEvent.status,
                          showLateCancellation,
                          lateCancellationFeeAmount,
                          showNoShowFee,
                          noShowFeeAmount,
                        });
                      const actions =
                        resolveProfessionalBookingActions(
                          viewingBookingEvent,
                          {
                            protectiveFeeCheckoutApplicable,
                            responseTime:
                              businessResponseWindowInput,
                          },
                        );
                      const itemSx = {
                        fontWeight: 800,
                        fontSize: 13.5,
                        color: alpha(m.navy, 0.78),
                        py: 1.1,
                      } as const;
                      const items: React.ReactNode[] = [];
                      if (actions.edit) {
                        items.push(
                          <MenuItem
                            key="edit"
                            onClick={() =>
                              void handleBookingActionSelect("edit")
                            }
                            sx={itemSx}
                          >
                            Edit Booking
                          </MenuItem>,
                        );
                      }
                      if (actions.cancel) {
                        items.push(
                          <MenuItem
                            key="cancel"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "cancel",
                              )
                            }
                            sx={itemSx}
                          >
                            Cancel Booking
                          </MenuItem>,
                        );
                      }
                      if (actions.discard) {
                        items.push(
                          <MenuItem
                            key="discard"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "discard",
                              )
                            }
                            sx={itemSx}
                          >
                            Discard
                          </MenuItem>,
                        );
                      }
                      if (actions.in_progress) {
                        items.push(
                          <MenuItem
                            key="in_progress"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "in_progress",
                              )
                            }
                            sx={itemSx}
                          >
                            In Progress
                          </MenuItem>,
                        );
                      }
                      if (actions.no_show) {
                        items.push(
                          <MenuItem
                            key="no_show"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "no_show",
                              )
                            }
                            sx={itemSx}
                          >
                            No Show
                          </MenuItem>,
                        );
                      }
                      if (actions.checkout) {
                        const checkoutLabel =
                          viewingBookingEvent.status ===
                            "Cancelled" ||
                          viewingBookingEvent.status === "No Show"
                            ? "Send fee checkout"
                            : "Checkout";
                        items.push(
                          <MenuItem
                            key="checkout"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "checkout",
                              )
                            }
                            sx={itemSx}
                          >
                            {checkoutLabel}
                          </MenuItem>,
                        );
                      }
                      if (actions.rebook) {
                        items.push(
                          <MenuItem
                            key="rebook"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "rebook",
                              )
                            }
                            sx={itemSx}
                          >
                            Rebook
                          </MenuItem>,
                        );
                      }
                      if (actions.ok) {
                        items.push(
                          <MenuItem
                            key="ok"
                            onClick={() =>
                              void handleBookingActionSelect("ok")
                            }
                            sx={itemSx}
                          >
                            OK
                          </MenuItem>,
                        );
                      }
                      if (actions.delete) {
                        items.push(
                          <MenuItem
                            key="delete"
                            onClick={() =>
                              void handleBookingActionSelect(
                                "delete",
                              )
                            }
                            sx={itemSx}
                          >
                            Delete
                          </MenuItem>,
                        );
                      }
                      return items.flatMap((item, index) =>
                        index === 0
                          ? [item]
                          : [
                              <Divider
                                key={`div-${index}`}
                                sx={{ my: "0 !important" }}
                              />,
                              item,
                            ],
                      );
                    })()}
                  </Menu>
                </>
                ) : null;
              })()}
            </Stack>
  );
}
