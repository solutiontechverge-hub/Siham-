export const forgotPasswordPageData = {
  title: "Forget Password",
  subtitle: "No Worries, We'll Send You Reset Instructions",
  fields: {
    email: {
      label: "Email Address",
      placeholder: "e.g Jane",
    },
  },
  actions: {
    submit: "Send OTP",
    submitting: "Sending...",
  },
  rememberPasswordPrefix: "Remember your password?",
  backToLogin: {
    label: "Back to login",
    href: "/auth/login",
  },
  messages: {
    otpSentFallback: "OTP sent to your email if it exists in our system.",
    sendFailed: "Something went wrong while sending the OTP.",
  },
  redirectHref: "/auth/reset-password/verify-otp",
} as const;
