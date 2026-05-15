"use client";

import * as React from "react";
import Image from "next/image";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Fade,
  Checkbox,
  Chip,
  Container,
  Divider,
  InputAdornment,
  FormControlLabel,
  Grid,
  IconButton,
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
import type { FixedLocationPageData } from "../../app/professionals/fixed-location/fixedLocation.data";
import { useFixedLocationForm, type FixedLocationFormState } from "../../app/professionals/fixed-location/fixedLocation.use";
import type { ProfessionalProfile, ProfileResponse } from "../../store/services/profileApi";
import type {
  BusinessCategory,
  BusinessSetup,
  BusinessTeamMember,
  UpsertBusinessSetupRequest,
} from "../../store/services/businessApi";
import MollureFormField from "./MollureFormField";
import ServiceCategorySliderCard, { SERVICE_CATEGORY_SLIDER_CARD_WIDTH } from "./ServiceCategorySliderCard";
import { Typography } from "../ui/typography";
import {
  resolveServiceCategorySliderIconId,
  type ServiceCategorySliderIconId,
} from "../../data/businessServiceCategorySlider.data";

type ServiceDetailUiItem = {
  id: string;
  categoryId: string;
  serviceId: number;
  name: string;
  durationLabel?: string;
  priceLabel: string;
  /** From API — used for “All” grouping when category tabs are missing or ids differ */
  categoryTitle?: string;
  priceType?: string;
  priceAmount?: string;
  discountType?: string;
  discountAmount?: string;
};

type ServiceDrawerEditBaseline = {
  categoryId: string;
  serviceId: number;
  name: string;
  duration: string;
  priceType: string;
  priceAmount: string;
  discountType: string;
  discountAmount: string;
};

const SERVICE_DRAWER_PRICE_TYPES: { value: string; label: string }[] = [
  { value: "fixed", label: "Fixed price" },
  { value: "from", label: "Starting from" },
];

const SERVICE_DRAWER_DISCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "fixed", label: "Fixed discount" },
  { value: "percent", label: "Percentage discount" },
];

