"use client";

import * as React from "react";
import AppDrawer from "../../common/AppDrawer";
import { FinanceDrawerActionsFooter } from "../../common/FinanceDrawerFooter";
import BookingAddUniqueItemScreen from "../../common/calendar/BookingAddUniqueItemScreen";
import {
  buildUniqueItemLine,
  emptyBookingUniqueItemDraft,
  getUniqueItemDraftErrors,
  type BookingUniqueItemDraft,
} from "../../../data/bookingUniqueItem.data";
import type { ManualEntryLine } from "./manualEntry.data";

type ManualEntryUniqueItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (line: ManualEntryLine) => void;
};

/** Unique-item create flow — same form as Calendar booking, in common AppDrawer. */
export default function ManualEntryUniqueItemModal({
  open,
  onClose,
  onSave,
}: ManualEntryUniqueItemModalProps) {
  const [draft, setDraft] = React.useState<BookingUniqueItemDraft>(
    emptyBookingUniqueItemDraft(),
  );
  const [attempted, setAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDraft(emptyBookingUniqueItemDraft());
    setAttempted(false);
  }, [open]);

  const errors = React.useMemo(
    () => (attempted ? getUniqueItemDraftErrors(draft) : {}),
    [attempted, draft],
  );

  const handleSave = () => {
    setAttempted(true);
    const line = buildUniqueItemLine(draft);
    if (!line) return;

    const effectiveUnitPrice =
      line.quantity > 0 ? line.price / line.quantity : line.unitPrice;

    onSave({
      id: line.id,
      sourceReference: line.id,
      sourceType: "uniqueItemCode",
      kind: "item",
      name: draft.productName.trim(),
      quantity: line.quantity,
      unitPrice: effectiveUnitPrice,
    });
    onClose();
  };

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Add Unique Item"
      onBack={onClose}
      contentVariant="muted"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      onFormSubmit={handleSave}
      footer={
        <FinanceDrawerActionsFooter
          onCancel={onClose}
          onPrimary={handleSave}
          primaryLabel="Save"
          primaryType="submit"
        />
      }
    >
      <BookingAddUniqueItemScreen
        draft={draft}
        errors={errors}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      />
    </AppDrawer>
  );
}
