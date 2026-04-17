"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import ProfessionalFixedLocationSetup from "../../../../components/common/ProfessionalFixedLocationSetup";
import { fixedLocationPageData } from "../fixedLocation.data";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";

export default function FixedLocationProfilePage() {
  return (
    <FixedLocationPageScaffold activeTopTab="Profile" topTabs={fixedLocationTopTabs}>
      <ProfessionalFixedLocationSetup data={fixedLocationPageData} chrome={false} />
    </FixedLocationPageScaffold>
  );
}

