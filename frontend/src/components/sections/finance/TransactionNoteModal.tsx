"use client";

import AppButton from "../../common/AppButton";
import * as React from "react";
import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import AppModal from "../../common/AppModal";

type TransactionNoteModalProps = {
  open: boolean;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => void;
  onDelete?: () => void;
};

export default function TransactionNoteModal({
  open,
  initialNote = "",
  onClose,
  onSave,
  onDelete,
}: TransactionNoteModalProps) {
  const m = useTheme().palette.mollure;
  const [note, setNote] = React.useState("");
  const hasExistingNote = Boolean(initialNote.trim());

  React.useEffect(() => {
    if (!open) return;
    setNote(initialNote);
  }, [initialNote, open]);

  const handleSave = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Note"
      maxWidth="sm"
      footer={
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, width: "100%" }}
        >
          {hasExistingNote && onDelete ? (
            <AppButton
              onClick={() => {
                onDelete();
                onClose();
              }}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12.5,
                color: "#C62828",
                minWidth: 0,
                p: 0,
                "&:hover": {
                  bgcolor: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              Delete Note
            </AppButton>
          ) : (
            <span />
          )}
          <Stack direction="row" spacing={1}>
            <AppButton tone="secondary" onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={handleSave}
              disabled={!note.trim()}
            >
              Save
            </AppButton>
          </Stack>
        </Stack>
      }
    >
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
        <MollureFormField
          label="Note"
          placeholder="Create this to provide premium salon booking services"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          minRows={5}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: "10px",
            },
          }}
        />
      </Stack>
    </AppModal>
  );
}
