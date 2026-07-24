"use client";

import AppButton from "../../../../components/common/AppButton";
import * as React from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import {
  Avatar,
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../../../components/common/MollureFormField";
import type { ClientRecord } from "./data/clientList";
import { isClientBlocked } from "./data/clientList";

type InfoField = { label: string; value: string };

type ClientDetailsViewPanelProps = {
  client: ClientRecord;
  onEdit?: () => void;
  onSaveTechnicalNote: (note: string) => void;
  focusTechnicalNote?: boolean;
  onTechnicalNoteFocused?: () => void;
};

function InfoFieldCell({ label, value }: InfoField) {
  const m = useTheme().palette.mollure;
  return (
    <Grid item xs={6}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: alpha(m.navy, 0.48),
          lineHeight: 1.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 700,
          color: alpha(m.navy, 0.86),
          mt: 0.4,
          lineHeight: 1.35,
        }}
      >
        {value || "—"}
      </Typography>
    </Grid>
  );
}

export default function ClientDetailsViewPanel({
  client,
  onEdit,
  onSaveTechnicalNote,
  focusTechnicalNote = false,
  onTechnicalNoteFocused,
}: ClientDetailsViewPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const isMollure = client.tags.includes("Mollure");
  const blocked = isClientBlocked(client);

  const savedNote = client.technicalNote ?? "";
  const [technicalNoteDraft, setTechnicalNoteDraft] = React.useState(savedNote);
  const noteDirty = technicalNoteDraft.trim() !== savedNote.trim();

  React.useEffect(() => {
    setTechnicalNoteDraft(client.technicalNote ?? "");
  }, [client.id, client.technicalNote]);

  const technicalNoteSectionRef = React.useRef<HTMLDivElement | null>(null);
  const [highlightTechnicalNote, setHighlightTechnicalNote] =
    React.useState(false);

  const handleSaveTechnicalNote = React.useCallback(() => {
    if (!noteDirty) return;
    onSaveTechnicalNote(technicalNoteDraft);
  }, [noteDirty, onSaveTechnicalNote, technicalNoteDraft]);

  React.useEffect(() => {
    if (!focusTechnicalNote) return;
    setHighlightTechnicalNote(true);
    const frame = window.requestAnimationFrame(() => {
      technicalNoteSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      onTechnicalNoteFocused?.();
    });
    const timer = window.setTimeout(
      () => setHighlightTechnicalNote(false),
      2200,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [client.id, focusTechnicalNote, onTechnicalNoteFocused]);

  const sectionCardSx = {
    borderRadius: "12px",
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    bgcolor: "#fff",
    p: 2,
  } as const;

  const companyFields: InfoField[] = [
    { label: "Legal Name", value: client.legalName ?? "—" },
    { label: "COC Number", value: client.coc ?? "—" },
    { label: "VAT Number", value: client.vat ?? "—" },
    { label: "Contact Person Name", value: client.contactPersonName ?? "—" },
    { label: "Gender", value: client.gender ?? "—" },
    { label: "Contact Number", value: client.phone },
    { label: "Business Address", value: client.businessAddress ?? "—" },
    { label: "Email Address", value: client.detailEmail ?? client.email },
  ];

  const individualFields: InfoField[] = [
    { label: "Full Name", value: client.name },
    { label: "Gender", value: client.gender ?? "—" },
    { label: "Date of Birth", value: client.dateOfBirth ?? "—" },
    { label: "Contact Number", value: client.phone },
    { label: "Residential Address", value: client.residentialAddress ?? "—" },
    { label: "Email Address", value: client.email },
  ];

  const infoFields =
    client.kind === "company" ? companyFields : individualFields;

  const statCards = [
    { label: "Total Sales", value: client.totalSales },
    {
      label: "Last Booking",
      value: client.statsLastBooking ?? client.lastBooking,
    },
    { label: "Bookings Completed", value: String(client.bookingsCompleted) },
    { label: "Average Booking value", value: client.averageBookingValue },
  ];

  return (
    <Stack spacing={2} sx={{ px: 2.5, py: 2 }}>
      <Paper elevation={0} sx={sectionCardSx}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            src={client.photoSrc}
            sx={{
              width: 44,
              height: 44,
              bgcolor: alpha(m.navy, 0.08),
              color: alpha(m.navy, 0.78),
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {client.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: alpha(m.navy, 0.9),
                  lineHeight: 1.2,
                }}
              >
                {client.name}
              </Typography>
              {blocked ? (
                <Chip
                  label="Blocked"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                    color: theme.palette.error.main,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              ) : null}
              {client.hasNoShow ? (
                <Chip
                  label="No show"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: m.statusNoShowBg,
                    color: m.statusNoShowFg,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              ) : null}
              {client.kind === "company" ? (
                <Chip
                  label="CC"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: alpha(m.teal, 0.12),
                    color: m.teal,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              ) : (
                <Chip
                  label="IC"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: alpha(m.teal, 0.12),
                    color: m.teal,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              )}
              {!isMollure ? (
                <Chip
                  label="Non-Mollure"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: alpha(m.teal, 0.14),
                    color: m.teal,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              ) : (
                <Chip
                  label="Mollure"
                  size="small"
                  sx={{
                    height: 16,
                    borderRadius: "999px",
                    bgcolor: alpha(m.teal, 0.14),
                    color: m.teal,
                    fontWeight: 700,
                    "& .MuiChip-label": {
                      fontSize: 9,
                      px: 0.65,
                      py: 0,
                      lineHeight: 1.2,
                    },
                  }}
                />
              )}
            </Stack>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: alpha(m.navy, 0.52),
                mt: 0.35,
              }}
            >
              {client.email}
            </Typography>
          </Box>
          {onEdit ? (
            <IconButton
              size="small"
              aria-label="Edit client"
              onClick={onEdit}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                color: alpha(m.navy, 0.45),
                flexShrink: 0,
                "&:hover": { bgcolor: alpha(m.navy, 0.06) },
              }}
            >
              <EditRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : null}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={sectionCardSx}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <PersonRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
          <Typography
            sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.88) }}
          >
            Client Information
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            color: alpha(m.navy, 0.48),
            mb: 1.5,
          }}
        >
          Added to the client list on {client.addedOn}
        </Typography>
        <Grid container spacing={2}>
          {infoFields.map((field) => (
            <InfoFieldCell
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={sectionCardSx}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <ShowChartRoundedIcon sx={{ fontSize: 20, color: m.teal }} />
          <Typography
            sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.88) }}
          >
            Platform Statistics
          </Typography>
        </Stack>

        <Grid container spacing={1.25} sx={{ mb: 2 }}>
          {statCards.map((card) => (
            <Grid item xs={6} key={card.label}>
              <Box
                sx={{
                  p: 1.35,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: alpha(m.navy, 0.02),
                  minHeight: 56,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.5),
                  }}
                >
                  {card.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: m.teal,
                    mt: 0.45,
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1.25}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                height: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.88),
                  mb: 1.1,
                }}
              >
                Recent Services
              </Typography>
              <Stack spacing={0.9}>
                {client.recentServices.map((service) => (
                  <Stack
                    key={service.name}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.55),
                      }}
                    >
                      {service.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.88),
                        flexShrink: 0,
                      }}
                    >
                      {service.price}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                height: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.88),
                  mb: 1.1,
                }}
              >
                Booking History
              </Typography>
              <Stack spacing={0.9}>
                {client.bookingHistory.map((entry, index) => (
                  <Stack
                    key={`${entry.period}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.55),
                      }}
                    >
                      {entry.period}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.88),
                        flexShrink: 0,
                      }}
                    >
                      {entry.bookings} Booking
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box
        ref={technicalNoteSectionRef}
        sx={
          highlightTechnicalNote
            ? {
                borderRadius: "10px",
                outline: `2px solid ${alpha(m.teal, 0.35)}`,
                outlineOffset: 4,
                transition: "outline-color 0.2s ease",
              }
            : undefined
        }
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 0.75 }}
        >
          <Typography
            sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55) }}
          >
            Technical Note (Optional)
          </Typography>
          {noteDirty ? (
            <AppButton
              tone="primary"
              size="small"
              onClick={handleSaveTechnicalNote}
              sx={{
                minWidth: 0,
                px: 1.25,
                py: 0.35,
                fontSize: 11.5,
                borderRadius: "8px",
              }}
            >
              Save note
            </AppButton>
          ) : null}
        </Stack>
        <MollureFormField
          multiline
          minRows={4}
          placeholder="Any Technical note about Client"
          value={technicalNoteDraft}
          onChange={(e) => setTechnicalNoteDraft(e.target.value)}
          onBlur={() => {
            const trimmed = technicalNoteDraft.trim();
            const saved = savedNote.trim();
            if (trimmed !== saved) onSaveTechnicalNote(technicalNoteDraft);
          }}
          disabled={blocked}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        />
      </Box>
    </Stack>
  );
}
