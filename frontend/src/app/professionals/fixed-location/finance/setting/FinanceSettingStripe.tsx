"use client";

import AppButton from "../../../../../components/common/AppButton";
import * as React from "react";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { Box, FormControlLabel, Paper, Stack, Switch } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  mollureBodyMutedSx,
  mollureLabelSx,
  mollureBodySx,
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../../../theme/mollureHierarchy";
import { mollureDensePaperSx } from "../../../../../components/common/mollureFormSx";
import {
  BodyText,
  CardTitle,
  SubHeading,
} from "../../../../../components/ui/typography";
import {
  EXPECT_ITEMS,
  MANAGING_BULLETS,
  PAYOUT_BULLETS,
} from "./setting.data";
import type { ExpectItemKey } from "./setting.types";
import { useStripeSettingsSection } from "./useFinanceSettingPage";

function expectIcon(key: ExpectItemKey, m: { navy: string }) {
  const sx = { fontSize: 16, color: alpha(m.navy, 0.75) };
  switch (key) {
    case "business":
      return <BusinessCenterRoundedIcon sx={sx} />;
    case "representative":
      return <PersonRoundedIcon sx={sx} />;
    case "public":
      return <PublicRoundedIcon sx={sx} />;
    case "payout":
      return <AccountBalanceRoundedIcon sx={sx} />;
    case "review":
      return <FactCheckRoundedIcon sx={sx} />;
  }
}

