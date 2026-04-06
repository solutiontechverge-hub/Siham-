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
} from "@mui/material";

const SectionTitle = ({ title }: { title: string }) => (
  <Typography
    variant="h4"
    sx={{
      fontWeight: 800,
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
      <Typography variant="h6" fontWeight={700} mb={2}>
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

export default function HowItWorksPage() {
  return (
    <Box sx={{ bgcolor: "#f7f9fb" }}>
      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#cfe8e6",
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight={800}>
          How Booking Works On Mollure
        </Typography>
        <Typography mt={2} maxWidth="700px" mx="auto">
          Effortless booking for both clients and professionals.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* INTERACTIVE PROCESS */}
        <SectionTitle title="Interactive Booking Process" />

        <Typography textAlign="center" mb={6}>
          Mollure allows interactive booking where clients can collaborate
          with professionals in real-time.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <InfoCard
              title="Individual Clients"
              points={[
                "Single bookings",
                "Personal scheduling",
                "Direct communication",
              ]}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoCard
              title="Business Clients"
              points={[
                "Bulk appointments",
                "Multiple professionals",
                "Recurring bookings",
              ]}
            />
          </Grid>
        </Grid>

        {/* KEY PRINCIPLES */}
        <Box mt={10}>
          <SectionTitle title="Key Principles of Mollure" />

          <Grid container spacing={3}>
            {[
              "Client-Created Bookings",
              "Professional-Created Bookings",
              "Changes Requiring Approval",
              "Changes Without Approval",
            ].map((item, i) => (
              <Grid item xs={12} md={3} key={i}>
                <Card sx={{ p: 2, borderRadius: 3 }}>
                  <Typography fontWeight={700}>{item}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* BOOKING TYPES */}
        <Box mt={10}>
          <SectionTitle title="Booking Types and Setup" />

          <Card sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Typography fontWeight={700} mb={2}>
              Fixed Location
            </Typography>
            <Typography variant="body2">
              Clients book at a fixed service location.
            </Typography>
          </Card>

          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={700} mb={2}>
              Detailed Location Booking
            </Typography>
            <Typography variant="body2">
              Clients specify address and services with time slots.
            </Typography>
          </Card>
        </Box>

        {/* REQUEST TYPES */}
        <Box mt={10}>
          <SectionTitle title="Types of Requests" />

          <Grid container spacing={3}>
            {["Booking Request", "Edited Request", "Edit Request"].map(
              (title, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography fontWeight={700}>{title}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Button variant="contained" fullWidth sx={{ mb: 1 }}>
                      Accept
                    </Button>
                    <Button variant="outlined" fullWidth>
                      Reject
                    </Button>
                  </Card>
                </Grid>
              )
            )}
          </Grid>
        </Box>

        {/* CHANGES */}
        <Box mt={10}>
          <SectionTitle title="Changes Without Approval" />

          <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography fontWeight={700}>Detail Changes</Typography>
            <Typography variant="body2">
              Minor updates that do not require approval.
            </Typography>
          </Card>

          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography fontWeight={700}>Service Order Change</Typography>
            <Typography variant="body2">
              Adjust sequence of services.
            </Typography>
          </Card>
        </Box>

        {/* RESPONSE */}
        <Box mt={10}>
          <SectionTitle title="How Professionals Respond" />

          <Grid container spacing={3}>
            {["Accept", "Edit", "Reject"].map((action, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700}>{action}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* RESCHEDULING */}
        <Box mt={10}>
          <SectionTitle title="Client Rescheduling" />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700}>Fixed Location</Typography>
                <Typography variant="body2">
                  Reschedule based on availability.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700}>Desired Location</Typography>
                <Typography variant="body2">
                  Adjust time & place flexibly.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* PAYMENTS */}
        <Box mt={10}>
          <SectionTitle title="Payments & Invoices" />

          <Grid container spacing={3}>
            {[
              "Prepayment",
              "Post-Booking Payment",
              "Invoices & Payment",
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700}>{item}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* GROUP PAYMENT */}
        <Box mt={10}>
          <SectionTitle title="Paying For Grouped Bookings" />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700}>Full Payment</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700}>
                  Split Between Participants
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}