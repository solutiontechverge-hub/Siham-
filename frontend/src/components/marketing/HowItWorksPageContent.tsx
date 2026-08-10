"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import { AppCard, ContentCard, ServiceCategoryIcon } from "../common";
import { HowItWorksSectionTitle } from "../howItWorks";
import { howItWorksData } from "../../app/how-it-works/howItWorks.data";
import type { MarketingAudience } from "./MarketingShellLayout";
import {
  MOLLURE_HEADING_BODY_GAP_PX,
  MOLLURE_SECTION_GAP_PX,
} from "../../theme/spacing";
import {
  HowItWorksDesiredLocationBookingIcon,
  HowItWorksFixedLocationBookingIcon,
  HowItWorksBusinessClientIcon,
  HowItWorksIndividualClientIcon,
  HowItWorksSuggestionForChangeIcon,
  HowItWorksDesiredLocationClockIcon,
  HowItWorksBookingEditedBellIcon,
  HowItWorksBookingCommunicationChatIcon,
  BookingRequestIcon,
  EditedBookingIcon,
  EditConfirmedIcon,
} from "../../../images";
import { Typography } from "../ui/typography";
import {
  CheckCircleOutline,
  CheckOutlined,
  CheckCircle,
  BoltOutlined,
  EventSeatOutlined,
  PersonPinCircleOutlined,
  EditOutlined,
  Cancel,
  FormatListBulletedOutlined,
  CreditCard,
  Language,
  ReceiptLong,
} from "@mui/icons-material";

/** Section headings: semibold (600); pair with `variant="h4"` */
const sectionHeadingSx = {
  fontWeight: 600,
  fontSize: { xs: "1.5rem", sm: "1.75rem" },
  color: "mollure.textcolorgrey700",
} as const;

/** In-card titles (Prepayment-style): semibold 600 */
const cardTitleSx = {
  fontWeight: 600,
  fontSize: "1.125rem",
  lineHeight: 1.4,
  color: "mollure.textcolorgrey700",
} as const;

const InfoCard = ({ title, points }: any) => (
  <Card sx={{ height: "100%", borderRadius: 3, boxShadow: 2 }}>
    <CardContent>
      <Typography variant="h6" fontWeight={600} mb={2}>
        {title}
      </Typography>
      {points.map((p: string, i: number) => (
        <Typography key={i} variant="body2" mb={1}>
          • {p}
        </Typography>
      ))}
    </CardContent>
  </Card>
);

const cardShadow = "0 10px 28px rgba(16, 35, 63, 0.10)";

const sectionGapSx = { mt: `${MOLLURE_SECTION_GAP_PX}px` } as const;
const headingBodyGapSx = { mb: `${MOLLURE_HEADING_BODY_GAP_PX}px` } as const;

