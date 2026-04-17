import * as React from "react";
import MuiTypography, { type TypographyProps } from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

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

export function HeaderNavText<C extends React.ElementType = "span">(props: AppTypographyProps<C>) {
  return <MuiTypography variant="headerNav" {...props} />;
}

export function MarketingHeroTitle<C extends React.ElementType = "h1">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      whiteSpace: "pre-line",
      fontSize: { xs: "2.55rem", sm: "3.35rem", md: "4.05rem" },
      lineHeight: { xs: 1.08, md: 1.03 },
      fontWeight: 700,
      letterSpacing: "-0.04em",
      color: "text.primary",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      component="h1"
      {...rest}
      sx={mergedSx}
    />
  );
}

export function MarketingHeroDescription<C extends React.ElementType = "p">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      whiteSpace: "pre-line",
      fontSize: { xs: "1rem", md: "1.0625rem" },
      lineHeight: 1.5,
      color: (theme) => alpha(theme.palette.mollure.navy, 0.55),
    },
    { maxWidth: 500 },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      component="p"
      {...rest}
      sx={mergedSx}
    />
  );
}

export function MarketingSectionTitle<C extends React.ElementType = "h2">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      fontWeight: 600,
      color: "mollure.textcolorgrey700",
      textAlign: "center",
      fontSize: { xs: "1.75rem", md: "2.15rem" },
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      component="h2"
      {...rest}
      sx={mergedSx}
    />
  );
}

export function MarketingSectionSubtitle<C extends React.ElementType = "p">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      fontWeight: 400,
      color: (theme) => alpha(theme.palette.mollure.navy, 0.55),
      textAlign: "center",
      fontSize: { xs: "0.85rem", md: "0.95rem" },
      lineHeight: 1.55,
      maxWidth: 620,
      mx: "auto",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      component="p"
      {...rest}
      sx={mergedSx}
    />
  );
}

export function MarketingKpiTitle<C extends React.ElementType = "div">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      fontWeight: 700,
      color: "mollure.textcolorgrey700",
      fontSize: { xs: 16, md: 21 },
      lineHeight: 1.1,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      {...rest}
      sx={mergedSx}
    />
  );
}

export function MarketingKpiSubtitle<C extends React.ElementType = "div">(props: AppTypographyProps<C>) {
  const { sx, ...rest } = props;
  const mergedSx: SxProps<Theme> = [
    {
      color: "text.secondary",
      fontSize: { xs: "0.71875rem", md: "0.875rem" },
      mt: 0.45,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];
  return (
    <MuiTypography
      variant="bodyText"
      {...rest}
      sx={mergedSx}
    />
  );
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

