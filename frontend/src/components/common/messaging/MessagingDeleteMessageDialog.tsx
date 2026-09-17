"use client";

import * as React from "react";
import { Box } from "@mui/material";
import MessagingDangerModal from "./MessagingDangerModal";
import MessagingDeleteScopeRadios, {
  type MessagingDeleteScopeOption,
} from "./MessagingDeleteScopeRadios";

export type MessagingMessageDeleteScope = MessagingDeleteScopeOption;

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
  const [scope, setScope] = React.useState<MessagingMessageDeleteScope>("me");

  React.useEffect(() => {
    if (open) setScope(canDeleteForEveryone ? "everyone" : "me");
  }, [canDeleteForEveryone, open]);

  return (
    <MessagingDangerModal
      open={open}
      onClose={onClose}
      title="Delete this message?"
      embedded={embedded}
      maxWidth="xs"
      onPrimary={() => {
        onConfirm(scope);
        onClose();
      }}
    >
      <Box sx={{ py: 1 }}>
        <MessagingDeleteScopeRadios
          value={scope}
          onChange={setScope}
          showEveryone={canDeleteForEveryone}
          labelOpacity={0.72}
        />
      </Box>
    </MessagingDangerModal>
  );
}
