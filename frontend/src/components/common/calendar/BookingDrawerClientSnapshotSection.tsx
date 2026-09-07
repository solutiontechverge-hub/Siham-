"use client";

import * as React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarBookingClientSnapshot } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";
import ProjectUploadThumb from "../client-booking/ProjectUploadThumb";
import { formatServiceTimeRange } from "../../../data/bookingServiceEdit.data";
import {
  bookingParticipantDisplayHeading,
  planningScheduleMeta,
} from "../client-booking/buildBookingSummarySections";

type Props = {
  snapshot?: CalendarBookingClientSnapshot | null;
  /** Guest/model blocks already shown in the drawer editor — skip to avoid a duplicate heading. */
  hiddenPersonIds?: readonly string[];
};

export default function BookingDrawerClientSnapshotSection({
  snapshot,
  hiddenPersonIds,
}: Props) {
  const m = useTheme().palette.mollure;
  if (!snapshot) return null;

  const people = snapshot.people ?? [];
  const services = snapshot.services ?? [];
  const project = snapshot.projectDetails;
  const hasProject =
    Boolean(project?.description?.trim()) ||
    (project?.uploads?.length ?? 0) > 0;

  const teamNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const tm of snapshot.teamMembers ?? []) map.set(tm.id, tm.name);
    return map;
  }, [snapshot.teamMembers]);

  const hiddenIds = React.useMemo(
    () => new Set((hiddenPersonIds ?? []).map(String)),
    [hiddenPersonIds],
  );
  const hideGuestBlocks = hiddenIds.size > 0;
  const nonRequesterPeople = people.filter((p) => {
    if (p.isRequester) return false;
    if (p.participantType === "notes") return false;
    if (hiddenIds.has(String(p.id))) return false;
    if (!hideGuestBlocks) return true;
    const isPlanning =
      p.participantType === "planning" || p.name === "Planning";
    const isBuffer = p.participantType === "buffer";
    // Guest / model already appear in the booking guests editor below.
    return isPlanning || isBuffer;
  });
  if (!hasProject && nonRequesterPeople.length === 0) return null;

  const modelTotal = nonRequesterPeople.filter(
    (person) => person.participantType === "model",
  ).length;
  const guestTotal = nonRequesterPeople.filter(
    (person) =>
      person.participantType !== "planning" &&
      person.participantType !== "buffer" &&
      person.participantType !== "model" &&
      person.name !== "Planning",
  ).length;
  const bufferTotal = nonRequesterPeople.filter(
    (person) => person.participantType === "buffer",
  ).length;
  let modelOrdinal = 0;
  let guestOrdinal = 0;
  let bufferOrdinal = 0;

  return (
    <Stack spacing={1.75} sx={{ mt: 1.5 }}>
      {hasProject ? (
        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            bgcolor: "#fff",
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 13,
              color: m.headingText,
              mb: 1,
            }}
          >
            Project Details and Media
          </Typography>
          {project?.description?.trim() ? (
            <Box
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                bgcolor: alpha(m.navy, 0.02),
                px: 1.25,
                py: 1,
                mb: (project.uploads?.length ?? 0) > 0 ? 1 : 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.62),
                  whiteSpace: "pre-wrap",
                }}
              >
                {project.description}
              </Typography>
            </Box>
          ) : null}
          {(project?.uploads?.length ?? 0) > 0 ? (
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 12,
                  color: m.headingText,
                  mb: 0.75,
                }}
              >
                Media
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {project!.uploads.map((upload) => (
                  <ProjectUploadThumb key={upload.id} upload={upload} />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {nonRequesterPeople.map((person) => {
        const personServices = services.filter((s) => s.guestId === person.id);
        const isPlanning =
          person.participantType === "planning" || person.name === "Planning";
        const isBuffer = person.participantType === "buffer";
        const isModel = person.participantType === "model";
        if (isModel) modelOrdinal += 1;
        else if (isBuffer) bufferOrdinal += 1;
        else if (!isPlanning) guestOrdinal += 1;

        const title = bookingParticipantDisplayHeading(
          {
            title: person.name,
            participantType: isBuffer
              ? "buffer"
              : isPlanning
                ? "planning"
                : isModel
                  ? "model"
                  : "guest",
          },
          isBuffer
            ? { index: bufferOrdinal, total: bufferTotal }
            : isPlanning
              ? undefined
              : isModel
                ? { index: modelOrdinal, total: modelTotal }
                : { index: guestOrdinal, total: guestTotal },
        );

        const hasPlanning =
          (isPlanning || isBuffer) &&
          Boolean(
            person.planningActivity?.trim() ||
              person.planningDuration?.trim() ||
              person.planningStartTime?.trim() ||
              person.planningEndTime?.trim() ||
              person.bufferStartTime?.trim() ||
              person.bufferEndTime?.trim(),
          );
        if (!personServices.length && !hasPlanning && !isPlanning && !isBuffer) {
          return null;
        }

        return (
          <Box
            key={person.id}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              bgcolor: "#fff",
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.15}
              sx={{ mb: 1 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(m.teal, 0.12),
                  color: m.teal,
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {title.charAt(0).toUpperCase()}
              </Avatar>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  color: m.headingText,
                }}
              >
                {title}
              </Typography>
            </Stack>
            {hasPlanning ? (
              <Box
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  bgcolor: "#fff",
                  px: 1.25,
                  py: 1,
                  mb: personServices.length ? 0.75 : 0,
                }}
              >
                {person.planningActivity?.trim() ? (
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.82),
                    }}
                  >
                    {person.planningActivity}
                  </Typography>
                ) : null}
                {(() => {
                  const meta = planningScheduleMeta({
                    startTime:
                      person.planningStartTime || person.bufferStartTime,
                    endTime: person.planningEndTime || person.bufferEndTime,
                    planningItem: {
                      activity: person.planningActivity ?? "",
                      duration: person.planningDuration ?? "",
                    },
                  });
                  if (!meta.timeRange && !meta.durationLabel) return null;
                  return (
                    <ServiceSummaryMetaLine
                      timeRange={meta.timeRange}
                      durationLabel={meta.durationLabel}
                    />
                  );
                })()}
              </Box>
            ) : null}
            <Stack spacing={0.75}>
              {personServices.map((service) => {
                const staffFull =
                  (service.teamMemberId
                    ? teamNameById.get(String(service.teamMemberId))
                    : undefined) || service.teamMemberName?.trim();
                const staff = staffFull?.split(/\s+/)[0];
                return (
                  <Box
                    key={service.id}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      bgcolor: "#fff",
                      px: 1.25,
                      py: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 900,
                            color: alpha(m.navy, 0.82),
                          }}
                        >
                          {service.name}
                        </Typography>
                        <ServiceSummaryMetaLine
                          timeRange={formatServiceTimeRange(
                            service.startTime,
                            service.endTime,
                          )}
                          durationLabel={`${service.durationMins} Mins`}
                          staffName={staff?.trim() || "Unassigned"}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 900,
                          color: alpha(m.navy, 0.82),
                        }}
                      >
                        €{service.price}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
