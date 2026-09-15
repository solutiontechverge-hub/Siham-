"use client";

import * as React from "react";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { Typography } from "../../ui/typography";
import { SectionShell } from "./professionalFixedLocationSetupShell";

type ServiceForFlags = {
  men: boolean;
  women: boolean;
  kids: boolean;
};

export type ProfessionalServiceForSectionProps = {
  m: Theme["palette"]["mollure"];
  action: React.ReactNode;
  serviceFor: ServiceForFlags;
  serviceForDisabled: boolean;
  setBizServiceFor: (id: keyof ServiceForFlags, checked: boolean) => void;
};

export function ProfessionalServiceForSection({
  m,
  action,
  serviceFor,
  serviceForDisabled,
  setBizServiceFor,
}: ProfessionalServiceForSectionProps) {
  const allChecked = serviceFor.men && serviceFor.women && serviceFor.kids;
  const anyChecked = serviceFor.men || serviceFor.women || serviceFor.kids;
  const allIndeterminate = anyChecked && !allChecked;

  return (
    <SectionShell
      title={
        <Typography
          sx={{
            fontWeight: 700,
            color: alpha(m.navy, 0.9),
            fontSize: { xs: 24, sm: 28, md: 30 },
            lineHeight: 1.2,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Service For
        </Typography>
      }
      action={action}
    >
      <Stack spacing={1}>
        <Typography
          sx={{
            fontSize: 12.5,
            color: alpha(m.navy, 0.62),
            fontWeight: 500,
          }}
        >
          We offer services:
        </Typography>

        <Stack spacing={0.25}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allChecked}
                indeterminate={allIndeterminate}
                disabled={serviceForDisabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setBizServiceFor("men", checked);
                  setBizServiceFor("women", checked);
                  setBizServiceFor("kids", checked);
                }}
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: alpha(m.navy, 0.7),
                  fontWeight: 600,
                }}
              >
                All
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serviceFor.men}
                disabled={serviceForDisabled}
                onChange={(e) => setBizServiceFor("men", e.target.checked)}
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: alpha(m.navy, 0.7),
                  fontWeight: 600,
                }}
              >
                Men
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serviceFor.women}
                disabled={serviceForDisabled}
                onChange={(e) => setBizServiceFor("women", e.target.checked)}
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: alpha(m.navy, 0.7),
                  fontWeight: 600,
                }}
              >
                Women
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serviceFor.kids}
                disabled={serviceForDisabled}
                onChange={(e) => setBizServiceFor("kids", e.target.checked)}
                sx={{
                  color: alpha(m.navy, 0.28),
                  "&.Mui-checked": { color: "primary.main" },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: alpha(m.navy, 0.7),
                  fontWeight: 600,
                }}
              >
                Kids
              </Typography>
            }
          />
        </Stack>
      </Stack>
    </SectionShell>
  );
}
