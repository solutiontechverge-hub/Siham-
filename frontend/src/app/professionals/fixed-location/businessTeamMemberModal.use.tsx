"use client";

import * as React from "react";
import type { BusinessCategory } from "../../../store/services/businessApi";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import type { ServiceCategoryTab } from "../../../data/businessServiceCategorySlider.data";
import {
  addTeamMemberServiceSelection,
  businessTeamMemberModalCopy,
  createEmptyTeamMemberFormDraft,
  groupsFromTeamService,
  groupsToTeamService,
  removeTeamMemberServiceGroup,
  TEAM_MEMBER_DRAFT_PREVIEW_ID,
  type TeamBusinessServiceRef,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
  type TeamServiceSlots,
} from "../../../data/businessTeamMemberModal.data";

export type TeamMemberUi = {
  id: string;
  name: string;
  role: string;
  photoSrc: string;
  pendingPhotoFile?: File | null;
  rating: number;
  reviewsLabel: string;
  services: TeamServiceSlots;
};

type UseBusinessTeamMemberModalArgs = {
  businessCategories: BusinessCategory[];
  businessServices: TeamBusinessServiceRef[];
  categoryTabs: ServiceCategoryTab[];
  teamMembers: TeamMemberUi[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  onSaveBusinessSetup?: (members: TeamMemberUi[]) => Promise<void>;
  onMarkUnpublished?: () => void;
  onAfterLocalSave?: () => void;
};

export function useBusinessTeamMemberModal({
  businessCategories,
  businessServices,
  categoryTabs,
  teamMembers,
  setTeamMembers,
  onSaveBusinessSetup,
  onMarkUnpublished,
  onAfterLocalSave,
}: UseBusinessTeamMemberModalArgs) {
  const serviceContext = React.useMemo<TeamMemberModalServiceContext>(
    () => ({ businessServices, categoryTabs }),
    [businessServices, categoryTabs],
  );
  const { showSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<TeamMemberFormDraft>(() => createEmptyTeamMemberFormDraft());
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const blobUrlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
      blobUrlsRef.current = [];
    };
  }, []);

  const modalTitle = editingMemberId
    ? businessTeamMemberModalCopy.editTitle
    : businessTeamMemberModalCopy.addTitle;

  const submitLabel = editingMemberId
    ? businessTeamMemberModalCopy.updateLabel
    : businessTeamMemberModalCopy.addLabel;

  const syncDraftToMainScreen = React.useCallback(
    (draftState: TeamMemberFormDraft) => {
      const services = groupsToTeamService(draftState.selectedGroups);
      const displayName = draftState.name.trim() || "New team member";

      setTeamMembers((prev) => {
        const withoutPreview = prev.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID);

        if (editingMemberId) {
          return withoutPreview.map((member) =>
            member.id === editingMemberId
              ? {
                  ...member,
                  name: displayName,
                  photoSrc: draftState.photoSrc,
                  pendingPhotoFile: draftState.pendingPhotoFile ?? null,
                  services,
                }
              : member,
          );
        }

        const preview: TeamMemberUi = {
          id: TEAM_MEMBER_DRAFT_PREVIEW_ID,
          name: displayName,
          role: "Team member",
          photoSrc: draftState.photoSrc,
          pendingPhotoFile: draftState.pendingPhotoFile ?? null,
          rating: 4.5,
          reviewsLabel: "(0 Reviews)",
          services,
        };

        return [preview, ...withoutPreview];
      });
    },
    [editingMemberId, setTeamMembers],
  );

  const closeModal = React.useCallback(() => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID));
    setOpen(false);
    setEditingMemberId(null);
    setDraft(createEmptyTeamMemberFormDraft());
  }, [setTeamMembers]);

  const openAdd = React.useCallback(() => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID));
    setEditingMemberId(null);
    setDraft(createEmptyTeamMemberFormDraft());
    setOpen(true);
  }, [setTeamMembers]);

  const openEdit = React.useCallback(
    (member: TeamMemberUi) => {
      setEditingMemberId(member.id);
      setDraft({
        name: member.name,
        photoSrc: member.photoSrc,
        pendingPhotoFile: member.pendingPhotoFile ?? null,
        selectedGroups: groupsFromTeamService(member.services, businessCategories, serviceContext),
        categoryId: "",
        serviceId: "",
      });
      setOpen(true);
    },
    [businessCategories, serviceContext],
  );

  const updateDraft = React.useCallback(
    (patch: Partial<TeamMemberFormDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        if ("name" in patch || "photoSrc" in patch) {
          syncDraftToMainScreen(next);
        }
        return next;
      });
    },
    [syncDraftToMainScreen],
  );

  const addServiceSelection = React.useCallback(() => {
    setDraft((prev) => {
      const next = addTeamMemberServiceSelection(prev, businessCategories, serviceContext);
      if (next !== prev) {
        syncDraftToMainScreen(next);
      }
      return next;
    });
  }, [businessCategories, serviceContext, syncDraftToMainScreen]);

  const removeServiceGroup = React.useCallback(
    (categoryId: string) => {
      setDraft((prev) => {
        const next = removeTeamMemberServiceGroup(prev, categoryId);
        syncDraftToMainScreen(next);
        return next;
      });
    },
    [syncDraftToMainScreen],
  );

  const choosePhoto = React.useCallback(() => {
    photoInputRef.current?.click();
  }, []);

  const onPhotoSelected = React.useCallback(
    (file: File, objectUrl: string) => {
      blobUrlsRef.current.push(objectUrl);
      setDraft((prev) => {
        const next = { ...prev, photoSrc: objectUrl, pendingPhotoFile: file };
        syncDraftToMainScreen(next);
        return next;
      });
    },
    [syncDraftToMainScreen],
  );

  const canSubmit = Boolean(draft.name.trim());

  const saveModal = React.useCallback(async () => {
    const name = draft.name.trim();
    if (!name) return;

    const services = groupsToTeamService(draft.selectedGroups);
    const role = "Team member";
    let nextMembers: TeamMemberUi[];

    const persistedMembers = teamMembers.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID);

    if (editingMemberId) {
      nextMembers = persistedMembers.map((member) =>
        member.id === editingMemberId
          ? {
              ...member,
              name,
              role,
              photoSrc: draft.photoSrc,
              pendingPhotoFile: draft.pendingPhotoFile ?? null,
              services,
            }
          : member,
      );
    } else {
      nextMembers = [
        {
          id: `tm-${Date.now()}`,
          name,
          role,
          photoSrc: draft.photoSrc,
          pendingPhotoFile: draft.pendingPhotoFile ?? null,
          rating: 4.5,
          reviewsLabel: "(0 Reviews)",
          services,
        },
        ...persistedMembers,
      ];
    }

    setTeamMembers(nextMembers);
    onAfterLocalSave?.();
    closeModal();

    if (!onSaveBusinessSetup) {
      onMarkUnpublished?.();
      showSnackbar({
        severity: "success",
        message: editingMemberId ? "Team member updated." : "Team member added.",
      });
      return;
    }

    try {
      await onSaveBusinessSetup(nextMembers);
    } catch {
      onMarkUnpublished?.();
    }
  }, [
    closeModal,
    draft.name,
    draft.photoSrc,
    draft.pendingPhotoFile,
    draft.selectedGroups,
    editingMemberId,
    onAfterLocalSave,
    onMarkUnpublished,
    onSaveBusinessSetup,
    setTeamMembers,
    showSnackbar,
    teamMembers,
  ]);

  const deleteMember = React.useCallback(
    (id: string) => {
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
      onMarkUnpublished?.();
    },
    [onMarkUnpublished, setTeamMembers],
  );

  return {
    open,
    draft,
    modalTitle,
    submitLabel,
    editingMemberId,
    canSubmit,
    photoInputRef,
    closeModal,
    openAdd,
    openEdit,
    updateDraft,
    addServiceSelection,
    removeServiceGroup,
    choosePhoto,
    onPhotoSelected,
    saveModal,
    deleteMember,
    serviceContext,
  };
}