function HowItWorksCheckList({ items }: { items: readonly string[] }) {
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

const requestTypeIconSx = {
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

const requestTypeCardSx = {
  p: 0,
  overflow: "hidden",
  borderRadius: 3,
  boxShadow: (theme: Theme) => theme.palette.mollure.sectionSurfaceShadow,
} as const;

const requestTypeResponseSx = {
  px: { xs: 2.5, sm: 3 },
  pb: { xs: 2.5, sm: 3 },
  pt: 2,
  borderTop: "1px solid",
  borderColor: "mollure.border",
  bgcolor: "mollure.sectionSurface",
} as const;

const requestTypeResponseExpandedSx = {
  ...requestTypeResponseSx,
  pb: { xs: 3.5, sm: 4.5 },
} as const;

const changesSubsectionCardSx = {
  bgcolor: "#F0FDFB",
  boxShadow: "0 2px 12px rgba(16,35,63,0.07)",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "mollure.cardBorder",
  px: { xs: 2.5, sm: 3.5 },
  py: { xs: 2.5, sm: 3 },
} as const;

const changesInnerCardSx = {
  p: 2.5,
  borderRadius: 2,
  bgcolor: "#FFFFFF",
  border: "1px solid",
  borderColor: "mollure.cardBorder",
} as const;

const changesSubsectionIconSx = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  bgcolor: "primary.main",
  color: "common.white",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
} as const;

const requestTypesCreamPanelSx = {
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

function HowItWorksResponseActions({
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
      label: labels?.accept ?? "Accept",
      bg: theme.palette.mollure.mintSoft,
      icon: <HowItWorksAcceptActionIcon />,
    },
    suggestion: {
      label: labels?.suggestion ?? "Suggestion for change",
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
      label: labels?.reject ?? "Reject",
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

export function HowItWorksPageContent({
  audience = "clients",
}: {
  audience?: MarketingAudience;
}) {
  const theme = useTheme();
  const bgshadow = theme.palette.mollure.bgshadow;
  const cardbg = theme.palette.mollure.cardbg;
  const textcolorgrey700 = theme.palette.mollure.textcolorgrey700;

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* HERO */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${theme.palette.mollure.heroGradientStart} 0%, ${theme.palette.mollure.heroGradientEnd} 100%)`,
          position: "relative",
          overflow: "hidden",
          py: { xs: 7, md: 8 },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.65,
            background: theme.palette.mollure.heroGlow,
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              color: "mollure.textcolorgrey700",
              fontSize:
                audience === "clients"
                  ? "52px"
                  : { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            {howItWorksData.hero.title}
          </Typography>
          <Typography
            mt={2}
            maxWidth="700px"
            mx="auto"
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 400, lineHeight: 1.7 }}
          >
            {howItWorksData.hero.subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: `${MOLLURE_SECTION_GAP_PX}px` }}>
        {/* INTERACTIVE PROCESS */}
        <ContentCard
          sx={{ bgcolor: cardbg, color: textcolorgrey700 }}
          withAccent={true}
          title="Interactive Booking Process"
          titleSx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
          description="Mollure uses an interactive online booking process. This means bookings are not always instantly confirmed. Some bookings require review and approval before they are finalized. In certain situations, changes made before or after confirmation also require approval, ensuring both parties stay aligned throughout the booking process."
        />

        {/* GETTING STARTED — clients only */}
        {audience === "clients" && (
          <Box sx={sectionGapSx}>
            <HowItWorksSectionTitle
              title="Getting Started"
              sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ContentCard
                  sx={{
                    height: "100%",
                    bgcolor: "background.paper",
                    boxShadow: cardShadow,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                      <Image
                        src={HowItWorksIndividualClientIcon}
                        alt=""
                        width={50}
                        height={49}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={600}>
                      Individual Clients
                    </Typography>

                    <HowItWorksCheckList
                      items={howItWorksData.gettingStarted.individualPoints}
                    />
                  </Stack>
                </ContentCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ContentCard
                  sx={{
                    height: "100%",
                    bgcolor: "background.paper",
                    boxShadow: cardShadow,
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                      <Image
                        src={HowItWorksBusinessClientIcon}
                        alt=""
                        width={50}
                        height={49}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={600}>
                      Business Clients
                    </Typography>

                    <HowItWorksCheckList
                      items={howItWorksData.gettingStarted.businessPoints}
                    />
                  </Stack>
                </ContentCard>
              </Grid>
            </Grid>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 3,
                textAlign: "center",
                lineHeight: 1.7,
                maxWidth: 920,
                mx: "auto",
              }}
            >
              {howItWorksData.gettingStarted.note}
            </Typography>
          </Box>
        )}

        {/* KEY PRINCIPLES */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: cardbg,
            borderRadius: 3,
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
          }}
        >
          <HowItWorksSectionTitle
            title="Key Principles of Mollure"
            sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
          />

          <Grid container spacing={3}>
            {howItWorksData.keyPrinciples.map(
              ({ title, description, icon }) => (
                <Grid item xs={12} sm={6} md={3} key={title}>
                  <ContentCard
                    sx={{
                      height: "100%",
                      bgcolor: "background.paper",
                      boxShadow: cardShadow,
                    }}
                  >
                    <Stack spacing={2} sx={{ height: "100%" }}>
                      <Box sx={{ width: 50, height: 49, flexShrink: 0 }}>
                        <Image src={icon} alt="" width={50} height={49} />
                      </Box>

                      <Typography sx={cardTitleSx}>{title}</Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          lineHeight: 1.6,
                          fontWeight: 400,
                        }}
                      >
                        {description}
                      </Typography>
                    </Stack>
                  </ContentCard>
                </Grid>
              ),
            )}
          </Grid>
        </Box>

        {/* GETTING STARTED — professionals only; after Key Principles */}
        {audience === "professionals" && (
          <Box
            sx={{
              ...sectionGapSx,
              bgcolor: "mollure.mintSoft",
              borderRadius: 3,
              px: { xs: 2.5, sm: 4 },
              py: { xs: 3.5, sm: 4.5 },
            }}
          >
            <HowItWorksSectionTitle
              title="Getting Started"
              sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Stack spacing={3}>
              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  Requirements
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalGettingStarted.requirements.intro}
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalGettingStarted.requirements
                      .points
                  }
                />

                <Box
                  sx={{
                    mt: 3,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(4, minmax(0, 1fr))",
                      md: "repeat(7, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  {howItWorksData.professionalGettingStarted.requirements.categories.map(
                    (category) => (
                      <AppCard
                        key={category.label}
                        sx={{
                          width: "100%",
                          minHeight: 96,
                          py: 1.25,
                          px: 1,
                          borderRadius: "12px",
                          boxShadow: "none",
                          border: "1px solid",
                          borderColor: (t) => alpha(t.palette.mollure.navy, 0.1),
                          bgcolor: "mollure.white",
                          textAlign: "center",
                        }}
                      >
                        <Stack
                          spacing={0.75}
                          alignItems="center"
                          justifyContent="center"
                          sx={{ minHeight: 88 }}
                        >
                          <ServiceCategoryIcon
                            iconId={category.iconId}
                            fontSize={26}
                          />
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              lineHeight: 1.25,
                              color: "mollure.navy",
                              px: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-word",
                            }}
                          >
                            {category.label}
                          </Typography>
                        </Stack>
                      </AppCard>
                    ),
                  )}
                </Box>
              </ContentCard>

              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  Validation & Onboarding
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalGettingStarted.validation.intro}
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalGettingStarted.validation.points
                  }
                />
              </ContentCard>
            </Stack>
          </Box>
        )}

        {/* BOOKING TYPES — clients only */}
        {audience === "clients" && (
        <Box sx={sectionGapSx}>
          <AppCard
            sx={{
              p: { xs: 2.5, sm: 4 },
              pt: { xs: 3, sm: 4 },
              borderRadius: "28px",
            }}
          >
            <HowItWorksSectionTitle
              title="Booking Types and Setup"
              sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Stack spacing={4}>
              {/* Fixed Location */}
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "mollure.cardBorder",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "common.white",
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Image
                    src={HowItWorksFixedLocationBookingIcon}
                    alt=""
                    width={40}
                    height={40}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "common.white" }}
                  >
                    Fixed Location
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={(t) => ({
                      // border: "2px dotted",
                      borderColor: alpha(t.palette.primary.main, 0.45),
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      mb: 3,
                    })}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "mollure.bodyText" }}
                    >
                      Bookings take place at the professional&apos;s location.
                    </Typography>
                  </Box>

                  <Grid container spacing={2.5}>
                    {howItWorksData.bookingTypes.fixedLocation.map((f) => (
                      <Grid item xs={12} sm={6} key={f.title}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="flex-start"
                        >
                          <CheckCircle
                            sx={{
                              color: "primary.main",
                              fontSize: 22,
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          />
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: "mollure.textcolorgrey700",
                                mb: 0.5,
                              }}
                            >
                              {f.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {f.sub}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>

                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "mollure.statusGreenBg",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle
                      sx={{ color: "mollure.statusGreenFg", fontSize: 24 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      Client-created bookings are confirmed immediately.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Desired Location */}
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "mollure.cardBorder",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "common.white",
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Image
                    src={HowItWorksDesiredLocationBookingIcon}
                    alt=""
                    width={40}
                    height={40}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "common.white" }}
                  >
                    Desired Location Bookings
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "mollure.bodyText", mb: 3 }}
                  >
                    Services take place at a location of your choice.
                  </Typography>

                  {/* Standard + Project — one dashed container */}
                  <Box
                    sx={(t) => ({
                      border: "2px dashed",
                      borderColor: alpha(t.palette.primary.main, 0.35),
                      borderRadius: 2,
                      p: 2.5,
                      mb: 2.5,
                    })}
                  >
                    {/* Standard */}
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: 1,
                          bgcolor: "primary.main",
                          color: "common.white",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                        >
                          Standard (for individual and business clients)
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2.5}>
                      {howItWorksData.bookingTypes.desiredLocationStandard.map(
                        (f) => (
                          <Grid item xs={12} sm={6} key={f.title}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                            >
                              <CheckCircle
                                sx={{
                                  color: "primary.main",
                                  fontSize: 22,
                                  flexShrink: 0,
                                  mt: 0.25,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "mollure.textcolorgrey700",
                                    mb: 0.5,
                                  }}
                                >
                                  {f.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {f.sub}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ),
                      )}
                    </Grid>

                    {/* Project */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                        mt: 3.5,
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: 1,
                          bgcolor: "primary.main",
                          color: "common.white",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                        >
                          Project (only for business clients)
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2.5}>
                      {howItWorksData.bookingTypes.desiredLocationProject.map(
                        (f) => (
                          <Grid item xs={12} sm={6} key={f.title}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                            >
                              <CheckCircle
                                sx={{
                                  color: "primary.main",
                                  fontSize: 22,
                                  flexShrink: 0,
                                  mt: 0.25,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "mollure.textcolorgrey700",
                                    mb: 0.5,
                                  }}
                                >
                                  {f.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {f.sub}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "mollure.warmwarning",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Image
                        src={HowItWorksDesiredLocationClockIcon}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      Desired location bookings are always sent as a booking
                      request when created by a client.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </AppCard>
        </Box>
        )}

        {/* BOOKING TYPES — professionals only */}
        {audience === "professionals" && (
          <Box
            sx={{
              ...sectionGapSx,
              bgcolor: "mollure.mintSoft",
              borderRadius: 3,
              px: { xs: 2.5, sm: 4 },
              py: { xs: 3.5, sm: 4.5 },
            }}
          >
            <HowItWorksSectionTitle
              title="Booking Types"
              sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            />

            <Stack spacing={3}>
              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  {howItWorksData.professionalBookingTypes.online.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalBookingTypes.online.intro}
                </Typography>
                <HowItWorksCheckList
                  items={howItWorksData.professionalBookingTypes.online.points}
                />
              </ContentCard>

              <ContentCard
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: cardShadow,
                }}
              >
                <Typography sx={{ ...cardTitleSx, mb: 1.5 }}>
                  {howItWorksData.professionalBookingTypes.offline.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.65 }}
                >
                  {howItWorksData.professionalBookingTypes.offline.intro}
                </Typography>

                <Typography sx={{ ...cardTitleSx, mb: 1.5, fontSize: "1rem" }}>
                  {
                    howItWorksData.professionalBookingTypes.offline.nonMollure
                      .title
                  }
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalBookingTypes.offline.nonMollure
                      .points
                  }
                />

                <Typography
                  sx={{ ...cardTitleSx, mt: 2.5, mb: 1.5, fontSize: "1rem" }}
                >
                  {howItWorksData.professionalBookingTypes.offline.guest.title}
                </Typography>
                <HowItWorksCheckList
                  items={
                    howItWorksData.professionalBookingTypes.offline.guest.points
                  }
                />
              </ContentCard>
            </Stack>
          </Box>
        )}

        {/* SERVICE LOCATION SETUP — professionals only */}
        {audience === "professionals" && (
          <Box
            sx={{
              ...sectionGapSx,
              bgcolor: "mollure.mintSoft",
              borderRadius: 3,
              px: { xs: 2.5, sm: 4 },
              py: { xs: 3.5, sm: 4.5 },
            }}
          >
            <HowItWorksSectionTitle
              title={howItWorksData.professionalServiceLocationSetup.title}
              sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1.5,
                mb: 3,
                textAlign: "center",
                lineHeight: 1.65,
                maxWidth: 720,
                mx: "auto",
              }}
            >
              {howItWorksData.professionalServiceLocationSetup.subtitle}
            </Typography>

            <AppCard
              sx={{
                p: { xs: 2.5, sm: 4 },
                borderRadius: "28px",
              }}
            >
              <Stack spacing={4}>
                {/* Fixed Location */}
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "mollure.cardBorder",
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "common.white",
                      px: 3,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Image
                      src={HowItWorksFixedLocationBookingIcon}
                      alt=""
                      width={40}
                      height={40}
                    />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "common.white" }}
                    >
                      Fixed Location
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "mollure.bodyText", mb: 3 }}
                    >
                      {
                        howItWorksData.professionalServiceLocationSetup
                          .fixedLocation.intro
                      }
                    </Typography>

                    <Grid container spacing={2.5}>
                      {howItWorksData.professionalServiceLocationSetup.fixedLocation.features.map(
                        (f) => (
                          <Grid item xs={12} sm={6} key={f.title}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                            >
                              <CheckCircle
                                sx={{
                                  color: "primary.main",
                                  fontSize: 22,
                                  flexShrink: 0,
                                  mt: 0.25,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "mollure.textcolorgrey700",
                                    mb: 0.5,
                                  }}
                                >
                                  {f.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {f.sub}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ),
                      )}
                    </Grid>
                  </Box>
                </Box>

                {/* Desired Location */}
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "mollure.cardBorder",
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "common.white",
                      px: 3,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Image
                      src={HowItWorksDesiredLocationBookingIcon}
                      alt=""
                      width={40}
                      height={40}
                    />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "common.white" }}
                    >
                      Desired Location Bookings
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "mollure.bodyText", mb: 3 }}
                    >
                      {
                        howItWorksData.professionalServiceLocationSetup
                          .desiredLocation.intro
                      }
                    </Typography>

                    {/* Standard */}
                    <Box
                      sx={(t) => ({
                        border: "2px dashed",
                        borderColor: alpha(t.palette.primary.main, 0.35),
                        borderRadius: 2,
                        p: 2.5,
                        mb: 2.5,
                      })}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: 1,
                            bgcolor: "primary.main",
                            color: "common.white",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                          >
                            Standard
                          </Typography>
                        </Box>
                      </Box>
                      <Grid container spacing={2.5}>
                        {howItWorksData.professionalServiceLocationSetup.desiredLocation.standard.map(
                          (f) => (
                            <Grid item xs={12} sm={6} key={f.title}>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="flex-start"
                              >
                                <CheckCircle
                                  sx={{
                                    color: "primary.main",
                                    fontSize: 22,
                                    flexShrink: 0,
                                    mt: 0.25,
                                  }}
                                />
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 600,
                                      color: "mollure.textcolorgrey700",
                                      mb: 0.5,
                                    }}
                                  >
                                    {f.title}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {f.sub}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                          ),
                        )}
                      </Grid>
                    </Box>

                    {/* Project */}
                    <Box
                      sx={(t) => ({
                        border: "2px dashed",
                        borderColor: alpha(t.palette.primary.main, 0.35),
                        borderRadius: 2,
                        p: 2.5,
                        mb: 2.5,
                      })}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: 1,
                            bgcolor: "primary.main",
                            color: "common.white",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                          >
                            Project (only for business clients)
                          </Typography>
                        </Box>
                      </Box>
                      <Grid container spacing={2.5}>
                        {howItWorksData.professionalServiceLocationSetup.desiredLocation.project.map(
                          (f) => (
                            <Grid item xs={12} sm={6} key={f.title}>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="flex-start"
                              >
                                <CheckCircle
                                  sx={{
                                    color: "primary.main",
                                    fontSize: 22,
                                    flexShrink: 0,
                                    mt: 0.25,
                                  }}
                                />
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 600,
                                      color: "mollure.textcolorgrey700",
                                      mb: 0.5,
                                    }}
                                  >
                                    {f.title}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {f.sub}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                          ),
                        )}
                      </Grid>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "mollure.warmwarning",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Image
                          src={HowItWorksDesiredLocationClockIcon}
                          alt=""
                          width={24}
                          height={24}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary", fontWeight: 600 }}
                      >
                        {howItWorksData.professionalServiceLocationSetup.note}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </AppCard>
          </Box>
        )}

        {/* REQUEST TYPES */}
        <Box sx={{ ...sectionGapSx, pb: { xs: 4, sm: 5 } }}>
          <Box sx={requestTypesCreamPanelSx}>
            <HowItWorksSectionTitle
              title="Types of Requests"
              sx={{
                fontSize: "30px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "mollure.textcolorgrey700",
              }}
            />

            <Stack spacing={3}>
              {/* Booking Request */}
              <AppCard sx={requestTypeCardSx}>
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={requestTypeIconSx}>
                      <Image
                        src={BookingRequestIcon}
                        alt=""
                        width={34}
                        height={34}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                      Booking Request
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    When the professional sends a booking request to the client.
                  </Typography>
                </Box>

                <Box sx={requestTypeResponseSx}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    Client can respond with:
                  </Typography>

                  <HowItWorksResponseActions
                    theme={theme}
                    actions={["accept", "suggestion", "reject"]}
                    labels={{
                      suggestion: "Suggest change via message",
                    }}
                  />
                </Box>
              </AppCard>

              {/* Edited Booking Request */}
              <AppCard sx={requestTypeCardSx}>
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={requestTypeIconSx}>
                      <Image
                        src={EditedBookingIcon}
                        alt=""
                        width={34}
                        height={34}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                      Edited Booking Request
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    When the professional edits a booking request from the
                    client or the booking request you sent to the client.
                  </Typography>
                </Box>

                <Box sx={requestTypeResponseSx}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    Client can respond with:
                  </Typography>

                  <HowItWorksResponseActions
                    theme={theme}
                    actions={["accept", "suggestion", "reject"]}
                    labels={{
                      suggestion: "Suggest change via message",
                    }}
                  />
                </Box>
              </AppCard>

              {/* Edit Request */}
              <AppCard sx={requestTypeCardSx}>
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={requestTypeIconSx}>
                      <Image
                        src={EditConfirmedIcon}
                        alt=""
                        width={34}
                        height={34}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                      Edit Request
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    An edit request is required for any change made by the
                    professional to a confirmed booking that affects booking
                    details, except for minor updates and standalone service
                    order adjustments. The edit request clearly highlights what
                    has changed compared to the original confirmation.
                  </Typography>
                </Box>

                <Box sx={requestTypeResponseExpandedSx}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    Examples of changes that require an edit request:
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mt: 1.25 }}>
                    {[
                      "Date and/or time",
                      "Address for desired location",
                      "Assigned team member",
                      "Add or cancel items",
                      "Duration & pricing",
                      "Project-related details",
                    ].map((t) => (
                      <Grid item xs={12} sm={4} key={t}>
                        <Stack direction="row" spacing={1} alignItems="center">
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
                          <Typography variant="body2" color="text.secondary">
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
                    Note: If the professional reassigns a team member without
                    changing the price or duration, client approval is not
                    required. The client will still be notified of the update.
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ mt: 2.5, display: "block", color: "text.secondary" }}
                  >
                    When client receives an edit request, client can:
                  </Typography>

                  <HowItWorksResponseActions
                    theme={theme}
                    actions={["accept", "suggestion"]}
                  />

                  <Typography
                    variant="body2"
                    sx={{ mt: 2, color: "text.secondary" }}
                  >
                    Client can always cancel a confirmed booking with an
                    incoming or outgoing edit request.
                  </Typography>
                </Box>
              </AppCard>
            </Stack>
          </Box>
        </Box>

        {/* CHANGES WITHOUT APPROVAL */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: "#F9FAFB",
            borderRadius: 3,
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
          }}
        >
          <HowItWorksSectionTitle
            title="Changes Without Approval"
            sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
          />

          <Stack spacing={3}>
            {/* Detail Changes */}
            <Box sx={changesSubsectionCardSx}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={changesSubsectionIconSx}>
                    <BoltOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Detail Changes
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.65 }}
                >
                  Applied directly and shown as &apos;updated&apos;. No approval
                  needed
                </Typography>

                <Box sx={changesInnerCardSx}>
                  <Stack spacing={1.75} mb={2.5}>
                    {["Contact details", "Guest names"].map((label) => (
                      <Stack
                        key={label}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                      >
                        <CheckOutlined
                          sx={{
                            color: "primary.main",
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {label}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65 }}
                  >
                    This applies to both clients and professionals.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Service Order Change */}
            <Box sx={changesSubsectionCardSx}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={changesSubsectionIconSx}>
                    <FormatListBulletedOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Service Order Change
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.65 }}
                >
                  If a professional only changes the service order:
                </Typography>

                <Box sx={changesInnerCardSx}>
                  <Stack spacing={1.75} mb={2.5}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <CheckOutlined
                        sx={{
                          color: "primary.main",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        The booking remains confirmed
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Image
                          src={HowItWorksBookingEditedBellIcon}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        The client will be notified that the booking has been
                        edited
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65 }}
                  >
                    If service order is changed with other details, it becomes
                    part of a request.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
        {/* RESPONSE */}
        <Box
          sx={{
            ...sectionGapSx,
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
              ...headingBodyGapSx,
            }}
          >
            How Professionals Respond To Requests
          </Typography>
          <Box sx={{ bgcolor: theme.palette.mollure.cardbg, p: 2.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: "left",
                mb: `${MOLLURE_HEADING_BODY_GAP_PX}px`,
                lineHeight: 1.7,
              }}
            >
              When a professional receives a request from a client, whether it
              is a booking request or an edit request, The professional can
              always respond in one of three ways.
            </Typography>
            <Stack spacing={2.5}>
              <ContentCard sx={{ bgcolor: "background.paper" }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => alpha(t.palette.success.main, 0.18),
                      color: "success.main",
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ ...cardTitleSx, mb: 0.5 }}
                    >
                      Accept the request
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confirm the requested booking and changes.
                    </Typography>
                  </Box>
                </Stack>
              </ContentCard>

              <ContentCard sx={{ bgcolor: "background.paper" }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.16),
                      color: "primary.main",
                    }}
                  >
                    <EditOutlined sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ ...cardTitleSx, mb: 0.5 }}
                    >
                      Edit the request
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Edit details and send a new request back for review:
                    </Typography>
                    <Box
                      component="ul"
                      sx={{ m: 0, pl: 2.25, color: "text.secondary" }}
                    >
                      <Typography
                        component="li"
                        variant="body2"
                        sx={{ mb: 0.75 }}
                      >
                        You may send an edited booking request when the client
                        needs to review your updates before confirmation.
                      </Typography>
                      <Typography component="li" variant="body2">
                        You may send an edit request when changes apply to an
                        already confirmed booking.
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </ContentCard>

              <ContentCard sx={{ bgcolor: "background.paper" }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => alpha(t.palette.error.main, 0.14),
                      color: "error.main",
                    }}
                  >
                    <Cancel sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ ...cardTitleSx, mb: 0.5 }}
                    >
                      Reject the request
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Decline the booking or changes.
                    </Typography>
                  </Box>
                </Stack>
              </ContentCard>
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
              The type of request sent depends on the current state of the
              booking, but the response options remain the same.
            </Typography>
          </Box>
        </Box>

        {/* Discarding requests — follows “How Professionals Respond” */}
        <Box sx={sectionGapSx}>
          <ContentCard
            sx={{
              bgcolor: bgshadow,
              borderRadius: 3,
            }}
            title="Discarding Requests"
            titleSx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}
            description="Any Active Booking Request Or Edit Request Can Be Discarded By The Party Who Sent It. Once Discarded, The Request Is Removed And No Further Action Is Required From The Other Party."
          />
        </Box>

        {/* RESCHEDULING */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: "mollure.bgshadow",
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
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              ...headingBodyGapSx,
            }}
          >
            Client Rescheduling
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        color: "common.white",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <EventSeatOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={cardTitleSx}>
                      Fixed Location
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ color: "mollure.bodyText", lineHeight: 1.65 }}
                  >
                    Rescheduling Updates The Booking Directly And Notifies The
                    Professional That The Booking Has Been Edited.
                  </Typography>

                  <Box sx={{ mt: "auto", pt: 1 }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2,
                        bgcolor: "mollure.statusGreenBg",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          bgcolor: "mollure.statusGreenFg",
                          color: "common.white",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckOutlined sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "mollure.statusGreenFg",
                        }}
                      >
                        Instant Update
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        color: "common.white",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <PersonPinCircleOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={cardTitleSx}>
                      Desired Location
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ color: "mollure.bodyText", lineHeight: 1.65 }}
                  >
                    Rescheduling Sends An Edit Request To The Professional For
                    Approval.
                  </Typography>

                  <Box sx={{ mt: "auto", pt: 1 }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2,
                        bgcolor: "mollure.warmwarning",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          bgcolor: "mollure.star",
                          color: "common.white",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckOutlined sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "mollure.textcolorgrey700",
                        }}
                      >
                        Requires Approval
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </ContentCard>
            </Grid>
          </Grid>
        </Box>
        {/* PAYMENTS */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: cardbg,
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
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              ...headingBodyGapSx,
            }}
          >
            Payments & Invoices
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: "success.main",
                      color: "common.white",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <CreditCard sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Prepayment
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "mollure.bodyText",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    {audience === "professionals"
                      ? "Professionals Can Require Prepayment For Online And Offline Bookings."
                      : "Prepayment May Be Required Before A Booking Is Confirmed."}
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {(audience === "professionals"
                      ? [
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Online Bookings:
                            </Box>{" "}
                            Prepayment Is Always Completed Online{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Within The Response Time.
                            </Box>
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Offline Bookings:
                            </Box>{" "}
                            Prepayment Can Be Collected Online{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Within 15 Minutes After Sending The Payment Link
                            </Box>
                            , Or{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Offline Immediately After Checkout.
                            </Box>
                          </>,
                          <>
                            Prepayment Is Completed{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              During Booking For Fixed Location
                            </Box>{" "}
                            And{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              After Request Approval For Desired Location.
                            </Box>
                          </>,
                        ]
                      : [
                          <>
                            Prepayment Is Completed{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Online Within The Response Time.
                            </Box>
                          </>,
                          <>
                            Prepayment Is Completed{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              During Booking For Fixed Location.
                            </Box>
                          </>,
                          <>
                            Prepayment Is Completed{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              After Request Approval For Desired Location.
                            </Box>
                          </>,
                        ]
                    ).map((line, i) => (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        key={i}
                      >
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
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: "success.main",
                      color: "common.white",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Language sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Post-Booking Payment
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "mollure.bodyText",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    {audience === "professionals"
                      ? "Professional Can Collect Payments After The Booking For Both Online And Offline Bookings."
                      : "Payments Completed After The Service"}
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {(audience === "professionals"
                      ? [
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Online Or Offline Payments
                            </Box>
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Immediate Payments
                            </Box>{" "}
                            (Within 15 Minutes After Receiving The Payment Link)
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Deadline-Based Payments
                            </Box>{" "}
                            (Paid Before The Invoice Due Date)
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Invoices With Due Date
                            </Box>{" "}
                            Are Used For Business Clients Or Fees As No-Show
                            Charges For Individual Clients.
                          </>,
                        ]
                      : [
                          <>
                            Payments Can Be Completed{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Online Using A Payment Link
                            </Box>
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Immediate Payments
                            </Box>{" "}
                            (Within 15 Minutes After Receiving The Payment Link)
                          </>,
                          <>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "mollure.textcolorgrey700",
                              }}
                            >
                              Deadline-Based Payments
                            </Box>{" "}
                            (Paid Before The Invoice Due Date)
                          </>,
                        ]
                    ).map((line, i) => (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        key={i}
                      >
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
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: "success.main",
                      color: "common.white",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <ReceiptLong sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Invoices & Payment
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "mollure.bodyText",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    Clients Receive Pdf Invoices, Payment Links And Receipts
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {[
                      <>
                        When A Client Or Guest Pays{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Online
                        </Box>
                        , An{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Invoice, Payment Link And Receipt
                        </Box>{" "}
                        Are Automatically Sent By Email.
                      </>,
                      <>
                        Mollure Clients Can Also Access{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Invoices, Payment Links And Receipts
                        </Box>{" "}
                        In Their{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Booking Overview.
                        </Box>
                      </>,
                      <>
                        Business Clients Always Receive{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Tax-Compliant Invoices And Receipts
                        </Box>{" "}
                        Even When Paying{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "mollure.textcolorgrey700",
                          }}
                        >
                          Offline.
                        </Box>
                      </>,
                    ].map((line, i) => (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        key={i}
                      >
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
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </ContentCard>
            </Grid>
          </Grid>
        </Box>

        {/* GROUP PAYMENT */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: cardbg,
            borderRadius: 3,
            px: { xs: 2, sm: 3 },
            py: { xs: 3, sm: 4 },
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="center"
            sx={headingBodyGapSx}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "common.white",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <CheckOutlined sx={{ fontSize: 22 }} />
            </Box>
            <Typography
              component="h2"
              variant="h4"
              sx={{
                ...sectionHeadingSx,
                textAlign: "center",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 0,
              }}
            >
              Paying For Grouped Bookings
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  height: "100%",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Full Payment
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "mollure.bodyText",
                      fontWeight: 400,
                      lineHeight: 1.65,
                    }}
                  >
                    One Person Can Pay The Full Amount.
                  </Typography>
                </Stack>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <ContentCard
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  height: "100%",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={cardTitleSx}>
                    Split Between Participants
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "mollure.bodyText",
                      fontWeight: 400,
                      lineHeight: 1.65,
                    }}
                  >
                    Each Participant Can Pay Their Own Share, Or One Person Can
                    Cover Multiple Participants In A Single Payment.
                  </Typography>
                </Stack>
              </ContentCard>
            </Grid>
          </Grid>
        </Box>

        {/* BOOKING COMMUNICATION */}
        <Box
          sx={{
            ...sectionGapSx,
            bgcolor: bgshadow,
            borderRadius: 3,
            px: { xs: 2.5, sm: 4 },
            py: { xs: 4, sm: 5 },
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "common.white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Image
                src={HowItWorksBookingCommunicationChatIcon}
                alt=""
                width={28}
                height={28}
              />
            </Box>
            <Typography
              component="h2"
              variant="h4"
              sx={{
                ...sectionHeadingSx,
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.2,
                maxWidth: 640,
              }}
            >
              Booking Communication
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "mollure.bodyText",
                fontWeight: 400,
                lineHeight: 1.75,
                maxWidth: 880,
              }}
            >
              Use Built-In Messaging To Contact A Professional Before Booking Or
              Communicate About An Existing Appointment. Once A Booking Request
              Or Confirmation Exists, All Messages, Edits, And Change
              Suggestions Are Automatically Linked To That Booking. This Keeps
              Every Conversation In One Place And Makes Complex Bookings Easy To
              Manage Without Losing Context.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
