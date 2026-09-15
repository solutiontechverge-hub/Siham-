"use client";

import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  fmtMinutesToTimeLabel,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import {
  bookingParticipantDisplayHeading,
  participantHeadingOrdinal,
  participantOrdinals,
  planningScheduleMeta,
  resolveTeamMemberFirstName,
} from "./buildBookingSummarySections";
import { locationModeChipSx } from "./locationModeChipSx";
import BookingSummaryNote from "./BookingSummaryNote";
import BookingLineAmount from "../calendar/BookingLineAmount";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import { clientLineDiscountLabel } from "../../../data/bookingLinePricing";
import type {
  ClientBookingDraftProduct,
  ClientBookingDraftTeamMember,
  ClientBookingSummarySection,
} from "./types";

function roleLabelForSection(section: {
  isRequester?: boolean;
  participantType?: string;
}) {
  if (section.participantType === "planning") return "PLANNING";
  if (section.participantType === "model") return "MODEL";
  if (section.participantType === "buffer") return "BUFFER";
  if (section.participantType === "guest") return "GUEST";
  if (section.isRequester) return "CLIENT";
  return "CLIENT";
}

type Props = {
  shopName: string;
  dateLabel: string;
  bookingStartMinutes: number;
  bookingEndMinutes: number;
  addressLabel: string;
  isDesired: boolean;
  summarySections: ClientBookingSummarySection[];
  teamMembers?: ClientBookingDraftTeamMember[];
  catalogProducts: ClientBookingDraftProduct[];
  catalogUniqueItems: ClientBookingDraftProduct[];
  clientNote?: string;
};

