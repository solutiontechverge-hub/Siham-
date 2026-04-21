"use client";

import * as React from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "../../../../images";
import { useListingTokens } from "../../../app/clients/listing/listing.use";

export type ClientListingHeaderData = {
  localeLabel: string;
  loginLabel: string;
  professionalLinkLabel: string;
};

export function ClientListingHeader({ data }: { data: ClientListingHeaderData }) {
  const tokens = useListingTokens();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        bgcolor: tokens.whiteOverlay,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box component={Link} href="/" sx={{ display: "inline-flex", alignItems: "center" }}>
            <Image src={Logo} alt="Mollure" width={160} height={38} priority />
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              variant="outlined"
              sx={{
                borderRadius: 999,
                borderColor: tokens.border,
                color: tokens.navy,
                px: 2,
                textTransform: "none",
                fontWeight: 800,
                height: 36,
              }}
            >
              {data.localeLabel}
            </Button>
            <Button
              variant="contained"
              disableElevation
              sx={{
                borderRadius: 999,
                px: 2.5,
                textTransform: "none",
                fontWeight: 800,
                bgcolor: tokens.teal,
                height: 36,
                "&:hover": { bgcolor: tokens.tealDark },
              }}
            >
              {data.loginLabel}
            </Button>
            <Typography sx={{ color: tokens.headerHint, fontSize: 13 }}>{data.professionalLinkLabel}</Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

