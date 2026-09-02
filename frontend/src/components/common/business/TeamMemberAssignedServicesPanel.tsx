"use client";

import * as React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, IconButton, MenuItem, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureLabeledSelect } from "../MollureLabeledFields";
import {
  businessTeamMemberModalCopy,
  flattenTeamMemberAssignedServices,
  type TeamMemberModalServiceContext,
  type TeamMemberServiceGroupSelection,
} from "../../../data/businessTeamMemberModal.data";
import type { BusinessCategoryLike } from "../../../data/businessServiceCategorySlider.data";

type TeamMemberAssignedServicesPanelProps = {
  selectedGroups: TeamMemberServiceGroupSelection[];
  businessCategories: BusinessCategoryLike[];
  serviceContext: TeamMemberModalServiceContext;
  disabled?: boolean;
  onRemoveService: (serviceId: string) => void;
};

export default function TeamMemberAssignedServicesPanel({
  selectedGroups,
  businessCategories,
  serviceContext,
  disabled = false,
  onRemoveService,
}: TeamMemberAssignedServicesPanelProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  const assignedServices = React.useMemo(
    () =>
      flattenTeamMemberAssignedServices(
        selectedGroups,
        businessCategories,
        serviceContext,
      ),
    [selectedGroups, businessCategories, serviceContext],
  );

  const [selectedServiceId, setSelectedServiceId] = React.useState("");

  React.useEffect(() => {
    if (assignedServices.length === 0) {
      setSelectedServiceId("");
      return;
    }

    if (!assignedServices.some((service) => service.serviceId === selectedServiceId)) {
      setSelectedServiceId(assignedServices[0]?.serviceId ?? "");
    }
  }, [assignedServices, selectedServiceId]);

  const selectedService =
    assignedServices.find((service) => service.serviceId === selectedServiceId) ??
    assignedServices[0] ??
    null;
  const spansMultipleCategories =
    new Set(assignedServices.map((service) => service.categoryId)).size > 1;

  return (
    <Box
      sx={{
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.045),
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        p: 2,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: 14,
          color: alpha(m.navy, 0.88),
          mb: 1.5,
        }}
      >
        {businessTeamMemberModalCopy.selectedHeading}
      </Typography>

      {assignedServices.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
          {businessTeamMemberModalCopy.noSelections}
        </Typography>
      ) : assignedServices.length === 1 ? (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.teal, 0.22)}`,
              px: 1.75,
              py: 1.35,
              bgcolor: "#fff",
              boxShadow: "0 2px 8px rgba(16, 35, 63, 0.06)",
            }}
          >
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 800,
                color: alpha(m.navy, 0.88),
                lineHeight: 1.25,
              }}
            >
              {assignedServices[0].label}
            </Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                color: alpha(m.navy, 0.48),
                mt: 0.35,
              }}
            >
              {assignedServices[0].categoryTitle}
            </Typography>
          </Paper>
          <IconButton
            size="small"
            aria-label={`Remove ${assignedServices[0].label}`}
            onClick={() => onRemoveService(assignedServices[0].serviceId)}
            disabled={disabled}
            sx={{ color: alpha(m.navy, 0.45), mt: 0.5 }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MollureLabeledSelect
              fieldLabel={businessTeamMemberModalCopy.selectServicesLabel}
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(String(e.target.value ?? ""))}
              disabled={disabled}
              sx={{ bgcolor: "#fff", borderRadius: "10px" }}
            >
              {assignedServices.map((service) => (
                <MenuItem key={service.serviceId} value={service.serviceId}>
                  {spansMultipleCategories
                    ? `${service.label} (${service.categoryTitle})`
                    : service.label}
                </MenuItem>
              ))}
            </MollureLabeledSelect>
            {selectedService ? (
              <Typography
                sx={{
                  mt: 0.75,
                  px: 0.5,
                  fontSize: 11.5,
                  color: alpha(m.navy, 0.58),
                }}
              >
                {selectedService.categoryTitle}
              </Typography>
            ) : null}
          </Box>
          <IconButton
            size="small"
            aria-label={
              selectedService
                ? `Remove ${selectedService.label}`
                : "Remove selected service"
            }
            onClick={() => {
              if (!selectedService) return;
              onRemoveService(selectedService.serviceId);
            }}
            disabled={disabled || !selectedService}
            sx={{ color: alpha(m.navy, 0.45), mt: 3.25 }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
