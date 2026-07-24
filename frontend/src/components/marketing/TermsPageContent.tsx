"use client";

import { Box, Container, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText, MainHeading, SubHeading } from "../ui/typography";
import { termsPageData } from "../../app/terms-and-conditions/terms.data";
import { MOLLURE_SECTION_GAP_PX } from "../../theme/spacing";

export function TermsPageContent() {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
    <Box
      component="main"
      sx={{
        bgcolor: m.pageBg,
        py: { xs: 4, md: `${MOLLURE_SECTION_GAP_PX}px` },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: "20px",
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4.5 },
            boxShadow: `0 12px 40px ${alpha(m.navy, 0.06)}`,
          }}
        >
          <Stack spacing={1.25} sx={{ mb: 3.5 }}>
            <MainHeading component="h1" sx={{ fontSize: { xs: 28, sm: 34 } }}>
              {termsPageData.title}
            </MainHeading>
            <BodyText sx={{ color: alpha(m.navy, 0.55), fontSize: 14 }}>
              Last updated: {termsPageData.lastUpdated}
            </BodyText>
            <BodyText sx={{ color: alpha(m.navy, 0.78), mt: 1 }}>
              {termsPageData.intro}
            </BodyText>
          </Stack>

          <Stack spacing={3.25}>
            {termsPageData.sections.map((section) => (
              <Box key={section.id} component="section">
                <SubHeading
                  component="h2"
                  sx={{ mb: 1.25, fontSize: { xs: 18, sm: 20 } }}
                >
                  {section.heading}
                </SubHeading>
                <Stack spacing={1.25}>
                  {section.paragraphs.map((paragraph, index) => (
                    <BodyText
                      key={`${section.id}-${index}`}
                      sx={{ color: alpha(m.navy, 0.72), lineHeight: 1.65 }}
                    >
                      {paragraph}
                    </BodyText>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
