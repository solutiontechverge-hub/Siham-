"use client";

import * as React from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";
import AppPillTabs from "../AppPillTabs";
import { AppCalendarPanel } from "../AppDatePicker";
import CalendarAvailabilityModal, { type AvailabilityDraft } from "./CalendarAvailabilityModal";
import CalendarBlockTimeModal from "./CalendarBlockTimeModal";
import type { CalendarBlock, CalendarBookingLocation, CalendarResource } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  addMonthsIso,
  buildBlocksFromDraft,
  formatMdyDate,
  formatMonthYearUtc,
  toIsoLocalDate,
  toMonthIso,
  type BlockTimeDraft,
} from "./calendar.utils";
import type { ScheduleAvailabilityRow } from "./calendar-settings.types";
import { hasAvailabilityOnDate, makeScheduleRowId } from "./calendar-schedule.utils";

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
};

const defaultAvailabilityDraft = (resources: readonly CalendarResource[], dateIso: string): AvailabilityDraft => ({
  teamIds: resources.map((resource) => resource.id),
  locations: ["FL", "DL"],
  dateFrom: dateIso,
  dateTo: dateIso,
  dayFrom: "Monday",
  dayTo: "Friday",
  shifts: [{ start: "09:00", end: "17:00" }],
});

const defaultBlockDraft = (resources: readonly CalendarResource[], dateIso: string): BlockTimeDraft => ({
  title: "Meeting",
  teamIds: resources.map((resource) => resource.id),
  locations: ["FL", "DL"],
  dateFrom: dateIso,
  dateTo: dateIso,
  dayFrom: "Monday",
  dayTo: "Friday",
  startTime: "12:00",
  endTime: "13:00",
});

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
}: CalendarSchedulePanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const todayIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const [menuTab, setMenuTab] = React.useState<"Active" | "Archived">("Active");
  const [addAnchor, setAddAnchor] = React.useState<HTMLElement | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [availabilityDraft, setAvailabilityDraft] = React.useState<AvailabilityDraft>(() =>
    defaultAvailabilityDraft(resources, activeDateIso),
  );
  const [blockDraft, setBlockDraft] = React.useState<BlockTimeDraft>(() => defaultBlockDraft(resources, activeDateIso));
  const activeMonthIso = toMonthIso(activeDateIso);

  const teamLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    resources.forEach((resource) => map.set(resource.id, resource.name));
    return map;
  }, [resources]);

  const visibleResources = React.useMemo(() => {
    if (!selectedResourceIds.length) return [...resources].sort((a, b) => a.name.localeCompare(b.name));
    return resources
      .filter((resource) => selectedResourceIds.includes(resource.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [resources, selectedResourceIds]);

  const activeRows = scheduleRows.filter((row) => !row.archived);
  const archivedRows = scheduleRows.filter((row) => row.archived);
  const rowsForMenu = menuTab === "Active" ? activeRows : archivedRows;

  const monthHasAvailability = React.useCallback(
    (iso: string) => hasAvailabilityOnDate(activeRows, iso),
    [activeRows],
  );

  const deleteRow = async (rowId: string) => {
    const next = scheduleRows.filter((row) => row.id !== rowId);
    await onSaveScheduleRows(next);
  };

  const archiveAll = async () => {
    const next = scheduleRows.map((row) => ({ ...row, archived: true }));
    await onSaveScheduleRows(next);
  };

  return (
    <Stack spacing={1.5}>
      <Paper elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ minWidth: 280 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <IconButton size="small" onClick={() => onActiveDateChange(addMonthsIso(activeMonthIso, -1))}>
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.78) }}>{formatMonthYearUtc(activeMonthIso)}</BodyText>
              <IconButton size="small" onClick={() => onActiveDateChange(addMonthsIso(activeMonthIso, 1))}>
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <AppCalendarPanel
              value={activeDateIso}
              onChange={onActiveDateChange}
              min={todayIso}
              daySx={(iso) => ({
                bgcolor: monthHasAvailability(iso) ? alpha(m.teal, 0.08) : undefined,
                opacity: monthHasAvailability(iso) ? 1 : 0.72,
              })}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <AppPillTabs
                tabs={[{ label: "Active" }, { label: "Archived" }]}
                active={menuTab}
                onChange={(next) => setMenuTab(next as "Active" | "Archived")}
                alignStart
              />
              <Box sx={{ flex: 1 }} />
              {menuTab === "Archived" ? (
                <Button variant="outlined" onClick={archiveAll} disabled={isSaving} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Delete All
                </Button>
              ) : null}
              <Button
                variant="contained"
                disableElevation
                endIcon={<KeyboardArrowDownRoundedIcon />}
                onClick={(e) => setAddAnchor(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 800, bgcolor: m.teal, "&:hover": { bgcolor: m.tealDark } }}
              >
                Add
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }} useFlexGap>
              <Button
                variant={selectedResourceIds.length === 0 ? "contained" : "outlined"}
                onClick={() => onSelectedResourceIdsChange([])}
                sx={{ textTransform: "none", fontWeight: 800, bgcolor: selectedResourceIds.length === 0 ? m.teal : "#fff" }}
              >
                All
              </Button>
              {[...resources]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((resource) => {
                  const active = selectedResourceIds.includes(resource.id);
                  return (
                    <Button
                      key={resource.id}
                      variant={active ? "contained" : "outlined"}
                      onClick={() =>
                        onSelectedResourceIdsChange(
                          active ? selectedResourceIds.filter((id) => id !== resource.id) : [...selectedResourceIds, resource.id],
                        )
                      }
                      sx={{ textTransform: "none", fontWeight: 800, bgcolor: active ? m.teal : "#fff" }}
                    >
                      {resource.name}
                    </Button>
                  );
                })}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {visibleResources.map((resource) => {
        const resourceRows = rowsForMenu.filter((row) => row.resourceIds.includes(resource.id));
        const resourceBlocks = blocks.filter((block) => block.resourceId === resource.id);

        return (
          <Paper key={resource.id} elevation={0} sx={{ borderRadius: "2px", bgcolor: "#fff", p: 2 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(m.teal, 0.14), color: m.teal, fontWeight: 800, fontSize: 11 }}>
                {resource.avatarText}
              </Avatar>
              <BodyText sx={{ fontSize: 14, fontWeight: 900, color: alpha(m.navy, 0.82) }}>{resource.name}</BodyText>
            </Stack>

            <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 1 }}>Availability</BodyText>
            <Box sx={{ overflowX: "auto", mb: 2 }}>
              <Box sx={{ minWidth: 720, border: `1px solid ${alpha(m.navy, 0.08)}`, borderRadius: "8px" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "90px 1.2fr 1fr 1fr 90px", bgcolor: alpha(m.navy, 0.03), px: 1.25, py: 1 }}>
                  {["Location", "Date – Date", "Day – Day", "Time – Time", "Action"].map((label) => (
                    <BodyText key={label} sx={{ fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.55) }}>
                      {label}
                    </BodyText>
                  ))}
                </Box>
                {resourceRows.length ? (
                  resourceRows.map((row) => (
                    <Box key={row.id} sx={{ display: "grid", gridTemplateColumns: "90px 1.2fr 1fr 1fr 90px", px: 1.25, py: 1, borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{row.locations.join(" / ")}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{formatMdyDate(row.dateFrom)} – {formatMdyDate(row.dateTo)}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{row.dayFrom} – {row.dayTo}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{row.shifts.map((shift) => `${shift.start} – ${shift.end}`).join(", ")}</BodyText>
                      {menuTab === "Active" ? (
                        <Stack direction="row" spacing={0.5}>
                          <ButtonBase onClick={() => deleteRow(row.id)} sx={{ fontSize: 11, fontWeight: 800, color: m.teal }}>Delete</ButtonBase>
                        </Stack>
                      ) : (
                        <BodyText sx={{ fontSize: 11, color: alpha(m.navy, 0.45) }}>Read only</BodyText>
                      )}
                    </Box>
                  ))
                ) : (
                  <Box sx={{ px: 1.25, py: 1.5 }}>
                    <BodyText sx={{ fontSize: 11.5, color: alpha(m.navy, 0.45) }}>No availability set.</BodyText>
                  </Box>
                )}
              </Box>
            </Box>

            <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.62), mb: 1 }}>Blocked Time</BodyText>
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 720, border: `1px solid ${alpha(m.navy, 0.08)}`, borderRadius: "8px" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 90px", bgcolor: alpha(m.navy, 0.03), px: 1.25, py: 1 }}>
                  {["Date – Date", "Day – Day", "Time – Time", "Description", "Action"].map((label) => (
                    <BodyText key={label} sx={{ fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.55) }}>
                      {label}
                    </BodyText>
                  ))}
                </Box>
                {resourceBlocks.length ? (
                  resourceBlocks.map((block) => (
                    <Box key={block.id} sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 90px", px: 1.25, py: 1, borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{formatMdyDate(block.date)}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{new Date(`${block.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" })}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{block.start} – {block.end}</BodyText>
                      <BodyText sx={{ fontSize: 11.5, fontWeight: 700 }}>{block.title}</BodyText>
                      {menuTab === "Active" && onDeleteBlockedEntry && block.id.startsWith("blk-") ? (
                        <ButtonBase
                          onClick={() => {
                            const rawId = block.id.replace(/^blk-/, "");
                            void onDeleteBlockedEntry(rawId);
                          }}
                          sx={{ fontSize: 11, fontWeight: 800, color: m.teal }}
                        >
                          Delete
                        </ButtonBase>
                      ) : (
                        <BodyText sx={{ fontSize: 11, color: alpha(m.navy, 0.45) }}>—</BodyText>
                      )}
                    </Box>
                  ))
                ) : (
                  <Box sx={{ px: 1.25, py: 1.5 }}>
                    <BodyText sx={{ fontSize: 11.5, color: alpha(m.navy, 0.45) }}>No blocked time set.</BodyText>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}

      <Menu open={Boolean(addAnchor)} anchorEl={addAnchor} onClose={() => setAddAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAvailabilityDraft(defaultAvailabilityDraft(resources, activeDateIso));
            setAvailabilityOpen(true);
            setAddAnchor(null);
          }}
        >
          Availability
        </MenuItem>
        <MenuItem
          onClick={() => {
            setBlockDraft(defaultBlockDraft(resources, activeDateIso));
            setBlockOpen(true);
            setAddAnchor(null);
          }}
        >
          Blocked Time
        </MenuItem>
      </Menu>

      <CalendarAvailabilityModal
        availableLocations={availableLocations}
        draft={availabilityDraft}
        onApply={async () => {
          const nextRow: ScheduleAvailabilityRow = {
            id: makeScheduleRowId(),
            resourceIds: availabilityDraft.teamIds,
            locations: availabilityDraft.locations.filter((location) => availableLocations.includes(location)),
            dateFrom: availabilityDraft.dateFrom,
            dateTo: availabilityDraft.dateTo || availabilityDraft.dateFrom,
            dayFrom: availabilityDraft.dayFrom,
            dayTo: availabilityDraft.dayTo,
            shifts: availabilityDraft.shifts,
          };
          await onSaveScheduleRows([...scheduleRows, nextRow]);
          setAvailabilityOpen(false);
        }}
        onClose={() => setAvailabilityOpen(false)}
        open={availabilityOpen}
        resources={resources}
        setDraft={setAvailabilityDraft}
        teamLabelById={teamLabelById}
      />

      <CalendarBlockTimeModal
        availableLocations={availableLocations}
        draft={blockDraft}
        onApply={async () => {
          await onCreateBlockedTime(blockDraft);
          setBlockOpen(false);
        }}
        onClose={() => setBlockOpen(false)}
        open={blockOpen}
        resources={resources}
        setDraft={setBlockDraft}
        teamLabelById={teamLabelById}
      />
    </Stack>
  );
}
