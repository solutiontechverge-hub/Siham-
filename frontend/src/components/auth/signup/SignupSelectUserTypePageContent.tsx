"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { MarketingSiteHeader } from "../../common";
import { authSignupHeaderClient } from "../../../data/marketingShell.data";
import { BodyText } from "../../ui/typography";
import { SignupBg, SignupLs, SignupRs } from "../../../../images";
import {
  signupAudienceCards,
  signupPathByAudience,
  type SignupAudience,
} from "../../../app/auth/signup/signupSelectUserType.data";

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
        border: selected ? `2px solid ${m.teal}` : `1px solid ${cardBorderIdle}`,
        boxShadow: selected ? `0 6px 18px ${alpha(m.navy, 0.08)}` : "none",
        transition: theme.transitions.create(["border-color", "box-shadow", "background-color"], {
          duration: theme.transitions.duration.shorter,
        }),
        "&:hover": {
          borderColor: selected ? m.teal : alpha(m.navy, 0.16),
          boxShadow: selected ? `0 8px 22px ${alpha(m.navy, 0.1)}` : `0 2px 10px ${alpha(m.navy, 0.06)}`,
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

export default function SignupSelectUserTypePageContent() {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const router = useRouter();
  const [audience, setAudience] = React.useState<SignupAudience>("individual");

  const handleContinue = () => {
    router.push(signupPathByAudience[audience]);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: m.white ?? "#fff", position: "relative", overflow: "hidden" }}>
      <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, lineHeight: 0 }}>
          <Image
            src={SignupBg}
            alt=""
            width={1440}
            height={553}
            priority
            sizes="100vw"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(52vw, 240px)", sm: 280, md: 323 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupLs}
            alt=""
            width={323}
            height={469}
            sizes="(max-width: 600px) 52vw, 323px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: -12, sm: -4, md: 0 },
            bottom: { xs: -28, sm: -12, md: 0 },
            width: { xs: "min(56vw, 260px)", sm: 300, md: 364 },
            lineHeight: 0,
          }}
        >
          <Image
            src={SignupRs}
            alt=""
            width={364}
            height={413}
            sizes="(max-width: 600px) 56vw, 364px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <MarketingSiteHeader
          navItems={[...authSignupHeaderClient.navItems]}
          localeLabel={authSignupHeaderClient.localeLabel}
          loginLabel={authSignupHeaderClient.loginLabel}
          loginHref={authSignupHeaderClient.loginHref}
          professionalLinkLabel={authSignupHeaderClient.professionalLinkLabel}
          professionalHref={authSignupHeaderClient.professionalHref}
          homeHref="/"
        />

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
                Hi,
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
                  Select
                </Box>
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {" "}
                  User Type
                </Box>
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.25} sx={{ mb: 3.5 }} alignItems="stretch">
                {signupAudienceCards.map((card) => (
                  <UserTypeCard
                    key={card.audience}
                    selected={audience === card.audience}
                    onSelect={() => setAudience(card.audience)}
                    icon={
                      <Image
                        src={card.icon.src}
                        alt={card.icon.alt}
                        width={card.icon.width}
                        height={card.icon.height}
                        style={{ display: "block" }}
                      />
                    }
                    label={card.label}
                  />
                ))}
              </Stack>

              <Button
                type="button"
                variant="contained"
                disableElevation
                fullWidth
                onClick={handleContinue}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  py: 1.35,
                  bgcolor: m.teal,
                  color: m.white,
                  "&:hover": { bgcolor: m.tealDark },
                }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

