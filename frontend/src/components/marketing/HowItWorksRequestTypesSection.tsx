"use client";

import Image from "next/image";
import { Box, Grid, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppCard } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import { mollureSectionGapSx } from "../../theme/spacing";
import { Typography } from "../ui/typography";
import {
  requestCardIconById,
  requestTypeIconSx,
  requestTypeCardSx,
  requestTypeResponseSx,
  requestTypeResponseExpandedSx,
  requestTypesCreamPanelSx,
  HowItWorksResponseActions,
} from "./HowItWorksPagePrimitives";

export function HowItWorksRequestTypesSection() {
  const theme = useTheme();
  return (
      <Box sx={{ ...mollureSectionGapSx, pb: { xs: 4, sm: 5 } }}>
        <Box sx={requestTypesCreamPanelSx}>
          <HowItWorksSectionTitle
            title={howItWorksData.typesOfRequests.title}
            sx={{
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "mollure.textcolorgrey700",
            }}
          />

          <Stack spacing={3}>
            {howItWorksData.typesOfRequests.cards.map((card) => {
              const isEdit = card.key === "editRequest";
              return (
                <AppCard sx={requestTypeCardSx} key={card.key}>
                  <Box
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={requestTypeIconSx}>
                        <Image
                          src={requestCardIconById[card.iconId]}
                          alt=""
                          width={34}
                          height={34}
                        />
                      </Box>
                      <Typography
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {card.title}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      {card.body}
                    </Typography>
                  </Box>

                  <Box
                    sx={
                      isEdit
                        ? requestTypeResponseExpandedSx
                        : requestTypeResponseSx
                    }
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      {isEdit ? card.examplesIntro : card.respondLabel}
                    </Typography>

                    {isEdit && card.examples ? (
                      <>
                        <Grid container spacing={1.5} sx={{ mt: 1.25 }}>
                          {card.examples.map((t) => (
                            <Grid item xs={12} sm={4} key={t}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 999,
                                    bgcolor: "text.secondary",
                                    mt: 0.2,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {t}
                                </Typography>
                              </Stack>
                            </Grid>
                          ))}
                        </Grid>

                        <Typography
                          variant="body2"
                          sx={{
                            mt: 2,
                            color: "text.secondary",
                            lineHeight: 1.65,
                          }}
                        >
                          {card.reassignNote}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            mt: 2.5,
                            display: "block",
                            color: "text.secondary",
                          }}
                        >
                          {card.whenReceivedLabel}
                        </Typography>

                        <HowItWorksResponseActions
                          theme={theme}
                          actions={[...card.actions]}
                        />

                        <Typography
                          variant="body2"
                          sx={{ mt: 2, color: "text.secondary" }}
                        >
                          {card.cancelNote}
                        </Typography>
                      </>
                    ) : (
                      <HowItWorksResponseActions
                        theme={theme}
                        actions={[...card.actions]}
                        labels={
                          card.suggestionLabel
                            ? { suggestion: card.suggestionLabel }
                            : undefined
                        }
                      />
                    )}
                  </Box>
                </AppCard>
              );
            })}
          </Stack>
        </Box>
      </Box>
  );
}
