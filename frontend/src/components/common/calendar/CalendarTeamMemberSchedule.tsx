"use client";

import {
  mollurePageSubtitleSx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import DenseRowIconActions from "../DenseRowIconActions";
import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TableCell,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  CalendarBookingLocation,
  CalendarResource,
  TeamScheduleAvailabilityEntry,
  TeamScheduleBlockedEntry,
  TeamScheduleTimeRange,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { AppCalendarPanel } from "../AppDatePicker";
import CalendarAvailabilityModal from "./CalendarAvailabilityModal";
import CalendarBlockTimeModal from "./CalendarBlockTimeModal";
import CalendarScheduleAddMenu from "./CalendarScheduleAddMenu";
import CalendarScheduleDeleteDialog from "./CalendarScheduleDeleteDialog";
import type { BlockTimeDraft } from "./calendar.utils";
import {
  createEmptyBlockTimeDraft,
  formatLongDateUtc,
  formatMdyDate,
} from "./calendar.utils";
import {
  availabilityEntryToDraft,
  blockedEntryToDraft,
  buildAvailabilityEntriesFromDraft,
  buildBlockedEntryFromDraft,
  emptyAvailabilityDraft,
  type AvailabilityDraft,
} from "./schedule.utils";
import {
  formatScheduleTimeRange,
  scheduleBodyCellSx,
  ScheduleStatusTabs,
  ScheduleTableSection,
  type ScheduleStatusTab,
} from "./CalendarScheduleShared";
import { BodyText, SubHeading } from "../../ui/typography";

type DeleteTarget =
  { kind: "availability"; id: string } | { kind: "blocked"; id: string } | null;

type CalendarTeamMemberScheduleProps = {
  resources: readonly CalendarResource[];
  supportedLocations: readonly CalendarBookingLocation[];
  availability: readonly TeamScheduleAvailabilityEntry[];
  blocked: readonly TeamScheduleBlockedEntry[];
  activeDateIso: string;
  onDateChange: (iso: string) => void;
  onAvailabilityChange: (
    next: readonly TeamScheduleAvailabilityEntry[],
  ) => void;
  onBlockedChange: (next: readonly TeamScheduleBlockedEntry[]) => void;
};

const formatTimeRange = (range: TeamScheduleTimeRange) =>
  formatScheduleTimeRange(range.start, range.end, "hyphen");

const isDateInRange = (iso: string, from: string, to: string) =>
  iso >= from && iso <= to;

function DateRangeDropdown({
  entry,
}: {
  entry: TeamScheduleAvailabilityEntry;
}) {
  const m = useTheme().palette.mollure;
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const bookedDates = entry.bookedDates ?? [];
  const hasDropdown = bookedDates.length > 0;

  return (
    <>
      <Stack
        direction="row"
        spacing={0.35}
        alignItems="center"
        justifyContent="center"
      >
        <span>
          {formatMdyDate(entry.dateFrom)} - {formatMdyDate(entry.dateTo)}
        </span>
        {hasDropdown ? (
          <IconButton
            size="small"
            onClick={(e) => setAnchor(e.currentTarget)}
            sx={{ width: 22, height: 22, color: alpha(m.navy, 0.45) }}
          >
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : null}
      </Stack>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: "8px",
            border: `1px solid ${alpha(m.teal, 0.35)}`,
            boxShadow: "0 8px 24px rgba(16, 35, 63, 0.12)",
            minWidth: 148,
            py: 0.5,
          },
        }}
      >
        {bookedDates.map((date, index) => (
          <MenuItem
            key={`${entry.id}-${date}-${index}`}
            onClick={() => setAnchor(null)}
            sx={{
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: alpha(m.navy, 0.78),
              py: 0.85,
              mx: 0.75,
              my: 0.35,
              borderRadius: "6px",
              border: `1px dashed ${alpha(m.teal, 0.35)}`,
            }}
          >
            {formatMdyDate(date)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function CalendarTeamMemberSchedule({
  resources,
  supportedLocations,
  availability,
  blocked,
  activeDateIso,
  onDateChange,
  onAvailabilityChange,
  onBlockedChange,
}: CalendarTeamMemberScheduleProps) {
  const m = useTheme().palette.mollure;
  const [statusTab, setStatusTab] = React.useState<ScheduleStatusTab>("active");
  const [datePickerAnchor, setDatePickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);

  const [availabilityModalOpen, setAvailabilityModalOpen] =
    React.useState(false);
  const [availabilityMode, setAvailabilityMode] = React.useState<
    "add" | "edit"
  >("add");
  const [availabilityDraft, setAvailabilityDraft] =
    React.useState<AvailabilityDraft>(() =>
      emptyAvailabilityDraft(activeDateIso),
    );
  const [editingAvailability, setEditingAvailability] =
    React.useState<TeamScheduleAvailabilityEntry | null>(null);

  const [blockModalOpen, setBlockModalOpen] = React.useState(false);
  const [blockMode, setBlockMode] = React.useState<"add" | "edit">("add");
  const [blockDraft, setBlockDraft] = React.useState<
    BlockTimeDraft & { activity?: string }
  >({
    ...createEmptyBlockTimeDraft([], supportedLocations, activeDateIso),
    activity: "",
  });
  const [editingBlocked, setEditingBlocked] =
    React.useState<TeamScheduleBlockedEntry | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null);

  const teamLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    resources.forEach((resource) => map.set(resource.id, resource.name));
    return map;
  }, [resources]);

  const isArchived = statusTab === "archived";

  const filteredAvailability = React.useMemo(
    () =>
      availability.filter((entry) => {
        if (Boolean(entry.archived) !== isArchived) return false;
        if (isArchived) return true;
        return isDateInRange(activeDateIso, entry.dateFrom, entry.dateTo);
      }),
    [activeDateIso, availability, isArchived],
  );

  const filteredBlocked = React.useMemo(
    () =>
      blocked.filter((entry) => {
        if (Boolean(entry.archived) !== isArchived) return false;
        if (isArchived) return true;
        return isDateInRange(activeDateIso, entry.dateFrom, entry.dateTo);
      }),
    [activeDateIso, blocked, isArchived],
  );

  const bodyCellSx = scheduleBodyCellSx(m.navy);

  const openAddAvailability = () => {
    setAvailabilityMode("add");
    setEditingAvailability(null);
    setAvailabilityDraft(emptyAvailabilityDraft(activeDateIso));
    setAvailabilityModalOpen(true);
  };

  const openEditAvailability = (entry: TeamScheduleAvailabilityEntry) => {
    setAvailabilityMode("edit");
    setEditingAvailability(entry);
    setAvailabilityDraft(availabilityEntryToDraft(entry));
    setAvailabilityModalOpen(true);
  };

  const applyAvailability = () => {
    if (availabilityMode === "add") {
      if (
        !availabilityDraft.teamIds.length ||
        !availabilityDraft.locations.length
      )
        return;
      const created = buildAvailabilityEntriesFromDraft(availabilityDraft);
      onAvailabilityChange([...availability, ...created]);
    } else if (editingAvailability) {
      const [updated] = buildAvailabilityEntriesFromDraft(
        availabilityDraft,
        editingAvailability,
      );
      onAvailabilityChange(
        availability.map((entry) =>
          entry.id === updated.id ? updated : entry,
        ),
      );
    }
    setAvailabilityModalOpen(false);
  };

  const openAddBlocked = () => {
    setBlockMode("add");
    setEditingBlocked(null);
    setBlockDraft({
      ...createEmptyBlockTimeDraft(
        resources[0]?.id ? [resources[0].id] : [],
        supportedLocations,
        activeDateIso,
      ),
      activity: "",
    });
    setBlockModalOpen(true);
  };

  const openEditBlocked = (entry: TeamScheduleBlockedEntry) => {
    setBlockMode("edit");
    setEditingBlocked(entry);
    setBlockDraft(blockedEntryToDraft(entry, supportedLocations));
    setBlockModalOpen(true);
  };

  const applyBlocked = () => {
    if (!blockDraft.title || !blockDraft.teamIds.length) return;
    if (
      blockDraft.title === "Custom" &&
      !blockDraft.customTitle?.trim() &&
      !blockDraft.activity?.trim()
    )
      return;
    const nextEntry = buildBlockedEntryFromDraft(
      blockDraft,
      editingBlocked ?? undefined,
    );
    if (blockMode === "add") {
      onBlockedChange([...blocked, nextEntry]);
    } else {
      onBlockedChange(
        blocked.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)),
      );
    }
    setBlockModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "availability") {
      onAvailabilityChange(
        availability.filter((entry) => entry.id !== deleteTarget.id),
      );
    } else {
      onBlockedChange(blocked.filter((entry) => entry.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const membersWithRows = resources.filter((resource) => {
    const memberAvailability = filteredAvailability.filter(
      (entry) => entry.resourceId === resource.id,
    );
    const memberBlocked = filteredBlocked.filter(
      (entry) => entry.resourceId === resource.id,
    );
    return memberAvailability.length > 0 || memberBlocked.length > 0;
  });

  const membersToRender =
    membersWithRows.length > 0 ? membersWithRows : resources.slice(0, 1);

  const editingAvailabilityName = editingAvailability
    ? resources.find(
        (resource) => resource.id === editingAvailability.resourceId,
      )?.name
    : undefined;

  const editingBlockedName = editingBlocked
    ? resources.find((resource) => resource.id === editingBlocked.resourceId)
        ?.name
    : undefined;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "2px",
          border: 0,
          boxShadow: "none",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.25, pb: 2.5 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                bgcolor: m.fxGrayF9FAFB,
                borderRadius: "10px",
                px: 2,
                py: 1.75,
              }}
            >
              <SubHeading sx={mollurePageTitleSx(m.navy)}>
                Team Member schedule
              </SubHeading>
              <BodyText sx={mollurePageSubtitleSx(m.navy, { mt: 0.5 })}>
                Set Availability and block a time slot for the team members.
              </BodyText>
            </Box>

            <ScheduleStatusTabs
              value={statusTab}
              onChange={setStatusTab}
              fullWidth
            />

            <Stack
              direction="row"
              alignItems="center"
              justifyContent={isArchived ? "center" : "space-between"}
              flexWrap="wrap"
              useFlexGap
              sx={{ position: "relative" }}
            >
              <AppButton
                variant="outlined"
                startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setDatePickerAnchor(e.currentTarget)}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 11,
                  borderColor: alpha(m.navy, 0.12),
                  color: alpha(m.navy, 0.78),
                  bgcolor: "#fff",
                  height: 28,
                  px: 1.1,
                  "& .MuiButton-startIcon": { mr: 0.45 },
                }}
              >
                {formatLongDateUtc(activeDateIso)}
              </AppButton>

              {!isArchived ? (
                <AppButton
                  tone="primary"
                  endIcon={<KeyboardArrowDownRoundedIcon />}
                  onClick={(e) => setAddAnchor(e.currentTarget)}
                  sx={{
                    fontSize: 11,
                    height: 28,
                    px: 1.25,
                    "& .MuiButton-endIcon": { color: "#fff" },
                  }}
                >
                  Add
                </AppButton>
              ) : null}

              <Popover
                open={Boolean(datePickerAnchor)}
                anchorEl={datePickerAnchor}
                onClose={() => setDatePickerAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: "14px",
                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                    boxShadow: "0 16px 40px rgba(16, 35, 63, 0.13)",
                    overflow: "hidden",
                    bgcolor: "#fff",
                  },
                }}
              >
                <AppCalendarPanel
                  value={activeDateIso}
                  onChange={onDateChange}
                  onDaySelect={() => setDatePickerAnchor(null)}
                />
              </Popover>

              <CalendarScheduleAddMenu
                anchorEl={addAnchor}
                onAvailability={openAddAvailability}
                onBlockedTime={openAddBlocked}
                onClose={() => setAddAnchor(null)}
              />
            </Stack>

            <Stack spacing={2.5}>
              {membersToRender.map((resource) => {
                const memberAvailability = filteredAvailability.filter(
                  (entry) => entry.resourceId === resource.id,
                );
                const memberBlocked = filteredBlocked.filter(
                  (entry) => entry.resourceId === resource.id,
                );

                return (
                  <Box key={resource.id}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 12,
                          fontWeight: 900,
                          bgcolor: alpha(m.teal, 0.14),
                          color: m.tealDark,
                        }}
                      >
                        {resource.avatarText}
                      </Avatar>
                      <BodyText
                        sx={{
                          ...mollureSectionTitleSx(m.navy),
                        }}
                      >
                        {resource.name}
                      </BodyText>
                    </Stack>

                    <Stack spacing={1.75}>
                      <ScheduleTableSection
                        title="Availability"
                        columns={[
                          "Location",
                          "Date - Date",
                          "Day - Day",
                          "Time - Time",
                          "Action",
                        ]}
                        emptyLabel="No availability entries."
                        rows={memberAvailability.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell sx={bodyCellSx}>
                              {entry.location}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              <DateRangeDropdown entry={entry} />
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {entry.dayFrom} - {entry.dayTo}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              <Stack spacing={0.35}>
                                {entry.times.map((range, timeIndex) => (
                                  <span key={`${entry.id}-${timeIndex}`}>
                                    {formatTimeRange(range)}
                                  </span>
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              <DenseRowIconActions
                                onEdit={() => openEditAvailability(entry)}
                                onDelete={() =>
                                  setDeleteTarget({
                                    kind: "availability",
                                    id: entry.id,
                                  })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      />

                      <ScheduleTableSection
                        title="Blocked Time"
                        columns={[
                          "Title",
                          "Date - Date",
                          "Day - Day",
                          "Time - Time",
                          "Action",
                        ]}
                        emptyLabel="No blocked time entries."
                        rows={memberBlocked.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell sx={bodyCellSx}>
                              {entry.activity}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {formatMdyDate(entry.dateFrom)} -{" "}
                              {formatMdyDate(entry.dateTo)}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {entry.dayFrom} - {entry.dayTo}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              <Stack spacing={0.35}>
                                {entry.times.map((range, timeIndex) => (
                                  <span key={`${entry.id}-${timeIndex}`}>
                                    {formatTimeRange(range)}
                                  </span>
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              <DenseRowIconActions
                                onEdit={() => openEditBlocked(entry)}
                                onDelete={() =>
                                  setDeleteTarget({
                                    kind: "blocked",
                                    id: entry.id,
                                  })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <CalendarAvailabilityModal
        open={availabilityModalOpen}
        draft={availabilityDraft}
        resources={resources}
        availableLocations={supportedLocations}
        teamLabelById={teamLabelById}
        title={
          availabilityMode === "edit" ? "Edit Availability" : "Add Availability"
        }
        onClose={() => setAvailabilityModalOpen(false)}
        onApply={applyAvailability}
        setDraft={setAvailabilityDraft}
      />

      <CalendarBlockTimeModal
        open={blockModalOpen}
        mode={blockMode}
        variant="schedule"
        draft={blockDraft}
        resources={resources}
        availableLocations={supportedLocations}
        editingTeamMemberName={editingBlockedName}
        onClose={() => setBlockModalOpen(false)}
        onApply={applyBlocked}
        setDraft={setBlockDraft}
      />

      <CalendarScheduleDeleteDialog
        open={Boolean(deleteTarget)}
        variant={deleteTarget?.kind === "blocked" ? "blocked" : "availability"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
