export type BookingCatalogService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
};

export type BookingServiceCategory = {
  category: string;
  services: readonly BookingCatalogService[];
};

export const bookingServiceCatalog: readonly BookingServiceCategory[] = [
  {
    category: "Hair",
    services: [
      { id: "svc-buzz-cut", name: "Buzz Cut", durationMins: 45, price: 25 },
      { id: "svc-scissor-cut", name: "Scissor Cut", durationMins: 60, price: 35 },
      { id: "svc-hair-wash-style", name: "Hair Wash Style", durationMins: 30, price: 20 },
      { id: "svc-hair-wash-style-2", name: "Hair Wash Style", durationMins: 30, price: 20 },
    ],
  },
  {
    category: "Makeup",
    services: [
      { id: "svc-makeup", name: "Makeup", durationMins: 45, price: 25 },
      { id: "svc-makeup-buzz-1", name: "Buzz Cut", durationMins: 45, price: 25 },
      { id: "svc-makeup-buzz-2", name: "Buzz Cut", durationMins: 45, price: 25 },
      { id: "svc-makeup-buzz-3", name: "Buzz Cut", durationMins: 45, price: 25 },
    ],
  },
] as const;

export const allBookingCatalogServices = bookingServiceCatalog.flatMap((group) => group.services);

export function formatBookingServiceMeta(service: BookingCatalogService) {
  return `${service.durationMins} Mins • €${service.price}`;
}
