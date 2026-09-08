"use client";

import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ClientBookingDraftProjectDetails } from "./types";
import ProjectUploadThumb from "./ProjectUploadThumb";
import { BodyText } from "../../ui/typography";

type Props = {
  project: ClientBookingDraftProjectDetails;
};

export default function ClientBookingProjectDetailsCard({ project }: Props) {
  const m = useTheme().palette.mollure;
  const description = project.description?.trim() ?? "";
  const uploads = project.uploads ?? [];

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.18)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1.25 }}>
        <BodyText
          sx={{
            m: 0,
            fontWeight: 900,
            fontSize: 13,
            color: alpha(m.navy, 0.72),
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Project Details and Media
        </BodyText>
      </Box>
      <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
        <BodyText
          sx={{
            m: 0,
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          Description
        </BodyText>
        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: alpha(m.navy, 0.02),
            px: 1.5,
            py: 1.15,
            mb: 1.75,
          }}
        >
          <BodyText
            sx={{
              m: 0,
              fontSize: 12.5,
              fontWeight: 700,
              color: description ? alpha(m.navy, 0.72) : alpha(m.navy, 0.38),
              whiteSpace: "pre-wrap",
            }}
          >
            {description || "No description added"}
          </BodyText>
        </Box>

        <BodyText
          sx={{
            m: 0,
            fontSize: 12,
            fontWeight: 900,
            color: alpha(m.navy, 0.65),
            mb: 0.75,
          }}
        >
          Media
        </BodyText>
        {uploads.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {uploads.map((upload) => (
              <ProjectUploadThumb key={upload.id} upload={upload} />
            ))}
          </Stack>
        ) : (
          <BodyText
            sx={{
              m: 0,
              fontSize: 12.5,
              fontWeight: 700,
              color: alpha(m.navy, 0.38),
            }}
          >
            No files uploaded
          </BodyText>
        )}
      </Box>
    </Box>
  );
}
