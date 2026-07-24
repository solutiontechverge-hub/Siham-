"use client";

import * as React from "react";
import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppModal, {
  MessagingModalCancelButton,
  MessagingModalPrimaryButton,
} from "../AppModal";

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
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      headerTone="danger"
      open={open}
      title="Delete this message?"
      onClose={onClose}
      embedded={embedded}
      maxWidth="xs"
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
        <RadioGroup
          value={scope}
          onChange={(_, value) =>
            setScope(value as MessagingMessageDeleteScope)
          }
        >
          <FormControlLabel
            value="me"
            control={
              <Radio
                size="small"
                sx={{
                  color: alpha(m.navy, 0.35),
                  "&.Mui-checked": { color: m.teal },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: alpha(m.navy, 0.72),
                }}
              >
                Delete for me
              </Typography>
            }
          />
          {canDeleteForEveryone ? (
            <FormControlLabel
              value="everyone"
              control={
                <Radio
                  size="small"
                  sx={{
                    color: alpha(m.navy, 0.35),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.72),
                  }}
                >
                  Delete for everyone
                </Typography>
              }
            />
          ) : null}
        </RadioGroup>
      </Box>
    </AppModal>
  );
}
