"use client";

import CalendarWarningConfirmDialog from "./CalendarWarningConfirmDialog";

type CatalogItemDeleteDialogProps = {
  open: boolean;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CatalogItemDeleteDialog({
  open,
  itemName,
  onClose,
  onConfirm,
}: CatalogItemDeleteDialogProps) {
  const label = itemName?.trim() ? `"${itemName.trim()}"` : "this item";

  return (
    <CalendarWarningConfirmDialog
      open={open}
      onClose={onClose}
      title="Delete item"
      message={`Are you sure you want to permanently delete ${label}? This cannot be undone.`}
      buttons={[
        { label: "Cancel", tone: "secondary", onClick: onClose },
        {
          label: "Yes, Delete",
          tone: "danger",
          onClick: () => {
            onConfirm();
            onClose();
          },
        },
      ]}
    />
  );
}
