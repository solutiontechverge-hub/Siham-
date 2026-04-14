"use client";

import * as React from "react";
import type { DesiredLocationPageData } from "../../app/professionals/desired-location/desiredLocation.data";
import ProfessionalFixedLocationSetup from "./ProfessionalFixedLocationSetup";

export type ProfessionalDesiredLocationSetupProps = {
  data: DesiredLocationPageData;
  chrome?: boolean;
};

export default function ProfessionalDesiredLocationSetup({ data, chrome = true }: ProfessionalDesiredLocationSetupProps) {
  return <ProfessionalFixedLocationSetup data={data as any} chrome={chrome} />;
}

