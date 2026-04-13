import * as React from "react";
import MuiTypography, { type TypographyProps } from "@mui/material/Typography";

type AppTypographyProps<C extends React.ElementType> = Omit<
  TypographyProps<C, { component?: C }>,
  "variant"
> & {
  /**
   * Needed for polymorphic `component={Link}` usage (Next.js),
   * where `href` is not part of base `TypographyProps`.
   */
  href?: unknown;
};

export function MainHeading<C extends React.ElementType = "h1">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="mainHeading" {...props} />;
}

export function SubHeading<C extends React.ElementType = "h2">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="subHeading" {...props} />;
}

export function Description<C extends React.ElementType = "p">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="description" {...props} />;
}

export function CardTitle<C extends React.ElementType = "h3">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="cardTitle" {...props} />;
}

export function BodyText<C extends React.ElementType = "p">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="bodyText" {...props} />;
}

/**
 * Escape hatch for legacy pages: use our theme-wired typography without importing MUI directly.
 * Prefer `MainHeading`, `SubHeading`, `Description`, `CardTitle`, `BodyText`.
 */
export function Typography<C extends React.ElementType = "p">(props: TypographyProps<C>) {
  return <MuiTypography {...props} />;
}

export type {
  TypographyProps as MuiTypographyProps,
};

