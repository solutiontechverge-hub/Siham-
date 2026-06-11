"use client";

import * as React from "react";
import { Button, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import MollureModal from "../../common/MollureModal";

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
    <MollureModal
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
            <Button
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
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
              }}
            >
              Delete Note
            </Button>
          ) : (
            <span />
          )}
          <Stack direction="row" spacing={1}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                borderColor: alpha(m.navy, 0.14),
                color: alpha(m.navy, 0.72),
                bgcolor: "#fff",
                height: 36,
                px: 2.25,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSave}
              disabled={!note.trim()}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: m.teal,
                "&:hover": { bgcolor: m.tealDark },
                height: 36,
                px: 2.25,
              }}
            >
              Save
            </Button>
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
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } }}
        />
      </Stack>
    </MollureModal>
  );
}
