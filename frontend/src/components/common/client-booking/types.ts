export type ClientBookingDraftService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  startTime?: string;
  endTime?: string;
  guestId?: string | null;
  teamMemberId?: string | null;
  teamMemberName?: string | null;
  assignedTo?: string | null;
  /** Services purchased after checkout appear under Add Ons in payment summary. */
  isAddOn?: boolean;
  originalPrice?: number;
  discountPct?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
};

export type ClientBookingDraftProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice?: number;
  originalPrice?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
};

export type ClientBookingDraftPerson = {
  id: string;
  name: string;
  isRequester?: boolean;
  participantType?: "model" | "planning" | "guest" | "buffer" | "notes";
  planningActivity?: string;
  planningDuration?: string;
  planningIsLocked?: boolean;
  planningStartTime?: string;
  planningEndTime?: string;
  bufferStartTime?: string;
  bufferEndTime?: string;
};

export type ClientBookingDraftTeamMember = {
  id: string;
  name: string;
};

export type ClientBookingDraftProjectDetails = {
  description: string;
  uploads: Array<{
    id: string;
    name: string;
    url?: string;
    mimeType?: string;
    kind?: "image" | "document";
    previewUrl?: string;
  }>;
};

export type ClientBookingDesiredLocation = {
  street: string;
  number: string;
  postalCode: string;
  province: string;
  municipality: string;
};

export type ClientBookingDraft = {
  selectedDateISO: string;
  selectedTime: string;
  combineServices: boolean;
  people?: ClientBookingDraftPerson[];
  services: ClientBookingDraftService[];
  products?: ClientBookingDraftProduct[];
  teamMembers?: ClientBookingDraftTeamMember[];
  total: number;
  projectDetails?: ClientBookingDraftProjectDetails;
  /** Client visit address for Desired Location bookings. */
  desiredLocation?: ClientBookingDesiredLocation;
  /** IC booking note sent to the professional calendar. */
  clientNote?: string;
};

export type ClientBookingSelectedShop = {
  shopId: string;
  shopName: string;
  municipalityLabel?: string;
  addressLabel?: string;
  locationMode?: "fixed" | "desired";
};

export type ClientBookingSummarySection = {
  key: string;
  title: string;
  items: ClientBookingDraftService[];
  planningItem?: { activity: string; duration: string };
  teamMemberLabel?: string;
  isRequester?: boolean;
  participantType?: "model" | "planning" | "guest" | "requester" | "buffer";
  startTime?: string;
  endTime?: string;
};
