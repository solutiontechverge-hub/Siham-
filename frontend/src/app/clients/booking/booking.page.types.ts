import type {
  ClientBookingDraftPerson,
  ClientBookingDraftService,
  ClientBookingSelectedShop,
} from "../../../components/common/client-booking/types";

export type BookingPerson = ClientBookingDraftPerson & {
  isRequester: boolean;
};

export type ShopTeamMember = {
  id: string;
  name: string;
  locationModes: Array<"fixed" | "desired">;
};

export type TeamMemberSlotOption = {
  value: string;
  label: string;
  disabled?: boolean;
  tooltip?: string;
};

export type CatalogService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  originalPrice?: number;
  discountPct?: number;
};

export type Service = ClientBookingDraftService & {
  catalogServiceId?: string | null;
  guestId: string | null;
  teamMemberId: string | null;
  originalPrice?: number;
  discountPct?: number;
};

export type ShopState = ClientBookingSelectedShop;
export type EbrFocus = "datetime" | "location" | "services" | "project" | null;
