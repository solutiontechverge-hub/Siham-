"use client";

import ModalActionConfirmDialog from "../ModalActionConfirmDialog";
import { useSnackbar } from "../AppSnackbar";

export type ClientEbrActionKind = "accept" | "suggest" | "reject";
export type ClientRequestActionContext = "ebr" | "br" | "er";

type Props = {
  open: boolean;
  action: ClientEbrActionKind | null;
  /** Same dialog shell; BR / EBR / ER copy only. */
  context?: ClientRequestActionContext;
  onClose: () => void;
  onConfirm: () => void;
};

const EBR_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept EBR",
    body: "Confirm to accept these changes. They will be applied to your booking.",
    confirmLabel: "Accept",
    snackbarMessage: "Changes accepted. Your booking is confirmed.",
  },
  suggest: {
    title: "Suggest change EBR",
    body: "By choosing “Suggest changes”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Decline edited request",
    body: "These edited changes will not be applied. Your booking stays confirmed.",
    confirmLabel: "Decline",
    snackbarMessage: "Edit request rejected. Booking stays confirmed.",
    showWarning: true,
  },
};

const BR_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept request",
    body: "Confirm to accept this booking request. Your booking will be confirmed.",
    confirmLabel: "Accept",
    snackbarMessage: "Booking request accepted.",
  },
  suggest: {
    title: "Suggest changes",
    body: "By choosing “Suggest changes”, you can communicate your changes through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Reject request",
    body: "Confirm to reject this booking request. The booking will be marked Invalid.",
    confirmLabel: "Reject",
    snackbarMessage: "Booking request rejected.",
    showWarning: true,
  },
};

const ER_COPY: Record<
  ClientEbrActionKind,
  { title: string; body: string; confirmLabel: string; snackbarMessage?: string; showWarning?: boolean }
> = {
  accept: {
    title: "Accept edit request",
    body: "Confirm to accept this edit request. The professional can update the booking once.",
    confirmLabel: "Accept",
    snackbarMessage: "Edit request accepted.",
  },
  suggest: {
    title: "Suggest changes",
    body: "By choosing “Suggest changes”, you can communicate through the messaging tool.",
    confirmLabel: "Suggest changes",
  },
  reject: {
    title: "Reject edit request",
    body: "Confirm to reject this edit request. Your booking stays confirmed.",
    confirmLabel: "Reject",
    snackbarMessage: "Edit request rejected. Booking stays confirmed.",
    showWarning: true,
  },
};

export default function ClientEbrActionDialog({
  open,
  action,
  context = "ebr",
  onClose,
  onConfirm,
}: Props) {
  const { showSnackbar } = useSnackbar();
  if (!action) return null;

  const copy = (
    context === "br" ? BR_COPY : context === "er" ? ER_COPY : EBR_COPY
  )[action];

  return (
    <ModalActionConfirmDialog
      open={open}
      onClose={onClose}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      headerTone={action === "reject" ? "danger" : "default"}
      primaryTone={action === "reject" ? "danger" : "primary"}
      showWarning={Boolean(copy.showWarning)}
      onConfirm={() => {
        onConfirm();
        if (copy.snackbarMessage) {
          showSnackbar({
            severity: "success",
            message: copy.snackbarMessage,
          });
        }
      }}
    />
  );
}
