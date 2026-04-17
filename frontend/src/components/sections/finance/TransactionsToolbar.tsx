import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, IconButton, Popover, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSnackbar } from "../../common/AppSnackbar";
import MollureFormField from "../../common/MollureFormField";
import { BodyText } from "../../ui/typography";

export type TransactionsToolbarProps = {
  query: string;
  onQueryChange: (next: string) => void;
  onAddClick: (el: HTMLElement) => void;
  onMoreClick: (el: HTMLElement) => void;
  onFiltersClick?: () => void;
  fromDate?: string | null;
  toDate?: string | null;
  onFromDateChange?: (next: string | null) => void;
  onToDateChange?: (next: string | null) => void;
  dateRangeError?: string | null;
};

export default function TransactionsToolbar({
  query,
  onQueryChange,
  onAddClick,
  onMoreClick,
  onFiltersClick,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  dateRangeError,
}: TransactionsToolbarProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const [fromAnchor, setFromAnchor] = React.useState<HTMLElement | null>(null);
  const [toAnchor, setToAnchor] = React.useState<HTMLElement | null>(null);
  const [fromDraft, setFromDraft] = React.useState<string>(fromDate ?? "");
  const [toDraft, setToDraft] = React.useState<string>(toDate ?? "");

  React.useEffect(() => setFromDraft(fromDate ?? ""), [fromDate]);
  React.useEffect(() => setToDraft(toDate ?? ""), [toDate]);

  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const commonBtnSx = {
    borderRadius: "6px",
    textTransform: "none",
    fontWeight: 700,
    fontSize: 12.5,
    borderColor: alpha(m.navy, 0.14),
    color: alpha(m.navy, 0.78),
    bgcolor: "#fff",
    height: 34,
    px: 1.25,
  } as const;

  return (
    <Box sx={{ px: 2.25, py: 1.5 }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }}>
        <Box sx={{ flex: 1, maxWidth: { lg: 420 } }}>
          <MollureFormField
            placeholder="Search from Client list by name"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha(m.navy, 0.01),
                borderRadius: "10px",
              },
            }}
            InputProps={{
              endAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: alpha(m.navy, 0.45) }} />,
            }}
          />
        </Box>
        <Box sx={{ flex: 1, display: { xs: "none", lg: "block" } }} />
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent={{ xs: "flex-start", lg: "flex-end" }}
          sx={{ width: { xs: "100%", lg: "auto" } }}
        >
          <Button
            variant="outlined"
            onClick={(e) => setFromAnchor(e.currentTarget)}
            sx={commonBtnSx}
          >
            {fromDate ? `From: ${fromDate}` : "from date"}
          </Button>
          <Button
            variant="outlined"
            onClick={(e) => setToAnchor(e.currentTarget)}
            sx={commonBtnSx}
          >
            {toDate ? `To: ${toDate}` : "to date"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<TuneRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={onFiltersClick}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              borderColor: alpha(m.navy, 0.14),
              color: alpha(m.navy, 0.78),
              bgcolor: "#fff",
              height: 34,
              px: 1.25,
            }}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={(e) => onAddClick(e.currentTarget)}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: 12.5,
              height: 34,
              px: 1.25,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "mollure.tealDark" },
            }}
          >
            Add
          </Button>
          <IconButton
            size="small"
            onClick={(e) => onMoreClick(e.currentTarget)}
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              border: `1px solid ${alpha(m.navy, 0.14)}`,
              color: alpha(m.navy, 0.55),
            }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Popover
        open={Boolean(fromAnchor)}
        anchorEl={fromAnchor}
        onClose={() => {
          setFromAnchor(null);
          setFromDraft(fromDate ?? "");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 18px 44px rgba(16, 24, 40, 0.14)",
            p: 1.25,
            width: 280,
          },
        }}
      >
        <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.75), mb: 1 }}>
          From date
        </BodyText>
        <MollureFormField
          type="date"
          value={fromDraft}
          onChange={(e) => setFromDraft(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            max: toDate && toDate < today ? toDate : today,
          }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setFromAnchor(null);
              setFromDraft(fromDate ?? "");
            }}
            sx={{ ...commonBtnSx, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => {
              if (!fromDraft) {
                showSnackbar({ severity: "warning", message: "Please select a From date." });
                return;
              }
              onFromDateChange?.(fromDraft || null);
              setFromAnchor(null);
            }}
            sx={{
              height: 36,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
            }}
          >
            Apply
          </Button>
        </Stack>
      </Popover>

      <Popover
        open={Boolean(toAnchor)}
        anchorEl={toAnchor}
        onClose={() => {
          setToAnchor(null);
          setToDraft(toDate ?? "");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "12px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            boxShadow: "0 18px 44px rgba(16, 24, 40, 0.14)",
            p: 1.25,
            width: 280,
          },
        }}
      >
        <BodyText sx={{ fontSize: 12, fontWeight: 800, color: alpha(m.navy, 0.75), mb: 1 }}>
          To date
        </BodyText>
        <MollureFormField
          type="date"
          value={toDraft}
          onChange={(e) => setToDraft(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: fromDate ?? undefined,
            max: today,
          }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setToAnchor(null);
              setToDraft(toDate ?? "");
            }}
            sx={{ ...commonBtnSx, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => {
              if (!toDraft) {
                showSnackbar({ severity: "warning", message: "Please select a To date." });
                return;
              }
              onToDateChange?.(toDraft || null);
              setToAnchor(null);
            }}
            sx={{
              height: 36,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 800,
              bgcolor: m.teal,
              "&:hover": { bgcolor: m.tealDark },
            }}
          >
            Apply
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
}

