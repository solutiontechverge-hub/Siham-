"use client";

import * as React from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, ButtonBase, Collapse, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../ui/typography";

export type AnalyticsExplanationItem = {
  title: string;
  description: string;
};

export type AnalyticsExplanationBlock = {
  title: string;
  items?: AnalyticsExplanationItem[];
  paragraphs?: string[];
};

export type AnalyticsExplanationContent = {
  blocks: AnalyticsExplanationBlock[];
};

export type AnalyticsSectionExplanationProps = {
  label: string;
  content: AnalyticsExplanationContent;
};

export default function AnalyticsSectionExplanation({
  label,
  content,
}: AnalyticsSectionExplanationProps) {
  const m = useTheme().palette.mollure;
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ mt: 1.75, width: "100%" }}>
      <ButtonBase
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.5,
          py: 1.15,
          borderRadius: open ? "10px 10px 0 0" : "10px",
          border: `1px solid ${alpha(m.teal, open ? 0.22 : 0.16)}`,
          bgcolor: alpha(m.teal, 0.05),
          textAlign: "left",
          transition: "border-color 150ms ease, background-color 150ms ease",
          "&:hover": {
            bgcolor: alpha(m.teal, 0.08),
            borderColor: alpha(m.teal, 0.28),
          },
        }}
      >
        <BodyText sx={{ fontSize: 12.5, fontWeight: 800, color: m.teal }}>
          {label}
        </BodyText>
        <KeyboardArrowDownRoundedIcon
          sx={{
            fontSize: 20,
            color: m.teal,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
          }}
        />
      </ButtonBase>

      <Collapse in={open} timeout={200}>
        <Box
          sx={{
            px: 1.75,
            py: 1.5,
            border: `1px solid ${alpha(m.teal, 0.22)}`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            bgcolor: "#fff",
          }}
        >
          <Stack spacing={2}>
            {content.blocks.map((block, blockIndex) => (
              <Box key={`${block.title}-${blockIndex}`}>
                {block.title ? (
                  <BodyText
                    sx={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.85),
                      mb: 1,
                    }}
                  >
                    {block.title}
                  </BodyText>
                ) : null}

                {block.paragraphs?.length ? (
                  <Stack
                    spacing={0.75}
                    sx={{ mb: block.items?.length ? 1.25 : 0 }}
                  >
                    {block.paragraphs.map((paragraph) => (
                      <BodyText
                        key={paragraph}
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: alpha(m.navy, 0.58),
                          lineHeight: 1.6,
                        }}
                      >
                        {paragraph}
                      </BodyText>
                    ))}
                  </Stack>
                ) : null}

                {block.items?.length ? (
                  <Stack spacing={1.25}>
                    {block.items.map((item) => (
                      <Box key={item.title}>
                        <BodyText
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.72),
                            mb: 0.35,
                          }}
                        >
                          {item.title}
                        </BodyText>
                        <BodyText
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: alpha(m.navy, 0.58),
                            lineHeight: 1.6,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {item.description}
                        </BodyText>
                      </Box>
                    ))}
                  </Stack>
                ) : null}
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