export default function FinanceSettingStripe() {
  const {
    m,
    hydrated,
    subscriptionActive,
    autoPay,
    subscriptionRenewsAt,
    showOnboardingBanner,
    showDisconnectedBanner,
    handleSubscriptionClick,
    handleAutoPayToggle,
    handleManualPaymentClick,
    handlePaymentsClick,
    isUpdating,
    onboardingView,
  } = useStripeSettingsSection();

  const renewLabel = subscriptionRenewsAt
    ? new Date(subscriptionRenewsAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const cardSx = mollureDensePaperSx(m.navy, { borderAlpha: 0.1 });

  const sectionTitleSx = {
    px: 2,
    py: 1.6,
    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
  } as const;

  const labelSx = { color: alpha(m.navy, 0.58) } as const;

  const actionBtnSx = {
    borderRadius: "7px",
    textTransform: "none",
    fontWeight: 600,
    fontSize: 12,
    height: 30,
    px: 1.25,
    bgcolor: "primary.main",
    color: "#fff",
    "&:hover": { bgcolor: "mollure.tealDark" },
  } as const;

  if (!hydrated) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {showOnboardingBanner ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha("#E65100", 0.25)}`,
            bgcolor: alpha("#E65100", 0.06),
            px: 2,
            py: 1.4,
          }}
        >
          <BodyText sx={mollureLabelSx(m.navy, { color: "#E65100" })}>
            Onboarding not completed — please proceed with your onboarding
            process.
          </BodyText>
        </Paper>
      ) : null}

      {showDisconnectedBanner ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha("#C62828", 0.3)}`,
            bgcolor: alpha("#C62828", 0.06),
            px: 2,
            py: 1.4,
          }}
        >
          <BodyText sx={mollureLabelSx(m.navy, { color: "#C62828" })}>
            Public profile has temporarily been deactivated — Status: Not
            Connected
          </BodyText>
        </Paper>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${alpha(m.navy, 0.08)}`,
          bgcolor: alpha(m.navy, 0.02),
          px: 2,
          py: 1.6,
        }}
      >
        <SubHeading sx={mollurePageTitleSx(m.navy)}>Stripe</SubHeading>
        <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 0.35 })}>
          Stripe Mollure partnership
        </BodyText>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={mollureSectionTitleSx(m.navy)}>
            Mollure Subscription
          </CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={mollureBodySx(m.navy, { color: alpha(m.navy, 0.7) })}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: subscriptionActive ? "success.main" : alpha(m.navy, 0.7),
                fontWeight: 800,
              }}
            >
              {subscriptionActive ? "Active" : "Not Active"}
            </Box>
          </BodyText>
          <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 0.6 })}>
            Your 15 EUR/month is billed securely via Stripe Billing. A valid
            credit card is required
          </BodyText>
          {subscriptionActive && renewLabel ? (
            <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 0.45 })}>
              Next renewal: {renewLabel}
            </BodyText>
          ) : null}
          {subscriptionActive ? (
            <FormControlLabel
              sx={{ mt: 1, ml: 0, alignItems: "center" }}
              control={
                <Switch
                  size="small"
                  checked={autoPay}
                  disabled={isUpdating}
                  onChange={() => void handleAutoPayToggle()}
                />
              }
              label={
                <BodyText sx={mollureBodySx(m.navy, { fontSize: 12 })}>
                  Auto-pay {autoPay ? "on" : "off"}
                </BodyText>
              }
            />
          ) : null}
          {!autoPay && subscriptionActive ? (
            <BodyText sx={mollureBodyMutedSx(m.navy, { mt: 0.35 })}>
              Pay manually before the renewal date or your subscription will be
              deactivated.
            </BodyText>
          ) : null}
          <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
            <AppButton
              variant="contained"
              disableElevation
              sx={actionBtnSx}
              disabled={isUpdating}
              onClick={handleSubscriptionClick}
            >
              {subscriptionActive
                ? "Deactivate Subscription"
                : "Activate Subscription"}
            </AppButton>
            {subscriptionActive && !autoPay ? (
              <AppButton
                variant="contained"
                disableElevation
                sx={actionBtnSx}
                disabled={isUpdating}
                onClick={() => void handleManualPaymentClick()}
              >
                Record manual payment
              </AppButton>
            ) : null}
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={0} sx={cardSx}>
        <Box sx={sectionTitleSx}>
          <CardTitle sx={mollureSectionTitleSx(m.navy)}>
            Accept Online Payment
          </CardTitle>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>
          <BodyText sx={mollureBodySx(m.navy, { color: alpha(m.navy, 0.7) })}>
            <Box component="span" sx={labelSx}>
              Status:
            </Box>{" "}
            •{" "}
            <Box
              component="span"
              sx={{
                color: onboardingView.paymentsConnected
                  ? "success.main"
                  : alpha(m.navy, 0.7),
                fontWeight: 800,
              }}
            >
              {onboardingView.statusLabel}
            </Box>
          </BodyText>

          <Box sx={{ mt: 1.1 }}>
            <AppButton
              variant="contained"
              disableElevation
              sx={actionBtnSx}
              disabled={isUpdating || !subscriptionActive}
              onClick={handlePaymentsClick}
            >
              {onboardingView.ctaLabel}
            </AppButton>
          </Box>

          {onboardingView.panel === "expectations" ? (
            <Box sx={{ mt: 2 }}>
              <CardTitle sx={mollureSectionTitleSx(m.navy)}>
                What To Expect
              </CardTitle>
              <BodyText
                sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}
              >
                Stripe&apos;s onboarding takes 2–5 minutes and guides you
                through a standard compliance verification flow. During
                onboarding, Stripe will request the following information:
              </BodyText>

              <Stack spacing={1.25} sx={{ mt: 1.4 }}>
                {EXPECT_ITEMS.map((it) => (
                  <Stack
                    key={it.title}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        mt: 0.25,
                        width: 22,
                        height: 22,
                        borderRadius: "6px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(m.navy, 0.04),
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        flex: "0 0 auto",
                      }}
                    >
                      {expectIcon(it.key, m)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <BodyText sx={mollureLabelSx(m.navy)}>
                        {it.title}
                      </BodyText>
                      <BodyText
                        sx={{
                          mt: 0.2,
                          fontSize: 12,
                          color: alpha(m.navy, 0.55),
                        }}
                      >
                        {it.desc}
                      </BodyText>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* CONNECTED order: Payout details → Account management */}
              <CardTitle sx={mollureSectionTitleSx(m.navy)}>
                Payout details
              </CardTitle>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {PAYOUT_BULLETS.map((t) => (
                  <BodyText
                    key={t}
                    sx={{
                      fontSize: 12,
                      color: alpha(m.navy, 0.58),
                      display: "list-item",
                    }}
                  >
                    {t}
                  </BodyText>
                ))}
              </Stack>

              <CardTitle sx={mollureSectionTitleSx(m.navy, { mt: 2 })}>
                Account management
              </CardTitle>
              <BodyText
                sx={{ mt: 0.45, fontSize: 12, color: alpha(m.navy, 0.55) }}
              >
                After onboarding, you can manage key payment information
                directly in your Stripe dashboard:
              </BodyText>
              <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5 }}>
                {MANAGING_BULLETS.map((t) => (
                  <BodyText
                    key={t}
                    sx={{
                      fontSize: 12,
                      color: alpha(m.navy, 0.58),
                      display: "list-item",
                    }}
                  >
                    {t}
                  </BodyText>
                ))}
              </Stack>
              <BodyText
                sx={{ mt: 1.25, fontSize: 11.5, color: alpha(m.navy, 0.48) }}
              >
                (Note: Stripe handles KYC, AML, etc.)
              </BodyText>
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
