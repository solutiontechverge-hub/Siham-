export const changePasswordPageData = {
  title: "Change Password",
  subtitle: "Enter your current password and choose a new one.",
  fields: {
    currentPassword: {
      label: "Current Password",
      placeholder: "Enter current password",
    },
    newPassword: {
      label: "New Password",
      placeholder: "Enter new password",
    },
    confirmPassword: {
      label: "Repeat New Password",
      placeholder: "Repeat new password",
    },
  },
  actions: {
    submit: "Update Password",
    submitting: "Updating...",
  },
  backLabel: "Back",
  messages: {
    checkPassword: "Please check your password.",
    passwordsMustMatch: "New password and repeat password must match.",
    chooseStrong: "Please choose a strong password to continue.",
    mustDiffer: "New password must be different from the current password.",
    success: "Password changed successfully.",
    failed: "Unable to change password.",
  },
} as const;
