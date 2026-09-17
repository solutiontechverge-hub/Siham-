"use client";

import DiscardBookingDialog from "./DiscardBookingDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DiscardBrDialog(props: Props) {
  return (
    <DiscardBookingDialog
      {...props}
      title="Discard booking request"
      body="This will end the booking request. The client will no longer be able to respond."
    />
  );
}
