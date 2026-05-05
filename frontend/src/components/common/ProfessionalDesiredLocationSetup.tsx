"use client";

import * as React from "react";
import type { DesiredLocationPageData } from "../../app/professionals/desired-location/desiredLocation.data";
import ProfessionalFixedLocationSetup, {
  type ProfessionalFixedLocationSetupProps,
} from "./ProfessionalFixedLocationSetup";

export type ProfessionalDesiredLocationSetupProps = Omit<
  ProfessionalFixedLocationSetupProps,
  "data"
> & {
  data: DesiredLocationPageData;
};

export default function ProfessionalDesiredLocationSetup({
  data,
  chrome = true,
  ...props
}: ProfessionalDesiredLocationSetupProps) {
  return <ProfessionalFixedLocationSetup data={data as any} chrome={chrome} {...props} />;
}

