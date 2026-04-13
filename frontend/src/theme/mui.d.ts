import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    mainHeading: React.CSSProperties;
    subHeading: React.CSSProperties;
    description: React.CSSProperties;
    cardTitle: React.CSSProperties;
    bodyText: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    mainHeading?: React.CSSProperties;
    subHeading?: React.CSSProperties;
    description?: React.CSSProperties;
    cardTitle?: React.CSSProperties;
    bodyText?: React.CSSProperties;
  }

  interface MollurePalette {
    teal: string;
    tealDark: string;
    navy: string;
    slate: string;
    surface: string;
    footer: string;
    footerText: string;
    footerMuted: string;
    mintSoft: string;
    heroGradientStart: string;
    heroGradientEnd: string;
    heroGlow: string;
    chipBg: string;
    whiteOverlay: string;
    border: string;
    cardBorder: string;
    inputBorder: string;
    inputBorderHover: string;
    placeholder: string;
    headerHint: string;
    bodyText: string;
    avatarBg: string;
    star: string;
    logoPrimary: string;
    logoSecondary: string;
    logoAccent: string;
    logoText: string;
    bgshadow: string;
    cardbg: string;
    textcolorgrey700: string;
    headingText: string;
    descriptionText: string;
    warmwarning: string;
    white: string;
  }

  interface Palette {
    mollure: MollurePalette;
  }

  interface PaletteOptions {
    mollure?: Partial<MollurePalette>;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    mainHeading: true;
    subHeading: true;
    description: true;
    cardTitle: true;
    bodyText: true;
  }
}

export {};
