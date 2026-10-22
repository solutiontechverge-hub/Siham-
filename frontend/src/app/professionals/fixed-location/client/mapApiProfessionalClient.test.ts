/**
 * Run with: npx --yes tsx src/app/professionals/fixed-location/client/mapApiProfessionalClient.test.ts
 */
import assert from "node:assert/strict";
import type { ApiProfessionalClient } from "../../../../store/services/businessApi";
import { mapApiProfessionalClientToRecord } from "./mapApiProfessionalClient";

const base = {
  id: "c1",
  display_name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+31 6 12345678",
  client_kind: "individual",
  is_mollure: false,
  total_sales: 0,
  total_sales_label: "€0",
  last_booking_date: null,
  last_booking_label: "—",
  bookings_completed: 0,
  average_booking_value: 0,
  average_booking_value_label: "€0",
  recent_services: [],
  booking_history: [],
  first_name: "Ada",
  last_name: "Lovelace",
  gender: null,
  date_of_birth: null,
  residential_address: "Keizersgracht 1",
  residential_area: "Centrum",
  legal_name: null,
  coc: null,
  vat: null,
  contact_person_name: null,
  business_address: null,
  detail_email: null,
  technical_note: null,
  is_blocked: false,
  has_no_show: false,
  added_on: "01/01/2026",
  created_at: "2026-01-01T00:00:00.000Z",
} as ApiProfessionalClient;

const mapped = mapApiProfessionalClientToRecord(base);
assert.equal(mapped.residentialAddress, "Keizersgracht 1");
assert.equal(mapped.residentialArea, "Centrum");

const withoutArea = mapApiProfessionalClientToRecord({
  ...base,
  residential_area: null,
});
assert.equal(withoutArea.residentialArea, undefined);

console.log("mapApiProfessionalClient.test.ts: ok");
