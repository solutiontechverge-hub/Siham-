import type { BusinessSetup, BusinessSetupListing } from "../../../store/services/businessApi";
import type { ProfessionalProfile } from "../../../store/services/profileApi";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";

type SetupSource = Pick<
  BusinessSetup,
  | "salon_name"
  | "business_name"
  | "fixed_location_address"
  | "fixed_location_street_number"
  | "fixed_location_postal_code"
  | "fixed_location_municipality"
  | "fixed_location_province"
  | "professional_phone"
  | "professional_legal_name"
  | "professional_vat_number"
  | "professional_coc_number"
  | "professional_street"
  | "professional_street_number"
  | "professional_postal_code"
  | "professional_municipality"
  | "professional_province"
> | null | undefined;

export function joinAddressParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function setupAddress(setup: SetupSource) {
  if (!setup) return "";
  return (
    joinAddressParts([
      setup.fixed_location_street_number,
      setup.fixed_location_address,
      setup.fixed_location_postal_code,
      setup.fixed_location_municipality,
      setup.fixed_location_province,
    ]) ||
    joinAddressParts([
      setup.professional_street_number,
      setup.professional_street,
      setup.professional_postal_code,
      setup.professional_municipality,
      setup.professional_province,
    ])
  );
}

function profileAddress(profile?: ProfessionalProfile | null) {
  if (!profile) return "";
  return joinAddressParts([
    profile.street_number,
    profile.street,
    profile.postal_code,
    profile.municipality,
    profile.province,
  ]);
}

function listingAddress(listing?: BusinessSetupListing | null) {
  if (!listing) return "";
  const fixed = listing.fixedLocation;
  const profile = listing.profileAddress;
  return (
    joinAddressParts([
      fixed?.streetNumber,
      fixed?.address,
      fixed?.postalCode,
      fixed?.municipality,
      fixed?.province,
    ]) ||
    joinAddressParts([
      profile?.streetNumber,
      profile?.street,
      profile?.postalCode,
      profile?.municipality,
      profile?.province,
    ])
  );
}

export function buildProfessionalBusinessOverride(input: {
  setup?: SetupSource;
  listing?: BusinessSetupListing | null;
  profile?: ProfessionalProfile | null;
  shopName?: string | null;
  phone?: string | null;
  address?: string | null;
  vatNumber?: string | null;
  cocNumber?: string | null;
}): FinanceProfessionalBusinessOverride {
  const shopName =
    input.shopName?.trim() ||
    input.setup?.salon_name?.trim() ||
    input.setup?.business_name?.trim() ||
    input.listing?.salonName?.trim() ||
    input.listing?.businessName?.trim() ||
    input.listing?.legalName?.trim() ||
    input.setup?.professional_legal_name?.trim() ||
    input.profile?.legal_name?.trim() ||
    "";
  const phone =
    input.phone?.trim() ||
    input.listing?.phone?.trim() ||
    input.setup?.professional_phone?.trim() ||
    input.profile?.phone?.trim() ||
    "";
  const address =
    input.address?.trim() ||
    setupAddress(input.setup) ||
    listingAddress(input.listing) ||
    profileAddress(input.profile);
  const vatNumber =
    input.vatNumber?.trim() ||
    input.listing?.vatNumber?.trim() ||
    input.setup?.professional_vat_number?.trim() ||
    input.profile?.vat_number?.trim() ||
    undefined;
  const cocNumber =
    input.cocNumber?.trim() ||
    input.listing?.cocNumber?.trim() ||
    input.setup?.professional_coc_number?.trim() ||
    input.profile?.ccc_number?.trim() ||
    undefined;

  return {
    legalName: shopName,
    shopName,
    phone,
    address,
    vatNumber,
    cocNumber,
  };
}
