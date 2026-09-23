"use client";

import { useMemo } from "react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
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
import {
  mollureBodySx,
  mollureLabelSx,
  mollureSectionTitleSx,
  mollureTableHeaderSx,
} from "../../../../theme/mollureHierarchy";
import {
  mollureMenuItemSx,
  mollureMenuPaperSx,
} from "../../../../components/common/mollureFormSx";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import AppModal from "../../../../components/common/AppModal";
import AppDrawer from "../../../../components/common/AppDrawer";
import ModalConfirmBody from "../../../../components/common/ModalConfirmBody";
import {
  FinanceDrawerActionsFooter,
  ModalCancelApplyFooter,
} from "../../../../components/common/FinanceDrawerFooter";
import MollureListToolbar from "../../../../components/common/MollureListToolbar";
import {
  ClientListDataCard,
  ClientListHeaderCard,
  MollureSnackbar,
} from "../../../../components/common";
import { useFixedLocationClientPage } from "./useFixedLocationClientPage";
import ClientDetailsViewPanel from "./ClientDetailsViewPanel";
import ClientListFilterDrawer from "./ClientListFilterDrawer";
import ClientDetailsEditPanel from "./ClientDetailsEditPanel";
import ClientAddMollureModal from "./ClientAddMollureModal";
import ClientAddNonMollureDrawer from "./ClientAddNonMollureDrawer";
import { isClientBlocked } from "./data/clientList";
import { isMollureClient } from "./data/clientListFilters";
import ClientPlatformTag from "../../../../components/common/ClientPlatformTag";
import {
  ADD_CLIENT_MENU_OPTIONS,
  CLIENT_LIST_SORT_OPTIONS,
  CLIENT_TABLE_HEADERS,
  getClientRowMenuOptions,
} from "./client.data";
import { Typography } from "../../../../components/ui/typography";

