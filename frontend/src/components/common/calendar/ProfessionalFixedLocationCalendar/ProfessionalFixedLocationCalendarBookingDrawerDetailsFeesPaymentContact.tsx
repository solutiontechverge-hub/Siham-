"use client";

import {
  mollureBodyMutedSx,
} from "../../../../theme/mollureHierarchy";

import {
  BodyText,
} from "../../../ui/typography";

import AppTextField from "../../AppTextField";

import BookingEditedTag from "../BookingEditedTag";

import AppCountryPhoneFields from "../../AppCountryPhoneFields";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContactBag = Pick<
  Vm,
  | "addClientSource"
  | "bookingPhoneDraft"
  | "isDrawerPrepaymentPaid"
  | "isViewingExisting"
  | "m"
  | "paymentMethod"
  | "selectedClient"
  | "setBookingPhoneDraft"
  | "setSelectedClient"
  | "silentFieldUpdates"
  | "slotErrors"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContactBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact({ bag }: Props) {
  const {
    addClientSource,
    bookingPhoneDraft,
    isDrawerPrepaymentPaid,
    isViewingExisting,
    m,
    paymentMethod,
    selectedClient,
    setBookingPhoneDraft,
    setSelectedClient,
    silentFieldUpdates,
    slotErrors,
  } = bag;

  return (
    <>
            <AppCountryPhoneFields
              countryCode={bookingPhoneDraft.phoneCode}
              phone={bookingPhoneDraft.phoneNumber}
              onCountryCodeChange={(dialCode) =>
                setBookingPhoneDraft((p) => ({
                  ...p,
                  phoneCode: dialCode,
                }))
              }
              onPhoneChange={(phone) =>
                setBookingPhoneDraft((p) => ({
                  ...p,
                  phoneNumber: phone,
                }))
              }
              countryCodeError={slotErrors.bookingPhoneCode}
              phoneError={slotErrors.bookingPhoneNumber}
              label={
                addClientSource === "guest"
                  ? "Contact Number"
                  : "Contact Number (optional)"
              }
              labelAdornment={
                silentFieldUpdates.phoneUpdated ? (
                  <BookingEditedTag variant="updated" />
                ) : null
              }
              phonePlaceholder="+316xxxxxxxx"
              required={addClientSource === "guest"}
              disabled={isViewingExisting}
            />

            {paymentMethod === "online" &&
            !isDrawerPrepaymentPaid &&
            !isViewingExisting ? (
              <AppTextField
                label="Email"
                placeholder="Email for online payment"
                value={selectedClient?.email ?? ""}
                onChange={(e) =>
                  setSelectedClient((prev) =>
                    prev
                      ? { ...prev, email: e.target.value }
                      : prev,
                  )
                }
                fullWidth
                error={Boolean(slotErrors.bookingClientEmail)}
                helperText={
                  slotErrors.bookingClientEmail ||
                  (selectedClient?.email?.trim()
                    ? undefined
                    : "Required for online payment")
                }
              />
            ) : paymentMethod === "online" &&
              selectedClient?.email?.trim() ? (
              <BodyText
                sx={mollureBodyMutedSx(m.navy)}
              >
                Email: {selectedClient.email.trim()}
              </BodyText>
            ) : null}
    </>
  );
}
