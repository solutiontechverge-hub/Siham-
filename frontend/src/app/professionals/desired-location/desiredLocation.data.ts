export type DesiredLocationServiceFor = {
  id: "men" | "women" | "kids";
  label: string;
};

export type DesiredLocationAmenity = {
  id: string;
  label: string;
};

export type DesiredLocationService = {
  id: string;
  name: string;
  durationLabel: string;
  priceLabel: string;
};

export type DesiredLocationServiceCategory = {
  id: "all" | "hair" | "makeup" | "wimpers" | "wenbrauwen";
  label: string;
  iconKey: "all" | "hair" | "makeup" | "wimpers" | "wenbrauwen";
};

export type DesiredLocationServiceDetailItem = DesiredLocationService & {
  categoryId: Exclude<DesiredLocationServiceCategory["id"], "all">;
};

export type DesiredLocationTeamMember = {
  id: string;
  name: string;
  role: string;
};

export type DesiredLocationPageData = {
  topTabs: readonly string[];
  topTabsActive: string;
  subTabs: readonly string[];
  subTabsActive: string;
  title: string;
  offeringLabel: string;
  offeringPlaceholder: string;
  publishLabel: string;
  fixedLocationChip: string;
  profile: {
    title: string;
    saveLabel: string;
    nameLabel: string;
    aboutLabel: string;
    keywordsLabel: string;
    keywordPlaceholder: string;
    uploadMediaLabel: string;
  };
  location: {
    title: string;
    saveLabel: string;
    address1: string;
    address2: string;
    city: string;
    postal: string;
  };
  serviceFor: {
    title: string;
    items: readonly DesiredLocationServiceFor[];
  };
  amenities: {
    title: string;
    items: readonly DesiredLocationAmenity[];
  };
  services: {
    title: string;
    addLabel: string;
    items: readonly DesiredLocationService[];
  };
  servicesDetails: {
    title: string;
    categories: readonly DesiredLocationServiceCategory[];
    items: readonly DesiredLocationServiceDetailItem[];
  };
  discount: {
    title: string;
    enabledLabel: string;
    valueLabel: string;
    placeholder: string;
  };
  deposit: {
    title: string;
    enabledLabel: string;
    valueLabel: string;
    placeholder: string;
  };
  userInfo: {
    title: string;
    saveLabel: string;
    languageLabel: string;
    currencyLabel: string;
    timezoneLabel: string;
  };
  manageTeam: {
    title: string;
    addMemberLabel: string;
    members: readonly DesiredLocationTeamMember[];
  };
  generalNotes: {
    title: string;
    notesLabel: string;
    placeholder: string;
  };
  price: {
    title: string;
    priceFromLabel: string;
    placeholder: string;
    includeTaxLabel: string;
  };
  portfolio: {
    title: string;
    uploadLabel: string;
  };
};

export const desiredLocationPageData = {
  topTabs: ["Profile", "Calendar", "Client", "Finance", "Analytics"],
  topTabsActive: "Profile",
  subTabs: ["User Info", "Business Setup"],
  subTabsActive: "User Info",
  title: "Business Setup",
  offeringLabel: "We are offering our services",
  offeringPlaceholder: "Fixed Location only",
  publishLabel: "Publish",
  fixedLocationChip: "Fixed Location",
  profile: {
    title: "Profile",
    saveLabel: "Save",
    nameLabel: "Name",
    aboutLabel: "About",
    keywordsLabel: "Add keywords(You can add up to 3 keywords)",
    keywordPlaceholder: "e.g Hair Specialist",
    uploadMediaLabel: "Upload Media",
  },
  location: {
    title: "Fixed Location",
    saveLabel: "Save",
    address1: "Address line 1",
    address2: "Address line 2",
    city: "City",
    postal: "Postal code",
  },
  serviceFor: {
    title: "Service For",
    items: [
      { id: "men", label: "Men" },
      { id: "women", label: "Women" },
      { id: "kids", label: "Kids" },
    ],
  },
  amenities: {
    title: "Amenities",
    items: [
      { id: "parking", label: "Parking" },
      { id: "wifi", label: "Wifi" },
      { id: "wheelchair", label: "Wheelchair access" },
      { id: "pets", label: "Pets allowed" },
    ],
  },
  services: {
    title: "Services",
    addLabel: "+ Add",
    items: [
      { id: "service-1", name: "Hair Cut", durationLabel: "45 m", priceLabel: "€ 45" },
      { id: "service-2", name: "Beard", durationLabel: "30 m", priceLabel: "€ 25" },
      { id: "service-3", name: "Makeup", durationLabel: "60 m", priceLabel: "€ 80" },
    ],
  },
  servicesDetails: {
    title: "Services Details",
    categories: [
      { id: "all", label: "All", iconKey: "all" },
      { id: "hair", label: "Hair", iconKey: "hair" },
      { id: "makeup", label: "Make-Up", iconKey: "makeup" },
      { id: "wimpers", label: "Wimpers", iconKey: "wimpers" },
      { id: "wenbrauwen", label: "Wenkbrauwen", iconKey: "wenbrauwen" },
    ],
    items: [
      { id: "hair-1", categoryId: "hair", name: "Buzz Cut", durationLabel: "45 Min", priceLabel: "25 €" },
      { id: "hair-2", categoryId: "hair", name: "Buzz Cut", durationLabel: "45 Min", priceLabel: "25 €" },
      { id: "hair-3", categoryId: "hair", name: "Buzz Cut", durationLabel: "45 Min", priceLabel: "25 €" },
      { id: "makeup-1", categoryId: "makeup", name: "Make-up Basic", durationLabel: "60 Min", priceLabel: "80 €" },
      { id: "wimpers-1", categoryId: "wimpers", name: "Lash Lift", durationLabel: "50 Min", priceLabel: "55 €" },
      { id: "wen-1", categoryId: "wenbrauwen", name: "Brow Shape", durationLabel: "25 Min", priceLabel: "20 €" },
    ],
  },
  discount: {
    title: "Discount",
    enabledLabel: "Enable discount",
    valueLabel: "Discount value",
    placeholder: "e.g 10%",
  },
  deposit: {
    title: "Deposit",
    enabledLabel: "Enable deposit",
    valueLabel: "Deposit value",
    placeholder: "e.g 20%",
  },
  userInfo: {
    title: "User Info",
    saveLabel: "Save",
    languageLabel: "Language",
    currencyLabel: "Currency",
    timezoneLabel: "Timezone",
  },
  manageTeam: {
    title: "Manage Team",
    addMemberLabel: "+ Add member",
    members: [
      { id: "m-1", name: "Janna Vith", role: "Stylist" },
      { id: "m-2", name: "Craig Martha", role: "Owner" },
    ],
  },
  generalNotes: {
    title: "General notes",
    notesLabel: "Notes",
    placeholder: "Add note...",
  },
  price: {
    title: "Price",
    priceFromLabel: "Price from",
    placeholder: "Enter price",
    includeTaxLabel: "Price includes tax",
  },
  portfolio: {
    title: "Portfolio",
    uploadLabel: "Upload",
  },
} satisfies DesiredLocationPageData;

