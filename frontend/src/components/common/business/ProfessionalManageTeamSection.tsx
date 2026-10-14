"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Popover,
  Rating,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Typography } from "../../ui/typography";
import { clientReviewsHref } from "../../../data/clientProfessionalReviews";
import { TEAM_MEMBER_DRAFT_PREVIEW_ID } from "../../../data/businessTeamMemberModal.data";
import type { TeamMemberUi } from "../../../app/professionals/fixed-location/businessTeamMemberModal.use";
import {
  addSoftIconButtonSx,
  SectionShell,
} from "./professionalFixedLocationSetupShell";

type TeamServiceGroup = {
  categoryId: string;
  categoryTitle: string;
  subServices: readonly { id: string; label: string }[];
};

type TeamServiceMenuState = {
  anchorEl: HTMLElement;
  menuKey: string;
  groups?: Array<{
    categoryTitle: string;
    items: Array<{ id: string; label: string }>;
  }>;
  items?: Array<{ id: string; label: string }>;
} | null;

export type ProfessionalManageTeamSectionProps = {
  m: Theme["palette"]["mollure"];
  title: string;
  featureTeamPublic: boolean;
  setFeatureTeamPublic: React.Dispatch<React.SetStateAction<boolean>>;
  manageTeamDisabled: boolean;
  teamMembers: TeamMemberUi[];
  teamMemberModal: {
    openAdd: () => void;
    openEdit: (mem: TeamMemberUi) => void;
    deleteMember: (id: string) => void;
  };
  businessSetupId: string | number | null | undefined;
  toPersistedTeamMemberId: (id: string) => string | undefined;
  getMemberAssignedServiceIds: (services: TeamMemberUi["services"]) => string[];
  memberProvidesAllServices: (services: TeamMemberUi["services"]) => boolean;
  buildTeamMemberServiceGroups: (
    services: TeamMemberUi["services"],
  ) => TeamServiceGroup[];
  teamServiceMenu: TeamServiceMenuState;
  setTeamServiceMenu: React.Dispatch<React.SetStateAction<TeamServiceMenuState>>;
};

