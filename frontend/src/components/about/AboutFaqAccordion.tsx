"use client";

import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Stack,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { BodyText, CardTitle, SubHeading } from "../ui/typography";

export type AboutFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type AboutFaqAccordionProps = {
  title: string;
  items: readonly AboutFaqItem[];
};

export default function AboutFaqAccordion({
  title,
  items,
}: AboutFaqAccordionProps) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: "mollure.surface",
      }}
    >
      <Container maxWidth="md">
        <SubHeading
          sx={{
            textAlign: "center",
            color: "mollure.textcolorgrey700",
            mb: 4,
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
          }}
        >
          {title}
        </SubHeading>

        <Stack spacing={1.5}>
          {items.map((item) => (
            <Accordion
              key={item.id}
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                borderRadius: "12px !important",
                border: "1px solid",
                borderColor: "mollure.cardBorder",
                bgcolor: "background.paper",
                boxShadow: "0 8px 28px rgba(16, 35, 63, 0.06)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreRoundedIcon sx={{ color: "mollure.slate" }} />
                }
                sx={{
                  px: 2,
                  py: 1.5,
                  "& .MuiAccordionSummary-content": {
                    alignItems: "flex-start",
                    gap: 1.5,
                    my: 0.5,
                  },
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    color: "primary.main",
                    fontSize: 22,
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />
                <CardTitle
                  sx={{
                    fontWeight: 600,
                    color: "mollure.textcolorgrey700",
                    fontSize: "1rem",
                  }}
                >
                  {item.question}
                </CardTitle>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 0, pl: 2 }}>
                <BodyText
                  sx={{
                    pl: 4,
                    color: "text.secondary",
                    lineHeight: 1.75,
                  }}
                >
                  {item.answer}
                </BodyText>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
