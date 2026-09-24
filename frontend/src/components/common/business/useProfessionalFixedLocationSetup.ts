"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import {
  useGetCalendarOverviewQuery,
  useUpdateBusinessSetupActiveMutation,
} from "../../../store/services/businessApi";
import {
  useFixedLocationForm,
  type FixedLocationFormState,
} from "../../../app/professionals/fixed-location/fixedLocation.use";
import { parseCalendarSettings } from "../calendar/calendar-settings.types";
import { resolveBusinessSetupServiceOrder } from "../calendar/serviceOrder.utils";
import { buildServiceOrderFromTemplate } from "../../../lib/businessTemplateCatalog";
import { toIsoLocalDate } from "../calendar/calendar.utils";
import { useSnackbar } from "../AppSnackbar";
import {
  createDefaultTemplateSyncSettings,
  pickSectionFields,
  sectionNeedsSyncSourceChoice,
  shouldLiveSyncField,
  type ConfigurableSyncSectionId,
  type TemplateSyncSettings,
} from "../businessSetupTemplateSync";
import { MAX_BUSINESS_KEYWORDS } from "./professionalFixedLocationSetup.data";
import {
  buildProfessionalDraftFromProfile,
  getProfessionalPhotoSrcFromProfile,
  type ProfessionalEditableDraft,
} from "./useProfessionalFixedLocationSetup.helpers";

export type {
  ProfessionalFixedLocationSetupProps,
  BusinessSetupSectionId,
  ProfileValidationField,
  ProvinceKey,
  TeamService,
  OfferingOption,
  OfferingSelectOption,
  BusinessTemplateState,
} from "./useProfessionalFixedLocationSetup.types";
export type {
  ProfessionalEditableDraft,
  ServiceDetailUiItem,
  TeamServiceSlots,
} from "./useProfessionalFixedLocationSetup.helpers";
export {
  buildProfessionalDraftFromProfile,
  computeDiscountedBaseAmount,
  formatEuroDisplay,
  formatFixedLocationMunicipalities,
  formatPriceForCard,
  getProfessionalPhotoSrcFromProfile,
  getProfessionalProfileRecord,
  getServiceBaseAmountNumber,
  getServiceCardPriceParts,
  hasServiceDiscount,
  mapServiceItemsToCategories,
  normalizePriceType,
  parseFixedLocationMunicipalities,
} from "./useProfessionalFixedLocationSetup.helpers";

import type {
  ProfessionalFixedLocationSetupProps,
  BusinessSetupSectionId,
  ProfileValidationField,
  ProvinceKey,
  TeamService,
  OfferingOption,
  OfferingSelectOption,
  BusinessTemplateState,
} from "./useProfessionalFixedLocationSetup.types";
import { useProfessionalFixedLocationSetupPortfolio } from "./useProfessionalFixedLocationSetup.portfolio";
import { useProfessionalFixedLocationSetupTeamState } from "./useProfessionalFixedLocationSetup.teamState";
import { useProfessionalFixedLocationSetupProfessionalDraft } from "./useProfessionalFixedLocationSetup.professionalDraft";
import { useProfessionalFixedLocationSetupDesiredAreas } from "./useProfessionalFixedLocationSetup.desiredAreas";
import { useProfessionalFixedLocationSetupSaveHandlers } from "./useProfessionalFixedLocationSetup.saveHandlers";
import { useProfessionalFixedLocationSetupPublish } from "./useProfessionalFixedLocationSetup.publish";
import { useProfessionalFixedLocationSetupMedia } from "./useProfessionalFixedLocationSetup.media";
import { useProfessionalFixedLocationSetupHydration } from "./useProfessionalFixedLocationSetup.hydration";
import { useProfessionalFixedLocationSetupServices } from "./useProfessionalFixedLocationSetup.services";

