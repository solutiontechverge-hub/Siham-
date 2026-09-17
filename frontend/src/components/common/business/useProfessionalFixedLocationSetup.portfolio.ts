"use client";

import * as React from "react";
import {
  filterAllowedProfileImageFiles,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";

export type UseProfessionalFixedLocationSetupPortfolioArgs = {
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
};

/** Portfolio items / upload / delete (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupPortfolio({
  showSnackbar,
}: UseProfessionalFixedLocationSetupPortfolioArgs) {
  const portfolioInputRef = React.useRef<HTMLInputElement | null>(null);
  const [portfolioItemsFixed, setPortfolioItemsFixed] = React.useState<
    Array<{ id: string; src: string }>
  >([]);
  const [portfolioItemsDesired, setPortfolioItemsDesired] = React.useState<
    Array<{ id: string; src: string }>
  >([]);
  const activePortfolioTargetRef = React.useRef<"fixed" | "desired">("fixed");
  const portfolioLiveSyncRef = React.useRef(false);

  const setPortfolioItems = React.useCallback(
    (value: React.SetStateAction<Array<{ id: string; src: string }>>) => {
      const resolve = (prev: Array<{ id: string; src: string }>) =>
        typeof value === "function" ? value(prev) : value;
      if (activePortfolioTargetRef.current === "desired") {
        setPortfolioItemsDesired((prev) => {
          const next = resolve(prev);
          if (portfolioLiveSyncRef.current)
            setPortfolioItemsFixed(next.map((item) => ({ ...item })));
          return next;
        });
        return;
      }
      setPortfolioItemsFixed((prev) => {
        const next = resolve(prev);
        if (portfolioLiveSyncRef.current)
          setPortfolioItemsDesired(next.map((item) => ({ ...item })));
        return next;
      });
    },
    [],
  );

  const [selectedPortfolioIds, setSelectedPortfolioIds] = React.useState<
    Record<string, boolean>
  >({});
  const portfolioBlobUrlsRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      for (const url of portfolioBlobUrlsRef.current) URL.revokeObjectURL(url);
      portfolioBlobUrlsRef.current = [];
    };
  }, []);

  const togglePortfolio = React.useCallback((id: string) => {
    setSelectedPortfolioIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const onUploadPortfolio = React.useCallback(() => {
    portfolioInputRef.current?.click();
  }, []);

  const onPortfolioFilesSelected = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { allowed, rejected } = filterAllowedProfileImageFiles(
        Array.from(e.target.files ?? []),
      );
      if (rejected > 0 && !allowed.length) {
        showSnackbar({
          severity: "error",
          message: PROFILE_IMAGE_INVALID_MESSAGE,
        });
        e.target.value = "";
        return;
      }
      if (rejected > 0) {
        showSnackbar({
          severity: "warning",
          message: `${rejected} file(s) skipped. ${PROFILE_IMAGE_INVALID_MESSAGE}`,
        });
      }
      const next = allowed.map((f) => {
        const url = URL.createObjectURL(f);
        portfolioBlobUrlsRef.current.push(url);
        return {
          id: `pf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          src: url,
        };
      });
      setPortfolioItems((prev) => [...next, ...prev]);
      e.target.value = "";
    },
    [showSnackbar],
  );

  const deleteSelectedPortfolio = React.useCallback(() => {
    const selected = new Set(
      Object.entries(selectedPortfolioIds)
        .filter(([, v]) => v)
        .map(([k]) => k),
    );
    if (!selected.size) return;
    setPortfolioItems((prev) => prev.filter((it) => !selected.has(it.id)));
    setSelectedPortfolioIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const id of selected) delete next[id];
      return next;
    });
  }, [selectedPortfolioIds]);

  return {
    portfolioInputRef,
    portfolioItemsFixed,
    setPortfolioItemsFixed,
    portfolioItemsDesired,
    setPortfolioItemsDesired,
    activePortfolioTargetRef,
    portfolioLiveSyncRef,
    setPortfolioItems,
    selectedPortfolioIds,
    setSelectedPortfolioIds,
    portfolioBlobUrlsRef,
    togglePortfolio,
    onUploadPortfolio,
    onPortfolioFilesSelected,
    deleteSelectedPortfolio,
  };
}
