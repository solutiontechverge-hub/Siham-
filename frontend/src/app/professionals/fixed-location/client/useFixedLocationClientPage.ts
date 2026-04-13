"use client";

import * as React from "react";
import { mockClientRecords, mockMollureDirectory, type ClientRecord } from "./data/clientList";

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
  const [clients, setClients] = React.useState<ClientRecord[]>(() => mockClientRecords);
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("Alphabetical (A–Z)");

  const [sortAnchor, setSortAnchor] = React.useState<null | HTMLElement>(null);
  const [addAnchor, setAddAnchor] = React.useState<null | HTMLElement>(null);
  const [rowMenu, setRowMenu] = React.useState<{ id: string; anchor: HTMLElement } | null>(null);
  const [blockClientId, setBlockClientId] = React.useState<string | null>(null);
  const [deleteClientId, setDeleteClientId] = React.useState<string | null>(null);
  const [viewClientId, setViewClientId] = React.useState<string | null>(null);
  const [clientDetailsMode, setClientDetailsMode] = React.useState<"view" | "edit">("view");
  const [editCompanyForm, setEditCompanyForm] = React.useState<EditCompanyFormState>(emptyEditCompanyForm);
  const [editIndividualForm, setEditIndividualForm] = React.useState<EditIndividualFormState>(emptyEditIndividualForm);
  const [addMollureOpen, setAddMollureOpen] = React.useState(false);
  const [addNonMollureOpen, setAddNonMollureOpen] = React.useState(false);
  const [mollureSearch, setMollureSearch] = React.useState("");
  const [selectedMollureId, setSelectedMollureId] = React.useState<string | "">("");
  const [nonMollureClientType, setNonMollureClientType] = React.useState<"" | "Individual Client" | "Company Client">(
    "",
  );
  const [nonMollureStep, setNonMollureStep] = React.useState<"type" | "individual" | "company">("type");
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
    const digits = coPhone.replace(/\D/g, "");
    if (!digits) {
      next.phone = "Phone number is required";
    } else if (digits.length < 7 || digits.length > 15) {
      next.phone = "Enter a valid phone number (7–15 digits)";
    }
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
    } else if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dob)) {
      next.dob = "Use format MM/DD/YY or MM/DD/YYYY";
    } else {
      const [mm, dd, yy] = dob.split("/").map((x) => Number(x));
      const yFull = yy < 100 ? 2000 + yy : yy;
      const d = new Date(yFull, mm - 1, dd);
      if (d.getFullYear() !== yFull || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
        next.dob = "Enter a valid date";
      }
    }
    const digits = indPhone.replace(/\D/g, "");
    if (!digits) {
      next.phone = "Phone number is required";
    } else if (digits.length < 7 || digits.length > 15) {
      next.phone = "Enter a valid phone number (7–15 digits)";
    }
    const email = indEmail.trim();
    if (!email) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }
    setIndErrors(next);
    return Object.keys(next).length === 0;
  }, [indDob, indEmail, indFirstName, indGender, indLastName, indPhone]);

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
    const q = query.trim().toLowerCase();
    const base = !q ? clients : clients.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q));

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
  }, [clients, parseDmy, parseEuro, query, sortBy]);

  const viewClient = viewClientId ? clients.find((c) => c.id === viewClientId) : undefined;
  const blockClient = blockClientId ? clients.find((c) => c.id === blockClientId) : undefined;
  const deleteClient = deleteClientId ? clients.find((c) => c.id === deleteClientId) : undefined;

  const openClientDetailsEdit = React.useCallback(() => {
    if (!viewClient) return;
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
        technicalNote: "",
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
        technicalNote: "",
      });
    }
    setClientDetailsMode("edit");
  }, [viewClient]);

  const mollureResults = React.useMemo(() => {
    const q = mollureSearch.trim().toLowerCase();
    if (!q) return mockMollureDirectory;
    return mockMollureDirectory.filter((r) => `${r.email} ${r.name}`.toLowerCase().includes(q));
  }, [mollureSearch]);

  const resetNonMollureAddForm = React.useCallback(() => {
    setNonMollureClientType("");
    setNonMollureStep("type");
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
  }, []);

  const openNonMollureAddDrawer = React.useCallback(() => {
    resetNonMollureAddForm();
    setAddNonMollureOpen(true);
  }, [resetNonMollureAddForm]);

  const closeClientDetailsDrawer = React.useCallback(() => {
    setViewClientId(null);
    setClientDetailsMode("view");
  }, []);

  const confirmDeleteClient = React.useCallback(() => {
    if (!deleteClientId) return;
    const id = deleteClientId;
    setClients((prev) => prev.filter((c) => c.id !== id));
    setDeleteClientId(null);
    if (viewClientId === id) {
      setViewClientId(null);
      setClientDetailsMode("view");
    }
    if (blockClientId === id) setBlockClientId(null);
  }, [blockClientId, deleteClientId, viewClientId]);

  return {
    clients,
    setClients,
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
    resetNonMollureAddForm,
    openNonMollureAddDrawer,
    closeClientDetailsDrawer,
    confirmDeleteClient,
  };
}
