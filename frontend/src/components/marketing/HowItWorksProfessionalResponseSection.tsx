"use client";

import { Box, Stack } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { ContentCard } from "../common";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import {
  MOLLURE_HEADING_BODY_GAP_PX,
  mollureHeadingBodyGapSx,
  mollureSectionGapSx,
} from "../../theme/spacing";
import { Typography } from "../ui/typography";
import {
  CheckOutlined,
  CheckCircle,
  EditOutlined,
  Cancel,
} from "@mui/icons-material";
import { cardTitleSx, sectionHeadingSx } from "./HowItWorksPagePrimitives";

export function HowItWorksProfessionalResponseSection() {
  return (
      <Box
        sx={{
          ...mollureSectionGapSx,
          borderRadius: 3,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            ...sectionHeadingSx,
            textAlign: "center",
            ...mollureHeadingBodyGapSx,
          }}
        >
          {howItWorksData.professionalResponse.title}
        </Typography>
        <Box sx={{ bgcolor: "mollure.cardbg", p: 2.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: "left",
              mb: `${MOLLURE_HEADING_BODY_GAP_PX}px`,
              lineHeight: 1.7,
            }}
          >
            {howItWorksData.professionalResponse.intro}
          </Typography>
          <Stack spacing={2.5}>
            {howItWorksData.professionalResponse.actions.map((action) => {
              const iconWrap =
                action.key === "accept"
                  ? {
                      bgcolor: (t: Theme) =>
                        alpha(t.palette.success.main, 0.18),
                      color: "success.main" as const,
                      icon: <CheckCircle sx={{ fontSize: 28 }} />,
                    }
                  : action.key === "edit"
                    ? {
                        bgcolor: (t: Theme) =>
                          alpha(t.palette.primary.main, 0.16),
                        color: "primary.main" as const,
                        icon: <EditOutlined sx={{ fontSize: 28 }} />,
                      }
                    : {
                        bgcolor: (t: Theme) =>
                          alpha(t.palette.error.main, 0.14),
                        color: "error.main" as const,
                        icon: <Cancel sx={{ fontSize: 28 }} />,
                      };
              return (
                <ContentCard
                  key={action.key}
                  sx={{ bgcolor: "background.paper" }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: iconWrap.bgcolor,
                        color: iconWrap.color,
                      }}
                    >
                      {iconWrap.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ ...cardTitleSx, mb: 0.5 }}
                      >
                        {action.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={
                          "bullets" in action && action.bullets
                            ? { mb: 1 }
                            : undefined
                        }
                      >
                        {action.body}
                      </Typography>
                      {"bullets" in action && action.bullets ? (
                        <Box
                          component="ul"
                          sx={{ m: 0, pl: 2.25, color: "text.secondary" }}
                        >
                          {action.bullets.map((b, i) => (
                            <Typography
                              key={b}
                              component="li"
                              variant="body2"
                              sx={
                                i < action.bullets!.length - 1
                                  ? { mb: 0.75 }
                                  : undefined
                              }
                            >
                              {b}
                            </Typography>
                          ))}
                        </Box>
                      ) : null}
                    </Box>
                  </Stack>
                </ContentCard>
              );
            })}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: "mollure.mintSoft",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: "primary.main",
              color: "common.white",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CheckOutlined sx={{ fontSize: 16 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "mollure.textcolorgrey700",
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            {howItWorksData.professionalResponse.footnote}
          </Typography>
        </Box>
      </Box>
  );
}
