"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  Box,
  Chip,
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
import {
  fmtMinutesToTimeLabel,
  parseTimeLabelToMinutes,
  serviceTimeRangeLabel,
} from "../../../app/clients/booking/booking-time";
import { parseBookingListTab } from "../../../app/clients/booking/bookingPillTabs";
import {
  getActiveBookingSession,
  getCreateReturnHref,
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
import AppButton from "../AppButton";
import AppCountryPhoneFields from "../AppCountryPhoneFields";
import AppDropdown from "../AppDropdown";
import AppTextField from "../AppTextField";
import {
  isAddressInOperatingArea,
  resolveDesiredVisitAddressOptions,
} from "../../../data/businessPublicProfile.data";
import {
  formatContactPhone,
  getPhoneValidationErrors,
  splitContactPhone,
} from "../../../lib/phone-validation";
import { buildBookingSummarySections, resolveTeamMemberFirstName } from "./buildBookingSummarySections";
import { locationModeChipSx } from "./locationModeChipSx";
import BookingSummaryNote from "./BookingSummaryNote";
import BookingLineAmount from "../calendar/BookingLineAmount";
import {
  clientLineDiscountLabel,
  formatBookingEur,
} from "../../../data/bookingLinePricing";
import ClientBookingProjectDetailsCard from "./ClientBookingProjectDetailsCard";
import StripePrepaymentDialog from "./StripePrepaymentDialog";
import { useActiveClientBooking } from "./useActiveClientBooking";
import { useClientBookingDraft } from "./useClientBookingDraft";
import { useClientRequesterProfile } from "./useClientRequesterProfile";
import type { ClientBookingDesiredLocation } from "./types";

function roleLabelForSection(section: {
  isRequester?: boolean;
  participantType?: string;
}) {
  if (section.participantType === "planning") return "PLANNING";
  if (section.participantType === "model") return "MODEL";
  if (section.participantType === "guest") return "GUEST";
  if (section.isRequester) return "CLIENT";
  return "CLIENT";
}

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
        address.number,
        address.street,
        address.postalCode,
        address.municipality,
        address.province,
      ]
        .map((p) => p.trim())
        .filter(Boolean);
      return parts.length ? parts.join(", ") : "Service at your location";
    }
    return (
      shop?.addressLabel?.trim() ||
      shop?.municipalityLabel?.trim() ||
      "Studio location"
    );
  }, [address, isDesired, shop?.addressLabel, shop?.municipalityLabel]);

  const total = draft?.total ?? 0;
  const actualAmount = React.useMemo(
    () =>
      (draft?.services ?? []).reduce(
        (sum, service) =>
          sum + (Number(service.originalPrice ?? service.price) || 0),
        0,
      ) || total,
    [draft?.services, total],
  );
  const prepaymentPercent =
    Number(activeBooking?.prepaymentPercent) > 0
      ? Number(activeBooking?.prepaymentPercent)
      : profilePrepaymentPercent;
  const isPrepaymentPaid = Boolean(activeBooking?.prepaid);
  const mustPayBeforeBooking = requiresPrepayment && !isPrepaymentPaid;
  const showFixedPrepayRow =
    !isDesired && requiresPrepayment && prepaymentPercent > 0 && total > 0;
  const showDesiredPrepayNote =
    isDesired && prepaymentPercent > 0 && total > 0;
  const prepayAmount =
    Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) /
    100;
  const remainingAfterPrepay = Math.max(
    0,
    Math.round((total - prepayAmount + Number.EPSILON) * 100) / 100,
  );
  const deductPrepayment =
    (showFixedPrepayRow || showDesiredPrepayNote) && prepayAmount > 0;
  const displayTotal = deductPrepayment ? remainingAfterPrepay : total;
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
          "Please add a contact number in your profile.",
      });
      return false;
    }
    if (isDesired) {
      const incomplete =
        !address.street.trim() ||
        !address.number.trim() ||
        !address.postalCode.trim() ||
        !address.province.trim() ||
        !address.municipality.trim();
      if (incomplete) {
        showSnackbar({
          severity: "error",
          message: "Please complete Contact & Address Details.",
        });
        return false;
      }
      if (
        !isAddressInOperatingArea(
          businessProfile?.desiredLocation,
          address.province,
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
                province: address.province.trim(),
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
    setActiveBookingSession(next);
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
      },
      locationMode,
      setup: bookingSetup,
      createBooking,
    });
    if (!result.ok) {
      showSnackbar({ severity: "error", message: result.message });
      return null;
    }
    setActiveBookingSession(result.record);
    await refreshActiveBooking();
    return result.record;
  }, [
    bookingSetup,
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
      await updateMyBooking({
        id: bookingId,
        prepayment_status: "paid",
        status: "confirmed",
      }).unwrap();

      const paidSession = {
        ...record,
        prepaid: true,
        requiresPrepayment: true,
        prepaymentPercent,
        status: "confirmed" as const,
      };
      setActiveBookingSession(paidSession);
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
        message: "Prepayment received. You can complete your booking.",
      });
    } catch (error) {
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(error, "Unable to record prepayment."),
      });
    }
  }, [
    ensureBookingCreated,
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
      const record = await ensureBookingCreated();
      if (!record) return;
      setStripeDialogOpen(true);
    } finally {
      setIsPaying(false);
    }
  }, [
    ensureBookingCreated,
    isPaying,
    isPrepaymentPaid,
    prepayAmount,
    showSnackbar,
    validateBeforeAction,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
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
        },
        locationMode,
        setup: bookingSetup,
        createBooking,
      });
      if (!result.ok) {
        showSnackbar({ severity: "error", message: result.message });
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
      showSnackbar({
        severity: "error",
        message: getApiErrorMessage(
          error,
          isDesired
            ? "Unable to send booking request. Please try again."
            : "Unable to complete booking. Please try again.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeBooking,
    bookingSetup,
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

  const visitAddressOptions = React.useMemo(
    () =>
      resolveDesiredVisitAddressOptions(
        businessProfile?.desiredLocation,
        address.province,
      ),
    [address.province, businessProfile?.desiredLocation],
  );

  if (!draft || !shop) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  let serviceCursor = bookingStartMinutes;
  const addressFieldLabelSx = {
    fontSize: 12,
    fontWeight: 900,
    color: alpha(m.navy, 0.65),
    mb: 0.75,
  } as const;
  const addressFieldInputSx = {
    "& .MuiOutlinedInput-root": {
      height: 40,
      minHeight: 40,
      alignItems: "center",
    },
  } as const;

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

          <Box sx={{ px: { xs: 2.25, md: 3.5 }, py: 2 }}>
            <Box
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(m.navy, 0.18)}`,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
          <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 1.25 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "30px",
                color: alpha(m.navy, 0.72),
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Service Summary
            </Typography>
          </Box>
          <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
          <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 1.35, pb: 1.5 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 18,
                color: alpha(m.navy, 0.88),
                lineHeight: 1.2,
              }}
            >
              {shop.shopName}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ mt: 0.85 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.6}
                sx={{ minWidth: 0, flexShrink: 0 }}
              >
                <AccessTimeRoundedIcon
                  sx={{ fontSize: 16, color: m.teal, flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: alpha(m.teal, 0.95),
                    fontSize: 12.5,
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    lineHeight: 1.2,
                  }}
                >
                  {dateLabel} ({fmtMinutesToTimeLabel(bookingStartMinutes)}-
                  {fmtMinutesToTimeLabel(bookingEndMinutes)})
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: "auto",
                  maxWidth: { xs: "46%", sm: "50%" },
                  flex: "0 1 auto",
                  minWidth: 0,
                }}
              >
                <LocationOnOutlinedIcon
                  sx={{
                    fontSize: 16,
                    width: 16,
                    height: 16,
                    color: alpha(m.navy, 0.45),
                    flexShrink: 0,
                    display: "block",
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    color: alpha(m.navy, 0.55),
                    fontSize: 12,
                    lineHeight: 1.2,
                    minWidth: 0,
                  }}
                >
                  {addressLabel}
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={isDesired ? "Desired Location" : "Fixed Location"}
              size="small"
              sx={{ ...locationModeChipSx, mt: 0.75 }}
            />
          </Box>

          <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />

          <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75 }}>
            <Stack spacing={1.5} divider={<Divider sx={{ borderColor: alpha(m.navy, 0.08) }} />}>
              {summarySections.map((section) => {
                const roleLabel = roleLabelForSection(section);
                return (
                  <Box key={section.key}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      sx={{ mb: 0.75 }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 13,
                          color: alpha(m.navy, 0.78),
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {section.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 10.5,
                          color: "primary.light",
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {roleLabel}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.85}>
                      {section.planningItem ? (
                        <Box
                          sx={{
                            borderRadius: "10px",
                            border: `1px solid ${alpha(m.navy, 0.06)}`,
                            px: 1.25,
                            py: 1,
                            bgcolor: alpha(m.navy, 0.015),
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              {section.planningItem.activity ? (
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    fontWeight: 900,
                                    color: alpha(m.navy, 0.82),
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {section.planningItem.activity}
                                </Typography>
                              ) : null}
                              {section.planningItem.duration ? (
                                <Typography
                                  sx={{
                                    mt: section.planningItem.activity ? 0.3 : 0,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.48),
                                  }}
                                >
                                  {section.planningItem.duration}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        </Box>
                      ) : null}
                      {section.items.map((item) => {
                        const start = serviceCursor;
                        serviceCursor += item.durationMins;
                        const tmName =
                          resolveTeamMemberFirstName(
                            item.teamMemberId,
                            draft.teamMembers,
                          ) || section.teamMemberLabel;
                        return (
                          <Box
                            key={item.id}
                            sx={{
                              borderRadius: "10px",
                              border: `1px solid ${alpha(m.navy, 0.06)}`,
                              px: 1.25,
                              py: 1,
                              bgcolor: alpha(m.navy, 0.015),
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="flex-start"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    fontWeight: 900,
                                    color: alpha(m.navy, 0.82),
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {item.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: 0.3,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: alpha(m.navy, 0.48),
                                  }}
                                >
                                  {serviceTimeRangeLabel(start, item.durationMins)}{" "}
                                  • {item.durationMins} Mins
                                </Typography>
                                {tmName ? (
                                  <Box
                                    sx={{
                                      mt: 0.55,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 0.5,
                                      height: 24,
                                      px: 0.9,
                                      borderRadius: "8px",
                                      border: `1px solid ${alpha(m.navy, 0.12)}`,
                                      bgcolor: "#fff",
                                      lineHeight: 0,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 13,
                                        height: 13,
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                        lineHeight: 0,
                                      }}
                                    >
                                      <PersonOutlineRoundedIcon
                                        sx={{
                                          fontSize: 13,
                                          color: alpha(m.navy, 0.4),
                                          display: "block",
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: alpha(m.navy, 0.55),
                                        lineHeight: 1,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      {tmName}
                                    </Typography>
                                  </Box>
                                ) : null}
                              </Box>
                              <BookingLineAmount
                                amount={item.price}
                                originalAmount={item.originalPrice}
                                discountLabel={clientLineDiscountLabel(item)}
                              />
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
            {draft?.clientNote?.trim() ? (
              <Box sx={{ mt: 1.5 }}>
                <BookingSummaryNote note={draft.clientNote} />
              </Box>
            ) : null}
          </Box>

            </Box>
          </Box>

          {draft.projectDetails ? (
            <Box sx={{ px: { xs: 2.25, md: 3.5 }, pb: 2 }}>
              <ClientBookingProjectDetailsCard project={draft.projectDetails} />
            </Box>
          ) : null}

          <Box sx={{ px: { xs: 2.25, md: 3.5 }, pt: 0.25, pb: 2.25 }}>
          <Box
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.22)}`,
              bgcolor: "#fff",
              px: { xs: 1.5, md: 2 },
              py: 1.75,
            }}
          >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 14,
              color: alpha(m.navy, 0.78),
              mb: 1.5,
            }}
          >
            {isDesired ? "Contact & Address Details" : "Contact"}
          </Typography>

          <Stack spacing={1.35} sx={{ width: "100%" }}>
            <AppCountryPhoneFields
              countryCode={countryCode}
              phone={phone}
              onCountryCodeChange={setCountryCode}
              onPhoneChange={setPhone}
              label="Contact Number"
              phonePlaceholder={
                hasProfilePhone ? "Phone number" : "Enter your phone number"
              }
              required
              disabled={hasProfilePhone}
              validateOnBlur={!hasProfilePhone}
              countryCodeWidth={140}
            />

            {isDesired ? (
              <Box
                sx={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  columnGap: 1.25,
                  rowGap: 1.35,
                }}
              >
                <Box>
                  <Typography sx={addressFieldLabelSx}>Province</Typography>
                  <AppDropdown
                    value={address.province}
                    onChange={(val) =>
                      setAddress((prev) => ({
                        ...prev,
                        province: String(val ?? ""),
                        municipality: "",
                      }))
                    }
                    options={visitAddressOptions.provinceOptions.map((p) => ({
                      value: p,
                      label: p,
                    }))}
                    placeholder="Province"
                    fullWidth
                    size="small"
                    sx={addressFieldInputSx}
                  />
                </Box>
                <Box>
                  <Typography sx={addressFieldLabelSx}>Municipality</Typography>
                  <AppDropdown
                    value={address.municipality}
                    onChange={(val) =>
                      setAddress((prev) => ({
                        ...prev,
                        municipality: String(val ?? ""),
                      }))
                    }
                    options={[
                      ...(address.municipality &&
                      !visitAddressOptions.municipalityOptions.includes(
                        address.municipality,
                      )
                        ? [
                            {
                              value: address.municipality,
                              label: address.municipality,
                            },
                          ]
                        : []),
                      ...visitAddressOptions.municipalityOptions.map((muni) => ({
                        value: muni,
                        label: muni,
                      })),
                    ]}
                    placeholder="Municipality"
                    fullWidth
                    size="small"
                    disabled={!address.province}
                    sx={addressFieldInputSx}
                  />
                </Box>
                <Box>
                  <Typography sx={addressFieldLabelSx}>Street Address</Typography>
                  <AppTextField
                    value={address.street}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    placeholder="Churchill-laan"
                    fullWidth
                    size="small"
                    sx={addressFieldInputSx}
                  />
                </Box>
                <Box>
                  <Typography sx={addressFieldLabelSx}>Street Number</Typography>
                  <AppTextField
                    value={address.number}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        number: e.target.value,
                      }))
                    }
                    placeholder="34234"
                    fullWidth
                    size="small"
                    sx={addressFieldInputSx}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <Typography sx={addressFieldLabelSx}>Postal Code</Typography>
                  <AppTextField
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    placeholder="1234 AB"
                    fullWidth
                    size="small"
                    sx={addressFieldInputSx}
                  />
                </Box>
              </Box>
            ) : null}
          </Stack>
          </Box>

          <Box sx={{ px: 0, pt: 1.75 }}>
            <Box
              sx={{
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.035),
                border: `1px solid ${alpha(m.navy, 0.22)}`,
                px: { xs: 1.5, md: 2 },
                py: 1.35,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
              >
                <Typography
                  sx={{ fontWeight: 600, fontSize: 13, color: alpha(m.navy, 0.48) }}
                >
                  Total Price
                </Typography>
                <Stack alignItems="flex-end" spacing={0.2}>
                  {actualAmount > displayTotal ? (
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: alpha(m.navy, 0.38),
                        textDecoration: "line-through",
                        lineHeight: 1.15,
                      }}
                    >
                      €{formatBookingEur(actualAmount)}
                    </Typography>
                  ) : null}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: alpha(m.navy, 0.55),
                      flexShrink: 0,
                    }}
                  >
                    €{formatBookingEur(displayTotal)}
                  </Typography>
                  {deductPrepayment ? (
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        color: m.teal,
                        lineHeight: 1.15,
                      }}
                    >
                      −€{formatBookingEur(prepayAmount)} Prepaid
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              {showFixedPrepayRow ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ mt: 0.85 }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: alpha(m.navy, 0.42),
                      minWidth: 0,
                    }}
                  >
                    {isPrepaymentPaid
                      ? `Prepaid (${prepaymentPercent}%)`
                      : `Prepayment Required (${prepaymentPercent}%)`}
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{ flexShrink: 0 }}
                  >
                    {!isPrepaymentPaid ? (
                      <Typography
                        component="button"
                        type="button"
                        onClick={() => void handlePayNow()}
                        disabled={isPaying}
                        sx={{
                          border: 0,
                          bgcolor: "transparent",
                          p: 0,
                          cursor: isPaying ? "wait" : "pointer",
                          color: m.teal,
                          fontWeight: 900,
                          fontSize: 12.5,
                          fontFamily: "inherit",
                          opacity: isPaying ? 0.7 : 1,
                          "&:hover": { color: m.tealDark },
                        }}
                      >
                        {isPaying ? "Preparing…" : "Pay Now"}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 12,
                          color: m.teal,
                        }}
                      >
                        Paid
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: alpha(m.navy, 0.48),
                        textAlign: "right",
                      }}
                    >
                      €{prepayAmount}
                    </Typography>
                  </Stack>
                </Stack>
              ) : null}

              {showDesiredPrepayNote ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ mt: 0.75 }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 11.5,
                      color: alpha(m.navy, 0.42),
                      minWidth: 0,
                    }}
                  >
                    Prepayment Required ({prepaymentPercent}%) After Acceptance
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: alpha(m.navy, 0.48),
                      flexShrink: 0,
                    }}
                  >
                    €{prepayAmount}
                  </Typography>
                </Stack>
              ) : null}
            </Box>
          </Box>

          <AppButton
            tone="primary"
            fullWidth
            disabled={isSubmitting || mustPayBeforeBooking}
            onClick={() => void onSubmit()}
            sx={{ mt: 2.25, height: 44 }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                {isDesired ? "Sending…" : "Booking…"}
              </>
            ) : isDesired ? (
              "Send Booking Request"
            ) : (
              "Book Now"
            )}
          </AppButton>

          {mustPayBeforeBooking ? (
            <Typography
              sx={{
                mt: 1,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                color: alpha(m.navy, 0.5),
              }}
            >
              Complete prepayment with Pay Now to enable booking.
            </Typography>
          ) : null}
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
    </Box>
  );
}
