"use client";

import * as React from "react";
import { Button, CircularProgress, type ButtonProps } from "@mui/material";

type AppButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
};

export default function AppButton({
  children,
  disabled,
  isLoading = false,
  loadingText,
  ...props
}: AppButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
