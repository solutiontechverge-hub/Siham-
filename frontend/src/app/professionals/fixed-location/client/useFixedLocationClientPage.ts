"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { getPhoneValidationErrors } from "../../../../lib/phone-validation";
import {
  parseCoc,
  parseEmail,
  parsePersonName,
  parseText,
  parseVat,
  rejectInvalid,
  INPUT_LIMITS,
} from "../../../../lib/inputSchema";
import { DEFAULT_DIAL_CODE } from "../../../../lib/phoneDefaults";
import type { ClientRecord } from "./data/clientList";
import {
  useCreateProfessionalClientMutation,
  useDeleteProfessionalClientMutation,
  useGetMollureClientDirectoryQuery,
  useGetProfessionalClientsQuery,
  useSetProfessionalClientBlockedMutation,
  useUpdateProfessionalClientMutation,
  useUpdateProfessionalClientTechnicalNoteMutation,
} from "../../../../store/services/businessApi";
import {
  DEFAULT_CLIENT_LIST_SORT,
  isMollureClient,
  matchesClientFilters,
  matchesClientSearch,
  parseClientSearchQuery,
  type ClientListFilterKey,
} from "./data/clientListFilters";
import { mapApiProfessionalClientToRecord } from "./mapApiProfessionalClient";
import {
  emptyEditCompanyForm,
  emptyEditIndividualForm,
  type ClientDetailsMode,
  type ClientSnackbarState,
  type EditCompanyFormState,
  type EditIndividualFormState,
  type NonMollureClientType,
} from "./client.types";
import { splitClientPhone } from "./client.data";

export type {
  EditCompanyFormState,
  EditIndividualFormState,
} from "./client.types";
export { emptyEditCompanyForm, emptyEditIndividualForm } from "./client.types";

function parseDobForApi(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) {
    const [mm, dd, yy] = v.split("/").map((x) => Number(x));
    const yyyy = yy < 100 ? 2000 + yy : yy;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return v;
}

