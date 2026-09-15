"use client";

import DiscardBookingDialog from "./DiscardBookingDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DiscardEbrDialog(props: Props) {
  return (
    <DiscardBookingDialog
      {...props}
      title="Discard edited booking request"
      body="This will end the edited booking request. The client will no longer be able to respond."
    />
  );
}
