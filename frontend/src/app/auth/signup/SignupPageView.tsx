"use client";

import AppButton from "../../../components/common/AppButton";
import * as React from "react";
import Image from "next/image";
import { Box, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { authSignupHeaderClient } from "../../../data/marketingShell.data";
import { BodyText } from "../../../components/ui/typography";
import { CC, IC, Professional } from "../../../../images";
import { signupPageData } from "./signup.data";
import { useSignupPage } from "./useSignupPage";
import AuthSignupShell from "./AuthSignupShell";

type UserTypeCardProps = {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
};

function UserTypeCard({ selected, onSelect, icon, label }: UserTypeCardProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const cardBorderIdle = m.cardBorder ?? alpha(m.navy, 0.12);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      sx={{
        flex: 1,
        minWidth: { xs: "100%", sm: 168 },
        cursor: "pointer",
        borderRadius: "10px",
        px: { xs: 2.25, sm: 2.5 },
        py: { xs: 2.25, sm: 2.4 },
        minHeight: { xs: 92, sm: 104 },
        textAlign: "center",
        bgcolor: m.white ?? "#fff",
        border: selected
          ? `2px solid ${m.teal}`
          : `1px solid ${cardBorderIdle}`,
        boxShadow: selected ? `0 6px 18px ${alpha(m.navy, 0.08)}` : "none",
        transition: theme.transitions.create(
          ["border-color", "box-shadow", "background-color"],
          {
            duration: theme.transitions.duration.shorter,
          },
        ),
        "&:hover": {
          borderColor: selected ? m.teal : alpha(m.navy, 0.16),
          boxShadow: selected
            ? `0 8px 22px ${alpha(m.navy, 0.1)}`
            : `0 2px 10px ${alpha(m.navy, 0.06)}`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 1.2,
          opacity: selected ? 1 : 0.9,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontWeight: selected ? 600 : 500,
          fontSize: "0.9rem",
          lineHeight: 1.4,
          letterSpacing: "0.01em",
          color: selected ? alpha(m.navy, 0.92) : alpha(m.navy, 0.64),
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function SignupPageView() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { audience, selectAudience, handleContinue } = useSignupPage();
  const { greeting, titleSelect, titleRest, continueLabel, cards } =
    signupPageData;

  return (
    <AuthSignupShell header={authSignupHeaderClient}>
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: { xs: 4, sm: 6 },
            pb: { xs: 6, sm: 8 },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
            <BodyText
              sx={{
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                color: alpha(m.navy, 0.42),
                mb: 1,
                fontWeight: 400,
              }}
            >
              {greeting}
            </BodyText>

            <Typography
              component="h1"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "1.65rem", sm: "2rem" },
                lineHeight: 1.25,
                color: m.navy,
                mb: { xs: 3, sm: 4 },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  borderBottom: `4px solid ${m.teal}`,
                  pb: 0.2,
                  mr: 0.5,
                  fontWeight: 500,
                }}
              >
                {titleSelect}
              </Box>
              <Box component="span" sx={{ fontWeight: 500 }}>
                {" "}
                {titleRest}
              </Box>
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.25}
              sx={{ mb: 3.5 }}
              alignItems="stretch"
            >
              <UserTypeCard
                selected={audience === "individual"}
                onSelect={() => selectAudience("individual")}
                icon={
                  <Image
                    src={IC}
                    alt={cards.individual.alt}
                    width={34}
                    height={30}
                    style={{ display: "block" }}
                  />
                }
                label={cards.individual.label}
              />
              <UserTypeCard
                selected={audience === "company"}
                onSelect={() => selectAudience("company")}
                icon={
                  <Image
                    src={CC}
                    alt={cards.company.alt}
                    width={28}
                    height={36}
                    style={{ display: "block" }}
                  />
                }
                label={cards.company.label}
              />
              <UserTypeCard
                selected={audience === "professional"}
                onSelect={() => selectAudience("professional")}
                icon={
                  <Image
                    src={Professional}
                    alt={cards.professional.alt}
                    width={34}
                    height={28}
                    style={{ display: "block" }}
                  />
                }
                label={cards.professional.label}
              />
            </Stack>

            <AppButton
              tone="primary"
              type="button"
              fullWidth
              onClick={handleContinue}
              sx={{
                fontSize: "1rem",
                py: 1.35,
                color: m.white,
              }}
            >
              {continueLabel}
            </AppButton>
          </Box>
        </Box>
      </Container>
    </AuthSignupShell>
  );
}
