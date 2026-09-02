"use client";

import AppButton from "../../../../components/common/AppButton";
import { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { GENDER_MENU_OPTIONS } from "../../../../lib/gender-options";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import AppDatePicker, {
  normalizeDateToIso,
} from "../../../../components/common/AppDatePicker";
import MollureFormField from "../../../../components/common/MollureFormField";
import AppSearchField from "../../../../components/common/AppSearchField";
import AppModal from "../../../../components/common/AppModal";
import AppDrawer from "../../../../components/common/AppDrawer";
import MollureListToolbar from "../../../../components/common/MollureListToolbar";
import {
  AppCountryPhoneFields,
  ClientListDataCard,
  ClientListHeaderCard,
  MollureSnackbar,
} from "../../../../components/common";
import { useFixedLocationClientPage } from "./useFixedLocationClientPage";
import ClientDetailsViewPanel from "./ClientDetailsViewPanel";
import ClientListFilterDrawer from "./ClientListFilterDrawer";
import { isClientBlocked } from "./data/clientList";
import { clientTypeLabel, platformLabel } from "./data/clientListFilters";
import {
  ADD_CLIENT_MENU_OPTIONS,
  CLIENT_LIST_SORT_OPTIONS,
  CLIENT_TABLE_HEADERS,
  getClientRowMenuOptions,
  getTodayIsoDate,
  NETHERLANDS_MUNICIPALITY_OPTIONS,
  NETHERLANDS_PROVINCE_OPTIONS,
} from "./client.data";
import { Typography } from "../../../../components/ui/typography";

export default function ClientPageView() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const genderSelectProps = useMemo(
    () => ({
      displayEmpty: true as const,
      renderValue: (selected: unknown) => {
        const v = String(selected ?? "").trim();
        if (!v) {
          return (
            <Typography
              component="span"
              sx={{
                color: alpha(m.navy, 0.48),
                fontWeight: 500,
                fontSize: "0.8125rem",
              }}
            >
              Select gender
            </Typography>
          );
        }
        return v;
      },
    }),
    [m.navy],
  );

  const clientTypeSelectProps = useMemo(
    () => ({
      displayEmpty: true as const,
      renderValue: (selected: unknown) => {
        const v = String(selected ?? "").trim();
        if (!v) {
          return (
            <Typography
              component="span"
              sx={{
                color: alpha(m.navy, 0.48),
                fontWeight: 500,
                fontSize: "0.8125rem",
              }}
            >
              Select client type
            </Typography>
          );
        }
        return v;
      },
    }),
    [m.navy],
  );

  const {
    clients,
    clientsLoading,
    clientsError,
    query,
    setQuery,
    sortBy,
    setSortBy,
    activeFilters,
    filterDrawerOpen,
    setFilterDrawerOpen,
    toggleClientFilter,
    clearClientFilters,
    sortAnchor,
    setSortAnchor,
    addAnchor,
    setAddAnchor,
    rowMenu,
    setRowMenu,
    setBlockClientId,
    setDeleteClientId,
    setViewClientId,
    clientDetailsMode,
    setClientDetailsMode,
    editCompanyForm,
    setEditCompanyForm,
    editIndividualForm,
    setEditIndividualForm,
    addMollureOpen,
    setAddMollureOpen,
    addNonMollureOpen,
    setAddNonMollureOpen,
    mollureSearch,
    setMollureSearch,
    selectedMollureId,
    setSelectedMollureId,
    nonMollureClientType,
    setNonMollureClientType,
    indFirstName,
    setIndFirstName,
    indLastName,
    setIndLastName,
    indGender,
    setIndGender,
    indDob,
    setIndDob,
    indCountryCode,
    setIndCountryCode,
    indPhone,
    setIndPhone,
    indEmail,
    setIndEmail,
    indErrors,
    setIndErrors,
    nonMollureTypeError,
    setNonMollureTypeError,
    coLegalName,
    setCoLegalName,
    coCoc,
    setCoCoc,
    coVat,
    setCoVat,
    coContactFirst,
    setCoContactFirst,
    coContactLast,
    setCoContactLast,
    coGender,
    setCoGender,
    coStreet,
    setCoStreet,
    coStreetNumber,
    setCoStreetNumber,
    coPostal,
    setCoPostal,
    coProvince,
    setCoProvince,
    coMunicipality,
    setCoMunicipality,
    coCountryCode,
    setCoCountryCode,
    coPhone,
    setCoPhone,
    coEmail,
    setCoEmail,
    compErrors,
    setCompErrors,
    editPhoneErrors,
    setEditPhoneErrors,
    nonMollureTechnicalNote,
    setNonMollureTechnicalNote,
    validateCompany,
    validateIndividual,
    sortOpen,
    addOpen,
    filtered,
    viewClient,
    blockClient,
    deleteClient,
    openClientDetailsEdit,
    mollureResults,
    addMollureClient,
    addNonMollureClient,
    snackbar,
    closeSnackbar,
    openNonMollureAddDrawer,
    closeClientDetailsDrawer,
    openClientDetailsView,
    focusTechnicalNoteOnOpen,
    clearTechnicalNoteFocus,
    confirmDeleteClient,
    confirmBlockClient,
    unblockClient,
    saveClientEdits,
    saveClientTechnicalNote,
  } = useFixedLocationClientPage();

  const rowMenuClient = useMemo(
    () => (rowMenu?.id ? clients.find((c) => c.id === rowMenu.id) : undefined),
    [clients, rowMenu?.id],
  );

  const rowMenuOptions = useMemo(
    () => getClientRowMenuOptions(rowMenuClient),
    [rowMenuClient],
  );

  return (
    <>
      <MollureSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        autoHideDuration={2500}
        onClose={closeSnackbar}
      />

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Header Card */}
        <Box sx={{ px: 2.25, py: 1.75 }}>
          <ClientListHeaderCard
            title="Client List"
            subtitle="View Clients added to the list"
          />
        </Box>

        {/* Toolbar */}
        <MollureListToolbar
          searchPlaceholder="Search by name, email, or phone number"
          searchValue={query}
          onSearchChange={setQuery}
          onFilterClick={() => setFilterDrawerOpen(true)}
          activeFilterCount={activeFilters.size}
          onSortClick={(e) => setSortAnchor(e.currentTarget)}
          onAddClick={(e) => setAddAnchor(e.currentTarget)}
        />

        <ClientListFilterDrawer
          open={filterDrawerOpen}
          activeFilters={activeFilters}
          onClose={() => setFilterDrawerOpen(false)}
          onToggle={toggleClientFilter}
          onClear={clearClientFilters}
        />

        <Menu
          anchorEl={sortAnchor}
          open={sortOpen}
          onClose={() => setSortAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 240,
              p: 0.5,
            },
          }}
        >
          {CLIENT_LIST_SORT_OPTIONS.map((opt) => (
            <MenuItem
              key={opt}
              onClick={() => {
                setSortBy(opt);
                setSortAnchor(null);
              }}
              sx={{
                borderRadius: "8px",
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.75),
                my: 0.25,
              }}
            >
              {opt}
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={addAnchor}
          open={addOpen}
          onClose={() => setAddAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 190,
              p: 0.5,
            },
          }}
        >
          {ADD_CLIENT_MENU_OPTIONS.map((opt) => (
            <MenuItem
              key={opt}
              onClick={() => {
                setAddAnchor(null);
                if (opt === "Mollure Client") {
                  setAddMollureOpen(true);
                } else {
                  openNonMollureAddDrawer();
                }
              }}
              sx={{
                borderRadius: "8px",
                fontSize: 12.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.75),
                my: 0.25,
              }}
            >
              {opt}
            </MenuItem>
          ))}
        </Menu>

        {/* Table */}
        <Box sx={{ px: 2.25, pb: 2.5 }}>
          <ClientListDataCard>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: alpha(m.navy, 0.78),
                mb: 1.25,
              }}
            >
              Clients ({filtered.length}
              {filtered.length !== clients.length
                ? ` of ${clients.length}`
                : ""}
              )
            </Typography>

            {clientsLoading ? (
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: alpha(m.navy, 0.5),
                  py: 3,
                  textAlign: "center",
                }}
              >
                Loading clients…
              </Typography>
            ) : clientsError ? (
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: theme.palette.error.main,
                  py: 3,
                  textAlign: "center",
                }}
              >
                Unable to load clients. Please try again.
              </Typography>
            ) : filtered.length === 0 ? (
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: alpha(m.navy, 0.5),
                  py: 3,
                  textAlign: "center",
                }}
              >
                {clients.length === 0
                  ? "No clients yet. Confirmed bookings will appear here."
                  : "No clients match your search or filters."}
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${alpha(m.navy, 0.06)}`,
                  overflow: "hidden",
                }}
              >
                <Table
                  size="small"
                  sx={{
                    borderCollapse: "collapse",
                    "& td": {
                      borderBottom: `1px solid ${alpha(m.navy, 0.035)}`,
                      borderRight: `1px solid ${alpha(m.navy, 0.04)}`,
                    },
                    "& tr > td:last-of-type": {
                      borderRight: "none",
                    },
                    "& tbody tr:hover": {
                      backgroundColor: alpha(m.navy, 0.025),
                    },
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(m.navy, 0.02) }}>
                      {CLIENT_TABLE_HEADERS.map((h, colIdx, arr) => (
                        <TableCell
                          key={h || "actions"}
                          sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: alpha(m.navy, 0.7),
                            py: 1.25,
                            letterSpacing: "0.02em",
                            borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                            borderRight:
                              colIdx < arr.length - 1
                                ? `1px solid ${alpha(m.navy, 0.04)}`
                                : "none",
                          }}
                          align={h === "" ? "right" : "left"}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((c) => {
                      const blocked = isClientBlocked(c);
                      const typeLabel = clientTypeLabel(c);
                      const platform = platformLabel(c);
                      return (
                        <TableRow
                          key={c.id}
                          hover={!blocked}
                          sx={
                            blocked
                              ? {
                                  bgcolor: alpha(
                                    theme.palette.error.main,
                                    0.05,
                                  ),
                                  boxShadow: `inset 4px 0 0 ${theme.palette.error.main}`,
                                  "& td": {
                                    borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
                                  },
                                }
                              : undefined
                          }
                        >
                          <TableCell sx={{ py: 1.35 }}>
                            <Stack
                              direction="row"
                              spacing={1.1}
                              alignItems="center"
                            >
                              <Avatar
                                src={c.photoSrc}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: alpha(m.navy, 0.08),
                                  color: alpha(m.navy, 0.78),
                                  fontWeight: 800,
                                  fontSize: 13,
                                }}
                              >
                                {c.name
                                  .split(" ")
                                  .map((p: string) => p[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack
                                  direction="row"
                                  spacing={0.75}
                                  alignItems="center"
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 900,
                                      fontSize: 13,
                                      color: blocked
                                        ? alpha(theme.palette.error.main, 0.88)
                                        : alpha(m.navy, 0.88),
                                      textDecoration: blocked
                                        ? "line-through"
                                        : "none",
                                    }}
                                  >
                                    {c.name}
                                  </Typography>
                                  {blocked ? (
                                    <Chip
                                      label="Blocked"
                                      size="small"
                                      sx={{
                                        height: 16,
                                        borderRadius: "999px",
                                        bgcolor: alpha(
                                          theme.palette.error.main,
                                          0.12,
                                        ),
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
                                  {c.hasNoShow ? (
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
                                  {c.technicalNote?.trim() ? (
                                    <Tooltip title="View technical note" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openClientDetailsView(c.id, {
                                            focusTechnicalNote: true,
                                          });
                                        }}
                                        sx={{
                                          width: 22,
                                          height: 22,
                                          p: 0,
                                          color: c.tags.includes("Mollure")
                                            ? theme.palette.primary.main
                                            : alpha(m.teal, 0.95),
                                          "&:hover": {
                                            bgcolor: alpha(
                                              c.tags.includes("Mollure")
                                                ? theme.palette.primary.main
                                                : m.teal,
                                              0.1,
                                            ),
                                          },
                                        }}
                                        aria-label="View technical note"
                                      >
                                        <StickyNote2OutlinedIcon
                                          sx={{ fontSize: 16 }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                  ) : null}
                                </Stack>
                                <Typography
                                  sx={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    color: alpha(m.navy, 0.5),
                                  }}
                                >
                                  {c.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.72),
                            }}
                          >
                            <Chip
                              label={typeLabel}
                              size="small"
                              sx={{
                                height: 16,
                                borderRadius: "6px",
                                fontWeight: 700,
                                bgcolor: alpha(m.teal, 0.12),
                                color: m.teal,
                                "& .MuiChip-label": {
                                  fontSize: 9,
                                  px: 0.65,
                                  py: 0,
                                  lineHeight: 1.2,
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.72),
                            }}
                          >
                            {platform}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            {c.addedOn}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.75),
                            }}
                          >
                            {c.phone}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: alpha(m.navy, 0.78),
                            }}
                          >
                            {c.totalSales}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: alpha(m.navy, 0.75),
                            }}
                          >
                            {c.lastBooking}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) =>
                                setRowMenu({
                                  id: c.id,
                                  anchor: e.currentTarget,
                                })
                              }
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "8px",
                                color: alpha(m.navy, 0.55),
                              }}
                            >
                              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </ClientListDataCard>
        </Box>

        <Menu
          anchorEl={rowMenu?.anchor ?? null}
          open={Boolean(rowMenu)}
          onClose={() => setRowMenu(null)}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 140,
              p: 0.5,
            },
          }}
        >
          {rowMenuOptions.map((opt) => (
            <MenuItem
              key={opt}
              onClick={() => {
                const id = rowMenu?.id;
                setRowMenu(null);
                if (!id) return;
                if (opt === "View") {
                  setClientDetailsMode("view");
                  setViewClientId(id);
                }
                if (opt === "Edit technical note") {
                  openClientDetailsView(id, { focusTechnicalNote: true });
                }
                if (opt === "Block") {
                  setBlockClientId(id);
                }
                if (opt === "Unblock") {
                  unblockClient(id);
                }
                if (opt === "Delete") {
                  setDeleteClientId(id);
                }
              }}
              sx={{
                borderRadius: "8px",
                fontSize: 12.5,
                fontWeight: 700,
                color:
                  opt === "Delete"
                    ? theme.palette.error.main
                    : alpha(m.navy, 0.75),
                my: 0.25,
              }}
            >
              {opt}
            </MenuItem>
          ))}
        </Menu>
      </Paper>

      {/* Block client modal */}
      <AppModal
        open={Boolean(blockClient)}
        onClose={() => setBlockClientId(null)}
        fullWidth
        maxWidth="xs"
        title="Block Client"
        contentMinHeight={250}
        headerTone="danger"
        footer={
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ px: 2.5, py: 2 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setBlockClientId(null)}
              sx={{
                height: 40,
                minWidth: 100,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="danger"
              onClick={confirmBlockClient}
              sx={{
                height: 40,
                px: 3,
                minWidth: 100,
              }}
            >
              Block
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <Typography
            sx={{
              fontWeight: 900,
              color: alpha(m.navy, 0.8),
              fontSize: 15,
              lineHeight: 1.25,
            }}
          >
            Blocked Clients can&apos;t book
            <br />
            appointment or message you
          </Typography>
          {blockClient && (
            <Typography
              sx={{
                mt: 1.25,
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.48),
              }}
            >
              {blockClient.name}
            </Typography>
          )}
        </Box>
      </AppModal>

      {/* Delete client modal */}
      <AppModal
        open={Boolean(deleteClient)}
        onClose={() => setDeleteClientId(null)}
        fullWidth
        maxWidth="xs"
        title="Delete Client"
        contentMinHeight={260}
        headerTone="danger"
        footer={
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ px: 2.5, py: 2 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setDeleteClientId(null)}
              sx={{
                height: 40,
                minWidth: 100,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="danger"
              onClick={confirmDeleteClient}
              sx={{
                height: 40,
                px: 3,
                minWidth: 100,
              }}
            >
              Delete
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "14px",
              mx: "auto",
              mb: 1.25,
              bgcolor: alpha("#E53935", 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 26, color: "#E53935" }} />
          </Box>
          <Typography
            sx={{
              fontWeight: 900,
              color: alpha(m.navy, 0.8),
              fontSize: 15,
              lineHeight: 1.25,
            }}
          >
            Deleting this client will
            <br />
            permanently remove their
            <br />
            booking history and analytics.
          </Typography>
          {deleteClient && (
            <Typography
              sx={{
                mt: 1.25,
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.48),
              }}
            >
              {deleteClient.name}
            </Typography>
          )}
        </Box>
      </AppModal>

      {/* Client details (View) */}
      <AppDrawer
        anchor="right"
        open={Boolean(viewClient)}
        onClose={closeClientDetailsDrawer}
        title={
          clientDetailsMode === "edit"
            ? "Edit Client Details"
            : "Client Details"
        }
        contentSx={{
          bgcolor: alpha(m.navy, 0.03),
          p: 0,
        }}
        onBack={
          clientDetailsMode === "edit"
            ? () => setClientDetailsMode("view")
            : undefined
        }
        footer={
          clientDetailsMode === "edit" ? (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ px: 2.5, py: 2 }}
            >
              <AppButton
                tone="secondary"
                onClick={() => setClientDetailsMode("view")}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                disableElevation
                onClick={saveClientEdits}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "mollure.tealDark" },
                  height: 36,
                  px: 3,
                }}
              >
                Update
              </AppButton>
            </Stack>
          ) : null
        }
      >
        {viewClient ? (
          <>
            {clientDetailsMode === "edit" && viewClient.kind === "company" ? (
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack spacing={1.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: alpha(m.navy, 0.04),
                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        src={viewClient.photoSrc}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: alpha(m.navy, 0.08),
                          color: alpha(m.navy, 0.78),
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        {viewClient.name
                          .split(" ")
                          .map((p: string) => p[0])
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
                              fontWeight: 900,
                              fontSize: 13.5,
                              color: alpha(m.navy, 0.88),
                            }}
                          >
                            {viewClient.name}
                          </Typography>
                          {viewClient.tags.includes("CC") && (
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: "999px",
                                bgcolor: alpha(m.teal, 0.2),
                                color: m.teal,
                                fontSize: 10,
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              CC
                            </Box>
                          )}
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.5),
                            mt: 0.25,
                          }}
                        >
                          {viewClient.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Stack spacing={1.25}>
                    <MollureFormField
                      placeholder="Legal Name"
                      value={editCompanyForm.legalName}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          legalName: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="COC"
                      value={editCompanyForm.coc}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          coc: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="VAT"
                      value={editCompanyForm.vat}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          vat: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Contact Person's First Name"
                      value={editCompanyForm.contactFirst}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          contactFirst: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Contact Person's Last Name"
                      value={editCompanyForm.contactLast}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          contactLast: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      select
                      label="Gender"
                      value={editCompanyForm.gender}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          gender: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      SelectProps={genderSelectProps}
                    >
                      <MenuItem value="">
                        <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                          Select gender
                        </Typography>
                      </MenuItem>
                      {GENDER_MENU_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </MollureFormField>

                    <AppCountryPhoneFields
                      countryCode={editCompanyForm.countryCode}
                      phone={editCompanyForm.phone}
                      onCountryCodeChange={(dialCode) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          countryCode: dialCode,
                        }))
                      }
                      onPhoneChange={(phone) =>
                        setEditCompanyForm((p) => ({ ...p, phone }))
                      }
                      countryCodeError={editPhoneErrors.countryCode}
                      phoneError={editPhoneErrors.phone}
                      onClearErrors={() => setEditPhoneErrors({})}
                      phonePlaceholder="+316xxxxxxxxx"
                    />

                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.62),
                        pt: 0.5,
                      }}
                    >
                      Business Address
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={8}>
                        <MollureFormField
                          placeholder="Street"
                          value={editCompanyForm.street}
                          onChange={(e) =>
                            setEditCompanyForm((p) => ({
                              ...p,
                              street: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <MollureFormField
                          placeholder="Number"
                          value={editCompanyForm.streetNumber}
                          onChange={(e) =>
                            setEditCompanyForm((p) => ({
                              ...p,
                              streetNumber: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <MollureFormField
                          placeholder="Postal Code"
                          value={editCompanyForm.postal}
                          onChange={(e) =>
                            setEditCompanyForm((p) => ({
                              ...p,
                              postal: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <MollureFormField
                          select
                          value={editCompanyForm.province || "Province"}
                          onChange={(e) =>
                            setEditCompanyForm((p) => ({
                              ...p,
                              province: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                          }}
                        >
                          {NETHERLANDS_PROVINCE_OPTIONS.map((o) => (
                            <MenuItem key={o} value={o === "Province" ? "" : o}>
                              {o}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                      </Grid>
                      <Grid item xs={12}>
                        <MollureFormField
                          select
                          value={editCompanyForm.municipality || "Municipality"}
                          onChange={(e) =>
                            setEditCompanyForm((p) => ({
                              ...p,
                              municipality: e.target.value,
                            }))
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                          }}
                        >
                          {NETHERLANDS_MUNICIPALITY_OPTIONS.map((o) => (
                            <MenuItem
                              key={o}
                              value={o === "Municipality" ? "" : o}
                            >
                              {o}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                      </Grid>
                    </Grid>

                    <MollureFormField
                      placeholder="Email Address"
                      value={editCompanyForm.email}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />

                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.86),
                        pt: 0.5,
                      }}
                    >
                      Technical Note (Optional)
                    </Typography>
                    <MollureFormField
                      multiline
                      minRows={4}
                      placeholder="Any Technical note about Client"
                      value={editCompanyForm.technicalNote}
                      onChange={(e) =>
                        setEditCompanyForm((p) => ({
                          ...p,
                          technicalNote: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Stack>
                </Stack>
              </Box>
            ) : clientDetailsMode === "edit" &&
              viewClient.kind === "individual" ? (
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack spacing={1.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: alpha(m.navy, 0.04),
                      border: `1px solid ${alpha(m.navy, 0.06)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        src={viewClient.photoSrc}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: alpha(m.navy, 0.08),
                          color: alpha(m.navy, 0.78),
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        {viewClient.name
                          .split(" ")
                          .map((p: string) => p[0])
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
                              fontWeight: 900,
                              fontSize: 13.5,
                              color: alpha(m.navy, 0.88),
                            }}
                          >
                            {viewClient.name}
                          </Typography>
                          {viewClient.tags.includes("CC") && (
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: "999px",
                                bgcolor: alpha(m.teal, 0.2),
                                color: m.teal,
                                fontSize: 10,
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              CC
                            </Box>
                          )}
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: alpha(m.navy, 0.5),
                            mt: 0.25,
                          }}
                        >
                          {viewClient.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Stack spacing={1.25}>
                    <MollureFormField
                      placeholder="First Name"
                      value={editIndividualForm.firstName}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          firstName: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Last Name"
                      value={editIndividualForm.lastName}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          lastName: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      select
                      label="Gender"
                      value={editIndividualForm.gender}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          gender: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      SelectProps={genderSelectProps}
                    >
                      <MenuItem value="">
                        <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                          Select gender
                        </Typography>
                      </MenuItem>
                      {GENDER_MENU_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </MollureFormField>
                    <Box sx={{ pt: 0.25 }}>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.62),
                          mb: 0.75,
                        }}
                      >
                        Date of Birth
                      </Typography>
                      <AppDatePicker
                        value={normalizeDateToIso(editIndividualForm.dob)}
                        onChange={(iso) =>
                          setEditIndividualForm((p) => ({ ...p, dob: iso }))
                        }
                        max={getTodayIsoDate()}
                        fullWidth
                      />
                    </Box>
                    <AppCountryPhoneFields
                      countryCode={editIndividualForm.countryCode}
                      phone={editIndividualForm.phone}
                      onCountryCodeChange={(dialCode) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          countryCode: dialCode,
                        }))
                      }
                      onPhoneChange={(phone) =>
                        setEditIndividualForm((p) => ({ ...p, phone }))
                      }
                      countryCodeError={editPhoneErrors.countryCode}
                      phoneError={editPhoneErrors.phone}
                      onClearErrors={() => setEditPhoneErrors({})}
                      phonePlaceholder="+316xxxxxxxx"
                    />
                    <MollureFormField
                      placeholder="Residential Address"
                      value={editIndividualForm.residentialAddress}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          residentialAddress: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Email Address"
                      value={editIndividualForm.email}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.86),
                        pt: 0.5,
                      }}
                    >
                      Technical Note (Optional)
                    </Typography>
                    <MollureFormField
                      multiline
                      minRows={4}
                      placeholder="Any Technical note about Client"
                      value={editIndividualForm.technicalNote}
                      onChange={(e) =>
                        setEditIndividualForm((p) => ({
                          ...p,
                          technicalNote: e.target.value,
                        }))
                      }
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <ClientDetailsViewPanel
                client={viewClient}
                onEdit={
                  viewClient.tags.includes("Mollure")
                    ? undefined
                    : openClientDetailsEdit
                }
                onSaveTechnicalNote={saveClientTechnicalNote}
                focusTechnicalNote={focusTechnicalNoteOnOpen}
                onTechnicalNoteFocused={clearTechnicalNoteFocus}
              />
            )}
          </>
        ) : null}
      </AppDrawer>

      {/* Add Mollure Client Modal */}
      <AppModal
        open={addMollureOpen}
        onClose={() => setAddMollureOpen(false)}
        fullWidth
        maxWidth="sm"
        title="Add Mollure Client"
        contentMinHeight={360}
        footer={
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 2 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddMollureOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              disableElevation
              disabled={!selectedMollureId}
              onClick={addMollureClient}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 36,
                px: 2.25,
              }}
            >
              Add to Client List
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Box>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: alpha(m.navy, 0.55),
                mb: 0.75,
              }}
            >
              Search on Mollure by email
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: alpha(m.navy, 0.45),
                mb: 1,
              }}
            >
              Only clients with a confirmed or completed booking with you can be
              added.
            </Typography>
            <AppSearchField
              fullWidth
              placeholder="Search by email"
              value={mollureSearch}
              onChange={(e) => setMollureSearch(e.target.value)}
              onClear={() => setMollureSearch("")}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Box>

          <Box
            sx={{
              mt: 1.5,
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.1)}`,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            {mollureResults.length === 0 ? (
              <Box sx={{ px: 1.6, py: 2.5, textAlign: "center" }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.5),
                  }}
                >
                  No eligible Mollure clients found. Clients need a confirmed or
                  completed booking first.
                </Typography>
              </Box>
            ) : (
              mollureResults.slice(0, 5).map((r, idx) => (
                <Box
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMollureId(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedMollureId(r.id);
                  }}
                  sx={{
                    px: 1.6,
                    py: 1.15,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.1,
                    bgcolor:
                      selectedMollureId === r.id
                        ? alpha(theme.palette.primary.main, 0.06)
                        : "#fff",
                    "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                    ...(idx > 0
                      ? { borderTop: `1px solid ${alpha(m.navy, 0.08)}` }
                      : null),
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: alpha(m.navy, 0.08),
                      color: alpha(m.navy, 0.78),
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {r.name
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 13.5,
                          color: alpha(m.navy, 0.86),
                          lineHeight: 1.2,
                        }}
                      >
                        {r.name}
                      </Typography>
                      <Chip
                        label="Mollure"
                        size="small"
                        sx={{
                          height: 16,
                          borderRadius: "999px",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          "& .MuiChip-label": {
                            fontSize: 9,
                            px: 0.65,
                            py: 0,
                            lineHeight: 1.2,
                          },
                        }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: alpha(m.navy, 0.5),
                      }}
                    >
                      {r.email}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </AppModal>

      {/* Add Non-Mollure Client Drawer */}
      <AppDrawer
        anchor="right"
        open={addNonMollureOpen}
        onClose={() => setAddNonMollureOpen(false)}
        title="Add Non-Mollure Client"
        footer={
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 2 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddNonMollureOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              disableElevation
              onClick={() => {
                addNonMollureClient();
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 36,
                px: 3,
              }}
            >
              Save
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.62),
                  mb: 0.75,
                }}
              >
                Client Type
              </Typography>
              <MollureFormField
                select
                value={nonMollureClientType}
                onChange={(e) => {
                  const raw = e.target.value;
                  const nextType = raw as
                    "" | "Individual Client" | "Company Client";
                  setNonMollureClientType(nextType);
                  setNonMollureTypeError("");
                  setIndErrors({});
                  setCompErrors({});
                }}
                error={Boolean(nonMollureTypeError)}
                helperText={nonMollureTypeError}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                SelectProps={clientTypeSelectProps}
              >
                <MenuItem value="">
                  <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                    Select client type
                  </Typography>
                </MenuItem>
                <MenuItem value="Individual Client">Individual Client</MenuItem>
                <MenuItem value="Company Client">Company Client</MenuItem>
              </MollureFormField>
            </Box>

            {nonMollureClientType === "Individual Client" && (
              <Stack spacing={1.25}>
                <MollureFormField
                  placeholder="First Name"
                  value={indFirstName}
                  onChange={(e) => {
                    setIndFirstName(e.target.value);
                    setIndErrors((p) => ({ ...p, firstName: undefined }));
                  }}
                  error={Boolean(indErrors.firstName)}
                  helperText={indErrors.firstName}
                />
                <MollureFormField
                  placeholder="Last Name"
                  value={indLastName}
                  onChange={(e) => {
                    setIndLastName(e.target.value);
                    setIndErrors((p) => ({ ...p, lastName: undefined }));
                  }}
                  error={Boolean(indErrors.lastName)}
                  helperText={indErrors.lastName}
                />

                <MollureFormField
                  select
                  label="Gender"
                  value={indGender}
                  onChange={(e) => {
                    setIndGender(e.target.value);
                    setIndErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  error={Boolean(indErrors.gender)}
                  helperText={indErrors.gender}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  SelectProps={genderSelectProps}
                >
                  <MenuItem value="">
                    <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                      Select gender
                    </Typography>
                  </MenuItem>
                  {GENDER_MENU_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureFormField>

                <Box sx={{ pt: 0.25 }}>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: alpha(m.navy, 0.62),
                      mb: 0.75,
                    }}
                  >
                    Date of Birth
                  </Typography>
                  <AppDatePicker
                    value={indDob}
                    onChange={(iso) => {
                      setIndDob(iso);
                      setIndErrors((p) => ({ ...p, dob: undefined }));
                    }}
                    max={getTodayIsoDate()}
                    fullWidth
                  />
                </Box>

                <AppCountryPhoneFields
                  countryCode={indCountryCode}
                  phone={indPhone}
                  onCountryCodeChange={setIndCountryCode}
                  onPhoneChange={setIndPhone}
                  countryCodeError={indErrors.countryCode}
                  phoneError={indErrors.phone}
                  onClearErrors={() =>
                    setIndErrors((p) => ({
                      ...p,
                      countryCode: undefined,
                      phone: undefined,
                    }))
                  }
                  phonePlaceholder="+316xxxxxxxx"
                />

                <MollureFormField
                  placeholder="Email Address"
                  value={indEmail}
                  onChange={(e) => {
                    setIndEmail(e.target.value);
                    setIndErrors((p) => ({ ...p, email: undefined }));
                  }}
                  error={Boolean(indErrors.email)}
                  helperText={indErrors.email}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                />
              </Stack>
            )}

            {nonMollureClientType === "Company Client" && (
              <Stack spacing={1.25}>
                <MollureFormField
                  placeholder="Legal Name"
                  value={coLegalName}
                  onChange={(e) => {
                    setCoLegalName(e.target.value);
                    setCompErrors((p) => ({ ...p, legalName: undefined }));
                  }}
                  error={Boolean(compErrors.legalName)}
                  helperText={compErrors.legalName}
                />
                <MollureFormField
                  placeholder="COC"
                  value={coCoc}
                  onChange={(e) => {
                    setCoCoc(e.target.value);
                    setCompErrors((p) => ({ ...p, coc: undefined }));
                  }}
                  error={Boolean(compErrors.coc)}
                  helperText={compErrors.coc}
                />
                <MollureFormField
                  placeholder="VAT"
                  value={coVat}
                  onChange={(e) => {
                    setCoVat(e.target.value);
                    setCompErrors((p) => ({ ...p, vat: undefined }));
                  }}
                  error={Boolean(compErrors.vat)}
                  helperText={compErrors.vat}
                />
                <MollureFormField
                  placeholder="Contact Person's First Name"
                  value={coContactFirst}
                  onChange={(e) => {
                    setCoContactFirst(e.target.value);
                    setCompErrors((p) => ({ ...p, contactFirst: undefined }));
                  }}
                  error={Boolean(compErrors.contactFirst)}
                  helperText={compErrors.contactFirst}
                />
                <MollureFormField
                  placeholder="Contact Person's Last Name"
                  value={coContactLast}
                  onChange={(e) => {
                    setCoContactLast(e.target.value);
                    setCompErrors((p) => ({ ...p, contactLast: undefined }));
                  }}
                  error={Boolean(compErrors.contactLast)}
                  helperText={compErrors.contactLast}
                />
                <MollureFormField
                  select
                  label="Gender"
                  value={coGender}
                  onChange={(e) => {
                    setCoGender(e.target.value);
                    setCompErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  error={Boolean(compErrors.gender)}
                  helperText={compErrors.gender}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  SelectProps={genderSelectProps}
                >
                  <MenuItem value="">
                    <Typography sx={{ color: alpha(m.navy, 0.5) }}>
                      Select gender
                    </Typography>
                  </MenuItem>
                  {GENDER_MENU_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MollureFormField>

                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.62),
                    pt: 0.5,
                  }}
                >
                  Business Address
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={8}>
                    <MollureFormField
                      placeholder="Street"
                      value={coStreet}
                      onChange={(e) => {
                        setCoStreet(e.target.value);
                        setCompErrors((p) => ({ ...p, street: undefined }));
                      }}
                      error={Boolean(compErrors.street)}
                      helperText={compErrors.street}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MollureFormField
                      placeholder="Number"
                      value={coStreetNumber}
                      onChange={(e) => {
                        setCoStreetNumber(e.target.value);
                        setCompErrors((p) => ({
                          ...p,
                          streetNumber: undefined,
                        }));
                      }}
                      error={Boolean(compErrors.streetNumber)}
                      helperText={compErrors.streetNumber}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      placeholder="Postal Code"
                      value={coPostal}
                      onChange={(e) => {
                        setCoPostal(e.target.value);
                        setCompErrors((p) => ({ ...p, postal: undefined }));
                      }}
                      error={Boolean(compErrors.postal)}
                      helperText={compErrors.postal}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      select
                      value={coProvince || "Province"}
                      onChange={(e) => {
                        setCoProvince(e.target.value);
                        setCompErrors((p) => ({ ...p, province: undefined }));
                      }}
                      error={Boolean(compErrors.province)}
                      helperText={compErrors.province}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    >
                      {NETHERLANDS_PROVINCE_OPTIONS.map((o) => (
                        <MenuItem key={o} value={o === "Province" ? "" : o}>
                          {o}
                        </MenuItem>
                      ))}
                    </MollureFormField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MollureFormField
                      select
                      value={coMunicipality || "Municipality"}
                      onChange={(e) => {
                        setCoMunicipality(e.target.value);
                        setCompErrors((p) => ({
                          ...p,
                          municipality: undefined,
                        }));
                      }}
                      error={Boolean(compErrors.municipality)}
                      helperText={compErrors.municipality}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    >
                      {NETHERLANDS_MUNICIPALITY_OPTIONS.map((o) => (
                        <MenuItem key={o} value={o === "Municipality" ? "" : o}>
                          {o}
                        </MenuItem>
                      ))}
                    </MollureFormField>
                  </Grid>
                </Grid>

                <AppCountryPhoneFields
                  countryCode={coCountryCode}
                  phone={coPhone}
                  onCountryCodeChange={setCoCountryCode}
                  onPhoneChange={setCoPhone}
                  countryCodeError={compErrors.countryCode}
                  phoneError={compErrors.phone}
                  onClearErrors={() =>
                    setCompErrors((p) => ({
                      ...p,
                      countryCode: undefined,
                      phone: undefined,
                    }))
                  }
                  phonePlaceholder="+316xxxxxxxxx"
                />

                <MollureFormField
                  placeholder="Email Address"
                  value={coEmail}
                  onChange={(e) => {
                    setCoEmail(e.target.value);
                    setCompErrors((p) => ({ ...p, email: undefined }));
                  }}
                  error={Boolean(compErrors.email)}
                  helperText={compErrors.email}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                />
              </Stack>
            )}

            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 800,
                color: alpha(m.navy, 0.86),
                pt: 0.5,
              }}
            >
              Technical Note (Optional)
            </Typography>
            <MollureFormField
              multiline
              minRows={3}
              placeholder="Any technical note about client"
              value={nonMollureTechnicalNote}
              onChange={(e) => setNonMollureTechnicalNote(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
        </Box>
      </AppDrawer>
    </>
  );
}
