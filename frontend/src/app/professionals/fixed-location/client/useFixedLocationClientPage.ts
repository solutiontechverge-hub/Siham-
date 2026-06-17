"use client";

import * as React from "react";
import { getPhoneValidationErrors } from "../../../../lib/phone-validation";
import { mockClientRecords, mockMollureDirectory, type ClientRecord } from "./data/clientList";
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
  matchesClientFilters,
  matchesClientSearch,
  type ClientListFilterKey,
} from "./data/clientListFilters";
import { mapApiProfessionalClientToRecord } from "./mapApiProfessionalClient";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { message?: string } }).data?.message === "string"
  ) {
    return (error as { data: { message: string } }).data.message;
  }
  return fallback;
}

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
export type EditCompanyFormState = {
  legalName: string;
  coc: string;
  vat: string;
  contactFirst: string;
  contactLast: string;
  gender: string;
  countryCode: string;
  phone: string;
  street: string;
  streetNumber: string;
  postal: string;
  province: string;
  municipality: string;
  email: string;
  technicalNote: string;
};

export const emptyEditCompanyForm = (): EditCompanyFormState => ({
  legalName: "",
  coc: "",
  vat: "",
  contactFirst: "",
  contactLast: "",
  gender: "",
  countryCode: "+44",
  phone: "",
  street: "",
  streetNumber: "",
  postal: "",
  province: "",
  municipality: "",
  email: "",
  technicalNote: "",
});

export type EditIndividualFormState = {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  countryCode: string;
  phone: string;
  email: string;
  residentialAddress: string;
  technicalNote: string;
};

export const emptyEditIndividualForm = (): EditIndividualFormState => ({
  firstName: "",
  lastName: "",
  gender: "",
  dob: "",
  countryCode: "+44",
  phone: "",
  email: "",
  residentialAddress: "",
  technicalNote: "",
});

export function useFixedLocationClientPage() {
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
  const [query, setQuery] = React.useState("");
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
  const [clientDetailsMode, setClientDetailsMode] = React.useState<"view" | "edit">("view");
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
  const [nonMollureClientType, setNonMollureClientType] = React.useState<"" | "Individual Client" | "Company Client">(
    "",
  );
  const [indFirstName, setIndFirstName] = React.useState("");
  const [indLastName, setIndLastName] = React.useState("");
  const [indGender, setIndGender] = React.useState("");
  const [indDob, setIndDob] = React.useState("");
  const [indCountryCode, setIndCountryCode] = React.useState("+44");
  const [indPhone, setIndPhone] = React.useState("");
  const [indEmail, setIndEmail] = React.useState("");
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
  const [coCountryCode, setCoCountryCode] = React.useState("+44");
  const [coPhone, setCoPhone] = React.useState("");
  const [coEmail, setCoEmail] = React.useState("");
  const [compErrors, setCompErrors] = React.useState<Partial<Record<string, string>>>({});
  const [editPhoneErrors, setEditPhoneErrors] = React.useState<{ countryCode?: string; phone?: string }>({});
  const [nonMollureTechnicalNote, setNonMollureTechnicalNote] = React.useState("");

  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "error";
  }>({ open: false, message: "", severity: "success" });

  const closeSnackbar = React.useCallback((_e?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbar((p) => ({ ...p, open: false }));
  }, []);

  const validateCompany = React.useCallback(() => {
    const next: Partial<Record<string, string>> = {};
    if (!coLegalName.trim()) next.legalName = "Legal name is required";
    if (!coCoc.trim()) next.coc = "COC is required";
    if (!coVat.trim()) next.vat = "VAT is required";
    if (!coContactFirst.trim()) next.contactFirst = "First name is required";
    if (!coContactLast.trim()) next.contactLast = "Last name is required";
    if (!coGender) next.gender = "Please select gender";
    if (!coStreet.trim()) next.street = "Street is required";
    if (!coStreetNumber.trim()) next.streetNumber = "Number is required";
    if (!coPostal.trim()) next.postal = "Postal code is required";
    if (!coProvince) next.province = "Please select province";
    if (!coMunicipality) next.municipality = "Please select municipality";
    const coPhoneErrors = getPhoneValidationErrors(coCountryCode, coPhone);
    if (coPhoneErrors.countryCode) next.countryCode = coPhoneErrors.countryCode;
    if (coPhoneErrors.phone) next.phone = coPhoneErrors.phone;
    const email = coEmail.trim();
    if (!email) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }
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
    const next: Partial<Record<string, string>> = {};
    if (!indFirstName.trim()) next.firstName = "First name is required";
    if (!indLastName.trim()) next.lastName = "Last name is required";
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
    const email = indEmail.trim();
    if (!email) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }
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
      (c) => matchesClientSearch(c, query) && matchesClientFilters(c, activeFilters),
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
    if (viewClient.tags.includes("Mollure")) {
      setSnackbar({
        open: true,
        severity: "info",
        message: "Mollure clients manage their own profile. Client details cannot be edited here.",
      });
      return;
    }
    const dialCodes = ["+971", "+92", "+91", "+49", "+44", "+1", "+81", "+61", "+31"];
    const splitPhone = (raw: string) => {
      for (const code of dialCodes) {
        if (raw.startsWith(code)) {
          return { countryCode: code, phone: raw.slice(code.length).trim() };
        }
      }
      return { countryCode: "+44", phone: raw };
    };
    if (viewClient.kind === "company") {
      const c = viewClient;
      const parts = (c.contactPersonName ?? "").trim().split(/\s+/);
      const { countryCode, phone } = splitPhone(c.phone.trim());
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
      const { countryCode, phone } = splitPhone(c.phone.trim());
      setEditIndividualForm({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" ") || "",
        gender: c.gender ?? "",
        dob: c.dateOfBirth ?? "",
        countryCode,
        phone,
        email: c.email,
        residentialAddress: c.residentialAddress ?? "",
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
    setIndCountryCode("+44");
    setIndPhone("");
    setIndEmail("");
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
    setCoCountryCode("+44");
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
          technical_note: nonMollureTechnicalNote.trim() || undefined,
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
          technical_note: nonMollureTechnicalNote.trim() || undefined,
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

    if (viewClient.tags.includes("Mollure")) {
      setSnackbar({
        open: true,
        severity: "info",
        message: "Mollure clients manage their own profile. Client details cannot be edited here.",
      });
      return false;
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
  }, [editCompanyForm, editIndividualForm, updateProfessionalClient, viewClient, viewClientId]);

  const saveClientTechnicalNote = React.useCallback(
    async (note: string) => {
      if (!viewClientId) return;
      const trimmed = note.trim();

      try {
        await updateProfessionalClientTechnicalNote({
          id: viewClientId,
          technical_note: trimmed,
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
