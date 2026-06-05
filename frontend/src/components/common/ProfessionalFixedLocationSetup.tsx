"use client";

import * as React from "react";
import Image from "next/image";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  Checkbox,
  Chip,
  Container,
  Divider,
  Popover,
  InputAdornment,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Switch,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import type { FixedLocationPageData } from "../../app/professionals/fixed-location/fixedLocation.data";
import { useFixedLocationForm, type FixedLocationFormState } from "../../app/professionals/fixed-location/fixedLocation.use";
import type {
  ProfessionalProfile,
  ProfileResponse,
  UpdateProfilePayload,
} from "../../store/services/profileApi";
import type {
  BusinessCategory,
  BusinessSetup,
  BusinessTeamMember,
  UpsertBusinessSetupRequest,
} from "../../store/services/businessApi";
import { useUpdateBusinessSetupActiveMutation } from "../../store/services/businessApi";
import { getApiErrorMessage } from "../../lib/api-error";
import { useSnackbar } from "./AppSnackbar";
import MollureFormField from "./MollureFormField";
import {
  MollureLabeledField,
  MollureLabeledPasswordField,
  MollureTextField,
} from "./MollureLabeledFields";
import ServiceCategoryBar from "./ServiceCategoryBar";
import {
  BUSINESS_MEDIA_MAX_COUNT,
  filterAllowedProfileImageFiles,
  isAllowedProfileImageFile,
  isPersistedMediaUrl,
  PROFILE_IMAGE_FILE_ACCEPT,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../lib/profileImageUpload";
import { Typography } from "../ui/typography";
import {
  BUSINESS_SERVICE_CATEGORY_CATALOG,
  buildServiceCategoryTabs,
  resolveCategoryTabId,
  resolveServiceCategoryStorageId,
  resolveServiceCategorySliderIconId,
  serviceMatchesCategoryTab,
  type ServiceCategorySliderIconId,
} from "../../data/businessServiceCategorySlider.data";
import {
  formatBusinessServicePriceLabel,
  normalizeBusinessServiceDiscountType,
  normalizeBusinessServicePriceType,
  parseEuroAmountString,
  parsePriceLabelForModal,
  hydrateMainAndSubservicesFromDetails,
  type BusinessMainServiceUi,
  type BusinessSubserviceUi,
} from "../../data/businessServiceModal.data";
import { useBusinessServiceModal } from "../../app/professionals/fixed-location/businessServiceModal.use";
import {
  useBusinessTeamMemberModal,
  type TeamMemberUi,
} from "../../app/professionals/fixed-location/businessTeamMemberModal.use";
import {
  buildTeamBusinessServiceRefs,
  TEAM_MEMBER_DRAFT_PREVIEW_ID,
} from "../../data/businessTeamMemberModal.data";
import BusinessServiceFormModal from "./BusinessServiceFormModal";
import BusinessTeamMemberFormModal from "./BusinessTeamMemberFormModal";

type ServiceDetailUiItem = BusinessSubserviceUi;

const mapServiceItemsToCategories = (items: ServiceDetailUiItem[]) =>
  items
    .filter((item) => item.serviceId && item.categoryId)
    .map((item) => ({
      category_id: String(item.categoryId),
      service_id: String(item.serviceId),
      amount:
        (parseEuroAmountString(item.priceAmount ?? "") ??
          Number(String(item.priceLabel).replace(/[^0-9.]/g, ""))) || 0,
      duration_label: (item.durationLabel ?? "").trim() || null,
    }));

function normalizePriceType(type: string | undefined): "fixed" | "from" {
  return normalizeBusinessServicePriceType(type);
}

function normalizeDiscountType(t: string | undefined): "fixed" | "percent" {
  return normalizeBusinessServiceDiscountType(t);
}

function hasServiceDiscount(it: ServiceDetailUiItem): boolean {
  const d = parseEuroAmountString(it.discountAmount ?? "");
  if (d === null || d <= 0) return false;
  const kind = normalizeDiscountType(it.discountType);
  if (kind === "percent" && d > 100) return false;
  return true;
}

function getServiceBaseAmountNumber(it: ServiceDetailUiItem): number | null {
  const fromField = parseEuroAmountString(it.priceAmount ?? "");
  if (fromField !== null) return fromField;
  const parsed = parsePriceLabelForModal(it.priceLabel);
  return parseEuroAmountString(parsed.amount);
}

function computeDiscountedBaseAmount(base: number, it: ServiceDetailUiItem): number {
  if (!hasServiceDiscount(it)) return base;
  const kind = normalizeDiscountType(it.discountType);
  const d = parseEuroAmountString(it.discountAmount ?? "") ?? 0;
  if (kind === "percent") return Math.max(0, base * (1 - Math.min(100, d) / 100));
  return Math.max(0, base - d);
}

function formatEuroDisplay(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded} €`;
  const s = rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${s} €`;
}

function formatPriceForCard(priceType: string, amount: number): string {
  const core = formatEuroDisplay(amount);
  if (normalizePriceType(priceType) === "from") return `Starting from ${core}`;
  return core;
}

/** Primary = price after discount when applicable; optional strikethrough = pre-discount. */
function getServiceCardPriceParts(it: ServiceDetailUiItem): { primary: string; strikethrough?: string } {
  const parsed = parsePriceLabelForModal(it.priceLabel);
  const pt = normalizePriceType(it.priceType ?? parsed.type);
  const base = getServiceBaseAmountNumber(it);
  if (base === null) {
    const fallback = it.priceLabel?.trim();
    return { primary: fallback && fallback !== "" ? fallback : "—" };
  }
  const originalStr = formatPriceForCard(pt, base);
  if (!hasServiceDiscount(it)) return { primary: originalStr };
  const finalAmount = computeDiscountedBaseAmount(base, it);
  const finalStr = formatPriceForCard(pt, finalAmount);
  if (finalStr === originalStr) return { primary: originalStr };
  return { primary: finalStr, strikethrough: originalStr };
}

export type ProfessionalFixedLocationSetupProps = {
  data: FixedLocationPageData;
  chrome?: boolean;
  profileData?: ProfileResponse | null;
  businessCategories?: BusinessCategory[];
  businessSetupData?: BusinessSetup | null;
  isProfileSaving?: boolean;
  isBusinessSetupSaving?: boolean;
  isBusinessMediaUploading?: boolean;
  onSaveProfessionalProfile?: (payload: UpdateProfilePayload) => Promise<ProfileResponse | void>;
  onSaveBusinessSetup?: (payload: UpsertBusinessSetupRequest) => Promise<void>;
  onUploadBusinessMedia?: (files: File[]) => Promise<string[]>;
};

const PROFESSIONAL_COUNTRY = "Netherlands";

const MUNICIPALITY_OPTIONS = [
  "Amsterdam",
  "Rotterdam",
  "The Hague",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Breda",
  "Nijmegen",
  "Haarlem",
  "Arnhem",
  "Zaanstad",
  "Amersfoort",
  "Apeldoorn",
  "Den Bosch",
  "Hoofddorp",
  "Maastricht",
  "Leiden",
  "Dordrecht",
] as const;

const BUSINESS_TYPE_OPTIONS = [
  { value: "salonOwner", label: "Salon Owner" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
] as const;

const professionalEditableFieldKeys = [
  "companyLegalName",
  "companyCocNumber",
  "companyVatNumber",
  "companyStreet",
  "companyStreetNumber",
  "companyPostalCode",
  "companyProvince",
  "companyMunicipality",
  "companyBusinessType",
  "companyWebsite",
  "socialInstagram",
  "socialOther",
  "contactFirstName",
  "contactLastName",
  "contactEmail",
  "contactPhone",
  "contactPassword",
  "contactRepeatPassword",
] as const;

type ProfessionalEditableDraft = Pick<FixedLocationFormState, (typeof professionalEditableFieldKeys)[number]>;

function getProfessionalProfileRecord(profileData: ProfileResponse | null) {
  if (!profileData || profileData.user_type !== "professional") {
    return null;
  }

  return profileData.profile as ProfessionalProfile | null;
}

function buildProfessionalDraftFromProfile(profileData: ProfileResponse | null): ProfessionalEditableDraft {
  const professionalProfile = getProfessionalProfileRecord(profileData);

  return {
    companyLegalName: professionalProfile?.legal_name || "",
    companyCocNumber: professionalProfile?.ccc_number || "",
    companyVatNumber: professionalProfile?.vat_number || "",
    companyStreet: professionalProfile?.street || "",
    companyStreetNumber: professionalProfile?.street_number || "",
    companyPostalCode: professionalProfile?.postal_code || "",
    companyProvince: professionalProfile?.province || "",
    companyMunicipality: professionalProfile?.municipality || "",
    companyBusinessType: professionalProfile?.business_type || "",
    companyWebsite: professionalProfile?.website || "",
    socialInstagram: professionalProfile?.instagram || "",
    socialOther: professionalProfile?.other_link || "",
    contactFirstName: professionalProfile?.contact_first_name || "",
    contactLastName: professionalProfile?.contact_last_name || "",
    contactEmail: profileData?.email || "",
    contactPhone: professionalProfile?.phone || "",
    contactPassword: "",
    contactRepeatPassword: "",
  };
}

function getProfessionalPhotoSrcFromProfile(profileData: ProfileResponse | null) {
  return getProfessionalProfileRecord(profileData)?.profile_picture || "/professionals/hero.png";
}

type BusinessSetupSectionId =
  | "profile"
  | "location"
  | "serviceFor"
  | "servicesDetails"
  | "manageTeam"
  | "generalNotes"
  | "price"
  | "policy"
  | "reschedulingPolicy"
  | "cancellationPolicy"
  | "noShowPolicy"
  | "portfolio";

/** Circular “+” add buttons — nudged left so they sit inside the container edge */
function addSoftIconButtonSx(m: ReturnType<typeof useTheme>["palette"]["mollure"], size: number) {
  return {
    width: size,
    height: size,
    borderRadius: "999px",
    bgcolor: m.addSoftBg,
    color: m.addSoftFg,
    border: `1px solid ${m.addSoftBorder}`,
    mr: 0.75,
    "&:hover": { bgcolor: m.addSoftBgHover },
    "&.Mui-disabled": {
      bgcolor: m.addSoftBg,
      color: alpha(m.addSoftFg, 0.5),
      border: `1px solid ${alpha(m.addSoftFg, 0.22)}`,
      opacity: 1,
    },
  } as const;
}

function SectionShell({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          px: 2.25,
          py: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {typeof title === "string" ? (
          <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.85), fontSize: 14 }}>
            {title}
          </Typography>
        ) : (
          title
        )}
        {action}
      </Box>
      <Divider />
      <Box sx={{ px: 2.25, py: 2.1 }}>{children}</Box>
    </Paper>
  );
}

function PrimaryMiniButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      disableElevation
      sx={{
        borderRadius: "6px",
        textTransform: "none",
        fontWeight: 700,
        fontSize: 12,
        minHeight: 30,
        px: 2,
        bgcolor: "primary.main",
        "&:hover": { bgcolor: "mollure.tealDark" },
      }}
    >
      {children}
    </Button>
  );
}

