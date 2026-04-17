"use client";

import DesiredLocationPageScaffold from "../../../../components/common/DesiredLocationPageScaffold";
import ProfessionalDesiredLocationSetup from "../../../../components/common/ProfessionalDesiredLocationSetup";
import { desiredLocationPageData } from "../desiredLocation.data";
import { desiredLocationTopTabs } from "../desiredLocationTopTabs";

export default function DesiredLocationProfilePage() {
  return (
    <DesiredLocationPageScaffold activeTopTab="Profile" topTabs={desiredLocationTopTabs}>
      <ProfessionalDesiredLocationSetup data={desiredLocationPageData} chrome={false} />
    </DesiredLocationPageScaffold>
  );
}

