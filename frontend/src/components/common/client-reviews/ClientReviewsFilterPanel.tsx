"use client";

import AppButton from "../AppButton";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import type {
  ReviewFilterServiceGroup,
  ReviewFiltersState,
} from "../../../data/clientProfessionalReviews";

type Props = {
  groups: ReviewFilterServiceGroup[];
  filters: ReviewFiltersState;
  onChange: (next: ReviewFiltersState) => void;
  onClear: () => void;
};

export default function ClientReviewsFilterPanel({
  groups,
  filters,
  onChange,
  onClear,
}: Props) {
  const m = useTheme().palette.mollure;

  const setAllServices = (checked: boolean) => {
    const categoryAll: Record<string, boolean> = {};
    const serviceIds: Record<string, boolean> = {};
    for (const group of groups) {
      categoryAll[group.id] = checked;
      for (const service of group.services) serviceIds[service.id] = checked;
    }
    onChange({ ...filters, allServices: checked, categoryAll, serviceIds });
  };

  const setCategoryAll = (categoryId: string, checked: boolean) => {
    const group = groups.find((g) => g.id === categoryId);
    if (!group) return;
    const serviceIds = { ...filters.serviceIds };
    for (const service of group.services) serviceIds[service.id] = checked;
    const categoryAll = { ...filters.categoryAll, [categoryId]: checked };
    const allServices =
      groups.every((g) => categoryAll[g.id]) &&
      Object.values(serviceIds).every(Boolean);
    onChange({ ...filters, allServices, categoryAll, serviceIds });
  };

  const setService = (
    serviceId: string,
    categoryId: string,
    checked: boolean,
  ) => {
    const serviceIds = { ...filters.serviceIds, [serviceId]: checked };
    const group = groups.find((g) => g.id === categoryId);
    const categoryAll = {
      ...filters.categoryAll,
      [categoryId]: group
        ? group.services.every((s) => serviceIds[s.id])
        : false,
    };
    const allServices =
      groups.every((g) => categoryAll[g.id]) &&
      Object.values(serviceIds).every(Boolean);
    onChange({ ...filters, allServices, categoryAll, serviceIds });
  };

  const toggleRating = (stars: 1 | 2 | 3 | 4 | 5) => {
    onChange({
      ...filters,
      ratings: { ...filters.ratings, [stars]: !filters.ratings[stars] },
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ px: 1.5, py: 1.25 }}
      >
        <TuneRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
        <Typography
          sx={{ fontWeight: 900, fontSize: 13, color: alpha(m.navy, 0.78) }}
        >
          Filters
        </Typography>
      </Stack>
      <Divider />

      <Box sx={{ p: 1.5 }}>
        <Typography
          sx={mollureLabelSx(m.navy, {
            fontWeight: 900,
            color: alpha(m.navy, 0.72),
            mb: 1,
          })}
        >
          Service Types
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: "10px",
            borderColor: alpha(m.navy, 0.08),
            p: 1.25,
            mb: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.allServices}
                onChange={(e) => setAllServices(e.target.checked)}
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: m.teal },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha(m.navy, 0.72),
                }}
              >
                All services
              </Typography>
            }
            sx={{ m: 0, mb: 0.75, display: "flex" }}
          />
          {groups.map((group) => (
            <Box key={group.id} sx={{ pl: 1.5, mb: 0.75 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={filters.categoryAll[group.id] ?? false}
                    onChange={(e) => setCategoryAll(group.id, e.target.checked)}
                    sx={{
                      color: alpha(m.navy, 0.28),
                      "&.Mui-checked": { color: m.teal },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: alpha(m.navy, 0.72),
                    }}
                  >
                    {group.label} ({group.count})
                  </Typography>
                }
                sx={{ m: 0, display: "flex" }}
              />
              <Stack sx={{ pl: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={filters.categoryAll[group.id] ?? false}
                      onChange={(e) =>
                        setCategoryAll(group.id, e.target.checked)
                      }
                      sx={{
                        color: alpha(m.navy, 0.28),
                        "&.Mui-checked": { color: m.teal },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: alpha(m.navy, 0.55),
                      }}
                    >
                      All Services
                    </Typography>
                  }
                  sx={{ m: 0, display: "flex" }}
                />
                {group.services.map((service) => (
                  <FormControlLabel
                    key={service.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={filters.serviceIds[service.id] ?? false}
                        onChange={(e) =>
                          setService(service.id, group.id, e.target.checked)
                        }
                        sx={{
                          color: alpha(m.navy, 0.28),
                          "&.Mui-checked": { color: m.teal },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: alpha(m.navy, 0.55),
                        }}
                      >
                        {service.label}
                      </Typography>
                    }
                    sx={{ m: 0, display: "flex" }}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Paper>

        <Typography
          sx={mollureLabelSx(m.navy, {
            fontWeight: 900,
            color: alpha(m.navy, 0.72),
            mb: 1,
          })}
        >
          Rating
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: "10px",
            borderColor: alpha(m.navy, 0.08),
            p: 1.25,
          }}
        >
          <Stack spacing={0.75}>
            {([5, 4, 3, 2, 1] as const).map((stars) => (
              <Stack
                key={stars}
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <Checkbox
                  size="small"
                  checked={filters.ratings[stars]}
                  onChange={() => toggleRating(stars)}
                  sx={{
                    p: 0.35,
                    color: alpha(m.navy, 0.28),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
                <Typography
                  sx={{
                    width: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    color: alpha(m.navy, 0.62),
                  }}
                >
                  {stars}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: "999px",
                    bgcolor: alpha(m.navy, 0.06),
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Paper>

        <AppButton
          tone="secondary"
          fullWidth
          onClick={onClear}
          sx={{
            mt: 1.5,
            fontSize: 12.5,
            bgcolor: alpha(m.navy, 0.03),
          }}
        >
          Clear Filters
        </AppButton>
      </Box>
    </Paper>
  );
}
