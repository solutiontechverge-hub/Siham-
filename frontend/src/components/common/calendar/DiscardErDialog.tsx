"use client";

import DiscardBookingDialog from "./DiscardBookingDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DiscardErDialog(props: Props) {
  return (
    <DiscardBookingDialog
      {...props}
      title="Discard edit request"
      body="This will discard the pending edit request and restore the last confirmed booking."
    />
  );
}
