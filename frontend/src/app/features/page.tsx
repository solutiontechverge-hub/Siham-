"use client";

import * as React from "react";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { DD, Logo } from "../../../images";

type MiniCard = {
  title: string;
  icon: React.ReactNode;
  tone: "mint" | "sky" | "sand" | "teal";
};

function toneStyles(tokens: any, tone: MiniCard["tone"]) {
  switch (tone) {
    case "mint":
      return {
        bg: "rgba(220, 247, 238, 0.72)",
        iconBg: alpha(tokens.teal, 0.12),
        iconColor: tokens.tealDark,
      };
    case "sky":
      return {
        bg: "rgba(218, 244, 255, 0.78)",
        iconBg: "rgba(17, 119, 255, 0.10)",
        iconColor: "#1177FF",
      };
    case "sand":
      return {
        bg: "rgba(255, 244, 220, 0.78)",
        iconBg: "rgba(255, 181, 71, 0.16)",
        iconColor: tokens.star,
      };
    case "teal":
    default:
      return {
        bg: "rgba(180, 238, 233, 0.62)",
        iconBg: alpha(tokens.teal, 0.14),
        iconColor: tokens.teal,
      };
  }
}

function BulletList({
  items,
}: {
  items: readonly string[];
}) {
  const tokens = useTheme().palette.mollure;

  return (
    <Stack spacing={1.25} sx={{ mt: 2 }}>
      {items.map((text) => (
        <Stack key={text} direction="row" spacing={1.25} alignItems="flex-start">
          <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 20, color: tokens.teal }} />
          <Typography sx={{ color: tokens.slate, fontSize: 13.5, lineHeight: 1.7 }}>
            {text}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function BusinessSetupCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  const SmallCard = ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 10px 18px rgba(16, 24, 40, 0.08)",
        px: 2,
        py: 1.7,
        display: "flex",
        alignItems: "center",
        gap: 1.4,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.4,
          bgcolor: tokens.teal,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 13, color: tokens.navy, lineHeight: 1.15 }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 10.5, color: alpha(tokens.navy, 0.46), lineHeight: 1.25 }}>
          {description}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(218, 244, 255, 0.65) 0%, rgba(255,255,255,0.94) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative diamonds */}
      <Box
        sx={{
          position: "absolute",
          right: 12,
          top: 10,
          width: 160,
          height: 160,
          display: { xs: "none", md: "block" },
          opacity: 0.95,
        }}
      >
        <Image
          src={DD}
          alt=""
          width={160}
          height={160}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ position: "relative", p: { xs: 2.4, md: 3 } }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15.5, color: tokens.navy }}>
          Business Setup &amp; Professional Presence
        </Typography>
        <Typography sx={{ mt: 1.1, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Create A Professional Presence That Clearly Reflects Who You Are And How You Work.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>
            Choose whether you offer services at a Fixed Location, Desired Location, or both
          </Bullet>
          <Bullet>
            Option to use the same content for both locations or manage them separately
          </Bullet>
          <Bullet>
            Present your professional name, bio, cover images, and keywords
          </Bullet>
        </Stack>

        <Box sx={{ mt: 2.6 }}>
          <Bullet>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Define your service locations:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<StorefrontRoundedIcon sx={{ fontSize: 18 }} />}
                title="Fixed Location"
                description="Provide Your Salon Or Workspace Address"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<PlaceRoundedIcon sx={{ fontSize: 18 }} />}
                title="Desired Location"
                description="Define Your Operating Areas (Nationwide Or Selected Provinces/Municipalities)"
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Bullet>Structure your services and sub-services with clear pricing</Bullet>
        </Box>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(tokens.teal, 0.55)}`,
            borderRadius: 2,
            bgcolor: alpha("#fff", 0.7),
            p: 2,
          }}
        >
          <Bullet>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Enable optional booking features:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<WorkspacesRoundedIcon sx={{ fontSize: 18 }} />}
                title="Combinable Services"
                description="(Fixed Location Only)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SmallCard
                icon={<WidgetsRoundedIcon sx={{ fontSize: 18 }} />}
                title="Project Bookings"
                description="(Desired Location Only, For Business Clients)"
              />
            </Grid>
          </Grid>
        </Box>

        <Stack spacing={1.35} sx={{ mt: 2.2 }}>
          <Bullet>Add team members and define which services they provide</Bullet>
          <Bullet>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Display key business information on your profile:
            </Box>
          </Bullet>
        </Stack>

        <Grid container spacing={1.5} sx={{ mt: 1.4, pl: 3.75 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.1}>
              {["Price Range", "Kilometer Allowance For On-Location Services"].map((t) => (
                <Stack key={t} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ mt: "7px", width: 4, height: 4, borderRadius: 99, bgcolor: alpha(tokens.navy, 0.35) }} />
                  <Typography sx={{ color: alpha(tokens.navy, 0.6), fontSize: 12, lineHeight: 1.6 }}>
                    {t}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.1}>
              {[
                "Policies (Response Time, Cancellation, Rescheduling, No-Show)",
                "Prepayment Requirements (If Applicable)",
              ].map((t) => (
                <Stack key={t} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ mt: "7px", width: 4, height: 4, borderRadius: 99, bgcolor: alpha(tokens.navy, 0.35) }} />
                  <Typography sx={{ color: alpha(tokens.navy, 0.6), fontSize: 12, lineHeight: 1.6 }}>
                    {t}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1.8 }}>
          <Bullet>Showcase your work with a portfolio of images visible on your public profile</Bullet>
        </Box>
      </Box>
    </Paper>
  );
}

function CalendarSchedulingCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  const Mini = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 10px 18px rgba(16, 24, 40, 0.08)",
        px: 1.8,
        py: 1.35,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        minHeight: 56,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.2,
          bgcolor: "#0AA8A5",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 11.5, color: alpha(tokens.navy, 0.62), lineHeight: 1.3 }}>
        {text}
      </Typography>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(232, 251, 247, 0.85) 0%, rgba(255,255,255,0.94) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative blocks (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: 10,
          top: 10,
          width: 150,
          height: 150,
          display: { xs: "none", md: "block" },
          opacity: 0.92,
        }}
      >
        <Image
          src={DD}
          alt=""
          width={150}
          height={150}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ position: "relative", p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Calendar &amp; Scheduling
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Manage Your Entire Schedule From One Central Place.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>Central calendar with a full overview of all bookings (online and offline)</Bullet>
          <Bullet>Team scheduling with long-term availability planning</Bullet>
          <Bullet>Time blocking for breaks, meetings, or unavailable periods</Bullet>
        </Stack>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(tokens.teal, 0.55)}`,
            borderRadius: 2,
            bgcolor: alpha(tokens.mintSoft, 0.55),
            p: 2,
          }}
        >
          <Bullet>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Per-booking overview including:
            </Box>
          </Bullet>

          <Grid container spacing={2} sx={{ mt: 1.6 }}>
            <Grid item xs={12} md={4}>
              <Mini icon={<EventNoteRoundedIcon sx={{ fontSize: 16 }} />} text="Booking Details" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini icon={<LinkRoundedIcon sx={{ fontSize: 16 }} />} text="Linked Sales And Payment Activity" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                icon={<TimelineRoundedIcon sx={{ fontSize: 16 }} />}
                text="Complete Activity Timeline With Date- And Time-Stamped Actions"
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2.2 }}>
          <Bullet>
            Set your public hours and define booking preferences, including time intervals between appointments,
            service order logic and calendar appearance.
          </Bullet>
        </Box>
      </Box>
    </Paper>
  );
}

