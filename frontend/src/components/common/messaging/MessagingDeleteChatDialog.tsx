"use client";

import { mollureBodyMutedSx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MessagingDangerModal from "./MessagingDangerModal";
import MessagingDeleteScopeRadios, {
  type MessagingDeleteScopeOption,
} from "./MessagingDeleteScopeRadios";

export type MessagingDeleteScope = MessagingDeleteScopeOption;

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
  const isBulk = mode === "bulk";
  const isClear = mode === "clear";

  React.useEffect(() => {
    if (open) setScope(initialScope);
  }, [open, initialScope]);

  const mutedBody = (
    <Typography
      sx={{
        ...mollureBodyMutedSx(m.navy),
        textAlign: "center",
      }}
    >
      {isClear
        ? "Messages will be removed from your view. The professional will stay in your list."
        : "Selected conversations will be removed from your history."}
    </Typography>
  );

  return (
    <MessagingDangerModal
      open={open}
      onClose={onClose}
      title={
        isClear
          ? "Clear all messages in this chat?"
          : isBulk
            ? "Delete selected conversations?"
            : "Do you want to delete this chat?"
      }
      embedded={embedded}
      primaryLabel={isClear ? "Clear" : "Delete"}
      onPrimary={() => {
        onConfirm(isClear ? "me" : scope);
        onClose();
      }}
    >
      <Box sx={{ py: 1.5 }}>
        {isClear || isBulk ? (
          mutedBody
        ) : (
          <MessagingDeleteScopeRadios value={scope} onChange={setScope} />
        )}
      </Box>
    </MessagingDangerModal>
  );
}
