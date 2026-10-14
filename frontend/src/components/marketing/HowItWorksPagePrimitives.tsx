import type { ReactNode } from "react";
import Image from "next/image";
import { Box, Grid, Stack } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import {
  howItWorksData,
  type HowItWorksRichLine,
} from "../../app/how-it-works/howItWorks.data";
import {
  HowItWorksSuggestionForChangeIcon,
  BookingRequestIcon,
  EditedBookingIcon,
  EditConfirmedIcon,
} from "../../../images";
import { Typography } from "../ui/typography";
import { CheckOutlined, CheckCircle, Cancel } from "@mui/icons-material";

export const requestCardIconById = {
  bookingRequest: BookingRequestIcon,
  editedBooking: EditedBookingIcon,
  editConfirmed: EditConfirmedIcon,
} as const;

/** Section headings: semibold (600). */
export const sectionHeadingSx = {
  fontWeight: 600,
  fontSize: 20,
  color: "mollure.textcolorgrey700",
} as const;

/** In-card titles (Prepayment-style): semibold 600. */
export const cardTitleSx = {
  fontWeight: 600,
  fontSize: 20,
  lineHeight: 1.4,
  color: "mollure.textcolorgrey700",
} as const;

export const cardShadow = "0 10px 28px rgba(16, 35, 63, 0.10)";

export function HowItWorksCheckList({ items }: { items: readonly string[] }) {
  return (
    <Stack spacing={1.2}>
      {items.map((item) => (
        <Stack key={item} direction="row" spacing={1.5} alignItems="flex-start">
          <CheckOutlined
            sx={{
              color: "primary.main",
              fontSize: 18,
              mt: 0.15,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {item}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

const richBoldSx = {
  fontWeight: 700,
  color: "mollure.textcolorgrey700",
} as const;

function HowItWorksRichText({ parts }: { parts: HowItWorksRichLine }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <Box key={i} component="span" sx={richBoldSx}>
            {p.text}
          </Box>
        ) : (
          <Box key={i} component="span">
            {p.text}
          </Box>
        ),
      )}
    </>
  );
}

export function HowItWorksRichCheckList({
  lines,
}: {
  lines: readonly HowItWorksRichLine[];
}) {
  return (
    <Stack spacing={1.5} sx={{ mt: 0.5 }}>
      {lines.map((parts, i) => (
        <Stack direction="row" spacing={1} alignItems="flex-start" key={i}>
          <CheckCircle
            sx={{
              color: "mollure.statusGreenFg",
              fontSize: 20,
              flexShrink: 0,
              mt: 0.15,
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.55, fontWeight: 400 }}
          >
            <HowItWorksRichText parts={parts} />
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export const requestTypeIconSx = {
  width: 34,
  height: 34,
  borderRadius: 2,
  bgcolor: "transparent",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  overflow: "hidden",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
} as const;

export const requestTypeCardSx = {
  p: 0,
  overflow: "hidden",
  borderRadius: 3,
  boxShadow: (theme: Theme) => theme.palette.mollure.sectionSurfaceShadow,
} as const;

export const requestTypeResponseSx = {
  px: { xs: 2.5, sm: 3 },
  pb: { xs: 2.5, sm: 3 },
  pt: 2,
  borderTop: "1px solid",
  borderColor: "mollure.border",
  bgcolor: "mollure.sectionSurface",
} as const;

export const requestTypeResponseExpandedSx = {
  ...requestTypeResponseSx,
  pb: { xs: 3.5, sm: 4.5 },
} as const;

export const changesSubsectionCardSx = {
  bgcolor: "#F0FDFB",
  boxShadow: "0 2px 12px rgba(16,35,63,0.07)",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "mollure.cardBorder",
  px: { xs: 2.5, sm: 3.5 },
  py: { xs: 2.5, sm: 3 },
} as const;

export const changesInnerCardSx = {
  p: 2.5,
  borderRadius: 2,
  bgcolor: "#FFFFFF",
  border: "1px solid",
  borderColor: "mollure.cardBorder",
} as const;

export const changesSubsectionIconSx = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  bgcolor: "primary.main",
  color: "common.white",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
} as const;

export const requestTypesCreamPanelSx = {
  bgcolor: "mollure.warmwarning",
  borderRadius: 3,
  px: { xs: 2, sm: 3 },
  pt: { xs: 3, sm: 3.5 },
  pb: { xs: 2.5, sm: 3 },
} as const;

function HowItWorksAcceptActionIcon() {
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: "success.main",
        color: "common.white",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <CheckOutlined sx={{ fontSize: 14 }} />
    </Box>
  );
}

function HowItWorksRejectActionIcon() {
  return (
    <Cancel
      sx={{
        fontSize: 22,
        color: "mollure.statusRedFg",
        flexShrink: 0,
      }}
    />
  );
}

type HowItWorksResponseActionKey = "accept" | "suggestion" | "reject";

export function HowItWorksResponseActions({
  actions,
  theme,
  labels,
}: {
  actions: HowItWorksResponseActionKey[];
  theme: Theme;
  labels?: Partial<Record<HowItWorksResponseActionKey, string>>;
}) {
  const actionMap: Record<
    HowItWorksResponseActionKey,
    { label: string; bg: string; icon: ReactNode }
  > = {
    accept: {
      label: labels?.accept ?? howItWorksData.responseActionLabels.accept,
      bg: theme.palette.mollure.mintSoft,
      icon: <HowItWorksAcceptActionIcon />,
    },
    suggestion: {
      label: labels?.suggestion ?? howItWorksData.responseActionLabels.suggestion,
      bg: alpha(theme.palette.mollure.border, 0.35),
      icon: (
        <Image
          src={HowItWorksSuggestionForChangeIcon}
          alt=""
          width={24}
          height={24}
        />
      ),
    },
    reject: {
      label: labels?.reject ?? howItWorksData.responseActionLabels.reject,
      bg: theme.palette.mollure.statusRedBg,
      icon: <HowItWorksRejectActionIcon />,
    },
  };

  const smCols = actions.length === 2 ? 6 : actions.length === 1 ? 12 : 4;

  return (
    <Grid container spacing={2} sx={{ mt: 1.5 }}>
      {actions.map((key) => {
        const action = actionMap[key];
        return (
          <Grid item xs={12} sm={smCols} key={key}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                bgcolor: action.bg,
                minHeight: 46,
                width: "100%",
                height: "100%",
              }}
            >
              {action.icon}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "mollure.textcolorgrey700" }}
              >
                {action.label}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
