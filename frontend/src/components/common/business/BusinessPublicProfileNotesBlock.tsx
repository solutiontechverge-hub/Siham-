"use client";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import type { BusinessPublicProfileData } from "../../../data/businessPublicProfile.data";
import {
  displayProfileValue,
  POLICY_SECTION_TEMPLATES,
  resolvePolicyDescription,
  resolvePolicyFieldValue,
} from "../../../data/businessPublicProfile.data";
import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import {
  ProfileDetailsContentBox,
  ProfileDetailsFieldLine,
  ProfileDetailsSubSection,
  SectionCard,
} from "./BusinessPublicProfileSections";

export function BusinessPublicProfileNotesBlock(props: {
  data: BusinessPublicProfileData;
  showKilometerAllowance: boolean;
}) {
  const { data, showKilometerAllowance } = props;
  const m = useTheme().palette.mollure;
  return (
        <SectionCard title="General Note">
          <Stack spacing={1.5}>
            <ProfileDetailsSubSection title={data.generalNoteLabel}>
              <ProfileDetailsContentBox multiline>
                {data.generalNote
                  ? `Additional Notes: ${data.generalNote}`
                  : "Additional Notes:"}
              </ProfileDetailsContentBox>
            </ProfileDetailsSubSection>

            <ProfileDetailsSubSection title="Price">
              <Stack spacing={1.5}>
                <ProfileDetailsFieldLine
                  label="Price Range:"
                  value={data.priceRangeLabel}
                />

                <Box>
                  <ProfileDetailsFieldLine
                    label="Prepayment"
                    value={data.prepaymentLabel}
                    labelWeight={900}
                  />
                  <ProfileDetailsContentBox sx={{ mt: 1 }}>
                    {displayProfileValue(data.prepaymentInstructions)}
                  </ProfileDetailsContentBox>
                </Box>

                {showKilometerAllowance ? (
                  <Box>
                    <ProfileDetailsFieldLine
                      label="Kilometer Allowance"
                      value={data.kilometerAllowanceLabel}
                      labelWeight={900}
                    />
                    <ProfileDetailsContentBox sx={{ mt: 1 }}>
                      {displayProfileValue(data.kilometerAllowanceInstructions)}
                    </ProfileDetailsContentBox>
                  </Box>
                ) : null}
              </Stack>
            </ProfileDetailsSubSection>

            <ProfileDetailsSubSection title="Policy">
              <Stack spacing={2}>
                {POLICY_SECTION_TEMPLATES.map((template) => (
                  <Box key={template.title}>
                    <Typography
                      sx={{
                        ...mollureLabelSx(m.navy),
                        mb: 0.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {template.title}
                    </Typography>
                    <Stack spacing={0.25}>
                      {template.fields.map((field) => (
                        <ProfileDetailsFieldLine
                          key={`${template.title}-${field.label}`}
                          label={field.label}
                          value={resolvePolicyFieldValue(
                            data.policySections,
                            template.title,
                            field.label,
                          )}
                          labelWeight={600}
                          valueWeight={800}
                          mutedLabel
                        />
                      ))}
                    </Stack>
                    <ProfileDetailsContentBox multiline sx={{ mt: 1 }}>
                      {displayProfileValue(
                        resolvePolicyDescription(
                          data.policySections,
                          template.title,
                        ),
                      )}
                    </ProfileDetailsContentBox>
                  </Box>
                ))}
              </Stack>
            </ProfileDetailsSubSection>
          </Stack>
        </SectionCard>
  );
}
