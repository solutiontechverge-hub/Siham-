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
  removeTeamMemberAssignedService,
  setTeamMemberCategoryServices,
  TEAM_MEMBER_DRAFT_PREVIEW_ID,
  type TeamBusinessServiceRef,
  type TeamMemberFormDraft,
  type TeamMemberModalServiceContext,
  type TeamMemberServiceGroupSelection,
  type TeamServiceSlots,
} from "../../../data/businessTeamMemberModal.data";
import { teamMemberRatingFromApi } from "../../../lib/teamMemberReviews";

const EMPTY_MEMBER_REVIEWS = teamMemberRatingFromApi(0, 0);

export type TeamMemberUi = {
  id: string;
  /** Shared across Fixed/Desired templates; name+photo stay in sync. */
  personKey: string;
  name: string;
  role: string;
  photoSrc: string;
  pendingPhotoFile?: File | null;
  rating: number;
  reviewsLabel: string;
  services: TeamServiceSlots;
};

export type ReusableTeamMemberOption = {
  personKey: string;
  name: string;
  photoSrc: string;
  pendingPhotoFile?: File | null;
};

type UseBusinessTeamMemberModalArgs = {
  businessCategories: BusinessCategory[];
  businessServices: TeamBusinessServiceRef[];
  categoryTabs: ServiceCategoryTab[];
  teamMembers: TeamMemberUi[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMemberUi[]>>;
  reusableMembers?: ReusableTeamMemberOption[];
  onSyncIdentity?: (
    personKey: string,
    patch: {
      name: string;
      photoSrc: string;
      pendingPhotoFile?: File | null;
    },
  ) => void;
  onSaveBusinessSetup?: (members: TeamMemberUi[]) => Promise<void>;
  onMarkUnpublished?: () => void;
  onAfterLocalSave?: () => void;
};

function newPersonKey() {
  return `pk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useBusinessTeamMemberModal({
  businessCategories,
  businessServices,
  categoryTabs,
  teamMembers,
  setTeamMembers,
  reusableMembers = [],
  onSyncIdentity,
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
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(
    null,
  );
  const [draft, setDraft] = React.useState<TeamMemberFormDraft>(() =>
    createEmptyTeamMemberFormDraft(),
  );
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
      const personKey = draftState.personKey || newPersonKey();

      setTeamMembers((prev) => {
        const withoutPreview = prev.filter(
          (member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID,
        );

        if (editingMemberId) {
          return withoutPreview.map((member) =>
            member.id === editingMemberId
              ? {
                  ...member,
                  personKey: member.personKey || personKey,
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
          personKey,
          name: displayName,
          role: "Team member",
          photoSrc: draftState.photoSrc,
          pendingPhotoFile: draftState.pendingPhotoFile ?? null,
          rating: EMPTY_MEMBER_REVIEWS.rating,
          reviewsLabel: EMPTY_MEMBER_REVIEWS.reviewsLabel,
          services,
        };

        return [preview, ...withoutPreview];
      });
    },
    [editingMemberId, setTeamMembers],
  );

  const closeModal = React.useCallback(() => {
    setTeamMembers((prev) =>
      prev.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID),
    );
    setOpen(false);
    setEditingMemberId(null);
    setDraft(createEmptyTeamMemberFormDraft());
  }, [setTeamMembers]);

  const openAdd = React.useCallback(() => {
    setTeamMembers((prev) =>
      prev.filter((member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID),
    );
    setEditingMemberId(null);
    setDraft({
      ...createEmptyTeamMemberFormDraft(),
      categoryId: "",
      serviceId: "",
      personKey: "",
    });
    setOpen(true);
  }, [setTeamMembers]);

  const openEdit = React.useCallback(
    (member: TeamMemberUi) => {
      setEditingMemberId(member.id);
      setDraft({
        name: member.name,
        photoSrc: member.photoSrc,
        pendingPhotoFile: member.pendingPhotoFile ?? null,
        selectedGroups: groupsFromTeamService(
          member.services,
          businessCategories,
          serviceContext,
        ),
        categoryId: "",
        serviceId: "",
        personKey: member.personKey || member.id,
      });
      setOpen(true);
    },
    [businessCategories, serviceContext],
  );

  const updateDraft = React.useCallback(
    (patch: Partial<TeamMemberFormDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        if ("name" in patch || "photoSrc" in patch || "pendingPhotoFile" in patch) {
          syncDraftToMainScreen(next);
          const personKey = next.personKey?.trim();
          if (personKey && onSyncIdentity) {
            onSyncIdentity(personKey, {
              name: next.name.trim() || "New team member",
              photoSrc: next.photoSrc,
              pendingPhotoFile: next.pendingPhotoFile ?? null,
            });
          }
        }
        return next;
      });
    },
    [onSyncIdentity, syncDraftToMainScreen],
  );

  const chooseReusableMember = React.useCallback(
    (personKey: string) => {
      const key = String(personKey ?? "").trim();
      if (!key) {
        setDraft((prev) => ({
          ...prev,
          personKey: "",
          name: "",
          photoSrc: "",
          pendingPhotoFile: null,
        }));
        return;
      }
      const source = reusableMembers.find((member) => member.personKey === key);
      if (!source) return;
      setDraft((prev) => {
        const next = {
          ...prev,
          personKey: source.personKey,
          name: source.name,
          photoSrc: source.photoSrc,
          pendingPhotoFile: source.pendingPhotoFile ?? null,
        };
        syncDraftToMainScreen(next);
        return next;
      });
    },
    [reusableMembers, syncDraftToMainScreen],
  );

  const pickService = React.useCallback(
    (categoryId: string, serviceId: string) => {
      setDraft((prev) => {
        const next = addTeamMemberServiceSelection(
          { ...prev, categoryId, serviceId },
          businessCategories,
          serviceContext,
        );
        syncDraftToMainScreen(next);
        return { ...next, categoryId };
      });
    },
    [businessCategories, serviceContext, syncDraftToMainScreen],
  );

  const setCategoryServices = React.useCallback(
    (categoryId: string, serviceIds: string[]) => {
      setDraft((prev) => {
        const next = setTeamMemberCategoryServices(
          { ...prev, categoryId },
          categoryId,
          serviceIds,
          businessCategories,
          serviceContext,
        );
        syncDraftToMainScreen(next);
        return { ...next, categoryId };
      });
    },
    [businessCategories, serviceContext, syncDraftToMainScreen],
  );

  const setSelectedGroups = React.useCallback(
    (groups: TeamMemberServiceGroupSelection[]) => {
      setDraft((prev) => {
        const next = { ...prev, selectedGroups: groups };
        syncDraftToMainScreen(next);
        return next;
      });
    },
    [syncDraftToMainScreen],
  );

  const removeAssignedService = React.useCallback(
    (serviceId: string) => {
      setDraft((prev) => {
        const next = removeTeamMemberAssignedService(prev, serviceId);
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
        const personKey = next.personKey?.trim();
        if (personKey && onSyncIdentity) {
          onSyncIdentity(personKey, {
            name: next.name.trim() || "New team member",
            photoSrc: objectUrl,
            pendingPhotoFile: file,
          });
        }
        return next;
      });
    },
    [onSyncIdentity, syncDraftToMainScreen],
  );

  const canSubmit = draft.selectedGroups.some(
    (group) => group.subServiceIds.length > 0,
  );

  const saveModal = React.useCallback(async () => {
    let effectiveDraft = draft;
    if (draft.categoryId && draft.serviceId) {
      effectiveDraft = addTeamMemberServiceSelection(
        draft,
        businessCategories,
        serviceContext,
      );
    }

    if (
      !effectiveDraft.selectedGroups.some(
        (group) => group.subServiceIds.length > 0,
      )
    )
      return;

    const name = effectiveDraft.name.trim() || "New team member";
    const services = groupsToTeamService(effectiveDraft.selectedGroups);
    const role = "Team member";
    const personKey = effectiveDraft.personKey?.trim() || newPersonKey();
    let nextMembers: TeamMemberUi[];

    const persistedMembers = teamMembers.filter(
      (member) => member.id !== TEAM_MEMBER_DRAFT_PREVIEW_ID,
    );

    if (editingMemberId) {
      nextMembers = persistedMembers.map((member) =>
        member.id === editingMemberId
          ? {
              ...member,
              personKey: member.personKey || personKey,
              name,
              role,
              photoSrc: effectiveDraft.photoSrc,
              pendingPhotoFile: effectiveDraft.pendingPhotoFile ?? null,
              services,
            }
          : member,
      );
    } else {
      nextMembers = [
        {
          id: `tm-${Date.now()}`,
          personKey,
          name,
          role,
          photoSrc: effectiveDraft.photoSrc,
          pendingPhotoFile: effectiveDraft.pendingPhotoFile ?? null,
          rating: EMPTY_MEMBER_REVIEWS.rating,
          reviewsLabel: EMPTY_MEMBER_REVIEWS.reviewsLabel,
          services,
        },
        ...persistedMembers,
      ];
    }

    setTeamMembers(nextMembers);
    onSyncIdentity?.(personKey, {
      name,
      photoSrc: effectiveDraft.photoSrc,
      pendingPhotoFile: effectiveDraft.pendingPhotoFile ?? null,
    });
    onAfterLocalSave?.();
    closeModal();

    if (!onSaveBusinessSetup) {
      onMarkUnpublished?.();
      showSnackbar({
        severity: "success",
        message: editingMemberId
          ? "Team member updated."
          : "Team member added.",
      });
      return;
    }

    try {
      await onSaveBusinessSetup(nextMembers);
    } catch {
      onMarkUnpublished?.();
    }
  }, [
    businessCategories,
    closeModal,
    draft,
    editingMemberId,
    serviceContext,
    onAfterLocalSave,
    onMarkUnpublished,
    onSaveBusinessSetup,
    onSyncIdentity,
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
    reusableMembers,
    closeModal,
    openAdd,
    openEdit,
    updateDraft,
    pickService,
    setCategoryServices,
    setSelectedGroups,
    removeAssignedService,
    chooseReusableMember,
    choosePhoto,
    onPhotoSelected,
    saveModal,
    deleteMember,
    serviceContext,
  };
}