export default function ClientPageView() {
  const theme = useTheme();
  const m = theme.palette.mollure;

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
            sx: mollureMenuPaperSx(m.navy, { minWidth: 240 }),
          }}
        >
          {CLIENT_LIST_SORT_OPTIONS.map((opt) => (
            <MenuItem
              key={opt}
              onClick={() => {
                setSortBy(opt);
                setSortAnchor(null);
              }}
              sx={mollureMenuItemSx(m.navy)}
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
            sx: mollureMenuPaperSx(m.navy, { minWidth: 190 }),
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
              sx={mollureMenuItemSx(m.navy)}
            >
              {opt}
            </MenuItem>
          ))}
        </Menu>

        {/* Table */}
        <Box sx={{ px: 2.25, pb: 2.5 }}>
          <ClientListDataCard>
            <Typography
              sx={mollureLabelSx(m.navy, {
                fontSize: 13,
                mb: 1.25,
              })}
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
                            ...mollureTableHeaderSx(m.navy),
                            py: 1.25,
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
                                  <ClientPlatformTag
                                    isMollure={isMollureClient(c)}
                                    clientKind={
                                      c.kind === "company" ? "company" : null
                                    }
                                    companyLabel="B.C. client"
                                  />
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
                              fontWeight: 700,
                              color: alpha(m.navy, 0.62),
                            }}
                          >
                            {c.addedOn}
                          </TableCell>
                          <TableCell sx={mollureBodySx(m.navy)}>
                            {c.phone}
                          </TableCell>
                          <TableCell sx={mollureLabelSx(m.navy)}>
                            {c.totalSales}
                          </TableCell>
                          <TableCell sx={mollureBodySx(m.navy)}>
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
            sx: mollureMenuPaperSx(m.navy, { minWidth: 140 }),
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
              sx={mollureMenuItemSx(
                m.navy,
                opt === "Delete" ? { color: theme.palette.error.main } : undefined,
              )}
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
          <ModalCancelApplyFooter
            onCancel={() => setBlockClientId(null)}
            onPrimary={confirmBlockClient}
            primaryLabel="Block"
            primaryTone="danger"
            justifyContent="center"
            buttonSx={{ height: 40, minWidth: 100 }}
            spacing={1}
          />
        }
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <Typography sx={mollureSectionTitleSx(m.navy, { lineHeight: 1.25 })}>
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
          <ModalCancelApplyFooter
            onCancel={() => setDeleteClientId(null)}
            onPrimary={confirmDeleteClient}
            primaryLabel="Delete"
            primaryTone="danger"
            justifyContent="center"
            buttonSx={{ height: 40, minWidth: 100 }}
            spacing={1}
          />
        }
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <ModalConfirmBody
            showWarning
            iconFrame="rounded"
            iconFrameSize={46}
            iconFrameBg={alpha("#E53935", 0.1)}
            iconColor="#E53935"
            iconSize={47}
            iconMb={1.25}
            py={0}
            px={0}
            body={
              <>
                Deleting this client will
                <br />
                permanently remove their
                <br />
                booking history and analytics.
              </>
            }
            bodySx={mollureSectionTitleSx(m.navy, {
              lineHeight: 1.25,
              px: 0,
            })}
          />
          {deleteClient ? (
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
          ) : null}
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
            <FinanceDrawerActionsFooter
              onCancel={() => setClientDetailsMode("view")}
              onPrimary={saveClientEdits}
              primaryLabel="Update"
              spacing={1}
              stackSx={{ py: 2 }}
              primarySx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 36,
                px: 3,
              }}
            />
          ) : null
        }
      >
        {viewClient ? (
          <>
            {clientDetailsMode === "edit" ? (
              <ClientDetailsEditPanel
                client={viewClient}
                editCompanyForm={editCompanyForm}
                setEditCompanyForm={setEditCompanyForm}
                editIndividualForm={editIndividualForm}
                setEditIndividualForm={setEditIndividualForm}
                editPhoneErrors={editPhoneErrors}
                setEditPhoneErrors={setEditPhoneErrors}
              />
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

      <ClientAddMollureModal
        open={addMollureOpen}
        onClose={() => setAddMollureOpen(false)}
        onAdd={addMollureClient}
        search={mollureSearch}
        onSearchChange={setMollureSearch}
        results={mollureResults}
        selectedId={selectedMollureId}
        onSelect={setSelectedMollureId}
      />

      <ClientAddNonMollureDrawer
        open={addNonMollureOpen}
        onClose={() => setAddNonMollureOpen(false)}
        onSave={addNonMollureClient}
        clientType={nonMollureClientType}
        setClientType={setNonMollureClientType}
        typeError={nonMollureTypeError}
        setTypeError={setNonMollureTypeError}
        indFirstName={indFirstName}
        setIndFirstName={setIndFirstName}
        indLastName={indLastName}
        setIndLastName={setIndLastName}
        indGender={indGender}
        setIndGender={setIndGender}
        indDob={indDob}
        setIndDob={setIndDob}
        indCountryCode={indCountryCode}
        setIndCountryCode={setIndCountryCode}
        indPhone={indPhone}
        setIndPhone={setIndPhone}
        indEmail={indEmail}
        setIndEmail={setIndEmail}
        indErrors={indErrors}
        setIndErrors={setIndErrors}
        coLegalName={coLegalName}
        setCoLegalName={setCoLegalName}
        coCoc={coCoc}
        setCoCoc={setCoCoc}
        coVat={coVat}
        setCoVat={setCoVat}
        coContactFirst={coContactFirst}
        setCoContactFirst={setCoContactFirst}
        coContactLast={coContactLast}
        setCoContactLast={setCoContactLast}
        coGender={coGender}
        setCoGender={setCoGender}
        coStreet={coStreet}
        setCoStreet={setCoStreet}
        coStreetNumber={coStreetNumber}
        setCoStreetNumber={setCoStreetNumber}
        coPostal={coPostal}
        setCoPostal={setCoPostal}
        coProvince={coProvince}
        setCoProvince={setCoProvince}
        coMunicipality={coMunicipality}
        setCoMunicipality={setCoMunicipality}
        coCountryCode={coCountryCode}
        setCoCountryCode={setCoCountryCode}
        coPhone={coPhone}
        setCoPhone={setCoPhone}
        coEmail={coEmail}
        setCoEmail={setCoEmail}
        compErrors={compErrors}
        setCompErrors={setCompErrors}
        technicalNote={nonMollureTechnicalNote}
        setTechnicalNote={setNonMollureTechnicalNote}
      />
    </>
  );
}
