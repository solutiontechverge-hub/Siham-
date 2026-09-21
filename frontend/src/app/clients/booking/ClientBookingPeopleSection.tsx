"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import type { BookingPerson } from "./booking.page.types";
import { isNotesPerson } from "./booking.page.data";

export type ClientBookingPeopleSectionProps = {
  isDesiredLocation: boolean;
  canAddFixedLocationGuest: boolean;
  isCompanyClient: boolean;
  bookingProjectEnabled: boolean;
  participantMenuAnchor: HTMLElement | null;
  setParticipantMenuAnchor: React.Dispatch<
    React.SetStateAction<HTMLElement | null>
  >;
  addParticipant: (cardName: string) => void;
  hasNotesPerson: boolean;
  canAddPlanningParticipant: boolean;
  people: BookingPerson[];
  selectedPersonId: string;
  draggingPersonId: string | null;
  setDraggingPersonId: React.Dispatch<React.SetStateAction<string | null>>;
  reorderPeople: (fromId: string, toId: string) => void;
  isPlanningPerson: (person: BookingPerson) => boolean;
  selectPlanningCard: (person: BookingPerson) => void;
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string>>;
  selectNonPlanningPerson: (personId: string) => void;
  deleteGuest: (guestId: string) => void;
  updateGuestName: (guestId: string, name: string) => void;
  getParticipantLabel: (person: BookingPerson) => string;
  personCardSubtitle: (person: BookingPerson) => string;
  minimumTimeslotNotice: string | null;
  requiresPersonAssignment: boolean;
  isNotesCardSelected: boolean;
  /** Fixed-location only: combine / book-at-same-time toggle. */
  showCombineServices?: boolean;
  combineServices?: boolean;
  setCombineServices?: (value: boolean) => void;
  servicesCount?: number;
};

