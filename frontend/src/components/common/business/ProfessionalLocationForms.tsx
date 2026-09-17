"use client";

import * as React from "react";
import {
  Box,
  Grid,
  IconButton,
  MenuItem,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AppMultiSelect from "../AppMultiSelect";
import MollureFormField from "../MollureFormField";
import { mollureWhiteFieldInputSx } from "../mollureFormSx";
import { Typography } from "../../ui/typography";
import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";
import { addSoftIconButtonSx } from "./professionalFixedLocationSetupShell";
import type { ProvinceKey } from "./useProfessionalFixedLocationSetup";

type FixedBizSlice = {
  streetAddress: string;
  streetNumber: string;
  postalCode: string;
  province: string;
  municipalities: string[];
};

type DesiredBusinessSlice = {
  streetAddress: string;
  streetNumber: string;
  postalCode: string;
};

export type ProfessionalFixedLocationFormProps = {
  m: Theme["palette"]["mollure"];
  fixedBiz: FixedBizSlice;
  setFixedBizField: (key: keyof FixedBizSlice, value: FixedBizSlice[keyof FixedBizSlice]) => void;
  locationDisabled: boolean;
  desiredMunicipalityByProvince: Record<string, string[]>;
  desiredProvinceOptions: readonly string[];
};

export function ProfessionalFixedLocationForm({
  m,
  fixedBiz,
  setFixedBizField,
  locationDisabled,
  desiredMunicipalityByProvince,
  desiredProvinceOptions,
}: ProfessionalFixedLocationFormProps) {
  return (
    <Grid container spacing={1.6}>
      <Grid item xs={12}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: 24, sm: 28, md: 30 },
            color: alpha(m.navy, 0.9),
            lineHeight: 1.2,
            mt: 0.5,
          }}
        >
          Address
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <MollureFormField
          placeholder="Street Address"
          value={fixedBiz.streetAddress}
          onChange={(e) => setFixedBizField("streetAddress", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <MollureFormField
          placeholder="Street Number"
          value={fixedBiz.streetNumber}
          onChange={(e) => setFixedBizField("streetNumber", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          placeholder="Postal code"
          value={fixedBiz.postalCode}
          onChange={(e) => setFixedBizField("postalCode", e.target.value)}
          disabled={locationDisabled}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MollureFormField
          select
          value={fixedBiz.province}
          onChange={(e) => {
            const province = e.target.value;
            const allowed = new Set(
              (desiredMunicipalityByProvince as Record<string, string[]>)[
                province || "Noord-Holland"
              ] ?? [],
            );
            setFixedBizField("province", province);
            setFixedBizField(
              "municipalities",
              fixedBiz.municipalities.filter((entry) => allowed.has(entry)),
            );
          }}
          disabled={locationDisabled}
          SelectProps={{
            displayEmpty: true,
            renderValue: (selected) => {
              const value = String(selected ?? "");
              if (!value) {
                return (
                  <Box
                    component="span"
                    sx={{ color: (theme) => theme.palette.mollure.placeholder }}
                  >
                    Select province
                  </Box>
                );
              }
              return value;
            },
          }}
        >
          <MenuItem value="">
            <em>Select province</em>
          </MenuItem>
          {desiredProvinceOptions.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </MollureFormField>
      </Grid>
      <Grid item xs={12} sm={4}>
        <AppMultiSelect
          placeholder="Select municipalities"
          value={fixedBiz.municipalities}
          onChange={(municipalities) =>
            setFixedBizField("municipalities", municipalities)
          }
          disabled={locationDisabled || !fixedBiz.province}
          options={(
            (desiredMunicipalityByProvince as Record<string, string[]>)[
              fixedBiz.province || "Noord-Holland"
            ] ?? []
          ).map((option) => ({
            value: option,
            label: option,
          }))}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
        />
      </Grid>
    </Grid>
  );
}

export type ProfessionalDesiredLocationFormProps = {
  m: Theme["palette"]["mollure"];
  locationDisabled: boolean;
  desiredAreaMode: "Specific areas only" | "All Netherlands";
  setDesiredAreaMode: React.Dispatch<
    React.SetStateAction<"Specific areas only" | "All Netherlands">
  >;
  setDesiredProvinceDraft: React.Dispatch<
    React.SetStateAction<ProvinceKey | "">
  >;
  setDesiredMunicipalityDraft: React.Dispatch<React.SetStateAction<string[]>>;
  desiredBusiness: DesiredBusinessSlice;
  // ponytail: parent BusinessTemplateState not exported; cast at boundary
  setDesiredBusiness: React.Dispatch<React.SetStateAction<DesiredBusinessSlice>>;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  desiredProvinceDraft: ProvinceKey | "";
  desiredMunicipalityDraft: string[];
  desiredProvinceOptions: readonly string[];
  desiredMunicipalityByProvince: Record<string, readonly string[]>;
  addDesiredArea: () => void;
  desiredAreasByProvince: readonly { province: string; label: string }[];
  removeDesiredProvinceGroup: (province: ProvinceKey) => void;
};

export function ProfessionalDesiredLocationForm(props: ProfessionalDesiredLocationFormProps) {
  const {
    m,
    locationDisabled,
    desiredAreaMode,
    setDesiredAreaMode,
    setDesiredProvinceDraft,
    setDesiredMunicipalityDraft,
    desiredBusiness,
    setDesiredBusiness,
    setIsBusinessPublishEnabled,
    desiredProvinceDraft,
    desiredMunicipalityDraft,
    desiredProvinceOptions,
    desiredMunicipalityByProvince,
    addDesiredArea,
    desiredAreasByProvince,
    removeDesiredProvinceGroup,
  } = props;
  return (
    <Grid container spacing={1.6}>
      <Grid item xs={12}>
        <Typography
          sx={{
            ...mollureBodyMutedSx(m.navy),
            mb: 0.6,
          }}
        >
          We are offering services
        </Typography>
        <MollureFormField
          select
          value={desiredAreaMode}
          onChange={(e) => {
            const mode = e.target.value as
              "Specific areas only" | "All Netherlands";
            setDesiredAreaMode(mode);
            if (mode === "All Netherlands") {
              setDesiredProvinceDraft("");
              setDesiredMunicipalityDraft([]);
            }
          }}
          disabled={locationDisabled}
          sx={mollureWhiteFieldInputSx}
        >
          <MenuItem value="Specific areas only">Specific areas only</MenuItem>
          <MenuItem value="All Netherlands">All Netherlands</MenuItem>
        </MollureFormField>
      </Grid>

      {desiredAreaMode === "Specific areas only" ? (
        <>
          <Grid item xs={12}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: 24, sm: 28, md: 30 },
                color: alpha(m.navy, 0.9),
                lineHeight: 1.2,
                mt: 0.5,
              }}
            >
              Address
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <MollureFormField
              placeholder="Street Address"
              value={desiredBusiness.streetAddress}
              onChange={(e) => {
                setIsBusinessPublishEnabled(true);
                setDesiredBusiness((prev) => ({
                  ...prev,
                  streetAddress: e.target.value,
                }));
              }}
              disabled={locationDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MollureFormField
              placeholder="Street Number"
              value={desiredBusiness.streetNumber}
              onChange={(e) => {
                setIsBusinessPublishEnabled(true);
                setDesiredBusiness((prev) => ({
                  ...prev,
                  streetNumber: e.target.value,
                }));
              }}
              disabled={locationDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MollureFormField
              placeholder="Postal code"
              value={desiredBusiness.postalCode}
              onChange={(e) => {
                setIsBusinessPublishEnabled(true);
                setDesiredBusiness((prev) => ({
                  ...prev,
                  postalCode: e.target.value,
                }));
              }}
              disabled={locationDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MollureFormField
              select
              value={desiredProvinceDraft}
              onChange={(e) => {
                const p = e.target.value as ProvinceKey | "";
                setDesiredProvinceDraft(p);
                setDesiredMunicipalityDraft([]);
              }}
              disabled={locationDisabled}
              sx={mollureWhiteFieldInputSx}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  const value = String(selected ?? "");
                  if (!value) {
                    return (
                      <Box
                        component="span"
                        sx={{
                          color: (theme) => theme.palette.mollure.placeholder,
                        }}
                      >
                        Select province
                      </Box>
                    );
                  }
                  return value;
                },
              }}
            >
              <MenuItem value="">
                <em>Select province</em>
              </MenuItem>
              {desiredProvinceOptions.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </MollureFormField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <Box sx={{ flex: 1 }}>
                <AppMultiSelect
                  placeholder="Select municipalities"
                  value={desiredMunicipalityDraft}
                  onChange={setDesiredMunicipalityDraft}
                  disabled={locationDisabled || !desiredProvinceDraft}
                  options={(desiredProvinceDraft
                    ? (desiredMunicipalityByProvince[
                        desiredProvinceDraft as ProvinceKey
                      ] ?? [])
                    : []
                  ).map((municipality) => ({
                    value: municipality,
                    label: municipality,
                  }))}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#fff",
                      borderRadius: "10px",
                    },
                  }}
                />
              </Box>
              <IconButton
                onClick={addDesiredArea}
                disabled={locationDisabled || !desiredMunicipalityDraft.length}
                sx={addSoftIconButtonSx(m, 36)}
                aria-label="Add desired area"
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>
          </Grid>
        </>
      ) : null}

      {desiredAreaMode === "Specific areas only" ? (
        <Grid item xs={12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(220px, 1fr))",
              },
              gap: 1.1,
              alignItems: "start",
              width: "100%",
            }}
          >
            {desiredAreasByProvince.map(({ province, label }) => (
              <Box
                key={province}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    minHeight: 36,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: "10px",
                    bgcolor: "#fff",
                    border: `1px solid ${alpha(m.navy, 0.12)}`,
                    color: alpha(m.navy, 0.88),
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <Typography
                    component="span"
                    noWrap
                    sx={{ fontSize: "inherit", fontWeight: "inherit" }}
                  >
                    {label}
                  </Typography>
                  <KeyboardArrowDownRoundedIcon
                    sx={{
                      fontSize: 20,
                      color: alpha(m.navy, 0.38),
                      flexShrink: 0,
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() =>
                    removeDesiredProvinceGroup(province as ProvinceKey)
                  }
                  disabled={locationDisabled}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "8px",
                    bgcolor: alpha(m.navy, 0.04),
                    "&:hover": { bgcolor: alpha(m.navy, 0.08) },
                  }}
                  aria-label={`Remove ${province} from desired areas`}
                >
                  <DeleteOutlineRoundedIcon
                    sx={{ fontSize: 18, color: alpha(m.navy, 0.55) }}
                  />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Grid>
      ) : null}
    </Grid>
  );
}
