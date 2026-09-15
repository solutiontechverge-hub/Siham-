"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import AppButton from "../../common/AppButton";
import * as React from "react";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MollureFormField from "../../common/MollureFormField";
import AppModal from "../../common/AppModal";
import { ModalCancelApplyFooter } from "../../common/FinanceDrawerFooter";
import { mollureWhiteFieldInputSx } from "../../common/mollureFormSx";
import { INPUT_LIMITS, parseText } from "../../../lib/inputSchema";

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
    const parsed = parseText(note, {
      label: "Note",
      min: INPUT_LIMITS.notesMin,
      max: null,
    });
    if (!parsed.ok) return;
    onSave(parsed.value);
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
              sx={mollureLabelSx(m.navy, { textTransform: "none", color: "#C62828", minWidth: 0, p: 0, "&:hover": {
                  bgcolor: "transparent",
                  textDecoration: "underline",
                } })}
            >
              Delete Note
            </AppButton>
          ) : (
            <span />
          )}
          <ModalCancelApplyFooter
            onCancel={onClose}
            onPrimary={handleSave}
            primaryLabel="Save"
            primaryDisabled={!note.trim()}
            buttonSx={{}}
            stackSx={{ px: 0, py: 0 }}
          />
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
          sx={mollureWhiteFieldInputSx}
        />
      </Stack>
    </AppModal>
  );
}
