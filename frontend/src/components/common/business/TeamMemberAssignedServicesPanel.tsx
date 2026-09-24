"use client";

import * as React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, IconButton, Popover, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  businessTeamMemberModalCopy,
  formatTeamMemberGroupLabel,
  getTeamMemberGroupServiceLabels,
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
  onChangeGroups?: (groups: TeamMemberServiceGroupSelection[]) => void;
};

export default function TeamMemberAssignedServicesPanel({
  selectedGroups,
  businessCategories,
  serviceContext,
  disabled = false,
  onRemoveService,
  onChangeGroups,
}: TeamMemberAssignedServicesPanelProps) {
  const m = useTheme().palette.mollure;
  const [menu, setMenu] = React.useState<{
    anchorEl: HTMLElement;
    categoryId: string;
  } | null>(null);

  const openGroup =
    selectedGroups.find((group) => group.categoryId === menu?.categoryId) ??
    null;
  const openLabels = openGroup
    ? getTeamMemberGroupServiceLabels(
        openGroup,
        businessCategories,
        serviceContext,
      )
    : [];

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

      {selectedGroups.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.5) }}>
          {businessTeamMemberModalCopy.noSelections}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selectedGroups.map((group) => {
            const label = formatTeamMemberGroupLabel(
              group,
              businessCategories,
              serviceContext,
            );
            const isOpen = menu?.categoryId === group.categoryId;
            return (
              <Box
                key={group.categoryId}
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  component="button"
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    if (disabled) return;
                    setMenu({
                      anchorEl: e.currentTarget,
                      categoryId: group.categoryId,
                    });
                  }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.75,
                    minWidth: 160,
                    maxWidth: 220,
                    minHeight: 42,
                    px: 1.5,
                    py: 0,
                    borderRadius: "10px",
                    border: `1.5px solid ${
                      isOpen ? alpha(m.teal, 0.45) : alpha(m.teal, 0.22)
                    }`,
                    bgcolor: "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                    font: "inherit",
                    color: alpha(m.navy, 0.82),
                    opacity: disabled ? 0.72 : 1,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Typography>
                  <KeyboardArrowDownRoundedIcon
                    sx={{
                      fontSize: 18,
                      color: alpha(m.navy, 0.4),
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  aria-label={`Remove ${group.categoryTitle}`}
                  disabled={disabled}
                  onClick={() => {
                    if (onChangeGroups) {
                      onChangeGroups(
                        selectedGroups.filter(
                          (g) => g.categoryId !== group.categoryId,
                        ),
                      );
                      return;
                    }
                    for (const serviceId of group.subServiceIds) {
                      onRemoveService(serviceId);
                    }
                  }}
                  sx={{ color: alpha(m.navy, 0.45) }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      <Popover
        anchorEl={menu?.anchorEl}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              p: 1,
              borderRadius: "12px",
              border: `1px solid ${alpha(m.teal, 0.18)}`,
              boxShadow: "0 14px 32px rgba(16, 35, 63, 0.14)",
              minWidth: 200,
              maxWidth: 300,
            },
          },
        }}
      >
        <Stack spacing={0.65}>
          {openGroup && openLabels.length > 0 ? (
            openGroup.subServiceIds.map((serviceId, index) => (
              <Box
                key={serviceId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.85,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.1)}`,
                  bgcolor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: alpha(m.navy, 0.7),
                  }}
                >
                  {openLabels[index] ?? serviceId}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={`Remove ${openLabels[index] ?? serviceId}`}
                  disabled={disabled}
                  onClick={() => onRemoveService(serviceId)}
                  sx={{ color: alpha(m.navy, 0.4) }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: 12, color: alpha(m.navy, 0.5), px: 0.5 }}>
              {businessTeamMemberModalCopy.noSelectionsInCategory}
            </Typography>
          )}
        </Stack>
      </Popover>
    </Box>
  );
}
