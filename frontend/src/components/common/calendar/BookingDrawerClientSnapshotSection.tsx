"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CalendarBookingClientSnapshot } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { ServiceSummaryMetaLine } from "../ServiceSummaryMetaLine";

type Props = {
  snapshot?: CalendarBookingClientSnapshot | null;
};

export default function BookingDrawerClientSnapshotSection({
  snapshot,
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

  const nonRequesterPeople = people.filter((p) => !p.isRequester);
  if (!hasProject && nonRequesterPeople.length === 0) return null;

  let modelOrdinal = 0;

  return (
    <Stack spacing={1.75} sx={{ mt: 1.5 }}>
      {hasProject ? (
        <Box>
          <Stack
            direction="row"
            alignItems="baseline"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 12.5,
                color: alpha(m.navy, 0.78),
              }}
            >
              Project
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 11, color: m.teal }}>
              Detail
            </Typography>
          </Stack>
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
                  fontSize: 11.5,
                  color: alpha(m.navy, 0.68),
                  mb: 0.75,
                }}
              >
                Uploaded
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {project!.uploads.map((upload) => (
                  <Box
                    key={upload.id}
                    sx={{
                      minWidth: 64,
                      maxWidth: 88,
                      borderRadius: "8px",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      bgcolor: alpha(m.navy, 0.04),
                      px: 0.75,
                      py: 0.6,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.55),
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {upload.name}
                    </Typography>
                  </Box>
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

        const title = isBuffer
          ? person.name.trim()
            ? `Buffer: ${person.name}`
            : "Buffer"
          : isPlanning
            ? "Planning Details"
            : isModel
              ? person.name.trim() && person.name.trim().toLowerCase() !== "model"
                ? person.name
                : `Model ${modelOrdinal}`
              : person.name.trim() && person.name.trim().toLowerCase() !== "guest"
                ? `Guest: ${person.name}`
                : "Guest";

        const hasPlanning =
          (isPlanning || isBuffer) &&
          Boolean(
            person.planningActivity?.trim() || person.planningDuration?.trim(),
          );
        if (!personServices.length && !hasPlanning) return null;

        return (
          <Box key={person.id}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 12.5,
                color: alpha(m.navy, 0.72),
                mb: 0.85,
              }}
            >
              {title}
            </Typography>
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
                {person.planningDuration?.trim() ? (
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.48),
                      mt: 0.25,
                    }}
                  >
                    {person.planningDuration}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            <Stack spacing={0.75}>
              {personServices.map((service) => {
                const staff = service.teamMemberId
                  ? teamNameById.get(service.teamMemberId)?.split(/\s+/)[0]
                  : undefined;
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
                          durationLabel={`${service.durationMins} Mins`}
                        />
                        {staff ? (
                          <Typography
                            sx={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.48),
                              mt: 0.35,
                            }}
                          >
                            By {staff}
                          </Typography>
                        ) : null}
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
