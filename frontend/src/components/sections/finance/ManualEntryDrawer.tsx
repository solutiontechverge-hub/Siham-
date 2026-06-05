"use client";

import * as React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureDrawer from "../../common/MollureDrawer";
import MollureFormField from "../../common/MollureFormField";
import { BodyText } from "../../ui/typography";
import {
  createManualEntryLine,
  filterClientsByName,
  filterMollureByEmail,
  formatEurAmount,
  lineTotal,
  selectionLabel,
  type ManualEntryClientMode,
  type ManualEntryClientSelection,
  type ManualEntryLine,
  type ManualEntryLineKind,
  type ManualEntrySavePayload,
} from "./manualEntry.data";
import ManualEntryLineCard from "./ManualEntryLineCard";
import ManualEntryLineEditModal from "./ManualEntryLineEditModal";

export type ManualEntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSave?: (payload: ManualEntrySavePayload) => void;
};

function ManualEntryAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={onClick}
      startIcon={<AddRoundedIcon sx={{ fontSize: 18, color: m.teal }} />}
      sx={{
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 800,
        fontSize: 12.5,
        justifyContent: "flex-start",
        borderColor: alpha(m.navy, 0.1),
        color: alpha(m.navy, 0.78),
        bgcolor: "#fff",
        height: 42,
        px: 1.5,
      }}
    >
      {label}
    </Button>
  );
}

