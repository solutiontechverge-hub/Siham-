"use client";

import * as React from "react";
import type { BusinessCategory } from "../../../store/services/businessApi";
import {
  useCreateBusinessSubcategoryMutation,
  useGetBusinessCategoriesQuery,
} from "../../../store/services/businessApi";
import { useSnackbar } from "../../../components/common/AppSnackbar";
import {
  businessServiceModalCopy,
  createEmptyBusinessServiceFormDraft,
  draftFromMainService,
  draftFromSubservice,
  findSubcategoryIdByTitle,
  hasDuplicateServiceNameInCategory,
  mainServiceFromDraft,
  resolveBusinessCategoryRecord,
  subserviceFromDraft,
  type BusinessMainServiceUi,
  type BusinessServiceFormDraft,
  type BusinessServiceModalMode,
  type BusinessSubserviceUi,
} from "../../../data/businessServiceModal.data";

export type BusinessServiceModalTarget =
  | { kind: "service"; categoryId: string }
  | { kind: "subservice"; categoryId: string; parentServiceId: string };

type UseBusinessServiceModalArgs = {
  businessCategories: BusinessCategory[];
  mainServices: BusinessMainServiceUi[];
  subservices: BusinessSubserviceUi[];
  setMainServices: React.Dispatch<React.SetStateAction<BusinessMainServiceUi[]>>;
  setSubservices: React.Dispatch<React.SetStateAction<BusinessSubserviceUi[]>>;
  onPersistChange?: () => void;
  onMainServiceCreated?: (mainId: string) => void;
};

