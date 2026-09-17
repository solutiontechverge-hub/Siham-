"use client";

import * as React from "react";
import AppTextField from "../AppTextField";
import ModalActionsFormDialog from "../ModalActionsFormDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
};

/** Required notepad before sending a Confirmed booking Edit Request (ER). */
export default function EditRequestNoteDialog({
  open,
  onClose,
  onConfirm,
  title = "Request to edit",
  description = "Write a short note explaining why you want to edit this booking. The other party will receive this request.",
  placeholder = "I want to edit this booking because…",
  confirmLabel = "Send request",
  initialValue = "",
}: Props) {
  const [note, setNote] = React.useState(initialValue);

  React.useEffect(() => {
    if (open) setNote(initialValue);
  }, [open, initialValue]);

  return (
    <ModalActionsFormDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      primaryDisabled={!note.trim()}
      onConfirm={() => {
        onConfirm(note.trim());
        onClose();
      }}
    >
      <AppTextField
        fullWidth
        multiline
        minRows={5}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
      />
    </ModalActionsFormDialog>
  );
}
