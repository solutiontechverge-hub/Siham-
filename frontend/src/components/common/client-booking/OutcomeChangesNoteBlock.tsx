"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";
import { Box, Paper, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BodyText } from "../../ui/typography";

export type OutcomeChangesNote = {
  scheduleLabel?: string;
  services?: Array<{ name: string; price: number }>;
  products?: Array<{ name: string; price: number }>;
};

export default function OutcomeChangesNoteBlock({
  note,
  variant,
}: {
  note: OutcomeChangesNote;
  variant: "accepted" | "rejected";
}) {
  const m = useTheme().palette.mollure;
  const isAccepted = variant === "accepted";
  const accent = isAccepted ? m.success : "#C67A00";
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        borderRadius: "10px",
        border: `1px solid ${alpha(accent, 0.28)}`,
        bgcolor: alpha(accent, 0.06),
        px: 1.75,
        py: 1.35,
      }}
    >
      <BodyText
        sx={{
          m: 0,
          ...mollureLabelSx(m.navy),
          mb: 0.85,
        }}
      >
        {isAccepted
          ? "Professional has accepted your new changes"
          : "Professional has rejected your new changes"}
      </BodyText>
      {note.scheduleLabel ? (
        <BodyText
          sx={{
            m: 0,
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.68),
            mb: 0.5,
          }}
        >
          {isAccepted ? "Updated time" : "Requested time"}: {note.scheduleLabel}
        </BodyText>
      ) : null}
      {note.services?.length ? (
        <Box sx={{ mt: 0.35 }}>
          <BodyText
            sx={{
              m: 0,
              fontSize: 12,
              fontWeight: 800,
              color: alpha(m.navy, 0.55),
              mb: 0.35,
            }}
          >
            {isAccepted ? "Updated services" : "Requested services"}
          </BodyText>
          <Stack spacing={0.35}>
            {note.services.map((service, index) => (
              <Stack
                key={`${service.name}-${index}`}
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <BodyText
                  sx={{
                    m: 0,
                    ...mollureLabelSx(m.navy),
                  }}
                >
                  {service.name}
                </BodyText>
                <BodyText
                  sx={{
                    m: 0,
                    ...mollureLabelSx(m.navy),
                  }}
                >
                  €{service.price}
                </BodyText>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}
      {note.products?.length ? (
        <Box sx={{ mt: 0.75 }}>
          <BodyText
            sx={{
              m: 0,
              fontSize: 12,
              fontWeight: 800,
              color: alpha(m.navy, 0.55),
              mb: 0.35,
            }}
          >
            {isAccepted ? "Updated products" : "Requested products"}
          </BodyText>
          <Stack spacing={0.35}>
            {note.products.map((product, index) => (
              <Stack
                key={`${product.name}-${index}`}
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <BodyText
                  sx={{
                    m: 0,
                    ...mollureLabelSx(m.navy),
                  }}
                >
                  {product.name}
                </BodyText>
                <BodyText
                  sx={{
                    m: 0,
                    ...mollureLabelSx(m.navy),
                  }}
                >
                  €{product.price}
                </BodyText>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}
