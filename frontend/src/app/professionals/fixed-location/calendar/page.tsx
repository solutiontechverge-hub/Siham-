"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import ProfessionalFixedLocationCalendar from "../../../../components/common/ProfessionalFixedLocationCalendar";
import { professionalFixedLocationCalendarData } from "./calendar.data";

export default function FixedLocationCalendarPage() {
  return (
    <FixedLocationPageScaffold activeTopTab="Calendar" topTabs={fixedLocationTopTabs}>
      <ProfessionalFixedLocationCalendar data={professionalFixedLocationCalendarData} />
    </FixedLocationPageScaffold>
  );
}

