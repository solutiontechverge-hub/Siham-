"use client";

import { Box, Stack } from "@mui/material";

import { alpha } from "@mui/material/styles";

import { mollureSectionTitleSx } from "../../../../theme/mollureHierarchy";

import { BodyText } from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import AppDropdown from "../../AppDropdown";

import AppTimePicker from "../../AppTimePicker";

import { formatTimeWindowDurationLabel, positiveMinutesBetweenTimes } from "../../../../data/bookingServiceEdit.data";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerSubScreensBufferBag = Pick<
  Vm,
  | "bufferDraft"
  | "data"
  | "editingBufferId"
  | "isViewingExisting"
  | "m"
  | "setBufferDraft"
  | "slotErrors"
>;

type Props = { bag: ProfessionalFixedLocationCalendarBookingDrawerSubScreensBufferBag };

export default function ProfessionalFixedLocationCalendarBookingDrawerSubScreensBuffer({ bag }: Props) {
  const {
    bufferDraft,
    data,
    editingBufferId,
    isViewingExisting,
    m,
    setBufferDraft,
    slotErrors,
  } = bag;

  return (
      <Stack spacing={1.5} sx={{ px: 0.25 }}>
        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <BodyText
            sx={{
              ...mollureSectionTitleSx(m.navy),
            }}
          >
            {editingBufferId ? "Edit Buffer" : "Buffer"}
          </BodyText>
          <BodyText
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: alpha(m.navy, 0.48),
            }}
          >
            (Internal only)
          </BodyText>
        </Stack>
        <AppTextField
          label="Title"
          placeholder="Enter title"
          value={bufferDraft.title}
          onChange={(e) =>
            setBufferDraft((prev) => ({
              ...prev,
              title: e.target.value,
            }))
          }
          fullWidth
          disabled={isViewingExisting}
          error={Boolean(slotErrors.bufferTitle)}
          helperText={slotErrors.bufferTitle}
        />
        <AppDropdown
          label="Team Member"
          placeholder="Select team member"
          multiple
          selectAll
          value={bufferDraft.teamMemberIds}
          renderValue={(selected) => {
            const ids = (selected as readonly string[]).filter(
              Boolean,
            );
            if (!ids.length) return "Select team member";
            if (
              data.resources.length > 0 &&
              ids.length === data.resources.length
            ) {
              return "All";
            }
            return ids
              .map(
                (id) =>
                  data.resources.find(
                    (resource) => resource.id === id,
                  )?.name ?? id,
              )
              .join(", ");
          }}
          onChange={(value) => {
            setBufferDraft((prev) => ({
              ...prev,
              teamMemberIds: (value as string[]).filter(Boolean),
            }));
          }}
          options={data.resources.map((resource) => ({
            label: resource.name,
            value: resource.id,
          }))}
          fullWidth
          disabled={isViewingExisting}
          error={Boolean(slotErrors.bufferTeamMembers)}
          helperText={slotErrors.bufferTeamMembers}
        />
        <Stack direction="row" spacing={1.25}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTimePicker
              label="Start Time"
              value={bufferDraft.startTime}
              onChange={(startTime) => {
                setBufferDraft((prev) => {
                  const mins = positiveMinutesBetweenTimes(
                    startTime,
                    prev.endTime,
                  );
                  return {
                    ...prev,
                    startTime,
                    durationMins: mins > 0 ? String(mins) : "",
                  };
                });
              }}
              minuteStep={15}
              fullWidth
              disabled={isViewingExisting}
              error={Boolean(slotErrors.bufferStartTime)}
              helperText={slotErrors.bufferStartTime}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTimePicker
              label="End Time"
              value={bufferDraft.endTime}
              onChange={(endTime) => {
                setBufferDraft((prev) => {
                  const mins = positiveMinutesBetweenTimes(
                    prev.startTime,
                    endTime,
                  );
                  return {
                    ...prev,
                    endTime,
                    durationMins: mins > 0 ? String(mins) : "",
                  };
                });
              }}
              minuteStep={15}
              fullWidth
              disabled={isViewingExisting}
              error={Boolean(slotErrors.bufferEndTime)}
              helperText={slotErrors.bufferEndTime}
            />
          </Box>
        </Stack>
        <AppTextField
          label="Duration"
          placeholder="â€”"
          value={
            formatTimeWindowDurationLabel(
              bufferDraft.startTime,
              bufferDraft.endTime,
              bufferDraft.durationMins,
            ) || ""
          }
          fullWidth
          disabled
          error={Boolean(slotErrors.bufferDuration)}
          helperText={slotErrors.bufferDuration}
          InputProps={{ readOnly: true }}
        />
      </Stack>
  );
}
