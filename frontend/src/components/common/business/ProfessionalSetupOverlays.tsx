"use client";

import * as React from "react";
import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import AppButton from "../AppButton";
import AppModal, {
  AppModalCancelButton,
  AppModalPrimaryButton,
} from "../AppModal";
import AppDrawer from "../AppDrawer";
import { Typography } from "../../ui/typography";
import type { BusinessCategoryLike } from "../../../data/businessServiceCategorySlider.data";
import type {
  TeamMemberFormDraft,
  TeamMemberModalServiceContext,
  TeamMemberServiceGroupSelection,
} from "../../../data/businessTeamMemberModal.data";
import type {
  BusinessServiceFormDraft,
  BusinessServiceModalMode,
} from "../../../data/businessServiceModal.data";
import {
  CONFIGURABLE_SYNC_SECTION_IDS,
  SYNC_SECTION_LABELS,
  createDefaultTemplateSyncSettings,
  findIndependentToSyncNeedingSource,
  type ConfigurableSyncSectionId,
  type TemplateSyncSettings,
  type TemplateSyncSource,
  type TemplateSyncSources,
} from "../businessSetupTemplateSync";
import type { ShowSnackbarOptions } from "../AppSnackbar";
import TemplateSyncSettingsForm from "./TemplateSyncSettingsForm";
import BusinessServiceFormModal from "./BusinessServiceFormModal";
import BusinessTeamMemberFormModal from "./BusinessTeamMemberFormModal";
import type {
  OfferingOption,
  OfferingSelectOption,
} from "./useProfessionalFixedLocationSetup";

type TeamMemberFormModalSlice = {
  open: boolean;
  modalTitle: string;
  draft: TeamMemberFormDraft;
  submitLabel: string;
  canSubmit: boolean;
  serviceContext: TeamMemberModalServiceContext;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  closeModal: () => void;
  saveModal: () => void | Promise<void>;
  updateDraft: (patch: Partial<TeamMemberFormDraft>) => void;
  pickService: (categoryId: string, serviceId: string) => void;
  removeAssignedService: (serviceId: string) => void;
  choosePhoto: () => void;
  onPhotoSelected: (file: File, objectUrl: string) => void;
};

type ServiceFormModalSlice = {
  open: boolean;
  mode: BusinessServiceModalMode;
  modalTitle: string;
  draft: BusinessServiceFormDraft;
  submitLabel: string;
  isSaving: boolean;
  canSubmit: boolean;
  viewing: boolean;
  startEditing: () => void;
  closeModal: () => void;
  saveModal: () => void | Promise<void>;
  updateDraft: (patch: Partial<BusinessServiceFormDraft>) => void;
};

export type ProfessionalSetupOverlaysProps = {
  m: Theme["palette"]["mollure"];
  publishLabel: string;
  publishConfirmOpen: boolean;
  setPublishConfirmOpen: (open: boolean) => void;
  isBusinessSetupSaving: boolean;
  publishBlockedByValidation: boolean;
  onPublishBusinessSetup: () => void | Promise<void>;
  mediaDeleteConfirmOpen: boolean;
  setMediaDeleteConfirmOpen: (open: boolean) => void;
  onConfirmDeleteMedia: () => void;
  templateSyncModalOpen: boolean;
  setTemplateSyncModalOpen: (open: boolean) => void;
  templateSyncDrawerOpen: boolean;
  setTemplateSyncDrawerOpen: (open: boolean) => void;
  templateSyncDraft: TemplateSyncSettings;
  setTemplateSyncDraft: React.Dispatch<
    React.SetStateAction<TemplateSyncSettings>
  >;
  applyTemplateSyncSettings: (
    settings: TemplateSyncSettings,
    sources?: TemplateSyncSources,
  ) => void;
  sectionNeedsSyncSource: (sectionId: ConfigurableSyncSectionId) => boolean;
  businessFormDisabled: boolean;
  setBusinessOfferingSelect: (v: OfferingSelectOption) => void;
  onSwitchActiveBusinessTemplate: (opt: OfferingOption) => void;
  setIsBusinessPublishEnabled: (enabled: boolean) => void;
  showSnackbar: (options: ShowSnackbarOptions) => void;
  manageTeamDisabled: boolean;
  businessCategories: BusinessCategoryLike[];
  teamMemberModal: TeamMemberFormModalSlice;
  serviceModal: ServiceFormModalSlice;
};

