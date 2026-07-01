"use client";

import * as React from "react";
import { Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton, AppTextField, KeywordTagsInput } from "../../common";
import AdminPageHeader from "../AdminPageHeader";
import AdminSectionCard from "../AdminSectionCard";
import AdminDataTable, { type AdminTableColumn } from "../AdminDataTable";
import { AdminBarChart } from "../AdminCharts";
import {
  mockFlaggedKeywords,
  mockFlaggedReviews,
  ratingCategoryDefaults,
} from "../adminMockData";

type FlaggedReview = (typeof mockFlaggedReviews)[number];

export default function AdminReviewsPage() {
  const theme = useTheme();
  const tokens = theme.palette.mollure;
  const [keywords, setKeywords] = React.useState(mockFlaggedKeywords);
  const [newKeyword, setNewKeyword] = React.useState("");
  const [ranges, setRanges] = React.useState(ratingCategoryDefaults);

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) return;
    setKeywords((prev) => [...prev, kw]);
    setNewKeyword("");
  };

  const reviewColumns: AdminTableColumn<FlaggedReview>[] = [
    { id: "pro", label: "Professional", render: (r) => r.professional },
    { id: "client", label: "Client", render: (r) => r.client },
    { id: "rating", label: "Rating", align: "center", render: (r) => `${r.rating}/5` },
    { id: "text", label: "Review text", minWidth: 200, render: (r) => r.text },
    { id: "date", label: "Date", render: (r) => r.date },
    {
      id: "actions",
      label: "Actions",
      render: () => (
        <Stack direction="row" spacing={1}>
          <AppButton size="small" color="error" variant="outlined" sx={{ fontSize: 11, textTransform: "none" }}>
            Delete public
          </AppButton>
          <AppButton size="small" variant="outlined" sx={{ fontSize: 11, textTransform: "none" }}>
            Remove from list
          </AppButton>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Rating & review management"
        description="Manage flagged keywords, flagged reviews, and rating category ranges."
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AdminSectionCard title="Flagged keyword settings">
            <Typography sx={{ fontSize: 13, color: tokens.bodyText, mb: 2 }}>
              Words that automatically flag a review for admin review.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <AppTextField
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                fullWidth
                size="small"
              />
              <AppButton variant="contained" onClick={addKeyword}>
                Add
              </AppButton>
            </Stack>
            <KeywordTagsInput
              value={keywords}
              onChange={setKeywords}
              maxKeywords={50}
              placeholder="Manage flagged keywords"
            />
          </AdminSectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <AdminSectionCard title="Rating category settings">
            <Stack spacing={2}>
              {(["bad", "good", "excellent"] as const).map((cat) => (
                <Stack key={cat} direction="row" alignItems="center" spacing={2}>
                  <Chip
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    sx={{
                      minWidth: 90,
                      bgcolor: tokens.mintSoft,
                      color: tokens.tealDark,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  />
                  <AppTextField
                    label="Min"
                    type="number"
                    size="small"
                    value={ranges[cat].min}
                    onChange={(e) =>
                      setRanges((prev) => ({
                        ...prev,
                        [cat]: { ...prev[cat], min: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    sx={{ width: 80 }}
                  />
                  <Typography sx={{ color: tokens.slate }}>–</Typography>
                  <AppTextField
                    label="Max"
                    type="number"
                    size="small"
                    value={ranges[cat].max}
                    onChange={(e) =>
                      setRanges((prev) => ({
                        ...prev,
                        [cat]: { ...prev[cat], max: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    sx={{ width: 80 }}
                  />
                </Stack>
              ))}
              <AppButton variant="contained" sx={{ alignSelf: "flex-start" }}>
                Save ranges
              </AppButton>
            </Stack>
          </AdminSectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <AdminSectionCard title="Flagged reviews" noPadding>
            <AdminDataTable columns={reviewColumns} rows={mockFlaggedReviews} getRowId={(r) => r.id} />
          </AdminSectionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AdminBarChart
            title="Reviews by rating"
            data={[
              { range: "1-2", count: 12 },
              { range: "3", count: 28 },
              { range: "4", count: 64 },
              { range: "5", count: 142 },
            ]}
            xKey="range"
            bars={[{ dataKey: "count", name: "Reviews" }]}
            height={280}
          />
        </Grid>
      </Grid>
    </>
  );
}