function InteractiveBookingFlowCard() {
  const tokens = useTheme().palette.mollure;

  const orange = tokens.star; // theme-based orange/yellow accent

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: orange }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  const Mini = ({
    icon,
    title,
  }: {
    icon: React.ReactNode;
    title: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1.6,
        border: `1px solid ${alpha(tokens.navy, 0.08)}`,
        bgcolor: "#fff",
        boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
        px: 2,
        py: 1.2,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        minHeight: 54,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.2,
          bgcolor: orange,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          color: alpha(tokens.navy, 0.82),
          lineHeight: 1.25,
          maxWidth: 230,
        }}
      >
        {title}
      </Typography>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: alpha(orange, 0.12),
          pointerEvents: "none",
        }}
      />

      {/* Decorative circles (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: -18,
          top: -30,
          width: 150,
          height: 150,
          display: { xs: "none", md: "block" },
          pointerEvents: "none",
          opacity: 0.35,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `20px solid ${alpha(orange, 0.18)}`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 26,
            borderRadius: "50%",
            border: `18px solid ${alpha(orange, 0.14)}`,
          }}
        />
      </Box>

      <Box sx={{ position: "relative", p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Interactive Booking Flow
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Handle Online Bookings Through A Structured, Fair Approval Process.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>
            Online bookings follow Mollure&apos;s interactive booking flow when confirmation is required
          </Bullet>
        </Stack>

        <Box
          sx={{
            mt: 2.1,
            border: `2px dashed ${alpha(orange, 0.8)}`,
            borderRadius: 2,
            bgcolor: alpha(orange, 0.08),
            p: 2.1,
          }}
        >
          <Bullet>
            <Box component="span" sx={{ fontWeight: 900, color: tokens.navy }}>
              Support for:
            </Box>
          </Bullet>

          <Grid container spacing={1.8} sx={{ mt: 1.5 }}>
            <Grid item xs={12} md={4}>
              <Mini icon={<TaskAltRoundedIcon sx={{ fontSize: 16 }} />} title="Booking Requests" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini icon={<EditNoteRoundedIcon sx={{ fontSize: 16 }} />} title="Edited Booking Requests" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Mini
                icon={<PublishedWithChangesRoundedIcon sx={{ fontSize: 16 }} />}
                title="Edit Requests On Confirmed Bookings"
              />
            </Grid>
          </Grid>
        </Box>

        <Stack spacing={1.35} sx={{ mt: 2.2 }}>
          <Bullet>Clear comparison of changes before approval</Bullet>
          <Bullet>Ability to accept, edit, or reject requests with full transparency</Bullet>
          <Bullet>Major changes always require approval from the other party</Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}

function ClientManagementInsightsCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: alpha(tokens.teal, 0.06),
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Client Management &amp; Insights
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Understand Your Clients And Build Stronger Relationships.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>Overview of all clients in one place</Bullet>
          <Bullet>Includes both registered Mollure clients and client profiles you created</Bullet>
          <Bullet>Access client details and client-level insights</Bullet>
          <Bullet>Add internal notes to track preferences and context</Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}

function PaymentsInvoicingFinancialControlCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  const Mini = ({
    icon,
    title,
  }: {
    icon: React.ReactNode;
    title: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(tokens.navy, 0.08)}`,
        bgcolor: "#fff",
        boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
        px: 2.1,
        py: 2,
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.2,
          bgcolor: alpha(tokens.navy, 0.12),
          color: alpha(tokens.navy, 0.78),
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(tokens.navy, 0.72), lineHeight: 1.25 }}>
        {title}
      </Typography>
    </Paper>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Payments, Invoicing &amp; Financial Control
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Stay In Control Of Your Finances With Stripe-Powered Payments.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>Clear overview of all transactions (online and offline)</Bullet>
          <Bullet>Stripe-powered online payments with direct payouts</Bullet>
          <Bullet>Access to your connected Stripe dashboard for online payment details</Bullet>
          <Bullet>Control which post-booking payment methods are available at checkout</Bullet>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 2.25 }}>
          <Grid item xs={12} md={4}>
            <Mini icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />} title="Individual Client Invoices" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Mini icon={<ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />} title="Tax-Compliant Business Invoices" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Mini
              icon={<NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />}
              title="Due Date Settings And Automated Invoice Reminders"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2.2 }}>
          <Bullet>Refunds and payment adjustments handled per booking when applicable</Bullet>
        </Box>
      </Box>
    </Paper>
  );
}

function AnalyticsPerformanceCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: alpha(tokens.teal, 0.06),
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      {/* Decorative diamonds (top-right) */}
      <Box
        sx={{
          position: "absolute",
          right: 12,
          top: 10,
          width: 160,
          height: 160,
          display: { xs: "none", md: "block" },
          pointerEvents: "none",
          opacity: 0.9,
        }}
      >
        <Image
          src={DD}
          alt=""
          width={160}
          height={160}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Analytics &amp; Performance
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Track Performance And Make Informed Decisions.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>Booking &amp; operational analytics</Bullet>
          <Bullet>Sales volume analytics</Bullet>
          <Bullet>Performance analytics</Bullet>
          <Bullet>Ratings &amp; reviews analytics</Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}

