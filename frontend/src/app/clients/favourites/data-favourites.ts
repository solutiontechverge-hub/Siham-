import { listingPageData } from "../listing/listing.data";

export const favouritesPageData = {
  header: listingPageData.header,
  tabs: [
    { id: "profile" as const, label: "Profile", href: "/client/profile" },
    { id: "booking" as const, label: "Booking", href: "/client/booking" },
    { id: "favourites" as const, label: "Favourites", href: "/client/favourites" },
  ],
  emptyState: {
    title: "No favourites yet",
    subtitle: "Heart a professional on the listing page to see it here.",
    ctaLabel: "Browse professionals",
    ctaHref: "/client",
  },
  pagination: {
    pageSize: 6,
  },
} as const;

