"use client";

import { Avatar, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppSearchField from "../../../../components/common/AppSearchField";
import AppModal from "../../../../components/common/AppModal";
import { FinanceDrawerActionsFooter } from "../../../../components/common/FinanceDrawerFooter";
import { mollureWhiteFieldInputSx } from "../../../../components/common/mollureFormSx";
import ClientPlatformTag from "../../../../components/common/ClientPlatformTag";
import { Typography } from "../../../../components/ui/typography";

export type MollureDirectoryHit = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  results: readonly MollureDirectoryHit[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function ClientAddMollureModal({
  open,
  onClose,
  onAdd,
  search,
  onSearchChange,
  results,
  selectedId,
  onSelect,
}: Props) {
  const theme = useTheme();
  const m = theme.palette.mollure;

  return (
<AppModal
  open={open}
  onClose={onClose}
  fullWidth
  maxWidth="sm"
  title="Add Mollure Client"
  contentMinHeight={360}
  footer={
    <FinanceDrawerActionsFooter
      onCancel={onClose}
      onPrimary={onAdd}
      primaryLabel="Add to Client List"
      primaryDisabled={!selectedId}
      spacing={1}
      stackSx={{ py: 2 }}
      primarySx={{
        borderRadius: "8px",
        textTransform: "none",
        fontWeight: 900,
        bgcolor: "primary.main",
        color: "#fff",
        "&:hover": { bgcolor: "mollure.tealDark" },
        height: 36,
        px: 2.25,
      }}
    />
  }
>
  <Box sx={{ px: 2.5, pb: 2 }}>
    <Box>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          color: alpha(m.navy, 0.55),
          mb: 0.75,
        }}
      >
        Search on Mollure by email
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: alpha(m.navy, 0.45),
          mb: 1,
        }}
      >
        Only clients with a confirmed or completed booking with you can be
        added.
      </Typography>
      <AppSearchField
        fullWidth
        placeholder="Search by email"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        sx={mollureWhiteFieldInputSx}
      />
    </Box>

    <Box
      sx={{
        mt: 1.5,
        borderRadius: "12px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {results.length === 0 ? (
        <Box sx={{ px: 1.6, py: 2.5, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: alpha(m.navy, 0.5),
            }}
          >
            No eligible Mollure clients found. Clients need a confirmed or
            completed booking first.
          </Typography>
        </Box>
      ) : (
        results.slice(0, 5).map((r, idx) => (
          <Box
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                onSelect(r.id);
            }}
            sx={{
              px: 1.6,
              py: 1.15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1.1,
              bgcolor:
                selectedId === r.id
                  ? alpha(theme.palette.primary.main, 0.06)
                  : "#fff",
              "&:hover": { bgcolor: alpha(m.navy, 0.03) },
              ...(idx > 0
                ? { borderTop: `1px solid ${alpha(m.navy, 0.08)}` }
                : null),
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: alpha(m.navy, 0.08),
                color: alpha(m.navy, 0.78),
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {r.name
                .split(" ")
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: alpha(m.navy, 0.86),
                    lineHeight: 1.2,
                  }}
                >
                  {r.name}
                </Typography>
                <ClientPlatformTag isMollure />
              </Stack>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: alpha(m.navy, 0.5),
                }}
              >
                {r.email}
              </Typography>
            </Box>
          </Box>
        ))
      )}
    </Box>
  </Box>
</AppModal>
  );
}
