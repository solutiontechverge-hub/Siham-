"use client";

import * as React from "react";
import {
  DESIRED_LOCATION_MUNICIPALITY_OPTIONS,
  PROVINCE_OPTIONS,
  type DesiredAreaRow,
  type DesiredProvince,
  type ProvinceKey,
} from "./useProfessionalFixedLocationSetup.types";

export type UseProfessionalFixedLocationSetupDesiredAreasArgs = {
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

/** Desired-location area rows (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupDesiredAreas({
  setIsBusinessPublishEnabled,
}: UseProfessionalFixedLocationSetupDesiredAreasArgs) {
  const desiredProvinceOptions = PROVINCE_OPTIONS;
  const desiredMunicipalityByProvince = React.useMemo(() => {
    const base = [...DESIRED_LOCATION_MUNICIPALITY_OPTIONS];
    return desiredProvinceOptions.reduce(
      (acc, p) => {
        acc[p] = base;
        return acc;
      },
      {} as Record<(typeof desiredProvinceOptions)[number], string[]>,
    );
  }, [desiredProvinceOptions]);

  const toProvinceKey = React.useCallback(
    (province: string | null | undefined): ProvinceKey => {
      const p = String(province ?? "").trim();
      return (desiredProvinceOptions as readonly string[]).includes(p)
        ? (p as ProvinceKey)
        : "Noord-Holland";
    },
    [desiredProvinceOptions],
  );

  const [desiredAreaMode, setDesiredAreaMode] = React.useState<
    "Specific areas only" | "All Netherlands"
  >("Specific areas only");
  const [desiredProvinceDraft, setDesiredProvinceDraft] = React.useState<
    ProvinceKey | ""
  >("Noord-Holland");
  const [desiredMunicipalityDraft, setDesiredMunicipalityDraft] =
    React.useState<string[]>([]);
  const [desiredAreas, setDesiredAreas] = React.useState<DesiredAreaRow[]>([]);

  const desiredAreasByProvince = React.useMemo(() => {
    const order: DesiredProvince[] = [];
    const rowsByProvince = new Map<DesiredProvince, DesiredAreaRow[]>();
    for (const row of desiredAreas) {
      if (!rowsByProvince.has(row.province)) {
        order.push(row.province);
        rowsByProvince.set(row.province, []);
      }
      rowsByProvince.get(row.province)!.push(row);
    }
    return order.map((province) => ({
      province,
      rows: rowsByProvince.get(province)!,
      label:
        rowsByProvince.get(province)!.length === 1
          ? province
          : `${province}(${rowsByProvince.get(province)!.length})`,
    }));
  }, [desiredAreas]);

  const addDesiredArea = React.useCallback(() => {
    if (!desiredProvinceDraft || !desiredMunicipalityDraft.length) return;
    const municipalitiesToAdd = desiredMunicipalityDraft.filter(
      (municipality) =>
        !desiredAreas.some(
          (row) =>
            row.province === desiredProvinceDraft &&
            row.municipality === municipality,
        ),
    );
    if (!municipalitiesToAdd.length) return;
    setIsBusinessPublishEnabled(true);
    setDesiredAreas((prev) => [
      ...prev,
      ...municipalitiesToAdd.map((municipality) => ({
        id: `dl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        province: desiredProvinceDraft,
        municipality,
      })),
    ]);
    setDesiredMunicipalityDraft([]);
  }, [desiredAreas, desiredMunicipalityDraft, desiredProvinceDraft]);

  const removeDesiredProvinceGroup = React.useCallback(
    (province: DesiredProvince) => {
      setIsBusinessPublishEnabled(true);
      setDesiredAreas((prev) => prev.filter((r) => r.province !== province));
    },
    [],
  );

  return {
    desiredProvinceOptions,
    desiredMunicipalityByProvince,
    toProvinceKey,
    desiredAreaMode,
    setDesiredAreaMode,
    desiredProvinceDraft,
    setDesiredProvinceDraft,
    desiredMunicipalityDraft,
    setDesiredMunicipalityDraft,
    desiredAreas,
    setDesiredAreas,
    desiredAreasByProvince,
    addDesiredArea,
    removeDesiredProvinceGroup,
  };
}