export function useBusinessServiceModal({
  businessCategories,
  mainServices,
  subservices,
  setMainServices,
  setSubservices,
  onPersistChange,
  onMainServiceCreated,
}: UseBusinessServiceModalArgs) {
  const { showSnackbar } = useSnackbar();
  const [createBusinessSubcategory] = useCreateBusinessSubcategoryMutation();
  const { refetch: refetchBusinessCategories } = useGetBusinessCategoriesQuery();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [mode, setMode] = React.useState<BusinessServiceModalMode>("service");
  const [draft, setDraft] = React.useState<BusinessServiceFormDraft>(() => createEmptyBusinessServiceFormDraft());
  const [editingMainId, setEditingMainId] = React.useState<string | null>(null);
  const [editingSubId, setEditingSubId] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<BusinessServiceModalTarget | null>(null);

  const modalTitle = React.useMemo(() => {
    if (mode === "subservice") {
      return editingSubId ? businessServiceModalCopy.editSubserviceTitle : businessServiceModalCopy.addSubserviceTitle;
    }
    return editingMainId ? businessServiceModalCopy.editServiceTitle : businessServiceModalCopy.addServiceTitle;
  }, [editingMainId, editingSubId, mode]);

  const submitLabel = React.useMemo(() => {
    if (editingMainId || editingSubId) return businessServiceModalCopy.updateLabel;
    return businessServiceModalCopy.addLabel;
  }, [editingMainId, editingSubId]);

  const closeModal = React.useCallback(() => {
    setOpen(false);
    setEditingMainId(null);
    setEditingSubId(null);
    setTarget(null);
    setDraft(createEmptyBusinessServiceFormDraft());
  }, []);

  const openAddService = React.useCallback((categoryId: string) => {
    setMode("service");
    setEditingMainId(null);
    setEditingSubId(null);
    setTarget({ kind: "service", categoryId });
    setDraft(createEmptyBusinessServiceFormDraft());
    setOpen(true);
  }, []);

  const openAddSubservice = React.useCallback(
    (categoryId: string, parentServiceId: string) => {
      const category = resolveBusinessCategoryRecord(categoryId, businessCategories);
      if (!category) {
        showSnackbar({
          severity: "error",
          message: "This category could not be found. Refresh the page and try again.",
        });
        return;
      }

      setMode("subservice");
      setEditingMainId(null);
      setEditingSubId(null);
      setTarget({ kind: "subservice", categoryId, parentServiceId });
      setDraft(createEmptyBusinessServiceFormDraft());
      setOpen(true);
    },
    [businessCategories, showSnackbar],
  );

  const openEditService = React.useCallback((main: BusinessMainServiceUi) => {
    setMode("service");
    setEditingMainId(main.id);
    setEditingSubId(null);
    setTarget({ kind: "service", categoryId: main.categoryId });
    setDraft(draftFromMainService(main));
    setOpen(true);
  }, []);

  const openEditSubservice = React.useCallback((sub: BusinessSubserviceUi) => {
    setMode("subservice");
    setEditingSubId(sub.id);
    setEditingMainId(null);
    setTarget({ kind: "subservice", categoryId: sub.categoryId, parentServiceId: sub.parentServiceId });
    setDraft(draftFromSubservice(sub));
    setOpen(true);
  }, []);

  const updateDraft = React.useCallback((patch: Partial<BusinessServiceFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const canSubmit = React.useMemo(() => draft.name.trim().length > 0, [draft.name]);

  const resolveCustomServiceId = React.useCallback(
    async (categoryId: string, serviceName: string): Promise<string | null> => {
      const categoryRecord = resolveBusinessCategoryRecord(categoryId, businessCategories);
      if (!categoryRecord) {
        showSnackbar({
          severity: "error",
          message: "This category could not be found. Refresh the page and try again.",
        });
        return null;
      }

      const resolvedCategoryId = String(categoryRecord.id);
      const trimmedName = serviceName.trim();

      if (
        hasDuplicateServiceNameInCategory(resolvedCategoryId, trimmedName, subservices, editingSubId)
      ) {
        showSnackbar({
          severity: "error",
          message: "A service with this name already exists in this category.",
        });
        return null;
      }

      const usedIds = new Set(
        subservices
          .filter(
            (item) =>
              item.id !== editingSubId && String(item.categoryId) === String(resolvedCategoryId),
          )
          .map((item) => String(item.serviceId)),
      );

      let categories = businessCategories;
      let existingId = findSubcategoryIdByTitle(resolvedCategoryId, trimmedName, categories);

      if (existingId) {
        if (usedIds.has(existingId)) {
          showSnackbar({
            severity: "error",
            message: "This service is already added to this category.",
          });
          return null;
        }
        return existingId;
      }

      try {
        const result = await createBusinessSubcategory({
          category_id: resolvedCategoryId,
          title: trimmedName,
        }).unwrap();

        return result.data?.id ? String(result.data.id) : null;
      } catch {
        const refreshed = await refetchBusinessCategories();
        categories = refreshed.data?.data ?? businessCategories;
        existingId = findSubcategoryIdByTitle(resolvedCategoryId, trimmedName, categories);

        if (existingId) {
          if (usedIds.has(existingId)) {
            showSnackbar({
              severity: "error",
              message: "This service is already added to this category.",
            });
            return null;
          }
          return existingId;
        }

        showSnackbar({
          severity: "error",
          message: "Unable to create this service. Please try again.",
        });
        return null;
      }
    },
    [
      businessCategories,
      createBusinessSubcategory,
      editingSubId,
      refetchBusinessCategories,
      showSnackbar,
      subservices,
    ],
  );

  const saveModal = React.useCallback(async () => {
    if (!target || !canSubmit || isSaving) return;

    onPersistChange?.();

    if (mode === "service") {
      const id = editingMainId ?? `main-${Date.now()}`;
      const next = mainServiceFromDraft(draft, id, target.categoryId);
      if (editingMainId) {
        setMainServices((prev) => prev.map((item) => (item.id === editingMainId ? next : item)));
      } else {
        setMainServices((prev) => [next, ...prev]);
        onMainServiceCreated?.(id);
      }
      closeModal();
      return;
    }

    setIsSaving(true);

    try {
      const existingSubservice = editingSubId
        ? subservices.find((item) => item.id === editingSubId)
        : undefined;

      const serviceId =
        existingSubservice?.serviceId ??
        (await resolveCustomServiceId(target.categoryId, draft.name));

      if (!serviceId) return;

      const categoryRecord = resolveBusinessCategoryRecord(target.categoryId, businessCategories);
      const category =
        categoryRecord ??
        businessCategories.find((item) =>
          item.subcategories.some((sub) => String(sub.id) === String(serviceId)),
        );
      const id = editingSubId ?? String(serviceId);
      const parentServiceId = target.kind === "subservice" ? target.parentServiceId : "";
      const resolvedCategoryId = category ? String(category.id) : String(target.categoryId);
      const next = subserviceFromDraft(
        draft,
        id,
        parentServiceId,
        resolvedCategoryId,
        serviceId,
        category?.title,
      );

      if (editingSubId) {
        setSubservices((prev) => prev.map((item) => (item.id === editingSubId ? next : item)));
      } else {
        setSubservices((prev) => [next, ...prev.filter((item) => item.serviceId !== serviceId)]);
      }
      closeModal();
    } finally {
      setIsSaving(false);
    }
  }, [
    businessCategories,
    canSubmit,
    closeModal,
    draft,
    editingMainId,
    editingSubId,
    isSaving,
    mode,
    onMainServiceCreated,
    onPersistChange,
    resolveCustomServiceId,
    setMainServices,
    setSubservices,
    subservices,
    target,
  ]);

  const deleteMainService = React.useCallback(
    (mainId: string) => {
      onPersistChange?.();
      setMainServices((prev) => prev.filter((item) => item.id !== mainId));
      setSubservices((prev) => prev.filter((item) => item.parentServiceId !== mainId));
    },
    [onPersistChange, setMainServices, setSubservices],
  );

  const deleteSubservice = React.useCallback(
    (subId: string) => {
      onPersistChange?.();
      setSubservices((prev) => prev.filter((item) => item.id !== subId));
    },
    [onPersistChange, setSubservices],
  );

  const subservicesByParent = React.useMemo(() => {
    const map = new Map<string, BusinessSubserviceUi[]>();
    for (const sub of subservices) {
      const key = sub.parentServiceId;
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(sub);
      map.set(key, list);
    }
    return map;
  }, [subservices]);

  const mainsByCategory = React.useMemo(() => {
    const map = new Map<string, BusinessMainServiceUi[]>();
    for (const main of mainServices) {
      const list = map.get(main.categoryId) ?? [];
      list.push(main);
      map.set(main.categoryId, list);
    }
    return map;
  }, [mainServices]);

  return {
    open,
    mode,
    draft,
    modalTitle,
    submitLabel,
    target,
    editingMainId,
    editingSubId,
    canSubmit,
    isSaving,
    closeModal,
    openAddService,
    openAddSubservice,
    openEditService,
    openEditSubservice,
    updateDraft,
    saveModal,
    deleteMainService,
    deleteSubservice,
    subservicesByParent,
    mainsByCategory,
    mainServices,
    subservices,
  };
}
