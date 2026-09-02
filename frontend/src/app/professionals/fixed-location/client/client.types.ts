import type { ClientRecord } from "./data/clientList";
import { DEFAULT_DIAL_CODE } from "../../../../lib/phoneDefaults";

export type { ClientKind, ClientRecord } from "./data/clientList";
export type { ClientListFilterKey } from "./data/clientListFilters";

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

export type ClientDetailsMode = "view" | "edit";

export type NonMollureClientType = "" | "Individual Client" | "Company Client";

export type ClientListSortOption =
  | "Booking Dated (Current → Last)"
  | "Booking Dated (Last → Current)"
  | "Alphabetical (A–Z)"
  | "Alphabetical (Z–A)"
  | "Sales (Highest → Lowest)"
  | "Sales (Lowest → Highest)";

export type ClientRowMenuAction =
  | "View"
  | "Edit technical note"
  | "Block"
  | "Unblock"
  | "Delete";

export type AddClientMenuOption = "Mollure Client" | "Non-Mollure Client";

export type ClientRowMenuState = {
  id: string;
  anchor: HTMLElement;
} | null;

export type ClientSnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "info" | "error";
};

export type ClientPhoneErrors = {
  countryCode?: string;
  phone?: string;
};

export const emptyEditCompanyForm = (): EditCompanyFormState => ({
  legalName: "",
  coc: "",
  vat: "",
  contactFirst: "",
  contactLast: "",
  gender: "",
  countryCode: DEFAULT_DIAL_CODE,
  phone: "",
  street: "",
  streetNumber: "",
  postal: "",
  province: "",
  municipality: "",
  email: "",
  technicalNote: "",
});

export const emptyEditIndividualForm = (): EditIndividualFormState => ({
  firstName: "",
  lastName: "",
  gender: "",
  dob: "",
  countryCode: DEFAULT_DIAL_CODE,
  phone: "",
  email: "",
  residentialAddress: "",
  technicalNote: "",
});

export type ClientPageRecord = ClientRecord;
