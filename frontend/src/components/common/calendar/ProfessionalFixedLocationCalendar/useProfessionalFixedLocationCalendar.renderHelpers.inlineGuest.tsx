"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BodyText } from "../../../ui/typography";
import AppButton from "../../AppButton";
import AppTextField from "../../AppTextField";
import { sanitizeNameInput } from "../../../../lib/field-input";
import type { InlineGuestDraftState } from "./useProfessionalFixedLocationCalendar.types";

export type RenderInlineGuestFieldsArgs = {
  m: { navy: string };
  inlineGuestFormRef: React.RefObject<HTMLDivElement | null>;
  inlineGuestParticipantType: "guest" | "model";
  inlineGuestDraft: InlineGuestDraftState;
  setInlineGuestDraft: React.Dispatch<
    React.SetStateAction<InlineGuestDraftState>
  >;
  isViewingExisting: boolean;
  editingInlineGuestId: string | null;
  addInlineGuest: () => void;
  cancelInlineGuestForm: () => void;
};

/** Inline guest/model form for card + panel variants. */
export function createRenderInlineGuestFields({
  m,
  inlineGuestFormRef,
  inlineGuestParticipantType,
  inlineGuestDraft,
  setInlineGuestDraft,
  isViewingExisting,
  editingInlineGuestId,
  addInlineGuest,
  cancelInlineGuestForm,
}: RenderInlineGuestFieldsArgs) {
  return (variant: "card" | "panel") => (
    <Box
      ref={variant === "panel" ? inlineGuestFormRef : undefined}
      {...(variant === "panel"
        ? { "data-booking-section": "inline-participant-form" }
        : {})}
      sx={
        variant === "panel"
          ? {
              borderRadius: "12px",
              bgcolor: alpha(m.navy, 0.025),
              border: `1px solid ${alpha(m.navy, 0.08)}`,
              p: 1.5,
            }
          : { width: "100%" }
      }
    >
      {variant === "panel" ? (
        <BodyText
          sx={{
            fontSize: 13,
            fontWeight: 900,
            color: alpha(m.navy, 0.82),
            mb: 1.25,
          }}
        >
          {inlineGuestParticipantType === "model" ? "Model" : "Guest"}
        </BodyText>
      ) : null}
      <Stack spacing={1.25} sx={{ mb: 1.25 }}>
        <AppTextField
          label="First Name"
          placeholder="Enter first name"
          value={inlineGuestDraft.firstName}
          onChange={(e) =>
            setInlineGuestDraft((prev) => ({
              ...prev,
              firstName: sanitizeNameInput(e.target.value),
            }))
          }
          fullWidth
          required
          disabled={isViewingExisting}
        />
        <AppTextField
          label="Last Name"
          placeholder="Optional"
          value={inlineGuestDraft.lastName}
          onChange={(e) =>
            setInlineGuestDraft((prev) => ({
              ...prev,
              lastName: sanitizeNameInput(e.target.value),
            }))
          }
          fullWidth
          disabled={isViewingExisting}
        />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
        <AppButton
          tone="primary"
          onClick={addInlineGuest}
          disabled={isViewingExisting}
          sx={{
            height: 38,
            minWidth: 96,
          }}
        >
          {editingInlineGuestId ? "Save" : "Add"}
        </AppButton>
        <AppButton
          tone="secondary"
          onClick={cancelInlineGuestForm}
          disabled={isViewingExisting}
          sx={{ height: 38, minWidth: 96 }}
        >
          Cancel
        </AppButton>
      </Stack>
    </Box>
  );
}