export function ProfessionalManageTeamSection({
  m,
  title,
  featureTeamPublic,
  setFeatureTeamPublic,
  manageTeamDisabled,
  teamMembers,
  teamMemberModal,
  businessSetupId,
  toPersistedTeamMemberId,
  getMemberAssignedServiceIds,
  memberProvidesAllServices,
  buildTeamMemberServiceGroups,
  teamServiceMenu,
  setTeamServiceMenu,
}: ProfessionalManageTeamSectionProps) {
  const router = useRouter();
  const businessSetupData = businessSetupId != null ? { id: businessSetupId } : null;
  const data = { manageTeam: { title } };
  return (
      <SectionShell
        title={
          <Typography
            sx={{
              fontWeight: 700,
              color: alpha(m.navy, 0.9),
              fontSize: 20,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.manageTeam.title}
          </Typography>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Checkbox
                  checked={featureTeamPublic}
                  onChange={(e) => setFeatureTeamPublic(e.target.checked)}
                  disabled={manageTeamDisabled}
                  sx={{
                    color: alpha(m.navy, 0.28),
                    "&.Mui-checked": { color: "primary.main" },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  Feature team on public profile
                </Typography>
              }
            />
            <IconButton
              onClick={teamMemberModal.openAdd}
              size="small"
              disabled={manageTeamDisabled}
              sx={addSoftIconButtonSx(m, 32)}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          {teamMembers.map((mem, memIndex) => (
            <Paper
              key={mem.id}
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                px: 2,
                py: 1.5,
              }}
            >
              <Stack
                direction="row"
                alignItems="stretch"
                sx={{ width: "100%" }}
              >
                {/* Left – profile */}
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 0,
                    maxWidth: 240,
                    pr: 2,
                    borderRight: `1px solid ${alpha(m.navy, 0.1)}`,
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
                      flex: "0 0 auto",
                    }}
                  >
                    {mem.photoSrc ? (
                      <Image
                        src={mem.photoSrc}
                        alt={mem.name}
                        width={48}
                        height={48}
                        unoptimized
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 20,
                        color: alpha(m.navy, 0.88),
                        lineHeight: 1.35,
                      }}
                    >
                      {mem.name}
                    </Typography>
                    <ButtonBase
                      disabled={
                        mem.id === TEAM_MEMBER_DRAFT_PREVIEW_ID ||
                        !businessSetupData?.id
                      }
                      onClick={() => {
                        if (!businessSetupData?.id) return;
                        const persistedId = toPersistedTeamMemberId(mem.id);
                        router.push(
                          clientReviewsHref(
                            String(businessSetupData.id),
                            persistedId,
                            { returnTo: "/professionals/profile" },
                          ),
                        );
                      }}
                      sx={{
                        mt: 0.35,
                        borderRadius: "6px",
                        px: 0.25,
                        py: 0.15,
                        "&:hover": { bgcolor: alpha(m.teal, 0.06) },
                        "&.Mui-disabled": { opacity: 0.55 },
                      }}
                      aria-label={`View reviews for ${mem.name}`}
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                      >
                        <Rating
                          value={mem.rating}
                          precision={0.5}
                          readOnly
                          size="small"
                          sx={{
                            fontSize: 14,
                            pointerEvents: "none",
                            "& .MuiRating-iconFilled": { color: "#FAAF00" },
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            color: alpha(m.navy, 0.5),
                            fontWeight: 500,
                          }}
                        >
                          {mem.reviewsLabel}
                        </Typography>
                      </Stack>
                    </ButtonBase>
                  </Box>
                </Stack>

                {/* Middle – assigned services grouped by category */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    px: 2,
                    py: 0.25,
                    borderRight: `1px solid ${alpha(m.navy, 0.1)}`,
                    alignSelf: "center",
                  }}
                >
                  {(() => {
                    const assignedIds = getMemberAssignedServiceIds(
                      mem.services,
                    );
                    if (assignedIds.length === 0) {
                      return (
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: alpha(m.navy, 0.42),
                          }}
                        >
                          No services assigned
                        </Typography>
                      );
                    }

                    const showsAllServices = memberProvidesAllServices(
                      mem.services,
                    );
                    const serviceGroups = buildTeamMemberServiceGroups(
                      mem.services,
                    );

                    const renderServiceChip = (
                      label: string,
                      menuKey: string,
                      count: number | undefined,
                      onOpen: (anchorEl: HTMLElement) => void,
                    ) => {
                      const isOpen = teamServiceMenu?.menuKey === menuKey;
                      const displayLabel =
                        count != null ? `${label}(${count})` : label;
                      const chipDisabled = manageTeamDisabled;
                      return (
                        <Box
                          key={menuKey}
                          component="button"
                          type="button"
                          disabled={chipDisabled}
                          onClick={(e) => {
                            if (chipDisabled) return;
                            onOpen(e.currentTarget);
                          }}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 0.75,
                            width: { xs: "100%", sm: 220 },
                            minWidth: { xs: 0, sm: 220 },
                            maxWidth: { xs: "100%", sm: 220 },
                            minHeight: 46,
                            height: 46,
                            px: 1.75,
                            py: 0,
                            borderRadius: "10px",
                            border: `1.5px solid ${
                              chipDisabled
                                ? alpha(m.navy, 0.1)
                                : isOpen
                                  ? alpha(m.teal, 0.45)
                                  : alpha(m.teal, 0.22)
                            }`,
                            bgcolor: chipDisabled
                              ? alpha(m.navy, 0.02)
                              : "#fff",
                            cursor: chipDisabled ? "not-allowed" : "pointer",
                            font: "inherit",
                            color: chipDisabled
                              ? alpha(m.navy, 0.38)
                              : alpha(m.navy, 0.82),
                            whiteSpace: "nowrap",
                            flex: "0 0 auto",
                            boxSizing: "border-box",
                            boxShadow: chipDisabled
                              ? "none"
                              : isOpen
                                ? `0 8px 20px ${alpha(m.teal, 0.14)}`
                                : "0 2px 8px rgba(16, 35, 63, 0.06)",
                            opacity: chipDisabled ? 0.72 : 1,
                            "&:hover": chipDisabled
                              ? undefined
                              : {
                                  borderColor: alpha(m.teal, 0.42),
                                  bgcolor: alpha(m.teal, 0.03),
                                },
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              lineHeight: 1,
                              color: "inherit",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {displayLabel}
                          </Typography>
                          <KeyboardArrowDownRoundedIcon
                            sx={{
                              fontSize: 18,
                              color: alpha(m.navy, 0.4),
                              flexShrink: 0,
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </Box>
                      );
                    };

                    return (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        {showsAllServices
                          ? renderServiceChip(
                              "All services",
                              `${mem.id}:all`,
                              undefined,
                              (anchorEl) =>
                                setTeamServiceMenu({
                                  anchorEl,
                                  menuKey: `${mem.id}:all`,
                                  groups: serviceGroups.map((group) => ({
                                    categoryTitle: group.categoryTitle,
                                    items: group.subServices.map((sub) => ({
                                      id: sub.id,
                                      label: sub.label,
                                    })),
                                  })),
                                }),
                            )
                          : serviceGroups.map((group) =>
                              renderServiceChip(
                                group.categoryTitle,
                                `${mem.id}:${group.categoryId}`,
                                group.subServices.length,
                                (anchorEl) =>
                                  setTeamServiceMenu({
                                    anchorEl,
                                    menuKey: `${mem.id}:${group.categoryId}`,
                                    items: group.subServices.map((sub) => ({
                                      id: sub.id,
                                      label: sub.label,
                                    })),
                                  }),
                              ),
                            )}
                      </Box>
                    );
                  })()}
                </Box>

                {/* Right – actions */}
                <Stack
                  spacing={1}
                  alignItems="center"
                  justifyContent="flex-start"
                  sx={{ flex: "0 0 auto", pl: 1.5, pr: 0.5, pt: 0.5 }}
                >
                  <IconButton
                    size="small"
                    onClick={() => teamMemberModal.openEdit(mem)}
                    disabled={
                      manageTeamDisabled ||
                      mem.id === TEAM_MEMBER_DRAFT_PREVIEW_ID
                    }
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.06),
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      "&:hover": { bgcolor: alpha(m.navy, 0.1) },
                    }}
                  >
                    <EditRoundedIcon
                      sx={{ fontSize: 17, color: alpha(m.navy, 0.48) }}
                    />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => teamMemberModal.deleteMember(mem.id)}
                    disabled={manageTeamDisabled}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.06),
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      "&:hover": { bgcolor: alpha(m.navy, 0.1) },
                    }}
                  >
                    <DeleteOutlineRoundedIcon
                      sx={{ fontSize: 17, color: alpha(m.navy, 0.48) }}
                    />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Popover
          anchorEl={teamServiceMenu?.anchorEl}
          open={Boolean(teamServiceMenu)}
          onClose={() => setTeamServiceMenu(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                p: 1,
                borderRadius: "12px",
                border: `1px solid ${alpha(m.teal, 0.18)}`,
                boxShadow: "0 14px 32px rgba(16, 35, 63, 0.14)",
                minWidth: 200,
                maxWidth: 300,
              },
            },
          }}
        >
          <Stack spacing={0.75}>
            {teamServiceMenu?.groups
              ? teamServiceMenu.groups.map((group) => (
                  <Box key={group.categoryTitle}>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.48),
                        px: 0.5,
                        mb: 0.5,
                      }}
                    >
                      {group.categoryTitle}
                    </Typography>
                    <Stack spacing={0.65}>
                      {group.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            px: 1.35,
                            py: 1,
                            borderRadius: "10px",
                            bgcolor: "#fff",
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
                            boxShadow: "0 4px 14px rgba(16, 35, 63, 0.08)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: alpha(m.navy, 0.55),
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))
              : teamServiceMenu?.items?.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      px: 1.35,
                      py: 1,
                      borderRadius: "10px",
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      boxShadow: "0 4px 14px rgba(16, 35, 63, 0.08)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.55),
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ))}
          </Stack>
        </Popover>
      </SectionShell>
  );
}
