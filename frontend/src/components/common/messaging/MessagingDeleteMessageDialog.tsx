"use client";

import * as React from "react";
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingModalShell, { MessagingModalCancelButton, MessagingModalPrimaryButton } from "./MessagingModalShell";

export type MessagingMessageDeleteScope = "me" | "everyone";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: MessagingMessageDeleteScope) => void;
  canDeleteForEveryone: boolean;
  embedded?: boolean;
};

export default function MessagingDeleteMessageDialog({
  open,
  onClose,
  onConfirm,
  canDeleteForEveryone,
  embedded = false,
}: Props) {
  const m = useTheme().palette.mollure;
  const [scope, setScope] = React.useState<MessagingMessageDeleteScope>("me");

  React.useEffect(() => {
    if (open) setScope(canDeleteForEveryone ? "everyone" : "me");
  }, [canDeleteForEveryone, open]);

  return (
    <MessagingModalShell
      open={open}
      title="Delete message"
      onClose={onClose}
      embedded={embedded}
      maxWidth={360}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label="Delete"
            onClick={() => {
              onConfirm(scope);
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: alpha(m.navy, 0.55), mb: 1.5, textAlign: "center" }}>
          Delete this message?
        </Typography>
        <RadioGroup value={scope} onChange={(_, value) => setScope(value as MessagingMessageDeleteScope)}>
          <FormControlLabel
            value="me"
            control={<Radio size="small" sx={{ color: alpha(m.navy, 0.35), "&.Mui-checked": { color: m.teal } }} />}
            label={<Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>Delete for me</Typography>}
          />
          {canDeleteForEveryone ? (
            <FormControlLabel
              value="everyone"
              control={<Radio size="small" sx={{ color: alpha(m.navy, 0.35), "&.Mui-checked": { color: m.teal } }} />}
              label={
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                  Delete for everyone
                </Typography>
              }
            />
          ) : null}
        </RadioGroup>
      </Box>
    </MessagingModalShell>
  );
}
