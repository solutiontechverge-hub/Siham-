"use client";

import * as React from "react";
import RemoteAwareImage from "../RemoteAwareImage";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, ButtonBase, Paper, Stack, Typography } from "@mui/material";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import AppDropdown from "../AppDropdown";
import { clientReviewsHref } from "../../../data/clientProfessionalReviews";
import { SectionCard } from "./BusinessPublicProfileSections";

export function BusinessPublicProfileTeamBlock(props: {
  data: BusinessPublicProfileData;
  visibleTeamMembers: BusinessPublicProfileData["teamMembers"];
  memberSlotSelections: Record<string, string>;
  setMemberSlotSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const {
    data,
    visibleTeamMembers,
    memberSlotSelections,
    setMemberSlotSelections,
  } = props;
  const m = useTheme().palette.mollure;
  const router = useRouter();
  return (
        <SectionCard title="Our Professional Team">
          <Stack spacing={1.25}>
            {visibleTeamMembers.length === 0 ? (
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.5),
                }}
              >
                No team members available for this location type.
              </Typography>
            ) : null}
            {visibleTeamMembers.map((member) => (
              <Paper
                key={member.id}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: "#fff",
                  px: { xs: 1.25, sm: 2 },
                  py: 1.5,
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={{ xs: 1.25, md: 0 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{
                      flex: "0 0 auto",
                      minWidth: 0,
                      maxWidth: { md: 240 },
                      pr: { md: 2 },
                      borderRight: { md: `1px solid ${alpha(m.navy, 0.1)}` },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "999px",
                        overflow: "hidden",
                        bgcolor: alpha(m.navy, 0.06),
                        border: `1px solid ${alpha(m.navy, 0.1)}`,
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {member.avatarUrl ? (
                        <RemoteAwareImage
                          src={member.avatarUrl}
                          alt={member.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : null}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: alpha(m.navy, 0.88),
                          lineHeight: 1.35,
                        }}
                      >
                        {member.name}
                      </Typography>
                      <ButtonBase
                        onClick={() =>
                          router.push(
                            clientReviewsHref(data.shopId, member.id, {
                              returnTo: `/clients/listing/${encodeURIComponent(data.shopId)}`,
                            }),
                          )
                        }
                        sx={{
                          mt: 0.35,
                          borderRadius: "6px",
                          px: 0.25,
                          py: 0.15,
                          "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                        }}
                        aria-label={`View reviews for ${member.name}`}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.25}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarRoundedIcon
                              key={i}
                              sx={{
                                fontSize: 14,
                                color:
                                  i < Math.round(member.rating)
                                    ? m.star
                                    : alpha(m.navy, 0.15),
                              }}
                            />
                          ))}
                          <Typography
                            sx={{
                              ml: 0.25,
                              fontSize: 10.5,
                              fontWeight: 500,
                              color: alpha(m.navy, 0.5),
                            }}
                          >
                            ({member.reviewsCount > 0
                              ? `${member.reviewsCount} Reviews`
                              : "No reviews"})
                          </Typography>
                        </Stack>
                      </ButtonBase>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      px: { md: 1 },
                      py: { xs: 0, md: 0.25 },
                    }}
                  >
                    {member.serviceSlots.length > 0 ? (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {member.serviceSlots.map((slot) => {
                          const slotKey = `${member.id}:${slot.id}`;
                          return (
                            <Box
                              key={slot.id}
                              sx={{
                                flex: {
                                  sm:
                                    member.serviceSlots.length > 1
                                      ? "1 1 calc(50% - 8px)"
                                      : "1 1 100%",
                                },
                                minWidth: {
                                  sm:
                                    member.serviceSlots.length > 1 ? 0 : "100%",
                                },
                                width: "100%",
                              }}
                            >
                              <AppDropdown
                                value={
                                  memberSlotSelections[slotKey] ??
                                  slot.defaultValue
                                }
                                onChange={(val) => {
                                  const next = Array.isArray(val)
                                    ? val[0]
                                    : String(val ?? "");
                                  setMemberSlotSelections((prev) => ({
                                    ...prev,
                                    [slotKey]: next,
                                  }));
                                }}
                                options={slot.options}
                                placeholder={slot.label}
                                size="small"
                                fullWidth
                                renderValue={() => (
                                  <span style={{ color: alpha(m.navy, 0.62) }}>
                                    {slot.label}
                                  </span>
                                )}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <AppDropdown
                        value=""
                        onChange={() => {}}
                        options={[]}
                        placeholder={
                          member.allCategoriesPlaceholder ??
                          "All Categories and services"
                        }
                        size="small"
                        fullWidth
                        disabled
                      />
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>
  );
}