export function useFixedLocationClientPage() {
  const searchParams = useSearchParams();
  const { data: clientsResponse, isLoading: clientsLoading, isError: clientsError } = useGetProfessionalClientsQuery();
  const [createProfessionalClient] = useCreateProfessionalClientMutation();
  const [updateProfessionalClient] = useUpdateProfessionalClientMutation();
  const [updateProfessionalClientTechnicalNote] = useUpdateProfessionalClientTechnicalNoteMutation();
  const [setProfessionalClientBlocked] = useSetProfessionalClientBlockedMutation();
  const [deleteProfessionalClient] = useDeleteProfessionalClientMutation();

  const clients = React.useMemo(
    () => (clientsResponse?.data ?? []).map(mapApiProfessionalClientToRecord),
    [clientsResponse],
  );
  const [query, setQuery] = React.useState(() => parseClientSearchQuery(searchParams));
  const [sortBy, setSortBy] = React.useState(DEFAULT_CLIENT_LIST_SORT);
  const [activeFilters, setActiveFilters] = React.useState<Set<ClientListFilterKey>>(() => new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);

  const [sortAnchor, setSortAnchor] = React.useState<null | HTMLElement>(null);
  const [addAnchor, setAddAnchor] = React.useState<null | HTMLElement>(null);
  const [rowMenu, setRowMenu] = React.useState<{ id: string; anchor: HTMLElement } | null>(null);
  const [blockClientId, setBlockClientId] = React.useState<string | null>(null);
  const [deleteClientId, setDeleteClientId] = React.useState<string | null>(null);
  const [viewClientId, setViewClientId] = React.useState<string | null>(null);
  const [focusTechnicalNoteOnOpen, setFocusTechnicalNoteOnOpen] = React.useState(false);
  const [clientDetailsMode, setClientDetailsMode] = React.useState<ClientDetailsMode>("view");
  const [editCompanyForm, setEditCompanyForm] = React.useState<EditCompanyFormState>(emptyEditCompanyForm);
  const [editIndividualForm, setEditIndividualForm] = React.useState<EditIndividualFormState>(emptyEditIndividualForm);
  const [addMollureOpen, setAddMollureOpen] = React.useState(false);
  const [addNonMollureOpen, setAddNonMollureOpen] = React.useState(false);
  const [mollureSearch, setMollureSearch] = React.useState("");
  const { data: mollureDirectoryResponse } = useGetMollureClientDirectoryQuery(
    { q: mollureSearch },
    { skip: !addMollureOpen },
  );
  const [selectedMollureId, setSelectedMollureId] = React.useState<string | "">("");
  const [nonMollureClientType, setNonMollureClientType] = React.useState<NonMollureClientType>(
    "",
  );
  const [indFirstName, setIndFirstName] = React.useState("");
  const [indLastName, setIndLastName] = React.useState("");
  const [indGender, setIndGender] = React.useState("");
  const [indDob, setIndDob] = React.useState("");
  const [indCountryCode, setIndCountryCode] = React.useState(DEFAULT_DIAL_CODE);
  const [indPhone, setIndPhone] = React.useState("");
  const [indEmail, setIndEmail] = React.useState("");
  const [indResidentialArea, setIndResidentialArea] = React.useState("");
  const [indErrors, setIndErrors] = React.useState<Partial<Record<string, string>>>({});
  const [nonMollureTypeError, setNonMollureTypeError] = React.useState("");

  const [coLegalName, setCoLegalName] = React.useState("");
  const [coCoc, setCoCoc] = React.useState("");
  const [coVat, setCoVat] = React.useState("");
  const [coContactFirst, setCoContactFirst] = React.useState("");
  const [coContactLast, setCoContactLast] = React.useState("");
  const [coGender, setCoGender] = React.useState("");
  const [coStreet, setCoStreet] = React.useState("");
  const [coStreetNumber, setCoStreetNumber] = React.useState("");
  const [coPostal, setCoPostal] = React.useState("");
  const [coProvince, setCoProvince] = React.useState("");
  const [coMunicipality, setCoMunicipality] = React.useState("");
  const [coCountryCode, setCoCountryCode] = React.useState(DEFAULT_DIAL_CODE);
  const [coPhone, setCoPhone] = React.useState("");
  const [coEmail, setCoEmail] = React.useState("");
  const [compErrors, setCompErrors] = React.useState<Partial<Record<string, string>>>({});
  const [editPhoneErrors, setEditPhoneErrors] = React.useState<{ countryCode?: string; phone?: string }>({});
  const [nonMollureTechnicalNote, setNonMollureTechnicalNote] = React.useState("");

  const [snackbar, setSnackbar] = React.useState<ClientSnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const closeSnackbar = React.useCallback((_e?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbar((p) => ({ ...p, open: false }));
  }, []);

  const validateCompany = React.useCallback(() => {
    const parsed = rejectInvalid({
      legalName: parseText(coLegalName, {
        label: "Legal name",
        max: INPUT_LIMITS.textShort,
      }),
      coc: parseCoc(coCoc),
      vat: parseVat(coVat),
      contactFirst: parsePersonName(coContactFirst, { label: "First name" }),
      contactLast: parsePersonName(coContactLast, { label: "Last name" }),
      street: parseText(coStreet, { label: "Street", max: INPUT_LIMITS.textShort }),
      streetNumber: parseText(coStreetNumber, {
        label: "Number",
        max: INPUT_LIMITS.streetNumber,
      }),
      postal: parseText(coPostal, {
        label: "Postal code",
        max: INPUT_LIMITS.postalCode,
      }),
      email: parseEmail(coEmail),
    });
    const next: Partial<Record<string, string>> = parsed.ok
      ? {}
      : { ...parsed.errors };
    if (!coGender) next.gender = "Please select gender";
    if (!coProvince) next.province = "Please select province";
    if (!coMunicipality) next.municipality = "Please select municipality";
    const coPhoneErrors = getPhoneValidationErrors(coCountryCode, coPhone);
    if (coPhoneErrors.countryCode) next.countryCode = coPhoneErrors.countryCode;
    if (coPhoneErrors.phone) next.phone = coPhoneErrors.phone;
    setCompErrors(next);
    return Object.keys(next).length === 0;
  }, [
    coCoc,
    coContactFirst,
    coContactLast,
    coCountryCode,
    coEmail,
    coGender,
    coLegalName,
    coMunicipality,
    coPhone,
    coPostal,
    coProvince,
    coStreet,
    coStreetNumber,
    coVat,
  ]);

  const validateIndividual = React.useCallback(() => {
    const parsed = rejectInvalid({
      firstName: parsePersonName(indFirstName, { label: "First name" }),
      lastName: parsePersonName(indLastName, { label: "Last name" }),
      email: parseEmail(indEmail),
    });
    const next: Partial<Record<string, string>> = parsed.ok
      ? {}
      : { ...parsed.errors };
    if (!indGender) next.gender = "Please select gender";
    const dob = indDob.trim();
    if (!dob) {
      next.dob = "Date of birth is required";
    } else if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dob) && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      next.dob = "Use format MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD";
    } else {
      const parseDob = (raw: string) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [yyyy, mm, dd] = raw.split("-").map((x) => Number(x));
          return { yyyy, mm, dd };
        }
        const [mm, dd, yy] = raw.split("/").map((x) => Number(x));
        const yyyy = yy < 100 ? 2000 + yy : yy;
        return { yyyy, mm, dd };
      };
      const { yyyy, mm, dd } = parseDob(dob);
      const d = new Date(yyyy, mm - 1, dd);
      if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) next.dob = "Enter a valid date";
    }
    const indPhoneErrors = getPhoneValidationErrors(indCountryCode, indPhone);
    if (indPhoneErrors.countryCode) next.countryCode = indPhoneErrors.countryCode;
    if (indPhoneErrors.phone) next.phone = indPhoneErrors.phone;
    setIndErrors(next);
    return Object.keys(next).length === 0;
  }, [indCountryCode, indDob, indEmail, indFirstName, indGender, indLastName, indPhone]);

  const sortOpen = Boolean(sortAnchor);
  const addOpen = Boolean(addAnchor);

  const parseEuro = React.useCallback((s: string) => {
    const n = Number(String(s).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, []);

  const parseDmy = React.useCallback((s: string) => {
    const [dd, mm, yyyy] = String(s).split("/").map((x) => Number(x));
    if (!dd || !mm || !yyyy) return 0;
    return new Date(yyyy, mm - 1, dd).getTime();
  }, []);

  const filtered = React.useMemo(() => {
    const base = clients.filter(
      (c) =>
        matchesClientSearch(c, query) &&
        matchesClientFilters(c, activeFilters),
    );

    const byNameAsc = [...base].sort((a, b) => a.name.localeCompare(b.name));
    const byNameDesc = [...base].sort((a, b) => b.name.localeCompare(a.name));
    const bySalesAsc = [...base].sort((a, b) => parseEuro(a.totalSales) - parseEuro(b.totalSales));
    const bySalesDesc = [...base].sort((a, b) => parseEuro(b.totalSales) - parseEuro(a.totalSales));
    const byBookingAsc = [...base].sort((a, b) => parseDmy(a.lastBooking) - parseDmy(b.lastBooking));
    const byBookingDesc = [...base].sort((a, b) => parseDmy(b.lastBooking) - parseDmy(a.lastBooking));

    switch (sortBy) {
      case "Alphabetical (Z–A)":
        return byNameDesc;
      case "Sales (Highest → Lowest)":
        return bySalesDesc;
      case "Sales (Lowest → Highest)":
        return bySalesAsc;
      case "Booking Dated (Current → Last)":
        return byBookingDesc;
      case "Booking Dated (Last → Current)":
        return byBookingAsc;
      case "Alphabetical (A–Z)":
      default:
        return byNameAsc;
    }
  }, [activeFilters, clients, parseDmy, parseEuro, query, sortBy]);

  const toggleClientFilter = React.useCallback((key: ClientListFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearClientFilters = React.useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  const viewClient = viewClientId ? clients.find((c) => c.id === viewClientId) : undefined;
  const blockClient = blockClientId ? clients.find((c) => c.id === blockClientId) : undefined;
  const deleteClient = deleteClientId ? clients.find((c) => c.id === deleteClientId) : undefined;

  const openClientDetailsEdit = React.useCallback(() => {
    if (!viewClient) return;
    if (viewClient.kind === "company") {
      const c = viewClient;
      const parts = (c.contactPersonName ?? "").trim().split(/\s+/);
      const { countryCode, phone } = splitClientPhone(c.phone.trim());
      setEditCompanyForm({
        legalName: c.legalName ?? "",
        coc: c.coc ?? "",
        vat: c.vat ?? "",
        contactFirst: parts[0] ?? "",
        contactLast: parts.slice(1).join(" ") || "",
        gender: c.gender ?? "",
        countryCode,
        phone,
        street: c.businessAddress ?? "",
        streetNumber: "",
        postal: "",
        province: "",
        municipality: "",
        email: c.detailEmail ?? c.email,
        technicalNote: c.technicalNote ?? "",
      });
    } else {
      const c = viewClient;
      const nameParts = c.name.trim().split(/\s+/);
      const { countryCode, phone } = splitClientPhone(c.phone.trim());
      setEditIndividualForm({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" ") || "",
        gender: c.gender ?? "",
        dob: c.dateOfBirth ?? "",
        countryCode,
        phone,
        email: c.email,
        residentialAddress: c.residentialAddress ?? "",
        residentialArea: c.residentialArea ?? "",
        technicalNote: c.technicalNote ?? "",
      });
    }
    setClientDetailsMode("edit");
  }, [viewClient]);

  const mollureResults = React.useMemo(() => {
    return (mollureDirectoryResponse?.data ?? []).filter((r) => r.has_eligible_booking !== false);
  }, [mollureDirectoryResponse]);
  const resetNonMollureAddForm = React.useCallback(() => {
    setNonMollureClientType("");
    setIndFirstName("");
    setIndLastName("");
    setIndGender("");
    setIndDob("");
    setIndCountryCode(DEFAULT_DIAL_CODE);
    setIndPhone("");
    setIndEmail("");
    setIndResidentialArea("");
    setIndErrors({});
    setNonMollureTypeError("");
    setCoLegalName("");
    setCoCoc("");
    setCoVat("");
    setCoContactFirst("");
    setCoContactLast("");
    setCoGender("");
    setCoStreet("");
    setCoStreetNumber("");
    setCoPostal("");
    setCoProvince("");
    setCoMunicipality("");
    setCoCountryCode(DEFAULT_DIAL_CODE);
    setCoPhone("");
    setCoEmail("");
    setCompErrors({});
    setNonMollureTechnicalNote("");
  }, []);

  const addMollureClient = React.useCallback(async () => {
    const id = String(selectedMollureId || "").trim();
    if (!id) return false;

    try {
      await createProfessionalClient({ mollure_user_id: id }).unwrap();
      setSelectedMollureId("");
      setMollureSearch("");
      setAddMollureOpen(false);
      setSnackbar({
        open: true,
        message: "Client Added",
        severity: "success",
      });
      return true;
    } catch (error) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(error, "Unable to add client."),
        severity: "error",
      });
      return false;
    }
  }, [createProfessionalClient, selectedMollureId]);
  const addNonMollureClient = React.useCallback(async () => {
    if (!nonMollureClientType) {
      setNonMollureTypeError("Please select a client type");
      return false;
    }
    const noteParsed = parseText(nonMollureTechnicalNote, {
      required: false,
      label: "Technical note",
      min: INPUT_LIMITS.notesMin,
      max: null,
    });
    if (!noteParsed.ok) {
      setSnackbar({
        open: true,
        message: noteParsed.error,
        severity: "error",
      });
      return false;
    }
    if (nonMollureClientType === "Individual Client") {
      if (!validateIndividual()) return false;
      const email = indEmail.trim().toLowerCase();

      try {
        await createProfessionalClient({
          client_kind: "individual",
          email,
          first_name: indFirstName.trim(),
          last_name: indLastName.trim(),
          country_code: indCountryCode,
          phone: indPhone.trim(),
          gender: indGender || undefined,
          date_of_birth: parseDobForApi(indDob),
          residential_area: indResidentialArea.trim() || undefined,
          technical_note: noteParsed.value || undefined,
        }).unwrap();

        setAddNonMollureOpen(false);
        resetNonMollureAddForm();
        setSnackbar({ open: true, message: "Client Added", severity: "success" });
        return true;
      } catch (error) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, "Unable to add client."),
          severity: "error",
        });
        return false;
      }
    }

    if (nonMollureClientType === "Company Client") {
      if (!validateCompany()) return false;
      const email = coEmail.trim().toLowerCase();
      const contactName = `${coContactFirst.trim()} ${coContactLast.trim()}`.trim();

      try {
        await createProfessionalClient({
          client_kind: "company",
          email,
          legal_name: coLegalName.trim(),
          coc: coCoc.trim(),
          vat: coVat.trim(),
          contact_person_name: contactName || undefined,
          gender: coGender || undefined,
          country_code: coCountryCode,
          phone: coPhone.trim(),
          business_address: `${coStreet.trim()} ${coStreetNumber.trim()}, ${coMunicipality.trim()} ${coPostal.trim()}`.trim(),
          detail_email: email,
          technical_note: noteParsed.value || undefined,
        }).unwrap();

        setAddNonMollureOpen(false);
        resetNonMollureAddForm();
        setSnackbar({ open: true, message: "Client Added", severity: "success" });
        return true;
      } catch (error) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, "Unable to add client."),
          severity: "error",
        });
        return false;
      }
    }

    return false;
  }, [
    coCoc,
    coContactFirst,
    coContactLast,
    coCountryCode,
    coEmail,
    coGender,
    coLegalName,
    coMunicipality,
    coPhone,
    coPostal,
    coStreet,
    coStreetNumber,
    coVat,
    createProfessionalClient,
    indCountryCode,
    indDob,
    indEmail,
    indFirstName,
    indGender,
    indLastName,
    indPhone,
    indResidentialArea,
    nonMollureClientType,
    nonMollureTechnicalNote,
    resetNonMollureAddForm,
    validateCompany,
    validateIndividual,
  ]);
  const openNonMollureAddDrawer = React.useCallback(() => {
    resetNonMollureAddForm();
    setNonMollureClientType("Individual Client");
    setNonMollureTypeError("");
    setAddNonMollureOpen(true);
  }, [resetNonMollureAddForm]);

  const openClientDetailsView = React.useCallback(
    (id: string, options?: { focusTechnicalNote?: boolean }) => {
      setClientDetailsMode("view");
      setViewClientId(id);
      setFocusTechnicalNoteOnOpen(Boolean(options?.focusTechnicalNote));
    },
    [],
  );

  React.useEffect(() => {
    const clientId = searchParams.get("clientId")?.trim() || "";
    const email = searchParams.get("clientEmail")?.trim().toLowerCase() || "";
    const name = searchParams.get("clientName")?.trim().toLowerCase() || "";
    if (!clients.length) return;
    if (clientId) {
      const byId = clients.find((client) => client.id === clientId);
      if (byId) openClientDetailsView(byId.id);
      return;
    }
    if (!email && !name) return;
    const match = clients.find((client) =>
      (email && client.email?.trim().toLowerCase() === email) ||
      (!email && name && client.name.trim().toLowerCase() === name),
    );
    if (match) openClientDetailsView(match.id);
  }, [clients, openClientDetailsView, searchParams]);

  const clearTechnicalNoteFocus = React.useCallback(() => {
    setFocusTechnicalNoteOnOpen(false);
  }, []);

  const closeClientDetailsDrawer = React.useCallback(() => {
    setViewClientId(null);
    setClientDetailsMode("view");
    setFocusTechnicalNoteOnOpen(false);
  }, []);

  const confirmDeleteClient = React.useCallback(async () => {
    if (!deleteClientId) return;
    const id = deleteClientId;

    try {
      await deleteProfessionalClient(id).unwrap();
      setDeleteClientId(null);
      if (viewClientId === id) {
        setViewClientId(null);
        setClientDetailsMode("view");
      }
      if (blockClientId === id) setBlockClientId(null);
      setSnackbar({ open: true, message: "Client Deleted", severity: "error" });
    } catch (error) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(error, "Unable to delete client."),
        severity: "error",
      });
    }
  }, [blockClientId, deleteClientId, deleteProfessionalClient, viewClientId]);

  const confirmBlockClient = React.useCallback(async () => {
    if (!blockClientId) return;
    const id = blockClientId;

    try {
      await setProfessionalClientBlocked({ id, is_blocked: true }).unwrap();
      setBlockClientId(null);
      if (deleteClientId === id) setDeleteClientId(null);
      setSnackbar({ open: true, message: "Client blocked", severity: "error" });
    } catch (error) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(error, "Unable to block client."),
        severity: "error",
      });
    }
  }, [blockClientId, deleteClientId, setProfessionalClientBlocked]);

  const unblockClient = React.useCallback(
    async (id: string) => {
      try {
        await setProfessionalClientBlocked({ id, is_blocked: false }).unwrap();
        setSnackbar({ open: true, message: "Client unblocked", severity: "success" });
      } catch (error) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, "Unable to unblock client."),
          severity: "error",
        });
      }
    },
    [setProfessionalClientBlocked],
  );

  const saveClientEdits = React.useCallback(async () => {
    if (!viewClientId || !viewClient) return false;

    // Mollure: only technical note is writable (disabled fields stay out of the payload).
    if (isMollureClient(viewClient)) {
      const note =
        viewClient.kind === "company"
          ? editCompanyForm.technicalNote
          : editIndividualForm.technicalNote;
      const parsed = parseText(note.trim(), {
        required: false,
        label: "Technical note",
        min: INPUT_LIMITS.notesMin,
        max: null,
      });
      if (!parsed.ok) {
        setSnackbar({ open: true, message: parsed.error, severity: "error" });
        return false;
      }
      try {
        await updateProfessionalClientTechnicalNote({
          id: viewClientId,
          technical_note: parsed.value,
        }).unwrap();
        setClientDetailsMode("view");
        setSnackbar({ open: true, message: "Technical note saved", severity: "success" });
        return true;
      } catch (error) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, "Unable to save technical note."),
          severity: "error",
        });
        return false;
      }
    }

    const phoneErrors =
      viewClient.kind === "company"
        ? getPhoneValidationErrors(editCompanyForm.countryCode, editCompanyForm.phone)
        : getPhoneValidationErrors(editIndividualForm.countryCode, editIndividualForm.phone);

    if (phoneErrors.countryCode || phoneErrors.phone) {
      setEditPhoneErrors(phoneErrors);
      setSnackbar({
        open: true,
        message: phoneErrors.phone ?? phoneErrors.countryCode ?? "Enter a valid phone number.",
        severity: "error",
      });
      return false;
    }
    setEditPhoneErrors({});

    const editSchema =
      viewClient.kind === "company"
        ? rejectInvalid({
            legalName: parseText(editCompanyForm.legalName, {
              required: false,
              label: "Legal name",
              max: INPUT_LIMITS.textShort,
            }),
            coc: parseCoc(editCompanyForm.coc, { required: false }),
            vat: parseVat(editCompanyForm.vat, { required: false }),
            contactFirst: parsePersonName(editCompanyForm.contactFirst, {
              required: false,
              label: "First name",
            }),
            contactLast: parsePersonName(editCompanyForm.contactLast, {
              required: false,
              label: "Last name",
            }),
            email: parseEmail(editCompanyForm.email, { required: false }),
            street: parseText(editCompanyForm.street, {
              required: false,
              label: "Street",
              max: INPUT_LIMITS.textShort,
            }),
            technicalNote: parseText(editCompanyForm.technicalNote, {
              required: false,
              label: "Technical note",
              min: INPUT_LIMITS.notesMin,
              max: null,
            }),
          })
        : rejectInvalid({
            firstName: parsePersonName(editIndividualForm.firstName, {
              required: false,
              label: "First name",
            }),
            lastName: parsePersonName(editIndividualForm.lastName, {
              required: false,
              label: "Last name",
            }),
            email: parseEmail(editIndividualForm.email, { required: false }),
            residentialAddress: parseText(editIndividualForm.residentialAddress, {
              required: false,
              label: "Address",
              max: INPUT_LIMITS.textMedium,
            }),
            residentialArea: parseText(editIndividualForm.residentialArea, {
              required: false,
              label: "Residential area",
              max: INPUT_LIMITS.textShort,
            }),
            technicalNote: parseText(editIndividualForm.technicalNote, {
              required: false,
              label: "Technical note",
              min: INPUT_LIMITS.notesMin,
              max: null,
            }),
          });

    if (!editSchema.ok) {
      const first = Object.values(editSchema.errors).find(Boolean);
      setSnackbar({
        open: true,
        message: first || "Please check client details.",
        severity: "error",
      });
      return false;
    }

    try {
      if (viewClient.kind === "company") {
        const email = editCompanyForm.email.trim().toLowerCase();
        const contactPersonName = `${editCompanyForm.contactFirst.trim()} ${editCompanyForm.contactLast.trim()}`.trim();
        const businessAddress = [
          editCompanyForm.street.trim(),
          editCompanyForm.streetNumber.trim(),
          editCompanyForm.municipality.trim(),
          editCompanyForm.postal.trim(),
          editCompanyForm.province.trim(),
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        await updateProfessionalClient({
          id: viewClientId,
          legal_name: editCompanyForm.legalName.trim() || undefined,
          coc: editCompanyForm.coc.trim() || undefined,
          vat: editCompanyForm.vat.trim() || undefined,
          contact_person_name: contactPersonName || undefined,
          gender: editCompanyForm.gender || undefined,
          country_code: editCompanyForm.countryCode,
          phone: editCompanyForm.phone.trim(),
          email: email || undefined,
          detail_email: email || undefined,
          business_address: businessAddress || undefined,
          technical_note: editCompanyForm.technicalNote.trim() || undefined,
        }).unwrap();
      } else {
        const email = editIndividualForm.email.trim().toLowerCase();
        await updateProfessionalClient({
          id: viewClientId,
          first_name: editIndividualForm.firstName.trim() || undefined,
          last_name: editIndividualForm.lastName.trim() || undefined,
          gender: editIndividualForm.gender || undefined,
          date_of_birth: parseDobForApi(editIndividualForm.dob),
          country_code: editIndividualForm.countryCode,
          phone: editIndividualForm.phone.trim(),
          email: email || undefined,
          residential_address: editIndividualForm.residentialAddress.trim() || undefined,
          residential_area: editIndividualForm.residentialArea.trim() || undefined,
          technical_note: editIndividualForm.technicalNote.trim() || undefined,
        }).unwrap();
      }

      setClientDetailsMode("view");
      setSnackbar({ open: true, message: "Client Updated", severity: "success" });
      return true;
    } catch (error) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(error, "Unable to update client."),
        severity: "error",
      });
      return false;
    }
  }, [
    editCompanyForm,
    editIndividualForm,
    updateProfessionalClient,
    updateProfessionalClientTechnicalNote,
    viewClient,
    viewClientId,
  ]);

  const saveClientTechnicalNote = React.useCallback(
    async (note: string) => {
      if (!viewClientId) return;
      const trimmed = note.trim();
      const parsed = parseText(trimmed, {
        required: false,
        label: "Technical note",
        min: INPUT_LIMITS.notesMin,
        max: null,
      });
      if (!parsed.ok) {
        setSnackbar({
          open: true,
          message: parsed.error,
          severity: "error",
        });
        return;
      }

      try {
        await updateProfessionalClientTechnicalNote({
          id: viewClientId,
          technical_note: parsed.value,
        }).unwrap();
        setSnackbar({ open: true, message: "Technical note saved", severity: "success" });
      } catch (error) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, "Unable to save technical note."),
          severity: "error",
        });
      }
    },
    [updateProfessionalClientTechnicalNote, viewClientId],
  );
  return {
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
    blockClientId,
    setBlockClientId,
    deleteClientId,
    setDeleteClientId,
    viewClientId,
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
    indResidentialArea,
    setIndResidentialArea,
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
    resetNonMollureAddForm,
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
  };
}
