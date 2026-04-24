"use client";

import * as React from "react";
import Image from "next/image";
import {
  Avatar,
  Box,
  Button,
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
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { FixedLocationPageData } from "../../app/professionals/fixed-location/fixedLocation.data";
import { useFixedLocationForm } from "../../app/professionals/fixed-location/fixedLocation.use";
import MollureFormField from "./MollureFormField";
import { Typography } from "../ui/typography";

type ServiceDetailUiItem = {
  id: string;
  categoryId: "hair" | "makeup" | "wimpers" | "wenbrauwen";
  name: string;
  durationLabel: string;
  priceLabel: string;
};

export type ProfessionalFixedLocationSetupProps = {
  data: FixedLocationPageData;
  chrome?: boolean;
};

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
}: ProfessionalFixedLocationSetupProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const {
    values,
    setField,
    setAmenity,
    setServiceFor,
    addKeyword,
    removeKeyword,
  } = useFixedLocationForm();
  const [activeSubTab, setActiveSubTab] = React.useState<string>(
    data.subTabsActive,
  );
  const [activeServiceCategory, setActiveServiceCategory] = React.useState<
    "all" | "hair" | "makeup" | "wimpers" | "wenbrauwen"
  >("all");
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
  const [selectedPortfolioIds, setSelectedPortfolioIds] = React.useState<Record<string, boolean>>({
    "pf-2": true,
  });
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
    hair: string;
    makeup: string;
    wimpers: string;
    wenbrauwen: string;
    lich1: string;
    lich2: string;
    lich3: string;
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

  const teamOpts = React.useMemo(() => ({
    hair:    ["Haar(5)",   "Haar(0)",   "Haar(2)"],
    makeup:  ["Make-up(2)","Make-up(0)","Make-up(4)"],
    wimpers: ["Wimpers(8)","Wimpers(0)","Wimpers(3)"],
    wenbrauwen: ["Wenkbrauwen(4)","Wenkbrauwen(0)","Wenkbrauwen(1)"],
    lich: ["Lichaamsbehandeling(1)","Lichaamsbehandeling(5)","Lichaamsbehandeling"],
  }), []);

  const defaultServices = React.useCallback(
    (offset = 0): TeamService => ({
      hair:    teamOpts.hair[0]!,
      makeup:  teamOpts.makeup[0]!,
      wimpers: teamOpts.wimpers[0]!,
      wenbrauwen: teamOpts.wenbrauwen[0]!,
      lich1: teamOpts.lich[offset % 3]!,
      lich2: teamOpts.lich[(offset + 1) % 3]!,
      lich3: teamOpts.lich[(offset + 2) % 3]!,
    }),
    [teamOpts],
  );

  const [teamMembers, setTeamMembers] = React.useState<TeamMemberUi[]>(() =>
    data.manageTeam.members.map((m, i) => ({
      id: m.id, name: m.name, role: m.role,
      photoSrc: "/professionals/hero.png",
      rating: 4.5, reviewsLabel: "(134 Reviews)",
      services: {
        hair:      teamOpts.hair[0]!,
        makeup:    teamOpts.makeup[0]!,
        wimpers:   teamOpts.wimpers[0]!,
        wenbrauwen:teamOpts.wenbrauwen[0]!,
        lich1: teamOpts.lich[i % 3]!,
        lich2: teamOpts.lich[(i + 1) % 3]!,
        lich3: teamOpts.lich[(i + 2) % 3]!,
      },
    })),
  );

  const [featureTeamPublic, setFeatureTeamPublic] = React.useState(true);
  const [teamDrawerOpen, setTeamDrawerOpen] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [draftTeamName, setDraftTeamName] = React.useState("");
  const [draftTeamRole, setDraftTeamRole] = React.useState("");
  const [draftPhotoSrc, setDraftPhotoSrc] = React.useState<string>("/professionals/hero.png");
  const teamPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [draftServices, setDraftServices] = React.useState<TeamService>(() => ({
    hair: teamOpts.hair[0]!,
    makeup: teamOpts.makeup[0]!,
    wimpers: teamOpts.wimpers[0]!,
    wenbrauwen: teamOpts.wenbrauwen[0]!,
    lich1: teamOpts.lich[0]!,
    lich2: teamOpts.lich[1]!,
    lich3: teamOpts.lich[2]!,
  }));

  const openAddDrawer = React.useCallback(() => {
    setEditingMemberId(null);
    setDraftTeamName("");
    setDraftTeamRole("");
    setDraftPhotoSrc("/professionals/hero.png");
    setDraftServices(defaultServices(0));
    setTeamDrawerOpen(true);
  }, [defaultServices]);

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

  const updateMemberService = React.useCallback(
    (id: string, key: keyof TeamService, value: string) => {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, services: { ...m.services, [key]: value } } : m)),
      );
    },
    [],
  );

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

  type DesiredAreaRow = { id: string; province: string; municipality: string };
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
  const desiredMunicipalityByProvince = React.useMemo(() => {
    const base = ["Municipality Name", "Amsterdam", "Rotterdam", "Utrecht", "Haarlem", "Groningen", "Eindhoven"];
    return desiredProvinceOptions.reduce((acc, p) => {
      acc[p] = base;
      return acc;
    }, {} as Record<(typeof desiredProvinceOptions)[number], string[]>);
  }, [desiredProvinceOptions]);

  const [desiredAreaMode, setDesiredAreaMode] = React.useState<"Specific areas only" | "All Netherlands">(
    "Specific areas only",
  );
  const [desiredProvinceDraft, setDesiredProvinceDraft] = React.useState<(typeof desiredProvinceOptions)[number]>(
    "Noord-Holland",
  );
  const [desiredMunicipalityDraft, setDesiredMunicipalityDraft] = React.useState<string>("Municipality Name");
  const [desiredAreas, setDesiredAreas] = React.useState<DesiredAreaRow[]>([
    { id: "dl-1", province: "Drenthe", municipality: "Drenthe(5)" },
    { id: "dl-2", province: "Zuid-Holland", municipality: "Zuid-Holland(2)" },
    { id: "dl-3", province: "Groningen", municipality: "Groningen(8)" },
    { id: "dl-4", province: "Noord-Holland", municipality: "Noord-Holland" },
  ]);

  const addDesiredArea = React.useCallback(() => {
    if (!desiredProvinceDraft || !desiredMunicipalityDraft || desiredMunicipalityDraft === "Municipality Name") return;
    const exists = desiredAreas.some(
      (r) => r.province === desiredProvinceDraft && r.municipality === desiredMunicipalityDraft,
    );
    if (exists) return;
    setIsBusinessPublishEnabled(true);
    setDesiredAreas((prev) => [
      ...prev,
      { id: `dl-${Date.now()}-${Math.random().toString(16).slice(2)}`, province: desiredProvinceDraft, municipality: desiredMunicipalityDraft },
    ]);
  }, [desiredAreas, desiredMunicipalityDraft, desiredProvinceDraft]);

  const updateDesiredArea = React.useCallback(
    (id: string, patch: Partial<Omit<DesiredAreaRow, "id">>) => {
      setIsBusinessPublishEnabled(true);
      setDesiredAreas((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    [],
  );

  const removeDesiredArea = React.useCallback((id: string) => {
    setIsBusinessPublishEnabled(true);
    setDesiredAreas((prev) => prev.filter((r) => r.id !== id));
  }, []);

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
          {(desiredMunicipalityByProvince[(fixedBiz.province as any) || "Noord-Holland"] ?? []).map((o) => (
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
            setDesiredMunicipalityDraft("Municipality Name");
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
              {(desiredMunicipalityByProvince[desiredProvinceDraft] ?? []).map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </MollureFormField>
          </Box>
          <IconButton
            onClick={addDesiredArea}
            disabled={!businessEditing.location || desiredAreaMode !== "Specific areas only"}
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
            {desiredAreas.map((r) => {
              const options = desiredMunicipalityByProvince[(r.province as any) || "Noord-Holland"] ?? [];
              const safeOptions = options.includes(r.municipality) ? options : [r.municipality, ...options];
              return (
                <Box
                  key={r.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <MollureFormField
                    select
                    value={r.municipality}
                    onChange={(e) => updateDesiredArea(r.id, { municipality: e.target.value })}
                    disabled={!businessEditing.location}
                    sx={{
                      flex: "1 1 auto",
                      minWidth: 0,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: "10px",
                        minHeight: 36,
                      },
                      "& .MuiSvgIcon-root": {
                        fontSize: 18,
                        color: alpha(m.navy, 0.40),
                      },
                    }}
                  >
                    {safeOptions.map((o) => (
                      <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>
                        {o}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                  <IconButton
                    onClick={() => removeDesiredArea(r.id)}
                    disabled={!businessEditing.location}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.04),
                      "&:hover": { bgcolor: alpha(m.navy, 0.08) },
                    }}
                    aria-label="Remove desired area"
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
                  </IconButton>
                </Box>
              );
            })}
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

  const onPublishBusinessSetup = React.useCallback(() => {
    // This is where you'd call the real publish API.
    // For now: treat "Publish" as the required save/apply action,
    // then lock everything again.
    setIsBusinessPublishEnabled(false);
    setIsBusinessLocked(true);
    closeAllBusinessEditing();
  }, [closeAllBusinessEditing]);

  const onSwitchActiveBusinessTemplate = React.useCallback(
    (opt: OfferingOption) => {
      if (isBusinessLocked) return;
      setActiveBusinessTemplate(opt);
    },
    [isBusinessLocked],
  );

  // ── Services (template-aware) + drawer ────────────────────────────────────
  const initialServiceItems = React.useMemo(
    () => (data.servicesDetails.items as unknown as ServiceDetailUiItem[]),
    [data.servicesDetails.items],
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
  const [draftServiceCategory, setDraftServiceCategory] =
    React.useState<ServiceDetailUiItem["categoryId"]>("hair");
  const [draftServiceName, setDraftServiceName] = React.useState("");
  const [draftServiceDuration, setDraftServiceDuration] = React.useState("");
  const [draftServicePrice, setDraftServicePrice] = React.useState("");

  const openAddServiceDrawer = React.useCallback(() => {
    setEditingServiceId(null);
    setDraftServiceCategory("hair");
    setDraftServiceName("");
    setDraftServiceDuration("");
    setDraftServicePrice("");
    setServiceDrawerOpen(true);
  }, []);

  const openEditServiceDrawer = React.useCallback((it: ServiceDetailUiItem) => {
    setEditingServiceId(it.id);
    setDraftServiceCategory(it.categoryId);
    setDraftServiceName(it.name);
    setDraftServiceDuration(it.durationLabel);
    setDraftServicePrice(it.priceLabel);
    setServiceDrawerOpen(true);
  }, []);

  const closeServiceDrawer = React.useCallback(() => setServiceDrawerOpen(false), []);

  const saveService = React.useCallback(() => {
    const name = draftServiceName.trim();
    if (!name) return;

    const durationLabel = draftServiceDuration.trim() || "45 Min";
    const priceLabel = draftServicePrice.trim() || "25 €";
    const categoryId = draftServiceCategory;

    if (editingServiceId) {
      setActiveServices((prev) =>
        prev.map((s) =>
          s.id === editingServiceId ? { ...s, name, durationLabel, priceLabel, categoryId } : s,
        ),
      );
    } else {
      const id = `svc-${Date.now()}`;
      setActiveServices((prev) => [{ id, categoryId, name, durationLabel, priceLabel }, ...prev]);
    }
    setServiceDrawerOpen(false);
  }, [
    draftServiceCategory,
    draftServiceDuration,
    draftServiceName,
    draftServicePrice,
    editingServiceId,
    setActiveServices,
  ]);

  const deleteService = React.useCallback(
    (id: string) => {
      setActiveServices((prev) => prev.filter((s) => s.id !== id));
    },
    [setActiveServices],
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
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82), mb: 1 }}>
          Company Information
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.10) }} />
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <MollureFormField
              label="Legal Name*"
              placeholder="e.g Jane"
              value={values.companyLegalName}
              onChange={(e) => setField("companyLegalName", e.target.value)}
              disabled={professionalFieldsDisabled}
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
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82), mb: 1 }}>
          Contact Person
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: alpha(m.navy, 0.10) }} />
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="First Name*"
              placeholder="e.g Jane"
              value={values.contactFirstName}
              onChange={(e) => setField("contactFirstName", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Last Name*"
              placeholder="e.g Doe"
              value={values.contactLastName}
              onChange={(e) => setField("contactLastName", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Email*"
              placeholder="Your@gmail.com"
              value={values.contactEmail}
              onChange={(e) => setField("contactEmail", e.target.value)}
              disabled={professionalFieldsDisabled}
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
              onChange={(e) => setField("contactPassword", e.target.value)}
              disabled={professionalFieldsDisabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MollureFormField
              label="Repeat password*"
              type="password"
              placeholder="Confirm Password"
              value={values.contactRepeatPassword}
              onChange={(e) => setField("contactRepeatPassword", e.target.value)}
              disabled={professionalFieldsDisabled}
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

  const bookingCategoryOptions = React.useMemo(
    () => ["Lichaamsbehandeling", "Hair", "Make-Up", "Wimpers", "Wenkbrauwen"] as const,
    [],
  );
  const bookingServiceOptions = React.useMemo(
    () => ["Neck massage", "Buzz Cut", "Make-up Basic", "Lash Lift", "Brow Shape"] as const,
    [],
  );

  const addBookingCombo = React.useCallback(() => {
    const id = `combo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const a = values.bookCategory || bookingCategoryOptions[0] || "";
    const b = values.bookCategory || bookingCategoryOptions[0] || "";
    setField("bookCombos", [...values.bookCombos, { id, a, b }]);
  }, [bookingCategoryOptions, setField, values.bookCategory, values.bookCombos]);

  const updateBookingCombo = React.useCallback(
    (id: string, patch: Partial<{ a: string; b: string }>) => {
      setField(
        "bookCombos",
        values.bookCombos.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [setField, values.bookCombos],
  );

  const deleteBookingCombo = React.useCallback(
    (id: string) => {
      setField(
        "bookCombos",
        values.bookCombos.filter((c) => c.id !== id),
      );
    },
    [setField, values.bookCombos],
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

        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={() => setIsProfessionalEditing(false)}
          disabled={!isProfessionalEditing}
          sx={{
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 900,
            bgcolor: m.teal,
            color: "#fff",
            "&:hover": { bgcolor: m.tealDark },
            minHeight: 44,
            mt: 0.5,
          }}
        >
          Update
        </Button>
      </Stack>
    </Box>
  );

  const teamDrawer = (
    <Drawer
      anchor="right"
      open={teamDrawerOpen}
      onClose={closeTeamDrawer}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 2.5 } }}
    >
      <Stack spacing={2} sx={{ height: "100%", overflowY: "auto" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.88) }}>
          {editingMemberId ? "Edit team member" : "Add team member"}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: alpha(m.navy, 0.55) }}>
          {editingMemberId
            ? "Update the details and services for this member."
            : "Fill in the details — they will appear in your team list."}
        </Typography>

        <MollureFormField label="Full name" placeholder="e.g. Craig Martha"
          value={draftTeamName} onChange={(e) => setDraftTeamName(e.target.value)} />
        <MollureFormField label="Role" placeholder="e.g. Stylist"
          value={draftTeamRole} onChange={(e) => setDraftTeamRole(e.target.value)} />

        <Divider />
        <Typography sx={{ fontWeight: 800, fontSize: 12.5, color: alpha(m.navy, 0.72) }}>
          Profile photo
        </Typography>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "999px",
              overflow: "hidden",
              bgcolor: alpha(m.navy, 0.06),
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              flex: "0 0 auto",
            }}
          >
            <Image
              src={draftPhotoSrc}
              alt="Team member photo"
              width={56}
              height={56}
              unoptimized
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
          <Button
            onClick={onChooseTeamPhoto}
            variant="outlined"
            sx={{
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
          <input
            ref={teamPhotoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onTeamPhotoSelected}
          />
        </Stack>

        <Divider />
        <Typography sx={{ fontWeight: 800, fontSize: 12.5, color: alpha(m.navy, 0.72) }}>
          Assigned services
        </Typography>

        <Grid container spacing={1.5}>
          {([
            ["hair",       "Hair",         teamOpts.hair],
            ["makeup",     "Make-up",       teamOpts.makeup],
            ["wimpers",    "Wimpers",       teamOpts.wimpers],
            ["wenbrauwen", "Wenkbrauwen",   teamOpts.wenbrauwen],
            ["lich1",      "Lichaamsbehandeling 1", teamOpts.lich],
            ["lich2",      "Lichaamsbehandeling 2", teamOpts.lich],
            ["lich3",      "Lichaamsbehandeling 3", teamOpts.lich],
          ] as const).map(([key, label, opts]) => (
            <Grid key={key} item xs={12} sm={6}>
              <MollureFormField
                select label={label}
                value={draftServices[key as keyof TeamService]}
                onChange={(e) =>
                  setDraftServices((p) => ({ ...p, [key]: e.target.value }))
                }
              >
                {opts.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </MollureFormField>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={closeTeamDrawer} variant="outlined"
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700,
              borderColor: alpha(m.navy, 0.14), color: alpha(m.navy, 0.72) }}>
            Cancel
          </Button>
          <Button onClick={saveTeamMember} variant="contained" disableElevation
            disabled={!draftTeamName.trim()}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800,
              bgcolor: "primary.main", "&:hover": { bgcolor: "mollure.tealDark" } }}>
            {editingMemberId ? "Save changes" : "Add member"}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );

  const serviceDrawer = (
    <Drawer
      anchor="right"
      open={serviceDrawerOpen}
      onClose={closeServiceDrawer}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 2.5 } }}
    >
      <Stack spacing={2} sx={{ height: "100%", overflowY: "auto" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16, color: alpha(m.navy, 0.88) }}>
          {editingServiceId ? "Edit service" : "Add service"}
        </Typography>

        <Stack spacing={1.5}>
          <MollureFormField
            select
            label="Category"
            value={draftServiceCategory}
            onChange={(e) => setDraftServiceCategory(e.target.value as any)}
          >
            {data.servicesDetails.categories
              .filter((c) => c.id !== "all")
              .map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}
                </MenuItem>
              ))}
          </MollureFormField>
          <MollureFormField
            label="Service name"
            placeholder="e.g Buzz Cut"
            value={draftServiceName}
            onChange={(e) => setDraftServiceName(e.target.value)}
          />
          <MollureFormField
            label="Duration"
            placeholder="e.g 45 Min"
            value={draftServiceDuration}
            onChange={(e) => setDraftServiceDuration(e.target.value)}
          />
          <MollureFormField
            label="Price"
            placeholder="e.g 25 €"
            value={draftServicePrice}
            onChange={(e) => setDraftServicePrice(e.target.value)}
          />
        </Stack>

        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
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
          <Button
            onClick={saveService}
            variant="contained"
            disableElevation
            disabled={!draftServiceName.trim()}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "mollure.tealDark" },
            }}
          >
            {editingServiceId ? "Save changes" : "Add service"}
          </Button>
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
          disabled={!isBusinessPublishEnabled}
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
          {data.publishLabel}
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
        <IconButton
          size="small"
          onClick={() => enableBusinessEditing("offering")}
          disabled={isBusinessLocked}
          sx={{
            border: `1px solid ${alpha(m.navy, 0.12)}`,
            borderRadius: "8px",
          }}
          aria-label="Edit offering"
        >
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
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
        const locationEditAction = (
          <IconButton
            size="small"
            onClick={() => enableBusinessEditing("location")}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.06),
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              color: alpha(m.navy, 0.72),
              "&:hover": { bgcolor: alpha(m.navy, 0.08) },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        );

        if (businessOfferingSelect === "Both") {
          return (
            <Stack spacing={2}>
              <SectionShell title="Fixed Location" action={locationEditAction}>
                <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>{fixedLocationForm}</Box>
              </SectionShell>
              <SectionShell title="Desired Location" action={locationEditAction}>
                <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>{desiredLocationForm}</Box>
              </SectionShell>
            </Stack>
          );
        }

        return (
          <SectionShell title={locationSectionTitle} action={locationEditAction}>
            <Box sx={businessEditing.location ? undefined : { pointerEvents: "none" }}>
              {showFixedLocationSection ? fixedLocationForm : null}
              {showDesiredLocationSection ? desiredLocationForm : null}
            </Box>
          </SectionShell>
        );
      })()}

      <SectionShell
        title="Service For"
        action={
          <IconButton
            size="small"
            onClick={() => enableBusinessEditing("serviceFor")}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.06),
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              color: alpha(m.navy, 0.72),
              "&:hover": { bgcolor: alpha(m.navy, 0.08) },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        }
      >
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

      <SectionShell
        title={data.servicesDetails.title}
        action={
          <IconButton
            size="small"
            onClick={() => enableBusinessEditing("servicesDetails")}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.06),
              border: `1px solid ${alpha(m.navy, 0.10)}`,
              color: alpha(m.navy, 0.72),
              "&:hover": { bgcolor: alpha(m.navy, 0.08) },
            }}
            aria-label="Edit services details"
          >
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        }
      >
        <Box sx={businessEditing.servicesDetails ? undefined : { pointerEvents: "none" }}>
          <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} sx={{ overflowX: "auto", pb: 0.25 }}>
            {data.servicesDetails.categories.map((c) => {
              const active = c.id === activeServiceCategory;
              const icon =
                c.iconKey === "hair"
                  ? <ContentCutRoundedIcon sx={{ fontSize: 22 }} />
                  : c.iconKey === "makeup"
                    ? <BrushRoundedIcon sx={{ fontSize: 22 }} />
                    : c.iconKey === "wimpers"
                      ? <VisibilityRoundedIcon sx={{ fontSize: 22 }} />
                      : c.iconKey === "wenbrauwen"
                        ? <GestureRoundedIcon sx={{ fontSize: 22 }} />
                        : null;

              return (
                <Box
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveServiceCategory(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setActiveServiceCategory(c.id);
                  }}
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 78,
                    height: 58,
                    px: 1.25,
                    borderRadius: "8px",
                    border: `1px solid ${active ? theme.palette.primary.main : alpha(m.navy, 0.10)}`,
                    bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : "#fff",
                    display: "grid",
                    placeItems: "center",
                    gap: 0.35,
                    userSelect: "none",
                    cursor: "pointer",
                  }}
                >
                  {icon ? (
                    <Box sx={{ color: active ? theme.palette.primary.main : alpha(m.navy, 0.55) }}>{icon}</Box>
                  ) : (
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: active ? theme.palette.primary.main : alpha(m.navy, 0.55) }}>
                      {c.label}
                    </Typography>
                  )}
                  {icon ? (
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: active ? theme.palette.primary.main : alpha(m.navy, 0.55) }}>
                      {c.label}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.82) }}>
              {activeServiceCategory === "all"
                ? "All"
                : data.servicesDetails.categories.find((x) => x.id === activeServiceCategory)?.label ?? "Services"}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              size="small"
              onClick={openAddServiceDrawer}
              disabled={isBusinessLocked || !businessEditing.servicesDetails}
              sx={{
                width: 26,
                height: 26,
                borderRadius: "999px",
                bgcolor: alpha(theme.palette.primary.main, 0.10),
                color: theme.palette.primary.main,
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.14) },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          <Stack spacing={1}>
            {(activeServiceCategory === "all"
              ? activeServices
              : activeServices.filter((it) => it.categoryId === activeServiceCategory)
            ).map((it) => (
              <Paper
                key={it.id}
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.10)}`,
                  px: 1.5,
                  py: 1.15,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: alpha(m.navy, 0.86) }}>
                      {it.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: theme.palette.primary.main, fontWeight: 600 }}>
                      {it.durationLabel} View
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: alpha(m.navy, 0.72) }}>
                    {it.priceLabel}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton size="small" sx={{ width: 28, height: 28 }}>
                      <AddRoundedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => openEditServiceDrawer(it as any)}
                      disabled={isBusinessLocked || !businessEditing.servicesDetails}
                      sx={{ width: 28, height: 28 }}
                    >
                      <EditRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.62) }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteService(it.id)}
                      disabled={isBusinessLocked || !businessEditing.servicesDetails}
                      sx={{ width: 28, height: 28 }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.50) }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>

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
                    checked={values.projectEnabled}
                    onChange={(e) => setField("projectEnabled", e.target.checked)}
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
                value={values.projectInstructions}
                onChange={(e) => setField("projectInstructions", e.target.value)}
                multiline
                minRows={3}
                disabled={!businessEditing.servicesDetails || !values.projectEnabled}
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
                    value={values.bookCategory}
                    onChange={(e) => setField("bookCategory", e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={!businessEditing.servicesDetails || !values.projectEnabled}
                  >
                    {bookingCategoryOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
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
                    value={values.bookService}
                    onChange={(e) => setField("bookService", e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    disabled={!businessEditing.servicesDetails || !values.projectEnabled}
                  >
                    {bookingServiceOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </MollureFormField>
                </Grid>
                <Grid item xs={12} md={2} sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
                  <IconButton
                    onClick={addBookingCombo}
                    disabled={!businessEditing.servicesDetails || !values.projectEnabled}
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
                    {values.bookCombos.map((c) => (
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
                          value={c.a}
                          onChange={(e) => updateBookingCombo(c.id, { a: e.target.value })}
                          disabled={!values.projectEnabled}
                          sx={{
                            width: 170,
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                          }}
                        >
                          {bookingCategoryOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                        <Typography sx={{ fontWeight: 800, color: alpha(m.navy, 0.45) }}>+</Typography>
                        <MollureFormField
                          select
                          value={c.b}
                          onChange={(e) => updateBookingCombo(c.id, { b: e.target.value })}
                          disabled={!values.projectEnabled}
                          sx={{
                            width: 170,
                            "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
                          }}
                        >
                          {bookingCategoryOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </MollureFormField>
                        <IconButton
                          size="small"
                          disabled={!values.projectEnabled}
                          onClick={() => deleteBookingCombo(c.id)}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
                        </IconButton>
                        <IconButton size="small" disabled={!values.projectEnabled}>
                          <EditRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }} />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <MollureFormField
                placeholder="Custom instructions for combo Service"
                value={values.bookComboInstructions}
                onChange={(e) => setField("bookComboInstructions", e.target.value)}
                multiline
                minRows={4}
                disabled={!values.projectEnabled}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
              />
            </Stack>
          </Paper>
        </Stack>
        </Box>
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
            <IconButton
              size="small"
              onClick={() => enableBusinessEditing("manageTeam")}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                bgcolor: alpha(m.navy, 0.05),
                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
              }}
              aria-label="Edit manage team"
            >
              <EditRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
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
              {/* ── Single row: avatar block | dropdowns grid | action buttons ── */}
              <Stack direction="row" spacing={0} alignItems="flex-start">

                {/* Left – profile photo + name + stars */}
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ minWidth: 175, pr: 2 }}
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
                    <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: alpha(m.navy, 0.88), lineHeight: 1.3 }}>
                      {mem.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                      <Rating value={mem.rating} precision={0.5} readOnly size="small"
                        sx={{ fontSize: 14, "& .MuiRating-iconFilled": { color: "#FAAF00" } }} />
                      <Typography sx={{ fontSize: 10.5, color: alpha(m.navy, 0.50), fontWeight: 600 }}>
                        {mem.reviewsLabel}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                {/* Middle – 4 + 3 dropdown grid */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1 – 4 dropdowns */}
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    {([
                      ["hair",       teamOpts.hair],
                      ["makeup",     teamOpts.makeup],
                      ["wimpers",    teamOpts.wimpers],
                      ["wenbrauwen", teamOpts.wenbrauwen],
                    ] as const).map(([key, opts]) => (
                      <Grid key={key} item xs={3}>
                        <MollureFormField
                          select
                          value={mem.services[key as keyof typeof mem.services]}
                          onChange={(e) => updateMemberService(mem.id, key as keyof TeamService, e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              minHeight: 36, borderRadius: "8px",
                              "& fieldset": { borderColor: alpha(m.navy, 0.12) },
                            },
                            "& .MuiSelect-select": { fontSize: 12, fontWeight: 600, py: "7px", color: alpha(m.navy, 0.72) },
                            "& .MuiSvgIcon-root": { fontSize: 18, color: alpha(m.navy, 0.40) },
                          }}
                        >
                          {opts.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
                        </MollureFormField>
                      </Grid>
                    ))}
                  </Grid>
                  {/* Row 2 – 3 dropdowns */}
                  <Grid container spacing={1}>
                    {(["lich1", "lich2", "lich3"] as const).map((key) => (
                      <Grid key={key} item xs={4}>
                        <MollureFormField
                          select
                          value={mem.services[key]}
                          onChange={(e) => updateMemberService(mem.id, key, e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              minHeight: 36, borderRadius: "8px",
                              "& fieldset": { borderColor: alpha(m.navy, 0.12) },
                            },
                            "& .MuiSelect-select": { fontSize: 12, fontWeight: 600, py: "7px", color: alpha(m.navy, 0.72) },
                            "& .MuiSvgIcon-root": { fontSize: 18, color: alpha(m.navy, 0.40) },
                          }}
                        >
                          {teamOpts.lich.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
                        </MollureFormField>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Right – edit / delete stacked */}
                <Stack spacing={0.75} alignItems="center" sx={{ pl: 1.5, pt: 0.25 }}>
                  <IconButton
                    size="small"
                    onClick={() => openEditDrawer(mem)}
                    sx={{
                      width: 30, height: 30, borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.05),
                      "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.50) }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => removeTeamMember(mem.id)}
                    sx={{
                      width: 30, height: 30, borderRadius: "8px",
                      bgcolor: alpha(m.navy, 0.05),
                      "&:hover": { bgcolor: alpha(m.navy, 0.10) },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.50) }} />
                  </IconButton>
                </Stack>

              </Stack>
            </Paper>
          ))}
        </Stack>
        </Box>
      </SectionShell>

      <SectionShell
        title={data.generalNotes.title}
        action={
          <IconButton
            size="small"
            onClick={() => enableBusinessEditing("generalNotes")}
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.05),
              "&:hover": { bgcolor: alpha(m.navy, 0.10) },
            }}
            aria-label="Edit general notes"
          >
            <EditRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
          </IconButton>
        }
      >
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

      <SectionShell
        title="Price"
        action={
          <IconButton
            size="small"
            onClick={() => enableBusinessEditing("price")}
            sx={{
              width: 30,
              height: 30,
              borderRadius: "999px",
              bgcolor: alpha(m.navy, 0.05),
              "&:hover": { bgcolor: alpha(m.navy, 0.10) },
            }}
            aria-label="Edit price"
          >
            <EditRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
          </IconButton>
        }
      >
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

      <SectionShell
        title="Portfolio"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              onClick={() => enableBusinessEditing("portfolio")}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "999px",
                bgcolor: alpha(m.navy, 0.05),
                "&:hover": { bgcolor: alpha(m.navy, 0.10) },
              }}
              aria-label="Edit portfolio"
            >
              <EditRoundedIcon sx={{ fontSize: 16, color: alpha(m.navy, 0.55) }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={deleteSelectedPortfolio}
              disabled={!businessEditing.portfolio}
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
                role="button"
                tabIndex={0}
                onClick={() => togglePortfolio(it.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") togglePortfolio(it.id);
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
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    p: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "4px",
                    bgcolor: checked ? theme.palette.primary.main : alpha("#fff", 0.55),
                    color: checked ? "#fff" : "transparent",
                    border: `1px solid ${alpha(m.navy, 0.18)}`,
                    "& .MuiSvgIcon-root": { fontSize: 18 },
                    "&:hover": { bgcolor: checked ? theme.palette.primary.main : alpha("#fff", 0.75) },
                  }}
                />
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
                enableBusinessEditing("offering");
                enableBusinessEditing("profile");
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
