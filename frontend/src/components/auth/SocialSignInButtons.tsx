"use client";

import * as React from "react";
import AppleIcon from "@mui/icons-material/Apple";
import { Box, Button, Stack, SvgIcon } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  appleClientId,
  getAppleRedirectUri,
  googleClientId,
  isAppleSignInEnabled,
  isGoogleSignInEnabled,
} from "../../lib/oauth-config";
import {
  useLoginWithAppleMutation,
  useLoginWithGoogleMutation,
} from "../../store/services/authApi";
import type { AuthLoginPayload } from "../../hooks/useAuthSessionLogin";

function GoogleLogoIcon(props: React.ComponentProps<typeof SvgIcon>) {
  return (
    <SvgIcon viewBox="0 0 24 24" fontSize="small" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </SvgIcon>
  );
}

type AppleAuthResponse = {
  authorization: {
    id_token: string;
  };
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<AppleAuthResponse>;
      };
    };
  }
}

const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

let appleScriptPromise: Promise<void> | null = null;

const loadAppleScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.AppleID) {
    return Promise.resolve();
  }

  if (appleScriptPromise) {
    return appleScriptPromise;
  }

  appleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SCRIPT_SRC}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Apple script failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Apple script failed to load."));
    document.body.appendChild(script);
  });

  return appleScriptPromise;
};

type SocialSignInButtonsProps = {
  onLoginSuccess: (data: AuthLoginPayload) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export default function SocialSignInButtons({
  onLoginSuccess,
  onError,
  disabled = false,
}: SocialSignInButtonsProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();
  const [loginWithApple, { isLoading: isAppleLoading }] = useLoginWithAppleMutation();
  const [appleReady, setAppleReady] = React.useState(false);

  const socialButtonSx = {
    minHeight: 42,
    borderRadius: "8px",
    textTransform: "none" as const,
    bgcolor: alpha(m.navy, 0.045),
    color: alpha(m.navy, 0.78),
    fontWeight: 600,
    border: `1px solid ${alpha(m.navy, 0.08)}`,
    "&:hover": { bgcolor: alpha(m.navy, 0.07), borderColor: alpha(m.navy, 0.12) },
  };

  const isBusy = disabled || isGoogleLoading || isAppleLoading;

  React.useEffect(() => {
    if (!isAppleSignInEnabled()) {
      return;
    }

    loadAppleScript()
      .then(() => {
        window.AppleID?.auth.init({
          clientId: appleClientId,
          scope: "name email",
          redirectURI: getAppleRedirectUri(),
          usePopup: true,
        });
        setAppleReady(true);
      })
      .catch(() => {
        setAppleReady(false);
      });
  }, []);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError("Google sign-in did not return a credential.");
      return;
    }

    try {
      const result = await loginWithGoogle({ id_token: response.credential }).unwrap();
      onLoginSuccess(result.data);
    } catch (error) {
      onError(getApiErrorMessage(error, "Google sign-in failed."));
    }
  };

  const handleAppleClick = async () => {
    if (!isAppleSignInEnabled()) {
      onError("Apple sign-in is not configured yet.");
      return;
    }

    if (!appleReady || !window.AppleID) {
      onError("Apple sign-in is still loading. Please try again.");
      return;
    }

    try {
      const appleResponse = await window.AppleID.auth.signIn();
      const result = await loginWithApple({
        id_token: appleResponse.authorization.id_token,
        first_name: appleResponse.user?.name?.firstName,
        last_name: appleResponse.user?.name?.lastName,
      }).unwrap();
      onLoginSuccess(result.data);
    } catch (error) {
      onError(getApiErrorMessage(error, "Apple sign-in failed."));
    }
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <Box sx={{ position: "relative", flex: 1 }}>
        <Button
          type="button"
          fullWidth
          disabled={isBusy || !isGoogleSignInEnabled()}
          sx={socialButtonSx}
          startIcon={<GoogleLogoIcon sx={{ fontSize: 20 }} />}
        >
          Continue with Google
        </Button>
        {isGoogleSignInEnabled() ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.01,
              overflow: "hidden",
              "& > div": { height: "100%", width: "100%" },
              "& iframe": { width: "100% !important", height: "100% !important" },
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => onError("Google sign-in was cancelled or failed.")}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </Box>
        ) : null}
      </Box>

      <Button
        type="button"
        fullWidth
        disabled={isBusy || !isAppleSignInEnabled()}
        onClick={handleAppleClick}
        sx={{ ...socialButtonSx, flex: 1 }}
        startIcon={<AppleIcon sx={{ fontSize: 20 }} />}
      >
        Continue With Apple
      </Button>
    </Stack>
  );
}