export default function ClientBookingPeopleSection({
  isDesiredLocation,
  canAddFixedLocationGuest,
  isCompanyClient,
  bookingProjectEnabled,
  participantMenuAnchor,
  setParticipantMenuAnchor,
  addParticipant,
  hasNotesPerson,
  canAddPlanningParticipant,
  people,
  selectedPersonId,
  draggingPersonId,
  setDraggingPersonId,
  reorderPeople,
  isPlanningPerson,
  selectPlanningCard,
  setSelectedPersonId,
  selectNonPlanningPerson,
  deleteGuest,
  updateGuestName,
  getParticipantLabel,
  personCardSubtitle,
  minimumTimeslotNotice,
  requiresPersonAssignment,
  isNotesCardSelected,
  showCombineServices = false,
  combineServices = true,
  setCombineServices,
  servicesCount = 0,
}: ClientBookingPeopleSectionProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const renderPlanningCardSubtitle = (person: BookingPerson) => {
    if (!person.planningIsLocked) return null;
    const duration = person.planningDuration?.trim() ?? "";
    if (!duration) return null;
    return (
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 11,
          color: alpha(m.navy, 0.48),
          lineHeight: 1.2,
          mt: 0.2,
        }}
      >
        {duration}
      </Typography>
    );
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={1.5}
        sx={{
          mb: 1,
          position: "sticky",
          top: 0,
          zIndex: 2,
          py: 0.5,
          bgcolor: "#fff",
        }}
      >
        {showCombineServices && servicesCount > 1 && setCombineServices ? (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={combineServices}
                onChange={(e) => setCombineServices(e.target.checked)}
                sx={{
                  p: 0.5,
                  "&.Mui-checked": { color: m.teal },
                  color: alpha(m.navy, 0.35),
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: m.headingText,
                  lineHeight: 1.2,
                }}
              >
                Combine Services
              </Typography>
            }
            sx={{ mr: 0, ml: 0 }}
          />
        ) : null}
        {isDesiredLocation || canAddFixedLocationGuest ? (
          <Chip
            icon={
              <Box
                component="span"
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "999px",
                  bgcolor: m.addSoftBg,
                  color: m.addSoftFg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  lineHeight: 0,
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 14, display: "block" }} />
              </Box>
            }
            label={
              isDesiredLocation && isCompanyClient
                ? bookingProjectEnabled
                  ? "Add"
                  : "Guest"
                : "Guest"
            }
            variant="outlined"
            clickable={isDesiredLocation || canAddFixedLocationGuest}
            onClick={(e) => {
              if (isDesiredLocation) {
                setParticipantMenuAnchor(e.currentTarget);
                return;
              }
              if (!canAddFixedLocationGuest) return;
              addParticipant("Guest");
            }}
            sx={{
              height: 32,
              borderRadius: "10px",
              fontSize: 12,
              fontWeight: 700,
              bgcolor: m.white,
              borderColor: alpha(m.teal, 0.55),
              color: m.teal,
              "& .MuiChip-icon": {
                color: m.addSoftFg,
                ml: 0.6,
                mr: 0,
              },
              "& .MuiChip-label": {
                pl: 0.4,
                pr: 1,
              },
              "&:hover": {
                bgcolor: alpha(m.teal, 0.04),
                borderColor: m.teal,
                "& .MuiChip-icon": {
                  bgcolor: m.addSoftBgHover,
                  color: m.addSoftFg,
                },
              },
            }}
          />
        ) : null}
        {isDesiredLocation ? (
          <Menu
            anchorEl={participantMenuAnchor}
            open={Boolean(participantMenuAnchor)}
            onClose={() => setParticipantMenuAnchor(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                minWidth: 140,
                mt: 0.5,
              },
            }}
          >
            {!isCompanyClient || !bookingProjectEnabled ? (
              <MenuItem
                onClick={() => addParticipant("Guest")}
                sx={mollureLabelSx(m.navy, { fontWeight: 900 })}
              >
                Guest
              </MenuItem>
            ) : null}
            {isCompanyClient && bookingProjectEnabled ? (
              <MenuItem
                onClick={() => addParticipant("Model")}
                sx={mollureLabelSx(m.navy, { fontWeight: 900 })}
              >
                Model
              </MenuItem>
            ) : null}
            {isCompanyClient && canAddPlanningParticipant ? (
              <MenuItem
                onClick={() => addParticipant("Planning")}
                sx={mollureLabelSx(m.navy, { fontWeight: 900 })}
              >
                Planning
              </MenuItem>
            ) : null}
            {!hasNotesPerson ? (
              <MenuItem
                onClick={() => addParticipant("Notes")}
                sx={mollureLabelSx(m.navy, { fontWeight: 900 })}
              >
                Notes
              </MenuItem>
            ) : null}
          </Menu>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        {people.map((p) => {
          const active = p.id === selectedPersonId;
          return (
            <Paper
              key={p.id}
              elevation={0}
              draggable
              onDragStart={(e) => {
                setDraggingPersonId(p.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", p.id);
              }}
              onDragEnd={() => setDraggingPersonId(null)}
              onDragOver={(e) => {
                // Allow dropping.
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from =
                  e.dataTransfer.getData("text/plain") || draggingPersonId;
                if (!from) return;
                reorderPeople(from, p.id);
                setDraggingPersonId(null);
              }}
              sx={{
                flex: 1,
                borderRadius: "10px",
                border: `1.5px solid ${active ? m.teal : alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
                px: 1,
                pt: 1.05,
                pb: 0.75,
                cursor: "pointer",
                boxShadow: "none",
                position: "relative",
                minHeight: 72,
                overflow: "visible",
                ...(draggingPersonId === p.id
                  ? { opacity: 0.7 }
                  : draggingPersonId
                    ? {
                        outline: `2px dashed ${alpha(m.teal, 0.45)}`,
                        outlineOffset: "2px",
                      }
                    : null),
              }}
              onClick={() => {
                if (isPlanningPerson(p)) {
                  selectPlanningCard(p);
                } else if (isNotesPerson(p)) {
                  setSelectedPersonId(p.id);
                } else {
                  selectNonPlanningPerson(p.id);
                }
              }}
            >
              {!p.isRequester ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGuest(p.id);
                  }}
                  sx={{
                    position: "absolute",
                    right: 4,
                    top: 4,
                    zIndex: 2,
                    width: 22,
                    height: 22,
                    p: 0,
                    color: alpha(m.navy, 0.45),
                    "&:hover": {
                      bgcolor: "transparent",
                      color: alpha(m.navy, 0.72),
                    },
                  }}
                  aria-label={`Remove ${p.name}`}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              ) : null}

              <Stack
                spacing={0.55}
                sx={{
                  pt: p.isRequester ? 0 : 0.5,
                  alignItems: "center",
                }}
              >
                {p.isRequester || isNotesPerson(p) ? (
                  <Box
                    sx={{
                      border: `1px solid ${alpha(m.navy, 0.12)}`,
                      borderRadius: "8px",
                      px: 1,
                      py: 0.2,
                      maxWidth: 96,
                      minHeight: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 11,
                        color: alpha(m.navy, 0.82),
                        textAlign: "center",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 88,
                      }}
                    >
                      {p.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TextField
                      value={p.name}
                      onChange={(e) => updateGuestName(p.id, e.target.value)}
                      size="small"
                      inputProps={{
                        "aria-label": `${getParticipantLabel(p)} name`,
                        sx: {
                          py: 0.35,
                          px: 0.5,
                          fontSize: 11,
                          fontWeight: 900,
                          textAlign: "center",
                        },
                      }}
                      sx={{
                        width: "100%",
                        maxWidth: 96,
                        "& .MuiOutlinedInput-root": {
                          height: 22,
                          borderRadius: "8px",
                          bgcolor: "#fff",
                          fontSize: 11,
                          fontWeight: 900,
                        },
                      }}
                    />
                  </Box>
                )}

                {isPlanningPerson(p) ? (
                  renderPlanningCardSubtitle(p)
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      color: alpha(m.navy, 0.48),
                      mt: 0.2,
                      textAlign: "center",
                    }}
                  >
                    {personCardSubtitle(p)}
                  </Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {isDesiredLocation && minimumTimeslotNotice ? (
        <Box
          sx={{
            mt: 1.25,
            borderRadius: "10px",
            bgcolor: alpha(m.teal, 0.1),
            px: 1.25,
            py: 0.7,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
          />
          <Typography
            sx={mollureLabelSx(m.navy, {
              color: m.teal,
              lineHeight: 1.25,
            })}
          >
            {minimumTimeslotNotice}
          </Typography>
        </Box>
      ) : requiresPersonAssignment && !isNotesCardSelected ? (
        <Box
          sx={{
            mt: 1.25,
            borderRadius: "8px",
            bgcolor: alpha(m.teal, 0.1),
            px: 1.35,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: alpha(m.navy, 0.62),
              lineHeight: 1.25,
            }}
          >
            Assign Services By Selecting The Person
          </Typography>
        </Box>
      ) : null}
    </>
  );
}