export default function ProfessionalFixedLocationSetup({
  data,
  chrome = true,
  profileData = null,
  businessCategories = [],
  businessSetupData = null,
  isProfileSaving = false,
  isBusinessSetupSaving = false,
  isBusinessMediaUploading = false,
  onSaveProfessionalProfile,
  onSaveBusinessSetup,
  onUploadBusinessMedia,
}: ProfessionalFixedLocationSetupProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();
  const [updateBusinessSetupActive, { isLoading: isBusinessProfileStatusSaving }] =
    useUpdateBusinessSetupActiveMutation();
  const [businessProfileMenuAnchor, setBusinessProfileMenuAnchor] = React.useState<null | HTMLElement>(null);

  const isBusinessProfileActive = businessSetupData?.is_active !== false;
  type ProfileValidationField =
    | "companyLegalName"
    | "contactFirstName"
    | "contactLastName"
    | "contactEmail"
    | "contactPassword"
    | "contactRepeatPassword";
  const [profileErrors, setProfileErrors] = React.useState<Partial<Record<ProfileValidationField, string>>>({});

  const isValidEmail = React.useCallback((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), []);
  const isValidName = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    // letters (including accented), spaces, apostrophes, and hyphens — no digits
    return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(trimmed);
  }, []);

  const {
    values,
    setField,
    setAmenity,
    setServiceFor,
    addKeyword,
    removeKeyword,
  } = useFixedLocationForm();
  const [savedProfessionalDraft, setSavedProfessionalDraft] = React.useState<ProfessionalEditableDraft>(() =>
    buildProfessionalDraftFromProfile(profileData),
  );
  const [savedProfessionalPhotoSrc, setSavedProfessionalPhotoSrc] = React.useState(() =>
    getProfessionalPhotoSrcFromProfile(profileData),
  );
  const [activeSubTab, setActiveSubTab] = React.useState<string>(
    data.subTabsActive,
  );
  const [activeServiceCategory, setActiveServiceCategory] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [mediaSlides, setMediaSlides] = React.useState<string[]>(["/professionals/hero.png"]);
  const [mediaIdx, setMediaIdx] = React.useState(0);

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const portfolioInputRef = React.useRef<HTMLInputElement | null>(null);
  const [portfolioItems, setPortfolioItems] = React.useState<Array<{ id: string; src: string }>>([
    { id: "pf-1", src: "/professionals/hero.png" },
    { id: "pf-2", src: "/professionals/hero.png" },
    { id: "pf-3", src: "/professionals/hero.png" },
    { id: "pf-4", src: "/professionals/hero.png" },
  ]);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = React.useState<Record<string, boolean>>({});
  const portfolioBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      for (const url of portfolioBlobUrlsRef.current) URL.revokeObjectURL(url);
      portfolioBlobUrlsRef.current = [];
    };
  }, []);

  const togglePortfolio = React.useCallback((id: string) => {
    setSelectedPortfolioIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const onUploadPortfolio = React.useCallback(() => {
    portfolioInputRef.current?.click();
  }, []);

  const onPortfolioFilesSelected = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { allowed, rejected } = filterAllowedProfileImageFiles(Array.from(e.target.files ?? []));
      if (rejected > 0 && !allowed.length) {
        showSnackbar({ severity: "error", message: PROFILE_IMAGE_INVALID_MESSAGE });
        e.target.value = "";
        return;
      }
      if (rejected > 0) {
        showSnackbar({
          severity: "warning",
          message: `${rejected} file(s) skipped. ${PROFILE_IMAGE_INVALID_MESSAGE}`,
        });
      }
      const next = allowed.map((f) => {
        const url = URL.createObjectURL(f);
        portfolioBlobUrlsRef.current.push(url);
        return { id: `pf-${Date.now()}-${Math.random().toString(16).slice(2)}`, src: url };
      });
      setPortfolioItems((prev) => [...next, ...prev]);
      e.target.value = "";
    },
    [showSnackbar],
  );

  const deleteSelectedPortfolio = React.useCallback(() => {
    const selected = new Set(Object.entries(selectedPortfolioIds).filter(([, v]) => v).map(([k]) => k));
    if (!selected.size) return;
    setPortfolioItems((prev) => prev.filter((it) => !selected.has(it.id)));
    setSelectedPortfolioIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const id of selected) delete next[id];
      return next;
    });
  }, [selectedPortfolioIds]);

  // ── Manage Team ──────────────────────────────────────────────────────────
  type TeamService = {
    slot1: string;
    slot2: string;
    slot3: string;
    slot4: string;
    slot5: string;
    slot6: string;
    slot7: string;
  };
  const TEAM_SERVICE_SLOT_KEYS: (keyof TeamService)[] = [
    "slot1",
    "slot2",
    "slot3",
    "slot4",
    "slot5",
    "slot6",
    "slot7",
  ];

  const allSubcategoryOptions = React.useMemo(
    () =>
      businessCategories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          value: String(subcategory.id),
          label: subcategory.title,
        })),
      ),
    [businessCategories],
  );

  const getSubcategoryLabel = React.useCallback(
    (serviceId: string) => {
      const v = String(serviceId ?? "").trim();
      if (!v) return "";
      return allSubcategoryOptions.find((o) => o.value === v)?.label ?? v;
    },
    [allSubcategoryOptions],
  );

  type TeamMemberServiceGroup = {
    categoryId: string;
    categoryTitle: string;
    subServices: Array<{ id: string; label: string }>;
  };

  const resolveCategoryDisplayTitle = React.useCallback((categoryTitle: string) => {
    const catalog = BUSINESS_SERVICE_CATEGORY_CATALOG.find(
      (entry) => resolveServiceCategorySliderIconId(categoryTitle) === entry.iconId,
    );
    return catalog?.label ?? categoryTitle;
  }, []);

  const getMemberAssignedServiceIds = React.useCallback((services: TeamService) => {
    return TEAM_SERVICE_SLOT_KEYS.map((key) => String(services[key] ?? "").trim()).filter(Boolean);
  }, []);

  const memberProvidesAllServices = React.useCallback(
    (services: TeamService) => {
      const allSubcategoryIds = businessCategories.flatMap((category) =>
        category.subcategories.map((sub) => String(sub.id)),
      );
      if (allSubcategoryIds.length === 0) return false;

      const assigned = new Set(getMemberAssignedServiceIds(services));
      if (assigned.size !== allSubcategoryIds.length) return false;

      return allSubcategoryIds.every((id) => assigned.has(id));
    },
    [businessCategories, getMemberAssignedServiceIds],
  );

  const defaultServices = React.useCallback(
    (assignedServices: BusinessTeamMember["assigned_services"] = []): TeamService => {
      const values = assignedServices.map((service) => String(service.service_id)).filter(Boolean);

      return {
        slot1: values[0] ?? "",
        slot2: values[1] ?? "",
        slot3: values[2] ?? "",
        slot4: values[3] ?? "",
        slot5: values[4] ?? "",
        slot6: values[5] ?? "",
        slot7: values[6] ?? "",
      };
    },
    [],
  );

  const [teamMembers, setTeamMembers] = React.useState<TeamMemberUi[]>([]);
  const [teamServiceMenu, setTeamServiceMenu] = React.useState<{
    anchorEl: HTMLElement;
    menuKey: string;
    groups?: Array<{ categoryTitle: string; items: Array<{ id: string; label: string }> }>;
    items?: Array<{ id: string; label: string }>;
  } | null>(null);

  const [featureTeamPublic, setFeatureTeamPublic] = React.useState(true);

  const addedBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      // Revoke any blob URLs we created to avoid memory leaks.
      for (const url of addedBlobUrlsRef.current) URL.revokeObjectURL(url);
      addedBlobUrlsRef.current = [];
    };
  }, []);

  const professionalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingProfessionalPhoto, setPendingProfessionalPhoto] = React.useState<File | null>(null);
  const onChooseProfessionalPhoto = React.useCallback(() => {
    professionalPhotoInputRef.current?.click();
  }, []);
  const onProfessionalPhotoSelected = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!isAllowedProfileImageFile(file)) {
        showSnackbar({ severity: "error", message: PROFILE_IMAGE_INVALID_MESSAGE });
        e.target.value = "";
        return;
      }
      const url = URL.createObjectURL(file);
      addedBlobUrlsRef.current.push(url);
      setPendingProfessionalPhoto(file);
      setField("professionalPhotoSrc", url);
      setIsProfessionalEditing(true);
      e.target.value = "";
    },
    [setField, showSnackbar],
  );

  const [isProfessionalEditing, setIsProfessionalEditing] = React.useState(false);
  const professionalFieldsDisabled = !isProfessionalEditing;
  const hydratedProfileRef = React.useRef<string | null>(null);
  const applyProfessionalDraft = React.useCallback(
    (draft: ProfessionalEditableDraft, photoSrc: string) => {
      setField("professionalPhotoSrc", photoSrc);
      setField("companyLegalName", draft.companyLegalName);
      setField("companyCocNumber", draft.companyCocNumber);
      setField("companyVatNumber", draft.companyVatNumber);
      setField("companyStreet", draft.companyStreet);
      setField("companyStreetNumber", draft.companyStreetNumber);
      setField("companyPostalCode", draft.companyPostalCode);
      setField("companyProvince", draft.companyProvince);
      setField("companyMunicipality", draft.companyMunicipality);
      setField("companyBusinessType", draft.companyBusinessType);
      setField("companyWebsite", draft.companyWebsite);
      setField("socialInstagram", draft.socialInstagram);
      setField("socialOther", draft.socialOther);
      setField("contactFirstName", draft.contactFirstName);
      setField("contactLastName", draft.contactLastName);
      setField("contactEmail", draft.contactEmail);
      setField("contactPhone", draft.contactPhone);
      setField("contactPassword", draft.contactPassword);
      setField("contactRepeatPassword", draft.contactRepeatPassword);
    },
    [setField],
  );
  const professionalDraft = React.useMemo<ProfessionalEditableDraft>(
    () => ({
      companyLegalName: values.companyLegalName,
      companyCocNumber: values.companyCocNumber,
      companyVatNumber: values.companyVatNumber,
      companyStreet: values.companyStreet,
      companyStreetNumber: values.companyStreetNumber,
      companyPostalCode: values.companyPostalCode,
      companyProvince: values.companyProvince,
      companyMunicipality: values.companyMunicipality,
      companyBusinessType: values.companyBusinessType,
      companyWebsite: values.companyWebsite,
      socialInstagram: values.socialInstagram,
      socialOther: values.socialOther,
      contactFirstName: values.contactFirstName,
      contactLastName: values.contactLastName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      contactPassword: values.contactPassword,
      contactRepeatPassword: values.contactRepeatPassword,
    }),
    [
      values.companyBusinessType,
      values.companyCocNumber,
      values.companyLegalName,
      values.companyMunicipality,
      values.companyPostalCode,
      values.companyProvince,
      values.companyStreet,
      values.companyStreetNumber,
      values.companyVatNumber,
      values.companyWebsite,
      values.contactEmail,
      values.contactFirstName,
      values.contactLastName,
      values.contactPassword,
      values.contactPhone,
      values.contactRepeatPassword,
      values.socialInstagram,
      values.socialOther,
    ],
  );
  const isProfessionalDirty = React.useMemo(
    () =>
      Boolean(pendingProfessionalPhoto) ||
      professionalEditableFieldKeys.some((key) => professionalDraft[key] !== savedProfessionalDraft[key]),
    [pendingProfessionalPhoto, professionalDraft, savedProfessionalDraft],
  );
  const cancelProfessionalEditing = React.useCallback(() => {
    setPendingProfessionalPhoto(null);
    applyProfessionalDraft(savedProfessionalDraft, savedProfessionalPhotoSrc);
    setProfileErrors({});
    setIsProfessionalEditing(false);
  }, [applyProfessionalDraft, savedProfessionalDraft, savedProfessionalPhotoSrc]);

  React.useEffect(() => {
    if (!profileData || profileData.user_type !== "professional") {
      return;
    }

    const hydrationKey = `${profileData.id}:${profileData.updated_at}`;
    if (hydratedProfileRef.current === hydrationKey) {
      return;
    }

    const nextProfessionalDraft = buildProfessionalDraftFromProfile(profileData);
    const nextProfessionalPhotoSrc = getProfessionalPhotoSrcFromProfile(profileData);

    setPendingProfessionalPhoto(null);
    applyProfessionalDraft(nextProfessionalDraft, nextProfessionalPhotoSrc);
    setSavedProfessionalDraft(nextProfessionalDraft);
    setSavedProfessionalPhotoSrc(nextProfessionalPhotoSrc);
    hydratedProfileRef.current = hydrationKey;
  }, [applyProfessionalDraft, profileData]);

  const toDisplayNumber = React.useCallback((value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    return String(value);
  }, []);

  const toTeamServicePayload = React.useCallback((services: TeamService) => {
    const orderedValues = [
      services.slot1,
      services.slot2,
      services.slot3,
      services.slot4,
      services.slot5,
      services.slot6,
      services.slot7,
    ].filter(Boolean);

    const seen = new Set<string>();

    return orderedValues
      .filter((value) => {
        if (seen.has(value)) {
          return false;
        }

        seen.add(value);
        return true;
      })
      .map((value) => {
        const matched = allSubcategoryOptions.find((option) => option.value === value);
        return {
          service_id: String(value),
          title: matched?.label ?? null,
        };
      });
  }, [allSubcategoryOptions]);
  const [isBusinessPublishEnabled, setIsBusinessPublishEnabled] = React.useState(false);
  const [editingBusinessSections, setEditingBusinessSections] = React.useState<Set<BusinessSetupSectionId>>(
    () => new Set(),
  );
  const startBusinessSectionEdit = (sectionId: BusinessSetupSectionId) => {
    setEditingBusinessSections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  };
  const isBusinessSectionEditing = (sectionId: BusinessSetupSectionId) => editingBusinessSections.has(sectionId);
  const isBusinessSectionDisabled = (sectionId: BusinessSetupSectionId) =>
    isBusinessSetupSaving || !editingBusinessSections.has(sectionId);
  const businessFormDisabled = isBusinessSetupSaving;
  const locationDisabled = isBusinessSectionDisabled("location");
  const profileDisabled = isBusinessSectionDisabled("profile");
  const serviceForDisabled = isBusinessSectionDisabled("serviceFor");
  const servicesDetailsDisabled = isBusinessSectionDisabled("servicesDetails");
  const manageTeamDisabled = isBusinessSectionDisabled("manageTeam");
  const generalNotesDisabled = isBusinessSectionDisabled("generalNotes");
  const priceDisabled = isBusinessSectionDisabled("price");
  const policyDisabled = isBusinessSectionDisabled("policy");
  const reschedulingPolicyDisabled = isBusinessSectionDisabled("reschedulingPolicy");
  const cancellationPolicyDisabled = isBusinessSectionDisabled("cancellationPolicy");
  const noShowPolicyDisabled = isBusinessSectionDisabled("noShowPolicy");
  const portfolioDisabled = isBusinessSectionDisabled("portfolio");
  const templateOptions = React.useMemo(() => ["Fixed Location", "Desired Location"] as const, []);
  type OfferingOption = (typeof templateOptions)[number];
  type OfferingSelectOption = OfferingOption | "Both";
  const offeringSelectOptions = React.useMemo(
    () => ["Fixed Location", "Desired Location", "Both"] as const,
    [],
  );
  const [businessOfferingSelect, setBusinessOfferingSelect] =
    React.useState<OfferingSelectOption>("Fixed Location");
  const [activeBusinessTemplate, setActiveBusinessTemplate] = React.useState<OfferingOption>("Fixed Location");
  const [useSameInfoForBothTemplates, setUseSameInfoForBothTemplates] = React.useState(false);
  const isBothOffering = businessOfferingSelect === "Both";
  const isFixedTemplateView =
    businessOfferingSelect === "Fixed Location" || (isBothOffering && activeBusinessTemplate === "Fixed Location");
  const isDesiredTemplateView =
    businessOfferingSelect === "Desired Location" || (isBothOffering && activeBusinessTemplate === "Desired Location");

  const showFixedLocationSection = isFixedTemplateView;
  const showDesiredLocationSection = isDesiredTemplateView;
  const showKilometerAllowance = isDesiredTemplateView;
  const showBookServices = isFixedTemplateView;
  const showProjectSection = isDesiredTemplateView;

  const locationSectionTitle = React.useMemo(() => {
    if (businessOfferingSelect === "Desired Location") return "Desired Location";
    if (businessOfferingSelect === "Fixed Location") return "Fixed Location";
    return data.location.title;
  }, [businessOfferingSelect, data.location.title]);

  const visibleLocationCards = React.useMemo((): OfferingOption[] => {
    if (businessOfferingSelect === "Both") return ["Fixed Location", "Desired Location"];
    if (businessOfferingSelect === "Fixed Location") return ["Fixed Location"];
    return ["Desired Location"];
  }, [businessOfferingSelect]);

  type BusinessTemplateState = Pick<
    typeof values,
    | "profileName"
    | "about"
    | "keywordDraft"
    | "keywords"
    | "salonName"
    | "streetAddress"
    | "streetNumber"
    | "postalCode"
    | "province"
    | "municipality"
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

  const sharedTemplateSyncFields = React.useMemo(
    () =>
      [
        "profileName",
        "about",
        "keywordDraft",
        "keywords",
        "serviceFor",
        "amenities",
        "salonName",
        "streetAddress",
        "streetNumber",
        "postalCode",
        "province",
        "municipality",
      ] as const,
    [],
  );

  type SharedTemplateSyncField = (typeof sharedTemplateSyncFields)[number];

  const isSharedTemplateSyncField = React.useCallback(
    (key: keyof BusinessTemplateState): key is SharedTemplateSyncField =>
      (sharedTemplateSyncFields as readonly string[]).includes(key),
    [sharedTemplateSyncFields],
  );

  const pickSharedTemplateFields = React.useCallback(
    (state: BusinessTemplateState): Pick<BusinessTemplateState, SharedTemplateSyncField> => {
      const result = {} as Pick<BusinessTemplateState, SharedTemplateSyncField>;
      for (const key of sharedTemplateSyncFields) {
        result[key] = state[key];
      }
      return result;
    },
    [sharedTemplateSyncFields],
  );

  const syncOtherTemplateFromSource = React.useCallback(
    (source: BusinessTemplateState, sourceTemplate: OfferingOption) => {
      const patch = pickSharedTemplateFields(source);
      if (sourceTemplate === "Fixed Location") {
        setDesiredBusiness((prev) => ({ ...prev, ...patch }));
      } else {
        for (const key of sharedTemplateSyncFields) {
          setField(key as keyof FixedLocationFormState, patch[key] as never);
        }
      }
    },
    [pickSharedTemplateFields, setField, sharedTemplateSyncFields],
  );

  const getCurrentBusinessState = React.useCallback((): BusinessTemplateState => {
    // fixed template is backed by the main form `values`
    return {
      profileName: values.profileName,
      about: values.about,
      keywordDraft: values.keywordDraft,
      keywords: values.keywords,
      salonName: values.salonName,
      streetAddress: values.streetAddress,
      streetNumber: values.streetNumber,
      postalCode: values.postalCode,
      province: values.province,
      municipality: values.municipality,
      serviceFor: values.serviceFor,
      amenities: values.amenities,
      projectEnabled: values.projectEnabled,
      projectInstructions: values.projectInstructions,
      bookCategory: values.bookCategory,
      bookService: values.bookService,
      bookCombos: values.bookCombos,
      bookComboInstructions: values.bookComboInstructions,
      discountEnabled: values.discountEnabled,
      discountValue: values.discountValue,
      depositEnabled: values.depositEnabled,
      depositValue: values.depositValue,
      notes: values.notes,
      priceRangeFrom: values.priceRangeFrom,
      priceRangeTo: values.priceRangeTo,
      prepaymentPercent: values.prepaymentPercent,
      prepaymentInstructions: values.prepaymentInstructions,
      kilometerAllowance: values.kilometerAllowance,
      kilometerAllowanceInstructions: values.kilometerAllowanceInstructions,
    };
  }, [values]);

  const [desiredBusiness, setDesiredBusiness] = React.useState<BusinessTemplateState>(() => getCurrentBusinessState());

  const biz = activeBusinessTemplate === "Fixed Location" ? getCurrentBusinessState() : desiredBusiness;

  const fixedBiz = getCurrentBusinessState();
  const setFixedBizField = React.useCallback(
    <K extends keyof BusinessTemplateState>(key: K, value: BusinessTemplateState[K]) => {
      setIsBusinessPublishEnabled(true);
      setField(key as any, value as any);
      if (useSameInfoForBothTemplates && isBothOffering && isSharedTemplateSyncField(key)) {
        setDesiredBusiness((prev) => ({ ...prev, [key]: value }));
      }
    },
    [isBothOffering, isSharedTemplateSyncField, setField, useSameInfoForBothTemplates],
  );

  const desiredProvinceOptions = React.useMemo(
    () =>
      [
        "Drenthe",
        "Flevoland",
        "Friesland",
        "Gelderland",
        "Groningen",
        "Limburg",
        "Noord-Brabant",
        "Noord-Holland",
        "Overijssel",
        "Utrecht",
        "Zeeland",
        "Zuid-Holland",
      ] as const,
    [],
  );
  type DesiredProvince = (typeof desiredProvinceOptions)[number];
  type DesiredAreaRow = { id: string; province: DesiredProvince; municipality: string };
  const desiredMunicipalityByProvince = React.useMemo(() => {
    const base = ["Amsterdam", "Rotterdam", "Utrecht", "Haarlem", "Groningen", "Eindhoven"];
    return desiredProvinceOptions.reduce((acc, p) => {
      acc[p] = base;
      return acc;
    }, {} as Record<(typeof desiredProvinceOptions)[number], string[]>);
  }, [desiredProvinceOptions]);

  type ProvinceKey = (typeof desiredProvinceOptions)[number];
  const toProvinceKey = React.useCallback(
    (province: string | null | undefined): ProvinceKey => {
      const p = String(province ?? "").trim();
      return (desiredProvinceOptions as readonly string[]).includes(p) ? (p as ProvinceKey) : "Noord-Holland";
    },
    [desiredProvinceOptions],
  );

  const [desiredAreaMode, setDesiredAreaMode] = React.useState<"Specific areas only" | "All Netherlands">(
    "Specific areas only",
  );
  const [desiredProvinceDraft, setDesiredProvinceDraft] = React.useState<(typeof desiredProvinceOptions)[number]>(
    "Noord-Holland",
  );
  const [desiredMunicipalityDraft, setDesiredMunicipalityDraft] = React.useState<string>("");
  const [desiredAreas, setDesiredAreas] = React.useState<DesiredAreaRow[]>([]);

  const desiredAreasByProvince = React.useMemo(() => {
    const order: DesiredProvince[] = [];
    const rowsByProvince = new Map<DesiredProvince, DesiredAreaRow[]>();
    for (const row of desiredAreas) {
      if (!rowsByProvince.has(row.province)) {
        order.push(row.province);
        rowsByProvince.set(row.province, []);
      }
      rowsByProvince.get(row.province)!.push(row);
    }
    return order.map((province) => ({
      province,
      rows: rowsByProvince.get(province)!,
      label:
        rowsByProvince.get(province)!.length === 1
          ? province
          : `${province}(${rowsByProvince.get(province)!.length})`,
    }));
  }, [desiredAreas]);

  const addDesiredArea = React.useCallback(() => {
    if (!desiredProvinceDraft || !desiredMunicipalityDraft.trim()) return;
    const exists = desiredAreas.some(
      (r) => r.province === desiredProvinceDraft && r.municipality === desiredMunicipalityDraft,
    );
    if (exists) return;
    setIsBusinessPublishEnabled(true);
    setDesiredAreas((prev) => [
      ...prev,
      {
        id: `dl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        province: desiredProvinceDraft,
        municipality: desiredMunicipalityDraft,
      },
    ]);
  }, [desiredAreas, desiredMunicipalityDraft, desiredProvinceDraft]);

  const removeDesiredProvinceGroup = React.useCallback((province: DesiredProvince) => {
    setIsBusinessPublishEnabled(true);
    setDesiredAreas((prev) => prev.filter((r) => r.province !== province));
  }, []);

  const fixedProvinceKey = React.useMemo<(typeof desiredProvinceOptions)[number]>(() => {
    const province = fixedBiz.province;
    return (desiredProvinceOptions as readonly string[]).includes(province)
      ? (province as (typeof desiredProvinceOptions)[number])
      : "Noord-Holland";
  }, [fixedBiz.province, desiredProvinceOptions]);

  const fixedLocationForm = (
    <Grid container spacing={1.6}>
      <Grid item xs={12}>
        <MollureFormField
          label="Salon Name"
          placeholder="Makelush"
          value={fixedBiz.salonName}
          onChange={(e) => setFixedBizField("salonName", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: theme.palette.text.primary, mt: 0.5 }}>
          Address
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <MollureFormField
          label="Street Address"
          placeholder="Street Address"
          value={fixedBiz.streetAddress}
          onChange={(e) => setFixedBizField("streetAddress", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <MollureFormField
          label="Street Number"
          placeholder="Street Number"
          value={fixedBiz.streetNumber}
          onChange={(e) => setFixedBizField("streetNumber", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          label="Postal code"
          placeholder="Postal code"
          value={fixedBiz.postalCode}
          onChange={(e) => setFixedBizField("postalCode", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          select
          label="Province"
          value={fixedBiz.province}
          onChange={(e) => setFixedBizField("province", e.target.value)}
          disabled={locationDisabled}
        >
          <MenuItem value="">Province</MenuItem>
          {desiredProvinceOptions.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </MollureFormField>
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          select
          label="Municipality"
          value={fixedBiz.municipality}
          onChange={(e) => setFixedBizField("municipality", e.target.value)}
          disabled={locationDisabled}
        >
          <MenuItem value="">Municipality</MenuItem>
          {((desiredMunicipalityByProvince as Record<string, string[]>)[fixedBiz.province || "Noord-Holland"] ?? []).map((o: string) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </MollureFormField>
      </Grid>
    </Grid>
  );

  const desiredLocationForm = (
    <Grid container spacing={1.6}>
      <Grid item xs={12}>
        <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62), fontWeight: 500, mb: 0.6 }}>
          We are offering services
        </Typography>
        <MollureFormField
          select
          value={desiredAreaMode}
          onChange={(e) => {
            const mode = e.target.value as "Specific areas only" | "All Netherlands";
            setDesiredAreaMode(mode);
            if (mode === "All Netherlands") {
              setDesiredProvinceDraft("");
              setDesiredMunicipalityDraft("");
            }
          }}
          disabled={locationDisabled}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        >
          <MenuItem value="Specific areas only">Specific areas only</MenuItem>
          <MenuItem value="All Netherlands">All Netherlands</MenuItem>
        </MollureFormField>
      </Grid>

      {desiredAreaMode === "Specific areas only" ? (
        <>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.6 }}>
              Province
            </Typography>
            <MollureFormField
              select
              value={desiredProvinceDraft}
              onChange={(e) => {
                const p = e.target.value as (typeof desiredProvinceOptions)[number];
                setDesiredProvinceDraft(p);
                setDesiredMunicipalityDraft("");
              }}
              disabled={locationDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            >
              {desiredProvinceOptions.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </MollureFormField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.6 }}>
                  Municipality
                </Typography>
                <MollureFormField
                  select
                  value={desiredMunicipalityDraft}
                  onChange={(e) => setDesiredMunicipalityDraft(e.target.value)}
                  disabled={locationDisabled}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  <MenuItem value="">
                    <Typography component="span" sx={{ fontSize: 13, color: alpha(m.navy, 0.45) }}>
                      Select municipality
                    </Typography>
                  </MenuItem>
                  {(desiredMunicipalityByProvince[desiredProvinceDraft] ?? []).map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>
              </Box>
              <IconButton
                onClick={addDesiredArea}
                disabled={locationDisabled || !desiredMunicipalityDraft.trim()}
                sx={addSoftIconButtonSx(m, 36)}
                aria-label="Add desired area"
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>
          </Grid>
        </>
      ) : null}

      {desiredAreaMode === "Specific areas only" ? (
        <Grid item xs={12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(220px, 1fr))" },
              gap: 1.1,
              alignItems: "start",
              width: "100%",
            }}
          >
            {desiredAreasByProvince.map(({ province, label }) => (
                <Box
                  key={province}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      flex: "1 1 auto",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      minHeight: 36,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "10px",
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(m.navy, 0.12)}`,
                      color: alpha(m.navy, 0.88),
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <Typography component="span" noWrap sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
                      {label}
                    </Typography>
                    <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, color: alpha(m.navy, 0.38), flexShrink: 0 }} />
                  </Box>
                  <IconButton
                    onClick={() => removeDesiredProvinceGroup(province)}
                    disabled={locationDisabled}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.04),
                      "&:hover": { bgcolor: alpha(m.navy, 0.08) },
                    }}
                    aria-label={`Remove ${province} from desired areas`}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
                  </IconButton>
                </Box>
              ))}
          </Box>
        </Grid>
      ) : null}
    </Grid>
  );

  const setBizField = React.useCallback(
    <K extends keyof BusinessTemplateState>(key: K, value: BusinessTemplateState[K]) => {
      setIsBusinessPublishEnabled(true);

      if (activeBusinessTemplate === "Fixed Location") {
        setField(key as any, value as any);
        if (useSameInfoForBothTemplates && isBothOffering && isSharedTemplateSyncField(key)) {
          setDesiredBusiness((prev) => ({ ...prev, [key]: value }));
        }
      } else {
        setDesiredBusiness((p) => ({ ...p, [key]: value }));
        if (useSameInfoForBothTemplates && isBothOffering && isSharedTemplateSyncField(key)) {
          setField(key as any, value as any);
        }
      }
    },
    [activeBusinessTemplate, isBothOffering, isSharedTemplateSyncField, setField, useSameInfoForBothTemplates],
  );

  const addBizKeyword = React.useCallback(() => {
    const next = biz.keywordDraft.trim();
    if (!next) return;
    if (biz.keywords.includes(next)) {
      setBizField("keywordDraft", "");
      return;
    }
    setBizField("keywords", [...biz.keywords, next].slice(0, 3));
    setBizField("keywordDraft", "");
  }, [biz.keywordDraft, biz.keywords, setBizField]);

  const removeBizKeyword = React.useCallback(
    (k: string) => {
      setBizField("keywords", biz.keywords.filter((x) => x !== k));
    },
    [biz.keywords, setBizField],
  );

  const setBizServiceFor = React.useCallback(
    (id: "men" | "women" | "kids", checked: boolean) => {
      setBizField("serviceFor", { ...biz.serviceFor, [id]: checked });
    },
    [biz.serviceFor, setBizField],
  );

  const onSaveBusinessProfile = React.useCallback(() => {
    setIsBusinessPublishEnabled(true);
  }, []);

  const servicesFixedRef = React.useRef<ServiceDetailUiItem[]>([]);
  const servicesDesiredRef = React.useRef<ServiceDetailUiItem[]>([]);

  const onToggleBusinessProfileActive = React.useCallback(async () => {
    const nextActive = !isBusinessProfileActive;
    setBusinessProfileMenuAnchor(null);

    try {
      const result = await updateBusinessSetupActive({ is_active: nextActive }).unwrap();
      showSnackbar({
        severity: "success",
        message:
          result.message ||
          (nextActive ? "Business profile activated successfully." : "Business profile deactivated successfully."),
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to update business profile status."),
      });
    }
  }, [isBusinessProfileActive, showSnackbar, updateBusinessSetupActive]);

  const toPersistedTeamMemberId = React.useCallback((id: string) => {
    const normalized = String(id ?? "").trim();
    if (!normalized || normalized.startsWith("tm-")) {
      return undefined;
    }

    return normalized;
  }, []);

  const buildBusinessSetupPayload = React.useCallback(
    (members: TeamMemberUi[]): UpsertBusinessSetupRequest => {
      const locationModeMap: Record<OfferingSelectOption, UpsertBusinessSetupRequest["location_mode"]> = {
        "Fixed Location": "fixed",
        "Desired Location": "desired",
        Both: "both",
      };
      const sourceBiz = businessOfferingSelect === "Desired Location" ? desiredBusiness : fixedBiz;
      const serviceItems =
        businessOfferingSelect === "Desired Location" ? servicesDesiredRef.current : servicesFixedRef.current;
      const desiredAreaText =
        desiredAreaMode === "All Netherlands"
          ? "All Netherlands"
          : desiredAreas.map((area) => area.municipality).filter(Boolean).join(", ");
      const desiredProvinceText =
        desiredAreaMode === "All Netherlands"
          ? "All Netherlands"
          : Array.from(new Set(desiredAreas.map((area) => area.province).filter(Boolean))).join(", ");

      return {
        location_mode: locationModeMap[businessOfferingSelect],
        business_name: sourceBiz.profileName,
        business_about: sourceBiz.about,
        business_keywords: sourceBiz.keywords,
        business_media: mediaSlides.filter(isPersistedMediaUrl).slice(0, BUSINESS_MEDIA_MAX_COUNT),
        salon_name: fixedBiz.salonName,
        fixed_location_address: fixedBiz.streetAddress,
        fixed_location_street_number: fixedBiz.streetNumber,
        fixed_location_postal_code: fixedBiz.postalCode,
        fixed_location_province: fixedBiz.province,
        fixed_location_municipality: fixedBiz.municipality,
        service_for: Object.entries(sourceBiz.serviceFor)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key),
        service_categories: mapServiceItemsToCategories(serviceItems),
        project: sourceBiz.projectEnabled ? sourceBiz.projectInstructions : "",
        book_service_notes: sourceBiz.bookComboInstructions,
        book_service_combinations: sourceBiz.bookCombos
          .map((combo) => {
            const category = businessCategories.find((item) => String(item.id) === combo.categoryId);
            const service = category
              ? category.subcategories.find((item) => String(item.id) === combo.serviceId)
              : businessCategories
                  .flatMap((item) => item.subcategories)
                  .find((item) => String(item.id) === combo.serviceId);
            const categoryId = String(combo.categoryId ?? "").trim();
            const serviceId = String(combo.serviceId ?? "").trim();

            if (!categoryId || !serviceId) {
              return null;
            }

            return {
              category_id: categoryId,
              category_title: category?.title ?? null,
              service_id: serviceId,
              service_title: service?.title ?? null,
            };
          })
          .filter((combo): combo is NonNullable<typeof combo> => combo !== null),
        additional_notes: sourceBiz.notes,
        price_range: [sourceBiz.priceRangeFrom, sourceBiz.priceRangeTo].filter(Boolean).join(" - "),
        prepayment_percentage: Number(sourceBiz.prepaymentPercent) || null,
        prepayment_instruction: sourceBiz.prepaymentInstructions,
        kilometer_allowance: Number(sourceBiz.kilometerAllowance) || null,
        kilometer_allowance_instruction: sourceBiz.kilometerAllowanceInstructions,
        response_time_hours: Number(values.policyResponseHours) || null,
        response_time_minutes: Number(values.policyResponseMinutes) || null,
        policy_custom_instruction: values.policyInstructions,
        appointment_before_hours: Number(values.rescheduleMinimumHours) || null,
        appointment_before_minutes: Number(values.rescheduleMinimumMinutes) || null,
        late_reschedule_fee_percentage: Number(values.rescheduleLateFeePercent) || null,
        late_reschedule_policy_instruction: values.rescheduleInstructions,
        cancellation_before_hours: Number(values.cancelMinimumHours) || null,
        cancellation_before_minutes: Number(values.cancelMinimumMinutes) || null,
        late_cancellation_fee_percentage: Number(values.cancelLateFeePercent) || null,
        cancellation_policy_instruction: values.cancelInstructions,
        no_show_fee_percentage: Number(values.noShowFeePercent) || null,
        no_show_fee_instruction: values.noShowInstructions,
        desired_location_area: desiredAreaText,
        desired_location_province: desiredProvinceText,
        desired_location_services: serviceItems.map((item) => item.name),
        team_members: members.map((member, index) => ({
          id: toPersistedTeamMemberId(member.id),
          full_name: member.name,
          role: member.role,
          profile_photo: member.photoSrc.startsWith("blob:") ? null : member.photoSrc,
          assigned_services: toTeamServicePayload(member.services),
          display_order: index + 1,
        })),
      };
    },
    [
      businessOfferingSelect,
      businessCategories,
      desiredAreaMode,
      desiredAreas,
      desiredBusiness,
      fixedBiz,
      mediaSlides,
      toPersistedTeamMemberId,
      toTeamServicePayload,
      values,
    ],
  );

  const saveBusinessSetupData = React.useCallback(async () => {
    if (!onSaveBusinessSetup) return;
    await onSaveBusinessSetup(buildBusinessSetupPayload(teamMembers));
  }, [buildBusinessSetupPayload, onSaveBusinessSetup, teamMembers]);

  const onPublishBusinessSetup = React.useCallback(async () => {
    if (!onSaveBusinessSetup) {
      setIsBusinessPublishEnabled(false);
      return;
    }

    try {
      await onSaveBusinessSetup(buildBusinessSetupPayload(teamMembers));
      await updateBusinessSetupActive({ is_active: true }).unwrap();
      setIsBusinessPublishEnabled(false);
      setEditingBusinessSections(new Set());
      showSnackbar({ severity: "success", message: "Changes published and are now live." });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to publish changes."),
      });
    }
  }, [buildBusinessSetupPayload, onSaveBusinessSetup, showSnackbar, teamMembers, updateBusinessSetupActive]);

  const saveBusinessSection = React.useCallback(
    async (sectionId: BusinessSetupSectionId) => {
      if (!onSaveBusinessSetup) {
        setEditingBusinessSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
        return;
      }

      try {
        await saveBusinessSetupData();
        setEditingBusinessSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
        setIsBusinessPublishEnabled(true);
        showSnackbar({ severity: "success", message: "Changes saved." });
      } catch (error) {
        showSnackbar({
          severity: "error",
          message: getApiErrorMessage(error, "Unable to save changes."),
        });
      }
    },
    [onSaveBusinessSetup, saveBusinessSetupData, showSnackbar],
  );

  const onSwitchActiveBusinessTemplate = React.useCallback(
    (opt: OfferingOption) => {
      if (!isBusinessProfileActive) {
        void onToggleBusinessProfileActive();
      }
      setActiveBusinessTemplate(opt);
    },
    [isBusinessProfileActive, onToggleBusinessProfileActive],
  );

  // ── Services (template-aware) + drawer ────────────────────────────────────
  const initialServiceItems = React.useMemo(
    () => [] as ServiceDetailUiItem[],
    [],
  );
  const [servicesFixed, setServicesFixed] = React.useState<ServiceDetailUiItem[]>(() => initialServiceItems);
  const [servicesDesired, setServicesDesired] = React.useState<ServiceDetailUiItem[]>(() => initialServiceItems);
  const [mainServicesFixed, setMainServicesFixed] = React.useState<BusinessMainServiceUi[]>([]);
  const [mainServicesDesired, setMainServicesDesired] = React.useState<BusinessMainServiceUi[]>([]);
  servicesFixedRef.current = servicesFixed;
  servicesDesiredRef.current = servicesDesired;
  React.useEffect(() => {
    setServicesFixed(initialServiceItems);
    setServicesDesired(initialServiceItems);
  }, [initialServiceItems]);

  const hydratedBusinessRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!businessSetupData) {
      return;
    }

    const hydrationKey = `${businessSetupData.id}:${businessSetupData.updated_at}`;
    if (hydratedBusinessRef.current === hydrationKey) {
      return;
    }

    const modeMap: Record<BusinessSetup["location_mode"], OfferingSelectOption> = {
      fixed: "Fixed Location",
      desired: "Desired Location",
      both: "Both",
    };

    const nextOffering = modeMap[businessSetupData.location_mode];
    setBusinessOfferingSelect(nextOffering);
    setActiveBusinessTemplate(nextOffering === "Both" ? "Fixed Location" : nextOffering);
    const savedBookCombos = (businessSetupData.book_service_combinations || []).map((combo, index) => ({
      id: `combo-${combo.category_id}-${combo.service_id}-${index}`,
      categoryId: String(combo.category_id),
      serviceId: String(combo.service_id),
    }));
    const savedPriceRange = businessSetupData.price_range ? businessSetupData.price_range.split("-") : [];
    const hydratedTemplateState: BusinessTemplateState = {
      profileName: businessSetupData.business_name || "",
      about: businessSetupData.business_about || "",
      keywordDraft: "",
      keywords: businessSetupData.business_keywords || [],
      salonName: businessSetupData.salon_name || "",
      streetAddress: businessSetupData.fixed_location_address || "",
      streetNumber: businessSetupData.fixed_location_street_number || "",
      postalCode: businessSetupData.fixed_location_postal_code || "",
      province: businessSetupData.fixed_location_province || "",
      municipality: businessSetupData.fixed_location_municipality || "",
      serviceFor: {
        men: (businessSetupData.service_for || []).includes("men"),
        women: (businessSetupData.service_for || []).includes("women"),
        kids: (businessSetupData.service_for || []).includes("kids"),
      },
      amenities: values.amenities,
      projectEnabled: Boolean(businessSetupData.project),
      projectInstructions: businessSetupData.project || "",
      bookCategory: savedBookCombos[0]?.categoryId || "",
      bookService: savedBookCombos[0]?.serviceId || "",
      bookCombos: savedBookCombos,
      bookComboInstructions: businessSetupData.book_service_notes || "",
      discountEnabled: values.discountEnabled,
      discountValue: values.discountValue,
      depositEnabled: values.depositEnabled,
      depositValue: values.depositValue,
      notes: businessSetupData.additional_notes || "",
      priceRangeFrom: savedPriceRange[0]?.trim() || "",
      priceRangeTo: savedPriceRange[1]?.trim() || "",
      prepaymentPercent: toDisplayNumber(businessSetupData.prepayment_percentage),
      prepaymentInstructions: businessSetupData.prepayment_instruction || "",
      kilometerAllowance: toDisplayNumber(businessSetupData.kilometer_allowance),
      kilometerAllowanceInstructions: businessSetupData.kilometer_allowance_instruction || "",
    };

    Object.entries(hydratedTemplateState).forEach(([key, value]) => {
      setField(key as any, value as any);
    });
    setDesiredBusiness(hydratedTemplateState);
    setField("policyResponseHours", toDisplayNumber(businessSetupData.response_time_hours));
    setField("policyResponseMinutes", toDisplayNumber(businessSetupData.response_time_minutes));
    setField("policyInstructions", businessSetupData.policy_custom_instruction || "");
    setField("rescheduleMinimumHours", toDisplayNumber(businessSetupData.appointment_before_hours));
    setField("rescheduleMinimumMinutes", toDisplayNumber(businessSetupData.appointment_before_minutes));
    setField("rescheduleLateFeePercent", toDisplayNumber(businessSetupData.late_reschedule_fee_percentage));
    setField("rescheduleInstructions", businessSetupData.late_reschedule_policy_instruction || "");
    setField("cancelMinimumHours", toDisplayNumber(businessSetupData.cancellation_before_hours));
    setField("cancelMinimumMinutes", toDisplayNumber(businessSetupData.cancellation_before_minutes));
    setField("cancelLateFeePercent", toDisplayNumber(businessSetupData.late_cancellation_fee_percentage));
    setField("cancelInstructions", businessSetupData.cancellation_policy_instruction || "");
    setField("noShowFeePercent", toDisplayNumber(businessSetupData.no_show_fee_percentage));
    setField("noShowInstructions", businessSetupData.no_show_fee_instruction || "");

    const nextMediaSlides =
      businessSetupData.business_media && businessSetupData.business_media.length > 0
        ? businessSetupData.business_media
        : ["/professionals/hero.png"];
    setMediaSlides(nextMediaSlides);
    setMediaIdx(0);

    const categoryDurationByServiceId = new Map(
      (businessSetupData.service_categories ?? []).map((entry) => [
        entry.service_id,
        typeof entry.duration_label === "string" ? entry.duration_label.trim() : "",
      ]),
    );

    const categoryTitleById = new Map(
      businessCategories.map((category) => [String(category.id), category.title]),
    );
    const savedServices: BusinessSubserviceUi[] = businessSetupData.service_details.map((item) => {
      const rawPrice = item.price;
      const priceStr =
        rawPrice !== null && rawPrice !== undefined && String(rawPrice).trim() !== ""
          ? (() => {
              const n = String(rawPrice).trim().replace(/\s*€\s*$/i, "").trim();
              return n.includes("€") ? n : `${n} €`;
            })()
          : "";
      const durationLabel = categoryDurationByServiceId.get(item.service_id) || "";
      return {
        id: String(item.service_id),
        parentServiceId: "",
        categoryId: String(item.category_id),
        serviceId: item.service_id,
        name: item.service_title || "",
        discountInfo: "",
        durationFrom: "",
        durationTo: "",
        categoryTitle: item.category_title || undefined,
        priceLabel: priceStr,
        durationLabel: durationLabel || undefined,
      };
    });
    const hydratedServices = hydrateMainAndSubservicesFromDetails(savedServices, categoryTitleById);
    setMainServicesFixed(hydratedServices.mains);
    setMainServicesDesired(hydratedServices.mains);
    setServicesFixed(hydratedServices.subs);
    setServicesDesired(hydratedServices.subs);

    if (businessSetupData.team_members.length > 0) {
      setTeamMembers(
        businessSetupData.team_members.map((member) => ({
          id: String(member.id ?? `tm-${member.display_order}`),
          name: member.full_name,
          role: member.role,
          photoSrc: member.profile_photo || "/professionals/hero.png",
          rating: 4.5,
          reviewsLabel: "(0 Reviews)",
          services: defaultServices(member.assigned_services),
        })),
      );
    } else {
      setTeamMembers([]);
    }

    hydratedBusinessRef.current = hydrationKey;
  }, [
    businessCategories,
    businessSetupData,
    defaultServices,
    setField,
    toDisplayNumber,
    values.amenities,
    values.depositEnabled,
    values.depositValue,
    values.discountEnabled,
    values.discountValue,
  ]);

  const activeServices = activeBusinessTemplate === "Fixed Location" ? servicesFixed : servicesDesired;
  const activeMainServices = activeBusinessTemplate === "Fixed Location" ? mainServicesFixed : mainServicesDesired;
  const setActiveServices = React.useCallback(
    (value: React.SetStateAction<ServiceDetailUiItem[]>) => {
      setIsBusinessPublishEnabled(true);
      if (activeBusinessTemplate === "Fixed Location") setServicesFixed(value);
      else setServicesDesired(value);
    },
    [activeBusinessTemplate],
  );
  const setActiveMainServices = React.useCallback(
    (value: React.SetStateAction<BusinessMainServiceUi[]>) => {
      setIsBusinessPublishEnabled(true);
      if (activeBusinessTemplate === "Fixed Location") setMainServicesFixed(value);
      else setMainServicesDesired(value);
    },
    [activeBusinessTemplate],
  );

  const serviceCategoryTabs = React.useMemo(
    () => buildServiceCategoryTabs(businessCategories),
    [businessCategories],
  );

  const teamBusinessServices = React.useMemo(
    () => buildTeamBusinessServiceRefs(activeServices),
    [activeServices],
  );

  const buildTeamMemberServiceGroups = React.useCallback(
    (services: TeamService): TeamMemberServiceGroup[] => {
      const groups = new Map<string, TeamMemberServiceGroup>();

      const appendToGroup = (categoryId: string, categoryTitle: string, serviceId: string, label: string) => {
        const existing = groups.get(categoryId);
        if (existing) {
          if (!existing.subServices.some((item) => item.id === serviceId)) {
            existing.subServices.push({ id: serviceId, label });
          }
          return;
        }
        groups.set(categoryId, {
          categoryId,
          categoryTitle: resolveCategoryDisplayTitle(categoryTitle),
          subServices: [{ id: serviceId, label }],
        });
      };

      for (const serviceId of getMemberAssignedServiceIds(services)) {
        let matched = false;

        for (const category of businessCategories) {
          const subcategory = category.subcategories.find((sub) => String(sub.id) === serviceId);
          if (!subcategory) continue;
          appendToGroup(String(category.id), category.title, serviceId, subcategory.title);
          matched = true;
          break;
        }

        if (!matched) {
          const setupService = activeServices.find((item) => String(item.serviceId) === serviceId);
          if (setupService) {
            const categoryTitle =
              businessCategories.find((c) => String(c.id) === String(setupService.categoryId))?.title ??
              setupService.categoryTitle ??
              String(setupService.categoryId);
            appendToGroup(String(setupService.categoryId), categoryTitle, serviceId, setupService.name);
            matched = true;
          }
        }

        if (!matched) {
          const option = allSubcategoryOptions.find((item) => item.value === serviceId);
          if (option) {
            for (const category of businessCategories) {
              const subcategory = category.subcategories.find((sub) => String(sub.id) === serviceId);
              if (!subcategory) continue;
              appendToGroup(String(category.id), category.title, serviceId, option.label);
              matched = true;
              break;
            }
          }
        }
      }

      return Array.from(groups.values());
    },
    [
      activeServices,
      allSubcategoryOptions,
      businessCategories,
      getMemberAssignedServiceIds,
      resolveCategoryDisplayTitle,
    ],
  );

  const teamMemberModal = useBusinessTeamMemberModal({
    businessCategories,
    businessServices: teamBusinessServices,
    categoryTabs: serviceCategoryTabs,
    teamMembers,
    setTeamMembers,
    onAfterLocalSave: () => setTeamServiceMenu(null),
    onMarkUnpublished: () => setIsBusinessPublishEnabled(true),
    onSaveBusinessSetup: onSaveBusinessSetup
      ? async (members) => {
          await onSaveBusinessSetup(buildBusinessSetupPayload(members));
          setIsBusinessPublishEnabled(true);
        }
      : undefined,
  });

  const [expandedServiceDetailIds, setExpandedServiceDetailIds] = React.useState<Record<string, boolean>>({});
  const [expandedMainServiceIds, setExpandedMainServiceIds] = React.useState<Record<string, boolean>>({});

  const serviceModal = useBusinessServiceModal({
    businessCategories,
    mainServices: activeMainServices,
    subservices: activeServices,
    setMainServices: setActiveMainServices,
    setSubservices: setActiveServices,
    onPersistChange: () => setIsBusinessPublishEnabled(true),
    onMainServiceCreated: (mainId) => {
      setExpandedMainServiceIds((prev) => ({ ...prev, [mainId]: true }));
    },
  });

  const openAddServiceForCategory = React.useCallback(
    (categoryId: string) => {
      const storageId = resolveServiceCategoryStorageId(
        categoryId,
        serviceCategoryTabs,
        businessCategories,
      );
      if (!storageId) return;
      serviceModal.openAddService(storageId);
    },
    [businessCategories, serviceCategoryTabs, serviceModal],
  );

  const openAddService = React.useCallback(() => {
    if (!activeServiceCategory || activeServiceCategory === "all") return;
    openAddServiceForCategory(activeServiceCategory);
  }, [activeServiceCategory, openAddServiceForCategory]);

  const toggleServiceDetailExpand = React.useCallback((id: string) => {
    setExpandedServiceDetailIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleMainServiceExpand = React.useCallback((id: string) => {
    setExpandedMainServiceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderServiceDetailRow = React.useCallback(
    (it: ServiceDetailUiItem) => {
      const expanded = Boolean(expandedServiceDetailIds[it.id]);
      const cardPrice = getServiceCardPriceParts(it);
      return (
        <Paper
          key={it.id}
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.35,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.92), lineHeight: 1.25 }}>
                {it.name?.trim() ? it.name : "Untitled service"}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.35, flexWrap: "wrap" }}>
                {it.durationLabel ? (
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: alpha(m.navy, 0.62) }}>
                    {it.durationLabel}
                  </Typography>
                ) : null}
                <Typography
                  component="button"
                  onClick={() => serviceModal.openEditSubservice(it)}
                  sx={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    p: 0,
                    m: 0,
                    font: "inherit",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Edit
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ ml: { xs: 0, sm: "auto" } }}>
              <Stack alignItems="flex-end" spacing={0.15} sx={{ minWidth: 56 }}>
                {cardPrice.strikethrough ? (
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: alpha(m.navy, 0.42),
                      textDecoration: "line-through",
                      lineHeight: 1.15,
                    }}
                  >
                    {cardPrice.strikethrough}
                  </Typography>
                ) : null}
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.92),
                    textAlign: "right",
                    lineHeight: 1.2,
                  }}
                >
                  {cardPrice.primary}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                <IconButton
                  size="small"
                  aria-label="Edit service"
                  onClick={() => serviceModal.openEditSubservice(it)}
                  disabled={servicesDetailsDisabled}
                  sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
                >
                  <EditRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Delete service"
                  onClick={() => serviceModal.deleteSubservice(it.id)}
                  disabled={servicesDetailsDisabled}
                  sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={expanded ? "Collapse details" : "Expand details"}
                  onClick={() => toggleServiceDetailExpand(it.id)}
                  sx={{
                    width: 32,
                    height: 32,
                    color: alpha(m.navy, 0.45),
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      );
    },
    [servicesDetailsDisabled, expandedServiceDetailIds, m.navy, serviceModal, toggleServiceDetailExpand],
  );

  const renderMainServiceRow = React.useCallback(
    (main: BusinessMainServiceUi) => {
      const expanded = Boolean(expandedMainServiceIds[main.id]);
      const childSubs = serviceModal.subservicesByParent.get(main.id) ?? [];
      const cardPrice = getServiceCardPriceParts({
        id: main.id,
        parentServiceId: "",
        categoryId: main.categoryId,
        serviceId: "",
        name: main.name,
        discountInfo: "",
        durationFrom: "",
        durationTo: "",
        priceLabel: formatBusinessServicePriceLabel(main.priceType, main.priceAmount),
        priceType: main.priceType,
        priceAmount: main.priceAmount,
        discountType: main.discountType,
        discountAmount: main.discountAmount,
      });

      return (
        <Paper
          key={main.id}
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            bgcolor: "#fff",
            px: 1.75,
            py: 1.35,
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: alpha(m.navy, 0.92), lineHeight: 1.25 }}>
                  {main.name?.trim() ? main.name : "Untitled service"}
                </Typography>
                {main.serviceInfo ? (
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: alpha(m.navy, 0.55), mt: 0.35 }}>
                    {main.serviceInfo}
                  </Typography>
                ) : null}
              </Box>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ ml: { xs: 0, sm: "auto" } }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: alpha(m.navy, 0.92) }}>{cardPrice.primary}</Typography>
                <IconButton
                  size="small"
                  aria-label="Edit service"
                  onClick={() => serviceModal.openEditService(main)}
                  disabled={servicesDetailsDisabled}
                  sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
                >
                  <EditRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Delete service"
                  onClick={() => serviceModal.deleteMainService(main.id)}
                  disabled={servicesDetailsDisabled}
                  sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={expanded ? "Collapse subservices" : "Expand subservices"}
                  onClick={() => toggleMainServiceExpand(main.id)}
                  sx={{
                    width: 32,
                    height: 32,
                    color: alpha(m.navy, 0.45),
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Stack>
            </Stack>

            {expanded ? (
              <Stack spacing={1} sx={{ pl: { xs: 0, sm: 1 }, pt: 0.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.62) }}>Subservices</Typography>
                  <IconButton
                    size="small"
                    onClick={() => serviceModal.openAddSubservice(main.categoryId, main.id)}
                    disabled={servicesDetailsDisabled}
                    aria-label="Add subservice"
                    sx={addSoftIconButtonSx(m, 32)}
                  >
                    <AddRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
                {childSubs.length === 0 ? (
                  <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.5) }}>No subservices yet.</Typography>
                ) : (
                  childSubs.map((sub) => renderServiceDetailRow(sub))
                )}
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      );
    },
    [
      servicesDetailsDisabled,
      expandedMainServiceIds,
      m,
      renderServiceDetailRow,
      serviceModal,
      toggleMainServiceExpand,
    ],
  );

  const professionalForm = (
    <Stack spacing={2.1}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          onClick={onChooseProfessionalPhoto}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChooseProfessionalPhoto();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Choose profile picture"
          sx={{
            width: 90,
            height: 90,
            borderRadius: "999px",
            overflow: "hidden",
            bgcolor: alpha(m.navy, 0.06),
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            flex: "0 0 auto",
            position: "relative",
            cursor: "pointer",
            outline: "none",
            "&:hover": {
              borderColor: alpha(m.navy, 0.18),
              bgcolor: alpha(m.navy, 0.08),
            },
            "&:focus-visible": {
              boxShadow: `0 0 0 3px ${alpha(m.teal, 0.35)}`,
            },
          }}
        >
          {/^https?:\/\//i.test(values.professionalPhotoSrc) ? (
            <Box
              component="img"
              src={values.professionalPhotoSrc}
              alt="Profile"
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          ) : (
            <Box sx={{ width: "100%", height: "100%", pointerEvents: "none", position: "relative" }}>
              <Image
                src={values.professionalPhotoSrc}
                alt="Profile"
                width={90}
                height={90}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          )}
          <IconButton
            size="small"
            onClick={(ev) => {
              ev.stopPropagation();
              onChooseProfessionalPhoto();
            }}
            sx={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 32,
              height: 32,
              bgcolor: "#F2F4F7",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              boxShadow: `0 10px 24px ${alpha(m.navy, 0.12)}`,
              "&:hover": { bgcolor: "#EEF2F6" },
            }}
            aria-label="Change profile picture"
          >
            <EditOutlinedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.65) }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 24, fontWeight: 600, color: alpha(m.navy, 0.82) }}>
          Profile Picture
        </Typography>
        <Box sx={{ flex: 1 }} />
        <input
          ref={professionalPhotoInputRef}
          type="file"
          accept={PROFILE_IMAGE_FILE_ACCEPT}
          hidden
          onChange={onProfessionalPhotoSelected}
        />
      </Stack>

      <Box>
        <Typography variant="subHeading" sx={{ mb: 1 }}>
          Company Information
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.10) }} />
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <MollureLabeledField
              fieldLabel="Legal Name"
              labelPlacement="inCell"
              placeholder="e.g. Jane"
              value={values.companyLegalName}
              onChange={(e) => {
                setField("companyLegalName", e.target.value);
                setProfileErrors((prev) => (prev.companyLegalName ? { ...prev, companyLegalName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.companyLegalName)}
              helperText={profileErrors.companyLegalName}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="COC number"
              labelPlacement="inCell"
              placeholder="12345678"
              value={values.companyCocNumber}
              onChange={(e) => setField("companyCocNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="VAT number"
              labelPlacement="inCell"
              placeholder="NL123456789B01"
              value={values.companyVatNumber}
              onChange={(e) => setField("companyVatNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
              Business Address
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <MollureLabeledField
              fieldLabel="Country"
              labelPlacement="inCell"
              value={PROFESSIONAL_COUNTRY}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Street"
              labelPlacement="inCell"
              placeholder="e.g. Damrak"
              value={values.companyStreet}
              onChange={(e) => setField("companyStreet", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Number"
              labelPlacement="inCell"
              placeholder="e.g. 1"
              value={values.companyStreetNumber}
              onChange={(e) => setField("companyStreetNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Postal Code"
              labelPlacement="inCell"
              placeholder="e.g. 1012 LG"
              value={values.companyPostalCode}
              onChange={(e) => setField("companyPostalCode", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Municipality"
              labelPlacement="inCell"
              select
              value={values.companyMunicipality}
              onChange={(e) => setField("companyMunicipality", e.target.value)}
              disabled={professionalFieldsDisabled}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em>Select Municipality</em>
              </MenuItem>
              {MUNICIPALITY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </MollureLabeledField>
          </Grid>
          <Grid item xs={12}>
            <MollureLabeledField
              fieldLabel="Select Business Type"
              labelPlacement="inCell"
              select
              value={values.companyBusinessType}
              onChange={(e) => setField("companyBusinessType", e.target.value)}
              disabled={professionalFieldsDisabled}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em>Select Business Type</em>
              </MenuItem>
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MollureLabeledField>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82), mb: 1 }}>
          Portfolio links
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.10) }} />
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <MollureTextField
              placeholder="Website"
              value={values.companyWebsite}
              onChange={(e) => setField("companyWebsite", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureTextField
              placeholder="Instagram"
              value={values.socialInstagram}
              onChange={(e) => setField("socialInstagram", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureTextField
              placeholder="Other"
              value={values.socialOther}
              onChange={(e) => setField("socialOther", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="subHeading" sx={{ mb: 1 }}>
          Contact Person
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.10) }} />
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="First Name"
              labelPlacement="inCell"
              placeholder="e.g. Jane"
              value={values.contactFirstName}
              onChange={(e) => {
                setField("contactFirstName", e.target.value);
                setProfileErrors((prev) => (prev.contactFirstName ? { ...prev, contactFirstName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactFirstName)}
              helperText={profileErrors.contactFirstName}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Last Name"
              labelPlacement="inCell"
              placeholder="e.g. Doe"
              value={values.contactLastName}
              onChange={(e) => {
                setField("contactLastName", e.target.value);
                setProfileErrors((prev) => (prev.contactLastName ? { ...prev, contactLastName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactLastName)}
              helperText={profileErrors.contactLastName}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Email"
              labelPlacement="inCell"
              placeholder="you@gmail.com"
              value={values.contactEmail}
              inputProps={{ readOnly: true }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactEmail)}
              helperText={profileErrors.contactEmail}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledField
              fieldLabel="Phone number"
              labelPlacement="inCell"
              placeholder="Enter phone number"
              value={values.contactPhone}
              onChange={(e) => setField("contactPhone", e.target.value)}
              disabled={professionalFieldsDisabled}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledPasswordField
              fieldLabel="Password"
              labelPlacement="inCell"
              placeholder="Enter password"
              value={values.contactPassword}
              onChange={(e) => {
                setField("contactPassword", e.target.value);
                setProfileErrors((prev) => (prev.contactPassword ? { ...prev, contactPassword: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactPassword)}
              helperText={profileErrors.contactPassword}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureLabeledPasswordField
              fieldLabel="Repeat password"
              labelPlacement="inCell"
              placeholder="Confirm password"
              value={values.contactRepeatPassword}
              onChange={(e) => {
                setField("contactRepeatPassword", e.target.value);
                setProfileErrors((prev) =>
                  prev.contactRepeatPassword ? { ...prev, contactRepeatPassword: undefined } : prev,
                );
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactRepeatPassword)}
              helperText={profileErrors.contactRepeatPassword}
              required
            />
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );

  React.useEffect(() => {
    if (mediaIdx > mediaSlides.length - 1) setMediaIdx(Math.max(0, mediaSlides.length - 1));
  }, [mediaIdx, mediaSlides.length]);

  const onUploadMedia = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFilesSelected = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { allowed, rejected } = filterAllowedProfileImageFiles(Array.from(e.target.files ?? []));
      if (rejected > 0 && !allowed.length) {
        showSnackbar({ severity: "error", message: PROFILE_IMAGE_INVALID_MESSAGE });
        e.target.value = "";
        return;
      }
      if (rejected > 0) {
        showSnackbar({
          severity: "warning",
          message: `${rejected} file(s) skipped. ${PROFILE_IMAGE_INVALID_MESSAGE}`,
        });
      }

      const persistedCount = mediaSlides.filter(isPersistedMediaUrl).length;
      const slotsLeft = BUSINESS_MEDIA_MAX_COUNT - persistedCount;
      if (slotsLeft <= 0) {
        showSnackbar({
          severity: "error",
          message: `You can upload at most ${BUSINESS_MEDIA_MAX_COUNT} images.`,
        });
        e.target.value = "";
        return;
      }

      const toUpload = allowed.slice(0, slotsLeft);
      if (!toUpload.length) {
        e.target.value = "";
        return;
      }

      if (allowed.length > slotsLeft) {
        showSnackbar({
          severity: "warning",
          message: `Only ${slotsLeft} more image(s) can be added (max ${BUSINESS_MEDIA_MAX_COUNT}).`,
        });
      }

      if (!onUploadBusinessMedia) {
        showSnackbar({ severity: "error", message: "Media upload is not available." });
        e.target.value = "";
        return;
      }

      try {
        const uploaded = await onUploadBusinessMedia(toUpload);
        const nextSlides = uploaded.length > 0 ? uploaded : ["/professionals/hero.png"];
        setMediaSlides(nextSlides);
        setMediaIdx(0);
      } catch {
        // Parent shows error snackbar.
      } finally {
        e.target.value = "";
      }
    },
    [mediaSlides, onUploadBusinessMedia, showSnackbar],
  );

  const groupedAllMainServiceSections = React.useMemo(() => {
    const by = new Map<string, BusinessMainServiceUi[]>();
    for (const main of activeMainServices) {
      const key = String(main.categoryId ?? "").trim();
      if (!key) continue;
      const list = by.get(key) ?? [];
      list.push(main);
      by.set(key, list);
    }

    const titleFor = (categoryId: string) =>
      businessCategories.find((c) => String(c.id) === categoryId)?.title ??
      serviceCategoryTabs.find((t) => t.id === categoryId)?.label ??
      `Category ${categoryId}`;

    const sections: Array<{ categoryId: string; title: string; mains: BusinessMainServiceUi[] }> = [];
    const seen = new Set<string>();

    for (const t of serviceCategoryTabs) {
      if (t.id === "all") continue;
      const mains = activeMainServices.filter((main) =>
        serviceMatchesCategoryTab(
          { categoryId: main.categoryId } as ServiceDetailUiItem,
          t.id,
          serviceCategoryTabs,
          businessCategories,
        ),
      );
      if (!mains.length) continue;
      sections.push({ categoryId: t.id, title: titleFor(t.id), mains });
      seen.add(t.id);
    }

    for (const [categoryId, mains] of by.entries()) {
      if (seen.has(categoryId) || !mains.length) continue;
      sections.push({ categoryId, title: titleFor(categoryId), mains });
      seen.add(categoryId);
    }

    return sections;
  }, [activeMainServices, businessCategories, serviceCategoryTabs]);

  const activeCategoryMains = React.useMemo(
    () =>
      activeMainServices.filter((main) =>
        serviceMatchesCategoryTab(
          { categoryId: main.categoryId } as ServiceDetailUiItem,
          activeServiceCategory,
          serviceCategoryTabs,
          businessCategories,
        ),
      ),
    [activeMainServices, activeServiceCategory, businessCategories, serviceCategoryTabs],
  );


  const bookingCategoryOptions = React.useMemo(
    () =>
      businessCategories.map((category) => ({
        value: String(category.id),
        label: category.title,
      })),
    [businessCategories],
  );

  /** Booking combo row selects are read-only until that row’s edit (pencil) is toggled on. */
  const [bookingComboEditId, setBookingComboEditId] = React.useState<string | null>(null);

  const getBookingServiceOptions = React.useCallback(
    (categoryId: string) => {
      const selectedCategory = businessCategories.find((category) => String(category.id) === categoryId);
      const subcategories = selectedCategory
        ? selectedCategory.subcategories
        : businessCategories.flatMap((category) => category.subcategories);

      return subcategories.map((subcategory) => ({
        value: String(subcategory.id),
        label: subcategory.title,
      }));
    },
    [businessCategories],
  );

  const bookingServiceOptions = React.useMemo(
    () => getBookingServiceOptions(fixedBiz.bookCategory),
    [fixedBiz.bookCategory, getBookingServiceOptions],
  );

  const resolveBookingComboLabels = React.useCallback(
    (categoryId: string, serviceId: string) => {
      const categoryLabel =
        bookingCategoryOptions.find((option) => option.value === categoryId)?.label ?? "Category";
      const serviceLabel =
        getBookingServiceOptions(categoryId).find((option) => option.value === serviceId)?.label ?? "Service";
      return { categoryLabel, serviceLabel };
    },
    [bookingCategoryOptions, getBookingServiceOptions],
  );

  const addBookingCombo = React.useCallback(() => {
    const categoryId = fixedBiz.bookCategory || bookingCategoryOptions[0]?.value || "";
    const serviceOptions = getBookingServiceOptions(categoryId);
    const serviceId = fixedBiz.bookService || serviceOptions[0]?.value || "";
    if (!categoryId || !serviceId) return;

    const alreadyExists = fixedBiz.bookCombos.some(
      (combo) => combo.categoryId === categoryId && combo.serviceId === serviceId,
    );
    if (alreadyExists) {
      showSnackbar({ severity: "info", message: "This service combination is already added." });
      return;
    }

    const id = `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setBookingComboEditId(null);
    setFixedBizField("bookCombos", [...fixedBiz.bookCombos, { id, categoryId, serviceId }]);
  }, [
    fixedBiz.bookCategory,
    fixedBiz.bookCombos,
    fixedBiz.bookService,
    bookingCategoryOptions,
    getBookingServiceOptions,
    setFixedBizField,
    showSnackbar,
  ]);

  const updateBookingCombo = React.useCallback(
    (id: string, patch: Partial<{ categoryId: string; serviceId: string }>) => {
      setFixedBizField(
        "bookCombos",
        fixedBiz.bookCombos.map((combo) => {
          if (combo.id !== id) return combo;

          const next = { ...combo, ...patch };
          if (patch.categoryId) {
            const serviceOptions = getBookingServiceOptions(patch.categoryId);
            next.serviceId = serviceOptions.some((option) => option.value === next.serviceId)
              ? next.serviceId
              : serviceOptions[0]?.value || "";
          }

          return next;
        }),
      );
    },
    [fixedBiz.bookCombos, getBookingServiceOptions, setFixedBizField],
  );

  const deleteBookingCombo = React.useCallback(
    (id: string) => {
      setBookingComboEditId((prev) => (prev === id ? null : prev));
      setFixedBizField(
        "bookCombos",
        fixedBiz.bookCombos.filter((c) => c.id !== id),
      );
    },
    [fixedBiz.bookCombos, setFixedBizField],
  );
  const goPrevMedia = React.useCallback(() => {
    setMediaIdx((i) => (i - 1 + mediaSlides.length) % mediaSlides.length);
  }, [mediaSlides.length]);
  const goNextMedia = React.useCallback(() => {
    setMediaIdx((i) => (i + 1) % mediaSlides.length);
  }, [mediaSlides.length]);

  const userInfoContent = (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2.1}>
        {professionalForm}

        {isProfessionalEditing ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={cancelProfessionalEditing}
              disabled={isProfileSaving}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 800,
                minHeight: 44,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.74),
                "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.03) },
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={async () => {
              if (!onSaveProfessionalProfile) {
                setIsProfessionalEditing(false);
                return;
              }

              const nextErrors: Partial<Record<ProfileValidationField, string>> = {};
              if (!isValidEmail(values.contactEmail)) nextErrors.contactEmail = "Enter a valid email address.";
              if (!isValidName(values.companyLegalName)) nextErrors.companyLegalName = "Enter a valid legal name.";
              if (!isValidName(values.contactFirstName)) nextErrors.contactFirstName = "Enter a valid first name.";
              if (!isValidName(values.contactLastName)) nextErrors.contactLastName = "Enter a valid last name.";

              const password = values.contactPassword.trim();
              const repeatPassword = values.contactRepeatPassword.trim();
              if (password || repeatPassword) {
                if (!password) nextErrors.contactPassword = "Password is required.";
                if (!repeatPassword) nextErrors.contactRepeatPassword = "Repeat password is required.";
                if (password && repeatPassword && password !== repeatPassword) {
                  nextErrors.contactRepeatPassword = "Password and repeat password must match.";
                }
              }

              if (Object.keys(nextErrors).length) {
                setProfileErrors(nextErrors);
                return;
              }

              const jsonPayload = {
                email: values.contactEmail,
                password: values.contactPassword || undefined,
                confirm_password: values.contactRepeatPassword || undefined,
                legal_name: values.companyLegalName,
                ccc_number: values.companyCocNumber,
                vat_number: values.companyVatNumber,
                street: values.companyStreet,
                street_number: values.companyStreetNumber,
                postal_code: values.companyPostalCode,
                municipality: values.companyMunicipality,
                business_type: values.companyBusinessType,
                website: values.companyWebsite,
                instagram: values.socialInstagram,
                other_link: values.socialOther,
                contact_first_name: values.contactFirstName,
                contact_last_name: values.contactLastName,
                phone: values.contactPhone,
              };

              let updated: ProfileResponse | void;
              if (pendingProfessionalPhoto) {
                const fd = new FormData();
                for (const [key, value] of Object.entries(jsonPayload)) {
                  if (value === undefined || value === "") continue;
                  fd.append(key, String(value));
                }
                fd.append("profile_picture", pendingProfessionalPhoto);
                updated = await onSaveProfessionalProfile(fd);
              } else {
                updated = await onSaveProfessionalProfile(jsonPayload);
              }

              const nextPhotoSrc =
                updated && updated.user_type === "professional"
                  ? getProfessionalPhotoSrcFromProfile(updated)
                  : savedProfessionalPhotoSrc;

              const nextSavedProfessionalDraft = {
                ...professionalDraft,
                contactPassword: "",
                contactRepeatPassword: "",
              };
              setSavedProfessionalDraft(nextSavedProfessionalDraft);
              setSavedProfessionalPhotoSrc(nextPhotoSrc);
              applyProfessionalDraft(nextSavedProfessionalDraft, nextPhotoSrc);
              setPendingProfessionalPhoto(null);
              setProfileErrors({});
              setIsProfessionalEditing(false);
            }}
              disabled={!isProfessionalDirty || isProfileSaving}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: m.teal,
                color: "#fff",
                "&:hover": { bgcolor: m.tealDark },
                minHeight: 44,
              }}
            >
              {isProfileSaving ? <CircularProgress size={20} color="inherit" /> : "Update"}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );

  const teamMemberFormModal = (
    <BusinessTeamMemberFormModal
      open={teamMemberModal.open}
      title={teamMemberModal.modalTitle}
      draft={teamMemberModal.draft}
      submitLabel={teamMemberModal.submitLabel}
      disabled={manageTeamDisabled}
      canSubmit={teamMemberModal.canSubmit}
      businessCategories={businessCategories}
      serviceContext={teamMemberModal.serviceContext}
      photoInputRef={teamMemberModal.photoInputRef}
      onClose={teamMemberModal.closeModal}
      onSubmit={() => void teamMemberModal.saveModal()}
      onChange={teamMemberModal.updateDraft}
      onAddServiceSelection={teamMemberModal.addServiceSelection}
      onRemoveServiceGroup={teamMemberModal.removeServiceGroup}
      onChoosePhoto={teamMemberModal.choosePhoto}
      onPhotoSelected={teamMemberModal.onPhotoSelected}
    />
  );

  const serviceFormModal = (
    <BusinessServiceFormModal
      open={serviceModal.open}
      mode={serviceModal.mode}
      title={serviceModal.modalTitle}
      draft={serviceModal.draft}
      submitLabel={serviceModal.submitLabel}
      disabled={servicesDetailsDisabled}
      canSubmit={serviceModal.canSubmit}
      onClose={serviceModal.closeModal}
      onSubmit={serviceModal.saveModal}
      onChange={serviceModal.updateDraft}
    />
  );

  const renderSectionEditAction = (
    sectionId: BusinessSetupSectionId,
    extra?: React.ReactNode,
  ) => (
    <Stack direction="row" spacing={1} alignItems="center">
      {extra}
      {isBusinessSectionEditing(sectionId) ? (
        <Button
          variant="contained"
          disableElevation
          onClick={() => void saveBusinessSection(sectionId)}
          disabled={isBusinessSetupSaving}
          sx={{
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 12,
            minHeight: 30,
            px: 2,
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "mollure.tealDark" },
          }}
        >
          {isBusinessSetupSaving ? "Saving..." : "Save"}
        </Button>
      ) : (
        <IconButton
          size="small"
          onClick={() => startBusinessSectionEdit(sectionId)}
          disabled={isBusinessSetupSaving}
          aria-label="Edit section"
          sx={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            bgcolor: alpha(m.navy, 0.06),
            "&:hover": { bgcolor: alpha(m.navy, 0.09) },
          }}
        >
          <EditRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.55) }} />
        </IconButton>
      )}
    </Stack>
  );

  const businessSetupContent = (
    <Stack
      spacing={2}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "flex-end" }}
        justifyContent={{ md: "space-between" }}
        sx={{ width: "100%" }}
      >
        <Box
          sx={{
            flex: { xs: "1 1 auto", md: "1 1 auto" },
            width: { xs: "100%", md: "auto" },
            maxWidth: { xs: "100%", md: 520 },
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, mb: 0.75 }}>
            {data.offeringLabel}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: "100%" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <MollureFormField
                select
                value={businessOfferingSelect}
                onChange={(e) => {
                  const v = String(e.target.value) as OfferingSelectOption;
                  setBusinessOfferingSelect(v);
                  if (v !== "Both") {
                    setUseSameInfoForBothTemplates(false);
                    onSwitchActiveBusinessTemplate(v);
                  } else {
                    onSwitchActiveBusinessTemplate("Fixed Location");
                  }
                  setIsBusinessPublishEnabled(true);
                }}
                disabled={businessFormDisabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                }}
                SelectProps={{
                  renderValue: (selected) => {
                    if (selected === "Both") return "Fixed and Desired location";
                    return String(selected);
                  },
                }}
              >
                {offeringSelectOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt === "Both" ? "Fixed and Desired location" : opt}
                  </MenuItem>
                ))}
              </MollureFormField>
            </Box>

            {isBothOffering ? (
              <FormControlLabel
                sx={{ m: 0, flexShrink: 0, alignItems: "center" }}
                control={
                  <Checkbox
                    checked={useSameInfoForBothTemplates}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseSameInfoForBothTemplates(checked);
                      setIsBusinessPublishEnabled(true);
                      if (checked) {
                        syncOtherTemplateFromSource(
                          activeBusinessTemplate === "Fixed Location"
                            ? getCurrentBusinessState()
                            : desiredBusiness,
                          activeBusinessTemplate,
                        );
                      }
                    }}
                    disabled={businessFormDisabled}
                    sx={{
                      color: alpha(m.navy, 0.28),
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.72), lineHeight: 1.35 }}>
                    Use same information for both templates
                  </Typography>
                }
              />
            ) : null}
          </Stack>

          {isBothOffering ? (
            <Box
              sx={{
                mt: 1.25,
                p: 0.5,
                borderRadius: "12px",
                bgcolor: alpha(m.navy, 0.06),
                display: "flex",
                gap: 0.5,
                width: "100%",
              }}
            >
              {visibleLocationCards.map((opt) => {
                const isActive = activeBusinessTemplate === opt;

                return (
                  <Box
                    key={opt}
                    component="button"
                    type="button"
                    onClick={() => onSwitchActiveBusinessTemplate(opt)}
                    disabled={businessFormDisabled}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 40,
                      px: 2,
                      py: 0.85,
                      borderRadius: "10px",
                      border: "none",
                      bgcolor: isActive ? alpha(m.navy, 0.1) : "#fff",
                      boxShadow: isActive ? "none" : "0 1px 2px rgba(16, 35, 63, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background-color 0.18s ease, box-shadow 0.18s ease",
                      outline: "none",
                      font: "inherit",
                      "&:hover": {
                        bgcolor: isActive ? alpha(m.navy, 0.12) : alpha(m.navy, 0.02),
                      },
                      "&:focus-visible": { boxShadow: `0 0 0 3px ${alpha(m.teal, 0.22)}` },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isActive ? alpha(m.navy, 0.88) : alpha(m.navy, 0.55),
                        lineHeight: 1.2,
                        textAlign: "center",
                      }}
                    >
                      {opt}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : null}
        </Box>
        <Button
          variant="contained"
          disableElevation
          onClick={onPublishBusinessSetup}
          disabled={!isBusinessPublishEnabled || isBusinessSetupSaving}
          sx={{
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            minHeight: 40,
            px: 2.5,
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "mollure.tealDark" },
            alignSelf: { xs: "flex-start", md: "flex-end" },
          }}
        >
          {isBusinessSetupSaving ? "Saving..." : data.publishLabel}
        </Button>
      </Stack>

      {!isBusinessProfileActive ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            bgcolor: alpha("#E53935", 0.06),
            border: `1px solid ${alpha("#E53935", 0.18)}`,
            px: 2,
            py: 1.35,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: "#E53935",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ErrorOutlineRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              flex: 1,
              minWidth: 200,
              fontWeight: 600,
              fontSize: 13,
              color: "#C62828",
            }}
          >
            Template Has Temporarily Been Deactivated
          </Typography>
          <Button
            variant="contained"
            disableElevation
            onClick={() => void onToggleBusinessProfileActive()}
            disabled={isBusinessProfileStatusSaving}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              minHeight: 34,
              px: 2.25,
              bgcolor: alpha(m.navy, 0.12),
              color: alpha(m.navy, 0.82),
              boxShadow: "none",
              "&:hover": { bgcolor: alpha(m.navy, 0.18), boxShadow: "none" },
            }}
          >
            {isBusinessProfileStatusSaving ? "Saving..." : "Reactivate"}
          </Button>
        </Paper>
      ) : null}

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        <IconButton
          size="small"
          aria-label="Business profile options"
          aria-haspopup="menu"
          aria-expanded={Boolean(businessProfileMenuAnchor)}
          disabled={isBusinessProfileStatusSaving}
          onClick={(e) => setBusinessProfileMenuAnchor(e.currentTarget)}
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "8px",
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            bgcolor: "#fff",
            color: alpha(m.navy, 0.72),
            "&:hover": { bgcolor: alpha(m.navy, 0.03) },
          }}
        >
          <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Menu
          anchorEl={businessProfileMenuAnchor}
          open={Boolean(businessProfileMenuAnchor)}
          onClose={() => setBusinessProfileMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
              mt: 0.75,
              minWidth: 160,
              p: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={onToggleBusinessProfileActive}
            disabled={isBusinessProfileStatusSaving}
            sx={{
              borderRadius: "8px",
              fontSize: 13,
              fontWeight: 700,
              color: alpha(m.navy, 0.82),
              my: 0.25,
            }}
          >
            {isBusinessProfileActive ? "Deactivate" : "Activate"}
          </MenuItem>
        </Menu>
      </Stack>

      <SectionShell title={data.profile.title} action={renderSectionEditAction("profile")}>
        <Grid container spacing={2.25}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "relative", width: "100%", height: 210, bgcolor: alpha(m.navy, 0.02) }}>
                <Fade in key={mediaIdx} timeout={180}>
                  <Box sx={{ position: "absolute", inset: 0 }}>
                    <Image
                      src={mediaSlides[mediaIdx]}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 100vw, 520px"
                      unoptimized={
                        mediaSlides[mediaIdx]?.startsWith("blob:") || isPersistedMediaUrl(mediaSlides[mediaIdx] ?? "")
                      }
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </Fade>

                <IconButton
                  aria-label="Previous image"
                  onClick={goPrevMedia}
                  size="small"
                  sx={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: alpha("#fff", 0.85),
                    border: `1px solid ${alpha(m.navy, 0.10)}`,
                    "&:hover": { bgcolor: "#fff" },
                  }}
                >
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Next image"
                  onClick={goNextMedia}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: alpha("#fff", 0.85),
                    border: `1px solid ${alpha(m.navy, 0.10)}`,
                    "&:hover": { bgcolor: "#fff" },
                  }}
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>

                <Stack
                  direction="row"
                  spacing={0.6}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: 10,
                    px: 1.2,
                    py: 0.55,
                    borderRadius: 999,
                    bgcolor: alpha("#000", 0.30),
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {mediaSlides.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setMediaIdx(i)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setMediaIdx(i);
                      }}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        cursor: "pointer",
                        bgcolor: i === mediaIdx ? "#fff" : alpha("#fff", 0.45),
                        boxShadow: i === mediaIdx ? "0 0 0 2px rgba(255,255,255,0.22)" : "none",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              <Box sx={{ p: 1.25 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_FILE_ACCEPT}
                  multiple
                  onChange={onFilesSelected}
                  style={{ display: "none" }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    isBusinessMediaUploading ? <CircularProgress size={18} color="inherit" /> : <IosShareRoundedIcon />
                  }
                  onClick={onUploadMedia}
                  disabled={isBusinessMediaUploading || profileDisabled}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: alpha(m.navy, 0.14),
                    color: alpha(m.navy, 0.72),
                    bgcolor: alpha(m.navy, 0.02),
                    "&:hover": { bgcolor: alpha(m.navy, 0.04) },
                  }}
                >
                  {data.profile.uploadMediaLabel}
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.6}>
              <MollureFormField
                label={data.profile.nameLabel}
                value={biz.profileName}
                onChange={(e) => setBizField("profileName", e.target.value)}
                disabled={profileDisabled}
              />
              <MollureFormField
                label={data.profile.aboutLabel}
                value={biz.about}
                onChange={(e) => setBizField("about", e.target.value)}
                multiline
                minRows={4}
                disabled={profileDisabled}
              />
              <MollureFormField
                label={data.profile.keywordsLabel}
                placeholder={data.profile.keywordPlaceholder}
                value={biz.keywordDraft}
                onChange={(e) => setBizField("keywordDraft", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBizKeyword();
                  }
                }}
                disabled={profileDisabled}
              />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {biz.keywords.map((k) => (
                  <Chip
                    key={k}
                    label={k}
                    onDelete={profileDisabled ? undefined : () => removeBizKeyword(k)}
                    sx={{
                      borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.06),
                      fontWeight: 700,
                      fontSize: 11.5,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </SectionShell>

      <SectionShell
        title={isBothOffering ? activeBusinessTemplate : locationSectionTitle}
        action={renderSectionEditAction("location")}
      >
        {showFixedLocationSection ? fixedLocationForm : null}
        {showDesiredLocationSection ? desiredLocationForm : null}
      </SectionShell>

      <SectionShell title="Service For" action={renderSectionEditAction("serviceFor")}>
          {(() => {
          const allChecked = biz.serviceFor.men && biz.serviceFor.women && biz.serviceFor.kids;
          const anyChecked = biz.serviceFor.men || biz.serviceFor.women || biz.serviceFor.kids;
          const allIndeterminate = anyChecked && !allChecked;

          return (
            <Stack spacing={1}>
              <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62), fontWeight: 500 }}>
                We offer services:
              </Typography>

              <Stack spacing={0.25}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allChecked}
                      indeterminate={allIndeterminate}
                      disabled={serviceForDisabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBizServiceFor("men", checked);
                        setBizServiceFor("women", checked);
                        setBizServiceFor("kids", checked);
                      }}
                      sx={{
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7), fontWeight: 600 }}>All</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={biz.serviceFor.men}
                      disabled={serviceForDisabled}
                      onChange={(e) => setBizServiceFor("men", e.target.checked)}
                      sx={{
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7), fontWeight: 600 }}>Men</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={biz.serviceFor.women}
                      disabled={serviceForDisabled}
                      onChange={(e) => setBizServiceFor("women", e.target.checked)}
                      sx={{
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7), fontWeight: 600 }}>Women</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={biz.serviceFor.kids}
                      disabled={serviceForDisabled}
                      onChange={(e) => setBizServiceFor("kids", e.target.checked)}
                      sx={{
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.7), fontWeight: 600 }}>Kids</Typography>}
                />
              </Stack>
            </Stack>
          );
          })()}
      </SectionShell>

      <SectionShell
        title={data.servicesDetails.title}
        action={renderSectionEditAction("servicesDetails")}
      >
        <Stack spacing={1.5}>
          <ServiceCategoryBar
            items={serviceCategoryTabs}
            activeId={activeServiceCategory}
            onSelect={setActiveServiceCategory}
          />

            <Stack spacing={1.5}>
              {activeServiceCategory === "" ? (
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: alpha(m.navy, 0.55),
                    py: 2,
                    px: 1,
                    textAlign: "center",
                  }}
                >
                  Select a category above to view or manage services.
                </Typography>
              ) : (
                <>
                  {activeServiceCategory !== "all" ? (
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: "10px",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        bgcolor: alpha(m.navy, 0.045),
                        px: 1.75,
                        py: 1.1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 500, fontSize: 14, color: alpha(m.navy, 0.88), flex: 1 }}>
                        {serviceCategoryTabs.find((x) => x.id === activeServiceCategory)?.label ?? "Services"}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={openAddService}
                        disabled={servicesDetailsDisabled}
                        aria-label="Add service"
                        sx={{
                          ...addSoftIconButtonSx(m, 36),
                          "&.Mui-disabled": { bgcolor: alpha(m.navy, 0.12), color: alpha(m.navy, 0.35), opacity: 1 },
                        }}
                      >
                        <AddRoundedIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Paper>
                  ) : null}

                  {activeServiceCategory === "all" ? (
                    <Stack spacing={2}>
                      {groupedAllMainServiceSections.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}>No services yet.</Typography>
                      ) : (
                        groupedAllMainServiceSections.map((group) => (
                          <Stack key={group.categoryId} spacing={1}>
                            <Paper
                              elevation={0}
                              sx={{
                                borderRadius: "10px",
                                border: `1px solid ${alpha(m.navy, 0.08)}`,
                                bgcolor: alpha(m.navy, 0.045),
                                px: 1.75,
                                py: 1.1,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Typography sx={{ fontWeight: 500, fontSize: 14, color: alpha(m.navy, 0.88), flex: 1 }}>
                                {group.title}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => openAddServiceForCategory(group.categoryId)}
                                disabled={servicesDetailsDisabled}
                                aria-label={`Add service to ${group.title}`}
                                sx={{
                                  ...addSoftIconButtonSx(m, 36),
                                  "&.Mui-disabled": { bgcolor: alpha(m.navy, 0.12), color: alpha(m.navy, 0.35), opacity: 1 },
                                }}
                              >
                                <AddRoundedIcon sx={{ fontSize: 22 }} />
                              </IconButton>
                            </Paper>
                            <Stack spacing={1}>{group.mains.map((main) => renderMainServiceRow(main))}</Stack>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      {activeCategoryMains.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}>
                          No services in this category.
                        </Typography>
                      ) : (
                        activeCategoryMains.map((main) => renderMainServiceRow(main))
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Stack>

          {showProjectSection ? (
          <Paper
            elevation={0}
            sx={{
              mt: 0.5,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              bgcolor: alpha(m.navy, 0.01),
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack spacing={0.75}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    checked={biz.projectEnabled}
                    disabled={servicesDetailsDisabled}
                    onChange={(e) => setBizField("projectEnabled", e.target.checked)}
                    sx={{
                      color: alpha(m.navy, 0.28),
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.84), fontSize: 13 }}>
                    Project
                  </Typography>
                }
              />
              <Typography sx={{ color: alpha(m.navy, 0.58), fontSize: 12.5, lineHeight: 1.45 }}>
                Enable this to provide photoshoot booking services
              </Typography>
              <MollureFormField
                placeholder="Custom instructions for Project"
                value={biz.projectInstructions}
                onChange={(e) => setBizField("projectInstructions", e.target.value)}
                multiline
                minRows={3}
                disabled={servicesDetailsDisabled || !biz.projectEnabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                }}
              />
            </Stack>
          </Paper>
          ) : null}

          {showBookServices ? (
          <>
          <Box sx={{ mt: 0.75 }}>
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.84), fontSize: 13 }}>
              Book Services
            </Typography>
            <Typography sx={{ mt: 0.35, color: alpha(m.navy, 0.55), fontSize: 12, lineHeight: 1.45 }}>
              Pick a category and service, then tap + to create a combo card you can edit or delete.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              bgcolor: alpha(m.navy, 0.01),
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack spacing={1.25}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.6 }}>
                    Select category
                  </Typography>
                  <MollureFormField
                    select
                    value={fixedBiz.bookCategory}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      setFixedBizField("bookCategory", categoryId);
                      const nextServices = getBookingServiceOptions(categoryId);
                      setFixedBizField(
                        "bookService",
                        nextServices.some((option) => option.value === fixedBiz.bookService)
                          ? fixedBiz.bookService
                          : nextServices[0]?.value || "",
                      );
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={servicesDetailsDisabled}
                  >
                    <MenuItem value="">Select category</MenuItem>
                    {bookingCategoryOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.6 }}>
                    Select service
                  </Typography>
                  <MollureFormField
                    select
                    value={fixedBiz.bookService}
                    onChange={(e) => setFixedBizField("bookService", e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={servicesDetailsDisabled}
                  >
                    <MenuItem value="">Select service</MenuItem>
                    {bookingServiceOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
                <Grid item xs={12} md={2} sx={{ display: "flex", justifyContent: { md: "flex-end" }, pr: { md: 0.5 } }}>
                  <IconButton
                    onClick={addBookingCombo}
                    disabled={servicesDetailsDisabled || !fixedBiz.bookCategory || !fixedBiz.bookService}
                    sx={addSoftIconButtonSx(m, 34)}
                  >
                    <AddRoundedIcon />
                  </IconButton>
                </Grid>
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.10)}`,
                  bgcolor: "#fff",
                  px: 1.25,
                  py: 1.1,
                }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800, fontSize: 12.5, color: alpha(m.navy, 0.78) }}>
                    Available Combinations
                  </Typography>
                  {fixedBiz.bookCombos.length === 0 ? (
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: alpha(m.navy, 0.5), py: 0.5 }}>
                      Select a category and service above, then tap + to add a combination.
                    </Typography>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={1.25}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ pb: 0.25 }}
                    >
                      {fixedBiz.bookCombos.map((c) => {
                        const isEditing = bookingComboEditId === c.id;
                        const comboServiceOptions = getBookingServiceOptions(c.categoryId);
                        const { categoryLabel, serviceLabel } = resolveBookingComboLabels(c.categoryId, c.serviceId);
                        const comboFieldsDisabled = servicesDetailsDisabled;

                        return (
                          <Paper
                            key={c.id}
                            elevation={0}
                            sx={{
                              flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)", md: "1 1 calc(33.333% - 9px)" },
                              minWidth: { xs: "100%", sm: 260 },
                              maxWidth: { md: 360 },
                              borderRadius: "10px",
                              border: `1px solid ${isEditing ? alpha(m.teal, 0.35) : alpha(m.navy, 0.10)}`,
                              px: 1.25,
                              py: 1,
                              bgcolor: isEditing ? alpha(m.addSoftBg, 0.35) : alpha(m.navy, 0.02),
                            }}
                          >
                            {isEditing ? (
                              <Stack spacing={1}>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  alignItems={{ xs: "stretch", sm: "center" }}
                                >
                                  <MollureFormField
                                    select
                                    value={c.categoryId}
                                    onChange={(e) => updateBookingCombo(c.id, { categoryId: e.target.value })}
                                    disabled={comboFieldsDisabled}
                                    sx={{
                                      flex: 1,
                                      minWidth: 0,
                                      "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                                    }}
                                  >
                                    {bookingCategoryOptions.map((opt) => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </MollureFormField>
                                  <Typography
                                    sx={{
                                      fontWeight: 800,
                                      color: alpha(m.navy, 0.45),
                                      textAlign: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    +
                                  </Typography>
                                  <MollureFormField
                                    select
                                    value={c.serviceId}
                                    onChange={(e) => updateBookingCombo(c.id, { serviceId: e.target.value })}
                                    disabled={comboFieldsDisabled}
                                    sx={{
                                      flex: 1,
                                      minWidth: 0,
                                      "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                                    }}
                                  >
                                    {comboServiceOptions.map((opt) => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </MollureFormField>
                                </Stack>
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  <IconButton
                                    size="small"
                                    disabled={comboFieldsDisabled}
                                    onClick={() => setBookingComboEditId(null)}
                                    aria-label="Done editing combination"
                                    sx={{
                                      bgcolor: m.addSoftBg,
                                      border: `1px solid ${m.addSoftBorder}`,
                                      "&:hover": { bgcolor: m.addSoftBgHover },
                                    }}
                                  >
                                    <CheckRoundedIcon sx={{ fontSize: 18, color: m.addSoftFg }} />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            ) : (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      fontSize: 13,
                                      fontWeight: 800,
                                      color: alpha(m.navy, 0.86),
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {categoryLabel} + {serviceLabel}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  disabled={comboFieldsDisabled}
                                  onClick={() => setBookingComboEditId(c.id)}
                                  aria-label="Edit combination"
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "999px",
                                    bgcolor: alpha(m.navy, 0.05),
                                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                                    "&:hover": { bgcolor: alpha(m.navy, 0.09) },
                                  }}
                                >
                                  <EditRoundedIcon sx={{ fontSize: 17, color: alpha(m.navy, 0.5) }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={comboFieldsDisabled}
                                  onClick={() => deleteBookingCombo(c.id)}
                                  aria-label="Delete combination"
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "999px",
                                    bgcolor: alpha(m.navy, 0.05),
                                    border: `1px solid ${alpha(m.navy, 0.1)}`,
                                    "&:hover": { bgcolor: alpha(m.navy, 0.09) },
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 17, color: alpha(m.navy, 0.5) }} />
                                </IconButton>
                              </Stack>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <MollureFormField
                placeholder="Custom instructions for combo Service"
                value={fixedBiz.bookComboInstructions}
                onChange={(e) => setFixedBizField("bookComboInstructions", e.target.value)}
                multiline
                minRows={4}
                disabled={servicesDetailsDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              />
            </Stack>
          </Paper>
          </>
          ) : null}
        </Stack>
      </SectionShell>

      <SectionShell
        title={data.manageTeam.title}
        action={renderSectionEditAction(
          "manageTeam",
          <>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Checkbox
                  checked={featureTeamPublic}
                  onChange={(e) => setFeatureTeamPublic(e.target.checked)}
                  disabled={manageTeamDisabled}
                  sx={{ color: alpha(m.navy, 0.28), "&.Mui-checked": { color: "primary.main" } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.62) }}>
                  Feature team on public profile
                </Typography>
              }
            />
            <IconButton
              onClick={teamMemberModal.openAdd}
              size="small"
              disabled={manageTeamDisabled}
              sx={addSoftIconButtonSx(m, 32)}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>,
        )}
      >
        <Stack spacing={1.5}>
          {teamMembers.map((mem) => (
            <Paper
              key={mem.id}
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                px: 2,
                py: 1.5,
              }}
            >
              <Stack direction="row" alignItems="stretch" sx={{ width: "100%" }}>
                {/* Left – profile */}
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 0,
                    maxWidth: 240,
                    pr: 2,
                    borderRight: `1px solid ${alpha(m.navy, 0.10)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "999px",
                      overflow: "hidden",
                      bgcolor: alpha(m.navy, 0.06),
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      flex: "0 0 auto",
                    }}
                  >
                    <Image
                      src={mem.photoSrc}
                      alt={mem.name}
                      width={48}
                      height={48}
                      unoptimized
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 14, color: alpha(m.navy, 0.88), lineHeight: 1.35 }}>
                      {mem.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
                      <Rating
                        value={mem.rating}
                        precision={0.5}
                        readOnly
                        size="small"
                        sx={{ fontSize: 14, "& .MuiRating-iconFilled": { color: "#FAAF00" } }}
                      />
                      <Typography sx={{ fontSize: 10.5, color: alpha(m.navy, 0.50), fontWeight: 500 }}>
                        {mem.reviewsLabel}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                {/* Middle – assigned services grouped by category */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    px: 2,
                    py: 0.25,
                    borderRight: `1px solid ${alpha(m.navy, 0.10)}`,
                    alignSelf: "center",
                  }}
                >
                  {(() => {
                    const assignedIds = getMemberAssignedServiceIds(mem.services);
                    if (assignedIds.length === 0) {
                      return (
                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: alpha(m.navy, 0.42) }}>
                          No services assigned
                        </Typography>
                      );
                    }

                    const showsAllServices = memberProvidesAllServices(mem.services);
                    const serviceGroups = buildTeamMemberServiceGroups(mem.services);

                    const renderServiceChip = (
                      label: string,
                      menuKey: string,
                      count: number | undefined,
                      onOpen: (anchorEl: HTMLElement) => void,
                    ) => {
                      const isOpen = teamServiceMenu?.menuKey === menuKey;
                      const displayLabel = count != null ? `${label}(${count})` : label;
                      const chipDisabled = manageTeamDisabled;
                      return (
                        <Box
                          key={menuKey}
                          component="button"
                          type="button"
                          disabled={chipDisabled}
                          onClick={(e) => {
                            if (chipDisabled) return;
                            onOpen(e.currentTarget);
                          }}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 0.75,
                            width: { xs: "100%", sm: 220 },
                            minWidth: { xs: 0, sm: 220 },
                            maxWidth: { xs: "100%", sm: 220 },
                            minHeight: 46,
                            height: 46,
                            px: 1.75,
                            py: 0,
                            borderRadius: "10px",
                            border: `1.5px solid ${
                              chipDisabled
                                ? alpha(m.navy, 0.1)
                                : isOpen
                                  ? alpha(m.teal, 0.45)
                                  : alpha(m.teal, 0.22)
                            }`,
                            bgcolor: chipDisabled ? alpha(m.navy, 0.02) : "#fff",
                            cursor: chipDisabled ? "not-allowed" : "pointer",
                            font: "inherit",
                            color: chipDisabled ? alpha(m.navy, 0.38) : alpha(m.navy, 0.82),
                            whiteSpace: "nowrap",
                            flex: "0 0 auto",
                            boxSizing: "border-box",
                            boxShadow: chipDisabled
                              ? "none"
                              : isOpen
                                ? `0 8px 20px ${alpha(m.teal, 0.14)}`
                                : "0 2px 8px rgba(16, 35, 63, 0.06)",
                            opacity: chipDisabled ? 0.72 : 1,
                            "&:hover": chipDisabled
                              ? undefined
                              : {
                                  borderColor: alpha(m.teal, 0.42),
                                  bgcolor: alpha(m.teal, 0.03),
                                },
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              lineHeight: 1,
                              color: "inherit",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {displayLabel}
                          </Typography>
                          <KeyboardArrowDownRoundedIcon
                            sx={{
                              fontSize: 18,
                              color: alpha(m.navy, 0.4),
                              flexShrink: 0,
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </Box>
                      );
                    };

                    return (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        {showsAllServices ? (
                          renderServiceChip("All services", `${mem.id}:all`, undefined, (anchorEl) =>
                            setTeamServiceMenu({
                              anchorEl,
                              menuKey: `${mem.id}:all`,
                              groups: serviceGroups.map((group) => ({
                                categoryTitle: group.categoryTitle,
                                items: group.subServices.map((sub) => ({ id: sub.id, label: sub.label })),
                              })),
                            }),
                          )
                        ) : (
                          serviceGroups.map((group) =>
                            renderServiceChip(
                              group.categoryTitle,
                              `${mem.id}:${group.categoryId}`,
                              group.subServices.length,
                              (anchorEl) =>
                                setTeamServiceMenu({
                                  anchorEl,
                                  menuKey: `${mem.id}:${group.categoryId}`,
                                  items: group.subServices.map((sub) => ({ id: sub.id, label: sub.label })),
                                }),
                            ),
                          )
                        )}
                      </Box>
                    );
                  })()}
                </Box>

                {/* Right – actions */}
                <Stack spacing={1} alignItems="center" justifyContent="flex-start" sx={{ flex: "0 0 auto", pl: 1.5, pr: 0.5, pt: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => teamMemberModal.openEdit(mem)}
                    disabled={manageTeamDisabled || mem.id === TEAM_MEMBER_DRAFT_PREVIEW_ID}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.06),
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 17, color: alpha(m.navy, 0.48) }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => teamMemberModal.deleteMember(mem.id)}
                    disabled={manageTeamDisabled}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "999px",
                      bgcolor: alpha(m.navy, 0.06),
                      border: `1px solid ${alpha(m.navy, 0.10)}`,
                      "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 17, color: alpha(m.navy, 0.48) }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Popover
          anchorEl={teamServiceMenu?.anchorEl}
          open={Boolean(teamServiceMenu)}
          onClose={() => setTeamServiceMenu(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                p: 1,
                borderRadius: "12px",
                border: `1px solid ${alpha(m.teal, 0.18)}`,
                boxShadow: "0 14px 32px rgba(16, 35, 63, 0.14)",
                minWidth: 200,
                maxWidth: 300,
              },
            },
          }}
        >
          <Stack spacing={0.75}>
            {teamServiceMenu?.groups
              ? teamServiceMenu.groups.map((group) => (
                  <Box key={group.categoryTitle}>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: alpha(m.navy, 0.48),
                        px: 0.5,
                        mb: 0.5,
                      }}
                    >
                      {group.categoryTitle}
                    </Typography>
                    <Stack spacing={0.65}>
                      {group.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            px: 1.35,
                            py: 1,
                            borderRadius: "10px",
                            bgcolor: "#fff",
                            border: `1px solid ${alpha(m.navy, 0.1)}`,
                            boxShadow: "0 4px 14px rgba(16, 35, 63, 0.08)",
                          }}
                        >
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))
              : teamServiceMenu?.items?.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      px: 1.35,
                      py: 1,
                      borderRadius: "10px",
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(m.navy, 0.1)}`,
                      boxShadow: "0 4px 14px rgba(16, 35, 63, 0.08)",
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.55) }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
          </Stack>
        </Popover>
      </SectionShell>

      <SectionShell title={data.generalNotes.title} action={renderSectionEditAction("generalNotes")}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
          {data.generalNotes.notesLabel}
        </Typography>
        <MollureFormField
          placeholder={data.generalNotes.placeholder}
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
          multiline
          minRows={4}
          disabled={generalNotesDisabled}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: alpha(m.navy, 0.01),
            },
          }}
        />
      </SectionShell>

      <SectionShell title="Price" action={renderSectionEditAction("price")}>
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
              Price Range
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <MollureFormField
                  select
                  value={values.priceRangeFrom}
                  onChange={(e) => setField("priceRangeFrom", e.target.value)}
                  disabled={priceDisabled}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  {["Low", "Medium", "High"].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>
              </Grid>
              <Grid item xs={12} md={6}>
                <MollureFormField
                  select
                  value={values.priceRangeTo}
                  onChange={(e) => setField("priceRangeTo", e.target.value)}
                  disabled={priceDisabled}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                >
                  {["Low", "Medium", "High"].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </MollureFormField>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
              Prepayment (Optional)
            </Typography>
            <MollureFormField
              value={values.prepaymentPercent}
              onChange={(e) => setField("prepaymentPercent", e.target.value)}
              placeholder="0"
              disabled={priceDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputMode: "numeric",
              }}
            />
            <Box sx={{ mt: 1 }}>
              <MollureFormField
                placeholder="Custom instructions for prepayment"
                value={values.prepaymentInstructions}
                onChange={(e) => setField("prepaymentInstructions", e.target.value)}
                multiline
                minRows={3}
                disabled={priceDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              />
            </Box>
          </Box>

          {showKilometerAllowance ? (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Kilometer Allowance (Optional)
              </Typography>
              <MollureFormField
                value={values.kilometerAllowance}
                onChange={(e) => setField("kilometerAllowance", e.target.value)}
                placeholder="€ 0"
                disabled={priceDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  endAdornment: <InputAdornment position="end">EUR/Kilometer</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
              <Box sx={{ mt: 1 }}>
                <MollureFormField
                  placeholder="Custom instructions for Kilometer Allowance"
                  value={values.kilometerAllowanceInstructions}
                  onChange={(e) => setField("kilometerAllowanceInstructions", e.target.value)}
                  multiline
                  minRows={3}
                  disabled={priceDisabled}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                />
              </Box>
            </Box>
          ) : null}
        </Stack>
      </SectionShell>

      <SectionShell title="Policy Section" action={renderSectionEditAction("policy")}>
          <Stack spacing={1.6}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Prepayment/Response Time
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Hour"
                    value={values.policyResponseHours}
                    onChange={(e) => setField("policyResponseHours", e.target.value)}
                    disabled={policyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">H</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Minutes"
                    value={values.policyResponseMinutes}
                    onChange={(e) => setField("policyResponseMinutes", e.target.value)}
                    disabled={policyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Min</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <MollureFormField
              placeholder="Custom instructions for Policy"
              value={values.policyInstructions}
              onChange={(e) => setField("policyInstructions", e.target.value)}
              multiline
              minRows={3}
              disabled={policyDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
      </SectionShell>

      <SectionShell title="Rescheduling Policy" action={renderSectionEditAction("reschedulingPolicy")}>
          <Stack spacing={1.6}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Minimum Time Before Appointment
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Hour"
                    value={values.rescheduleMinimumHours}
                    onChange={(e) => setField("rescheduleMinimumHours", e.target.value)}
                    disabled={reschedulingPolicyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">H</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Minutes"
                    value={values.rescheduleMinimumMinutes}
                    onChange={(e) => setField("rescheduleMinimumMinutes", e.target.value)}
                    disabled={reschedulingPolicyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Min</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Late Rescheduling Fee
              </Typography>
              <MollureFormField
                placeholder="0"
                value={values.rescheduleLateFeePercent}
                onChange={(e) => setField("rescheduleLateFeePercent", e.target.value)}
                disabled={reschedulingPolicyDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputMode: "numeric",
                }}
              />
            </Box>

            <MollureFormField
              placeholder="Custom instructions for rescheduling Policy"
              value={values.rescheduleInstructions}
              onChange={(e) => setField("rescheduleInstructions", e.target.value)}
              multiline
              minRows={3}
              disabled={reschedulingPolicyDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
      </SectionShell>

      <SectionShell title="Cancellation Policy" action={renderSectionEditAction("cancellationPolicy")}>
          <Stack spacing={1.6}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Minimum Time Before Appointment
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Hour"
                    value={values.cancelMinimumHours}
                    onChange={(e) => setField("cancelMinimumHours", e.target.value)}
                    disabled={cancellationPolicyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">H</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MollureFormField
                    placeholder="Minutes"
                    value={values.cancelMinimumMinutes}
                    onChange={(e) => setField("cancelMinimumMinutes", e.target.value)}
                    disabled={cancellationPolicyDisabled}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Min</InputAdornment>,
                      inputMode: "numeric",
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                Late Cancellation Fee
              </Typography>
              <MollureFormField
                placeholder="0"
                value={values.cancelLateFeePercent}
                onChange={(e) => setField("cancelLateFeePercent", e.target.value)}
                disabled={cancellationPolicyDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputMode: "numeric",
                }}
              />
            </Box>

            <MollureFormField
              placeholder="Custom instructions for cancellation Policy"
              value={values.cancelInstructions}
              onChange={(e) => setField("cancelInstructions", e.target.value)}
              multiline
              minRows={3}
              disabled={cancellationPolicyDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
      </SectionShell>

      <SectionShell title="No Show Policy" action={renderSectionEditAction("noShowPolicy")}>
          <Stack spacing={1.6}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                No Show Fee
              </Typography>
              <MollureFormField
                placeholder="0"
                value={values.noShowFeePercent}
                onChange={(e) => setField("noShowFeePercent", e.target.value)}
                disabled={noShowPolicyDisabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputMode: "numeric",
                }}
              />
            </Box>

            <MollureFormField
              placeholder="Custom instructions for no show Policy"
              value={values.noShowInstructions}
              onChange={(e) => setField("noShowInstructions", e.target.value)}
              multiline
              minRows={3}
              disabled={noShowPolicyDisabled}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
      </SectionShell>

      <SectionShell
        title="Portfolio"
        action={renderSectionEditAction(
          "portfolio",
          <>
            <IconButton
              size="small"
              onClick={deleteSelectedPortfolio}
              disabled={portfolioDisabled || !Object.values(selectedPortfolioIds).some(Boolean)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "999px",
                bgcolor: alpha(m.navy, 0.05),
                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={onUploadPortfolio}
              disabled={portfolioDisabled}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "999px",
                bgcolor: alpha(m.navy, 0.05),
                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
              }}
            >
              <IosShareRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
            </IconButton>
            <input
              ref={portfolioInputRef}
              type="file"
              accept={PROFILE_IMAGE_FILE_ACCEPT}
              multiple
              hidden
              onChange={onPortfolioFilesSelected}
            />
          </>,
        )}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {portfolioItems.map((it) => {
            const checked = Boolean(selectedPortfolioIds[it.id]);
            return (
              <Box
                key={it.id}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onClick={() => {
                  if (!portfolioDisabled) togglePortfolio(it.id);
                }}
                onKeyDown={(e) => {
                  if (portfolioDisabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePortfolio(it.id);
                  }
                }}
                sx={{
                  position: "relative",
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: portfolioDisabled ? "default" : "pointer",
                  opacity: portfolioDisabled ? 0.72 : 1,
                  border: checked ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(m.navy, 0.10)}`,
                  outline: "none",
                  "&:focus-visible": { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}` },
                }}
              >
                <Image
                  src={it.src}
                  alt="Portfolio image"
                  width={520}
                  height={360}
                  unoptimized
                  style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "4px",
                    border: `1.5px solid ${checked ? theme.palette.primary.dark : alpha(m.navy, 0.22)}`,
                    bgcolor: checked ? theme.palette.primary.dark : alpha("#fff", 0.92),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    boxShadow: checked ? "none" : `inset 0 0 0 1px ${alpha(m.navy, 0.06)}`,
                  }}
                >
                  {checked ? <CheckRoundedIcon sx={{ fontSize: 14, color: "#fff" }} /> : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      </SectionShell>

    </Stack>
  );

  const inner = (
    <>
      {/* Sub Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "8px",
          bgcolor: "#fff",
          border: `1px solid ${alpha(m.navy, 0.12)}`,
          boxShadow: "0 6px 14px rgba(16, 35, 63, 0.06)",
          p: 0.45,
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={0} sx={{ height: 44 }}>
          {data.subTabs.map((t) => {
            const active = t === activeSubTab;
            return (
              <Box
                key={t}
                role="button"
                tabIndex={0}
                onClick={() => setActiveSubTab(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveSubTab(t);
                }}
                sx={{
                  cursor: "pointer",
                  flex: 1,
                  borderRadius: "6px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: active ? "primary.main" : "transparent",
                  color: active ? "#fff" : alpha(m.navy, 0.55),
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  userSelect: "none",
                  transition: "background-color 160ms ease, color 160ms ease",
                }}
              >
                {t}
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* Content shell (keeps page filled like your design) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            px: 2.25,
            py: 1.7,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              color: alpha(m.navy, 0.9),
              fontSize: 30,
              lineHeight: 1.25,
            }}
          >
            {activeSubTab === "Business Setup" ? data.title : "Professional"}
          </Typography>

          {activeSubTab === "Business Setup" ? (
            isBusinessPublishEnabled ? (
              <Chip
                label="Unsaved changes"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ) : null
          ) : (
            <IconButton
              size="small"
              onClick={() => setIsProfessionalEditing(true)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                bgcolor: alpha(m.navy, 0.06),
                "&:hover": { bgcolor: alpha(m.navy, 0.09) },
              }}
              aria-label="Edit professional profile"
            >
              <EditRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.55) }} />
            </IconButton>
          )}
        </Box>
        <Divider />
        <Box sx={{ px: 2.25, py: 2.1 }}>
          <Fade in timeout={180} key={activeSubTab}>
            <Box>
              {activeSubTab === "Business Setup"
                ? businessSetupContent
                : userInfoContent}
            </Box>
          </Fade>
        </Box>
      </Paper>
    </>
  );

  const innerWithDrawer = (
    <>
      {inner}
      {teamMemberFormModal}
      {serviceFormModal}
    </>
  );

  if (!chrome) return innerWithDrawer;

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack spacing={2}>{innerWithDrawer}</Stack>
      </Container>
    </Box>
  );
}
