"use client";

import * as React from "react";

export type FixedLocationFormState = {
  profileName: string;
  about: string;
  keywordDraft: string;
  keywords: string[];

  // Fixed Location (business address)
  salonName: string;
  streetAddress: string;
  streetNumber: string;
  postalCode: string;
  province: string;
  municipality: string;

  serviceFor: {
    men: boolean;
    women: boolean;
    kids: boolean;
  };

  amenities: Record<string, boolean>;

  projectEnabled: boolean;
  projectInstructions: string;

  bookCategory: string;
  bookService: string;
  bookCombos: Array<{ id: string; a: string; b: string }>;
  bookComboInstructions: string;

  discountEnabled: boolean;
  discountValue: string;

  depositEnabled: boolean;
  depositValue: string;

  language: string;
  currency: string;
  timezone: string;

  notes: string;

  // Professional (User Info)
  professionalPhotoSrc: string;
  companyLegalName: string;
  companyCocNumber: string;
  companyVatNumber: string;
  companyStreet: string;
  companyStreetNumber: string;
  companyPostalCode: string;
  companyProvince: string;
  companyMunicipality: string;
  companyBusinessType: string;
  companyWebsite: string;
  socialInstagram: string;
  socialOther: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactPassword: string;
  contactRepeatPassword: string;

  // Price
  priceRangeFrom: string;
  priceRangeTo: string;
  prepaymentPercent: string;
  prepaymentInstructions: string;
  kilometerAllowance: string;
  kilometerAllowanceInstructions: string;
};

const initialState: FixedLocationFormState = {
  profileName: "",
  about: "",
  keywordDraft: "",
  keywords: [],

  salonName: "",
  streetAddress: "",
  streetNumber: "",
  postalCode: "",
  province: "",
  municipality: "",

  serviceFor: { men: true, women: true, kids: false },
  amenities: { parking: true, wifi: false, wheelchair: false, pets: false },

  projectEnabled: true,
  projectInstructions: "",

  bookCategory: "Lichaamsbehandeling",
  bookService: "Neck massage",
  bookCombos: [
    { id: "combo-1", a: "Lichaamsbehandeling", b: "Lichaamsbehandeling" },
    { id: "combo-2", a: "Lichaamsbehandeling", b: "Lichaamsbehandeling" },
  ],
  bookComboInstructions: "",

  discountEnabled: false,
  discountValue: "",

  depositEnabled: false,
  depositValue: "",

  language: "English",
  currency: "EUR",
  timezone: "GMT+1",

  notes: "",

  professionalPhotoSrc: "/professionals/hero.png",
  companyLegalName: "",
  companyCocNumber: "",
  companyVatNumber: "",
  companyStreet: "",
  companyStreetNumber: "",
  companyPostalCode: "",
  companyProvince: "",
  companyMunicipality: "",
  companyBusinessType: "",
  companyWebsite: "",
  socialInstagram: "",
  socialOther: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  contactPassword: "",
  contactRepeatPassword: "",

  priceRangeFrom: "Low",
  priceRangeTo: "Low",
  prepaymentPercent: "",
  prepaymentInstructions: "",
  kilometerAllowance: "",
  kilometerAllowanceInstructions: "",
};

export function useFixedLocationForm() {
  const [values, setValues] = React.useState<FixedLocationFormState>(initialState);

  const setField = React.useCallback(
    <K extends keyof FixedLocationFormState>(key: K, value: FixedLocationFormState[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setAmenity = React.useCallback((id: string, checked: boolean) => {
    setValues((prev) => ({ ...prev, amenities: { ...prev.amenities, [id]: checked } }));
  }, []);

  const setServiceFor = React.useCallback((id: "men" | "women" | "kids", checked: boolean) => {
    setValues((prev) => ({ ...prev, serviceFor: { ...prev.serviceFor, [id]: checked } }));
  }, []);

  const addKeyword = React.useCallback(() => {
    const next = values.keywordDraft.trim();
    if (!next) return;
    if (values.keywords.includes(next)) {
      setValues((prev) => ({ ...prev, keywordDraft: "" }));
      return;
    }
    setValues((prev) => ({
      ...prev,
      keywords: [...prev.keywords, next].slice(0, 3),
      keywordDraft: "",
    }));
  }, [values.keywordDraft, values.keywords]);

  const removeKeyword = React.useCallback((k: string) => {
    setValues((prev) => ({ ...prev, keywords: prev.keywords.filter((x) => x !== k) }));
  }, []);

  const reset = React.useCallback(() => setValues(initialState), []);

  return {
    values,
    setField,
    setAmenity,
    setServiceFor,
    addKeyword,
    removeKeyword,
    reset,
  };
}

