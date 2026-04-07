export const contactUsData = {
  headerTitle: "Contact Us",
  headerSubtitle: "Our Friendly Team Love To Hear From You.",
  whoAreYou: {
    label: "Who are you?",
    options: ["Client", "Professional", "Guest"],
  },
  fields: {
    name: { label: "Name", placeholder: "Sara" },
    email: { label: "Email", placeholder: "sara@gmail.com" },
    subject: {
      label: "Subject",
      placeholder: "Select Subject",
      options: [
        "General Inquiry",
        "Product Information",
        "Order / Booking Query",
        "Technical Support",
        "Complaint / Issue",
        "Refund / Cancellation Request",
        "Partnership / Collaboration",
      ],
    },
    message: { label: "Message", placeholder: "Sara" },
    consent: {
      label:
        "I agree to the processing of my data for support pursuant to the Privacy Policy",
    },
    submitLabel: "Send",
  },
  signInGate: {
    title: "Sign In",
    subtitle: "Welcome Back! Login To Access Your Account",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    rememberMe: "Remember Me",
    forgotPassword: "Forget Password?",
    submit: "Sign In",
    continueAsGuest: "Continue as Guest",
  },
} as const;

