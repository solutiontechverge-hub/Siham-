import AppButton from "../../common/AppButton";
import * as React from "react";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Box, IconButton, Popover, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSnackbar } from "../../common/AppSnackbar";
import AppDatePicker from "../../common/AppDatePicker";
import AppSearchField from "../../common/AppSearchField";
import { BodyText } from "../../ui/typography";

export type TransactionsToolbarProps = {
  query: string;
  onQueryChange: (next: string) => void;
  onAddClick: (el: HTMLElement) => void;
  onMoreClick: (el: HTMLElement) => void;
  onFiltersClick?: () => void;
  disableAdd?: boolean;
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
  disableAdd = false,
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
  const hasAppliedDateRange = Boolean(fromDate && toDate);

  const handleResetDateRange = React.useCallback(() => {
    onFromDateChange?.(null);
    onToDateChange?.(null);
    setFromDraft("");
    setToDraft("");
    setFromAnchor(null);
    setToAnchor(null);
  }, [onFromDateChange, onToDateChange]);

  const commonBtnSx = {
    height: 40,
    px: 1.5,
    fontSize: 12.5,
  } as const;

  return (
    <Box sx={{ px: 2.25, py: 1.5 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        alignItems={{ lg: "center" }}
      >
        <Box sx={{ flex: 1, maxWidth: { lg: 420 } }}>
          <AppSearchField
            fullWidth
            size="small"
            placeholder="Search by Booking ID, client name or email"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onClear={() => onQueryChange("")}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 40,
                bgcolor: alpha(m.navy, 0.01),
              },
            }}
          />
        </Box>
        <Box sx={{ flex: 1, display: { xs: "none", lg: "block" } }} />
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          justifyContent={{ xs: "flex-start", lg: "flex-end" }}
          sx={{ width: { xs: "100%", lg: "auto" } }}
        >
          <AppButton
            tone="secondary"
            onClick={(e) => setFromAnchor(e.currentTarget)}
            sx={commonBtnSx}
          >
            {fromDate ? `From: ${fromDate}` : "from date"}
          </AppButton>
          <AppButton
            tone="secondary"
            onClick={(e) => setToAnchor(e.currentTarget)}
            sx={commonBtnSx}
          >
            {toDate ? `To: ${toDate}` : "to date"}
          </AppButton>
          {hasAppliedDateRange ? (
            <AppButton
              tone="secondary"
              onClick={handleResetDateRange}
              sx={commonBtnSx}
            >
              Reset
            </AppButton>
          ) : null}
          <AppButton
            tone="secondary"
            startIcon={<TuneRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={onFiltersClick}
            sx={commonBtnSx}
          >
            Filters
          </AppButton>
          <AppButton
            tone="primary"
            disabled={disableAdd}
            onClick={(e) => onAddClick(e.currentTarget)}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            sx={commonBtnSx}
          >
            Add
          </AppButton>
          <IconButton
            size="small"
            aria-label="More actions"
            aria-haspopup="menu"
            onClick={(e) => onMoreClick(e.currentTarget)}
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "10px",
              border: `1px solid ${alpha(m.navy, 0.12)}`,
              bgcolor: "#fff",
              color: alpha(m.navy, 0.72),
              "&:hover": { bgcolor: alpha(m.navy, 0.03) },
            }}
          >
            <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 18px 44px rgba(16, 24, 40, 0.14)",
            p: 1.25,
            width: 280,
          },
        }}
      >
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: alpha(m.navy, 0.75),
            mb: 1,
          }}
        >
          From date
        </BodyText>
        <AppDatePicker
          value={fromDraft}
          onChange={(iso) => setFromDraft(iso)}
          max={toDate && toDate < today ? toDate : today}
          fullWidth
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <AppButton
            tone="secondary"
            fullWidth
            onClick={() => {
              setFromAnchor(null);
              setFromDraft(fromDate ?? "");
            }}
            sx={{ height: 40 }}
          >
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            fullWidth
            onClick={() => {
              if (!fromDraft) {
                showSnackbar({
                  severity: "warning",
                  message: "Please select a From date.",
                });
                return;
              }
              onFromDateChange?.(fromDraft || null);
              setFromAnchor(null);
            }}
          >
            Apply
          </AppButton>
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
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 18px 44px rgba(16, 24, 40, 0.14)",
            p: 1.25,
            width: 280,
          },
        }}
      >
        <BodyText
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: alpha(m.navy, 0.75),
            mb: 1,
          }}
        >
          To date
        </BodyText>
        <AppDatePicker
          value={toDraft}
          onChange={(iso) => setToDraft(iso)}
          min={fromDate ?? undefined}
          max={today}
          fullWidth
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <AppButton
            tone="secondary"
            fullWidth
            onClick={() => {
              setToAnchor(null);
              setToDraft(toDate ?? "");
            }}
            sx={{ height: 40 }}
          >
            Cancel
          </AppButton>
          <AppButton
            tone="primary"
            fullWidth
            onClick={() => {
              if (!toDraft) {
                showSnackbar({
                  severity: "warning",
                  message: "Please select a To date.",
                });
                return;
              }
              onToDateChange?.(toDraft || null);
              setToAnchor(null);
            }}
          >
            Apply
          </AppButton>
        </Stack>
      </Popover>
    </Box>
  );
}
