"use client";

import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AppCard,
  ContentCard,
  MarketingSiteFooter,
  MarketingSiteHeader,
} from "../../components/common";
import {
  marketingShellFooter,
  marketingShellHeader,
} from "../../data/marketingShell.data";
import {
  CheckCircleOutline,
  CheckOutlined,
  CheckCircle,
  PersonPinCircleOutlined,
  LocationOnOutlined,
  TuneOutlined,
  ErrorOutlineOutlined,
  BoltOutlined,
  EventSeatOutlined,
  ScheduleOutlined,
  NearMeOutlined,
  EditOutlined,
  EditNoteOutlined,
  CloseOutlined,
  FormatListBulletedOutlined,
  NotificationsOutlined,
  CreditCard,
  Language,
  ReceiptLong,
  ForumOutlined,
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

const SectionTitle = ({ title }: { title: string }) => (
  <Typography
    variant="h4"
    sx={{
      ...sectionHeadingSx,
      textAlign: "center",
      mb: 4,
    }}
  >
    {title}
  </Typography>
);

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
const fixedLocation = [
  {
    title: "Guest policy",
    sub: "Book for yourself and add up to one guest",
  },
  {
    title: "Service Timing",
    sub: "Services start at the same time by default",
  },
  {
    title: "Combinable Services",
    sub: "Select multiple services if offered",
  },
  {
    title: "Team Selection",
    sub: "Assign different team members per service",
  },
];
const desiredLocationIndividual = [
  {
    title: "Multiple Guests",
    sub: "Add as many guests as needed",
  },
  {
    title: "Sequential Services",
    sub: "Services scheduled one after another",
  },
  {
    title: "Single Team Member",
    sub: "All services under one professional",
  },
  {
    title: "Minimum Time Block",
    sub: "Some professionals may require minimum duration",
  },
];
export const desiredLocationBusiness = [
  {
    title: "Multiple Models",
    sub: "Add As Many Model As Needed",
  },
  {
    title: "Sequential Services",
    sub: "Services Scheduled One After Another",
  },
  {
    title: "Single Team Member",
    sub: "All Services Under One Professional",
  },
  {
    title: "Minimum Time Block",
    sub: "Some Professionals May Require Minimum Duration",
  },
  {
    title: "Project Details & File Uploads",
    sub: "Include Comprehensive Project Information",
  },
  {
    title: "Planning Details",
    sub: "Upload Files And Images For Reference",
  },
];

const points = [
  "Sign Up Via Social Login Or Personal Registration",
  "Manage Profile",
  "Control Over Profile Visibility",
  "Book Services For Personal Needs",
  "Receive Invoices For Online Payment",
];
const businessPoints = [
  "Register with business details  ",
  "Manage Profile",
  "Project booking access",
  "Book services for personal or Business needs",
  "Receive tax-compliant invoices (online or offline)",
];

export default function HowItWorksPage() {
  const theme = useTheme();
  const bgshadow = theme.palette.mollure.bgshadow;
  const cardbg = theme.palette.mollure.cardbg;
  const textcolorgrey700 = theme.palette.mollure.textcolorgrey700;

  const keyPrinciples = [
    {
      title: "Client-Created Bookings",
      description:
        "Fixed location bookings are confirmed instantly. Desired location bookings are always sent as a booking request when created by a client.",
      Icon: LocationOnOutlined,
    },
    {
      title: "Professional-Created Bookings",
      description:
        "Bookings created by professionals are always sent as a booking request, regardless of location.",
      Icon: TuneOutlined,
    },
    {
      title: "Changes Requiring Approval",
      description:
        "Major changes require approval, so nothing important changes without you knowing.",
      Icon: ErrorOutlineOutlined,
    },
    {
      title: "Changes Without Approval",
      description:
        "Some changes are applied directly and clearly marked. When relevant, you'll be notified that the booking has been edited.",
      Icon: BoltOutlined,
    },
  ] as const;

  return (
    <Box sx={{ bgcolor: "#f7f9fb" }}>
      <MarketingSiteHeader
        navItems={[...marketingShellHeader.navItems]}
        localeLabel={marketingShellHeader.localeLabel}
        loginLabel={marketingShellHeader.loginLabel}
        professionalLinkLabel={marketingShellHeader.professionalLinkLabel}
        professionalHref={marketingShellHeader.professionalHref}
      />
      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#cfe8e6",
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            color: "mollure.textcolorgrey700",
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          How Booking Works On Mollure
        </Typography>
        <Typography
          mt={2}
          maxWidth="700px"
          mx="auto"
          variant="body1"
          color="text.secondary"
          sx={{ fontWeight: 400, lineHeight: 1.7 }}
        >
          Interactive booking that puts clarity and communication first. Book
          with confidence, knowing nothing important happens without your
          approval.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* INTERACTIVE PROCESS */}
        <ContentCard
          sx={{ bgcolor: cardbg, color: textcolorgrey700 }}
          withAccent={true}
          title="Interactive Booking Process"
          description="Mollure uses an interactive online booking process. This means bookings are not always instantly confirmed. Some bookings require review and approval before they are finalized. In certain situations, changes made before or after confirmation also require approval, ensuring both parties stay aligned throughout the booking process."
        />

        <Box bgcolor={bgshadow} p={4} borderRadius={3} boxShadow={2} mt={3}>
          <Typography
            variant="h4"
            sx={{
              ...sectionHeadingSx,
              textAlign: "center",
              mb: 4,
              mt: 2,
            }}
          >
            Getting Started
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <ContentCard>
                <Stack spacing={2}>
                  {/* ICON */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "#e6f4f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonPinCircleOutlined sx={{ color: "#1bb3a9" }} />
                  </Box>

                  {/* TITLE */}
                  <Typography variant="h6" fontWeight={600}>
                    Individual Clients
                  </Typography>

                  {/* LIST */}
                  <Stack spacing={1.2}>
                    {points.map((item, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <CheckOutlined
                          sx={{ color: "#1bb3a9", fontSize: 18 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ContentCard>
                <Stack spacing={2}>
                  {/* ICON */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "#e6f4f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonPinCircleOutlined sx={{ color: "#1bb3a9" }} />
                  </Box>

                  {/* TITLE */}
                  <Typography variant="h6" fontWeight={600}>
                    Business Clients
                  </Typography>

                  {/* LIST */}
                  <Stack spacing={1.2}>
                    {businessPoints.map((item, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <CheckOutlined
                          sx={{ color: "#1bb3a9", fontSize: 18 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </ContentCard>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Client profile information is controlled by the client. Professional
            can view relevant details once a booking is confirmed and the client
            has been added to the client list of the professional, but
            professional cannot edit client user information.
          </Typography>
        </Box>

        {/* KEY PRINCIPLES */}
        <Box mt={10}>
          <Typography
            variant="h4"
            sx={{
              ...sectionHeadingSx,
              textAlign: "center",
              mb: 4,
              mt: 2,
            }}
          >
            Key Principles of Mollure
          </Typography>

          <Grid container spacing={3}>
            {keyPrinciples.map(({ title, description, Icon }) => (
              <Grid item xs={12} sm={6} md={3} key={title}>
                <ContentCard
                  sx={{
                    height: "100%",
                    // backgroundColor: "rgba(255,255,255,0.92)",
                    backgroundColor: { cardbg },
                    boxShadow: "0 10px 28px rgba(16, 35, 63, 0.10)",
                  }}
                >
                  <Stack spacing={2} sx={{ height: "100%" }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: { cardbg },
                        color: theme.palette.primary.main,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon fontSize="small" />
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
            ))}
          </Grid>
        </Box>
        {/* BOOKING TYPES */}
        <Box mt={10}>
          <AppCard
            sx={{
              p: { xs: 2.5, sm: 4 },
              pt: { xs: 3, sm: 4 },
              borderRadius: "28px",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                ...sectionHeadingSx,
                textAlign: "center",
                mb: 4,
              }}
            >
              Booking Types and Setup
            </Typography>

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
                  <EventSeatOutlined sx={{ fontSize: 28 }} />
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
                    {fixedLocation.map((f) => (
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
                      bgcolor: "mollure.mintSoft",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle sx={{ color: "primary.main", fontSize: 24 }} />
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
                  <LocationOnOutlined sx={{ fontSize: 28 }} />
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
                      {desiredLocationIndividual.map((f) => (
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
                      ))}
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
                          Project (only for business clients)
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2.5}>
                      {desiredLocationBusiness.map((f) => (
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
                      ))}
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
                    <ScheduleOutlined
                      sx={{ color: "mollure.star", fontSize: 26 }}
                    />
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
        {/* REQUEST TYPES */}
        <Box mt={10} bgcolor={theme.palette.mollure.warmwarning}>
          <SectionTitle title="Types of Requests" />

          <Stack spacing={3}>
            {/* Booking Request */}
            <AppCard sx={{ p: 0, overflow: "hidden" }}>
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  bgcolor: theme.palette.mollure.warmwarning,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: theme.palette.mollure.warmwarning,
                      color: "mollure.star",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <NearMeOutlined sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
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

              <Box
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pb: { xs: 2.5, sm: 3 },
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "mollure.border",
                  bgcolor: alpha(theme.palette.mollure.bgshadow, 0.65),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  Client can respond with:
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1.5 }}>
                  {[
                    {
                      label: "Accept",
                      bg: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      icon: <CheckCircle sx={{ fontSize: 18 }} />,
                    },
                    {
                      label: "Suggestion for change",
                      bg: alpha(theme.palette.mollure.border, 0.35),
                      color: theme.palette.mollure.slate,
                      icon: <EditOutlined sx={{ fontSize: 18 }} />,
                    },
                    {
                      label: "Reject",
                      bg: alpha("#E31B23", 0.1),
                      color: "#E31B23",
                      icon: <CloseOutlined sx={{ fontSize: 18 }} />,
                    },
                  ].map((a) => (
                    <Grid item xs={12} sm={4} key={a.label}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          bgcolor: a.bg,
                          color: a.color,
                          minHeight: 46,
                        }}
                      >
                        {a.icon}
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {a.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </AppCard>

            {/* Edited Booking Request */}
            <AppCard sx={{ p: 0, overflow: "hidden" }}>
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  bgcolor: theme.palette.mollure.warmwarning,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.mollure.star, 0.22),
                      color: "mollure.star",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <EditNoteOutlined sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                    Edited Booking Request
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "text.secondary" }}
                >
                  When the professional edits a booking request from the client
                  or the booking request you sent to the client.
                </Typography>
              </Box>

              <Box
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pb: { xs: 2.5, sm: 3 },
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "mollure.border",
                  bgcolor: alpha(theme.palette.mollure.bgshadow, 0.65),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  Client can respond with:
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1.5 }}>
                  {[
                    {
                      label: "Accept",
                      bg: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      icon: <CheckCircle sx={{ fontSize: 18 }} />,
                    },
                    {
                      label: "Suggestion for change",
                      bg: alpha(theme.palette.mollure.border, 0.35),
                      color: theme.palette.mollure.slate,
                      icon: <EditOutlined sx={{ fontSize: 18 }} />,
                    },
                    {
                      label: "Reject",
                      bg: alpha("#E31B23", 0.1),
                      color: "#E31B23",
                      icon: <CloseOutlined sx={{ fontSize: 18 }} />,
                    },
                  ].map((a) => (
                    <Grid item xs={12} sm={4} key={a.label}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          bgcolor: a.bg,
                          color: a.color,
                          minHeight: 46,
                        }}
                      >
                        {a.icon}
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {a.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </AppCard>

            {/* Edit Request */}
            <AppCard sx={{ p: 0, overflow: "hidden" }}>
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  bgcolor: theme.palette.mollure.warmwarning,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.mollure.star, 0.22),
                      color: "mollure.star",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <EditOutlined sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                    Edit Request
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "text.secondary" }}
                >
                  An edit request is required for any change made by the
                  professional to a confirmed booking that affects booking
                  details, except for minor updates and standalone service order
                  adjustments. The edit request clearly highlights what has
                  changed compared to the original confirmation.
                </Typography>
              </Box>

              <Box
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pb: { xs: 2.5, sm: 3 },
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "mollure.border",
                  bgcolor: alpha(theme.palette.mollure.bgshadow, 0.65),
                }}
              >
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
                  variant="caption"
                  sx={{ mt: 2.5, display: "block", color: "text.secondary" }}
                >
                  When client receives an edit request, client can:
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1.5 }}>
                  {[
                    {
                      label: "Accept",
                      bg: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      icon: <CheckCircle sx={{ fontSize: 18 }} />,
                    },
                    {
                      label: "Suggestion for change",
                      bg: alpha(theme.palette.mollure.border, 0.35),
                      color: theme.palette.mollure.slate,
                      icon: <EditOutlined sx={{ fontSize: 18 }} />,
                    },
                  ].map((a) => (
                    <Grid item xs={12} sm={4} key={a.label}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          bgcolor: a.bg,
                          color: a.color,
                          minHeight: 46,
                        }}
                      >
                        {a.icon}
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {a.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: "text.secondary" }}
                >
                  Client can always cancel a confirmed booking with an incoming
                  or outgoing edit request.
                </Typography>
              </Box>
            </AppCard>
          </Stack>
        </Box>
        {/* CHANGES */}

        <Box mt={10}>
          <SectionTitle title="Changes Without Approval" />

          <Box
            sx={(t) => ({
              borderRadius: 3,
              p: { xs: 2, sm: 3 },
              // bgcolor: theme.palette.mollure.cardbg,
            })}
          >
            <Stack spacing={3}>
              {/* Detail Changes */}
              <ContentCard
                sx={{
                  bgcolor: theme.palette.mollure.cardbg,
                  overflow: "hidden",
                }}
              >
                <Stack spacing={2} bgcolor={theme.palette.mollure.cardbg}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
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
                      <BoltOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={cardTitleSx}>
                      Detail Changes
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Applied directly and shown as &apos;updated&apos;. No
                    approval needed:
                  </Typography>

                  <Box
                    sx={(t) => ({
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      boxShadow: `0 10px 28px ${alpha(t.palette.common.black, 0.08)}`,
                      border: "1px solid",
                      borderColor: "mollure.border",
                    })}
                  >
                    <Stack spacing={1.75}>
                      {["Contact details", "Guest names"].map((label) => (
                        <Stack
                          key={label}
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                        >
                          <CheckCircle
                            sx={{
                              color: "primary.main",
                              fontSize: 22,
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
                      sx={{
                        mt: 2.5,
                        color: "mollure.bodyText",
                        fontWeight: 600,
                      }}
                    >
                      This applies to both clients and professionals.
                    </Typography>
                  </Box>
                </Stack>
              </ContentCard>

              {/* Service order changes */}
              <ContentCard
                sx={{
                  bgcolor: theme.palette.mollure.cardbg,
                  overflow: "hidden",
                }}
              >
                <Stack spacing={2} bgcolor={theme.palette.mollure.cardbg}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
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
                      <FormatListBulletedOutlined sx={{ fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={cardTitleSx}>
                      Service Order Changes
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    If a professional only changes the service order:
                  </Typography>

                  <Box
                    sx={(t) => ({
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      boxShadow: `0 10px 28px ${alpha(t.palette.common.black, 0.08)}`,
                      border: "1px solid",
                      borderColor: "mollure.border",
                    })}
                  >
                    <Stack spacing={1.75}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <CheckCircle
                          sx={{
                            color: "primary.main",
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          The booking remains confirmed
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <NotificationsOutlined
                          sx={{
                            color: "primary.main",
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          You&apos;ll be notified that the booking has been
                          edited
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 2.5,
                        color: "mollure.bodyText",
                        fontWeight: 600,
                      }}
                    >
                      If service order is changed with other details, it becomes
                      part of a request.
                    </Typography>
                  </Box>
                </Stack>
              </ContentCard>
            </Stack>
          </Box>
        </Box>
        {/* RESPONSE */}
        <Box
          mt={10}
          sx={{
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
              mb: 2,
            }}
          >
            How Professionals Respond To Requests
          </Typography>
          <Box sx={{ bgcolor: theme.palette.mollure.cardbg ,p: 2.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: "center",
                maxWidth: 720,
                mx: "auto",
                mb: 4,
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
                    <Typography variant="subtitle1" sx={{ ...cardTitleSx, mb: 0.5 }}>
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
                    <Typography variant="subtitle1" sx={{ ...cardTitleSx, mb: 0.5 }}>
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
                    <CloseOutlined sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ ...cardTitleSx, mb: 0.5 }}>
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
        <Box mt={4}>
          <ContentCard
            sx={{
              bgcolor: bgshadow,
              borderRadius: 3,
            }}
          >
            <Stack spacing={2} alignItems="flex-start" textAlign="left">
              <Typography variant="h6" sx={{ ...cardTitleSx, width: "100%" }}>
                Discarding Requests
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.7, maxWidth: 900 }}
              >
                Any Active Booking Request Or Edit Request Can Be Discarded By
                The Party Who Sent It. Once Discarded, The Request Is Removed And
                No Further Action Is Required From The Other Party.
              </Typography>
            </Stack>
          </ContentCard>
        </Box>

        {/* RESCHEDULING */}
        <Box
          mt={10}
          sx={{
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
              mb: 4,
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
                        bgcolor: "mollure.mintSoft",
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
                          bgcolor: "success.main",
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
                          color: "mollure.tealDark",
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
          mt={10}
          sx={{
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
              mb: 4,
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
                    Prepayment May Be Required Before A Booking Is Confirmed.
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {[
                      <>
                        Prepayment Is Completed{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Online Within The Response Time.
                        </Box>
                      </>,
                      <>
                        Prepayment Is Completed{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          During Booking For Fixed Location.
                        </Box>
                      </>,
                      <>
                        Prepayment Is Completed{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          After Request Approval For Desired Location.
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
                            color: "primary.main",
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
                    Payments Completed After The Service
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {[
                      <>
                        Payments Can Be Completed{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Online Using A Payment Link
                        </Box>
                      </>,
                      <>
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Immediate Payments
                        </Box>{" "}
                        (Within 15 Minutes After Receiving The Payment Link)
                      </>,
                      <>
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Deadline-Based Payments
                        </Box>{" "}
                        (Paid Before The Invoice Due Date)
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
                            color: "primary.main",
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
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Online
                        </Box>
                        , An{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Invoice, Payment Link And Receipt
                        </Box>{" "}
                        Are Automatically Sent By Email.
                      </>,
                      <>
                        Mollure Clients Can Also Access{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Invoices, Payment Links And Receipts
                        </Box>{" "}
                        In Their{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Booking Overview.
                        </Box>
                      </>,
                      <>
                        Business Clients Always Receive{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
                          Tax-Compliant Invoices And Receipts
                        </Box>{" "}
                        Even When Paying{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "mollure.textcolorgrey700" }}>
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
                            color: "primary.main",
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
          mt={10}
          sx={{
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
            sx={{ mb: 4 }}
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
          mt={10}
          sx={{
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
              <ForumOutlined sx={{ fontSize: 30 }} />
            </Box>
            <Typography
              component="h2"
              variant="h4"
              sx={{
                ...sectionHeadingSx,
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
              Or Confirmation Exists, All Messages, Edits, And Change Suggestions
              Are Automatically Linked To That Booking. This Keeps Every
              Conversation In One Place And Makes Complex Bookings Easy To Manage
              Without Losing Context.
            </Typography>
          </Stack>
        </Box>
      </Container>

      <MarketingSiteFooter
        columns={marketingShellFooter.columns.map((col) => ({
          title: col.title,
          items: [...col.items],
        }))}
        copyright={marketingShellFooter.copyright}
      />
    </Box>
  );
}
