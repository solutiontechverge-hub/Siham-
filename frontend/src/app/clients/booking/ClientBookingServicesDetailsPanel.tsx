"use client";

import * as React from "react";
import {
  Box,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import AppButton from "../../../components/common/AppButton";
import { AppDropdown } from "../../../components/common";
import type { Service, TeamMemberSlotOption } from "./booking.page.types";

export type ClientBookingServicesDetailsPanelProps = {
  serviceTab: "assigned" | "unassigned";
  setServiceTab: (tab: "assigned" | "unassigned") => void;
  setSelectedServiceIds: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  assigned: Service[];
  unassigned: Service[];
  filteredTeamMembers: { id: string; name: string }[];
  isDesiredLocation: boolean;
  selectedTeamMemberId: string;
  applySharedTeamMember: (id: string) => void;
  sharedTeamMemberOptions: TeamMemberSlotOption[];
  services: Service[];
  bookServicesAtSameTime: boolean;
  setCombineServices: (value: boolean) => void;
  hasUnassigned: boolean;
  visible: Service[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  unassignService: (id: string) => void;
  updateServiceTeamMember: (serviceId: string, teamMemberId: string) => void;
  getServiceTeamMemberOptions: (service: Service) => TeamMemberSlotOption[];
  selectedServiceIds: Record<string, boolean>;
  toggleServiceSelection: (id: string, checked: boolean) => void;
  removeService: (id: string) => void;
  isModelOrGuestSelected: boolean;
  canDirectAssign: boolean;
  assignSelectedDirect: () => void;
  openAddServiceDialog: () => void;
  canAddService: boolean;
};

export default function ClientBookingServicesDetailsPanel({
  serviceTab,
  setServiceTab,
  setSelectedServiceIds,
  assigned,
  unassigned,
  filteredTeamMembers,
  isDesiredLocation,
  selectedTeamMemberId,
  applySharedTeamMember,
  sharedTeamMemberOptions,
  services,
  bookServicesAtSameTime,
  setCombineServices,
  hasUnassigned,
  visible,
  allVisibleSelected,
  someVisibleSelected,
  unassignService,
  updateServiceTeamMember,
  getServiceTeamMemberOptions,
  selectedServiceIds,
  toggleServiceSelection,
  removeService,
  isModelOrGuestSelected,
  canDirectAssign,
  assignSelectedDirect,
  openAddServiceDialog,
  canAddService,
}: ClientBookingServicesDetailsPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box sx={{ p: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: theme.typography.fontWeightRegular,
            color: m.headingText,
          }}
        >
          Services Details
        </Typography>

        <Tabs
          value={serviceTab}
          onChange={(_, v: "assigned" | "unassigned") => {
            if (v === "unassigned" && unassigned.length === 0) return;
            setServiceTab(v);
            setSelectedServiceIds({});
          }}
          sx={{
            minHeight: 28,
            "& .MuiTabs-indicator": { display: "none" },
            bgcolor: m.white,
            border: `1px solid ${m.fxPillBorder}`,
            borderRadius: "8px",
            p: 0,
            minWidth: 0,
          }}
        >
          <Tab
            value="assigned"
            label={`Assigned (${assigned.length})`}
            sx={{
              minHeight: 28,
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: theme.typography.fontWeightRegular,
              borderRadius: "8px",
              px: 1.25,
              color: m.segmentText,
              "&.Mui-selected": {
                bgcolor: m.segmentSelectedBg,
                color: m.segmentText,
                fontWeight: theme.typography.fontWeightBold,
              },
              "&.Mui-disabled": { opacity: 0.45 },
            }}
          />
          <Tab
            value="unassigned"
            label={`Unassigned (${unassigned.length})`}
            disabled={unassigned.length === 0}
            sx={{
              minHeight: 28,
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: theme.typography.fontWeightRegular,
              borderRadius: "8px",
              px: 1.25,
              color: m.segmentText,
              "&.Mui-selected": {
                bgcolor: m.segmentSelectedBg,
                color: m.segmentText,
                fontWeight: theme.typography.fontWeightBold,
              },
              "&.Mui-disabled": { opacity: 0.45, cursor: "not-allowed" },
            }}
          />
        </Tabs>
      </Stack>

      {/* Desired: one shared team member. Fixed: shared picker on Unassigned tab only. */}
      {filteredTeamMembers.length > 0 &&
      (isDesiredLocation || serviceTab === "unassigned") ? (
        <Box sx={{ mb: 1.25, maxWidth: 240 }} onClick={(e) => e.stopPropagation()}>
          <AppDropdown
            value={selectedTeamMemberId}
            onChange={(val) => applySharedTeamMember(String(val ?? ""))}
            options={[
              { value: "", label: "Any team member" },
              ...sharedTeamMemberOptions,
            ]}
            placeholder="Any team member"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <PersonOutlineRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: alpha(m.navy, 0.45),
                    ml: 0.5,
                    mr: 0.25,
                    display: "block",
                    alignSelf: "center",
                  }}
                />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.62),
                alignItems: "center",
              },
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </Box>
      ) : null}

      {!isDesiredLocation && services.length > 1 ? (
        <FormControlLabel
          sx={{ mb: 1.25, ml: 0, alignItems: "flex-start" }}
          control={
            <Switch
              size="small"
              checked={bookServicesAtSameTime}
              onChange={(e) => setCombineServices(e.target.checked)}
              sx={{
                mt: 0.15,
                "& .MuiSwitch-switchBase.Mui-checked": { color: m.teal },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: m.teal,
                },
              }}
            />
          }
          label={
            <Stack spacing={0.15}>
              <Typography sx={mollureBodySx(m.navy, { fontWeight: 800 })}>
                Book services at the same time
              </Typography>
              <Typography sx={{ fontSize: 11, color: alpha(m.navy, 0.48) }}>
                Duration uses the longest service instead of adding them sequentially.
              </Typography>
            </Stack>
          }
        />
      ) : null}

      {hasUnassigned && serviceTab === "unassigned" && visible.length > 1 ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          sx={{ mb: 1 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const next: Record<string, boolean> = {};
                  for (const s of visible) next[s.id] = checked;
                  setSelectedServiceIds(next);
                }}
                sx={{
                  "&.Mui-checked": { color: m.teal },
                  color: alpha(m.navy, 0.35),
                }}
              />
            }
            label={
              <Typography
                sx={mollureLabelSx(m.navy)}
              >
                Select All
              </Typography>
            }
            sx={{ mr: 0 }}
          />
        </Stack>
      ) : null}

      <Stack spacing={1}>
        {visible.map((s) => {
          const showAssignedServiceCard =
            serviceTab === "assigned" && Boolean(s.guestId);

          if (showAssignedServiceCard) {
            return (
              <Paper
                key={s.id}
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.12)}`,
                  px: 1.5,
                  py: 1.35,
                  bgcolor: "#fff",
                }}
              >
                <Stack spacing={1.25}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={mollureSectionTitleSx(m.navy, {
                        fontSize: 13.5,
                        lineHeight: 1.2,
                      })}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.48),
                        mt: 0.35,
                      }}
                    >
                      {s.durationMins} Mins
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{ flexShrink: 0 }}
                  >
                      <Box sx={{ textAlign: "right" }}>
                        {typeof s.originalPrice === "number" ? (
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.38),
                              textDecoration: "line-through",
                              lineHeight: 1.1,
                            }}
                          >
                            {s.originalPrice} €
                          </Typography>
                        ) : null}
                        <Typography
                          sx={mollureSectionTitleSx(m.navy, {
                            fontSize: 14,
                            lineHeight: 1.15,
                            mt: typeof s.originalPrice === "number" ? 0.15 : 0,
                          })}
                        >
                          {s.price} €
                        </Typography>
                        {typeof s.discountPct === "number" ? (
                          <Typography
                            sx={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: m.teal,
                              mt: 0.2,
                            }}
                          >
                            {s.discountPct}% Discount
                          </Typography>
                        ) : null}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          unassignService(s.id);
                        }}
                        sx={{
                          width: 22,
                          height: 22,
                          p: 0,
                          color: alpha(m.navy, 0.38),
                          "&:hover": {
                            bgcolor: "transparent",
                            color: alpha(m.navy, 0.62),
                          },
                        }}
                        aria-label={`Remove ${s.name}`}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                  </Stack>
                </Stack>
                    {!isDesiredLocation ? (
                      <Box
                        sx={{ maxWidth: 200 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AppDropdown
                          value={s.teamMemberId ?? ""}
                          onChange={(val) =>
                            updateServiceTeamMember(s.id, String(val ?? ""))
                          }
                          options={getServiceTeamMemberOptions(s)}
                          placeholder="Team member"
                          size="small"
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <PersonOutlineRoundedIcon
                                sx={{
                                  fontSize: 14,
                                  color: alpha(m.navy, 0.45),
                                  ml: 0.25,
                                  mr: 0.15,
                                  display: "block",
                                  alignSelf: "center",
                                }}
                              />
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              bgcolor: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.72),
                              minHeight: 28,
                              height: 28,
                              alignItems: "center",
                            },
                            "& .MuiOutlinedInput-input": {
                              py: 0,
                              px: 0.5,
                              display: "flex",
                              alignItems: "center",
                              height: 28,
                              lineHeight: "28px",
                            },
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              minHeight: 28,
                              height: 28,
                              py: 0,
                              lineHeight: "28px",
                            },
                            "& .MuiSelect-icon": {
                              fontSize: 18,
                              right: 6,
                              top: "50%",
                              transform: "translateY(-50%)",
                            },
                          }}
                        />
                      </Box>
                    ) : null}
                </Stack>
              </Paper>
            );
          }

          return (
            <Paper
              key={s.id}
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                px: 1.25,
                py: 1.1,
                bgcolor: "#fff",
                cursor: "default",
                transition:
                  "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
                "&:hover": {
                  borderColor: alpha(m.teal, 0.35),
                  boxShadow: "0 6px 18px rgba(16, 35, 63, 0.06)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={mollureLabelSx(m.navy, {
                      fontWeight: 900,
                      color: alpha(m.navy, 0.82),
                      lineHeight: 1.2,
                    })}
                  >
                    {s.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.45),
                      mt: 0.25,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.durationMins} Mins
                  </Typography>
                  {typeof s.originalPrice === "number" ||
                  typeof s.discountPct === "number" ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ mt: 0.35 }}
                    >
                      {typeof s.originalPrice === "number" ? (
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.45),
                            textDecoration: "line-through",
                          }}
                        >
                          {s.originalPrice} €
                        </Typography>
                      ) : null}
                      {typeof s.discountPct === "number" ? (
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: m.teal,
                          }}
                        >
                          {s.discountPct}% Discount
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Box>

                <Typography
                  sx={mollureLabelSx(m.navy, {
                    fontWeight: 900,
                    color: alpha(m.navy, 0.82),
                    lineHeight: 1.2,
                    flexShrink: 0,
                  })}
                >
                  {s.price} €
                </Typography>

                <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
                  {serviceTab === "unassigned" ? (
                    <Checkbox
                      size="small"
                      checked={Boolean(selectedServiceIds[s.id])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        toggleServiceSelection(s.id, e.target.checked)
                      }
                      sx={{
                        p: 0.25,
                        "&.Mui-checked": { color: m.teal },
                        color: alpha(m.navy, 0.35),
                      }}
                    />
                  ) : null}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (serviceTab === "assigned") {
                        unassignService(s.id);
                        return;
                      }
                      removeService(s.id);
                    }}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.03),
                      color: alpha(m.navy, 0.45),
                    }}
                    aria-label={`Remove ${s.name}`}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {visible.length === 0 ? (
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.45),
              py: 1,
            }}
          >
            {serviceTab === "unassigned"
              ? "No unassigned services."
              : isModelOrGuestSelected
                ? "No services selected yet. Use Service to assignment list below."
                : "No services assigned to this person yet."}
          </Typography>
        ) : null}
      </Stack>

      {serviceTab === "unassigned" && canDirectAssign ? (
        <Box sx={{ mt: 1.25 }}>
          <AppButton
            tone="primary"
            fullWidth
            onClick={assignSelectedDirect}
            sx={{
              height: 40,
            }}
          >
            Assign
          </AppButton>
        </Box>
      ) : null}

      <ButtonBase
        onClick={openAddServiceDialog}
        disabled={!canAddService}
        sx={{
          mt: 1.25,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 0.75,
          borderRadius: "8px",
          py: 0.25,
          opacity: canAddService ? 1 : 0.45,
          cursor: canAddService ? "pointer" : "not-allowed",
          verticalAlign: "middle",
        }}
      >
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: "999px",
            bgcolor: m.addSoftBg,
            color: m.addSoftFg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            lineHeight: 0,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 14, display: "block" }} />
        </Box>
        <Typography
          component="span"
          sx={{
            fontSize: 11,
            fontWeight: 800,
            lineHeight: "18px",
            height: 18,
            color: m.addSoftFg,
            display: "flex",
            alignItems: "center",
            m: 0,
            p: 0,
          }}
        >
          service to assignment list
        </Typography>
      </ButtonBase>
    </Box>
  );
}