export default function ManualEntryDrawer({ open, onClose, onSave }: ManualEntryDrawerProps) {
  const m = useTheme().palette.mollure;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [clientOpen, setClientOpen] = React.useState(false);
  const [clientMode, setClientMode] = React.useState<ManualEntryClientMode | null>(null);
  const [clientQuery, setClientQuery] = React.useState("");
  const [clientSelection, setClientSelection] = React.useState<ManualEntryClientSelection | null>(null);
  const [lines, setLines] = React.useState<ManualEntryLine[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<ManualEntryLine | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setClientOpen(false);
    setClientMode(null);
    setClientQuery("");
    setClientSelection(null);
    setLines([]);
    setDiscount(0);
    setDiscountOpen(false);
    setEditingLine(null);
  }, [open]);

  const productLines = React.useMemo(() => lines.filter((l) => l.kind === "product"), [lines]);
  const itemLines = React.useMemo(() => lines.filter((l) => l.kind === "item"), [lines]);
  const subtotal = React.useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const totalPrice = Math.max(0, subtotal - discount);
  const hasItems = lines.length > 0;

  React.useEffect(() => {
    if (!clientOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setClientOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [clientOpen]);

  const listResults = React.useMemo(
    () => (clientMode === "list" ? filterClientsByName(clientQuery) : []),
    [clientMode, clientQuery],
  );
  const platformResults = React.useMemo(
    () => (clientMode === "platform" ? filterMollureByEmail(clientQuery) : []),
    [clientMode, clientQuery],
  );

  const displayClient = selectionLabel(clientSelection) || "Search Client";

  const pickGuest = () => {
    setClientSelection({ type: "guest" });
    setClientOpen(false);
  };

  const pickListClient = (client: (typeof listResults)[number]) => {
    setClientSelection({ type: "list", client });
    setClientOpen(false);
  };

  const pickPlatformClient = (client: (typeof platformResults)[number]) => {
    setClientSelection({ type: "platform", client });
    setClientOpen(false);
    setClientQuery("");
  };

  const addLine = (kind: ManualEntryLineKind) => {
    setLines((prev) => {
      const index = prev.filter((l) => l.kind === kind).length;
      return [...prev, createManualEntryLine(kind, index)];
    });
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (next: ManualEntryLine) => {
    setLines((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  };

  const footer = (
    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2.5, py: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 800,
          borderColor: alpha(m.navy, 0.14),
          color: alpha(m.navy, 0.72),
          bgcolor: "#fff",
          height: 36,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        disableElevation
        disabled={!clientSelection || !hasItems}
        onClick={() => {
          if (!clientSelection) return;
          onSave?.({
            clientSelection,
            lines,
            totalPrice,
            discount,
          });
          onClose();
        }}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 900,
          bgcolor: m.teal,
          "&:hover": { bgcolor: m.tealDark },
          height: 36,
          px: 2.25,
          minWidth: 92,
        }}
      >
        Next
      </Button>
    </Stack>
  );

  const modeRowSx = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.75,
    py: 1.15,
    cursor: "pointer",
    bgcolor: active ? alpha(m.teal, 0.06) : "#fff",
    borderBottom: `1px solid ${alpha(m.navy, 0.06)}`,
    "&:hover": { bgcolor: alpha(m.navy, 0.02) },
  });

  return (
    <MollureDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Manual Entry"
      width={{ xs: "100%", sm: 500 }}
      contentSx={{ bgcolor: alpha(m.navy, 0.03), px: 2.25, py: 2 }}
      footer={footer}
    >
      <Stack spacing={2.5}>
        <Box ref={rootRef}>
          <BodyText sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>Client</BodyText>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setClientOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setClientOpen((prev) => !prev);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 1.1,
              borderRadius: "10px",
              border: `1px solid ${clientOpen || clientSelection ? m.teal : alpha(m.navy, 0.12)}`,
              bgcolor: "#fff",
              cursor: "pointer",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: clientSelection ? alpha(m.navy, 0.78) : alpha(m.navy, 0.45),
              }}
            >
              {displayClient}
            </Typography>
            <ExpandMoreRoundedIcon
              sx={{
                fontSize: 20,
                color: alpha(m.navy, 0.45),
                transform: clientOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 160ms ease",
              }}
            />
          </Box>

          {clientOpen ? (
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                borderRadius: "10px",
                border: `1px solid ${alpha(m.navy, 0.1)}`,
                boxShadow: "0 10px 22px rgba(16, 35, 63, 0.06)",
                overflow: "hidden",
              }}
            >
              <Box
                onClick={() => {
                  setClientMode("list");
                  setClientQuery("");
                }}
                sx={modeRowSx(clientMode === "list")}
              >
                <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78) }}>
                  Search from Client list by name
                </Typography>
              </Box>
              <Box
                onClick={() => {
                  setClientMode("platform");
                  setClientQuery("");
                }}
                sx={modeRowSx(clientMode === "platform")}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78), pl: 3.25 }}>
                  Search on Mollure platform by email
                </Typography>
              </Box>
              <Box onClick={pickGuest} sx={{ ...modeRowSx(clientMode === "guest"), borderBottom: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.78), pl: 3.25 }}>
                  Guest
                </Typography>
              </Box>

              {clientMode === "list" ? (
                <Box sx={{ px: 1.5, py: 1.25, bgcolor: alpha(m.navy, 0.02), borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                  <MollureFormField
                    placeholder="Search by name"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                    InputProps={{
                      endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
                    }}
                  />
                  {listResults.map((client) => (
                    <Box
                      key={client.id}
                      onClick={() => pickListClient(client)}
                      sx={{
                        mt: 1,
                        px: 1.25,
                        py: 1,
                        borderRadius: "8px",
                        cursor: "pointer",
                        bgcolor: "#fff",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        "&:hover": { bgcolor: alpha(m.navy, 0.02) },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                          {client.name}
                        </Typography>
                        {client.tags.includes("Mollure") ? (
                          <Chip
                            label="Mollure"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                            }}
                          />
                        ) : null}
                      </Stack>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                        {client.email}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {clientMode === "platform" ? (
                <Box sx={{ px: 1.5, py: 1.25, bgcolor: alpha(m.navy, 0.02), borderTop: `1px solid ${alpha(m.navy, 0.06)}` }}>
                  <MollureFormField
                    placeholder="Search by email"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                    InputProps={{
                      endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
                    }}
                  />
                  {platformResults.map((row) => (
                    <Box
                      key={row.id}
                      sx={{
                        mt: 1,
                        px: 1.25,
                        py: 1,
                        borderRadius: "8px",
                        bgcolor: "#fff",
                        border: `1px solid ${alpha(m.navy, 0.08)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86) }}>
                            {row.name}
                          </Typography>
                          <Chip
                            label="Mollure"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: alpha(m.teal, 0.12),
                              color: m.teal,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: alpha(m.navy, 0.5), mt: 0.25 }}>
                          {row.email}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        disableElevation
                        onClick={(e) => {
                          e.stopPropagation();
                          pickPlatformClient(row);
                        }}
                        sx={{
                          flexShrink: 0,
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 800,
                          fontSize: 11,
                          bgcolor: m.teal,
                          "&:hover": { bgcolor: m.tealDark },
                          height: 32,
                          px: 1.25,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Add To Client List
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Paper>
          ) : null}
        </Box>

        <Box>
          <BodyText sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.86), mb: 1.25 }}>Items</BodyText>

          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
                Product
              </Typography>
              <Stack spacing={0.75}>
                {productLines.map((line) => (
                  <ManualEntryLineCard
                    key={line.id}
                    line={line}
                    onEdit={() => setEditingLine(line)}
                    onDelete={() => removeLine(line.id)}
                  />
                ))}
                <ManualEntryAddButton label="Product" onClick={() => addLine("product")} />
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(m.navy, 0.55), mb: 0.75 }}>
                Unique Item
              </Typography>
              <Stack spacing={0.75}>
                {itemLines.map((line) => (
                  <ManualEntryLineCard
                    key={line.id}
                    line={line}
                    onEdit={() => setEditingLine(line)}
                    onDelete={() => removeLine(line.id)}
                  />
                ))}
                <ManualEntryAddButton label="Item" onClick={() => addLine("item")} />
              </Stack>
            </Box>

            {hasItems ? (
              <Box sx={{ pt: 0.5 }}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
                    Total Price:
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.88) }}>
                    {formatEurAmount(totalPrice)}
                  </Typography>
                </Stack>
                {discountOpen ? (
                  <Box sx={{ mt: 1 }}>
                    <MollureFormField
                      label="Discount (€)"
                      type="number"
                      value={discount === 0 ? "" : String(discount)}
                      onChange={(e) => setDiscount(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                      size="small"
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
                    />
                  </Box>
                ) : (
                  <Button
                    variant="text"
                    onClick={() => setDiscountOpen(true)}
                    sx={{
                      mt: 0.5,
                      p: 0,
                      minWidth: 0,
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: 12.5,
                      color: m.teal,
                      textDecoration: "underline",
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    + Discount
                  </Button>
                )}
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Stack>

      <ManualEntryLineEditModal
        open={Boolean(editingLine)}
        line={editingLine}
        onClose={() => setEditingLine(null)}
        onSave={updateLine}
      />
    </MollureDrawer>
  );
}
