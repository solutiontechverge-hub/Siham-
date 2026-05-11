"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Box, Button, Chip, Container, Divider, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";

type DraftService = {
  id: string;
  name: string;
  durationMins: number;
  price: number;
  assignedTo: string | null;
};

type DraftPayload = {
  selectedDateISO: string;
  selectedTime: string;
  combineServices: boolean;
  services: DraftService[];
  total: number;
};

type SelectedShop = {
  shopId: string;
  shopName: string;
  municipalityLabel?: string;
  addressLabel?: string;
  locationMode?: "fixed" | "desired";
};

export default function ClientBookingCheckoutPage() {
  const router = useRouter();
  const theme = useTheme();
  const m = theme.palette.mollure;
  const fallbackAddress = "Marina-Park 50, Den Helder, Noord-Holland";

  const [draft, setDraft] = React.useState<DraftPayload | null>(null);
  const [phone, setPhone] = React.useState("");
  const [shop, setShop] = React.useState<SelectedShop | null>(null);
  const [desiredProvince, setDesiredProvince] = React.useState("");
  const [desiredMunicipality, setDesiredMunicipality] = React.useState("");
  const [desiredStreet, setDesiredStreet] = React.useState("");
  const [desiredStreetNumber, setDesiredStreetNumber] = React.useState("");
  const [desiredPostalCode, setDesiredPostalCode] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:booking_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftPayload;
      setDraft(parsed);
    } catch {
      // ignore
    }
  }, []);

  const isDesiredLocation = shop?.locationMode === "desired";

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mollure:selected_shop");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SelectedShop;
      if (parsed?.shopId && parsed?.shopName) setShop(parsed);
    } catch {
      // ignore
    }
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, DraftService[]>();
    for (const s of draft?.services ?? []) {
      const key = s.assignedTo ?? "guest";
      const prev = map.get(key) ?? [];
      prev.push(s);
      map.set(key, prev);
    }
    return map;
  }, [draft?.services]);

  const dateLabel = React.useMemo(() => {
    if (!draft?.selectedDateISO) return "";
    const dt = new Date(`${draft.selectedDateISO}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return draft.selectedDateISO;
    return dt.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }, [draft?.selectedDateISO]);

  const assigneeTitle = (assigneeId: string) => {
    // We don’t have real names yet; show a stable label.
    if (assigneeId === "p-elly") return "Elly";
    if (assigneeId === "p-sara") return "Sara";
    if (assigneeId === "p-mary") return "Mary";
    if (assigneeId === "guest") return "Guest";
    // team member ids like tm-elly-1
    return assigneeId.replace(/^tm-/, "").replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#EAF9FB", py: { xs: 2.5, md: 3.5 } }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.08)}`,
            bgcolor: "#fff",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.05)",
          }}
        >
          <Box sx={{ px: 2.5, py: 1.75 }}>
            <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.86), fontSize: 14 }}>Booking Details</Typography>
          </Box>
          <Divider />

          <Box sx={{ p: 2.5 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2, pt: 1.35, pb: 1.15 }}>
                <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.72), fontSize: 13, textAlign: "center" }}>
                  Service Summary
                </Typography>

                <Box sx={{ mt: 0.8 }}>
                  <Chip
                    label={shop?.locationMode === "desired" ? "Desired Location" : "Fixed Location"}
                    size="small"
                    sx={{
                      height: 18,
                      borderRadius: "2px",
                      bgcolor: alpha(m.teal, 0.10),
                      color: m.teal,
                      fontSize: 9.5,
                      fontWeight: 900,
                      "& .MuiChip-label": { px: 0.8 },
                    }}
                  />
                </Box>

                <Typography sx={{ mt: 0.65, fontWeight: 900, color: alpha(m.navy, 0.88), fontSize: 15, lineHeight: 1.2 }}>
                  {shop?.shopName ?? "Beyond Beauty Saloon"}
                </Typography>

                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.65, gap: 1.25, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.55} sx={{ minWidth: 0, flex: 1 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 15, color: m.teal, flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: alpha(m.teal, 0.95),
                        fontSize: 10.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {dateLabel}
                      {draft?.selectedTime ? ` (${draft.selectedTime})` : ""}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.45}
                    sx={{ minWidth: 0, maxWidth: "46%", justifyContent: "flex-end", flexShrink: 0 }}
                  >
                    <LocationOnOutlinedIcon sx={{ fontSize: 15, color: alpha(m.navy, 0.45), flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: alpha(m.navy, 0.55),
                        fontSize: 10.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      }}
                    >
                      {shop?.addressLabel ?? shop?.municipalityLabel ?? fallbackAddress}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Divider />

              <Box sx={{ p: 2 }}>
                <Stack spacing={1.6}>
                  {[...groups.entries()].map(([key, items], idx) => (
                    <Box key={key}>
                      <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha(m.navy, 0.78), mb: 0.9 }}>
                        {key === "guest" ? `Guest ${idx}` : assigneeTitle(key)}
                      </Typography>
                      <Stack spacing={0.75}>
                        {items.map((s) => (
                          <Box
                            key={s.id}
                            sx={{
                              borderRadius: "10px",
                              border: `1px solid ${alpha(m.navy, 0.06)}`,
                              px: 1.2,
                              py: 0.9,
                              bgcolor: alpha(m.navy, 0.02),
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78), lineHeight: 1.1 }}>
                                  {s.name}
                                </Typography>
                                <Typography sx={{ mt: 0.25, fontSize: 10.5, fontWeight: 700, color: alpha(m.navy, 0.48) }}>
                                  {s.durationMins} Mins
                                </Typography>
                              </Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.76) }}>{s.price} €</Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                      <Divider sx={{ mt: 1.25 }} />
                    </Box>
                  ))}

                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: "10px",
                      border: `1px solid ${alpha(m.teal, 0.35)}`,
                      bgcolor: alpha(m.teal, 0.08),
                      px: 1.5,
                      py: 1.25,
                      boxShadow: `0 10px 26px ${alpha(m.teal, 0.10)}`,
                    }}
                  >
                    <Stack spacing={0.85}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha(m.navy, 0.78) }}>Total</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 1000, color: alpha(m.navy, 0.90) }}>
                          {draft?.total ?? 0}€
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: alpha(m.navy, 0.62) }}>
                          Prepayment Required (50%)
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 1000, color: alpha(m.teal, 0.95) }}>
                          {Math.round(((draft?.total ?? 0) * 0.5 + Number.EPSILON) * 100) / 100}€
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                mt: 2,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.08)}`,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2, py: 1.2 }}>
                <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), fontSize: 12 }}>Contact</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>Contact Number</Typography>
                <TextField
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="067-88886"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      height: 36,
                      bgcolor: "#fff",
                    },
                  }}
                />
              </Box>
            </Paper>

            {isDesiredLocation ? (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  borderRadius: "10px",
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                  bgcolor: "#fff",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ px: 2, py: 1.2 }}>
                  <Typography sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), fontSize: 12 }}>
                    Contact & Address Details
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                    Contact Number
                  </Typography>
                  <TextField
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="067-88886"
                    sx={{
                      mb: 1.5,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        height: 36,
                        bgcolor: "#fff",
                      },
                    }}
                  />

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                        Province
                      </Typography>
                      <TextField
                        select
                        value={desiredProvince}
                        onChange={(e) => setDesiredProvince(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Select province"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            bgcolor: "#fff",
                          },
                        }}
                      >
                        {["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland"].map(
                          (p) => (
                            <MenuItem key={p} value={p}>
                              {p}
                            </MenuItem>
                          ),
                        )}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                        Municipality
                      </Typography>
                      <TextField
                        value={desiredMunicipality}
                        onChange={(e) => setDesiredMunicipality(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Churchill-laan"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            bgcolor: "#fff",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                        Street Address
                      </Typography>
                      <TextField
                        value={desiredStreet}
                        onChange={(e) => setDesiredStreet(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Churchill-laan"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            bgcolor: "#fff",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                        Street Number
                      </Typography>
                      <TextField
                        value={desiredStreetNumber}
                        onChange={(e) => setDesiredStreetNumber(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="34234"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            bgcolor: "#fff",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: alpha(m.navy, 0.55), mb: 0.8 }}>
                        Postal Code
                      </Typography>
                      <TextField
                        value={desiredPostalCode}
                        onChange={(e) => setDesiredPostalCode(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Churchill-laan"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            bgcolor: "#fff",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            ) : null}

            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => {
                try {
                  const confirmed = {
                    id: `bk_${Date.now()}`,
                    status: "confirmed" as const,
                    shop: shop ?? null,
                    draft,
                    createdAt: new Date().toISOString(),
                    desiredAddress: isDesiredLocation
                      ? {
                          phone,
                          province: desiredProvince,
                          municipality: desiredMunicipality,
                          street: desiredStreet,
                          streetNumber: desiredStreetNumber,
                          postalCode: desiredPostalCode,
                        }
                      : null,
                  };
                  const raw = window.localStorage.getItem("mollure:client_bookings");
                  const prev = raw ? (JSON.parse(raw) as unknown[]) : [];
                  const next = Array.isArray(prev) ? [confirmed, ...prev] : [confirmed];
                  window.localStorage.setItem("mollure:client_bookings", JSON.stringify(next));
                } catch {
                  // ignore
                }
                try {
                  window.localStorage.removeItem("mollure:booking_draft");
                } catch {
                  // ignore
                }
                router.push("/clients/booking");
              }}
              sx={{
                mt: 2,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 900,
                height: 38,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
              }}
            >
              Checkout
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

