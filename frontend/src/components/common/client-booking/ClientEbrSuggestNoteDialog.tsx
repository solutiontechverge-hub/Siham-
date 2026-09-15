"use client";

import EditRequestNoteDialog from "./EditRequestNoteDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
};

/** Suggest-changes notepad — thin wrapper over EditRequestNoteDialog. */
export default function ClientEbrSuggestNoteDialog(props: Props) {
  return (
    <EditRequestNoteDialog
      {...props}
      title="Suggest changes"
      description="Write the changes you want to suggest to the professional."
      placeholder="Describe your suggested changes…"
      confirmLabel="Ok"
      initialValue=""
    />
  );
}
