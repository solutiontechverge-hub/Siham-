"use client";

import * as React from "react";

const OVERLAY_CLASS = "mollure-overlay-open";
let lockCount = 0;

function acquireOverlayScrollLock() {
  lockCount += 1;
  if (lockCount === 1) {
    document.documentElement.classList.add(OVERLAY_CLASS);
  }
}

function releaseOverlayScrollLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.classList.remove(OVERLAY_CLASS);
  }
}

/** Hides the page scrollbar while a drawer or modal overlay is open. */
export default function useOverlayScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    acquireOverlayScrollLock();
    return () => {
      releaseOverlayScrollLock();
    };
  }, [locked]);
}
