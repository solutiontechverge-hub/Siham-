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

export type MessagingDeleteScope = "me" | "everyone";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: MessagingDeleteScope) => void;
  embedded?: boolean;
  mode?: "single" | "bulk" | "clear";
  initialScope?: MessagingDeleteScope;
};

export default function MessagingDeleteChatDialog({
  open,
  onClose,
  onConfirm,
  embedded = false,
  mode = "single",
  initialScope = "me",
}: Props) {
  const m = useTheme().palette.mollure;
  const [scope, setScope] = React.useState<MessagingDeleteScope>(initialScope);

  React.useEffect(() => {
    if (open) setScope(initialScope);
  }, [open, initialScope]);

  const isBulk = mode === "bulk";
  const isClear = mode === "clear";
  const title = isClear
    ? "Clear all messages in this chat?"
    : isBulk
      ? "Delete selected conversations?"
      : "Do you want to delete this chat?";

  return (
    <AppModal
      contentSx={{ px: 2.5 }}
      footerVariant="actions"
      headerTone="danger"
      open={open}
      title={title}
      onClose={onClose}
      embedded={embedded}
      footer={
        <>
          <MessagingModalCancelButton onClick={onClose} />
          <MessagingModalPrimaryButton
            label={isClear ? "Clear" : "Delete"}
            onClick={() => {
              onConfirm(isClear ? "me" : scope);
              onClose();
            }}
          />
        </>
      }
    >
      <Box sx={{ py: 1.5 }}>
        {isClear ? (
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.5),
              textAlign: "center",
            }}
          >
            Messages will be removed from your view. The professional will stay
            in your list.
          </Typography>
        ) : !isBulk ? (
          <RadioGroup
            value={scope}
            onChange={(_, value) => setScope(value as MessagingDeleteScope)}
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
                    color: alpha(m.navy, 0.7),
                  }}
                >
                  Delete for me
                </Typography>
              }
            />
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
                    color: alpha(m.navy, 0.7),
                  }}
                >
                  Delete for everyone
                </Typography>
              }
            />
          </RadioGroup>
        ) : (
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 600,
              color: alpha(m.navy, 0.5),
              textAlign: "center",
            }}
          >
            Selected conversations will be removed from your history.
          </Typography>
        )}
      </Box>
    </AppModal>
  );
}
