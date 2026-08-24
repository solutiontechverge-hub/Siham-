"use client";

import * as React from "react";
import AppButton from "../../../components/common/AppButton";
import {
  Box,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ModeEditOutlineRoundedIcon from "@mui/icons-material/ModeEditOutlineRounded";
import { AppDropdown } from "../../../components/common";
import AppModal from "../../../components/common/AppModal";
import EditRequestNoteDialog from "../../../components/common/client-booking/EditRequestNoteDialog";
import { ServiceSummaryMetaLine } from "../../../components/common/ServiceSummaryMetaLine";
import {
  CLIENT_BOOKING_MIN_LEAD_ERROR,
  fmtMinutesToTimeLabel,
  serviceTimeRangeLabel,
} from "./booking-time";

import { useClientBookingCreatePage } from "./useClientBookingCreatePage";
import type { BookingPerson } from "./booking.page.types";
import { resolveMediaUrl } from "../../../lib/resolveMediaUrl";

export default function ClientBookingCreateView() {
  const {
    router,
    searchParams,
    fromProfile,
    profileHydrationToken,
    isEbrSuggest,
    ebrFocus,
    isConfirmedEbrEdit,
    showSnackbar,
    theme,
    m,
    user,
    profileQueryData,
    requesterDisplayName,
    shop,
    setShop,
    businessSetups,
    bookingSetup,
    createBooking,
    uploadBookingAttachments,
    isContinuing,
    setIsContinuing,
    startOfDay,
    today0,
    isPastDay,
    toISO,
    addDays,
    addMonths,
    startOfWeekMon,
    fmtDow,
    selectedDate,
    setSelectedDate,
    monthPickerAnchor,
    setMonthPickerAnchor,
    weekStart,
    weekDays,
    monthLabel,
    monthPickerYear,
    monthPickerMonth,
    setMonthYear,
    allDayTimes,
    isDayNotAvailable,
    isDayUnselectable,
    getDayClosedNote,
    selectedDayNotAvailable,
    selectedDayClosedNote,
    isSelectedToday,
    nowTick,
    setNowTick,
    nowMinutes,
    minBookableMinutes,
    times,
    availableTimes,
    isTimeUnavailable,
    timeScrollRef,
    scrollTimeSlots,
    people,
    setPeople,
    draggingPersonId,
    setDraggingPersonId,
    shopTeamMembers,
    setShopTeamMembers,
    getPreferredServiceTab,
    services,
    profileHydrated,
    setProfileHydrated,
    hydrationSignatureRef,
    selectedTime,
    setSelectedTime,
    timeValidationError,
    setTimeValidationError,
    selectedTimeTooSoon,
    combineServices,
    setCombineServices,
    bookServicesAtSameTime,
    selectedPersonId,
    setSelectedPersonId,
    selectedTeamMemberId,
    setSelectedTeamMemberId,
    serviceTab,
    setServiceTab,
    selectedServiceIds,
    setSelectedServiceIds,
    addServiceDialogOpen,
    setAddServiceDialogOpen,
    addServiceCatalogIds,
    addServiceCatalogQty,
    toggleAddServiceCatalog,
    adjustAddServiceCatalogQty,
    ebrSuggestBaselineRef,
    projectDescription,
    setProjectDescription,
    projectUploads,
    setProjectUploads,
    participantMenuAnchor,
    setParticipantMenuAnchor,
    planningPersonId,
    setPlanningPersonId,
    planningActivity,
    setPlanningActivity,
    planningDuration,
    setPlanningDuration,
    clientNote,
    setClientNote,
    projectFileInputRef,
    locationMode,
    isDesiredLocation,
    isCompanyClient,
    showProjectDetails,
    getParticipantLabel,
    isPlanningPerson,
    selectedPerson,
    isPlanningCardSelected,
    filteredTeamMembers,
    sharedTeamMemberOptions,
    getServiceTeamMemberOptions,
    hasAssignableTeamMembers,
    additionalGuests,
    canAddFixedLocationGuest,
    serviceAssignees,
    canAddService,
    addServiceCatalog,
    serviceCountLabel,
    personCardSubtitle,
    updateGuestName,
    selectedServicesCount,
    requiresPersonAssignment,
    allServicesAssigned,
    needsTeamMemberProvidedByPro,
    assigned,
    unassigned,
    isModelOrGuestSelected,
    selectedUnassignedServices,
    canDirectAssign,
    visible,
    assignSelectedDirect,
    openAddServiceDialog,
    confirmAddService,
    applySharedTeamMember,
    updateServiceTeamMember,
    unassignService,
    removeService,
    toggleServiceSelection,
    onContinue,
    continueLabel,
    hasUnassigned,
    allVisibleSelected,
    someVisibleSelected,
    total,
    bookingStartMinutes,
    bookingDurationMinutes,
    bookingEndMinutes,
    summaryGroups,
    teamMemberNameById,
    guestNameById,
    teamMemberFirstName,
    resolveServiceTeamMemberName,
    summarySections,
    applyProfileSelection,
    reorderPeople,
    syncPlanningDraftToPerson,
    selectPlanningCard,
    selectNonPlanningPerson,
    addParticipant,
    savePlanning,
    startPlanningEdit,
    planningFormIsLocked,
    handleProjectFilePick,
    deleteProjectUpload,
    deleteGuest,
  } = useClientBookingCreatePage();
  const [noteDialogOpen, setNoteDialogOpen] = React.useState(false);

  const planningCardDetails = (person: BookingPerson) => {
    if (!person.planningIsLocked) return { duration: "" };
    return { duration: person.planningDuration?.trim() ?? "" };
  };

  const renderPlanningCardSubtitle = (person: BookingPerson) => {
    const { duration } = planningCardDetails(person);
    if (!duration) return null;
    return (
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 11,
          color: alpha(m.navy, 0.48),
          lineHeight: 1.2,
          mt: 0.2,
        }}
      >
        {duration}
      </Typography>
    );
  };

  const planningFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: alpha(m.navy, 0.015),
      fontSize: 12,
      fontWeight: 700,
      "& fieldset": { borderColor: alpha(m.navy, 0.08) },
    },
    "& .MuiOutlinedInput-input": {
      color: alpha(m.navy, 0.55),
    },
  };

  const planningLockedFieldSx = {
    ...planningFieldSx,
    "& .MuiOutlinedInput-root": {
      ...planningFieldSx["& .MuiOutlinedInput-root"],
      pointerEvents: "none",
    },
  };

  const renderPlanningForm = () => (
    <Box
      sx={{
        mx: 1.5,
        mb: 1.5,
        p: 1.5,
        borderRadius: "10px",
        bgcolor: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5, minHeight: 32 }}
      >
        <Typography
          sx={{ fontSize: 11, fontWeight: 800, color: alpha(m.navy, 0.62) }}
        >
          Activity
        </Typography>
        {planningFormIsLocked ? (
          <IconButton
            size="small"
            onClick={startPlanningEdit}
            aria-label="Edit planning"
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "999px",
              border: `1px solid ${alpha(m.navy, 0.12)}`,
              bgcolor: alpha(m.navy, 0.03),
              color: alpha(m.navy, 0.55),
              "&:hover": {
                bgcolor: alpha(m.navy, 0.06),
                color: alpha(m.navy, 0.72),
              },
            }}
          >
            <ModeEditOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Stack>
      <TextField
        value={planningActivity}
        onChange={(e) => setPlanningActivity(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "Photoshoot"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{
          mb: 2,
          ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx),
        }}
      />

      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          color: alpha(m.navy, 0.62),
          mb: 0.5,
        }}
      >
        Duration
      </Typography>
      <TextField
        value={planningDuration}
        onChange={(e) => setPlanningDuration(e.target.value)}
        placeholder={planningFormIsLocked ? undefined : "30 min"}
        fullWidth
        size="small"
        InputProps={{ readOnly: planningFormIsLocked }}
        sx={{
          mb: planningFormIsLocked ? 0 : 2,
          ...(planningFormIsLocked ? planningLockedFieldSx : planningFieldSx),
        }}
      />

      {!planningFormIsLocked ? (
        <AppButton
          tone="primary"
          fullWidth
          onClick={savePlanning}
          sx={{
            height: 42,
          }}
        >
          Save
        </AppButton>
      ) : null}
    </Box>
  );

  const renderServicesDetails = () => (
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
            label={`Assigned(${assigned.length})`}
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
            label={`Unassigned(${unassigned.length})`}
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
            }}
          />
        </Tabs>
      </Stack>

      {/* Desired: one shared team member. Fixed: shared picker on Unassigned tab only. */}
      {filteredTeamMembers.length > 0 &&
      (isDesiredLocation || serviceTab === "unassigned") ? (
        <Box sx={{ mb: 1.25 }} onClick={(e) => e.stopPropagation()}>
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
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
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
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.62),
                }}
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
                <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.88),
                        lineHeight: 1.2,
                      }}
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
                    {!isDesiredLocation ? (
                      <Box
                        sx={{ mt: 1.25, maxWidth: 200 }}
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
                  </Box>

                  <Stack
                    alignItems="flex-end"
                    spacing={0.35}
                    sx={{ flexShrink: 0, pt: 0.1 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      spacing={0.75}
                    >
                      <Box sx={{ textAlign: "right" }}>
                        <Stack
                          direction="row"
                          alignItems="baseline"
                          spacing={0.75}
                          justifyContent="flex-end"
                        >
                          {typeof s.originalPrice === "number" ? (
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.4),
                                textDecoration: "line-through",
                              }}
                            >
                              {s.originalPrice} €
                            </Typography>
                          ) : null}
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: alpha(m.navy, 0.88),
                              lineHeight: 1.1,
                            }}
                          >
                            {s.price} €
                          </Typography>
                        </Stack>
                        {typeof s.discountPct === "number" ? (
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: m.teal,
                              mt: 0.35,
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
                          width: 26,
                          height: 26,
                          borderRadius: "999px",
                          color: alpha(m.navy, 0.4),
                          "&:hover": {
                            bgcolor: alpha(m.navy, 0.06),
                            color: alpha(m.navy, 0.65),
                          },
                        }}
                        aria-label={`Remove ${s.name}`}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
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
              <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                        lineHeight: 1.1,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {s.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.82),
                        lineHeight: 1.1,
                        flexShrink: 0,
                      }}
                    >
                      {s.price} €
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.45),
                      mt: 0.25,
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

                <Stack direction="row" alignItems="center" spacing={0.25}>
                  {serviceTab === "unassigned" ? (
                    <Checkbox
                      size="small"
                      checked={Boolean(selectedServiceIds[s.id])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        toggleServiceSelection(s.id, e.target.checked)
                      }
                      sx={{
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
          Service to assignment list
        </Typography>
      </ButtonBase>
    </Box>
  );

  const summaryServiceName =
    [...new Set(services.map((s) => s.name.trim()).filter(Boolean))].join(
      ", ",
    ) ||
    shop?.shopName ||
    "";
  const summaryTeamMemberName = [
    ...new Set(
      services
        .map((s) => resolveServiceTeamMemberName(s))
        .filter((name): name is string => Boolean(name)),
    ),
  ].join(", ");

  if (fromProfile && !profileHydrated) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "mollure.pageBg",
        py: { xs: 2, md: 3.5 },
      }}
    >
      <Container maxWidth="lg">
        <AppModal
          open={addServiceDialogOpen}
          onClose={() => setAddServiceDialogOpen(false)}
          title="Add service to assignment list"
          maxWidth="sm"
          contentSx={{ px: 2.5, pt: 0.5, pb: 1 }}
          footer={
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ px: 2.5, py: 2 }}
            >
              <AppButton
                tone="secondary"
                onClick={() => setAddServiceDialogOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                tone="primary"
                onClick={confirmAddService}
                disabled={
                  !Object.values(addServiceCatalogIds).some(Boolean)
                }
              >
                Add service
              </AppButton>
            </Stack>
          }
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 900,
              color: alpha(m.navy, 0.72),
              mb: 0.75,
            }}
          >
            Services
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 1.5 }}>
            {addServiceCatalog.map((item) => {
              const checked = Boolean(addServiceCatalogIds[item.id]);
              const qty = addServiceCatalogQty[item.id] ?? 1;
              return (
                <Box
                  key={item.id}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    px: 1.25,
                    py: 1,
                    bgcolor: alpha(m.navy, 0.015),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: m.teal,
                        }}
                      >
                        {item.durationMins} Mins
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: alpha(m.navy, 0.78),
                        mr: 0.5,
                      }}
                    >
                      {item.price} €
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{
                        border: `1px solid ${alpha(m.navy, 0.12)}`,
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => adjustAddServiceCatalogQty(item.id, -1)}
                        disabled={!checked || qty <= 1}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 0,
                          color: alpha(m.navy, 0.55),
                        }}
                      >
                        <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          width: 22,
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.78),
                        }}
                      >
                        {qty}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => adjustAddServiceCatalogQty(item.id, 1)}
                        disabled={!checked}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 0,
                          color: alpha(m.navy, 0.55),
                          "&:hover": { bgcolor: m.addSoftBgHover },
                          "&.Mui-disabled": { color: alpha(m.navy, 0.35) },
                        }}
                      >
                        <AddRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                    <Checkbox
                      checked={checked}
                      onChange={(e) =>
                        toggleAddServiceCatalog(item.id, e.target.checked)
                      }
                      sx={{
                        p: 0.25,
                        color: alpha(m.navy, 0.35),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>

        </AppModal>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: m.headingText,
                fontSize: "30px",
              }}
            >
              Booking Details
            </Typography>
          </Box>
          <Divider />

          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Grid container spacing={2} alignItems="stretch">
              {/* LEFT */}
              <Grid item xs={12} md={8.2}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  {/* Month + day strip */}
                  <Box id="booking-calendar-section" sx={{ p: 1.5 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      justifyContent="center"
                      sx={{ mb: 1.25 }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          setSelectedDate((d) => {
                            const next = addMonths(d, -1);
                            return isPastDay(next) ? today0 : next;
                          })
                        }
                        disabled={(() => {
                          const prevMonth = addMonths(selectedDate, -1);
                          return isPastDay(prevMonth);
                        })()}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.45)}`,
                          color: m.teal,
                          ...(isPastDay(addMonths(selectedDate, -1))
                            ? {
                                opacity: 0.45,
                                borderColor: alpha(m.navy, 0.1),
                                color: alpha(m.navy, 0.35),
                              }
                            : null),
                        }}
                      >
                        <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <ButtonBase
                        onClick={(e) => setMonthPickerAnchor(e.currentTarget)}
                        sx={{
                          borderRadius: "10px",
                          px: 1.1,
                          py: 0.45,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.6,
                          "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: alpha(m.navy, 0.78),
                            fontSize: 13,
                          }}
                        >
                          {monthLabel}
                        </Typography>
                        <KeyboardArrowDownRoundedIcon
                          sx={{ fontSize: 18, color: alpha(m.navy, 0.5) }}
                        />
                      </ButtonBase>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedDate((d) => addMonths(d, 1))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.45)}`,
                          color: m.teal,
                        }}
                      >
                        <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>

                    {/* Month/Year picker */}
                    <Box
                      component="div"
                      sx={{
                        position: "relative",
                      }}
                    />
                    {monthPickerAnchor ? (
                      <Box
                        component="div"
                        sx={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 1300,
                        }}
                        onClick={() => setMonthPickerAnchor(null)}
                      >
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            position: "absolute",
                            left: monthPickerAnchor.getBoundingClientRect()
                              .left,
                            top:
                              monthPickerAnchor.getBoundingClientRect().bottom +
                              6,
                            width: 260,
                            borderRadius: "12px",
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
                            bgcolor: "#fff",
                            boxShadow: "0 18px 44px rgba(16,35,63,0.18)",
                            p: 1.25,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                const y = monthPickerYear - 1;
                                const m0 = monthPickerMonth;
                                const probe = new Date(selectedDate);
                                probe.setFullYear(y, m0, 1);
                                if (isPastDay(probe)) {
                                  setSelectedDate(today0);
                                  setMonthPickerAnchor(null);
                                  return;
                                }
                                setMonthYear(y, m0);
                              }}
                              disabled={(() => {
                                const probe = new Date(selectedDate);
                                probe.setFullYear(
                                  monthPickerYear - 1,
                                  monthPickerMonth,
                                  1,
                                );
                                return isPastDay(probe);
                              })()}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.1)}`,
                              }}
                            >
                              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: 13,
                                color: alpha(m.navy, 0.8),
                              }}
                            >
                              {monthPickerYear}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setMonthYear(
                                  monthPickerYear + 1,
                                  monthPickerMonth,
                                )
                              }
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.1)}`,
                              }}
                            >
                              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>

                          <Grid container spacing={1}>
                            {Array.from({ length: 12 }, (_, i) => {
                              const label = new Date(
                                monthPickerYear,
                                i,
                                1,
                              ).toLocaleDateString("en-US", { month: "short" });
                              const active = i === monthPickerMonth;
                              // Disable only when the whole month is already past.
                              const lastOfMonth = new Date(
                                monthPickerYear,
                                i + 1,
                                0,
                              );
                              const disabled = isPastDay(lastOfMonth);
                              return (
                                <Grid item xs={4} key={i}>
                                  <AppButton
                                    tone="primary"
                                    fullWidth
                                    variant={active ? "contained" : "outlined"}
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      setMonthYear(monthPickerYear, i);
                                      setMonthPickerAnchor(null);
                                    }}
                                    sx={{
                                      fontSize: 11.5,
                                      height: 34,
                                      ...(!active
                                        ? {
                                            borderColor: alpha(m.navy, 0.1),
                                            color: alpha(m.navy, 0.68),
                                          }
                                        : {}),
                                      ...(disabled ? { opacity: 0.45 } : null),
                                    }}
                                  >
                                    {label}
                                  </AppButton>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      </Box>
                    ) : null}

                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setSelectedDate((d) => {
                            const next = addDays(d, -7);
                            return isPastDay(next) ? today0 : next;
                          })
                        }
                        disabled={isPastDay(addDays(selectedDate, -7))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.35)}`,
                          color: m.teal,
                          flexShrink: 0,
                          ...(isPastDay(addDays(selectedDate, -7))
                            ? {
                                opacity: 0.45,
                                borderColor: alpha(m.navy, 0.1),
                                color: alpha(m.navy, 0.35),
                              }
                            : null),
                        }}
                      >
                        <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Stack
                        direction="row"
                        spacing={0.9}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {weekDays.map((d) => {
                          const active = toISO(selectedDate) === d.key;
                          const past = isPastDay(d.date);
                          const closed = isDayNotAvailable(d.date) && !past;
                          const noSlots =
                            !past && !closed && isDayUnselectable(d.date);
                          const closedNote = closed
                            ? getDayClosedNote(d.date)
                            : noSlots
                              ? "No public hours available for this day."
                              : null;
                          const disabled = past || closed || noSlots;
                          const blocked = closed || noSlots;
                          return (
                            <Tooltip
                              key={d.key}
                              title={closedNote || ""}
                              disableHoverListener={!closedNote}
                              arrow
                              placement="top"
                            >
                              <Box
                                component="span"
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                }}
                              >
                            <ButtonBase
                              onClick={() => {
                                if (disabled) return;
                                setSelectedDate(d.date);
                              }}
                              disabled={disabled}
                              aria-disabled={disabled}
                              sx={{
                                flex: 1,
                                width: "100%",
                                minWidth: 0,
                                borderRadius: "8px",
                                border: `1px solid ${
                                  past
                                    ? alpha(m.navy, 0.08)
                                    : blocked
                                      ? alpha(m.blockedTimeFg, 0.45)
                                      : active
                                        ? m.teal
                                        : m.cardBorder
                                }`,
                                bgcolor: past
                                  ? alpha(m.navy, 0.015)
                                  : blocked
                                    ? m.blockedTimeBg
                                    : active
                                      ? m.teal
                                      : m.white,
                                py: 0.9,
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.35,
                                pointerEvents: disabled ? "none" : "auto",
                                "&.Mui-disabled": {
                                  opacity: past ? 0.45 : 1,
                                },
                                ...(past
                                  ? {
                                      opacity: 0.45,
                                      cursor: "not-allowed",
                                    }
                                  : null),
                                ...(blocked
                                  ? {
                                      cursor: "not-allowed",
                                    }
                                  : null),
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: past
                                    ? alpha(m.navy, 0.55)
                                    : blocked
                                      ? m.blockedTimeFg
                                      : active
                                        ? m.white
                                        : m.headingText,
                                }}
                              >
                                {d.dow}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 13.5,
                                  fontWeight: 900,
                                  color: past
                                    ? alpha(m.navy, 0.76)
                                    : blocked
                                      ? m.blockedTimeFg
                                      : active
                                        ? m.white
                                        : m.headingText,
                                }}
                              >
                                {d.day}
                              </Typography>
                            </ButtonBase>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedDate((d) => addDays(d, 7))}
                        sx={{
                          width: 24,
                          height: 24,
                          border: `1px solid ${alpha(m.teal, 0.35)}`,
                          color: m.teal,
                          flexShrink: 0,
                        }}
                      >
                        <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Select time */}
                  <Box sx={{ p: 1.5 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: "10px",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        bgcolor: alpha(m.navy, 0.015),
                        px: 1.25,
                        py: 1.1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.62),
                        }}
                      >
                        Select Time
                      </Typography>
                      <Box
                        sx={{
                          height: 1,
                          bgcolor: alpha(m.navy, 0.08),
                          mt: 1,
                          mb: 1.25,
                        }}
                      />

                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <IconButton
                          size="small"
                          onClick={() => scrollTimeSlots("left")}
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
                            color: alpha(m.navy, 0.55),
                            bgcolor: "#fff",
                          }}
                        >
                          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        <Box
                          ref={timeScrollRef}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            flex: 1,
                            minWidth: 0,
                            overflowX: "auto",
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                            py: 0.25,
                          }}
                        >
                          {times.map((t) => {
                            const active = t === selectedTime;
                            const unavailable = isTimeUnavailable(t);
                            return (
                              <AppButton
                                tone="secondary"
                                key={t}
                                data-time-slot={t}
                                variant="outlined"
                                onClick={() => {
                                  if (unavailable) {
                                    setTimeValidationError(
                                      CLIENT_BOOKING_MIN_LEAD_ERROR,
                                    );
                                    return;
                                  }
                                  setTimeValidationError(null);
                                  setSelectedTime(t);
                                }}
                                disabled={unavailable}
                                sx={{
                                  flexShrink: 0,
                                  minWidth: 76,
                                  px: 1.25,
                                  height: 32,
                                  fontSize: 11.5,
                                  fontWeight: active
                                    ? theme.typography.fontWeightBold
                                    : theme.typography.fontWeightRegular,
                                  whiteSpace: "nowrap",
                                  bgcolor: active ? m.teal : m.white,
                                  color: active ? m.white : m.headingText,
                                  borderColor: active ? m.teal : m.cardBorder,
                                  "&:hover": {
                                    bgcolor: active ? m.teal : m.white,
                                    color: active ? m.white : m.headingText,
                                    borderColor: active ? m.teal : m.cardBorder,
                                  },
                                  ...(unavailable
                                    ? {
                                        bgcolor: m.white,
                                        borderColor: alpha(m.navy, 0.08),
                                        color: alpha(m.navy, 0.32),
                                        "&:hover": {
                                          bgcolor: m.white,
                                          borderColor: alpha(m.navy, 0.08),
                                          color: alpha(m.navy, 0.32),
                                        },
                                      }
                                    : {}),
                                }}
                              >
                                {t}
                              </AppButton>
                            );
                          })}
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => scrollTimeSlots("right")}
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
                            color: alpha(m.navy, 0.55),
                            bgcolor: "#fff",
                          }}
                        >
                          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>

                      {(timeValidationError || selectedTimeTooSoon) && (
                        <Typography
                          sx={{
                            mt: 0.9,
                            px: 0.25,
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: "#C62828",
                            lineHeight: 1.35,
                          }}
                        >
                          {timeValidationError || CLIENT_BOOKING_MIN_LEAD_ERROR}
                        </Typography>
                      )}

                      {(selectedDayNotAvailable || availableTimes.length === 0) && (
                        <Typography
                          sx={{
                            mt: 0.9,
                            px: 0.25,
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: m.blockedTimeFg,
                            lineHeight: 1.35,
                          }}
                        >
                          {selectedDayClosedNote ||
                            "No public hours available for this day."}
                        </Typography>
                      )}

                      {showProjectDetails ? (
                          <Box
                            id="booking-project-section"
                            sx={{ width: "100%", mt: 1.25, textAlign: "left" }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.78),
                                mb: 1.25,
                              }}
                            >
                              Project Details
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.62),
                                mb: 0.5,
                              }}
                            >
                              Description
                            </Typography>
                            <TextField
                              value={projectDescription}
                              onChange={(e) =>
                                setProjectDescription(e.target.value)
                              }
                              placeholder="Project description"
                              multiline
                              minRows={3}
                              fullWidth
                              sx={{
                                mb: 1.5,
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  bgcolor: "#fff",
                                  fontSize: 12,
                                },
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: alpha(m.navy, 0.62),
                                mb: 0.75,
                              }}
                            >
                              Upload Section
                            </Typography>
                            <Box
                              component="button"
                              type="button"
                              onClick={() =>
                                projectFileInputRef.current?.click()
                              }
                              sx={{
                                width: "100%",
                                border: `1px dashed ${alpha(m.navy, 0.18)}`,
                                borderRadius: "10px",
                                bgcolor: "#fff",
                                py: 2.5,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.75,
                                cursor: "pointer",
                                mb: 1.25,
                                "&:hover": {
                                  bgcolor: alpha(m.teal, 0.04),
                                  borderColor: alpha(m.teal, 0.35),
                                },
                              }}
                            >
                              <FileUploadOutlinedIcon
                                sx={{
                                  fontSize: 28,
                                  color: alpha(m.navy, 0.35),
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  color: alpha(m.navy, 0.48),
                                }}
                              >
                                Upload Image &amp; Documents
                              </Typography>
                            </Box>
                            <input
                              ref={projectFileInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              multiple
                              hidden
                              onChange={handleProjectFilePick}
                            />
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ overflowX: "auto", pb: 0.5 }}
                            >
                              {projectUploads.map((img) => (
                                <Box
                                  key={img.id}
                                  sx={{
                                    flex: "0 0 88px",
                                    minWidth: 88,
                                    position: "relative",
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => deleteProjectUpload(img.id)}
                                    aria-label={`Remove ${img.name}`}
                                    sx={{
                                      position: "absolute",
                                      top: 4,
                                      right: 4,
                                      zIndex: 1,
                                      width: 20,
                                      height: 20,
                                      bgcolor: alpha(m.navy, 0.55),
                                      color: "#fff",
                                      "&:hover": {
                                        bgcolor: alpha(m.navy, 0.72),
                                      },
                                    }}
                                  >
                                    <CloseRoundedIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  <Box
                                    sx={{
                                      width: 88,
                                      height: 62,
                                      borderRadius: "8px",
                                      border: `1px solid ${alpha(m.navy, 0.08)}`,
                                      overflow: "hidden",
                                      bgcolor: alpha(m.navy, 0.04),
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {img.file?.type.startsWith("image/") ||
                                    (!img.file &&
                                      Boolean(
                                        resolveMediaUrl(img.previewUrl) ||
                                          img.previewUrl,
                                      )) ? (
                                      <Box
                                        component="img"
                                        src={
                                          resolveMediaUrl(img.previewUrl) ||
                                          img.previewUrl
                                        }
                                        alt={img.name}
                                        sx={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          display: "block",
                                        }}
                                      />
                                    ) : (
                                      <Typography
                                        sx={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          color: alpha(m.navy, 0.45),
                                        }}
                                      >
                                        PDF
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography
                                    sx={{
                                      mt: 0.4,
                                      fontSize: 9,
                                      fontWeight: 800,
                                      color: alpha(m.navy, 0.48),
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {img.name}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        ) : null}
                    </Paper>

                    {!isDesiredLocation && canAddFixedLocationGuest ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                        spacing={0.5}
                        sx={{ mt: 1 }}
                      >
                        <Tooltip title="Fixed location bookings include the client plus one guest (max 2 people), starting at the same time.">
                          <InfoOutlinedIcon
                            sx={{ fontSize: 16, color: alpha(m.navy, 0.38) }}
                          />
                        </Tooltip>
                        <Chip
                          icon={
                            <Box
                              component="span"
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "999px",
                                bgcolor: m.addSoftBg,
                                color: m.addSoftFg,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                lineHeight: 0,
                              }}
                            >
                              <AddRoundedIcon
                                sx={{ fontSize: 14, display: "block" }}
                              />
                            </Box>
                          }
                          label="Guest"
                          variant="outlined"
                          clickable
                          onClick={() => addParticipant("Guest")}
                          sx={{
                            height: 32,
                            borderRadius: "10px",
                            fontSize: 11.5,
                            fontWeight: theme.typography.fontWeightRegular,
                            bgcolor: m.white,
                            borderColor: m.cardBorder,
                            color: m.headingText,
                            "& .MuiChip-icon": {
                              color: m.addSoftFg,
                              ml: 0.85,
                              mr: 0.25,
                            },
                            "&:hover": {
                              bgcolor: m.white,
                              borderColor: m.cardBorder,
                              "& .MuiChip-icon": {
                                bgcolor: m.addSoftBgHover,
                                color: m.addSoftFg,
                              },
                            },
                          }}
                        />
                      </Stack>
                    ) : null}
                  </Box>

                  <Divider />

                  {/* People */}
                  <Box id="booking-services-section" sx={{ p: 1.5 }}>
                    {isDesiredLocation ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                        sx={{ mb: 1 }}
                      >
                        <AppButton
                          variant="outlined"
                          endIcon={
                            <KeyboardArrowDownRoundedIcon
                              sx={{ fontSize: 16 }}
                            />
                          }
                          startIcon={
                            <Box
                              component="span"
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "999px",
                                bgcolor: m.addSoftBg,
                                color: m.addSoftFg,
                                border: `1px solid ${m.addSoftBorder}`,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                lineHeight: 0,
                              }}
                            >
                              <AddRoundedIcon
                                sx={{ fontSize: 14, display: "block" }}
                              />
                            </Box>
                          }
                          onClick={(e) =>
                            setParticipantMenuAnchor(e.currentTarget)
                          }
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 11.5,
                            lineHeight: 1,
                            height: 32,
                            minHeight: 32,
                            py: 0,
                            px: 1.25,
                            borderColor: alpha(m.navy, 0.12),
                            color: alpha(m.navy, 0.62),
                            bgcolor: "#fff",
                            "& .MuiButton-startIcon, & .MuiButton-endIcon": {
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 0,
                              marginBottom: 0,
                            },
                            "& .MuiButton-startIcon": { mr: 0.75, ml: 0 },
                            "& .MuiButton-endIcon": { ml: 0.35, mr: 0 },
                            "& .MuiButton-startIcon > *:nth-of-type(1)": {
                              fontSize: "inherit",
                            },
                          }}
                        >
                          Add
                        </AppButton>
                        <Menu
                          anchorEl={participantMenuAnchor}
                          open={Boolean(participantMenuAnchor)}
                          onClose={() => setParticipantMenuAnchor(null)}
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                          }}
                          PaperProps={{
                            sx: {
                              borderRadius: "10px",
                              minWidth: 140,
                              mt: 0.5,
                            },
                          }}
                        >
                          <MenuItem
                            onClick={() => addParticipant("Guest")}
                            sx={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: alpha(m.navy, 0.78),
                            }}
                          >
                            Guest
                          </MenuItem>
                          {isCompanyClient ? (
                            <MenuItem
                              onClick={() => addParticipant("Model")}
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.78),
                              }}
                            >
                              Model
                            </MenuItem>
                          ) : (
                            <MenuItem
                              onClick={() => {
                                setParticipantMenuAnchor(null);
                                setNoteDialogOpen(true);
                              }}
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.78),
                              }}
                            >
                              Notes
                            </MenuItem>
                          )}
                          {isCompanyClient ? (
                            <MenuItem
                              onClick={() => addParticipant("Planning")}
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: alpha(m.navy, 0.78),
                              }}
                            >
                              Planning
                            </MenuItem>
                          ) : null}
                        </Menu>
                      </Stack>
                    ) : null}

                    <Stack direction="row" spacing={1} alignItems="center">
                      {people.map((p) => {
                        const active = p.id === selectedPersonId;
                        return (
                          <Paper
                            key={p.id}
                            elevation={0}
                            draggable
                            onDragStart={(e) => {
                              setDraggingPersonId(p.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", p.id);
                            }}
                            onDragEnd={() => setDraggingPersonId(null)}
                            onDragOver={(e) => {
                              // Allow dropping.
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from =
                                e.dataTransfer.getData("text/plain") ||
                                draggingPersonId;
                              if (!from) return;
                              reorderPeople(from, p.id);
                              setDraggingPersonId(null);
                            }}
                            sx={{
                              flex: 1,
                              borderRadius: "10px",
                              border: `1px solid ${active ? alpha(m.teal, 0.7) : alpha(m.navy, 0.1)}`,
                              bgcolor: "#fff",
                              px: 1,
                              pt: 1.05,
                              pb: 0.75,
                              cursor: "pointer",
                              boxShadow: active
                                ? `0 0 0 4px ${alpha(m.teal, 0.08)}`
                                : "none",
                              position: "relative",
                              minHeight: 72,
                              overflow: "visible",
                              ...(draggingPersonId === p.id
                                ? { opacity: 0.7 }
                                : draggingPersonId
                                  ? {
                                      outline: `2px dashed ${alpha(m.teal, 0.45)}`,
                                      outlineOffset: "2px",
                                    }
                                  : null),
                            }}
                            onClick={() => {
                              if (isPlanningPerson(p)) {
                                selectPlanningCard(p);
                              } else {
                                selectNonPlanningPerson(p.id);
                              }
                            }}
                          >
                            {!p.isRequester ? (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGuest(p.id);
                                }}
                                sx={{
                                  position: "absolute",
                                  right: 4,
                                  bottom: 4,
                                  zIndex: 2,
                                  width: 22,
                                  height: 22,
                                  borderRadius: "999px",
                                  bgcolor: alpha(m.navy, 0.04),
                                  color: alpha(m.navy, 0.5),
                                  "&:hover": {
                                    bgcolor: alpha(m.navy, 0.08),
                                    color: alpha(m.navy, 0.72),
                                  },
                                }}
                                aria-label={`Remove ${p.name}`}
                              >
                                <DeleteOutlineRoundedIcon
                                  sx={{ fontSize: 14 }}
                                />
                              </IconButton>
                            ) : null}

                            <Stack
                              spacing={0.55}
                              sx={{
                                pb: p.isRequester ? 0 : 2.25,
                                alignItems: "center",
                              }}
                            >
                              {p.isRequester ? (
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: 12.5,
                                    color: alpha(m.navy, 0.82),
                                  }}
                                >
                                  {p.name}
                                </Typography>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    width: "100%",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <TextField
                                    value={p.name}
                                    onChange={(e) =>
                                      updateGuestName(p.id, e.target.value)
                                    }
                                    size="small"
                                    inputProps={{
                                      "aria-label": `${getParticipantLabel(p)} name`,
                                      sx: {
                                        py: 0.35,
                                        px: 0.5,
                                        fontSize: 11,
                                        fontWeight: 900,
                                        textAlign: "center",
                                      },
                                    }}
                                    sx={{
                                      width: "100%",
                                      maxWidth: 96,
                                      "& .MuiOutlinedInput-root": {
                                        height: 22,
                                        borderRadius: "8px",
                                        bgcolor: "#fff",
                                        fontSize: 11,
                                        fontWeight: 900,
                                      },
                                    }}
                                  />
                                </Box>
                              )}

                              {isPlanningPerson(p) ? (
                                renderPlanningCardSubtitle(p)
                              ) : (
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: alpha(m.navy, 0.48),
                                    mt: 0.2,
                                    textAlign: "center",
                                  }}
                                >
                                  {personCardSubtitle(p)}
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>

                    {requiresPersonAssignment ? (
                      <Box
                        sx={{
                          mt: 1.25,
                          borderRadius: "10px",
                          bgcolor: alpha(m.teal, 0.08),
                          border: `1px solid ${alpha(m.teal, 0.18)}`,
                          px: 1.25,
                          py: 0.65,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <InfoOutlinedIcon
                          sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.6),
                            lineHeight: 1.2,
                          }}
                        >
                          Assign Services By Selecting The Person
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>

                  {isDesiredLocation && isPlanningCardSelected ? (
                    renderPlanningForm()
                  ) : (
                    <>
                      <Divider />
                      {renderServicesDetails()}
                    </>
                  )}
                </Paper>
              </Grid>

              {/* RIGHT */}
              <Grid item xs={12} md={3.8}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 1.8, pt: 1.2, pb: 1.05 }}>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: alpha(m.navy, 0.72),
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      Service Summary
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.85,
                        fontWeight: 900,
                        color: m.headingText,
                        fontSize: 15,
                        lineHeight: 1.2,
                      }}
                    >
                      {summaryServiceName}
                    </Typography>

                    {summaryTeamMemberName ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ mt: 0.55 }}
                      >
                        <PersonOutlineRoundedIcon
                          sx={{
                            fontSize: 15,
                            color: alpha(m.navy, 0.45),
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.62),
                            lineHeight: 1,
                          }}
                        >
                          {summaryTeamMemberName}
                        </Typography>
                      </Stack>
                    ) : null}

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.55}
                      sx={{ mt: 0.65, minWidth: 0 }}
                    >
                      <AccessTimeRoundedIcon
                        sx={{ fontSize: 15, color: m.teal, flexShrink: 0 }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: alpha(m.teal, 0.95),
                          fontSize: 10.25,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        ({fmtMinutesToTimeLabel(bookingStartMinutes)} –{" "}
                        {fmtMinutesToTimeLabel(bookingEndMinutes)})
                      </Typography>
                    </Stack>

                    <Chip
                      label={
                        isDesiredLocation ? "Desired Location" : "Fixed Location"
                      }
                      size="small"
                      sx={{
                        mt: 0.7,
                        height: 18,
                        borderRadius: "4px",
                        bgcolor: alpha(m.teal, 0.1),
                        color: m.teal,
                        fontSize: 9.5,
                        fontWeight: 800,
                        "& .MuiChip-label": { px: 0.85 },
                      }}
                    />
                  </Box>
                  <Divider />

                  <Box sx={{ p: 1.6 }}>
                    <Stack spacing={1.25}>
                      {summarySections.map(
                        ({
                          key,
                          title,
                          roleLabel,
                          items,
                          planningItem,
                        }) => {
                          return (
                            <Box key={key}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.75}
                                sx={{ mb: 0.75 }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: 12,
                                    color: m.headingText,
                                    lineHeight: 1,
                                  }}
                                >
                                  {title}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: 10.5,
                                    color: "primary.light",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.3,
                                    lineHeight: 1,
                                  }}
                                >
                                  {roleLabel}
                                </Typography>
                              </Stack>
                              <Stack spacing={0.75}>
                                {planningItem ? (
                                  <Box
                                    sx={{
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                                      px: 1.2,
                                      py: 0.9,
                                      bgcolor: alpha(m.navy, 0.02),
                                    }}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      {planningItem.activity ? (
                                        <Typography
                                          sx={{
                                            fontSize: 12,
                                            fontWeight: 900,
                                            color: alpha(m.navy, 0.78),
                                            lineHeight: 1.1,
                                          }}
                                        >
                                          {planningItem.activity}
                                        </Typography>
                                      ) : null}
                                      {planningItem.duration ? (
                                        <Typography
                                          sx={{
                                            mt: planningItem.activity
                                              ? 0.25
                                              : 0,
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            color: alpha(m.navy, 0.48),
                                          }}
                                        >
                                          {planningItem.duration}
                                        </Typography>
                                      ) : null}
                                    </Box>
                                  </Box>
                                ) : null}
                                {items.map((s, index) => {
                                  const startMin = bookServicesAtSameTime
                                    ? bookingStartMinutes
                                    : bookingStartMinutes +
                                      items
                                        .slice(0, index)
                                        .reduce(
                                          (sum, row) => sum + row.durationMins,
                                          0,
                                        );
                                  const staffName = resolveServiceTeamMemberName(s);
                                  return (
                                  <Box
                                    key={s.id}
                                    sx={{
                                      borderRadius: "10px",
                                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                                      px: 1.2,
                                      py: 0.9,
                                      bgcolor: alpha(m.navy, 0.02),
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      alignItems="flex-start"
                                      justifyContent="space-between"
                                      spacing={1}
                                    >
                                      <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                          sx={{
                                            fontSize: 12,
                                            fontWeight: 900,
                                            color: m.headingText,
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          {s.name}
                                        </Typography>
                                        <ServiceSummaryMetaLine
                                          timeRange={serviceTimeRangeLabel(
                                            startMin,
                                            s.durationMins,
                                          )}
                                          durationLabel={`${s.durationMins} Mins`}
                                        />
                                        {staffName ? (
                                          <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={0.5}
                                            sx={{ mt: 0.5 }}
                                          >
                                            <PersonOutlineRoundedIcon
                                              sx={{
                                                fontSize: 14,
                                                color: alpha(m.navy, 0.4),
                                              }}
                                            />
                                            <Typography
                                              sx={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: alpha(m.navy, 0.55),
                                                lineHeight: 1,
                                              }}
                                            >
                                              {staffName}
                                            </Typography>
                                          </Stack>
                                        ) : null}
                                      </Box>
                                      <Typography
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 900,
                                          color: m.headingText,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {s.price} €
                                      </Typography>
                                    </Stack>
                                  </Box>
                                  );
                                })}
                              </Stack>
                              <Divider sx={{ mt: 1.1 }} />
                            </Box>
                          );
                        },
                      )}

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.78),
                          }}
                        >
                          Total
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.78),
                            lineHeight: 1.1,
                          }}
                        >
                          {total} €
                        </Typography>
                      </Stack>

                      {!allServicesAssigned && services.length > 0 ? (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#C67A00",
                            lineHeight: 1.35,
                          }}
                        >
                          {unassigned.length > 0
                            ? `${unassigned.length} service${unassigned.length === 1 ? "" : "s"} still need a person.`
                            : "Every service needs a person before you can continue."}
                        </Typography>
                      ) : null}

                      {allServicesAssigned &&
                      needsTeamMemberProvidedByPro &&
                      !selectedTeamMemberId &&
                      services.length > 0 ? (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "primary.light",
                            lineHeight: 1.35,
                          }}
                        >
                          Team member will be provided by professional.
                        </Typography>
                      ) : null}

                      {allServicesAssigned && selectedTimeTooSoon ? (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#C62828",
                            lineHeight: 1.35,
                          }}
                        >
                          {CLIENT_BOOKING_MIN_LEAD_ERROR}
                        </Typography>
                      ) : null}

                      <AppButton
                        tone="primary"
                        fullWidth
                        disabled={
                          !allServicesAssigned ||
                          isContinuing ||
                          selectedTimeTooSoon
                        }
                        onClick={() => void onContinue()}
                        sx={{
                          mt: 1.25,
                          height: 40,
                          ...(allServicesAssigned &&
                          !isContinuing &&
                          !selectedTimeTooSoon
                            ? null
                            : {
                                color: alpha(m.navy, 0.45),
                              }),
                        }}
                      >
                        {isContinuing ? (
                          <>
                            <CircularProgress
                              size={18}
                              sx={{ mr: 1, color: "inherit" }}
                            />
                            {continueLabel}
                          </>
                        ) : (
                          continueLabel
                        )}
                      </AppButton>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      <EditRequestNoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onConfirm={(note) => setClientNote(note)}
        title="Notes"
        description="Write a note for the professional. It will be sent with this booking."
        placeholder="Add a note…"
        confirmLabel="Save"
        initialValue={clientNote}
      />
    </Box>
  );
}
