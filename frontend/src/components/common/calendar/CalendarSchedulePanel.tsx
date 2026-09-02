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
import { BodyText, SubHeading } from "../../ui/typography";
import { AppCalendarPanel } from "../AppDatePicker";
import CalendarAvailabilityModal, {
  type AvailabilityDraft,
} from "./CalendarAvailabilityModal";
import CalendarBlockTimeModal from "./CalendarBlockTimeModal";
import CalendarScheduleAddMenu from "./CalendarScheduleAddMenu";
import CalendarScheduleDeleteDialog from "./CalendarScheduleDeleteDialog";
import type {
  CalendarBlock,
  CalendarBookingLocation,
  CalendarResource,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  createEmptyBlockTimeDraft,
  dedupeCalendarBlocks,
  formatLongDateUtc,
  formatMdyDate,
  isBlockTimeRangeFullyPast,
  siblingCalendarBlocks,
  toIsoLocalDate,
  weekdayNameFromIso,
  type BlockTimeDraft,
} from "./calendar.utils";
import type { ScheduleAvailabilityRow } from "./calendar-settings.types";
import {
  findBookingsInTimeslot,
  findConflictingAvailabilityRow,
  makeScheduleRowId,
  splitScheduleRowForDate,
  type ScheduleActiveBooking,
} from "./calendar-schedule.utils";
import CalendarScheduleConflictDialog, {
  type CalendarScheduleConflictKind,
} from "./CalendarScheduleConflictDialog";

type CalendarSchedulePanelProps = {
  activeDateIso: string;
  availableLocations: readonly CalendarBookingLocation[];
  blocks: readonly CalendarBlock[];
  isSaving?: boolean;
  onActiveDateChange: (iso: string) => void;
  onCreateBlockedTime: (draft: BlockTimeDraft) => Promise<void>;
  onDeleteBlockedEntry?: (entryId: string) => Promise<void>;
  onSaveScheduleRows: (rows: ScheduleAvailabilityRow[]) => Promise<void>;
  resources: readonly CalendarResource[];
  scheduleRows: readonly ScheduleAvailabilityRow[];
  selectedResourceIds: string[];
  onSelectedResourceIdsChange: (ids: string[]) => void;
  activeBookings?: readonly ScheduleActiveBooking[];
  onCancelBookingsInSlot?: (bookingIds: string[]) => Promise<void>;
};

type ScheduleStatusTab = "active" | "archived";

type DeleteTarget =
  { kind: "availability"; id: string } | { kind: "blocked"; id: string } | null;

const DAY_ABBR: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const formatDayRange = (from: string, to: string) =>
  `${DAY_ABBR[from] ?? from.slice(0, 3)} - ${DAY_ABBR[to] ?? to.slice(0, 3)}`;

const formatScheduleTime = (time: string) => {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  if (Number.isNaN(hour)) return time;
  return `${hour}:${minute}`;
};

const formatTimeRange = (start: string, end: string) =>
  `${formatScheduleTime(start)} – ${formatScheduleTime(end)}`;

const isDateInRange = (iso: string, from: string, to: string) =>
  iso >= from && iso <= to;

const defaultAvailabilityDraft = (
  resources: readonly CalendarResource[],
  locations: readonly CalendarBookingLocation[],
  dateIso: string,
): AvailabilityDraft => {
  const day = weekdayNameFromIso(dateIso);
  return {
    teamIds: resources.map((resource) => resource.id),
    locations: [...locations],
    dateFrom: dateIso,
    dateTo: dateIso,
    dayFrom: day,
    dayTo: day,
    shifts: [{ start: "09:00", end: "17:00" }],
  };
};

const defaultBlockDraft = (
  resources: readonly CalendarResource[],
  locations: readonly CalendarBookingLocation[],
  dateIso: string,
): BlockTimeDraft & { activity?: string } => ({
  ...createEmptyBlockTimeDraft(
    resources[0]?.id ? [resources[0].id] : [],
    locations,
    dateIso,
  ),
  activity: "",
});

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
        display: "inline-flex",
        borderRadius: "8px",
        bgcolor: "#fff",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
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
          border: `1px solid ${alpha(m.navy, 0.06)}`,
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

