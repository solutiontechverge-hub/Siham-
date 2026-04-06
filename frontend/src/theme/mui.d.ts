import "@mui/material/styles";

declare module "@mui/material/styles" {
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
  }

  interface Palette {
    mollure: MollurePalette;
  }

  interface PaletteOptions {
    mollure?: Partial<MollurePalette>;
  }
}

export {};