export default function ClientBookingCreateSummaryServiceCard({
  shopName,
  dateLabel,
  bookingStartMinutes,
  bookingEndMinutes,
  addressLabel,
  isDesired,
  summarySections,
  teamMembers,
  catalogProducts,
  catalogUniqueItems,
  clientNote,
}: Props) {
  const m = useTheme().palette.mollure;
  let serviceCursor = bookingStartMinutes;
  const catalogHeadingSx = mollureLabelSx(m.navy, { mb: 1 });

  return (
    <Box sx={{ px: { xs: 2.25, md: 3.5 }, py: 2 }}>
      <Box
        sx={{
          borderRadius: "12px",
          border: `1px solid ${alpha(m.navy, 0.18)}`,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1.25 }}>
          <Typography
            sx={mollurePageTitleSx(m.navy, {
              textAlign: "center",
              lineHeight: 1.2,
            })}
          >
            Service Summary
          </Typography>
        </Box>
        <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1.35, pb: 1.5 }}>
          <Typography
            sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.2 })}
          >
            {shopName}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mt: 0.85 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.6}
              sx={{ minWidth: 0, flexShrink: 0 }}
            >
              <AccessTimeRoundedIcon
                sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
              />
              <Typography
                sx={mollureLabelSx(m.navy, {
                  color: alpha(m.teal, 0.95),
                  whiteSpace: { xs: "normal", sm: "nowrap" },
                  lineHeight: 1.2,
                })}
              >
                {dateLabel} ({fmtMinutesToTimeLabel(bookingStartMinutes)}-
                {fmtMinutesToTimeLabel(bookingEndMinutes)})
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                ml: "auto",
                maxWidth: { xs: "46%", sm: "50%" },
                flex: "0 1 auto",
                minWidth: 0,
              }}
            >
              <LocationOnOutlinedIcon
                sx={{
                  fontSize: 16,
                  width: 16,
                  height: 16,
                  color: alpha(m.navy, 0.45),
                  flexShrink: 0,
                  display: "block",
                }}
              />
              <Typography
                component="span"
                sx={mollureBodyMutedSx(m.navy, {
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minWidth: 0,
                })}
              >
                {addressLabel}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={isDesired ? "Desired Location" : "Fixed Location"}
            size="small"
            sx={{ ...locationModeChipSx, mt: 0.75 }}
          />
        </Box>

        <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />

        <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
          {summarySections.length > 0 ? (
            <Typography sx={catalogHeadingSx}>Service</Typography>
          ) : null}
          <Stack
            spacing={1.5}
            divider={<Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />}
          >
            {summarySections.map((section) => {
              const roleLabel = roleLabelForSection(section);
              const ordinals = participantOrdinals(summarySections);
              const heading = bookingParticipantDisplayHeading(
                section,
                participantHeadingOrdinal(section, ordinals),
              );
              const planningMeta = planningScheduleMeta(section);
              return (
                <Box key={section.key}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{ mb: 0.75 }}
                  >
                    <Typography
                      sx={mollureLabelSx(m.navy, {
                        fontWeight: 900,
                        fontSize: 13,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                      })}
                    >
                      {heading}
                    </Typography>
                    {section.title &&
                    section.title !== heading &&
                    section.participantType !== "planning" &&
                    section.participantType !== "buffer" &&
                    section.participantType !== "requester" &&
                    !section.isRequester ? (
                      <Typography
                        sx={mollureLabelSx(m.navy, {
                          color: alpha(m.navy, 0.62),
                          lineHeight: 1,
                        })}
                      >
                        {section.title}
                      </Typography>
                    ) : null}
                    {section.isRequester ||
                    section.participantType === "requester" ? (
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 10.5,
                          color: "primary.light",
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {roleLabel}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack spacing={0.85}>
                    {section.planningItem ||
                    planningMeta.timeRange ||
                    section.participantType === "buffer" ||
                    section.participantType === "planning" ? (
                      <Box
                        sx={{
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.06)}`,
                          px: 1.25,
                          py: 1,
                          bgcolor: alpha(m.navy, 0.015),
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            {section.planningItem?.activity &&
                            section.planningItem.activity.toLowerCase() !==
                              "buffer" &&
                            section.planningItem.activity !== heading ? (
                              <Typography
                                sx={mollureLabelSx(m.navy, {
                                  fontWeight: 900,
                                  color: alpha(m.navy, 0.82),
                                  lineHeight: 1.2,
                                })}
                              >
                                {section.planningItem.activity}
                              </Typography>
                            ) : null}
                            {planningMeta.timeRange ||
                            planningMeta.durationLabel ? (
                              <ServiceSummaryMetaLine
                                timeRange={planningMeta.timeRange}
                                durationLabel={planningMeta.durationLabel}
                                staffName={section.teamMemberLabel}
                              />
                            ) : section.planningItem?.duration ? (
                              <Typography
                                sx={{
                                  mt: section.planningItem.activity ? 0.3 : 0,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: alpha(m.navy, 0.48),
                                }}
                              >
                                {section.planningItem.duration}
                              </Typography>
                            ) : null}
                          </Box>
                        </Stack>
                      </Box>
                    ) : null}
                    {section.items.map((item) => {
                      const start = serviceCursor;
                      serviceCursor += item.durationMins;
                      const tmName =
                        resolveTeamMemberFirstName(
                          item.teamMemberId,
                          teamMembers,
                          item.teamMemberName,
                        ) || section.teamMemberLabel;
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.06)}`,
                            px: 1.25,
                            py: 1,
                            bgcolor: alpha(m.navy, 0.015),
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={mollureLabelSx(m.navy, {
                                  fontWeight: 900,
                                  color: alpha(m.navy, 0.82),
                                  lineHeight: 1.2,
                                })}
                              >
                                {item.name}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.3,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: alpha(m.navy, 0.48),
                                }}
                              >
                                {serviceTimeRangeLabel(start, item.durationMins)}{" "}
                                • {item.durationMins} Mins
                              </Typography>
                              {tmName ? (
                                <Box
                                  sx={{
                                    mt: 0.55,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                    height: 24,
                                    px: 0.9,
                                    borderRadius: "8px",
                                    border: `1px solid ${alpha(m.navy, 0.12)}`,
                                    bgcolor: "#fff",
                                    lineHeight: 0,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 13,
                                      height: 13,
                                      display: "grid",
                                      placeItems: "center",
                                      flexShrink: 0,
                                      lineHeight: 0,
                                    }}
                                  >
                                    <PersonOutlineRoundedIcon
                                      sx={{
                                        fontSize: 13,
                                        color: alpha(m.navy, 0.4),
                                        display: "block",
                                      }}
                                    />
                                  </Box>
                                  <Typography
                                    sx={mollureBodyMutedSx(m.navy, {
                                      fontSize: 11,
                                      fontWeight: 700,
                                      lineHeight: 1,
                                      display: "flex",
                                      alignItems: "center",
                                    })}
                                  >
                                    {tmName}
                                  </Typography>
                                </Box>
                              ) : null}
                            </Box>
                            <BookingLineAmount
                              amount={item.price}
                              originalAmount={item.originalPrice}
                              discountLabel={clientLineDiscountLabel(item)}
                            />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
          {catalogProducts.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography sx={catalogHeadingSx}>Product</Typography>
              <Stack spacing={1}>
                {catalogProducts.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                      px: 1.25,
                      py: 1,
                      bgcolor: alpha(m.navy, 0.015),
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        sx={mollureLabelSx(m.navy, {
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.2,
                          minWidth: 0,
                        })}
                      >
                        {product.quantity > 1
                          ? `${product.name} ×${product.quantity}`
                          : product.name}
                      </Typography>
                      <BookingLineAmount
                        amount={product.price}
                        originalAmount={product.originalPrice}
                        discountLabel={clientLineDiscountLabel(product)}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
          {catalogUniqueItems.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography sx={catalogHeadingSx}>Unique item</Typography>
              <Stack spacing={1}>
                {catalogUniqueItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                      px: 1.25,
                      py: 1,
                      bgcolor: alpha(m.navy, 0.015),
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        sx={mollureLabelSx(m.navy, {
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                          lineHeight: 1.2,
                          minWidth: 0,
                        })}
                      >
                        {item.quantity > 1
                          ? `${item.name} ×${item.quantity}`
                          : item.name}
                      </Typography>
                      <BookingLineAmount
                        amount={item.price}
                        originalAmount={item.originalPrice}
                        discountLabel={clientLineDiscountLabel(item)}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
          {clientNote?.trim() ? (
            <Box sx={{ mt: 1.5 }}>
              <BookingSummaryNote note={clientNote} />
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
