/** Shared types for ProfessionalFixedLocationSetup (move-only extract). */

import type { FixedLocationPageData } from "../../../app/professionals/fixed-location/fixedLocation.data";
import type { FixedLocationFormState } from "../../../app/professionals/fixed-location/fixedLocation.use";
import type {
  ProfileResponse,
  UpdateProfilePayload,
} from "../../../store/services/profileApi";
import type {
  BusinessCategory,
  BusinessSetup,
  UpsertBusinessSetupPayload,
} from "../../../store/services/businessApi";
import {
  DESIRED_LOCATION_MUNICIPALITY_OPTIONS,
  NETHERLANDS_PROVINCE_OPTIONS as PROVINCE_OPTIONS,
} from "../../../data/netherlandsLocations.data";

export type ProfessionalFixedLocationSetupProps = {
  data: FixedLocationPageData;
  chrome?: boolean;
  profileData?: ProfileResponse | null;
  businessCategories?: BusinessCategory[];
  businessSetupData?: BusinessSetup | null;
  isProfileSaving?: boolean;
  isBusinessSetupSaving?: boolean;
  isBusinessMediaUploading?: boolean;
  onSaveProfessionalProfile?: (
    payload: UpdateProfilePayload,
  ) => Promise<ProfileResponse | void>;
  onSaveBusinessSetup?: (payload: UpsertBusinessSetupPayload) => Promise<void>;
  onUploadBusinessMedia?: (files: File[]) => Promise<string[]>;
};

export type BusinessSetupSectionId =
  | "profile"
  | "location"
  | "serviceFor"
  | "generalNotes"
  | "portfolio";

export type ProfileValidationField =
  | "companyLegalName"
  | "companyCocNumber"
  | "companyVatNumber"
  | "companyStreet"
  | "companyStreetNumber"
  | "companyPostalCode"
  | "contactFirstName"
  | "contactLastName"
  | "contactEmail"
  | "contactPhone"
  | "contactPhoneCode"
  | "contactPassword"
  | "contactRepeatPassword";

export type ProvinceKey = (typeof PROVINCE_OPTIONS)[number];

export type TeamService = {
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot5: string;
  slot6: string;
  slot7: string;
};

export type OfferingOption = "Fixed Location" | "Desired Location";
export type OfferingSelectOption = OfferingOption | "Both";

export type BusinessTemplateState = Pick<
  FixedLocationFormState,
  | "profileName"
  | "about"
  | "keywordDraft"
  | "keywords"
  | "salonName"
  | "streetAddress"
  | "streetNumber"
  | "postalCode"
  | "province"
  | "municipalities"
  | "serviceFor"
  | "amenities"
  | "projectEnabled"
  | "projectInstructions"
  | "bookCategory"
  | "bookService"
  | "bookCombos"
  | "bookComboInstructions"
  | "discountEnabled"
  | "discountValue"
  | "depositEnabled"
  | "depositValue"
  | "notes"
  | "priceRangeFrom"
  | "priceRangeTo"
  | "prepaymentPercent"
  | "prepaymentInstructions"
  | "kilometerAllowance"
  | "kilometerAllowanceInstructions"
>;

export type DesiredProvince = (typeof PROVINCE_OPTIONS)[number];
export type DesiredAreaRow = {
  id: string;
  province: DesiredProvince;
  municipality: string;
};

export { PROVINCE_OPTIONS, DESIRED_LOCATION_MUNICIPALITY_OPTIONS };
