export const verifyOtpPageData = {
  title: "Reset Password",
  subtitle:
    "Enter The 6 Digit Verification Code That Was Sent To Your Email To Change Your Password",
  actions: {
    submit: "Send OTP",
    submitting: "Verifying...",
    resend: "Resend",
    resending: "Resending...",
  },
  didntReceivePrefix: "Didn't receive a code?",
  backToForgotPassword: {
    label: "Back to forgot password",
    href: "/auth/forgot-password",
  },
  messages: {
    otpVerified: "OTP verified. You can now set a new password.",
    verifyFailed: "OTP verification failed.",
    enterEmailFirst: "Email missing. Go back to forgot password first.",
    otpResentFallback: "OTP sent again.",
    resendFailed: "Unable to resend OTP.",
  },
  redirectHref: "/auth/reset-password/new",
} as const;
