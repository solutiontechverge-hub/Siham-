"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppDrawer from "../AppDrawer";
import AppTextField from "../AppTextField";
import type { ClientBookingDraft } from "./types";

type Props = {
  open: boolean;
  draft: ClientBookingDraft | null;
  onClose: () => void;
  onEditServices: (note: string) => void;
  onSend: (note: string) => void | Promise<void>;
};

/** Client EBR suggest drawer — note + edit services/products (shared AppDrawer shell). */
export default function ClientEbrSuggestDrawer({
  open,
  draft,
  onClose,
  onEditServices,
  onSend,
}: Props) {
  const m = useTheme().palette.mollure;
  const [note, setNote] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const saved =
      typeof window !== "undefined"
        ? (window.sessionStorage.getItem("mollure:ebr_suggest_note") ?? "")
        : "";
    setNote(saved);
    setSending(false);
    if (saved && typeof window !== "undefined") {
      window.sessionStorage.removeItem("mollure:ebr_suggest_note");
    }
  }, [open]);

  const services = draft?.services ?? [];

  return (
    <AppDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Suggest changes"
      subtitle="Write a note for the professional, then edit services or products if needed."
      contentSx={{ px: 2.5, pb: 3 }}
    >
      <Stack spacing={2.5}>
        <AppTextField
          fullWidth
          multiline
          minRows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe your suggested changes…"
        />

        <Box>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 12.5,
              color: alpha(m.navy, 0.7),
              mb: 1,
            }}
          >
            Current services
          </Typography>
          <Stack spacing={0.75}>
            {services.length ? (
              services.map((service) => (
                <Box
                  key={service.id}
                  sx={{
                    px: 1.25,
                    py: 1,
                    borderRadius: "10px",
                    border: `1px solid ${alpha(m.navy, 0.08)}`,
                    bgcolor: "#fff",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 13,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      {service.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 13,
                        color: alpha(m.navy, 0.82),
                      }}
                    >
                      €{service.price}
                    </Typography>
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.45),
                }}
              >
                No services yet
              </Typography>
            )}
          </Stack>
        </Box>

        <AppButton
          fullWidth
          variant="outlined"
          onClick={() => onEditServices(note.trim())}
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "10px",
            borderColor: alpha(m.teal, 0.45),
            color: m.tealDark,
            bgcolor: alpha(m.teal, 0.06),
            "&:hover": { bgcolor: alpha(m.teal, 0.1), borderColor: m.teal },
          }}
        >
          Edit services &amp; products
        </AppButton>

        <Stack direction="row" spacing={1.25} sx={{ pt: 0.5 }}>
          <AppButton
            tone="secondary"
            fullWidth
            onClick={onClose}
            sx={{
              height: 40,
            }}
          >
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            fullWidth
            disabled={sending}
            onClick={async () => {
              setSending(true);
              try {
                await onSend(note.trim());
              } finally {
                setSending(false);
              }
            }}
            sx={{
              height: 40,
            }}
          >
            Send
          </AppButton>
        </Stack>
      </Stack>
    </AppDrawer>
  );
}
