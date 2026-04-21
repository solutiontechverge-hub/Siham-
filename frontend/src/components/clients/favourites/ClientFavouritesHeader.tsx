"use client";

import * as React from "react";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "../../../../images";

export type ClientFavouritesHeaderData = {
  localeLabel: string;
  loginLabel: string;
  professionalLinkLabel: string;
};

export function ClientFavouritesHeader({
  data,
  borderColor,
  navy,
  teal,
  tealDark,
  headerHint,
}: {
  data: ClientFavouritesHeaderData;
  borderColor: string;
  navy: string;
  teal: string;
  tealDark: string;
  headerHint: string;
}) {
  return (
    <Box component="header" sx={{ bgcolor: "#fff", borderBottom: `1px solid ${borderColor}` }}>
      <Container maxWidth="lg" sx={{ py: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box component={Link} href="/client" sx={{ display: "inline-flex" }}>
            <Image src={Logo} alt="Mollure" width={150} height={36} priority />
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              startIcon={<LanguageRoundedIcon sx={{ fontSize: 16 }} />}
              endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                minWidth: 0,
                px: 1.25,
                py: 0.6,
                borderRadius: 999,
                color: navy,
                border: `1px solid ${borderColor}`,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {data.localeLabel}
            </Button>
            <Button
              variant="contained"
              disableElevation
              sx={{
                px: 2.25,
                py: 0.85,
                borderRadius: 999,
                textTransform: "none",
                color: "#fff",
                bgcolor: teal,
                "&:hover": { bgcolor: tealDark },
              }}
            >
              {data.loginLabel}
            </Button>
            <Typography sx={{ fontSize: 13, color: headerHint }}>{data.professionalLinkLabel}</Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

