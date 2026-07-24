"use client";

import * as React from "react";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  Checkbox,
  Collapse,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";
import {
  MESSAGING_REPORT_REASONS,
  type MessagingReportPayload,
  type MessagingReportReasonId,
} from "./messagingReportReasons";

export type { MessagingReportPayload };

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (payload: MessagingReportPayload) => void;
  embedded?: boolean;
};

export default function MessagingReportDialog({
  open,
  title,
  onClose,
  onSubmit,
  embedded = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const [reasonId, setReasonId] = React.useState<MessagingReportReasonId | "">(
    "",
  );
  const [otherText, setOtherText] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setReasonId("");
      setOtherText("");
      setDropdownOpen(false);
    }
  }, [open]);

  const selectedReason = MESSAGING_REPORT_REASONS.find(
    (r) => r.id === reasonId,
  );
  const isOther = reasonId === "other";
  const canSubmit =
    Boolean(reasonId) && (!isOther || otherText.trim().length > 0);

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      open={open}
      title={title}
      onClose={onClose}
      maxWidth="sm"
      embedded={embedded}
      headerTone="danger"
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Report"
            disabled={!canSubmit}
            onClick={() => {
              if (!selectedReason) return;
              onSubmit({
                reasonId: selectedReason.id,
                reasonLabel: selectedReason.label,
                otherText: isOther ? otherText.trim() : undefined,
              });
              onClose();
            }}
          />
        </>
      }
    >
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <ReportProblemRoundedIcon sx={{ fontSize: 56, color: "#E53935" }} />
        <Typography
          align="center"
          sx={{
            fontWeight: 900,
            fontSize: 15,
            color: alpha(m.navy, 0.82),
            px: 1,
          }}
        >
          Please tell us why you&apos;re reporting this user
        </Typography>
      </Stack>

      <FormControl fullWidth size="small">
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: alpha(m.navy, 0.72),
            mb: 0.75,
          }}
        >
          Reason
        </Typography>
        <Select
          open={dropdownOpen}
          onOpen={() => setDropdownOpen(true)}
          onClose={() => setDropdownOpen(false)}
          value={reasonId}
          displayEmpty
          renderValue={(selected) =>
            selected ? (
              (selectedReason?.label ?? "")
            ) : (
              <Typography
                component="span"
                sx={{
                  fontSize: 13,
                  color: alpha(m.navy, 0.42),
                  fontWeight: 500,
                }}
              >
                Select Reason
              </Typography>
            )
          }
          IconComponent={KeyboardArrowDownRoundedIcon}
          sx={{
            borderRadius: "8px",
            fontSize: 13,
            bgcolor: "#fff",
            "& .MuiSelect-select": { py: 1.25 },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(m.navy, 0.14),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(m.navy, 0.22),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: m.teal,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: { borderRadius: "10px", mt: 0.5, maxHeight: 360 },
            },
          }}
        >
          {MESSAGING_REPORT_REASONS.map((reason) => (
            <MenuItem
              key={reason.id}
              value={reason.id}
              onClick={() => {
                setReasonId(reason.id);
                setDropdownOpen(false);
              }}
              sx={{ py: 1.1, whiteSpace: "normal" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: alpha(m.navy, 0.62),
                    pr: 1,
                  }}
                >
                  {reason.label}
                </Typography>
                <Checkbox
                  size="small"
                  checked={reasonId === reason.id}
                  tabIndex={-1}
                  sx={{
                    p: 0.25,
                    color: alpha(m.navy, 0.3),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Collapse in={isOther}>
        <TextField
          fullWidth
          multiline
          minRows={4}
          placeholder="Write Reason"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              fontSize: 13,
              "& fieldset": { borderColor: alpha(m.navy, 0.12) },
            },
          }}
        />
      </Collapse>
    </AppModal>
  );
}
