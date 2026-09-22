"use client";

import * as React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter, useSearchParams } from "next/navigation";
import { parseTimeLabelToMinutes } from "../../../app/clients/booking/booking-time";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import {
  getActiveBookingSession,
  getCreateReturnHref,
  notifyActiveBookingChanged,
  setActiveBookingSession,
} from "../../../app/clients/booking/clientBookingSession";
import { submitClientBookingRequest } from "../../../app/clients/booking/submitClientBookingRequest";
import { getApiErrorMessage } from "../../../lib/api-error";
import { queueSnackbarFlash } from "../../../lib/snackbarFlash";
import {
  useCreateBookingMutation,
  useGetAllBusinessSetupsQuery,
  useUpdateMyBookingMutation,
} from "../../../store/services/businessApi";
import { useSyncFinanceTransactionFromBookingMutation } from "../../../store/services/financeApi";
import { useSnackbar } from "../AppSnackbar";
import {
  getTeamForLocationMode,
  isAddressInOperatingArea,
  resolveDesiredVisitMunicipalityOptions,
} from "../../../data/businessPublicProfile.data";
import {
  formatContactPhone,
  getPhoneValidationErrors,
  splitContactPhone,
} from "../../../lib/phone-validation";
import {
  INPUT_LIMITS,
  parsePhoneDigits,
  parseText,
} from "../../../lib/inputSchema";
import { buildBookingSummarySections } from "./buildBookingSummarySections";
import {
  partitionBookingProducts,
  summarizeClientBookingPrice,
  withoutItemizedBookingSummaryLines,
} from "../calendar/bookingTotal";
import {
  markNotesPrepaymentPaid,
  parseCalendarEntryNotes,
  resolveKilometerAllowanceAmount,
} from "../calendar/bookingEventDetails";
import { usePublicFinanceSettings } from "../finance-documents/usePublicFinanceSettings";
import {
  checkoutPaymentMethodSupportsPayNow,
  isOfflinePaymentMethod,
  resolveCheckoutPaymentOptions,
} from "./checkoutPaymentOptions";
import ClientBookingCreateSummaryCheckoutPanel from "./ClientBookingCreateSummaryCheckoutPanel";
import ClientBookingCreateSummaryContactPanel from "./ClientBookingCreateSummaryContactPanel";
import ClientBookingCreateSummaryServiceCard from "./ClientBookingCreateSummaryServiceCard";
import ClientTeamMemberPublicProfileDrawer, {
  type ClientTeamMemberPublicProfile,
} from "./ClientTeamMemberPublicProfileDrawer";
import ClientBookingProjectDetailsCard from "./ClientBookingProjectDetailsCard";
import StripePrepaymentDialog from "./StripePrepaymentDialog";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import type { ClientBookingDesiredLocation } from "./types";

export default function ClientBookingCreateSummaryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listTab = parseBookingListTab(searchParams?.get("tab"));
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const {
    draft,
    shop,
    businessProfile,
    requiresPrepayment,
    prepaymentPercent: profilePrepaymentPercent,
  } = useClientBookingDraft();
  const { record: activeBooking, refresh: refreshActiveBooking } =
    useActiveClientBooking();
  const { requesterCountryCode, requesterPhone, isProfileLoading } =
    useClientRequesterProfile();
  const { data: businessSetupsData } = useGetAllBusinessSetupsQuery();
  const [createBooking] = useCreateBookingMutation();
  const [updateMyBooking] = useUpdateMyBookingMutation();
  const [syncFinanceFromBooking] =
    useSyncFinanceTransactionFromBookingMutation();

  const locationMode = shop?.locationMode ?? "fixed";
  const isDesired = locationMode === "desired";
  const { transactionOptions } = usePublicFinanceSettings(shop?.shopId);
  const checkoutPaymentOptions = React.useMemo(
    () =>
      resolveCheckoutPaymentOptions(
        transactionOptions,
        locationMode,
        parseCalendarEntryNotes(activeBooking?.notes)?.paymentMethod,
      ),
    [activeBooking?.notes, locationMode, transactionOptions],
  );
  const checkoutMethodId = checkoutPaymentOptions[0]?.id ?? "onlineDirect";
  const isOfflinePay =
    checkoutPaymentOptions.length > 0 &&
    checkoutPaymentOptions.every((option) => isOfflinePaymentMethod(option.id));
  const bookingSetup = React.useMemo(
    () =>
      businessSetupsData?.data?.find((row) => row.id === shop?.shopId) ?? null,
    [businessSetupsData?.data, shop?.shopId],
  );

  const profilePhone = React.useMemo(() => {
    const preferredCode = requesterCountryCode.trim();
    const fromProfile = requesterPhone.trim();
    if (!fromProfile && !preferredCode) {
      return { countryCode: "", phone: "" };
    }
    return splitContactPhone(fromProfile, preferredCode);
  }, [requesterCountryCode, requesterPhone]);

  const hasProfilePhone = Boolean(profilePhone.phone.trim());
  const [countryCode, setCountryCode] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    if (isProfileLoading) return;
    if (hasProfilePhone) {
      setCountryCode(profilePhone.countryCode);
      setPhone(profilePhone.phone);
      return;
    }
    const fromSession = String(activeBooking?.contactPhone ?? "").trim();
    if (fromSession) {
      const split = splitContactPhone(fromSession, profilePhone.countryCode);
      setCountryCode((prev) => prev || split.countryCode);
      setPhone((prev) => prev || split.phone);
      return;
    }
    if (profilePhone.countryCode) {
      setCountryCode((prev) => prev || profilePhone.countryCode);
    }
  }, [
    activeBooking?.contactPhone,
    hasProfilePhone,
    isProfileLoading,
    profilePhone.countryCode,
    profilePhone.phone,
  ]);

  const [address, setAddress] = React.useState<ClientBookingDesiredLocation>({
    street: "",
    number: "",
    postalCode: "",
    province: "",
    municipality: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [stripeDialogOpen, setStripeDialogOpen] = React.useState(false);
  const [profileMemberId, setProfileMemberId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const visit = draft?.desiredLocation;
    if (!visit) return;
    setAddress({
      street: visit.street ?? "",
      number: visit.number ?? "",
      postalCode: visit.postalCode ?? "",
      province: visit.province ?? "",
      municipality: visit.municipality ?? "",
    });
  }, [draft?.desiredLocation]);

  const summarySections = React.useMemo(
    () => buildBookingSummarySections(draft),
    [draft],
  );

  const profileMember = React.useMemo<ClientTeamMemberPublicProfile | null>(() => {
    const id = String(profileMemberId ?? "").trim();
    if (!id) return null;
    const locationTeam = businessProfile
      ? getTeamForLocationMode(businessProfile, locationMode)
      : [];
    const fromProfile =
      locationTeam.find((row) => row.id === id) ||
      businessProfile?.teamMembers.find((row) => row.id === id);
    const fallbackName =
      draft?.teamMembers?.find((tm) => String(tm.id) === id)?.name?.trim() || "";
    if (!fromProfile && !fallbackName) return null;
    const serviceLabels = [
      ...new Set(
        (fromProfile?.serviceSlots ?? []).flatMap((slot) =>
          slot.options
            .map((opt) => String(opt.label ?? "").trim())
            .filter(Boolean),
        ),
      ),
    ];
    return {
      id,
      name: fromProfile?.name?.trim() || fallbackName,
      avatarUrl: fromProfile?.avatarUrl,
      rating: fromProfile?.rating,
      reviewsCount: fromProfile?.reviewsCount,
      serviceLabels: serviceLabels.length ? serviceLabels : undefined,
    };
  }, [businessProfile, draft?.teamMembers, locationMode, profileMemberId]);

  const bookingStartMinutes = parseTimeLabelToMinutes(
    draft?.selectedTime ?? "12:00 AM",
  );
  const bookingEndMinutes =
    bookingStartMinutes +
    (draft?.services ?? []).reduce((sum, s) => sum + s.durationMins, 0);

  const dateLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return draft.selectedDateISO;
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [draft?.selectedDateISO]);

  const addressLabel = React.useMemo(() => {
    if (isDesired) {
      const parts = [
        address.street,
        address.number,
        address.postalCode,
        address.municipality,
      ]
        .map((p) => p.trim())
        .filter(Boolean);
      return parts.length ? parts.join(", ") : "Service at your location";
    }
    return (
      shop?.addressLabel?.trim() ||
      shop?.municipalityLabel?.trim() ||
      businessProfile?.fixedLocation?.formattedAddress?.trim() ||
      "Studio location"
    );
  }, [
    address,
    businessProfile?.fixedLocation?.formattedAddress,
    isDesired,
    shop?.addressLabel,
    shop?.municipalityLabel,
  ]);

  const total = draft?.total ?? 0;
  const bookingNotesMeta = React.useMemo(
    () => parseCalendarEntryNotes(activeBooking?.notes),
    [activeBooking?.notes],
  );
  const kilometerAllowanceAmount = React.useMemo(
    () =>
      isDesired
        ? resolveKilometerAllowanceAmount(bookingNotesMeta?.kilometerAllowance)
        : 0,
    [bookingNotesMeta?.kilometerAllowance, isDesired],
  );
  const extrasAmount =
    isDesired &&
    Boolean(bookingNotesMeta?.showKilometerAllowance) &&
    kilometerAllowanceAmount > 0
      ? kilometerAllowanceAmount
      : 0;
  const prepaymentPercent =
    Number(activeBooking?.prepaymentPercent) > 0
      ? Number(activeBooking?.prepaymentPercent)
      : profilePrepaymentPercent;
  const isPrepaymentPaid = Boolean(activeBooking?.prepaid);
  const mustPayBeforeBooking =
    !isDesired &&
    requiresPrepayment &&
    !isPrepaymentPaid &&
    !isOfflinePay &&
    checkoutPaymentMethodSupportsPayNow(checkoutMethodId);
  const showPrepayRow = requiresPrepayment && prepaymentPercent > 0;
  const showPayNowAction =
    showPrepayRow &&
    !isPrepaymentPaid &&
    !isOfflinePay &&
    checkoutPaymentMethodSupportsPayNow(checkoutMethodId);
  const checkoutPrice = summarizeClientBookingPrice({
    services: draft?.services,
    people: draft?.people,
    products: draft?.products,
    extrasAmount,
    discount: bookingNotesMeta?.totalDiscount ?? null,
    showLateCancellation: Boolean(bookingNotesMeta?.showLateCancellation),
    lateCancellationFeePercent: bookingNotesMeta?.lateCancellationFeePercent,
    showLateRescheduling: Boolean(bookingNotesMeta?.showLateRescheduling),
    lateRescheduleFeePercent: bookingNotesMeta?.lateRescheduleFeePercent,
    showNoShowFee: Boolean(bookingNotesMeta?.showNoShowFee),
    noShowFeePercent: bookingNotesMeta?.noShowFeePercent,
    showPrepayment: showPrepayRow,
    prepaymentPercent,
    prepaymentPaid: isPrepaymentPaid,
    prepaymentOffline: isOfflinePay,
  });
  const checkoutLines = withoutItemizedBookingSummaryLines(checkoutPrice.lines);
  const { products: catalogProducts, uniqueItems: catalogUniqueItems } =
    partitionBookingProducts(draft?.products);
  const checkoutTotal =
    checkoutPrice.breakdown.bookingTotal > 0
      ? checkoutPrice.breakdown.bookingTotal
      : total;
  const prepayAmount = checkoutPrice.breakdown.prepaymentAmount;
  const contactPhoneValue = formatContactPhone(countryCode, phone);
  const bookingRef = activeBooking?.bookingRef ?? "";

  const validateBeforeAction = React.useCallback(() => {
    const phoneErrors = getPhoneValidationErrors(countryCode, phone, {
      required: true,
    });
    if (phoneErrors.countryCode || phoneErrors.phone) {
      showSnackbar({
        severity: "error",
        message:
          phoneErrors.phone ??
          phoneErrors.countryCode ??
          "Please enter a valid contact number.",
      });
      return false;
    }
    const phoneDigits = parsePhoneDigits(phone.replace(/\D/g, ""), {
      required: true,
    });
    if (!phoneDigits.ok) {
      showSnackbar({ severity: "error", message: phoneDigits.error });
      return false;
    }
    if (isDesired) {
      const addressParsed = {
        street: parseText(address.street, {
          label: "Street",
          max: INPUT_LIMITS.textShort,
        }),
        number: parseText(address.number, {
          label: "Street number",
          max: INPUT_LIMITS.streetNumber,
        }),
        postalCode: parseText(address.postalCode, {
          label: "Postal code",
          max: INPUT_LIMITS.postalCode,
        }),
        municipality: parseText(address.municipality, {
          label: "Municipality",
          max: INPUT_LIMITS.textShort,
        }),
      };
      const firstAddressError = Object.values(addressParsed).find((r) => !r.ok);
      if (firstAddressError && !firstAddressError.ok) {
        showSnackbar({
          severity: "error",
          message: firstAddressError.error,
        });
        return false;
      }
      if (
        !isAddressInOperatingArea(
          businessProfile?.desiredLocation,
          "",
          address.municipality,
        )
      ) {
        showSnackbar({
          severity: "error",
          message:
            "This address is outside the professional’s operating area and cannot be booked.",
        });
        return false;
      }
    }
    return true;
  }, [
    address,
    businessProfile?.desiredLocation,
    countryCode,
    isDesired,
    phone,
    showSnackbar,
  ]);

  const persistDraftEdits = React.useCallback(() => {
    const session = getActiveBookingSession() ?? activeBooking;
    if (!session?.draft) return session;
    const next = {
      ...session,
      draft: {
        ...session.draft,
        ...(isDesired
          ? {
              desiredLocation: {
                street: address.street.trim(),
                number: address.number.trim(),
                postalCode: address.postalCode.trim(),
                province: "",
                municipality: address.municipality.trim(),
              },
            }
          : {}),
      },
      shop: session.shop
        ? {
            ...session.shop,
            ...(isDesired && addressLabel
              ? {
                  addressLabel,
                  municipalityLabel:
                    address.municipality.trim() || session.shop.municipalityLabel,
                }
              : {}),
          }
        : session.shop,
      contactPhone: contactPhoneValue || session.contactPhone,
    };
    const prevPhone = String(session.contactPhone ?? "").trim();
    const nextPhone = String(next.contactPhone ?? "").trim();
    const prevVisit = session.draft?.desiredLocation;
    const nextVisit = next.draft?.desiredLocation;
    const visitChanged =
      isDesired &&
      (String(prevVisit?.street ?? "") !== String(nextVisit?.street ?? "") ||
        String(prevVisit?.number ?? "") !== String(nextVisit?.number ?? "") ||
        String(prevVisit?.postalCode ?? "") !==
          String(nextVisit?.postalCode ?? "") ||
        String(prevVisit?.municipality ?? "") !==
          String(nextVisit?.municipality ?? ""));
    if (prevPhone !== nextPhone || visitChanged) {
      setActiveBookingSession(next);
    }
    return next;
  }, [activeBooking, address, addressLabel, contactPhoneValue, isDesired]);

  const goBackToCreate = React.useCallback(() => {
    persistDraftEdits();
    const href = getCreateReturnHref();
    if (href) {
      router.push(href);
      return;
    }
    router.back();
  }, [persistDraftEdits, router]);

  React.useEffect(() => {
    persistDraftEdits();
  }, [persistDraftEdits]);

  React.useEffect(() => {
    const persist = () => persistDraftEdits();
    window.addEventListener("pagehide", persist);
    return () => window.removeEventListener("pagehide", persist);
  }, [persistDraftEdits]);

  const ensureBookingCreated = React.useCallback(async () => {
    const record = persistDraftEdits();
    if (!record?.draft || !record.shop?.shopId) {
      showSnackbar({
        severity: "error",
        message: "Booking draft not found. Please go back and try again.",
      });
      return null;
    }
    if (record.bookingRequestSent && record.apiBookingId) {
      return record;
    }

    const result = await submitClientBookingRequest({
      record: {
        ...record,
        contactPhone: contactPhoneValue,
        draft: record.draft
          ? { ...record.draft, total: checkoutTotal }
          : record.draft,
      },
      locationMode,
      setup: bookingSetup,
      createBooking,
    });
    if (!result.ok) {
      if (result.message) {
        showSnackbar({ severity: "error", message: result.message });
      }
      return null;
    }
    setActiveBookingSession(result.record);
    await refreshActiveBooking();
    return result.record;
  }, [
    bookingSetup,
    checkoutTotal,
    contactPhoneValue,
    createBooking,
    locationMode,
    persistDraftEdits,
    refreshActiveBooking,
    showSnackbar,
  ]);

  const completePrepayment = React.useCallback(async () => {
    const record = await ensureBookingCreated();
    if (!record) return;

    const bookingId =
      record.apiBookingId ??
      (record.id && !String(record.id).startsWith("bk_draft_")
        ? record.id
        : null);
    if (!bookingId || String(bookingId).startsWith("bk_draft_")) {
      showSnackbar({
        severity: "error",
        message: "Booking not found on server.",
      });
      return;
    }

    try {
      // Desired stays a request until the pro accepts; Fixed can confirm on prepay.
      const nextStatus = isDesired ? "requested" : "confirmed";
      const paidNotes = markNotesPrepaymentPaid(
        record.notes,
        "onlineDirect",
      );
      await updateMyBooking({
        id: bookingId,
        prepayment_status: "paid",
        status: nextStatus,
        ...(paidNotes ? { notes: paidNotes } : {}),
      }).unwrap();

      const paidSession = {
        ...record,
        prepaid: true,
        requiresPrepayment: true,
        prepaymentPercent,
        status: nextStatus as "requested" | "confirmed",
        ...(paidNotes ? { notes: paidNotes } : {}),
      };
      setActiveBookingSession(paidSession);
      // Session write alone does not re-render; bump so Book Now unlocks before list refetch.
      notifyActiveBookingChanged();
      await refreshActiveBooking();

      void syncFinanceFromBooking({
        bookingRef: record.bookingRef,
        paymentPhase: "prepay",
        paymentMethod: "Online (Direct)",
        amount: prepayAmount,
        status: "Prepaid",
      });

      setStripeDialogOpen(false);
      showSnackbar({
        severity: "success",
        message: isDesired
          ? "Prepayment received. You can send your booking request."
          : "Prepayment received. You can complete your booking.",
      });
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to record prepayment.");
      if (message) {
        showSnackbar({ severity: "error", message });
      }
    }
  }, [
    ensureBookingCreated,
    isDesired,
    prepayAmount,
    prepaymentPercent,
    refreshActiveBooking,
    showSnackbar,
    syncFinanceFromBooking,
    updateMyBooking,
  ]);

  const handlePayNow = React.useCallback(async () => {
    if (isPaying || isPrepaymentPaid) return;
    if (!validateBeforeAction()) return;
    if (prepayAmount <= 0) {
      showSnackbar({ severity: "error", message: "No prepayment amount due." });
      return;
    }

    setIsPaying(true);
    try {
      // ponytail: testing shortcut — mark prepaid via completePrepayment (same as Stripe onSuccess); restore setStripeDialogOpen(true) when real card checkout is needed.
      await completePrepayment();
    } finally {
      setIsPaying(false);
    }
  }, [
    completePrepayment,
    isPaying,
    isPrepaymentPaid,
    prepayAmount,
    showSnackbar,
    validateBeforeAction,
  ]);

  const paymentSuccessHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    if (paymentSuccessHandledRef.current) return;
    paymentSuccessHandledRef.current = true;
    void completePrepayment();
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [completePrepayment]);

  const onSubmit = React.useCallback(async () => {
    if (isSubmitting) return;
    if (!validateBeforeAction()) return;

    if (mustPayBeforeBooking) {
      showSnackbar({
        severity: "error",
        message: "Please complete prepayment before booking.",
      });
      return;
    }

    const existing = getActiveBookingSession() ?? activeBooking;
    // Pay Now already created + confirmed the booking — just finish the flow.
    if (
      requiresPrepayment &&
      isPrepaymentPaid &&
      existing?.bookingRequestSent &&
      existing.apiBookingId
    ) {
      queueSnackbarFlash({
        severity: "success",
        message: "Booking request sent",
      });
      router.push(
        `/clients/booking/completed?outcome=completed&tab=${encodeURIComponent(listTab)}`,
      );
      return;
    }

    const record = persistDraftEdits();
    if (!record?.draft || !record.shop?.shopId) {
      showSnackbar({
        severity: "error",
        message: "Booking draft not found. Please go back and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitClientBookingRequest({
        record: {
          ...record,
          contactPhone: contactPhoneValue,
        draft: record.draft
          ? { ...record.draft, total: checkoutTotal }
          : record.draft,
        },
        locationMode,
        setup: bookingSetup,
        createBooking,
      });
      if (!result.ok) {
        if (result.message) {
          showSnackbar({ severity: "error", message: result.message });
        }
        return;
      }
      setActiveBookingSession(result.record);
      await refreshActiveBooking();
      const outcome = locationMode === "desired" ? "requested" : "completed";
      queueSnackbarFlash({
        severity: "success",
        message:
          outcome === "requested"
            ? "Booking request sent"
            : "Booking completed",
      });
      router.push(
        `/clients/booking/completed?outcome=${outcome}&tab=${encodeURIComponent(listTab)}`,
      );
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        isDesired
          ? "Unable to send booking request. Please try again."
          : "Unable to complete booking. Please try again.",
      );
      if (message) {
        showSnackbar({ severity: "error", message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeBooking,
    bookingSetup,
    checkoutTotal,
    contactPhoneValue,
    createBooking,
    isDesired,
    isPrepaymentPaid,
    isSubmitting,
    listTab,
    locationMode,
    mustPayBeforeBooking,
    persistDraftEdits,
    refreshActiveBooking,
    requiresPrepayment,
    router,
    showSnackbar,
    validateBeforeAction,
  ]);

  const municipalityOptions = React.useMemo(
    () =>
      resolveDesiredVisitMunicipalityOptions(businessProfile?.desiredLocation),
    [businessProfile?.desiredLocation],
  );

  if (!draft || !shop) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "mollure.pageBg", py: { xs: 2.5, md: 3.5 } }}>
      <Container maxWidth="lg" sx={{ maxWidth: { lg: 1100 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <Box sx={{ px: { xs: 2.25, md: 3.5 }, pt: 2.25, pb: 1.15 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                onClick={goBackToCreate}
                aria-label="Back to booking"
                sx={{
                  width: 36,
                  height: 36,
                  color: alpha(m.navy, 0.7),
                }}
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
              </IconButton>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 30 },
                  fontWeight: 700,
                  color: isDesired ? "#333333" : alpha(m.navy, 0.86),
                  lineHeight: 1.15,
                }}
              >
                Booking Details
              </Typography>
            </Stack>
          </Box>
          <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />

          <ClientBookingCreateSummaryServiceCard
            shopName={shop.shopName}
            dateLabel={dateLabel}
            bookingStartMinutes={bookingStartMinutes}
            bookingEndMinutes={bookingEndMinutes}
            addressLabel={addressLabel}
            isDesired={isDesired}
            summarySections={summarySections}
            teamMembers={draft.teamMembers}
            catalogProducts={catalogProducts}
            catalogUniqueItems={catalogUniqueItems}
            clientNote={draft.clientNote}
            onTeamMemberClick={(teamMemberId) =>
              setProfileMemberId(String(teamMemberId).trim() || null)
            }
          />

          {draft.projectDetails &&
          (Boolean(draft.projectDetails.description?.trim()) ||
            (draft.projectDetails.uploads?.length ?? 0) > 0) ? (
            <Box sx={{ px: { xs: 2.25, md: 3.5 }, pb: 2 }}>
              <ClientBookingProjectDetailsCard project={draft.projectDetails} />
            </Box>
          ) : null}

          <Box sx={{ px: { xs: 2.25, md: 3.5 }, pt: 0.25, pb: 2.25 }}>
            <ClientBookingCreateSummaryContactPanel
              isDesired={isDesired}
              countryCode={countryCode}
              phone={phone}
              onCountryCodeChange={setCountryCode}
              onPhoneChange={setPhone}
              hasProfilePhone={hasProfilePhone}
              address={address}
              onAddressChange={setAddress}
              municipalityOptions={municipalityOptions}
            />

            <ClientBookingCreateSummaryCheckoutPanel
              displayTotal={checkoutPrice.displayTotal}
              originalPrice={checkoutPrice.originalPrice}
              discountAmount={checkoutPrice.breakdown.discountAmount}
              lines={checkoutLines}
              showPrepayRow={showPrepayRow}
              prepaymentPercent={prepaymentPercent}
              prepayAmount={prepayAmount}
              remainingAfterPrepayment={
                checkoutPrice.breakdown.remainingAfterPrepayment
              }
              showPayNowAction={showPayNowAction}
              isPaying={isPaying}
              onPayNow={() => void handlePayNow()}
              isPrepaymentPaid={isPrepaymentPaid}
              isDesired={isDesired}
              isSubmitting={isSubmitting}
              mustPayBeforeBooking={mustPayBeforeBooking}
              onSubmit={() => void onSubmit()}
            />
          </Box>
        </Paper>
      </Container>

      <StripePrepaymentDialog
        open={stripeDialogOpen}
        amount={prepayAmount}
        bookingRef={bookingRef}
        onClose={() => setStripeDialogOpen(false)}
        onSuccess={() => void completePrepayment()}
      />
      <ClientTeamMemberPublicProfileDrawer
        open={Boolean(profileMemberId)}
        onClose={() => setProfileMemberId(null)}
        shopId={shop?.shopId}
        member={profileMember}
      />
    </Box>
  );
}