function NotificationsCard() {
  const tokens = useTheme().palette.mollure;

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <CheckCircleRoundedIcon sx={{ mt: "2px", fontSize: 18, color: tokens.teal }} />
      <Typography sx={{ color: alpha(tokens.navy, 0.72), fontSize: 13.5, lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Stack>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${tokens.border}`,
        bgcolor: alpha(tokens.teal, 0.06),
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box sx={{ p: { xs: 2.4, md: 3 } }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.3,
            py: 0.7,
            borderRadius: 1.6,
            bgcolor: "#fff",
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 10px 18px rgba(16, 24, 40, 0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: tokens.navy }}>
            Notifications
          </Typography>
        </Box>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: alpha(tokens.navy, 0.5) }}>
          Never Miss An Important Update.
        </Typography>

        <Stack spacing={1.35} sx={{ mt: 2.25 }}>
          <Bullet>In-app notifications and emails are sent for important booking actions</Bullet>
          <Bullet>
            This includes booking requests, edits, confirmations, cancellations, and payment-related updates
          </Bullet>
          <Bullet>
            All notifications include direct access to the booking for quick review and action
          </Bullet>
        </Stack>
      </Box>
    </Paper>
  );
}

function MiniCards({ cards }: { cards: readonly MiniCard[] }) {
  const tokens = useTheme().palette.mollure;

  return (
    <Grid container spacing={2} sx={{ mt: 2.25 }}>
      {cards.map((c) => {
        const s = toneStyles(tokens, c.tone);
        return (
          <Grid key={c.title} item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 2.5,
                border: `1px solid ${tokens.border}`,
                bgcolor: s.bg,
                p: 2,
                display: "flex",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: s.iconBg,
                  color: s.iconColor,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: tokens.navy }}>
                {c.title}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

function FeatureSection({
  title,
  subtitle,
  bullets,
  cards,
  tint,
}: {
  title: string;
  subtitle: string;
  bullets: readonly string[];
  cards?: readonly MiniCard[];
  tint: "mint" | "sky" | "sand";
}) {
  const tokens = useTheme().palette.mollure;

  const bg =
    tint === "mint"
      ? "linear-gradient(180deg, rgba(220,247,238,0.85) 0%, rgba(255,255,255,0.92) 100%)"
      : tint === "sky"
        ? "linear-gradient(180deg, rgba(218,244,255,0.92) 0%, rgba(255,255,255,0.92) 100%)"
        : "linear-gradient(180deg, rgba(255,244,220,0.92) 0%, rgba(255,255,255,0.92) 100%)";

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 3,
        border: `1px solid ${tokens.border}`,
        bgcolor: "#fff",
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(40, 92, 112, 0.10)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: bg,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: 18,
          top: 18,
          width: 120,
          height: 120,
          borderRadius: 3,
          border: `1px solid ${alpha(tokens.teal, 0.22)}`,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 100%)",
          transform: "rotate(45deg)",
          display: { xs: "none", md: "block" },
          opacity: 0.9,
        }}
      />
      <Box sx={{ position: "relative", p: { xs: 2.5, md: 3 } }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16.5, color: tokens.navy }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.75, color: tokens.bodyText, fontSize: 13.5, lineHeight: 1.75 }}>
          {subtitle}
        </Typography>
        <BulletList items={bullets} />
        {cards?.length ? <MiniCards cards={cards} /> : null}
      </Box>
    </Paper>
  );
}

export default function FeaturesPage() {
  const tokens = useTheme().palette.mollure;

  const nav = ["Features", "How It Works", "Pricing", "About"] as const;

  return (
    <Box sx={{ bgcolor: tokens.surface, color: tokens.navy, minHeight: "100vh" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#fff",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box component={Link} href="/" sx={{ display: "inline-flex", alignItems: "center", minWidth: 240 }}>
              <Image src={Logo} alt="Mollure" width={160} height={38} priority />
            </Box>

            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {nav.map((label) => {
                const href =
                  label === "Features"
                    ? "/features"
                    : label === "How It Works"
                      ? "/how-it-works"
                      : label === "Pricing"
                        ? "/pricing"
                        : label === "About"
                          ? "/about"
                          : undefined;
                const active = label === "Features";
                return (
                  <Typography
                    key={label}
                    component={href ? Link : "span"}
                    href={href}
                    sx={{
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? alpha(tokens.navy, 0.88) : alpha(tokens.navy, 0.6),
                      textDecoration: "none",
                      lineHeight: 1,
                      cursor: href ? "pointer" : "default",
                      "&:hover": href ? { color: tokens.navy } : undefined,
                    }}
                  >
                    {label}
                  </Typography>
                );
              })}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 320, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                startIcon={<LanguageRoundedIcon sx={{ fontSize: 18 }} />}
                endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: 999,
                  borderColor: alpha(tokens.navy, 0.18),
                  color: tokens.navy,
                  px: 1.5,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 13,
                  bgcolor: "#fff",
                  height: 34,
                  minWidth: 92,
                  "& .MuiButton-startIcon": { mr: 0.7 },
                  "& .MuiButton-endIcon": { ml: 0.5 },
                }}
              >
                EN
              </Button>
              <Button
                component={Link}
                href="/auth/login"
                variant="contained"
                disableElevation
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: tokens.teal,
                  "&:hover": { bgcolor: tokens.tealDark },
                  height: 34,
                }}
              >
                login
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: alpha(tokens.navy, 0.18),
                  color: alpha(tokens.navy, 0.62),
                  px: 2.0,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  bgcolor: "#fff",
                  height: 34,
                }}
              >
                for client
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* HERO */}
      <Box
        sx={{
          bgcolor: alpha(tokens.teal, 0.16),
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 5.25, md: 6.25 } }}>
          <Stack alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.7rem", md: "4rem" },
                color: tokens.navy,
              }}
            >
              Features
            </Typography>
            <Typography
              sx={{
                mt: 1.45,
                maxWidth: 640,
                color: alpha(tokens.navy, 0.6),
                fontSize: { xs: 13.5, md: 14.5 },
                lineHeight: 1.7,
              }}
            >
              Interactive Booking That Puts Clarity And Communication First. Book With Confidence,
              Knowing Nothing Important Happens Without Your Approval.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3.25, md: 4 } }}>
        <Stack spacing={2.5}>
          <BusinessSetupCard />

          <CalendarSchedulingCard />

          <InteractiveBookingFlowCard />

          <ClientManagementInsightsCard />

          <PaymentsInvoicingFinancialControlCard />

          <AnalyticsPerformanceCard />

          <NotificationsCard />
        </Stack>
      </Container>

      <Box
        sx={{
          bgcolor: tokens.footer,
          color: tokens.footerText,
          pt: 5.5,
          pb: 3,
          mt: 2,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={5}>
            <Grid item xs={12} md={5}>
              <Typography sx={{ mb: 1.25, fontWeight: 900, color: "#fff", fontSize: 22 }}>
                Mollure
              </Typography>
              <Typography sx={{ color: tokens.footerText, lineHeight: 1.7, maxWidth: 360, fontSize: 13 }}>
                The All-In-One Platform For Salon And Freelancer Appointment Management
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={2.33}>
              <Typography sx={{ mb: 1.25, fontWeight: 900, color: "#fff", fontSize: 14 }}>
                Product
              </Typography>
              <Stack spacing={0.9}>
                <Typography component={Link} href="/features" sx={{ color: tokens.footerText, textDecoration: "none", fontSize: 12.5 }}>
                  Features
                </Typography>
                <Typography component={Link} href="/pricing" sx={{ color: tokens.footerText, textDecoration: "none", fontSize: 12.5 }}>
                  Pricing
                </Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>Integrations</Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>API</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={2.33}>
              <Typography sx={{ mb: 1.25, fontWeight: 900, color: "#fff", fontSize: 14 }}>
                Company
              </Typography>
              <Stack spacing={0.9}>
                <Typography component={Link} href="/about" sx={{ color: tokens.footerText, textDecoration: "none", fontSize: 12.5 }}>
                  About
                </Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>FAQ</Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>Contact</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={2.33}>
              <Typography sx={{ mb: 1.25, fontWeight: 900, color: "#fff", fontSize: 14 }}>
                Legal
              </Typography>
              <Stack spacing={0.9}>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>Privacy</Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>Terms</Typography>
                <Typography sx={{ color: tokens.footerText, fontSize: 12.5 }}>Security</Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3.5, borderColor: alpha("#fff", 0.12) }} />
          <Typography sx={{ color: tokens.footerMuted, fontSize: 12.5 }}>
            2024 Mollure. All Rights Reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