function parseEuroAmountString(s: string): number | null {
  const raw = String(s ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\s/g, "");
  if (raw === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizePriceType(type: string | undefined): "fixed" | "from" {
  if (type === "from") return "from";
  return "fixed";
}

function parsePriceLabelForDrawer(priceLabel: string): { type: string; amount: string } {
  const t = priceLabel.trim().toLowerCase();
  if (!t || t === "—" || t === "-") return { type: "fixed", amount: "" };
  if (t.includes("free")) return { type: "fixed", amount: "0" };
  if (t.startsWith("starting from")) {
    const n = t.replace(/^starting from\s*/i, "").replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
    return { type: "from", amount: n?.[0] ?? "" };
  }
  if (t.startsWith("from")) {
    const n = t.replace(/^from\s*/i, "").replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
    return { type: "from", amount: n?.[0] ?? "" };
  }
  const n = t.replace(/[€$eur,\s]/gi, "").match(/[\d.]+/);
  return { type: "fixed", amount: n?.[0] ?? "" };
}

function formatServicePriceLabel(priceType: string, priceAmount: string): string {
  const raw = priceAmount.trim().replace(",", ".").replace(/\s/g, "");
  const n = raw === "" ? Number.NaN : Number.parseFloat(raw);
  const amountPart = Number.isFinite(n) ? `${n} €` : "25 €";
  if (normalizePriceType(priceType) === "from") return `Starting from ${amountPart}`;
  return amountPart;
}

function normalizeDiscountType(t: string | undefined): "fixed" | "percent" {
  return t === "percent" ? "percent" : "fixed";
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
  const parsed = parsePriceLabelForDrawer(it.priceLabel);
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
  const parsed = parsePriceLabelForDrawer(it.priceLabel);
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
  onSaveProfessionalProfile?: (payload: {
    email: string;
    password?: string;
    confirm_password?: string;
    legal_name: string;
    ccc_number: string;
    vat_number: string;
    street: string;
    street_number: string;
    postal_code: string;
    province: string;
    municipality: string;
    business_type: string;
    website: string;
    instagram: string;
    other_link: string;
    contact_first_name: string;
    contact_last_name: string;
    phone: string;
  }) => Promise<void>;
  onSaveBusinessSetup?: (payload: UpsertBusinessSetupRequest) => Promise<void>;
};

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
  onSaveProfessionalProfile,
  onSaveBusinessSetup,
}: ProfessionalFixedLocationSetupProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
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
  const [mediaSlides, setMediaSlides] = React.useState<string[]>([
    "/professionals/hero.png",
    "/professionals/hero.png",
    "/professionals/hero.png",
    "/professionals/hero.png",
  ]);
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

  const onPortfolioFilesSelected = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const next = files.map((f) => {
      const url = URL.createObjectURL(f);
      portfolioBlobUrlsRef.current.push(url);
      return { id: `pf-${Date.now()}-${Math.random().toString(16).slice(2)}`, src: url };
    });
    setPortfolioItems((prev) => [...next, ...prev]);
    e.target.value = "";
  }, []);

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
  type TeamMemberUi = {
    id: string;
    name: string;
    role: string;
    photoSrc: string;
    rating: number;
    reviewsLabel: string;
    services: TeamService;
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

  /** At least one slot shown; always one trailing empty slot after the last filled (up to 7). */
  function getVisibleTeamServiceSlotKeys(services: TeamService): (keyof TeamService)[] {
    let lastFilled = -1;
    for (let i = 0; i < TEAM_SERVICE_SLOT_KEYS.length; i++) {
      const k = TEAM_SERVICE_SLOT_KEYS[i];
      if (String(services[k] ?? "").trim()) lastFilled = i;
    }
    const count = Math.min(7, Math.max(1, lastFilled + 2));
    return TEAM_SERVICE_SLOT_KEYS.slice(0, count);
  }

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

  /** Category title + subcategory count (e.g. team card field labels). */
  const getTeamServiceSelectLabel = React.useCallback(
    (serviceId: string) => {
      const sid = String(serviceId ?? "").trim();
      if (!sid) return "Service";
      for (const cat of businessCategories) {
        const sub = cat.subcategories.find((s) => String(s.id) === sid);
        if (sub) {
          return `${cat.title}(${cat.subcategories.length})`;
        }
      }
      return getSubcategoryLabel(sid);
    },
    [businessCategories, getSubcategoryLabel],
  );

  const blankTeamServices = React.useMemo<TeamService>(
    () => ({
      slot1: "",
      slot2: "",
      slot3: "",
      slot4: "",
      slot5: "",
      slot6: "",
      slot7: "",
    }),
    [],
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

  const [featureTeamPublic, setFeatureTeamPublic] = React.useState(true);
  const [teamDrawerOpen, setTeamDrawerOpen] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [draftTeamName, setDraftTeamName] = React.useState("");
  const [draftTeamRole, setDraftTeamRole] = React.useState("");
  const [draftPhotoSrc, setDraftPhotoSrc] = React.useState<string>("/professionals/hero.png");
  const teamPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [draftServices, setDraftServices] = React.useState<TeamService>(() => ({ ...blankTeamServices }));

  const openAddDrawer = React.useCallback(() => {
    setEditingMemberId(null);
    setDraftTeamName("");
    setDraftTeamRole("");
    setDraftPhotoSrc("/professionals/hero.png");
    setDraftServices({ ...blankTeamServices });
    setTeamDrawerOpen(true);
  }, [blankTeamServices]);

  const openEditDrawer = React.useCallback((mem: TeamMemberUi) => {
    setEditingMemberId(mem.id);
    setDraftTeamName(mem.name);
    setDraftTeamRole(mem.role);
    setDraftPhotoSrc(mem.photoSrc);
    setDraftServices({ ...mem.services });
    setTeamDrawerOpen(true);
  }, []);

  const closeTeamDrawer = React.useCallback(() => setTeamDrawerOpen(false), []);

  const saveTeamMember = React.useCallback(() => {
    const name = draftTeamName.trim();
    const role = draftTeamRole.trim() || "Team member";
    if (!name) return;
    if (editingMemberId) {
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === editingMemberId ? { ...m, name, role, photoSrc: draftPhotoSrc, services: draftServices } : m,
        ),
      );
    } else {
      const id = `tm-${Date.now()}`;
      setTeamMembers((prev) => [
        { id, name, role, photoSrc: draftPhotoSrc, rating: 4.5, reviewsLabel: "(0 Reviews)", services: draftServices },
        ...prev,
      ]);
    }
    setTeamDrawerOpen(false);
  }, [draftTeamName, draftTeamRole, draftPhotoSrc, draftServices, editingMemberId]);

  const teamBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      for (const url of teamBlobUrlsRef.current) URL.revokeObjectURL(url);
      teamBlobUrlsRef.current = [];
    };
  }, []);

  const onChooseTeamPhoto = React.useCallback(() => {
    teamPhotoInputRef.current?.click();
  }, []);

  const onTeamPhotoSelected = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    teamBlobUrlsRef.current.push(url);
    setDraftPhotoSrc(url);
    e.target.value = "";
  }, []);

  const removeTeamMember = React.useCallback((id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMemberService = React.useCallback((id: string, key: keyof TeamService, value: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, services: { ...m.services, [key]: value } } : m)),
    );
  }, []);

  const addedBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      // Revoke any blob URLs we created to avoid memory leaks.
      for (const url of addedBlobUrlsRef.current) URL.revokeObjectURL(url);
      addedBlobUrlsRef.current = [];
    };
  }, []);

  const professionalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const onChooseProfessionalPhoto = React.useCallback(() => {
    professionalPhotoInputRef.current?.click();
  }, []);
  const onProfessionalPhotoSelected = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      addedBlobUrlsRef.current.push(url);
      setField("professionalPhotoSrc", url);
      e.target.value = "";
    },
    [setField],
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
    () => professionalEditableFieldKeys.some((key) => professionalDraft[key] !== savedProfessionalDraft[key]),
    [professionalDraft, savedProfessionalDraft],
  );
  const cancelProfessionalEditing = React.useCallback(() => {
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
          service_id: Number(value),
          title: matched?.label ?? null,
        };
      });
  }, [allSubcategoryOptions]);
  const businessEditKeys = React.useMemo(
    () =>
      [
        "offering",
        "profile",
        "location",
        "serviceFor",
        "servicesDetails",
        "manageTeam",
        "generalNotes",
        "price",
        "portfolio",
      ] as const,
    [],
  );
  type BusinessEditKey = (typeof businessEditKeys)[number];
  const [businessEditing, setBusinessEditing] = React.useState<Record<BusinessEditKey, boolean>>(() => {
    return businessEditKeys.reduce((acc, k) => {
      acc[k] = false;
      return acc;
    }, {} as Record<BusinessEditKey, boolean>);
  });
  const isAnyBusinessEditing = React.useMemo(
    () => businessEditKeys.some((k) => businessEditing[k]),
    [businessEditKeys, businessEditing],
  );
  const [isBusinessPublishEnabled, setIsBusinessPublishEnabled] = React.useState(false);
  const [isBusinessLocked, setIsBusinessLocked] = React.useState(false);
  const enableBusinessEditing = React.useCallback((key: BusinessEditKey) => {
    // Unlock on any edit action, but require Publish to lock again.
    setIsBusinessLocked(false);
    setBusinessEditing((p) => ({ ...p, [key]: true }));
  }, []);
  const enableAllBusinessEditing = React.useCallback(() => {
    setIsBusinessLocked(false);
    setBusinessEditing((p) => {
      const next = { ...p };
      for (const k of businessEditKeys) next[k] = true;
      return next;
    });
  }, [businessEditKeys]);
  const closeAllBusinessEditing = React.useCallback(() => {
    setBusinessEditing((p) => {
      const next = { ...p };
      for (const k of Object.keys(next) as BusinessEditKey[]) next[k] = false;
      return next;
    });
  }, []);
  const templateOptions = React.useMemo(() => ["Fixed Location", "Desired Location"] as const, []);
  type OfferingOption = (typeof templateOptions)[number];
  type OfferingSelectOption = OfferingOption | "Both";
  const offeringSelectOptions = React.useMemo(
    () => ["Fixed Location", "Desired Location", "Both"] as const,
    [],
  );
  const [businessOfferingSelect, setBusinessOfferingSelect] =
    React.useState<OfferingSelectOption>("Fixed Location");
  const businessOffering = React.useMemo<OfferingOption[]>(
    () => (businessOfferingSelect === "Both" ? ["Fixed Location", "Desired Location"] : [businessOfferingSelect]),
    [businessOfferingSelect],
  );
  const useSameBusinessInfo = businessOfferingSelect === "Both";
  const [activeBusinessTemplate, setActiveBusinessTemplate] = React.useState<OfferingOption>("Fixed Location");

  const showFixedLocationSection = businessOfferingSelect === "Fixed Location" || businessOfferingSelect === "Both";
  const showDesiredLocationSection =
    businessOfferingSelect === "Desired Location" || businessOfferingSelect === "Both";
  const showKilometerAllowance = businessOfferingSelect !== "Fixed Location";

  const locationSectionTitle = React.useMemo(() => {
    if (businessOfferingSelect === "Desired Location") return "Desired Location";
    if (businessOfferingSelect === "Fixed Location") return "Fixed Location";
    return data.location.title;
  }, [businessOfferingSelect, data.location.title]);

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

  // If "same info" is enabled, keep Desired synced to Fixed.
  React.useEffect(() => {
    if (!useSameBusinessInfo) return;
    setDesiredBusiness(getCurrentBusinessState());
  }, [getCurrentBusinessState, useSameBusinessInfo]);

  const biz = activeBusinessTemplate === "Fixed Location" ? getCurrentBusinessState() : desiredBusiness;

  const fixedBiz = getCurrentBusinessState();
  const setFixedBizField = React.useCallback(
    <K extends keyof BusinessTemplateState>(key: K, value: BusinessTemplateState[K]) => {
      setIsBusinessPublishEnabled(true);
      setField(key as any, value as any);
      if (useSameBusinessInfo) setDesiredBusiness((p) => ({ ...p, [key]: value }));
    },
    [setField, useSameBusinessInfo],
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
          disabled={!businessEditing.location}
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
          disabled={!businessEditing.location}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <MollureFormField
          label="Street Number"
          placeholder="Street Number"
          value={fixedBiz.streetNumber}
          onChange={(e) => setFixedBizField("streetNumber", e.target.value)}
          disabled={!businessEditing.location}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          label="Postal code"
          placeholder="Postal code"
          value={fixedBiz.postalCode}
          onChange={(e) => setFixedBizField("postalCode", e.target.value)}
          disabled={!businessEditing.location}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          select
          label="Province"
          value={fixedBiz.province}
          onChange={(e) => setFixedBizField("province", e.target.value)}
          disabled={!businessEditing.location}
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
          disabled={!businessEditing.location}
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
          onChange={(e) => setDesiredAreaMode(e.target.value as any)}
          disabled={!businessEditing.location}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        >
          <MenuItem value="Specific areas only">Specific areas only</MenuItem>
          <MenuItem value="All Netherlands">All Netherlands</MenuItem>
        </MollureFormField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.6 }}>
          Province
        </Typography>
        <MollureFormField
          select
          value={desiredProvinceDraft}
          onChange={(e) => {
            const p = e.target.value as any;
            setDesiredProvinceDraft(p);
            setDesiredMunicipalityDraft("");
          }}
          disabled={!businessEditing.location || desiredAreaMode !== "Specific areas only"}
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
              disabled={!businessEditing.location || desiredAreaMode !== "Specific areas only"}
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
            disabled={
              !businessEditing.location ||
              desiredAreaMode !== "Specific areas only" ||
              !desiredMunicipalityDraft.trim()
            }
            sx={{
              width: 36,
              height: 36,
              borderRadius: "999px",
              bgcolor: alpha(m.teal, 0.18),
              color: m.tealDark,
              border: `1px solid ${alpha(m.tealDark, 0.12)}`,
              "&:hover": { bgcolor: alpha(m.teal, 0.26) },
            }}
            aria-label="Add desired area"
          >
            <AddRoundedIcon />
          </IconButton>
        </Stack>
      </Grid>

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
                    disabled={!businessEditing.location}
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

      const writeFixed = () => setField(key as any, value as any);
      const writeDesired = () => setDesiredBusiness((p) => ({ ...p, [key]: value }));

      if (useSameBusinessInfo) {
        writeFixed();
        writeDesired();
        return;
      }

      if (activeBusinessTemplate === "Fixed Location") writeFixed();
      else writeDesired();
    },
    [activeBusinessTemplate, setField, useSameBusinessInfo],
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
    // Keep the section open for editing; enable publishing after a save.
    setBusinessEditing((p) => ({ ...p, profile: true }));
    setIsBusinessPublishEnabled(true);
  }, []);

  const onPublishBusinessSetup = React.useCallback(async () => {
    if (!onSaveBusinessSetup) {
      setIsBusinessPublishEnabled(false);
      setIsBusinessLocked(true);
      closeAllBusinessEditing();
      return;
    }

    const locationModeMap: Record<OfferingSelectOption, UpsertBusinessSetupRequest["location_mode"]> = {
      "Fixed Location": "fixed",
      "Desired Location": "desired",
      Both: "both",
    };
    const sourceBiz = businessOfferingSelect === "Desired Location" ? desiredBusiness : fixedBiz;
    const serviceItems = businessOfferingSelect === "Desired Location" ? servicesDesired : servicesFixed;
    const desiredAreaText =
      desiredAreaMode === "All Netherlands"
        ? "All Netherlands"
        : desiredAreas.map((area) => area.municipality).filter(Boolean).join(", ");
    const desiredProvinceText =
      desiredAreaMode === "All Netherlands"
        ? "All Netherlands"
        : Array.from(new Set(desiredAreas.map((area) => area.province).filter(Boolean))).join(", ");

    await onSaveBusinessSetup({
      location_mode: locationModeMap[businessOfferingSelect],
      business_name: sourceBiz.profileName,
      business_about: sourceBiz.about,
      business_keywords: sourceBiz.keywords,
      business_media: mediaSlides.filter((item) => item && !item.startsWith("blob:")).slice(0, 4),
      salon_name: fixedBiz.salonName,
      fixed_location_address: fixedBiz.streetAddress,
      fixed_location_street_number: fixedBiz.streetNumber,
      fixed_location_postal_code: fixedBiz.postalCode,
      fixed_location_province: fixedBiz.province,
      fixed_location_municipality: fixedBiz.municipality,
      service_for: Object.entries(sourceBiz.serviceFor)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
      service_categories: serviceItems
        .filter((item) => item.serviceId && item.categoryId)
        .map((item) => ({
          category_id: Number(item.categoryId),
          service_id: item.serviceId,
          amount: Number(String(item.priceLabel).replace(/[^0-9.]/g, "")) || 0,
        })),
      project: sourceBiz.projectEnabled ? sourceBiz.projectInstructions : "",
      book_service_notes: sourceBiz.bookComboInstructions,
      book_service_combinations: sourceBiz.projectEnabled
        ? sourceBiz.bookCombos
            .map((combo) => {
              const category = businessCategories.find((item) => String(item.id) === combo.categoryId);
              const service = category
                ? category.subcategories.find((item) => String(item.id) === combo.serviceId)
                : businessCategories
                    .flatMap((item) => item.subcategories)
                    .find((item) => String(item.id) === combo.serviceId);
              const categoryId = Number(combo.categoryId);
              const serviceId = Number(combo.serviceId);

              if (!Number.isInteger(categoryId) || !Number.isInteger(serviceId)) {
                return null;
              }

              return {
                category_id: categoryId,
                category_title: category?.title ?? null,
                service_id: serviceId,
                service_title: service?.title ?? null,
              };
            })
            .filter(
              (
                combo,
              ): combo is {
                category_id: number;
                category_title: string | null;
                service_id: number;
                service_title: string | null;
              } => combo !== null,
            )
        : [],
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
      team_members: teamMembers.map((member, index) => ({
        id: /^\d+$/.test(member.id) ? Number(member.id) : undefined,
        full_name: member.name,
        role: member.role,
        profile_photo: member.photoSrc.startsWith("blob:") ? null : member.photoSrc,
        assigned_services: toTeamServicePayload(member.services),
        display_order: index + 1,
      })),
    });

    setIsBusinessPublishEnabled(false);
    setIsBusinessLocked(true);
    closeAllBusinessEditing();
  }, [
    businessOfferingSelect,
    businessCategories,
    closeAllBusinessEditing,
    desiredAreaMode,
    desiredAreas,
    desiredBusiness,
    fixedBiz,
    mediaSlides,
    onSaveBusinessSetup,
    teamMembers,
    toTeamServicePayload,
    values,
  ]);

  const onSwitchActiveBusinessTemplate = React.useCallback(
    (opt: OfferingOption) => {
      if (isBusinessLocked) return;
      setActiveBusinessTemplate(opt);
    },
    [isBusinessLocked],
  );

  // ── Services (template-aware) + drawer ────────────────────────────────────
  const initialServiceItems = React.useMemo(
    () => [] as ServiceDetailUiItem[],
    [],
  );
  const [servicesFixed, setServicesFixed] = React.useState<ServiceDetailUiItem[]>(() => initialServiceItems);
  const [servicesDesired, setServicesDesired] = React.useState<ServiceDetailUiItem[]>(() => initialServiceItems);
  React.useEffect(() => {
    setServicesFixed(initialServiceItems);
    setServicesDesired(initialServiceItems);
  }, [initialServiceItems]);

  React.useEffect(() => {
    if (!useSameBusinessInfo) return;
    setServicesDesired(servicesFixed);
  }, [servicesFixed, useSameBusinessInfo]);

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

    const savedServices = businessSetupData.service_details.map((item) => {
      const rawPrice = item.price;
      const priceStr =
        rawPrice !== null && rawPrice !== undefined && String(rawPrice).trim() !== ""
          ? (() => {
              const n = String(rawPrice).trim().replace(/\s*€\s*$/i, "").trim();
              return n.includes("€") ? n : `${n} €`;
            })()
          : "";
      return {
        id: String(item.service_id),
        categoryId: String(item.category_id),
        serviceId: item.service_id,
        name: item.service_title || "",
        categoryTitle: item.category_title || undefined,
        priceLabel: priceStr,
      };
    });
    setServicesFixed(savedServices);
    setServicesDesired(savedServices);

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
  }, [businessSetupData, defaultServices, setField, toDisplayNumber, values.amenities, values.depositEnabled, values.depositValue, values.discountEnabled, values.discountValue]);

  const activeServices = activeBusinessTemplate === "Fixed Location" ? servicesFixed : servicesDesired;
  const setActiveServices = React.useCallback(
    (updater: (prev: ServiceDetailUiItem[]) => ServiceDetailUiItem[]) => {
      setIsBusinessPublishEnabled(true);
      if (useSameBusinessInfo) {
        setServicesFixed((p) => {
          const next = updater(p);
          setServicesDesired(next);
          return next;
        });
        return;
      }
      if (activeBusinessTemplate === "Fixed Location") setServicesFixed(updater);
      else setServicesDesired(updater);
    },
    [activeBusinessTemplate, useSameBusinessInfo],
  );

  const [serviceDrawerOpen, setServiceDrawerOpen] = React.useState(false);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(null);
  const [draftServiceCategory, setDraftServiceCategory] = React.useState<string>("");
  const [draftServiceId, setDraftServiceId] = React.useState<number | "">("");
  const [draftServiceName, setDraftServiceName] = React.useState("");
  const [draftServiceDuration, setDraftServiceDuration] = React.useState("");
  const [draftServicePriceType, setDraftServicePriceType] = React.useState("fixed");
  const [draftServicePriceAmount, setDraftServicePriceAmount] = React.useState("");
  const [draftServiceDiscountType, setDraftServiceDiscountType] = React.useState("fixed");
  const [draftServiceDiscountAmount, setDraftServiceDiscountAmount] = React.useState("");
  const [serviceDrawerEditBaseline, setServiceDrawerEditBaseline] = React.useState<ServiceDrawerEditBaseline | null>(
    null,
  );
  const [expandedServiceDetailIds, setExpandedServiceDetailIds] = React.useState<Record<string, boolean>>({});
  /** View flow: fields stay read-only until the user taps the header edit control. */
  const [serviceDrawerFieldsLocked, setServiceDrawerFieldsLocked] = React.useState(true);

  const openAddServiceDrawerForCategory = React.useCallback(
    (categoryId: string) => {
      setEditingServiceId(null);
      setServiceDrawerEditBaseline(null);
      setServiceDrawerFieldsLocked(false);
      const valid =
        categoryId && businessCategories.some((c) => String(c.id) === categoryId)
          ? categoryId
          : businessCategories[0]
            ? String(businessCategories[0].id)
            : "";
      setDraftServiceCategory(valid);
      setDraftServiceId("");
      setDraftServiceName("");
      setDraftServiceDuration("");
      setDraftServicePriceType("fixed");
      setDraftServicePriceAmount("");
      setDraftServiceDiscountType("fixed");
      setDraftServiceDiscountAmount("");
      setServiceDrawerOpen(true);
    },
    [businessCategories],
  );

  const openAddServiceDrawer = React.useCallback(() => {
    const cat =
      activeServiceCategory &&
      activeServiceCategory !== "all" &&
      businessCategories.some((c) => String(c.id) === activeServiceCategory)
        ? activeServiceCategory
        : businessCategories[0]
          ? String(businessCategories[0].id)
          : "";
    openAddServiceDrawerForCategory(cat);
  }, [activeServiceCategory, businessCategories, openAddServiceDrawerForCategory]);

  const toggleServiceDetailExpand = React.useCallback((id: string) => {
    setExpandedServiceDetailIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openEditServiceDrawer = React.useCallback((it: ServiceDetailUiItem, fieldsLocked = true) => {
    setEditingServiceId(it.id);
    setDraftServiceCategory(it.categoryId);
    setDraftServiceId(it.serviceId);
    setDraftServiceName(it.name);
    setDraftServiceDuration(it.durationLabel || "");
    const parsed = parsePriceLabelForDrawer(it.priceLabel);
    const pt = normalizePriceType(it.priceType ?? parsed.type);
    const pa = it.priceAmount ?? parsed.amount;
    setDraftServicePriceType(pt);
    setDraftServicePriceAmount(pa);
    const dType = normalizeDiscountType(it.discountType);
    setDraftServiceDiscountType(dType);
    setDraftServiceDiscountAmount((it.discountAmount ?? "").trim());
    setServiceDrawerEditBaseline({
      categoryId: String(it.categoryId),
      serviceId: it.serviceId,
      name: it.name,
      duration: it.durationLabel || "",
      priceType: pt,
      priceAmount: pa,
      discountType: dType,
      discountAmount: (it.discountAmount ?? "").trim(),
    });
    setServiceDrawerOpen(true);
    setServiceDrawerFieldsLocked(fieldsLocked);
  }, []);

  const closeServiceDrawer = React.useCallback(() => {
    setServiceDrawerOpen(false);
    setEditingServiceId(null);
    setServiceDrawerEditBaseline(null);
    setServiceDrawerFieldsLocked(true);
    setDraftServicePriceType("fixed");
    setDraftServicePriceAmount("");
    setDraftServiceDiscountType("fixed");
    setDraftServiceDiscountAmount("");
  }, []);

  const serviceDrawerDirty = React.useMemo(() => {
    if (!editingServiceId || !serviceDrawerEditBaseline) return false;
    const b = serviceDrawerEditBaseline;
    const sid = draftServiceId === "" ? null : Number(draftServiceId);
    if (sid === null || Number.isNaN(sid)) return false;
    const discAmt = draftServiceDiscountAmount.trim();
    const bDiscAmt = b.discountAmount.trim();
    return (
      b.categoryId !== draftServiceCategory ||
      b.serviceId !== sid ||
      b.name !== draftServiceName ||
      b.duration !== draftServiceDuration ||
      b.priceType !== draftServicePriceType ||
      b.priceAmount !== draftServicePriceAmount ||
      b.discountType !== draftServiceDiscountType ||
      bDiscAmt !== discAmt
    );
  }, [
    draftServiceCategory,
    draftServiceDiscountAmount,
    draftServiceDiscountType,
    draftServiceDuration,
    draftServiceId,
    draftServiceName,
    draftServicePriceAmount,
    draftServicePriceType,
    editingServiceId,
    serviceDrawerEditBaseline,
  ]);

  const saveService = React.useCallback(() => {
    if (!draftServiceCategory || !draftServiceId) return;
    const matchedCategory = businessCategories.find((category) => String(category.id) === draftServiceCategory);
    const matchedService = matchedCategory?.subcategories.find((subcategory) => subcategory.id === Number(draftServiceId));
    if (!matchedService) return;

    const name = draftServiceName.trim() || matchedService.title;
    const durationLabel = draftServiceDuration.trim();

    const priceLabel = formatServicePriceLabel(draftServicePriceType, draftServicePriceAmount);
    const discountTypeSaved = normalizeDiscountType(draftServiceDiscountType);
    const rawDisc = draftServiceDiscountAmount.trim();
    const discVal = parseEuroAmountString(rawDisc);
    let discountAmount = "";
    if (discVal !== null && discVal > 0) {
      if (discountTypeSaved === "percent" && discVal > 100) discountAmount = "";
      else discountAmount = rawDisc;
    }
    const categoryId = draftServiceCategory;
    const categoryTitle = matchedCategory?.title;

    const servicePayload = {
      name,
      durationLabel,
      priceLabel,
      categoryId,
      serviceId: matchedService.id,
      categoryTitle,
      priceType: normalizePriceType(draftServicePriceType),
      priceAmount: draftServicePriceAmount,
      discountType: discountTypeSaved,
      discountAmount,
    };

    if (editingServiceId) {
      setActiveServices((prev) =>
        prev.map((s) => (s.id === editingServiceId ? { ...s, ...servicePayload } : s)),
      );
    } else {
      const id = String(matchedService.id);
      setActiveServices((prev) => [
        { id, ...servicePayload },
        ...prev.filter((item) => item.serviceId !== matchedService.id),
      ]);
    }
    setEditingServiceId(null);
    setServiceDrawerEditBaseline(null);
    setServiceDrawerOpen(false);
    setDraftServicePriceType("fixed");
    setDraftServicePriceAmount("");
    setDraftServiceDiscountType("fixed");
    setDraftServiceDiscountAmount("");
  }, [
    businessCategories,
    draftServiceCategory,
    draftServiceDiscountAmount,
    draftServiceDiscountType,
    draftServiceDuration,
    draftServiceId,
    draftServiceName,
    draftServicePriceAmount,
    draftServicePriceType,
    editingServiceId,
    setActiveServices,
  ]);

  const deleteService = React.useCallback(
    (id: string) => {
      setActiveServices((prev) => prev.filter((s) => s.id !== id));
    },
    [setActiveServices],
  );

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
                  onClick={() => openEditServiceDrawer(it)}
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
                  View
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
                  onClick={() => openEditServiceDrawer(it, false)}
                  disabled={isBusinessLocked || !businessEditing.servicesDetails}
                  sx={{ width: 32, height: 32, color: alpha(m.navy, 0.45) }}
                >
                  <EditRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Delete service"
                  onClick={() => deleteService(it.id)}
                  disabled={isBusinessLocked || !businessEditing.servicesDetails}
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
    [
      businessEditing.servicesDetails,
      deleteService,
      expandedServiceDetailIds,
      isBusinessLocked,
      m.navy,
      openEditServiceDrawer,
      toggleServiceDetailExpand,
    ],
  );

  const professionalForm = (
    <Stack spacing={2.1}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: "999px",
            overflow: "hidden",
            bgcolor: alpha(m.navy, 0.06),
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            flex: "0 0 auto",
            position: "relative",
          }}
        >
          <Image
            src={values.professionalPhotoSrc}
            alt="Profile"
            width={90}
            height={90}
            unoptimized
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <IconButton
            size="small"
            onClick={onChooseProfessionalPhoto}
            disabled={professionalFieldsDisabled}
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
          accept="image/*"
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
            <MollureFormField
              label="Legal Name*"
              placeholder="e.g Jane"
              value={values.companyLegalName}
              onChange={(e) => {
                setField("companyLegalName", e.target.value);
                setProfileErrors((prev) => (prev.companyLegalName ? { ...prev, companyLegalName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.companyLegalName)}
              helperText={profileErrors.companyLegalName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="COC number*"
              value={values.companyCocNumber}
              onChange={(e) => setField("companyCocNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="VAT number*"
              value={values.companyVatNumber}
              onChange={(e) => setField("companyVatNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
              Business Address
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              placeholder="Street"
              value={values.companyStreet}
              onChange={(e) => setField("companyStreet", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              placeholder="Number"
              value={values.companyStreetNumber}
              onChange={(e) => setField("companyStreetNumber", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureFormField
              placeholder="Postal Code"
              value={values.companyPostalCode}
              onChange={(e) => setField("companyPostalCode", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureFormField
              select
              placeholder="Province"
              value={values.companyProvince || "Province"}
              onChange={(e) => setField("companyProvince", e.target.value)}
              disabled={professionalFieldsDisabled}
            >
              {["Province", "North Holland", "South Holland"].map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </MollureFormField>
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureFormField
              select
              placeholder="Municipality"
              value={values.companyMunicipality || "Municipality"}
              onChange={(e) => setField("companyMunicipality", e.target.value)}
              disabled={professionalFieldsDisabled}
            >
              {["Municipality", "Amsterdam", "Rotterdam"].map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </MollureFormField>
          </Grid>
          <Grid item xs={12}>
            <MollureFormField
              select
              placeholder="Select Business Type"
              value={values.companyBusinessType || "Select Business Type"}
              onChange={(e) => setField("companyBusinessType", e.target.value)}
              disabled={professionalFieldsDisabled}
            >
              {["Select Business Type", "Salon Owner", "Freelancer"].map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </MollureFormField>
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
            <MollureFormField
              placeholder="Website"
              value={values.companyWebsite}
              onChange={(e) => setField("companyWebsite", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureFormField
              placeholder="Instagram"
              value={values.socialInstagram}
              onChange={(e) => setField("socialInstagram", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MollureFormField
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
            <MollureFormField
              label="First Name*"
              placeholder="e.g Jane"
              value={values.contactFirstName}
              onChange={(e) => {
                setField("contactFirstName", e.target.value);
                setProfileErrors((prev) => (prev.contactFirstName ? { ...prev, contactFirstName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactFirstName)}
              helperText={profileErrors.contactFirstName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Last Name*"
              placeholder="e.g Doe"
              value={values.contactLastName}
              onChange={(e) => {
                setField("contactLastName", e.target.value);
                setProfileErrors((prev) => (prev.contactLastName ? { ...prev, contactLastName: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactLastName)}
              helperText={profileErrors.contactLastName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Email*"
              placeholder="Your@gmail.com"
              value={values.contactEmail}
              inputProps={{ readOnly: true }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactEmail)}
              helperText={profileErrors.contactEmail}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Phone number*"
              value={values.contactPhone}
              onChange={(e) => setField("contactPhone", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Password*"
              type="password"
              placeholder="Enter Password"
              value={values.contactPassword}
              onChange={(e) => {
                setField("contactPassword", e.target.value);
                setProfileErrors((prev) => (prev.contactPassword ? { ...prev, contactPassword: undefined } : prev));
              }}
              disabled={professionalFieldsDisabled}
              error={Boolean(profileErrors.contactPassword)}
              helperText={profileErrors.contactPassword}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Repeat password*"
              type="password"
              placeholder="Confirm Password"
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

  const onFilesSelected = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const urls = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    if (!urls.length) return;
    addedBlobUrlsRef.current.push(...urls);
    setMediaSlides((prev) => [...urls, ...prev]);
    setMediaIdx(0);
    // Allow selecting the same file again later.
    e.target.value = "";
  }, []);

  const serviceCategoryTabs = React.useMemo<
    Array<{ id: string; label: string; iconId: ServiceCategorySliderIconId }>
  >(
    () => [
      { id: "all", label: "All", iconId: "all" },
      ...businessCategories.map((category) => ({
        id: String(category.id),
        label: category.title,
        iconId: resolveServiceCategorySliderIconId(category.title),
      })),
    ],
    [businessCategories],
  );

  const groupedAllServiceSections = React.useMemo(() => {
    const by = new Map<string, ServiceDetailUiItem[]>();
    for (const s of activeServices) {
      const key = String(s.categoryId ?? "").trim();
      if (!key) continue;
      const list = by.get(key) ?? [];
      list.push(s);
      by.set(key, list);
    }

    const titleFor = (categoryId: string, items: ServiceDetailUiItem[]) =>
      businessCategories.find((c) => String(c.id) === categoryId)?.title ??
      serviceCategoryTabs.find((t) => t.id === categoryId)?.label ??
      items[0]?.categoryTitle ??
      `Category ${categoryId}`;

    const sections: Array<{ categoryId: string; title: string; items: ServiceDetailUiItem[] }> = [];
    const seen = new Set<string>();

    for (const t of serviceCategoryTabs) {
      if (t.id === "all") continue;
      const items = by.get(t.id);
      if (!items?.length) continue;
      sections.push({ categoryId: t.id, title: titleFor(t.id, items), items });
      seen.add(t.id);
    }

    for (const [categoryId, items] of by.entries()) {
      if (seen.has(categoryId) || !items.length) continue;
      sections.push({ categoryId, title: titleFor(categoryId, items), items });
      seen.add(categoryId);
    }

    return sections;
  }, [activeServices, businessCategories, serviceCategoryTabs]);

  const activeCategoryServices = React.useMemo(
    () =>
      activeServices.filter((it) => String(it.categoryId ?? "").trim() === String(activeServiceCategory ?? "").trim()),
    [activeServiceCategory, activeServices],
  );

  const serviceCategoryTabsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const activeServiceCategoryTabRef = React.useRef<HTMLButtonElement | null>(null);
  const [tabScrollState, setTabScrollState] = React.useState({ canLeft: false, canRight: false });

  const updateTabScrollState = React.useCallback(() => {
    const el = serviceCategoryTabsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setTabScrollState({
      canLeft: scrollLeft > 2,
      canRight: scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  React.useEffect(() => {
    updateTabScrollState();
    const el = serviceCategoryTabsScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateTabScrollState());
    ro.observe(el);
    el.addEventListener("scroll", updateTabScrollState, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateTabScrollState);
    };
  }, [updateTabScrollState, serviceCategoryTabs.length, activeServices.length]);

  React.useLayoutEffect(() => {
    activeServiceCategoryTabRef.current?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    updateTabScrollState();
  }, [activeServiceCategory, updateTabScrollState]);

  const scrollServiceCategoryTabs = React.useCallback(
    (delta: number) => {
      const el = serviceCategoryTabsScrollRef.current;
      if (!el) return;
      el.scrollBy({ left: delta, behavior: "smooth" });
      window.setTimeout(() => updateTabScrollState(), 320);
    },
    [updateTabScrollState],
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
    () => getBookingServiceOptions(biz.bookCategory),
    [biz.bookCategory, getBookingServiceOptions],
  );

  const addBookingCombo = React.useCallback(() => {
    const categoryId = biz.bookCategory || bookingCategoryOptions[0]?.value || "";
    const serviceOptions = getBookingServiceOptions(categoryId);
    const serviceId = biz.bookService || serviceOptions[0]?.value || "";
    if (!categoryId || !serviceId) return;

    const id = `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setBizField("bookCombos", [...biz.bookCombos, { id, categoryId, serviceId }]);
  }, [biz.bookCategory, biz.bookCombos, biz.bookService, bookingCategoryOptions, getBookingServiceOptions, setBizField]);

  const updateBookingCombo = React.useCallback(
    (id: string, patch: Partial<{ categoryId: string; serviceId: string }>) => {
      setBizField(
        "bookCombos",
        biz.bookCombos.map((combo) => {
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
    [biz.bookCombos, getBookingServiceOptions, setBizField],
  );

  const deleteBookingCombo = React.useCallback(
    (id: string) => {
      setBookingComboEditId((prev) => (prev === id ? null : prev));
      setBizField(
        "bookCombos",
        biz.bookCombos.filter((c) => c.id !== id),
      );
    },
    [biz.bookCombos, setBizField],
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.5 }}>
          {isProfessionalEditing ? (
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
          ) : null}
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

              await onSaveProfessionalProfile({
                email: values.contactEmail,
                password: values.contactPassword || undefined,
                confirm_password: values.contactRepeatPassword || undefined,
                legal_name: values.companyLegalName,
                ccc_number: values.companyCocNumber,
                vat_number: values.companyVatNumber,
                street: values.companyStreet,
                street_number: values.companyStreetNumber,
                postal_code: values.companyPostalCode,
                province: values.companyProvince,
                municipality: values.companyMunicipality,
                business_type: values.companyBusinessType,
                website: values.companyWebsite,
                instagram: values.socialInstagram,
                other_link: values.socialOther,
                contact_first_name: values.contactFirstName,
                contact_last_name: values.contactLastName,
                phone: values.contactPhone,
              });
              const nextSavedProfessionalDraft = {
                ...professionalDraft,
                contactPassword: "",
                contactRepeatPassword: "",
              };
              setSavedProfessionalDraft(nextSavedProfessionalDraft);
              applyProfessionalDraft(nextSavedProfessionalDraft, savedProfessionalPhotoSrc);
              setProfileErrors({});
              setIsProfessionalEditing(false);
            }}
            disabled={!isProfessionalEditing || !isProfessionalDirty || isProfileSaving}
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
      </Stack>
    </Box>
  );

  const visibleTeamDrawerSlots = React.useMemo(
    () => getVisibleTeamServiceSlotKeys(draftServices),
    [draftServices],
  );

  const teamDrawer = (
    <Drawer
      anchor="right"
      open={teamDrawerOpen}
      onClose={closeTeamDrawer}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460 },
          p: 2.5,
          borderTopLeftRadius: { sm: 12 },
          borderBottomLeftRadius: { sm: 12 },
        },
      }}
    >
      <Stack spacing={2.25} sx={{ height: "100%", overflowY: "auto" }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, color: alpha(m.navy, 0.9), letterSpacing: "-0.02em" }}>
            {editingMemberId ? "Edit team member" : "Add team member"}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: alpha(m.navy, 0.52), lineHeight: 1.45 }}>
            {editingMemberId
              ? "Update their profile, photo, and assigned services."
              : "Add their name and role, then assign one or more services."}
          </Typography>
        </Stack>

        <Stack spacing={1.75}>
          <MollureFormField
            label="Full name"
            placeholder="e.g. Craig Martha"
            value={draftTeamName}
            onChange={(e) => setDraftTeamName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
          />
          <MollureFormField
            label="Role"
            placeholder="e.g. Stylist"
            value={draftTeamRole}
            onChange={(e) => setDraftTeamRole(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
          />
        </Stack>

        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: alpha(m.navy, 0.03),
            p: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.78), mb: 1.5 }}>
            Profile photo
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "999px",
                overflow: "hidden",
                bgcolor: "#fff",
                border: `1px solid ${alpha(m.navy, 0.10)}`,
                flex: "0 0 auto",
                boxShadow: `0 4px 14px ${alpha(m.navy, 0.06)}`,
              }}
            >
              <Image
                src={draftPhotoSrc}
                alt="Team member photo"
                width={64}
                height={64}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Button
                onClick={onChooseTeamPhoto}
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 800,
                  borderColor: alpha(m.navy, 0.14),
                  color: alpha(m.navy, 0.78),
                  bgcolor: "#fff",
                }}
              >
                Upload photo
              </Button>
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: alpha(m.navy, 0.45) }}>
                JPG or PNG, square works best.
              </Typography>
            </Stack>
            <input ref={teamPhotoInputRef} type="file" accept="image/*" hidden onChange={onTeamPhotoSelected} />
          </Stack>
        </Box>

        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: alpha(m.navy, 0.03),
            p: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.78), mb: 0.5 }}>
            Assigned services
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: alpha(m.navy, 0.45), mb: 1.5 }}>
            Only the fields you need are shown. Pick a service to reveal the next slot (up to seven).
          </Typography>
          <Grid container spacing={1.5}>
            {visibleTeamDrawerSlots.map((key) => {
              const n = TEAM_SERVICE_SLOT_KEYS.indexOf(key) + 1;
              return (
                <Grid key={key} item xs={12} sm={6}>
                  <MollureFormField
                    select
                    label={`Service ${n}`}
                    value={draftServices[key]}
                    onChange={(e) => setDraftServices((p) => ({ ...p, [key]: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: alpha(m.navy, 0.45) }}>Select service</Typography>
                    </MenuItem>
                    {allSubcategoryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Box sx={{ flex: 1, minHeight: 8 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button
            onClick={closeTeamDrawer}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveTeamMember}
            variant="contained"
            disableElevation
            disabled={!draftTeamName.trim()}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "mollure.tealDark" },
            }}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );

  const serviceDrawerFormDisabled =
    Boolean(editingServiceId && serviceDrawerFieldsLocked) || isBusinessLocked || !businessEditing.servicesDetails;

  const serviceDrawer = (
    <Drawer
      anchor="right"
      open={serviceDrawerOpen}
      onClose={closeServiceDrawer}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460 },
          p: 2.5,
          borderTopLeftRadius: { sm: 12 },
          borderBottomLeftRadius: { sm: 12 },
        },
      }}
    >
      <Stack spacing={2.25} sx={{ height: "100%", overflowY: "auto" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, color: alpha(m.navy, 0.9), letterSpacing: "-0.02em" }}>
            {editingServiceId
              ? serviceDrawerFieldsLocked
                ? "View Service"
                : "Edit Service"
              : "Add service"}
          </Typography>
          {editingServiceId && serviceDrawerFieldsLocked ? (
            <IconButton
              size="small"
              aria-label="Edit service"
              disabled={isBusinessLocked || !businessEditing.servicesDetails}
              onClick={() => setServiceDrawerFieldsLocked(false)}
              sx={{ color: alpha(m.navy, 0.55) }}
            >
              <EditRoundedIcon sx={{ fontSize: 24 }} />
            </IconButton>
          ) : null}
        </Stack>

        <Stack spacing={2}>
          {!editingServiceId ? (
            <>
              <MollureFormField
                select
                disabled={serviceDrawerFormDisabled}
                label="Category"
                value={draftServiceCategory}
                onChange={(e) => {
                  setDraftServiceCategory(String(e.target.value));
                  setDraftServiceId("");
                  setDraftServiceName("");
                }}
              >
                {businessCategories.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>
                    {category.title}
                  </MenuItem>
                ))}
              </MollureFormField>
              <MollureFormField
                select
                disabled={serviceDrawerFormDisabled}
                label="Service"
                value={draftServiceId}
                onChange={(e) => {
                  const sid = Number(e.target.value);
                  setDraftServiceId(sid);
                  const cat = businessCategories.find((c) => String(c.id) === draftServiceCategory);
                  const sub = cat?.subcategories.find((s) => s.id === sid);
                  if (sub) setDraftServiceName(sub.title);
                }}
              >
                {(businessCategories.find((category) => String(category.id) === draftServiceCategory)?.subcategories ?? []).map(
                  (subcategory) => (
                    <MenuItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.title}
                    </MenuItem>
                  ),
                )}
              </MollureFormField>
            </>
          ) : null}

          <MollureFormField
            disabled={serviceDrawerFormDisabled}
            label="Service name"
            placeholder="Service name"
            value={draftServiceName}
            onChange={(e) => setDraftServiceName(e.target.value)}
          />

          <MollureFormField
            disabled={serviceDrawerFormDisabled}
            label="Duration"
            placeholder="e.g. 45 min"
            value={draftServiceDuration}
            onChange={(e) => setDraftServiceDuration(e.target.value)}
          />

          <Box>
            <Typography
              component="span"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: alpha(m.navy, 0.62),
                mb: 0.75,
                display: "block",
              }}
            >
              Price
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <MollureFormField
                select
                disabled={serviceDrawerFormDisabled}
                value={draftServicePriceType}
                onChange={(e) => {
                  const v = String(e.target.value);
                  setDraftServicePriceType(v);
                }}
                sx={{ flex: "0 0 42%", minWidth: 0 }}
                inputProps={{ "aria-label": "Price type" }}
              >
                {SERVICE_DRAWER_PRICE_TYPES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MollureFormField>
              <MollureFormField
                disabled={serviceDrawerFormDisabled}
                placeholder="0"
                value={draftServicePriceAmount}
                onChange={(e) => setDraftServicePriceAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                sx={{ flex: 1, minWidth: 0 }}
                inputProps={{ "aria-label": "Price amount" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: alpha(m.navy, 0.55) }}>€</Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>EUR</Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: "10px",
              bgcolor: alpha(m.navy, 0.045),
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              p: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: alpha(m.navy, 0.88), mb: 1.75 }}>
              Add Discount (Optional)
            </Typography>
            <Stack spacing={1.5}>
              <MollureFormField
                select
                disabled={serviceDrawerFormDisabled}
                label="Discount type"
                value={draftServiceDiscountType}
                onChange={(e) => setDraftServiceDiscountType(String(e.target.value))}
              >
                {SERVICE_DRAWER_DISCOUNT_TYPES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MollureFormField>
              <MollureFormField
                disabled={serviceDrawerFormDisabled}
                label="Discount amount"
                placeholder="0"
                value={draftServiceDiscountAmount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (draftServiceDiscountType === "percent") {
                    const v = raw.replace(/[^\d.]/g, "");
                    const dot = v.indexOf(".");
                    if (dot === -1) setDraftServiceDiscountAmount(v);
                    else setDraftServiceDiscountAmount(v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, ""));
                  } else {
                    setDraftServiceDiscountAmount(raw.replace(/[^\d.,]/g, ""));
                  }
                }}
                InputProps={
                  draftServiceDiscountType === "percent"
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>%</Typography>
                          </InputAdornment>
                        ),
                      }
                    : {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: alpha(m.navy, 0.55) }}>€</Typography>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(m.navy, 0.5) }}>EUR</Typography>
                          </InputAdornment>
                        ),
                      }
                }
              />
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 8 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button
            onClick={closeServiceDrawer}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.72),
            }}
          >
            Cancel
          </Button>
          {editingServiceId ? (
            !serviceDrawerFieldsLocked && serviceDrawerDirty ? (
              <Button
                onClick={saveService}
                variant="contained"
                disableElevation
                disabled={!draftServiceCategory || !draftServiceId}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "mollure.tealDark" },
                }}
              >
                Save
              </Button>
            ) : null
          ) : (
            <Button
              onClick={saveService}
              variant="contained"
              disableElevation
              disabled={!draftServiceCategory || !draftServiceId}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              Save
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
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
          <MollureFormField
            select
            value={businessOfferingSelect}
            onChange={(e) => {
              const v = String(e.target.value) as OfferingSelectOption;
              setBusinessOfferingSelect(v);
              if (v !== "Both") onSwitchActiveBusinessTemplate(v);
              else onSwitchActiveBusinessTemplate("Fixed Location");
              setIsBusinessPublishEnabled(true);
            }}
            disabled={isBusinessLocked || !businessEditing.offering}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
              },
            }}
            SelectProps={{
              renderValue: (selected) => {
                return String(selected);
              },
            }}
          >
            {offeringSelectOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </MollureFormField>
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

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Box
          sx={{
            display: "inline-flex",
            p: 0.4,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            bgcolor: "#fff",
            gap: 0.4,
          }}
        >
          {templateOptions.map((opt) => {
            const selected = businessOffering.includes(opt);
            const active = activeBusinessTemplate === opt;
            return (
              <Button
                key={opt}
                onClick={() => onSwitchActiveBusinessTemplate(opt)}
                disableElevation
                disabled={isBusinessLocked || (!useSameBusinessInfo && !selected)}
                sx={{
                  minHeight: 30,
                  px: 2,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: active ? 700 : 600,
                  fontSize: 12,
                  bgcolor: active ? alpha(m.navy, 0.06) : "transparent",
                  color: alpha(m.navy, selected ? 0.7 : 0.35),
                  "&:hover": {
                    bgcolor: active ? alpha(m.navy, 0.08) : alpha(m.navy, 0.04),
                  },
                }}
              >
                {opt}
              </Button>
            );
          })}
        </Box>
      </Stack>

      <SectionShell
        title={data.profile.title}
        action={<PrimaryMiniButton onClick={onSaveBusinessProfile}>{data.profile.saveLabel}</PrimaryMiniButton>}
      >
        <Box sx={businessEditing.profile ? undefined : { pointerEvents: "none" }}>
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
                      unoptimized={mediaSlides[mediaIdx]?.startsWith("blob:")}
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
                  accept="image/*"
                  multiple
                  onChange={onFilesSelected}
                  style={{ display: "none" }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<IosShareRoundedIcon />}
                  onClick={onUploadMedia}
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
                disabled={!businessEditing.profile}
              />
              <MollureFormField
                label={data.profile.aboutLabel}
                value={biz.about}
                onChange={(e) => setBizField("about", e.target.value)}
                multiline
                minRows={4}
                disabled={!businessEditing.profile}
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
                disabled={!businessEditing.profile}
              />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {biz.keywords.map((k) => (
                  <Chip
                    key={k}
                    label={k}
                    onDelete={businessEditing.profile ? () => removeBizKeyword(k) : undefined}
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
        </Box>
      </SectionShell>

      {(() => {
        if (businessOfferingSelect === "Both") {
          return (
            <Stack spacing={2}>
              <SectionShell title="Fixed Location">
                <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>{fixedLocationForm}</Box>
              </SectionShell>
              <SectionShell title="Desired Location">
                <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>{desiredLocationForm}</Box>
              </SectionShell>
            </Stack>
          );
        }

        return (
          <SectionShell title={locationSectionTitle}>
            <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>
              {showFixedLocationSection ? fixedLocationForm : null}
              {showDesiredLocationSection ? desiredLocationForm : null}
            </Box>
          </SectionShell>
        );
      })()}

      <SectionShell title="Service For">
        <Box sx={businessEditing.serviceFor ? undefined : { pointerEvents: "none" }}>
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
        </Box>
      </SectionShell>

      <SectionShell title={data.servicesDetails.title}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ pointerEvents: "auto", width: "100%", minWidth: 0 }}
          >
            <IconButton
              type="button"
              size="small"
              aria-label="Scroll categories left"
              disabled={!tabScrollState.canLeft}
              onClick={() => scrollServiceCategoryTabs(-SERVICE_CATEGORY_SLIDER_CARD_WIDTH * 2)}
              sx={{
                flex: "0 0 auto",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
              }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Stack
              ref={serviceCategoryTabsScrollRef}
              direction="row"
              spacing={1.25}
              role="tablist"
              aria-label="Service categories"
              sx={{
                flex: 1,
                minWidth: 0,
                overflowX: "auto",
                pb: 0.25,
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {serviceCategoryTabs.map((c) => (
                <ServiceCategorySliderCard
                  key={c.id}
                  ref={c.id === activeServiceCategory ? activeServiceCategoryTabRef : undefined}
                  label={c.label}
                  iconId={c.iconId}
                  active={c.id === activeServiceCategory}
                  onSelect={() => setActiveServiceCategory(c.id)}
                />
              ))}
            </Stack>
            <IconButton
              type="button"
              size="small"
              aria-label="Scroll categories right"
              disabled={!tabScrollState.canRight}
              onClick={() => scrollServiceCategoryTabs(SERVICE_CATEGORY_SLIDER_CARD_WIDTH * 2)}
              sx={{
                flex: "0 0 auto",
                border: `1px solid ${alpha(m.navy, 0.12)}`,
                bgcolor: "#fff",
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>

          <Box sx={businessEditing.servicesDetails ? undefined : { pointerEvents: "none" }}>
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
                        onClick={openAddServiceDrawer}
                        disabled={isBusinessLocked || !businessEditing.servicesDetails}
                        aria-label="Add service"
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "999px",
                          bgcolor: "primary.main",
                          color: "#fff",
                          "&:hover": { bgcolor: "primary.dark" },
                          "&.Mui-disabled": { bgcolor: alpha(m.navy, 0.12), color: alpha(m.navy, 0.35) },
                        }}
                      >
                        <AddRoundedIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Paper>
                  ) : null}

                  {activeServiceCategory === "all" ? (
                    <Stack spacing={2}>
                      {groupedAllServiceSections.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}>No services yet.</Typography>
                      ) : (
                        groupedAllServiceSections.map((group) => (
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
                                onClick={() => openAddServiceDrawerForCategory(group.categoryId)}
                                disabled={isBusinessLocked || !businessEditing.servicesDetails}
                                aria-label={`Add service to ${group.title}`}
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "999px",
                                  bgcolor: "primary.main",
                                  color: "#fff",
                                  "&:hover": { bgcolor: "primary.dark" },
                                  "&.Mui-disabled": { bgcolor: alpha(m.navy, 0.12), color: alpha(m.navy, 0.35) },
                                }}
                              >
                                <AddRoundedIcon sx={{ fontSize: 22 }} />
                              </IconButton>
                            </Paper>
                            <Stack spacing={1}>{group.items.map((it) => renderServiceDetailRow(it))}</Stack>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      {activeCategoryServices.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.55) }}>
                          No services in this category.
                        </Typography>
                      ) : (
                        activeCategoryServices.map((it) => renderServiceDetailRow(it))
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </Box>

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
                disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                }}
              />
            </Stack>
          </Paper>

          <Box sx={{ mt: 0.75 }}>
            <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.84), fontSize: 13 }}>
              Book Services
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
                    value={biz.bookCategory}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      setBizField("bookCategory", categoryId);
                      const nextServices = getBookingServiceOptions(categoryId);
                      setBizField(
                        "bookService",
                        nextServices.some((option) => option.value === biz.bookService)
                          ? biz.bookService
                          : nextServices[0]?.value || "",
                      );
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
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
                    value={biz.bookService}
                    onChange={(e) => setBizField("bookService", e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
                  >
                    <MenuItem value="">Select service</MenuItem>
                    {bookingServiceOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
                <Grid item xs={12} md={2} sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
                  <IconButton
                    onClick={addBookingCombo}
                    disabled={!businessEditing.servicesDetails || !biz.projectEnabled || !biz.bookCategory || !biz.bookService}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "999px",
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                      color: theme.palette.primary.main,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) },
                    }}
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
                  <Stack direction="row" spacing={1.25} sx={{ overflowX: "auto", pb: 0.25 }}>
                    {biz.bookCombos.map((c) => {
                      const comboServiceOptions = getBookingServiceOptions(c.categoryId);
                      const comboFieldsLocked = bookingComboEditId !== c.id;
                      const comboFieldsDisabled =
                        !businessEditing.servicesDetails || !biz.projectEnabled || comboFieldsLocked;

                      return (
                      <Stack
                        key={c.id}
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        sx={{
                          flex: "0 0 auto",
                          borderRadius: "10px",
                          border: `1px solid ${alpha(m.navy, 0.10)}`,
                          px: 1,
                          py: 0.65,
                          bgcolor: alpha(m.navy, 0.01),
                        }}
                      >
                        <MollureFormField
                          select
                          value={c.categoryId}
                          onChange={(e) => updateBookingCombo(c.id, { categoryId: e.target.value })}
                          disabled={comboFieldsDisabled}
                          sx={{
                            width: 170,
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                          }}
                        >
                          {bookingCategoryOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                        <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.45) }}>+</Typography>
                        <MollureFormField
                          select
                          value={c.serviceId}
                          onChange={(e) => updateBookingCombo(c.id, { serviceId: e.target.value })}
                          disabled={comboFieldsDisabled}
                          sx={{
                            width: 170,
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                          }}
                        >
                          {comboServiceOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                        <IconButton
                          size="small"
                          disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
                          onClick={() => deleteBookingCombo(c.id)}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
                          onClick={() => setBookingComboEditId((prev) => (prev === c.id ? null : c.id))}
                          aria-label={bookingComboEditId === c.id ? "Done editing combination" : "Edit combination"}
                          sx={
                            bookingComboEditId === c.id
                              ? { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                              : undefined
                          }
                        >
                          <EditRoundedIcon
                            sx={{
                              fontSize: 18,
                              color: bookingComboEditId === c.id ? "primary.main" : alpha(m.navy, 0.55),
                            }}
                          />
                        </IconButton>
                      </Stack>
                    );
                    })}
                  </Stack>
                </Stack>
              </Paper>

              <MollureFormField
                placeholder="Custom instructions for combo Service"
                value={biz.bookComboInstructions}
                onChange={(e) => setBizField("bookComboInstructions", e.target.value)}
                multiline
                minRows={4}
                disabled={!businessEditing.servicesDetails || !biz.projectEnabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              />
            </Stack>
          </Paper>
        </Stack>
      </SectionShell>

      <SectionShell
        title={data.manageTeam.title}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Checkbox
                  checked={featureTeamPublic}
                  onChange={(e) => setFeatureTeamPublic(e.target.checked)}
                  disabled={!businessEditing.manageTeam}
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
              onClick={openAddDrawer}
              size="small"
              disabled={!businessEditing.manageTeam}
              sx={{
                width: 32, height: 32, borderRadius: "999px",
                bgcolor: theme.palette.primary.main,
                color: "#fff",
                "&:hover": { bgcolor: "mollure.tealDark" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        }
      >
        <Box sx={businessEditing.manageTeam ? undefined : { pointerEvents: "none" }}>
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

                {/* Middle – assigned services as compact selects */}
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
                  {TEAM_SERVICE_SLOT_KEYS.some((key) => String(mem.services[key] ?? "").trim()) ? (
                    <Grid container spacing={1}>
                      {TEAM_SERVICE_SLOT_KEYS.filter((key) => String(mem.services[key] ?? "").trim()).map((key) => (
                        <Grid key={key} item xs={12} sm={6} md={4}>
                          <Typography
                            sx={{ fontSize: 10.5, fontWeight: 600, color: alpha(m.navy, 0.52), mb: 0.35, lineHeight: 1.2 }}
                          >
                            {getTeamServiceSelectLabel(mem.services[key])}
                          </Typography>
                          <MollureFormField
                            select
                            value={mem.services[key]}
                            onChange={(e) => updateMemberService(mem.id, key, e.target.value)}
                            disabled={isBusinessLocked || !businessEditing.manageTeam}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: 36,
                                borderRadius: "8px",
                                bgcolor: "#fff",
                                "& fieldset": { borderColor: alpha(m.navy, 0.12) },
                              },
                              "& .MuiSelect-select": {
                                fontSize: 12,
                                fontWeight: 500,
                                py: "7px",
                                color: alpha(m.navy, 0.72),
                              },
                              "& .MuiSvgIcon-root": { fontSize: 18, color: alpha(m.navy, 0.40) },
                            }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {allSubcategoryOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </MollureFormField>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: alpha(m.navy, 0.42) }}>
                      No services assigned
                    </Typography>
                  )}
                </Box>

                {/* Right – actions */}
                <Stack spacing={1} alignItems="center" justifyContent="flex-start" sx={{ flex: "0 0 auto", pl: 1.5, pr: 0.5, pt: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => openEditDrawer(mem)}
                    disabled={isBusinessLocked || !businessEditing.manageTeam}
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
                    onClick={() => removeTeamMember(mem.id)}
                    disabled={isBusinessLocked || !businessEditing.manageTeam}
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
        </Box>
      </SectionShell>

      <SectionShell title={data.generalNotes.title}>
        <Box sx={businessEditing.generalNotes ? undefined : { pointerEvents: "none" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
          {data.generalNotes.notesLabel}
        </Typography>
        <MollureFormField
          placeholder={data.generalNotes.placeholder}
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
          multiline
          minRows={4}
          disabled={!businessEditing.generalNotes}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: alpha(m.navy, 0.01),
            },
          }}
        />
        </Box>
      </SectionShell>

      <SectionShell title="Price">
        <Box sx={businessEditing.price ? undefined : { pointerEvents: "none" }}>
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
              disabled={!businessEditing.price}
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
                disabled={!businessEditing.price}
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
                disabled={!businessEditing.price}
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
                  disabled={!businessEditing.price}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                />
              </Box>
            </Box>
          ) : null}
        </Stack>
        </Box>
      </SectionShell>

      <SectionShell title="Policy Section">
        <Box sx={businessEditing.price ? undefined : { pointerEvents: "none" }}>
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
                    disabled={!businessEditing.price}
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
                    disabled={!businessEditing.price}
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
              disabled={!businessEditing.price}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
        </Box>
      </SectionShell>

      <SectionShell title="Rescheduling Policy">
        <Box sx={businessEditing.price ? undefined : { pointerEvents: "none" }}>
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
                    disabled={!businessEditing.price}
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
                    disabled={!businessEditing.price}
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
                disabled={!businessEditing.price}
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
              disabled={!businessEditing.price}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
        </Box>
      </SectionShell>

      <SectionShell title="Cancellation Policy">
        <Box sx={businessEditing.price ? undefined : { pointerEvents: "none" }}>
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
                    disabled={!businessEditing.price}
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
                    disabled={!businessEditing.price}
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
                disabled={!businessEditing.price}
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
              disabled={!businessEditing.price}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
        </Box>
      </SectionShell>

      <SectionShell title="No Show Policy">
        <Box sx={businessEditing.price ? undefined : { pointerEvents: "none" }}>
          <Stack spacing={1.6}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(m.navy, 0.62), mb: 0.75 }}>
                No Show Fee
              </Typography>
              <MollureFormField
                placeholder="0"
                value={values.noShowFeePercent}
                onChange={(e) => setField("noShowFeePercent", e.target.value)}
                disabled={!businessEditing.price}
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
              disabled={!businessEditing.price}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
            />
          </Stack>
        </Box>
      </SectionShell>

      <SectionShell
        title="Portfolio"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              onClick={deleteSelectedPortfolio}
              disabled={
                !businessEditing.portfolio ||
                !Object.values(selectedPortfolioIds).some(Boolean)
              }
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
              disabled={!businessEditing.portfolio}
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
              accept="image/*"
              multiple
              hidden
              onChange={onPortfolioFilesSelected}
            />
          </Stack>
        }
      >
        <Box
          sx={{
            ...(businessEditing.portfolio ? null : { pointerEvents: "none" }),
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
                onClick={() => togglePortfolio(it.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePortfolio(it.id);
                  }
                }}
                sx={{
                  position: "relative",
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
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

          <IconButton
            size="small"
            onClick={() => {
              if (activeSubTab === "Business Setup") {
                enableAllBusinessEditing();
              } else {
                setIsProfessionalEditing(true);
              }
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.06),
              "&:hover": { bgcolor: alpha(m.navy, 0.09) },
            }}
            aria-label={activeSubTab === "Business Setup" ? "Edit business setup" : "Edit professional profile"}
          >
            <EditRoundedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.55) }} />
          </IconButton>
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
      {teamDrawer}
      {serviceDrawer}
    </>
  );

  if (!chrome) return innerWithDrawer;

  return (
    <Box sx={{ bgcolor: alpha(m.teal, 0.08), minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack spacing={2}>{innerWithDrawer}</Stack>
      </Container>
    </Box>
  );
}
