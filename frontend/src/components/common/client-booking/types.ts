export type ClientBookingDraftService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  guestId?: string | null;
  teamMemberId?: string | null;
  assignedTo?: string | null;
  /** Services purchased after checkout appear under Add Ons in payment summary. */
  isAddOn?: boolean;
};

export type ClientBookingDraftPerson = {
  id: string;
  name: string;
  isRequester?: boolean;
  participantType?: "model" | "planning" | "guest";
  planningActivity?: string;
  planningDuration?: string;
  planningIsLocked?: boolean;
};

export type ClientBookingDraftTeamMember = {
  id: string;
  name: string;
};

export type ClientBookingDraftProjectDetails = {
  description: string;
  uploads: Array<{ id: string; name: string; previewUrl?: string }>;
};

export type ClientBookingDraft = {
  selectedDateISO: string;
  selectedTime: string;
  combineServices: boolean;
  people?: ClientBookingDraftPerson[];
  services: ClientBookingDraftService[];
  teamMembers?: ClientBookingDraftTeamMember[];
  total: number;
  projectDetails?: ClientBookingDraftProjectDetails;
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
  participantType?: "model" | "planning" | "guest" | "requester";
};
