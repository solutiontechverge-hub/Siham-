/**
 * Client list domain types and mock seed data for the fixed-location client page.
 * Replace mock exports with API responses when the backend is wired up.
 */

export type ClientKind = "individual" | "company";

export type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSales: string;
  lastBooking: string;
  tags: Array<"Mollure" | "CC">;
  photoSrc?: string;
  kind: ClientKind;
  addedOn: string;
  detailEmail?: string;
  legalName?: string;
  coc?: string;
  vat?: string;
  contactPersonName?: string;
  gender?: string;
  businessAddress?: string;
  dateOfBirth?: string;
  residentialAddress?: string;
  bookingsCompleted: number;
  averageBookingValue: string;
  recentServices: { name: string; price: string }[];
  bookingHistory: { period: string; bookings: number }[];
  /** Label for the Platform Statistics “Last booking” card */
  statsLastBooking?: string;
};

export const mockClientRecords: ClientRecord[] = [
  {
    id: "c1",
    name: "Sara Johnson",
    email: "sarajohnson@gmail.com",
    phone: "123456849",
    totalSales: "€25,450",
    lastBooking: "15/12/2022",
    tags: ["CC"],
    kind: "company",
    addedOn: "July 20, 2023",
    detailEmail: "sanajohnson@gmail.com",
    legalName: "Beauty & Wellness corp",
    coc: "134543",
    vat: "134504",
    contactPersonName: "sana",
    gender: "Female",
    businessAddress: "123 business street,",
    bookingsCompleted: 18,
    averageBookingValue: "€50",
    statsLastBooking: "Dec 15 2022",
    recentServices: [
      { name: "Hair Styling", price: "€85" },
      { name: "Manicure", price: "€45" },
      { name: "Facial Treatment", price: "€45" },
    ],
    bookingHistory: [
      { period: "December 2024", bookings: 3 },
      { period: "January 2025", bookings: 5 },
    ],
  },
  {
    id: "c2",
    name: "Alex Martin",
    email: "alexmartin@gmail.com",
    phone: "+44 20 7946 0958",
    totalSales: "€3,400",
    lastBooking: "13/05/2025",
    tags: ["Mollure"],
    kind: "individual",
    addedOn: "March 2, 2024",
    gender: "Male",
    dateOfBirth: "04/12/1990",
    residentialAddress: "45 Canal St, Amsterdam",
    bookingsCompleted: 9,
    averageBookingValue: "€78",
    recentServices: [
      { name: "Beard trim", price: "€35" },
      { name: "Haircut", price: "€55" },
    ],
    bookingHistory: [
      { period: "April 2025", bookings: 2 },
      { period: "May 2025", bookings: 4 },
    ],
  },
  {
    id: "c3",
    name: "Emma van Dijk",
    email: "emma.vd@gmail.com",
    phone: "+971 50 123 4567",
    totalSales: "€2,150",
    lastBooking: "05/06/2025",
    tags: [],
    kind: "individual",
    addedOn: "January 9, 2025",
    gender: "Female",
    dateOfBirth: "22/08/1995",
    residentialAddress: "12 Keizersgracht, Utrecht",
    bookingsCompleted: 6,
    averageBookingValue: "€62",
    recentServices: [{ name: "Color treatment", price: "€120" }],
    bookingHistory: [{ period: "June 2025", bookings: 2 }],
  },
  {
    id: "c4",
    name: "Northwind BV",
    email: "billing@northwind.nl",
    phone: "+92 333 1122334",
    totalSales: "€950",
    lastBooking: "21/06/2025",
    tags: ["CC"],
    kind: "company",
    addedOn: "November 5, 2024",
    detailEmail: "ops@northwind.nl",
    legalName: "Northwind Trading BV",
    coc: "882211",
    vat: "NL009988776",
    contactPersonName: "Imran Khan",
    gender: "Male",
    businessAddress: "88 Harbor Rd, Rotterdam",
    bookingsCompleted: 4,
    averageBookingValue: "€88",
    recentServices: [
      { name: "Team workshop", price: "€400" },
      { name: "Chair massage", price: "€60" },
    ],
    bookingHistory: [{ period: "June 2025", bookings: 1 }],
  },
  {
    id: "c5",
    name: "Priya Sharma",
    email: "priya.s@gmail.com",
    phone: "+91 98765 43210",
    totalSales: "€5,600",
    lastBooking: "15/07/2025",
    tags: ["CC"],
    kind: "individual",
    addedOn: "February 14, 2023",
    gender: "Female",
    dateOfBirth: "01/01/1988",
    residentialAddress: "9 MG Road, Bengaluru",
    bookingsCompleted: 22,
    averageBookingValue: "€95",
    recentServices: [
      { name: "Bridal package", price: "€320" },
      { name: "Spa day", price: "€180" },
    ],
    bookingHistory: [
      { period: "June 2025", bookings: 6 },
      { period: "July 2025", bookings: 4 },
    ],
  },
  {
    id: "c6",
    name: "Liam O'Brien",
    email: "liam.ob@gmail.com",
    phone: "+61 412 345 678",
    totalSales: "€4,800",
    lastBooking: "08/08/2025",
    tags: ["Mollure"],
    kind: "individual",
    addedOn: "August 1, 2024",
    gender: "Male",
    dateOfBirth: "17/03/1992",
    residentialAddress: "3 Bondi Ave, Sydney",
    bookingsCompleted: 14,
    averageBookingValue: "€54",
    recentServices: [{ name: "Sports massage", price: "€70" }],
    bookingHistory: [{ period: "August 2025", bookings: 3 }],
  },
  {
    id: "c7",
    name: "Yuki Tanaka",
    email: "yuki.t@gmail.com",
    phone: "+81 80 1234 5678",
    totalSales: "€1,750",
    lastBooking: "12/09/2025",
    tags: ["Mollure"],
    kind: "individual",
    addedOn: "May 20, 2025",
    gender: "Female",
    dateOfBirth: "30/11/2000",
    residentialAddress: "2-8 Shibuya, Tokyo",
    bookingsCompleted: 5,
    averageBookingValue: "€110",
    recentServices: [
      { name: "Keratin", price: "€140" },
      { name: "Nails", price: "€55" },
    ],
    bookingHistory: [{ period: "September 2025", bookings: 2 }],
  },
  {
    id: "c8",
    name: "Hanse Salon GmbH",
    email: "info@hanse-salon.de",
    phone: "+49 1512 3456789",
    totalSales: "€7,200",
    lastBooking: "22/10/2025",
    tags: ["Mollure", "CC"],
    kind: "company",
    addedOn: "October 10, 2022",
    detailEmail: "manager@hanse-salon.de",
    legalName: "Hanse Salon GmbH",
    coc: "DE445566",
    vat: "DE998877665",
    contactPersonName: "Klaus Weber",
    gender: "Male",
    businessAddress: "101 Friedrichstr., Berlin",
    bookingsCompleted: 31,
    averageBookingValue: "€72",
    recentServices: [
      { name: "Corporate day", price: "€900" },
      { name: "Cut & style", price: "€48" },
    ],
    bookingHistory: [
      { period: "September 2025", bookings: 8 },
      { period: "October 2025", bookings: 7 },
    ],
  },
];

export type MollureDirectoryRow = {
  id: string;
  name: string;
  email: string;
  tags?: Array<"Mollure">;
};

export const mockMollureDirectory: MollureDirectoryRow[] = [
  { id: "m1", name: "Sara Johnson", email: "sarajohnson@gmail.com", tags: ["Mollure"] },
  { id: "m2", name: "Alex Martin", email: "alexmartin@gmail.com", tags: ["Mollure"] },
  { id: "m3", name: "Emma Stone", email: "emmastone@gmail.com", tags: ["Mollure"] },
];
