export const newPasswordPageData = {
  title: "Set New Password?",
  subtitle:
    "Your New Password Must Be Different From Your Previously Used Password",
  fields: {
    password: {
      label: "Password",
      placeholder: "Enter Password Here",
    },
    confirmPassword: {
      label: "Confirm Password",
      placeholder: "Enter Password Here",
    },
  },
  actions: {
    submit: "Reset Password",
    submitting: "Resetting...",
  },
  backToOtp: {
    label: "Back to OTP verification",
    href: "/auth/reset-password/verify-otp",
  },
  messages: {
    checkPassword: "Please check your password.",
    passwordsMustMatch: "Password and confirm password must match.",
    chooseStrong: "Please choose a strong password to continue.",
    otpRequired: "OTP verification is required before resetting the password.",
    resetSuccess: "Password reset successfully.",
    resetFailed: "Unable to reset password.",
  },
  redirectHref: "/auth/reset-password/success",
} as const;
