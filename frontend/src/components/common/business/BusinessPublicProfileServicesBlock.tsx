"use client";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import QtyStepper from "../QtyStepper";
import { Box, Checkbox, Paper, Stack, Typography } from "@mui/material";
import type {
  BusinessPublicProfileData,
  BusinessPublicProfileService,
} from "../../../data/businessPublicProfile.data";
import ServiceCategoryBar from "../ServiceCategoryBar";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import { ProfileLocationSection } from "./BusinessPublicProfileLocation";
import {
  ProjectReadOnlyField,
  SectionCard,
  ServiceForIcon,
} from "./BusinessPublicProfileSections";
import { mollureBodySx } from "../../../theme/mollureHierarchy";

export function BusinessPublicProfileServicesBlock(props: {
  data: BusinessPublicProfileData;
  effectiveLocationMode: "fixed" | "desired";
  showProjectHeader: boolean;
  projectEnabled: boolean;
  setProjectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  showProjectSection: boolean;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  serviceQty: Record<string, number>;
  selectedServiceIds: Record<string, boolean>;
  filteredServices: BusinessPublicProfileService[];
  toggleService: (id: string, checked: boolean) => void;
  adjustQty: (id: string, delta: number) => void;
}) {
  const {
    data,
    effectiveLocationMode,
    showProjectHeader,
    projectEnabled,
    setProjectEnabled,
    showProjectSection,
    activeCategory,
    setActiveCategory,
    serviceQty,
    selectedServiceIds,
    filteredServices,
    toggleService,
    adjustQty,
  } = props;
  const m = useTheme().palette.mollure;
  return (
    <>
        {data.supportsFixedLocation || data.supportsDesiredLocation ? (
          <SectionCard title="Location">
            <ProfileLocationSection
              data={data}
              locationMode={effectiveLocationMode}
              supportsFixed={data.supportsFixedLocation}
              supportsDesired={data.supportsDesiredLocation}
            />
          </SectionCard>
        ) : null}
        <SectionCard title="Services For">
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.45),
              mb: 1.1,
            }}
          >
            We love to serve
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            useFlexGap
            spacing={1.25}
          >
            {data.serviceFor.map((item, index, arr) => (
              <React.Fragment key={item.id}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ServiceForIcon item={item} />
                  <Typography
                    sx={{
                      ...mollureBodySx(m.navy),
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
                {index < arr.length - 1 ? (
                  <Typography
                    sx={mollureBodySx(m.navy, { fontWeight: 500, color: alpha(m.navy, 0.28) })}
                  >
                    |
                  </Typography>
                ) : null}
              </React.Fragment>
            ))}
          </Stack>
        </SectionCard>
        <SectionCard
          title="Services Details"
          headerAction={
            showProjectHeader ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.25}
                sx={{ flexShrink: 0, cursor: "pointer" }}
                onClick={() => setProjectEnabled((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setProjectEnabled((prev) => !prev);
                  }
                }}
              >
                <Checkbox
                  checked={projectEnabled}
                  size="small"
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    p: 0.35,
                    color: alpha(m.navy, 0.28),
                    "&.Mui-checked": { color: m.teal },
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    setProjectEnabled(e.target.checked);
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.82),
                  }}
                >
                  Project
                </Typography>
                <InfoOutlinedIcon
                  sx={{ fontSize: 16, color: m.teal, ml: 0.15 }}
                />
              </Stack>
            ) : null
          }
        >
          <Box sx={{ mb: 1.5 }}>
            <ServiceCategoryBar
              items={data.categories}
              activeId={activeCategory}
              onSelect={setActiveCategory}
            />
          </Box>
          <Stack spacing={1}>
            {filteredServices.map((service) => {
              const checked = Boolean(selectedServiceIds[service.id]);
              const qty = serviceQty[service.id] ?? 1;
              return (
                <Box
                  key={service.id}
                  sx={{
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    px: 1.25,
                    py: 1,
                    bgcolor: alpha(m.navy, 0.015),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          ...mollureLabelSx(m.navy),
                        }}
                      >
                        {service.name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, fontWeight: 700, color: m.teal }}
                      >
                        {service.durationLabel}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.1} sx={{ mr: 0.5 }}>
                      {service.originalPriceLabel ? (
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: alpha(m.navy, 0.42),
                            textDecoration: "line-through",
                            lineHeight: 1.15,
                          }}
                        >
                          {service.originalPriceLabel}
                        </Typography>
                      ) : null}
                      <Typography
                        sx={{
                          ...mollureLabelSx(m.navy),
                        }}
                      >
                        {service.priceLabel}
                      </Typography>
                    </Stack>
                    <QtyStepper
                      value={qty}
                      onDecrement={() => adjustQty(service.id, -1)}
                      onIncrement={() => adjustQty(service.id, 1)}
                      decrementDisabled={!checked || qty <= 1}
                      incrementDisabled={!checked}
                      valueWidth={22}
                    />
                    <Checkbox
                      checked={checked}
                      onChange={(e) =>
                        toggleService(service.id, e.target.checked)
                      }
                      sx={{ p: 0.25, "&.Mui-checked": { color: m.teal } }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </SectionCard>

        {showProjectSection ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              bgcolor: m.sectionSurface,
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography
                variant="subHeading"
                sx={{ lineHeight: 1, letterSpacing: 0, mb: 1.25 }}
              >
                Project
              </Typography>
              <ProjectReadOnlyField
                value={
                  data.projectInstructions || data.projectPlaceholder || ""
                }
              />
            </Box>
          </Paper>
        ) : null}
    </>
  );
}
