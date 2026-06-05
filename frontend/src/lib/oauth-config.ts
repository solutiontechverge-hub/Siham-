export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

export const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || "";

export const isGoogleSignInEnabled = () => Boolean(googleClientId);

export const isAppleSignInEnabled = () => Boolean(appleClientId);

export const getAppleRedirectUri = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/auth/login`;
};