export default function CalendarSchedulePanel({
  activeDateIso,
  availableLocations,
  blocks,
  isSaving = false,
  onActiveDateChange,
  onCreateBlockedTime,
  onDeleteBlockedEntry,
  onSaveScheduleRows,
  resources,
  scheduleRows,
  selectedResourceIds,
  onSelectedResourceIdsChange,
  activeBookings = [],
}: CalendarSchedulePanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const todayIso = React.useMemo(() => toIsoLocalDate(new Date()), []);

  const [statusTab, setStatusTab] = React.useState<ScheduleStatusTab>("active");
  const [datePickerAnchor, setDatePickerAnchor] =
    React.useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = React.useState(false);
  const [availabilityMode, setAvailabilityMode] = React.useState<
    "add" | "edit"
  >("add");
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [availabilityDraft, setAvailabilityDraft] =
    React.useState<AvailabilityDraft>(() =>
      defaultAvailabilityDraft(resources, availableLocations, activeDateIso),
    );
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [blockDraft, setBlockDraft] = React.useState<
    BlockTimeDraft & { activity?: string }
  >(() => defaultBlockDraft(resources, availableLocations, activeDateIso));
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null);
  const [conflictKind, setConflictKind] =
    React.useState<CalendarScheduleConflictKind | null>(null);
  const pendingBlockRef = React.useRef<
    (BlockTimeDraft & { activity?: string }) | null
  >(null);

  const teamLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    resources.forEach((resource) => map.set(resource.id, resource.name));
    return map;
  }, [resources]);

  const isArchived = statusTab === "archived";

  const filteredRows = React.useMemo(
    () =>
      scheduleRows.filter((row) => {
        if (Boolean(row.archived) !== isArchived) return false;
        if (isArchived) return true;
        return isDateInRange(
          activeDateIso,
          row.dateFrom,
          row.dateTo || row.dateFrom,
        );
      }),
    [activeDateIso, isArchived, scheduleRows],
  );

  const filteredBlocks = React.useMemo(() => {
    if (isArchived) return [] as CalendarBlock[];
    return blocks.filter((block) => block.date === activeDateIso);
  }, [activeDateIso, blocks, isArchived]);

  const visibleResources = React.useMemo(() => {
    const base =
      selectedResourceIds.length > 0
        ? resources.filter((resource) =>
            selectedResourceIds.includes(resource.id),
          )
        : [...resources];
    const withData = base.filter((resource) => {
      const hasAvailability = filteredRows.some((row) =>
        row.resourceIds.includes(resource.id),
      );
      const hasBlocked = filteredBlocks.some(
        (block) => block.resourceId === resource.id,
      );
      return hasAvailability || hasBlocked;
    });
    return (withData.length ? withData : base.slice(0, 1)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filteredBlocks, filteredRows, resources, selectedResourceIds]);

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
    setEditingRowId(null);
    setAvailabilityDraft(
      defaultAvailabilityDraft(resources, availableLocations, activeDateIso),
    );
    setAvailabilityOpen(true);
  };

  const openEditAvailability = (row: ScheduleAvailabilityRow) => {
    setAvailabilityMode("edit");
    setEditingRowId(row.id);
    setAvailabilityDraft({
      teamIds: [...row.resourceIds],
      locations: [...row.locations],
      dateFrom: row.dateFrom,
      dateTo: row.dateTo || row.dateFrom,
      dayFrom: row.dayFrom,
      dayTo: row.dayTo,
      shifts: row.shifts.length
        ? [...row.shifts]
        : [{ start: "09:00", end: "17:00" }],
    });
    setAvailabilityOpen(true);
  };

  const applyAvailability = async () => {
    if (
      !availabilityDraft.teamIds.length ||
      !availabilityDraft.locations.length
    )
      return;
    const dateTo = availabilityDraft.dateTo || availabilityDraft.dateFrom;
    const nextRow: ScheduleAvailabilityRow = {
      id: editingRowId ?? makeScheduleRowId(),
      resourceIds: availabilityDraft.teamIds,
      locations: availabilityDraft.locations.filter((location) =>
        availableLocations.includes(location),
      ),
      dateFrom: availabilityDraft.dateFrom,
      dateTo,
      dayFrom: weekdayNameFromIso(availabilityDraft.dateFrom),
      dayTo: weekdayNameFromIso(dateTo),
      shifts: availabilityDraft.shifts,
      archived: false,
    };
    const conflict = findConflictingAvailabilityRow(
      scheduleRows,
      nextRow,
      availabilityMode === "edit" ? editingRowId : null,
    );
    if (conflict) {
      setConflictKind("availability_set");
      return;
    }

    let nextRows: ScheduleAvailabilityRow[];
    const original =
      availabilityMode === "edit" && editingRowId
        ? scheduleRows.find((row) => row.id === editingRowId)
        : null;
    const isSingleDaySplit =
      original &&
      original.dateFrom !== original.dateTo &&
      nextRow.dateFrom === nextRow.dateTo &&
      nextRow.dateFrom === activeDateIso;

    if (isSingleDaySplit && original) {
      const split = splitScheduleRowForDate(original, activeDateIso, {
        resourceIds: nextRow.resourceIds,
        locations: nextRow.locations,
        shifts: nextRow.shifts,
      });
      nextRows = scheduleRows.flatMap((row) =>
        row.id === original.id ? split : [row],
      );
    } else if (availabilityMode === "edit" && editingRowId) {
      nextRows = scheduleRows.map((row) =>
        row.id === editingRowId ? nextRow : row,
      );
    } else {
      nextRows = [...scheduleRows, nextRow];
    }
    await onSaveScheduleRows(nextRows);
    setAvailabilityOpen(false);
  };

  const commitBlocked = async (
    draft: BlockTimeDraft & { activity?: string },
  ) => {
    await onCreateBlockedTime(draft);
    setBlockOpen(false);
  };

  const applyBlocked = async () => {
    if (!blockDraft.title || !blockDraft.teamIds.length) return;
    const todayIso = toIsoLocalDate(new Date());
    const rangeEnd = blockDraft.dateTo || blockDraft.dateFrom;
    const fullyPast = isBlockTimeRangeFullyPast(
      blockDraft.dateFrom,
      rangeEnd,
      todayIso,
    );

    if (!fullyPast) {
      const overlappingBlock = blocks.some((block) => {
        if (block.date < todayIso) return false;
        if (!blockDraft.teamIds.includes(block.resourceId)) return false;
        if (block.date < blockDraft.dateFrom || block.date > rangeEnd) {
          return false;
        }
        const startMin = Number(block.start.replace(":", ""));
        const endMin = Number(block.end.replace(":", ""));
        const draftStart = Number(blockDraft.startTime.replace(":", ""));
        const draftEnd = Number(blockDraft.endTime.replace(":", ""));
        return startMin < draftEnd && draftStart < endMin;
      });
      if (overlappingBlock) {
        setConflictKind("timeslot_blocked");
        return;
      }
    }

    const colliding = findBookingsInTimeslot(
      activeBookings,
      blockDraft.teamIds,
      blockDraft.dateFrom,
      rangeEnd,
      blockDraft.startTime,
      blockDraft.endTime,
    );
    if (colliding.length) {
      pendingBlockRef.current = blockDraft;
      setConflictKind("overlap_booking");
      return;
    }
    await commitBlocked(blockDraft);
  };

  const openAddBlocked = () => {
    setBlockDraft(
      defaultBlockDraft(resources, availableLocations, activeDateIso),
    );
    setBlockOpen(true);
  };

  const deleteAllArchived = async () => {
    await onSaveScheduleRows(scheduleRows.filter((row) => !row.archived));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "availability") {
      await onSaveScheduleRows(
        scheduleRows.filter((row) => row.id !== deleteTarget.id),
      );
    } else if (onDeleteBlockedEntry) {
      const target =
        blocks.find((block) => block.id === deleteTarget.id) ?? null;
      const twins = target
        ? siblingCalendarBlocks(blocks, target)
        : [{ id: deleteTarget.id } as CalendarBlock];
      for (const twin of twins) {
        const rawId = twin.id.replace(/^blk-/, "");
        await onDeleteBlockedEntry(rawId);
      }
    }
    setDeleteTarget(null);
  };

  const rowActions = (onEdit: (() => void) | null, onDelete: () => void) => (
    <Stack direction="row" spacing={0.35} justifyContent="center">
      {onEdit ? (
        <IconButton
          size="small"
          onClick={onEdit}
          sx={{ width: 28, height: 28, borderRadius: "8px" }}
        >
          <EditOutlinedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
        </IconButton>
      ) : null}
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

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: 0,
          boxShadow: "0 8px 28px rgba(16, 35, 63, 0.06)",
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
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
              spacing={1}
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
                  disabled={isSaving}
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
              ) : (
                <AppButton
                  tone="danger"
                  disabled={isSaving || !scheduleRows.some((row) => row.archived)}
                  onClick={() => {
                    void deleteAllArchived();
                  }}
                  sx={{ fontSize: 11, height: 28, px: 1.25 }}
                >
                  Delete All
                </AppButton>
              )}

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
                  onChange={onActiveDateChange}
                  onDaySelect={() => setDatePickerAnchor(null)}
                  min={todayIso}
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
              {visibleResources.map((resource) => {
                const memberRows = filteredRows.filter((row) =>
                  row.resourceIds.includes(resource.id),
                );
                const memberBlocks = dedupeCalendarBlocks(
                  filteredBlocks.filter(
                    (block) => block.resourceId === resource.id,
                  ),
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
                        rows={memberRows.flatMap((row) =>
                          (row.locations.length
                            ? row.locations
                            : (["FL"] as CalendarBookingLocation[])
                          ).map((location) => (
                            <TableRow key={`${row.id}-${location}`}>
                              <TableCell sx={bodyCellSx}>{location}</TableCell>
                              <TableCell sx={bodyCellSx}>
                                {formatMdyDate(row.dateFrom)} –{" "}
                                {formatMdyDate(row.dateTo || row.dateFrom)}
                              </TableCell>
                              <TableCell sx={bodyCellSx}>
                                {formatDayRange(row.dayFrom, row.dayTo)}
                              </TableCell>
                              <TableCell sx={bodyCellSx}>
                                <Stack spacing={0.35} alignItems="center">
                                  {row.shifts.map((shift, index) => (
                                    <span key={`${row.id}-${index}`}>
                                      {formatTimeRange(shift.start, shift.end)}
                                    </span>
                                  ))}
                                </Stack>
                              </TableCell>
                              <TableCell sx={bodyCellSx}>
                                {isArchived
                                  ? "—"
                                  : rowActions(
                                      () => openEditAvailability(row),
                                      () =>
                                        setDeleteTarget({
                                          kind: "availability",
                                          id: row.id,
                                        }),
                                    )}
                              </TableCell>
                            </TableRow>
                          )),
                        )}
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
                        rows={memberBlocks.map((block) => (
                          <TableRow key={block.id}>
                            <TableCell sx={bodyCellSx}>
                              {block.title || "Blocked"}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {formatMdyDate(block.date)}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {new Date(
                                `${block.date}T00:00:00`,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {formatTimeRange(block.start, block.end)}
                            </TableCell>
                            <TableCell sx={bodyCellSx}>
                              {isArchived ||
                              !onDeleteBlockedEntry ||
                              !block.id.startsWith("blk-")
                                ? "—"
                                : rowActions(null, () =>
                                    setDeleteTarget({
                                      kind: "blocked",
                                      id: block.id,
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
        availableLocations={availableLocations}
        draft={availabilityDraft}
        onApply={() => {
          void applyAvailability();
        }}
        onClose={() => setAvailabilityOpen(false)}
        open={availabilityOpen}
        resources={resources}
        setDraft={setAvailabilityDraft}
        teamLabelById={teamLabelById}
        title={
          availabilityMode === "edit" ? "Edit Availability" : "Add Availability"
        }
      />

      <CalendarBlockTimeModal
        availableLocations={availableLocations}
        draft={blockDraft}
        mode="add"
        variant="schedule"
        onApply={() => {
          void applyBlocked();
        }}
        onClose={() => setBlockOpen(false)}
        open={blockOpen}
        resources={resources}
        setDraft={setBlockDraft}
        teamLabelById={teamLabelById}
      />

      <CalendarScheduleDeleteDialog
        open={Boolean(deleteTarget)}
        variant={deleteTarget?.kind === "blocked" ? "blocked" : "availability"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <CalendarScheduleConflictDialog
        open={Boolean(conflictKind)}
        kind={conflictKind}
        onClose={() => {
          setConflictKind(null);
          pendingBlockRef.current = null;
        }}
        onConfirm={() => {
          const draft = pendingBlockRef.current;
          pendingBlockRef.current = null;
          if (!draft) return;
          void commitBlocked(draft);
        }}
      />
    </>
  );
}
