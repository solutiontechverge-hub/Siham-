"use client";

import AppButton from "../AppButton";
import * as React from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
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
import { formatLongDateUtc, formatMdyDate } from "./calendar.utils";
import {
  availabilityEntryToDraft,
  blockedEntryToDraft,
  buildAvailabilityEntriesFromDraft,
  buildBlockedEntryFromDraft,
  emptyAvailabilityDraft,
  type AvailabilityDraft,
} from "./schedule.utils";
import { BodyText, SubHeading } from "../../ui/typography";

type ScheduleStatusTab = "active" | "archived";

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

const formatScheduleTime = (time: string) => {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  if (Number.isNaN(hour)) return time;
  return `${hour}:${minute}`;
};

const formatTimeRange = (range: TeamScheduleTimeRange) =>
  `${formatScheduleTime(range.start)} - ${formatScheduleTime(range.end)}`;

const isDateInRange = (iso: string, from: string, to: string) =>
  iso >= from && iso <= to;

function ScheduleStatusTabs({
  value,
  onChange,
}: {
  value: ScheduleStatusTab;
  onChange: (next: ScheduleStatusTab) => void;
}) {
  const m = useTheme().palette.mollure;
  const tabs: { id: ScheduleStatusTab; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        borderRadius: "8px",
        bgcolor: "#fff",
        overflow: "hidden",
        p: 0.35,
        gap: 0.35,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Box
            key={tab.id}
            role="button"
            tabIndex={0}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onChange(tab.id);
            }}
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: "6px",
              fontSize: 13,
              fontWeight: active ? 800 : 600,
              color: alpha(m.navy, active ? 0.82 : 0.55),
              bgcolor: active ? alpha(m.navy, 0.06) : "transparent",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}

function ScheduleTableSection({
  title,
  columns,
  rows,
  emptyLabel,
}: {
  title: string;
  columns: readonly string[];
  rows: React.ReactNode;
  emptyLabel: string;
}) {
  const m = useTheme().palette.mollure;

  const headCellSx = {
    fontSize: 12,
    fontWeight: 900,
    color: alpha(m.navy, 0.62),
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: alpha(m.navy, 0.03),
    py: 1.1,
    textAlign: "center",
    whiteSpace: "nowrap",
    borderLeft: 0,
    borderRight: 0,
  } as const;

  const bodyCellSx = {
    fontSize: 13,
    fontWeight: 500,
    color: alpha(m.navy, 0.82),
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    py: 1.15,
    textAlign: "center",
    verticalAlign: "middle",
    borderLeft: 0,
    borderRight: 0,
  } as const;

  const hasRows = React.Children.count(rows) > 0;

  return (
    <Box>
      <BodyText
        sx={{
          fontSize: 13,
          fontWeight: 900,
          color: alpha(m.navy, 0.58),
          mb: 0.85,
        }}
      >
        {title}
      </BodyText>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={headCellSx}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {hasRows ? (
              rows
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{ ...bodyCellSx, color: alpha(m.navy, 0.45) }}
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

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
    title: "Custom",
    teamIds: [],
    locations: [...supportedLocations],
    dateFrom: activeDateIso,
    dateTo: activeDateIso,
    dayFrom: "Monday",
    dayTo: "Friday",
    startTime: "09:00",
    endTime: "17:00",
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

  const bodyCellSx = {
    fontSize: 13,
    fontWeight: 500,
    color: alpha(m.navy, 0.82),
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    py: 1.15,
    textAlign: "center",
    verticalAlign: "middle",
    borderLeft: 0,
    borderRight: 0,
  } as const;

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
      title: "Custom",
      teamIds: resources[0]?.id ? [resources[0].id] : [],
      locations: [...supportedLocations],
      dateFrom: activeDateIso,
      dateTo: activeDateIso,
      dayFrom: "Monday",
      dayTo: "Friday",
      startTime: "09:00",
      endTime: "17:00",
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
    if (!blockDraft.teamIds.length) return;
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

  const rowActions = (onEdit: () => void, onDelete: () => void) => (
    <Stack direction="row" spacing={0.35} justifyContent="center">
      <IconButton
        size="small"
        onClick={onEdit}
        sx={{ width: 28, height: 28, borderRadius: "8px" }}
      >
        <EditOutlinedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        sx={{ width: 28, height: 28, borderRadius: "8px" }}
      >
        <DeleteOutlineRoundedIcon
          sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }}
        />
      </IconButton>
    </Stack>
  );

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
              <SubHeading
                sx={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.9),
                  lineHeight: 1.2,
                }}
              >
                Team Member schedule
              </SubHeading>
              <BodyText
                sx={{ mt: 0.5, fontSize: 13, color: alpha(m.navy, 0.52) }}
              >
                Set Availability and block a time slot for the team members.
              </BodyText>
            </Box>

            <ScheduleStatusTabs value={statusTab} onChange={setStatusTab} />

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
                          fontSize: 14,
                          fontWeight: 800,
                          color: alpha(m.navy, 0.86),
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
                              {rowActions(
                                () => openEditAvailability(entry),
                                () =>
                                  setDeleteTarget({
                                    kind: "availability",
                                    id: entry.id,
                                  }),
                              )}
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
                              {rowActions(
                                () => openEditBlocked(entry),
                                () =>
                                  setDeleteTarget({
                                    kind: "blocked",
                                    id: entry.id,
                                  }),
                              )}
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
