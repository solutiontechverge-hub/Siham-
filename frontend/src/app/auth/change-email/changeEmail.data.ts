export const changeEmailPageData = {
  title: "Change Email",
  subtitle: "Enter your current password and a new email address.",
  fields: {
    currentEmail: {
      label: "Current Email",
      placeholder: "you@gmail.com",
    },
    newEmail: {
      label: "New Email",
      placeholder: "you@gmail.com",
    },
    currentPassword: {
      label: "Current Password",
      placeholder: "Enter current password",
    },
  },
  actions: {
    submit: "Update Email",
    submitting: "Updating...",
  },
  backLabel: "Back",
  messages: {
    success:
      "Check your new email for a confirmation link. Your address will update after you confirm.",
    failed: "Unable to request email change.",
    loadFailed: "Could not load your profile.",
    checkPassword: "Please check your password.",
  },
} as const;