export function useProfessionalFixedLocationSetup({
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
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [
    updateBusinessSetupActive,
    { isLoading: isBusinessProfileStatusSaving },
  ] = useUpdateBusinessSetupActiveMutation();
  const todayIso = React.useMemo(() => toIsoLocalDate(new Date()), []);
  const { data: calendarOverviewData } = useGetCalendarOverviewQuery(
    { startDate: todayIso, endDate: todayIso },
    { refetchOnMountOrArgChange: true },
  );
  const calendarServiceOrder = React.useMemo(() => {
    const settings = calendarOverviewData?.data?.settings;
    const saved = settings
      ? parseCalendarSettings(settings.availability, settings.design).availability
          .serviceOrder
      : null;
    const fromTemplate = buildServiceOrderFromTemplate(
      businessSetupData?.service_details,
    );
    return resolveBusinessSetupServiceOrder(saved, {
      categories: fromTemplate.categories,
      servicesByCategory: fromTemplate.servicesByCategory,
      hiddenCategories: [],
      hiddenServicesByCategory: {},
    });
  }, [businessSetupData?.service_details, calendarOverviewData]);

  const isBusinessProfileActive = businessSetupData?.is_active !== false;
  const [profileErrors, setProfileErrors] = React.useState<
    Partial<Record<ProfileValidationField, string>>
  >({});

  const {
    values,
    setField,
    setAmenity,
    setServiceFor,
    addKeyword,
    removeKeyword,
  } = useFixedLocationForm();
  const [savedProfessionalDraft, setSavedProfessionalDraft] =
    React.useState<ProfessionalEditableDraft>(() =>
      buildProfessionalDraftFromProfile(profileData),
    );
  const [savedProfessionalPhotoSrc, setSavedProfessionalPhotoSrc] =
    React.useState(() => getProfessionalPhotoSrcFromProfile(profileData));
  const [activeSubTab, setActiveSubTab] = React.useState<string>(
    data.subTabsActive,
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [mediaSlides, setMediaSlides] = React.useState<string[]>([]);
  const [mediaIdx, setMediaIdx] = React.useState(0);
  const [mediaDeleteConfirmOpen, setMediaDeleteConfirmOpen] =
    React.useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = React.useState(false);

  const {
    portfolioInputRef,
    portfolioItemsFixed,
    setPortfolioItemsFixed,
    portfolioItemsDesired,
    setPortfolioItemsDesired,
    activePortfolioTargetRef,
    portfolioLiveSyncRef,
    setPortfolioItems,
    selectedPortfolioIds,
    setSelectedPortfolioIds,
    portfolioBlobUrlsRef,
    togglePortfolio,
    onUploadPortfolio,
    onPortfolioFilesSelected,
    deleteSelectedPortfolio,
  } = useProfessionalFixedLocationSetupPortfolio({ showSnackbar });

  const {
    TEAM_SERVICE_SLOT_KEYS,
    allSubcategoryOptions,
    getSubcategoryLabel,
    resolveCategoryDisplayTitle,
    getMemberAssignedServiceIds,
    removeServiceIdFromTeamMembers,
    memberProvidesAllServices,
    defaultServices,
    teamMembersFixed,
    setTeamMembersFixed,
    teamMembersDesired,
    setTeamMembersDesired,
    activeTeamTargetRef,
    teamLiveSyncRef,
    setTeamMembers,
    teamServiceMenu,
    setTeamServiceMenu,
    featureTeamPublic,
    setFeatureTeamPublic,
    addedBlobUrlsRef,
  } = useProfessionalFixedLocationSetupTeamState({ businessCategories });

  const {
    professionalPhotoInputRef,
    pendingProfessionalPhoto,
    setPendingProfessionalPhoto,
    onChooseProfessionalPhoto,
    onProfessionalPhotoSelected,
    isProfessionalEditing,
    setIsProfessionalEditing,
    professionalFieldsDisabled,
    hydratedProfileRef,
    applyProfessionalDraft,
    professionalDraft,
    isProfessionalDirty,
    cancelProfessionalEditing,
  } = useProfessionalFixedLocationSetupProfessionalDraft({
    profileData,
    values,
    setField,
    showSnackbar,
    savedProfessionalDraft,
    setSavedProfessionalDraft,
    savedProfessionalPhotoSrc,
    setSavedProfessionalPhotoSrc,
    setProfileErrors,
    addedBlobUrlsRef,
  });

  const toDisplayNumber = React.useCallback(
    (value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === "") {
        return "";
      }

      return String(value);
    },
    [],
  );

  const toTeamServicePayload = React.useCallback(
    (services: TeamService) => {
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
          const matched = allSubcategoryOptions.find(
            (option) => option.value === value,
          );
          return {
            service_id: String(value),
            title: matched?.label ?? null,
          };
        });
    },
    [allSubcategoryOptions],
  );
  const [isBusinessPublishEnabled, setIsBusinessPublishEnabled] =
    React.useState(() => Boolean(businessSetupData?.has_unpublished_changes));
  const [editingBusinessSections, setEditingBusinessSections] = React.useState<
    Set<BusinessSetupSectionId>
  >(() => new Set());
  const startBusinessSectionEdit = (sectionId: BusinessSetupSectionId) => {
    setEditingBusinessSections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  };
  const isBusinessSectionEditing = (sectionId: BusinessSetupSectionId) =>
    editingBusinessSections.has(sectionId);
  const isBusinessSectionDisabled = (sectionId: BusinessSetupSectionId) =>
    isBusinessSetupSaving || !editingBusinessSections.has(sectionId);
  const businessFormDisabled = isBusinessSetupSaving;
  const templateOptions = React.useMemo(
    () => ["Fixed Location", "Desired Location"] as const,
    [],
  );
  type OfferingOption = (typeof templateOptions)[number];
  type OfferingSelectOption = OfferingOption | "Both";
  const offeringSelectOptions = React.useMemo(
    () => ["Fixed Location", "Desired Location", "Both"] as const,
    [],
  );
  const [businessOfferingSelect, setBusinessOfferingSelect] =
    React.useState<OfferingSelectOption>("Fixed Location");
  const [activeBusinessTemplate, setActiveBusinessTemplate] =
    React.useState<OfferingOption>("Fixed Location");
  const [templateSyncSettings, setTemplateSyncSettings] =
    React.useState<TemplateSyncSettings>(() =>
      createDefaultTemplateSyncSettings(),
    );
  const [templateSyncDraft, setTemplateSyncDraft] =
    React.useState<TemplateSyncSettings>(() =>
      createDefaultTemplateSyncSettings(),
    );
  const [templateSyncDrawerOpen, setTemplateSyncDrawerOpen] =
    React.useState(false);
  const [businessStatusMenuAnchor, setBusinessStatusMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [templateSyncModalOpen, setTemplateSyncModalOpen] =
    React.useState(false);
  const isBothOffering = businessOfferingSelect === "Both";
  const isFixedTemplateView =
    businessOfferingSelect === "Fixed Location" ||
    (isBothOffering && activeBusinessTemplate === "Fixed Location");
  const isDesiredTemplateView =
    businessOfferingSelect === "Desired Location" ||
    (isBothOffering && activeBusinessTemplate === "Desired Location");

  activeTeamTargetRef.current =
    isBothOffering &&
    activeBusinessTemplate === "Desired Location" &&
    templateSyncSettings.manageTeam !== "sync"
      ? "desired"
      : "fixed";
  teamLiveSyncRef.current =
    isBothOffering && templateSyncSettings.manageTeam === "sync";

  activePortfolioTargetRef.current =
    isBothOffering &&
    activeBusinessTemplate === "Desired Location" &&
    templateSyncSettings.portfolio !== "sync"
      ? "desired"
      : "fixed";
  portfolioLiveSyncRef.current =
    isBothOffering && templateSyncSettings.portfolio === "sync";

  const teamMembers =
    activeTeamTargetRef.current === "desired"
      ? teamMembersDesired
      : teamMembersFixed;
  const portfolioItems =
    activePortfolioTargetRef.current === "desired"
      ? portfolioItemsDesired
      : portfolioItemsFixed;

  const isDesiredSyncLocked = React.useCallback(
    (
      sectionId:
        | "profile"
        | "serviceFor"
        | "servicesDetails"
        | "manageTeam"
        | "infoAndPolicy"
        | "portfolio",
    ) => {
      if (!isBothOffering || activeBusinessTemplate !== "Desired Location")
        return false;
      if (sectionId === "profile") return true;
      return templateSyncSettings[sectionId] === "sync";
    },
    [activeBusinessTemplate, isBothOffering, templateSyncSettings],
  );
  const locationDisabled = isBusinessSectionDisabled("location");
  const profileDisabled =
    isBusinessSectionDisabled("profile") || isDesiredSyncLocked("profile");
  const serviceForDisabled =
    isBusinessSectionDisabled("serviceFor") ||
    isDesiredSyncLocked("serviceFor");
  const servicesDetailsDisabled =
    isBusinessSetupSaving || isDesiredSyncLocked("servicesDetails");
  const manageTeamDisabled =
    isBusinessSetupSaving || isDesiredSyncLocked("manageTeam");
  const generalNotesDisabled =
    isBusinessSectionDisabled("generalNotes") ||
    isDesiredSyncLocked("infoAndPolicy");
  const priceDisabled = generalNotesDisabled;
  const policyDisabled = generalNotesDisabled;
  const reschedulingPolicyDisabled = generalNotesDisabled;
  const cancellationPolicyDisabled = generalNotesDisabled;
  const noShowPolicyDisabled = generalNotesDisabled;
  const portfolioDisabled =
    isBusinessSetupSaving || isDesiredSyncLocked("portfolio");

  const showFixedLocationSection = isFixedTemplateView;
  const showDesiredLocationSection = isDesiredTemplateView;
  const showKilometerAllowance = isDesiredTemplateView;
  const showProjectSection = isDesiredTemplateView;

  const locationSectionTitle = React.useMemo(() => {
    if (businessOfferingSelect === "Desired Location")
      return "Desired Location";
    if (businessOfferingSelect === "Fixed Location") return "Fixed Location";
    return data.location.title;
  }, [businessOfferingSelect, data.location.title]);

  const visibleLocationCards = React.useMemo((): OfferingOption[] => {
    if (businessOfferingSelect === "Both")
      return ["Fixed Location", "Desired Location"];
    if (businessOfferingSelect === "Fixed Location") return ["Fixed Location"];
    return ["Desired Location"];
  }, [businessOfferingSelect]);


  const sharedTemplateSyncFields = React.useMemo(
    () =>
      [
        "profileName",
        "about",
        "keywordDraft",
        "keywords",
        "serviceFor",
        "amenities",
        "notes",
        "priceRangeFrom",
        "priceRangeTo",
        "prepaymentPercent",
        "prepaymentInstructions",
      ] as const,
    [],
  );

  type SharedTemplateSyncField = (typeof sharedTemplateSyncFields)[number];

  const isSharedTemplateSyncField = React.useCallback(
    (key: keyof BusinessTemplateState): key is SharedTemplateSyncField =>
      (sharedTemplateSyncFields as readonly string[]).includes(key),
    [sharedTemplateSyncFields],
  );

  const shouldMirrorSyncField = React.useCallback(
    (key: keyof BusinessTemplateState) =>
      isBothOffering &&
      isSharedTemplateSyncField(key) &&
      shouldLiveSyncField(templateSyncSettings, key),
    [isBothOffering, isSharedTemplateSyncField, templateSyncSettings],
  );

  const getCurrentBusinessState =
    React.useCallback((): BusinessTemplateState => {
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
        municipalities: values.municipalities,
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

  const [desiredBusiness, setDesiredBusiness] =
    React.useState<BusinessTemplateState>(() => getCurrentBusinessState());

  const fixedBiz = getCurrentBusinessState();
  const biz = React.useMemo((): BusinessTemplateState => {
    if (activeBusinessTemplate === "Fixed Location" || !isBothOffering) {
      return activeBusinessTemplate === "Fixed Location"
        ? fixedBiz
        : desiredBusiness;
    }
    let merged: BusinessTemplateState = { ...desiredBusiness };
    for (const key of sharedTemplateSyncFields) {
      if (shouldLiveSyncField(templateSyncSettings, key)) {
        merged = { ...merged, [key]: fixedBiz[key] };
      }
    }
    return merged;
  }, [
    activeBusinessTemplate,
    desiredBusiness,
    fixedBiz,
    isBothOffering,
    sharedTemplateSyncFields,
    templateSyncSettings,
  ]);

  const setFixedBizField = React.useCallback(
    <K extends keyof BusinessTemplateState>(
      key: K,
      value: BusinessTemplateState[K],
    ) => {
      setIsBusinessPublishEnabled(true);
      setField(key as keyof FixedLocationFormState, value as never);
      if (shouldMirrorSyncField(key)) {
        setDesiredBusiness((prev) => ({ ...prev, [key]: value }));
      }
    },
    [setField, shouldMirrorSyncField],
  );

  const {
    desiredProvinceOptions,
    desiredMunicipalityByProvince,
    toProvinceKey,
    desiredAreaMode,
    setDesiredAreaMode,
    desiredProvinceDraft,
    setDesiredProvinceDraft,
    desiredMunicipalityDraft,
    setDesiredMunicipalityDraft,
    desiredAreas,
    setDesiredAreas,
    desiredAreasByProvince,
    addDesiredArea,
    removeDesiredProvinceGroup,
  } = useProfessionalFixedLocationSetupDesiredAreas({
    setIsBusinessPublishEnabled,
  });

  const fixedProvinceKey = React.useMemo<
    (typeof desiredProvinceOptions)[number]
  >(() => {
    const province = fixedBiz.province;
    return (desiredProvinceOptions as readonly string[]).includes(province)
      ? (province as (typeof desiredProvinceOptions)[number])
      : "Noord-Holland";
  }, [fixedBiz.province, desiredProvinceOptions]);



  const setBizField = React.useCallback(
    <K extends keyof BusinessTemplateState>(
      key: K,
      value: BusinessTemplateState[K],
    ) => {
      setIsBusinessPublishEnabled(true);

      if (activeBusinessTemplate === "Fixed Location") {
        setField(key as keyof FixedLocationFormState, value as never);
        if (shouldMirrorSyncField(key)) {
          setDesiredBusiness((prev) => ({ ...prev, [key]: value }));
        }
      } else {
        setDesiredBusiness((p) => ({ ...p, [key]: value }));
        if (shouldMirrorSyncField(key)) {
          setField(key as keyof FixedLocationFormState, value as never);
        }
      }
    },
    [activeBusinessTemplate, setField, shouldMirrorSyncField],
  );

  const setPublishableFormField = React.useCallback(
    <K extends keyof FixedLocationFormState>(
      key: K,
      value: FixedLocationFormState[K],
    ) => {
      setIsBusinessPublishEnabled(true);
      setField(key, value);
    },
    [setField],
  );

  const addBizKeyword = React.useCallback(() => {
    if (biz.keywords.length >= MAX_BUSINESS_KEYWORDS) return;
    const next = biz.keywordDraft.trim();
    if (!next) return;
    if (biz.keywords.includes(next)) {
      setBizField("keywordDraft", "");
      return;
    }
    setBizField(
      "keywords",
      [...biz.keywords, next].slice(0, MAX_BUSINESS_KEYWORDS),
    );
    setBizField("keywordDraft", "");
  }, [biz.keywordDraft, biz.keywords, setBizField]);

  const keywordsAtMax = biz.keywords.length >= MAX_BUSINESS_KEYWORDS;

  const removeBizKeyword = React.useCallback(
    (k: string) => {
      setBizField(
        "keywords",
        biz.keywords.filter((x) => x !== k),
      );
    },
    [biz.keywords, setBizField],
  );

  const setBizServiceFor = React.useCallback(
    (id: "men" | "women" | "kids", checked: boolean) => {
      setBizField("serviceFor", { ...biz.serviceFor, [id]: checked });
    },
    [biz.serviceFor, setBizField],
  );

  const {
    onSaveBusinessProfile,
    servicesFixedRef,
    servicesDesiredRef,
    businessSetupSaveChainRef,
    setBusinessProfileActive,
    onToggleBusinessProfileActive,
    toPersistedTeamMemberId,
    buildBusinessSetupPayload,
    buildBusinessSetupSaveBody,
    clearPendingTeamMemberPhotos,
    saveBusinessSetupData,
    notifyBusinessSetupPersisted,
    saveBusinessSection,
    onSwitchActiveBusinessTemplate,
  } = useProfessionalFixedLocationSetupSaveHandlers({
    onSaveBusinessSetup,
    showSnackbar,
    updateBusinessSetupActive,
    isBusinessProfileActive,
    businessOfferingSelect,
    desiredBusiness,
    fixedBiz,
    desiredAreaMode,
    desiredAreas,
    mediaSlides,
    templateSyncSettings,
    businessCategories,
    businessSetupData,
    values,
    toTeamServicePayload,
    teamMembersFixed,
    teamMembersDesired,
    setTeamMembersFixed,
    setTeamMembersDesired,
    setIsBusinessPublishEnabled,
    setEditingBusinessSections,
    setActiveBusinessTemplate,
  });

  const {
    activeServiceCategory,
    setActiveServiceCategory,
    initialServiceItems,
    servicesFixed,
    setServicesFixed,
    servicesDesired,
    setServicesDesired,
    mainServicesFixed,
    setMainServicesFixed,
    mainServicesDesired,
    setMainServicesDesired,
    activeServices,
    activeMainServices,
    serviceCategoryTabs,
    setActiveServices,
    setActiveMainServices,
    applyTemplateSyncSettings,
    teamBusinessServices,
    buildTeamMemberServiceGroups,
    teamMemberModal,
    expandedServiceDetailIds,
    setExpandedServiceDetailIds,
    expandedMainServiceIds,
    setExpandedMainServiceIds,
    serviceModal,
    handleEditSubservice,
    handleDeleteSubservice,
    handleEditMainService,
    handleDeleteMainService,
    ensureCategoryParentMain,
    openAddServiceForCategory,
    openAddService,
    openAddSubserviceForItem,
    toggleServiceDetailExpand,
    toggleMainServiceExpand,
    resolveServiceCategoryTitle,
    getExplicitMainsForCategory,
    getSubservicesForCategory,
    getFlatSubservicesForCategory,
    groupedServiceSections,
    activeCategoryExplicitMains,
    activeCategoryFlatSubservices,
    saveServicesDetails,
  } = useProfessionalFixedLocationSetupServices({
    activeBusinessTemplate,
    isBothOffering,
    templateSyncSettings,
    businessCategories,
    calendarServiceOrder,
    servicesFixedRef,
    servicesDesiredRef,
    setIsBusinessPublishEnabled,
    getCurrentBusinessState,
    desiredBusiness,
    setDesiredBusiness,
    setField,
    setTemplateSyncSettings,
    setTemplateSyncDraft,
    teamMembersFixed,
    teamMembersDesired,
    setTeamMembersFixed,
    setTeamMembersDesired,
    portfolioItemsFixed,
    portfolioItemsDesired,
    setPortfolioItemsFixed,
    setPortfolioItemsDesired,
    teamMembers,
    setTeamMembers,
    setTeamServiceMenu,
    removeServiceIdFromTeamMembers,
    allSubcategoryOptions,
    getMemberAssignedServiceIds,
    resolveCategoryDisplayTitle,
    onSaveBusinessSetup,
    buildBusinessSetupSaveBody,
    saveBusinessSetupData,
    notifyBusinessSetupPersisted,
    showSnackbar,
  });

  const sectionNeedsSyncSource = React.useCallback(
    (sectionId: ConfigurableSyncSectionId) => {
      const fixed = getCurrentBusinessState();
      switch (sectionId) {
        case "serviceFor":
          return sectionNeedsSyncSourceChoice(
            pickSectionFields(fixed as Record<string, unknown>, "serviceFor"),
            pickSectionFields(
              desiredBusiness as Record<string, unknown>,
              "serviceFor",
            ),
          );
        case "infoAndPolicy":
          return sectionNeedsSyncSourceChoice(
            pickSectionFields(
              fixed as Record<string, unknown>,
              "infoAndPolicy",
            ),
            pickSectionFields(
              desiredBusiness as Record<string, unknown>,
              "infoAndPolicy",
            ),
          );
        case "servicesDetails":
          return sectionNeedsSyncSourceChoice(
            { services: servicesFixed, mains: mainServicesFixed },
            { services: servicesDesired, mains: mainServicesDesired },
          );
        case "manageTeam":
          return sectionNeedsSyncSourceChoice(
            teamMembersFixed,
            teamMembersDesired,
          );
        case "portfolio":
          return sectionNeedsSyncSourceChoice(
            portfolioItemsFixed,
            portfolioItemsDesired,
          );
        default:
          return false;
      }
    },
    [
      desiredBusiness,
      getCurrentBusinessState,
      mainServicesDesired,
      mainServicesFixed,
      portfolioItemsDesired,
      portfolioItemsFixed,
      servicesDesired,
      servicesFixed,
      teamMembersDesired,
      teamMembersFixed,
    ],
  );

  const { hydratedBusinessRef } = useProfessionalFixedLocationSetupHydration({
    businessSetupData,
    businessCategories,
    setBusinessOfferingSelect,
    setActiveBusinessTemplate,
    setField,
    values,
    setDesiredBusiness,
    setTemplateSyncSettings,
    setTemplateSyncDraft,
    toDisplayNumber,
    setMediaSlides,
    setMediaIdx,
    setMainServicesFixed,
    setMainServicesDesired,
    setServicesFixed,
    setServicesDesired,
    servicesFixedRef,
    servicesDesiredRef,
    defaultServices,
    setTeamMembersFixed,
    setTeamMembersDesired,
    setIsBusinessPublishEnabled,
  });

  const {
    getBusinessSetupPublishValidation,
    businessSetupPublishValidation,
    publishBlockedByValidation,
    onAttemptPublishBusinessSetup,
    onPublishBusinessSetup,
  } = useProfessionalFixedLocationSetupPublish({
    businessOfferingSelect,
    desiredBusiness,
    fixedBiz,
    desiredAreaMode,
    desiredAreas,
    mediaSlides,
    servicesFixed,
    servicesDesired,
    isBothOffering,
    templateSyncSettings,
    teamMembersFixed,
    teamMembersDesired,
    portfolioItemsFixed,
    portfolioItemsDesired,
    values,
    isBusinessProfileActive,
    showSnackbar,
    onSaveBusinessSetup,
    saveBusinessSetupData,
    clearPendingTeamMemberPhotos,
    updateBusinessSetupActive,
    editingBusinessSections,
    setEditingBusinessSections,
    setIsBusinessPublishEnabled,
    setPublishConfirmOpen,
  });

  React.useEffect(() => {
    if (mediaIdx > mediaSlides.length - 1)
      setMediaIdx(Math.max(0, mediaSlides.length - 1));
  }, [mediaIdx, mediaSlides.length]);

  const { onUploadMedia, onConfirmDeleteMedia, onFilesSelected } =
    useProfessionalFixedLocationSetupMedia({
      mediaSlides,
      setMediaSlides,
      mediaIdx,
      setMediaIdx,
      fileInputRef,
      setMediaDeleteConfirmOpen,
      setIsBusinessPublishEnabled,
      onUploadBusinessMedia,
      showSnackbar,
    });

  const goPrevMedia = React.useCallback(() => {
    if (mediaSlides.length === 0) return;
    setMediaIdx((i) => (i - 1 + mediaSlides.length) % mediaSlides.length);
  }, [mediaSlides.length]);
  const goNextMedia = React.useCallback(() => {
    if (mediaSlides.length === 0) return;
    setMediaIdx((i) => (i + 1) % mediaSlides.length);
  }, [mediaSlides.length]);

  return {
    TEAM_SERVICE_SLOT_KEYS,
    activeBusinessTemplate,
    activeCategoryExplicitMains,
    activeCategoryFlatSubservices,
    activeMainServices,
    activePortfolioTargetRef,
    activeServiceCategory,
    activeServices,
    activeSubTab,
    activeTeamTargetRef,
    addBizKeyword,
    addDesiredArea,
    addKeyword,
    addedBlobUrlsRef,
    allSubcategoryOptions,
    applyProfessionalDraft,
    applyTemplateSyncSettings,
    biz,
    buildBusinessSetupPayload,
    buildBusinessSetupSaveBody,
    buildTeamMemberServiceGroups,
    businessCategories,
    businessFormDisabled,
    businessOfferingSelect,
    businessSetupData,
    businessSetupPublishValidation,
    businessSetupSaveChainRef,
    businessStatusMenuAnchor,
    calendarOverviewData,
    calendarServiceOrder,
    cancelProfessionalEditing,
    cancellationPolicyDisabled,
    chrome,
    clearPendingTeamMemberPhotos,
    data,
    defaultServices,
    deleteSelectedPortfolio,
    desiredAreaMode,
    desiredAreas,
    desiredAreasByProvince,
    desiredBusiness,
    desiredMunicipalityByProvince,
    desiredMunicipalityDraft,
    desiredProvinceDraft,
    desiredProvinceOptions,
    editingBusinessSections,
    ensureCategoryParentMain,
    expandedMainServiceIds,
    expandedServiceDetailIds,
    featureTeamPublic,
    fileInputRef,
    fixedBiz,
    fixedProvinceKey,
    generalNotesDisabled,
    getBusinessSetupPublishValidation,
    getCurrentBusinessState,
    getExplicitMainsForCategory,
    getFlatSubservicesForCategory,
    getMemberAssignedServiceIds,
    getSubcategoryLabel,
    getSubservicesForCategory,
    goNextMedia,
    goPrevMedia,
    groupedServiceSections,
    handleDeleteMainService,
    handleDeleteSubservice,
    handleEditMainService,
    handleEditSubservice,
    hydratedBusinessRef,
    hydratedProfileRef,
    initialServiceItems,
    isBothOffering,
    isBusinessMediaUploading,
    isBusinessProfileActive,
    isBusinessProfileStatusSaving,
    isBusinessPublishEnabled,
    isBusinessSectionDisabled,
    isBusinessSectionEditing,
    isBusinessSetupSaving,
    isDesiredSyncLocked,
    isDesiredTemplateView,
    isFixedTemplateView,
    isProfessionalDirty,
    isProfessionalEditing,
    isProfileSaving,
    isSharedTemplateSyncField,
    keywordsAtMax,
    locationDisabled,
    locationSectionTitle,
    m,
    mainServicesDesired,
    mainServicesFixed,
    manageTeamDisabled,
    mediaDeleteConfirmOpen,
    mediaIdx,
    mediaSlides,
    memberProvidesAllServices,
    noShowPolicyDisabled,
    notifyBusinessSetupPersisted,
    offeringSelectOptions,
    onAttemptPublishBusinessSetup,
    onChooseProfessionalPhoto,
    onConfirmDeleteMedia,
    onFilesSelected,
    onPortfolioFilesSelected,
    onProfessionalPhotoSelected,
    onPublishBusinessSetup,
    onSaveBusinessProfile,
    onSaveBusinessSetup,
    onSaveProfessionalProfile,
    onSwitchActiveBusinessTemplate,
    onToggleBusinessProfileActive,
    onUploadBusinessMedia,
    onUploadMedia,
    onUploadPortfolio,
    openAddService,
    openAddServiceForCategory,
    openAddSubserviceForItem,
    pendingProfessionalPhoto,
    policyDisabled,
    portfolioBlobUrlsRef,
    portfolioDisabled,
    portfolioInputRef,
    portfolioItems,
    portfolioItemsDesired,
    portfolioItemsFixed,
    portfolioLiveSyncRef,
    priceDisabled,
    professionalDraft,
    professionalFieldsDisabled,
    professionalPhotoInputRef,
    profileData,
    profileDisabled,
    profileErrors,
    publishBlockedByValidation,
    publishConfirmOpen,
    removeBizKeyword,
    removeDesiredProvinceGroup,
    removeKeyword,
    removeServiceIdFromTeamMembers,
    reschedulingPolicyDisabled,
    resolveCategoryDisplayTitle,
    resolveServiceCategoryTitle,
    router,
    saveBusinessSection,
    saveBusinessSetupData,
    saveServicesDetails,
    savedProfessionalDraft,
    savedProfessionalPhotoSrc,
    selectedPortfolioIds,
    serviceCategoryTabs,
    serviceForDisabled,
    sectionNeedsSyncSource,
    serviceModal,
    servicesDesired,
    servicesDesiredRef,
    servicesDetailsDisabled,
    servicesFixed,
    servicesFixedRef,
    setActiveBusinessTemplate,
    setActiveMainServices,
    setActiveServiceCategory,
    setActiveServices,
    setActiveSubTab,
    setAmenity,
    setBizField,
    setBizServiceFor,
    setBusinessOfferingSelect,
    setBusinessProfileActive,
    setBusinessStatusMenuAnchor,
    setDesiredAreaMode,
    setDesiredAreas,
    setDesiredBusiness,
    setDesiredMunicipalityDraft,
    setDesiredProvinceDraft,
    setEditingBusinessSections,
    setExpandedMainServiceIds,
    setExpandedServiceDetailIds,
    setFeatureTeamPublic,
    setField,
    setFixedBizField,
    setIsBusinessPublishEnabled,
    setIsProfessionalEditing,
    setMainServicesDesired,
    setMainServicesFixed,
    setMediaDeleteConfirmOpen,
    setMediaIdx,
    setMediaSlides,
    setPendingProfessionalPhoto,
    setPortfolioItems,
    setPortfolioItemsDesired,
    setPortfolioItemsFixed,
    setProfileErrors,
    setPublishConfirmOpen,
    setPublishableFormField,
    setSavedProfessionalDraft,
    setSavedProfessionalPhotoSrc,
    setSelectedPortfolioIds,
    setServiceFor,
    setServicesDesired,
    setServicesFixed,
    setTeamMembers,
    setTeamMembersDesired,
    setTeamMembersFixed,
    setTeamServiceMenu,
    setTemplateSyncDraft,
    setTemplateSyncDrawerOpen,
    setTemplateSyncModalOpen,
    setTemplateSyncSettings,
    sharedTemplateSyncFields,
    shouldMirrorSyncField,
    showDesiredLocationSection,
    showFixedLocationSection,
    showKilometerAllowance,
    showProjectSection,
    showSnackbar,
    startBusinessSectionEdit,
    teamBusinessServices,
    teamLiveSyncRef,
    teamMemberModal,
    teamMembers,
    teamMembersDesired,
    teamMembersFixed,
    teamServiceMenu,
    templateOptions,
    templateSyncDraft,
    templateSyncDrawerOpen,
    templateSyncModalOpen,
    templateSyncSettings,
    theme,
    toDisplayNumber,
    toPersistedTeamMemberId,
    toProvinceKey,
    toTeamServicePayload,
    todayIso,
    toggleMainServiceExpand,
    togglePortfolio,
    toggleServiceDetailExpand,
    updateBusinessSetupActive,
    values,
    visibleLocationCards,
  };

}
