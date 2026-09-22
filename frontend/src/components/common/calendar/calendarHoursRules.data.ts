export const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const CALENDAR_HOURS_RULES_COPY = {
  settingsTitle: "Settings",
  publicHours: "Public Hours",
  bookingRules: "Booking Rules",
  serviceOrderRules: "Service Order Rules",
  calendarAppearance: "Calendar Appearance",
  fixedLocation: "Fixed Location",
  desiredLocation: "Desired Location",
  intervalBetweenBookings: "Interval Between Bookings",
  minimumTimeslot: "Minimum Timeslot",
  flIntervalHelper:
    "Default 0 (back-to-back). Increase if you need a gap between bookings.",
  dlIntervalHelper: "Minimum 5 minutes (travel buffer). You can increase it.",
  dlMinTimeslotHelper:
    "Optional. Leave empty, or set a minimum team-member time at DL.",
  categories: "Categories",
  services: "Services",
  categoriesEditingHint:
    "Check to show, uncheck to hide. Drag left or right to change placement (1 appears first).",
  categoriesViewHint: "Edit to show/hide categories and rearrange their order.",
  servicesEditingHint:
    "Check to show, uncheck to hide. Drag up or down to rearrange within this category.",
  selectCategory: "Select a category",
  noServicesInCategory: "No services in this category",
  addServicesToDefineOrder: "Add services in setup to define booking order",
  customizeAppearanceEmpty:
    "Customize Your Calendar Based On Categories Or Services",
  noHoursSetYet: "No hours set yet",
  edit: "Edit",
  set: "Set",
  save: "Save",
  hoursUnit: "h",
  minutesUnit: "min",
  dayFallback: "Day",
  everyDay: "Every day",
  today: "Today",
} as const;