export function ProfessionalSetupOverlays({
  m,
  publishLabel,
  publishConfirmOpen,
  setPublishConfirmOpen,
  isBusinessSetupSaving,
  publishBlockedByValidation,
  onPublishBusinessSetup,
  mediaDeleteConfirmOpen,
  setMediaDeleteConfirmOpen,
  onConfirmDeleteMedia,
  templateSyncModalOpen,
  setTemplateSyncModalOpen,
  templateSyncDrawerOpen,
  setTemplateSyncDrawerOpen,
  templateSyncDraft,
  setTemplateSyncDraft,
  applyTemplateSyncSettings,
  sectionNeedsSyncSource,
  businessFormDisabled,
  setBusinessOfferingSelect,
  onSwitchActiveBusinessTemplate,
  setIsBusinessPublishEnabled,
  showSnackbar,
  manageTeamDisabled,
  businessCategories,
  teamMemberModal,
  serviceModal,
}: ProfessionalSetupOverlaysProps) {
  const [pendingSyncSources, setPendingSyncSources] =
    React.useState<TemplateSyncSources>({});
  const [syncSourcePrompt, setSyncSourcePrompt] = React.useState<{
    sectionId: ConfigurableSyncSectionId;
    pendingDraft: TemplateSyncSettings;
  } | null>(null);
  const [syncSourceChoice, setSyncSourceChoice] =
    React.useState<TemplateSyncSource>("fixed");

  const handleTemplateSyncDraftChange = React.useCallback(
    (next: TemplateSyncSettings) => {
      const needingSource = findIndependentToSyncNeedingSource(
        templateSyncDraft,
        next,
        sectionNeedsSyncSource,
      );
      if (needingSource) {
        setSyncSourceChoice("fixed");
        setSyncSourcePrompt({
          sectionId: needingSource,
          pendingDraft: next,
        });
        return;
      }
      setPendingSyncSources((prev) => {
        const cleaned: TemplateSyncSources = { ...prev };
        for (const sectionId of CONFIGURABLE_SYNC_SECTION_IDS) {
          if (next[sectionId] !== "sync") delete cleaned[sectionId];
        }
        return cleaned;
      });
      setTemplateSyncDraft(next);
    },
    [sectionNeedsSyncSource, setTemplateSyncDraft, templateSyncDraft],
  );

  const closeTemplateSyncDrawer = React.useCallback(() => {
    setSyncSourcePrompt(null);
    setPendingSyncSources({});
    setTemplateSyncDrawerOpen(false);
  }, [setTemplateSyncDrawerOpen]);

  return (
    <>
      <AppModal
        open={publishConfirmOpen}
        onClose={() => {
          if (isBusinessSetupSaving) return;
          setPublishConfirmOpen(false);
        }}
        title="Publish changes?"
        maxWidth="xs"
        fullWidth
        contentSx={{ px: 2.5, py: 1 }}
        footerVariant="actions"
        footer={
          <>
            <AppModalCancelButton
              onClick={() => setPublishConfirmOpen(false)}
              disabled={isBusinessSetupSaving}
            />
            <AppModalPrimaryButton
              label={isBusinessSetupSaving ? "Publishing..." : publishLabel}
              onClick={() => void onPublishBusinessSetup()}
              disabled={isBusinessSetupSaving || publishBlockedByValidation}
            />
          </>
        }
      >
        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.68) }}>
          Your profile and business setup changes will go live for clients.
        </Typography>
      </AppModal>

      <AppModal
        open={mediaDeleteConfirmOpen}
        onClose={() => setMediaDeleteConfirmOpen(false)}
        title="Delete this image?"
        headerTone="danger"
        maxWidth="xs"
        fullWidth
        contentSx={{ px: 2.5, py: 1 }}
        footerVariant="actions"
        footer={
          <>
            <AppModalCancelButton
              onClick={() => setMediaDeleteConfirmOpen(false)}
            />
            <AppModalPrimaryButton
              tone="danger"
              label="Delete"
              onClick={onConfirmDeleteMedia}
            />
          </>
        }
      >
        <Typography sx={{ fontSize: 13, color: alpha(m.navy, 0.68) }}>
          This image will be removed from your business profile. Save your
          profile to apply the change.
        </Typography>
      </AppModal>

      <AppModal
        open={templateSyncModalOpen}
        onClose={() => {
          setBusinessOfferingSelect("Both");
          onSwitchActiveBusinessTemplate("Fixed Location");
          setIsBusinessPublishEnabled(true);
          setTemplateSyncModalOpen(false);
        }}
        title="Fixed and Desired location"
        maxWidth="xs"
        fullWidth
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => {
                setBusinessOfferingSelect("Both");
                onSwitchActiveBusinessTemplate("Fixed Location");
                setIsBusinessPublishEnabled(true);
                setTemplateSyncModalOpen(false);
              }}
              disabled={businessFormDisabled}
              sx={{
                px: 3,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={() => {
                applyTemplateSyncSettings(createDefaultTemplateSyncSettings());
                setBusinessOfferingSelect("Both");
                onSwitchActiveBusinessTemplate("Fixed Location");
                setTemplateSyncModalOpen(false);
                showSnackbar({
                  severity: "success",
                  message:
                    "Fixed and Desired location selected. Use settings to adjust sync anytime.",
                });
              }}
              disabled={businessFormDisabled}
              sx={{
                px: 3,
              }}
            >
              Save
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography
            sx={{ fontSize: 13, color: alpha(m.navy, 0.68), lineHeight: 1.55 }}
          >
            You are setting up both Fixed and Desired location templates. Use
            the settings icon next to Publish to choose how each section syncs
            between them — or keep the defaults and change this later.
          </Typography>
        </Box>
      </AppModal>

      <AppModal
        open={Boolean(syncSourcePrompt)}
        onClose={() => setSyncSourcePrompt(null)}
        title={
          syncSourcePrompt
            ? `Sync ${SYNC_SECTION_LABELS[syncSourcePrompt.sectionId]}?`
            : "Sync section?"
        }
        maxWidth="xs"
        fullWidth
        contentSx={{ px: 2.5, py: 1.5 }}
        footerVariant="actions"
        footer={
          <>
            <AppModalCancelButton onClick={() => setSyncSourcePrompt(null)} />
            <AppModalPrimaryButton
              label="Sync"
              onClick={() => {
                if (!syncSourcePrompt) return;
                const { sectionId, pendingDraft } = syncSourcePrompt;
                const sources: TemplateSyncSources = {
                  ...pendingSyncSources,
                  [sectionId]: syncSourceChoice,
                };
                applyTemplateSyncSettings(pendingDraft, sources);
                setPendingSyncSources({});
                setSyncSourcePrompt(null);
                showSnackbar({
                  severity: "success",
                  message: "Template sync settings saved.",
                });
              }}
            />
          </>
        }
      >
        <Typography
          sx={{ fontSize: 13, color: alpha(m.navy, 0.68), lineHeight: 1.5, mb: 1.5 }}
        >
          Choose which template is the source. Unique edits on the other
          template will be overwritten.
        </Typography>
        <RadioGroup
          value={syncSourceChoice}
          onChange={(e) =>
            setSyncSourceChoice(e.target.value as TemplateSyncSource)
          }
        >
          <FormControlLabel
            value="fixed"
            control={<Radio size="small" />}
            label="Fixed Location"
          />
          <FormControlLabel
            value="desired"
            control={<Radio size="small" />}
            label="Desired Location"
          />
        </RadioGroup>
      </AppModal>

      <AppDrawer
        anchor="right"
        open={templateSyncDrawerOpen}
        onClose={closeTemplateSyncDrawer}
        title="Template Sync Settings"
        subtitle="Control how each section is shared between your Fixed Location and Desired Location templates."
        contentSx={{ px: 2.5, py: 2 }}
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={closeTemplateSyncDrawer}
              disabled={businessFormDisabled}
              sx={{ px: 3 }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={() => {
                applyTemplateSyncSettings(templateSyncDraft, pendingSyncSources);
                setPendingSyncSources({});
                setTemplateSyncDrawerOpen(false);
                showSnackbar({
                  severity: "success",
                  message: "Template sync settings saved.",
                });
              }}
              disabled={businessFormDisabled}
              sx={{ px: 4 }}
            >
              Save
            </AppButton>
          </Stack>
        }
      >
        <TemplateSyncSettingsForm
          value={templateSyncDraft}
          disabled={businessFormDisabled}
          onChange={handleTemplateSyncDraftChange}
        />
      </AppDrawer>

      <BusinessTeamMemberFormModal
        open={teamMemberModal.open}
        title={teamMemberModal.modalTitle}
        draft={teamMemberModal.draft}
        submitLabel={teamMemberModal.submitLabel}
        disabled={manageTeamDisabled}
        canSubmit={teamMemberModal.canSubmit}
        businessCategories={businessCategories}
        serviceContext={teamMemberModal.serviceContext}
        photoInputRef={teamMemberModal.photoInputRef}
        onClose={teamMemberModal.closeModal}
        onSubmit={() => void teamMemberModal.saveModal()}
        onChange={teamMemberModal.updateDraft}
        onPickService={teamMemberModal.pickService}
        onRemoveAssignedService={teamMemberModal.removeAssignedService}
        onChoosePhoto={teamMemberModal.choosePhoto}
        onPhotoSelected={teamMemberModal.onPhotoSelected}
      />

      <BusinessServiceFormModal
        open={serviceModal.open}
        mode={serviceModal.mode}
        title={serviceModal.modalTitle}
        draft={serviceModal.draft}
        submitLabel={serviceModal.submitLabel}
        disabled={isBusinessSetupSaving || serviceModal.isSaving}
        canSubmit={serviceModal.canSubmit}
        readOnly={serviceModal.viewing}
        onEdit={() => {
          serviceModal.startEditing();
        }}
        onClose={serviceModal.closeModal}
        onSubmit={() => {
          void serviceModal.saveModal();
        }}
        onChange={serviceModal.updateDraft}
      />
    </>
  );
}
