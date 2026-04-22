"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Grid,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import MollureFormField from "../../../../components/common/MollureFormField";
import MollureModal from "../../../../components/common/MollureModal";
import MollureDrawer from "../../../../components/common/MollureDrawer";
import MollureListToolbar from "../../../../components/common/MollureListToolbar";
import { useFixedLocationClientPage } from "./useFixedLocationClientPage";
import { Typography } from "../../../../components/ui/typography";

export default function FixedLocationClientPage() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const {
    clients,
    query,
    setQuery,
    sortBy,
    setSortBy,
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
    nonMollureStep,
    setNonMollureStep,
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
    confirmDeleteClient,
    saveClientEdits,
  } = useFixedLocationClientPage();

  return (
    <FixedLocationPageScaffold activeTopTab="Client" topTabs={fixedLocationTopTabs}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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
        {/* Header */}
        <Box sx={{ px: 2.25, py: 1.75 }}>
          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 18, lineHeight: 1.15 }}>
            Client List
          </Typography>
          <Typography sx={{ mt: 0.4, color: alpha(m.navy, 0.55), fontSize: 12.5, fontWeight: 600 }}>
            View Clients added to the list
          </Typography>
        </Box>
        <Box sx={{ height: 1, bgcolor: alpha(m.navy, 0.06) }} />

        {/* Toolbar */}
        <MollureListToolbar
          searchPlaceholder="Search from Client list by name"
          searchValue={query}
          onSearchChange={setQuery}
          onSortClick={(e) => setSortAnchor(e.currentTarget)}
          onAddClick={(e) => setAddAnchor(e.currentTarget)}
        />

        <Menu
          anchorEl={sortAnchor}
          open={sortOpen}
          onClose={() => setSortAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 240,
              p: 0.5,
            },
          }}
        >
          {[
            "Alphabetical (A–Z)",
            "Alphabetical (Z–A)",
            "Sales (Highest → Lowest)",
            "Sales (Lowest → Highest)",
            "Booking Dated (Current → Last)",
            "Booking Dated (Last → Current)",
          ].map((opt) => (
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
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 190,
              p: 0.5,
            },
          }}
        >
          {["Mollure Client", "Non-Mollure Client"].map((opt) => (
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
        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72), mb: 1 }}>
            Clients ({clients.length})
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(m.navy, 0.02) }}>
                  {["Client Name", "Phone Number", "Total Sales", "Last Booking Date", ""].map((h) => (
                    <TableCell
                      key={h || "actions"}
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.62),
                        py: 1.2,
                        borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                      }}
                      align={h === "" ? "right" : "left"}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} hover sx={{ "& td": { borderBottom: `1px solid ${alpha(m.navy, 0.06)}` } }}>
                    <TableCell sx={{ py: 1.25 }}>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Avatar
                          src={c.photoSrc}
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: alpha(m.navy, 0.08),
                            color: alpha(m.navy, 0.78),
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {c.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.86) }}>
                              {c.name}
                            </Typography>
                            {c.tags.includes("CC") && (
                              <Chip
                                label="CC Client"
                                size="small"
                                sx={{
                                  height: 18,
                                  borderRadius: "999px",
                                  bgcolor: alpha(theme.palette.primary.main, 0.10),
                                  color: theme.palette.primary.main,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  px: 0.5,
                                }}
                              />
                            )}
                            <Chip
                              label={c.tags.includes("Mollure") ? "Mollure" : "Non-Mollure"}
                              size="small"
                              sx={{
                                height: 18,
                                borderRadius: "999px",
                                bgcolor: c.tags.includes("Mollure")
                                  ? alpha(theme.palette.primary.main, 0.10)
                                  : alpha(m.teal, 0.14),
                                color: c.tags.includes("Mollure") ? theme.palette.primary.main : alpha(m.teal, 0.95),
                                fontSize: 10,
                                fontWeight: 800,
                                px: 0.5,
                              }}
                            />
                          </Stack>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.50) }}>
                            {c.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75) }}>
                      {c.phone}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.78) }}>
                      {c.totalSales}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.75) }}>
                      {c.lastBooking}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => setRowMenu({ id: c.id, anchor: e.currentTarget })}
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Menu
          anchorEl={rowMenu?.anchor ?? null}
          open={Boolean(rowMenu)}
          onClose={() => setRowMenu(null)}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 140,
              p: 0.5,
            },
          }}
        >
          {["View", "Block", "Delete"].map((opt) => (
            <MenuItem
              key={opt}
              onClick={() => {
                const id = rowMenu?.id;
                setRowMenu(null);
                if (opt === "View" && id) {
                  setClientDetailsMode("view");
                  setViewClientId(id);
                }
            if (opt === "Block" && id) {
              setBlockClientId(id);
            }
            if (opt === "Delete" && id) {
              setDeleteClientId(id);
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
      </Paper>

      {/* Block client modal */}
      <MollureModal
        open={Boolean(blockClient)}
        onClose={() => setBlockClientId(null)}
        fullWidth
        maxWidth="xs"
        title="Block Client"
        contentMinHeight={250}
        footer={
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ px: 2.5, py: 2 }}>
            <Button
              onClick={() => setBlockClientId(null)}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                height: 34,
                px: 2.25,
                minWidth: 92,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                // Hook your API here. For now: close modal only.
                setBlockClientId(null);
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 34,
                px: 3,
                minWidth: 92,
              }}
            >
              Block
            </Button>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.80), fontSize: 15, lineHeight: 1.25 }}>
            Blocked Clients can&apos;t book
            <br />
            appointment or message you
          </Typography>
          {blockClient && (
            <Typography sx={{ mt: 1.25, fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
              {blockClient.name}
            </Typography>
          )}
        </Box>
      </MollureModal>

      {/* Delete client modal */}
      <MollureModal
        open={Boolean(deleteClient)}
        onClose={() => setDeleteClientId(null)}
        fullWidth
        maxWidth="xs"
        title="Delete Client"
        contentMinHeight={260}
        footer={
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ px: 2.5, py: 2 }}>
            <Button
              onClick={() => setDeleteClientId(null)}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                height: 34,
                px: 2.25,
                minWidth: 92,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={confirmDeleteClient}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 34,
                px: 3,
                minWidth: 92,
              }}
            >
              Delete
            </Button>
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
              bgcolor: alpha("#E53935", 0.10),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 26, color: "#E53935" }} />
          </Box>
          <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.80), fontSize: 15, lineHeight: 1.25 }}>
            Deleting this client will
            <br />
            permanently remove their
            <br />
            booking history and analytics.
          </Typography>
          {deleteClient && (
            <Typography sx={{ mt: 1.25, fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
              {deleteClient.name}
            </Typography>
          )}
        </Box>
      </MollureModal>

      {/* Client details (View) */}
      <MollureDrawer
        anchor="right"
        open={Boolean(viewClient)}
        onClose={closeClientDetailsDrawer}
        width={{ xs: "100%", sm: 500 }}
        title={clientDetailsMode === "edit" ? "Edit Client Details" : "Client Details"}
        onBack={clientDetailsMode === "edit" ? () => setClientDetailsMode("view") : undefined}
        footer={
          clientDetailsMode === "edit" ? (
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
              <Button
                onClick={() => setClientDetailsMode("view")}
                variant="outlined"
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 800,
                  borderColor: alpha(m.navy, 0.14),
                  color: alpha(m.navy, 0.72),
                  bgcolor: "#fff",
                  height: 36,
                  px: 2.25,
                }}
              >
                Cancel
              </Button>
              <Button
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
              </Button>
            </Stack>
          ) : null
        }
      >
        {viewClient ? (
          <Box sx={{ px: 2.5, py: 2 }}>
              {clientDetailsMode === "edit" && viewClient.kind === "company" ? (
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
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(m.navy, 0.88) }}>
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
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                          {viewClient.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Stack spacing={1.25}>
                    <MollureFormField
                      placeholder="Legal Name"
                      value={editCompanyForm.legalName}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, legalName: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="COC"
                      value={editCompanyForm.coc}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, coc: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="VAT"
                      value={editCompanyForm.vat}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, vat: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Contact Person's First Name"
                      value={editCompanyForm.contactFirst}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, contactFirst: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Contact Person's Last Name"
                      value={editCompanyForm.contactLast}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, contactLast: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      select
                      value={editCompanyForm.gender || "Select Gender"}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, gender: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    >
                      {["Select Gender", "Male", "Female", "Other"].map((o) => (
                        <MenuItem key={o} value={o === "Select Gender" ? "" : o}>
                          {o}
                        </MenuItem>
                      ))}
                    </MollureFormField>

                    <Box sx={{ pt: 0.25 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                        Contact Number
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Box sx={{ width: 140 }}>
                          <MollureFormField
                            select
                            value={editCompanyForm.countryCode}
                            onChange={(e) => setEditCompanyForm((p) => ({ ...p, countryCode: e.target.value }))}
                            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                          >
                            {["+1", "+44", "+49", "+91", "+92", "+971", "+81", "+61", "+31"].map((o) => (
                              <MenuItem key={o} value={o}>
                                {o}
                              </MenuItem>
                            ))}
                          </MollureFormField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <MollureFormField
                            placeholder="+442xxxxxxxxxxx"
                            value={editCompanyForm.phone}
                            onChange={(e) => setEditCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                          />
                        </Box>
                      </Stack>
                    </Box>

                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), pt: 0.5 }}>
                      Business Address
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={8}>
                        <MollureFormField
                          placeholder="Street"
                          value={editCompanyForm.street}
                          onChange={(e) => setEditCompanyForm((p) => ({ ...p, street: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <MollureFormField
                          placeholder="Number"
                          value={editCompanyForm.streetNumber}
                          onChange={(e) => setEditCompanyForm((p) => ({ ...p, streetNumber: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <MollureFormField
                          placeholder="Postal Code"
                          value={editCompanyForm.postal}
                          onChange={(e) => setEditCompanyForm((p) => ({ ...p, postal: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <MollureFormField
                          select
                          value={editCompanyForm.province || "Province"}
                          onChange={(e) => setEditCompanyForm((p) => ({ ...p, province: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                        >
                          {["Province", "North Holland", "South Holland", "Utrecht"].map((o) => (
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
                          onChange={(e) => setEditCompanyForm((p) => ({ ...p, municipality: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                        >
                          {["Municipality", "Amsterdam", "Rotterdam", "Utrecht"].map((o) => (
                            <MenuItem key={o} value={o === "Municipality" ? "" : o}>
                              {o}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                      </Grid>
                    </Grid>

                    <MollureFormField
                      placeholder="Email Address"
                      value={editCompanyForm.email}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, email: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />

                    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.86), pt: 0.5 }}>
                      Technical Note (Optional)
                    </Typography>
                    <MollureFormField
                      multiline
                      minRows={4}
                      placeholder="Any Technical note about Client"
                      value={editCompanyForm.technicalNote}
                      onChange={(e) => setEditCompanyForm((p) => ({ ...p, technicalNote: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Stack>
                </Stack>
              ) : clientDetailsMode === "edit" && viewClient.kind === "individual" ? (
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
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: alpha(m.navy, 0.88) }}>
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
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                          {viewClient.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Stack spacing={1.25}>
                    <MollureFormField
                      placeholder="First Name"
                      value={editIndividualForm.firstName}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, firstName: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Last Name"
                      value={editIndividualForm.lastName}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, lastName: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      select
                      value={editIndividualForm.gender || "Select Gender"}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, gender: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    >
                      {["Select Gender", "Male", "Female", "Other"].map((o) => (
                        <MenuItem key={o} value={o === "Select Gender" ? "" : o}>
                          {o}
                        </MenuItem>
                      ))}
                    </MollureFormField>
                    <Box sx={{ pt: 0.25 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                        Date of Birth
                      </Typography>
                      <MollureFormField
                        placeholder="MM/DD/YY"
                        value={editIndividualForm.dob}
                        onChange={(e) => setEditIndividualForm((p) => ({ ...p, dob: e.target.value }))}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      />
                    </Box>
                    <Box sx={{ pt: 0.25 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                        Contact Number
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Box sx={{ width: 140 }}>
                          <MollureFormField
                            select
                            value={editIndividualForm.countryCode}
                            onChange={(e) => setEditIndividualForm((p) => ({ ...p, countryCode: e.target.value }))}
                            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                          >
                            {["+1", "+44", "+49", "+91", "+92", "+971", "+81", "+61", "+31"].map((o) => (
                              <MenuItem key={o} value={o}>
                                {o}
                              </MenuItem>
                            ))}
                          </MollureFormField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <MollureFormField
                            placeholder="+442xxxxxxxxxx"
                            value={editIndividualForm.phone}
                            onChange={(e) => setEditIndividualForm((p) => ({ ...p, phone: e.target.value }))}
                            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                    <MollureFormField
                      placeholder="Residential Address"
                      value={editIndividualForm.residentialAddress}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, residentialAddress: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <MollureFormField
                      placeholder="Email Address"
                      value={editIndividualForm.email}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, email: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.86), pt: 0.5 }}>
                      Technical Note (Optional)
                    </Typography>
                    <MollureFormField
                      multiline
                      minRows={4}
                      placeholder="Any Technical note about Client"
                      value={editIndividualForm.technicalNote}
                      onChange={(e) => setEditIndividualForm((p) => ({ ...p, technicalNote: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                  </Stack>
                </Stack>
              ) : (
                <>
              <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2.5 }}>
                <Avatar
                  src={viewClient.photoSrc}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(m.navy, 0.08),
                    color: alpha(m.navy, 0.78),
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {viewClient.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.35 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, color: alpha(m.navy, 0.88) }}>
                      {viewClient.name}
                    </Typography>
                    {viewClient.tags.includes("CC") && (
                      <Chip
                        label="CC Client"
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: "999px",
                          bgcolor: alpha(theme.palette.primary.main, 0.10),
                          color: theme.palette.primary.main,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      />
                    )}
                    <Chip
                      label={viewClient.tags.includes("Mollure") ? "Mollure" : "Non-Mollure"}
                      size="small"
                      sx={{
                        height: 20,
                        borderRadius: "999px",
                        bgcolor: viewClient.tags.includes("Mollure")
                          ? alpha(theme.palette.primary.main, 0.10)
                          : alpha(m.teal, 0.14),
                        color: viewClient.tags.includes("Mollure") ? theme.palette.primary.main : alpha(m.teal, 0.95),
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(m.navy, 0.52) }}>
                    {viewClient.email}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Edit client"
                  onClick={openClientDetailsEdit}
                  sx={{ color: alpha(m.navy, 0.45), mt: -0.25 }}
                >
                  <EditRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <PersonRoundedIcon sx={{ fontSize: 20, color: alpha(m.teal, 0.85) }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.82) }}>
                  Client Information
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.48), mb: 1.75 }}>
                Added to the client list on {viewClient.addedOn}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {viewClient.kind === "company" ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Legal Name</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.legalName ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>COC Number</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.coc ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>VAT Number</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.vat ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                        Contact Person Name
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.contactPersonName ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Gender</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.gender ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Contact Number</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.phone}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Business Address</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.businessAddress ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Email Address</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.detailEmail ?? viewClient.email}
                      </Typography>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Full Name</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Gender</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.gender ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Date of Birth</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.dateOfBirth ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Contact Number</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.phone}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                        Residential Address
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.residentialAddress ?? "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.5) }}>Email Address</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.84), mt: 0.35 }}>
                        {viewClient.email}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <ShowChartRoundedIcon sx={{ fontSize: 20, color: alpha(m.teal, 0.85) }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.82) }}>
                  Platform Statistics
                </Typography>
              </Stack>

              <Grid container spacing={1.25} sx={{ mb: 2 }}>
                {[
                  { label: "Total Sales", value: viewClient.totalSales },
                  {
                    label: "Last Booking",
                    value: viewClient.statsLastBooking ?? viewClient.lastBooking,
                  },
                  { label: "Bookings Completed", value: String(viewClient.bookingsCompleted) },
                  { label: "Average Booking value", value: viewClient.averageBookingValue },
                ].map((card) => (
                  <Grid item xs={6} key={card.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.35,
                        borderRadius: "10px",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        bgcolor: alpha(m.navy, 0.02),
                      }}
                    >
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.5) }}>
                        {card.label}
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 900, color: m.teal, mt: 0.5 }}>{card.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.72), mb: 1 }}>
                    Recent Services
                  </Typography>
                  <Stack spacing={1}>
                    {viewClient.recentServices.map((s) => (
                      <Stack key={s.name} direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.78) }}>{s.name}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: m.teal }}>{s.price}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: alpha(m.navy, 0.72), mb: 1 }}>
                    Booking History
                  </Typography>
                  <Stack spacing={1}>
                    {viewClient.bookingHistory.map((b) => (
                      <Typography key={b.period} sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.78) }}>
                        {b.period}: {b.bookings} Booking{b.bookings === 1 ? "" : "s"}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
                </>
              )}
          </Box>
        ) : null}
      </MollureDrawer>

      {/* Add Mollure Client Modal */}
      <MollureModal
        open={addMollureOpen}
        onClose={() => setAddMollureOpen(false)}
        fullWidth
        maxWidth="sm"
        title="Add Mollure Client"
        contentMinHeight={360}
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
            <Button
              onClick={() => setAddMollureOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                height: 36,
                px: 2.25,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={!selectedMollureId}
              onClick={addMollureClient}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 36,
                px: 2.25,
              }}
            >
              Add to Client List
            </Button>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
              Search on Mollure by email
            </Typography>
            <MollureFormField
              placeholder="Search by email"
              value={mollureSearch}
              onChange={(e) => setMollureSearch(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              InputProps={{
                endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
              }}
            />
          </Box>

          <Box
            sx={{
              mt: 1.5,
              borderRadius: "12px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            {mollureResults.slice(0, 3).map((r, idx) => (
              <Box
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMollureId(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedMollureId(r.id);
                }}
                sx={{
                  px: 1.6,
                  py: 1.15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.1,
                  bgcolor: selectedMollureId === r.id ? alpha(theme.palette.primary.main, 0.06) : "#fff",
                  "&:hover": { bgcolor: alpha(m.navy, 0.03) },
                  ...(idx > 0 ? { borderTop: `1px solid ${alpha(m.navy, 0.08)}` } : null),
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
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography sx={{ fontWeight: 900, fontSize: 12.5, color: alpha(m.navy, 0.86) }}>{r.name}</Typography>
                    <Chip
                      label="Mollure"
                      size="small"
                      sx={{
                        height: 18,
                        borderRadius: "999px",
                        bgcolor: alpha(theme.palette.primary.main, 0.10),
                        color: theme.palette.primary.main,
                        fontSize: 10,
                        fontWeight: 800,
                        px: 0.5,
                      }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.50) }}>{r.email}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </MollureModal>

      {/* Add Non-Mollure Client Drawer */}
      <MollureDrawer
        anchor="right"
        open={addNonMollureOpen}
        onClose={() => setAddNonMollureOpen(false)}
        width={{ xs: "100%", sm: 440 }}
        title={
          nonMollureStep === "individual"
            ? "Add Individual Client"
            : nonMollureStep === "company"
              ? "Add Company Client"
              : "Add Non-Mollure Client"
        }
        onBack={
          nonMollureStep !== "type"
            ? () => {
                setNonMollureStep("type");
                setIndErrors({});
                setCompErrors({});
              }
            : undefined
        }
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
            <Button
              onClick={() => setAddNonMollureOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                height: 36,
                px: 2.25,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                if (nonMollureStep === "type") {
                  if (!nonMollureClientType) {
                    setNonMollureTypeError("Please select a client type");
                    return;
                  }
                  setNonMollureTypeError("");
                  setIndErrors({});
                  setCompErrors({});
                  setNonMollureStep(nonMollureClientType === "Company Client" ? "company" : "individual");
                  return;
                }
                if (nonMollureStep === "individual") {
                  addNonMollureClient();
                  return;
                }
                if (nonMollureStep === "company") {
                  addNonMollureClient();
                }
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
                height: 36,
                px: 3,
              }}
            >
              {nonMollureStep === "company" ? "Save" : "Next"}
            </Button>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
            {nonMollureStep === "type" && (
              <>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                  Client Type
                </Typography>
                <MollureFormField
                  select
                  value={nonMollureClientType || "Select Client Type"}
                  onChange={(e) => {
                    setNonMollureClientType(e.target.value as "" | "Individual Client" | "Company Client");
                    setNonMollureTypeError("");
                  }}
                  error={Boolean(nonMollureTypeError)}
                  helperText={nonMollureTypeError}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  {["Select Client Type", "Individual Client", "Company Client"].map((o) => (
                    <MenuItem key={o} value={o === "Select Client Type" ? "" : o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>
              </>
            )}

            {nonMollureStep === "individual" && (
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
                  value={indGender || "Select Gender"}
                  onChange={(e) => {
                    setIndGender(e.target.value);
                    setIndErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  error={Boolean(indErrors.gender)}
                  helperText={indErrors.gender}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  {["Select Gender", "Male", "Female", "Other"].map((o) => (
                    <MenuItem key={o} value={o === "Select Gender" ? "" : o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>

                <Box sx={{ pt: 0.25 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                    Date of Birth
                  </Typography>
                  <MollureFormField
                    placeholder="MM/DD/YY"
                    value={indDob}
                    onChange={(e) => {
                      setIndDob(e.target.value);
                      setIndErrors((p) => ({ ...p, dob: undefined }));
                    }}
                    error={Boolean(indErrors.dob)}
                    helperText={indErrors.dob}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  />
                </Box>

                <Box sx={{ pt: 0.25 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                    Contact Number
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Box sx={{ width: 140 }}>
                      <MollureFormField
                        select
                        value={indCountryCode}
                        onChange={(e) => {
                          setIndCountryCode(e.target.value);
                          setIndErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      >
                        {["+1", "+44", "+49", "+91", "+92", "+971"].map((o) => (
                          <MenuItem key={o} value={o}>
                            {o}
                          </MenuItem>
                        ))}
                      </MollureFormField>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <MollureFormField
                        placeholder="+442xxxxxxxxxx"
                        value={indPhone}
                        onChange={(e) => {
                          setIndPhone(e.target.value);
                          setIndErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        error={Boolean(indErrors.phone)}
                        helperText={indErrors.phone}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      />
                    </Box>
                  </Stack>
                </Box>

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

            {nonMollureStep === "company" && (
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
                  value={coGender || "Select Gender"}
                  onChange={(e) => {
                    setCoGender(e.target.value);
                    setCompErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  error={Boolean(compErrors.gender)}
                  helperText={compErrors.gender}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  {["Select Gender", "Male", "Female", "Other"].map((o) => (
                    <MenuItem key={o} value={o === "Select Gender" ? "" : o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>

                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), pt: 0.5 }}>
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
                        setCompErrors((p) => ({ ...p, streetNumber: undefined }));
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
                      {["Province", "North Holland", "South Holland", "Utrecht"].map((o) => (
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
                        setCompErrors((p) => ({ ...p, municipality: undefined }));
                      }}
                      error={Boolean(compErrors.municipality)}
                      helperText={compErrors.municipality}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    >
                      {["Municipality", "Amsterdam", "Rotterdam", "Utrecht"].map((o) => (
                        <MenuItem key={o} value={o === "Municipality" ? "" : o}>
                          {o}
                        </MenuItem>
                      ))}
                    </MollureFormField>
                  </Grid>
                </Grid>

                <Box sx={{ pt: 0.25 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                    Contact Number
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Box sx={{ width: 140 }}>
                      <MollureFormField
                        select
                        value={coCountryCode}
                        onChange={(e) => {
                          setCoCountryCode(e.target.value);
                          setCompErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      >
                        {["+1", "+44", "+49", "+91", "+92", "+971"].map((o) => (
                          <MenuItem key={o} value={o}>
                            {o}
                          </MenuItem>
                        ))}
                      </MollureFormField>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <MollureFormField
                        placeholder="+442xxxxxxxxxxx"
                        value={coPhone}
                        onChange={(e) => {
                          setCoPhone(e.target.value);
                          setCompErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        error={Boolean(compErrors.phone)}
                        helperText={compErrors.phone}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                      />
                    </Box>
                  </Stack>
                </Box>

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
        </Box>
      </MollureDrawer>
    </FixedLocationPageScaffold>
  );
}

