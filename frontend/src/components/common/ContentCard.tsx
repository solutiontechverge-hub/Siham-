"use client";

import * as React from "react";
import { Box, Stack, type PaperProps } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import AppCard from "./AppCard";
import { BodyText, SubHeading } from "../ui/typography";
import { MOLLURE_HEADING_BODY_GAP_PX } from "../../theme/spacing";

type ContentCardProps = Omit<PaperProps, "title"> & {
  title?: React.ReactNode;
  titleSx?: SxProps<Theme>;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  withAccent?: boolean; // ✅ NEW PROP
};

export default function ContentCard({
  actions,
  children,
  description,
  title,
  titleSx,
  withAccent = false, // default OFF
  ...props
}: ContentCardProps) {
  return (
    <AppCard {...props}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* ✅ LEFT LINE ONLY IF ENABLED */}
        {withAccent && (
          <Box
            sx={(theme) => ({
              position: "absolute",
              left: 0,
              top: 16,
              bottom: 16,
              width: 6,
              borderRadius: "0 6px 6px 0",
              bgcolor: theme.palette.primary.main,
              boxShadow: `4px 0 18px ${alpha(
                theme.palette.primary.main,
                0.25,
              )}`,
            })}
          />
        )}

        {/* ✅ CONDITIONAL PADDING */}
        <Stack
          spacing={0}
          sx={{
            p: 3,
            pl: withAccent ? (t) => `calc(${t.spacing(3)} + 12px)` : 3,
          }}
        >
          {title && (
            <SubHeading
              sx={[
                { color: "mollure.textcolorgrey700" },
                ...(titleSx
                  ? Array.isArray(titleSx)
                    ? titleSx
                    : [titleSx]
                  : []),
              ]}
            >
              {title}
            </SubHeading>
          )}

          {description && (
            <BodyText
              sx={{
                mt: title ? `${MOLLURE_HEADING_BODY_GAP_PX}px` : 0,
                lineHeight: 1.65,
              }}
              color="text.secondary"
            >
              {description}
            </BodyText>
          )}

          {children ? (
            <Box
              sx={{
                mt:
                  title || description ? `${MOLLURE_HEADING_BODY_GAP_PX}px` : 0,
              }}
            >
              {children}
            </Box>
          ) : null}
          {actions}
        </Stack>
      </Box>
    </AppCard>
  );
}
