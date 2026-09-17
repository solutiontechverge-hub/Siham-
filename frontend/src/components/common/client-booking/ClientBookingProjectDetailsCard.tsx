"use client";

import {
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";

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
          sx={mollureSectionTitleSx(m.navy, {
            m: 0,
            textAlign: "center",
            lineHeight: 1.2,
          })}
        >
          Project Details and Media
        </BodyText>
      </Box>
      <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
        <BodyText sx={mollureLabelSx(m.navy, { m: 0, mb: 0.75 })}>
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
            sx={mollureBodySx(m.navy, { m: 0, color: description ? alpha(m.navy, 0.72) : alpha(m.navy, 0.38), whiteSpace: "pre-wrap" })}
          >
            {description || "No description added"}
          </BodyText>
        </Box>

        <BodyText sx={mollureLabelSx(m.navy, { m: 0, mb: 0.75 })}>
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
            sx={mollureBodySx(m.navy, { m: 0, color: alpha(m.navy, 0.38) })}
          >
            No files uploaded
          </BodyText>
        )}
      </Box>
    </Box>
  );
}
