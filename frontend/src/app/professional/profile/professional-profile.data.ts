"use client";

export const professionalProfilePageData = {
  header: {
    localeLabel: "EN",
    userName: "Sara Johnson",
  },
  topTabs: [
    { id: "profile", label: "Profile", href: "/professional/profile" },
    { id: "calendar", label: "Calendar", href: "/professional/calendar" },
    { id: "client", label: "Client", href: "/professional/client" },
    { id: "finance", label: "Finance", href: "/professional/finance" },
    { id: "analytics", label: "Analytics", href: "/professional/analytics" },
  ],
  segmentTabs: [
    { id: "userInfo", label: "User Info" },
    { id: "businessSetup", label: "Business Setup" },
  ],
  card: {
    title: "Professional",
    profilePictureLabel: "Profile Picture",
  },
  sections: {
    company: "Company Information",
    address: "Business Address",
    contact: "Contact Person",
  },
  actions: {
    update: "Update",
  },
  fields: {
    legalName: { label: "Legal Name*", placeholder: "e.g. Jane" },
    cocNumber: { label: "COC number*", placeholder: "e.g. 85537" },
    vatNumber: { label: "VAT number*", placeholder: "e.g. 8763452345678" },
    street: { label: "Street", placeholder: "" },
    number: { label: "Number", placeholder: "" },
    postalCode: { label: "Postal Code", placeholder: "" },
    province: { label: "Province", placeholder: "Select" },
    municipality: { label: "Municipality", placeholder: "Select" },
    businessType: { label: "Select Business Type", placeholder: "Select" },
    website: { label: "Portfolio links", placeholder: "Website" },
    instagram: { label: "", placeholder: "Instagram" },
    otherLink: { label: "", placeholder: "Other" },
    firstName: { label: "First Name*", placeholder: "e.g. Jane" },
    lastName: { label: "Last Name*", placeholder: "e.g. Doe" },
    email: { label: "Email*", placeholder: "You@gmail.com" },
    password: { label: "Password*", placeholder: "Enter Password" },
    repeatPassword: { label: "Repeat password*", placeholder: "Confirm Password" },
  },
  options: {
    provinces: ["Province", "North Holland", "South Holland", "Utrecht", "Gelderland"],
    municipalities: ["Municipality", "Amsterdam", "Rotterdam", "Utrecht", "The Hague"],
    businessTypes: ["Business Type", "Salon Owner", "Independent", "Clinic", "Other"],
  },
} as const;

