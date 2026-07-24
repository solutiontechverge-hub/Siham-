/** Default placeholder copy for the Terms & Conditions page. */

export const termsPageData = {
  title: "Terms & Conditions",
  lastUpdated: "July 24, 2026",
  intro:
    "Welcome to Mollure. These Terms & Conditions outline the rules and guidelines for using our platform. By accessing or using Mollure, you agree to these terms. Please read them carefully.",
  sections: [
    {
      id: "acceptance",
      heading: "1. Acceptance of Terms",
      paragraphs: [
        "By creating an account, booking a service, or otherwise using Mollure, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy.",
        "If you do not agree with any part of these terms, you should not use the platform.",
      ],
    },
    {
      id: "accounts",
      heading: "2. Accounts and Eligibility",
      paragraphs: [
        "You must provide accurate and complete information when registering. You are responsible for keeping your login credentials secure and for all activity under your account.",
        "Professionals and businesses must ensure that the information they publish about their services, availability, and pricing is truthful and up to date.",
      ],
    },
    {
      id: "bookings",
      heading: "3. Bookings and Services",
      paragraphs: [
        "Mollure connects clients with salons and independent professionals. We facilitate scheduling, messaging, and related tools, but we are not the provider of the beauty or grooming services themselves.",
        "Service details, prices, and cancellation rules are set by the professional or business. Clients should review those details before confirming a booking.",
      ],
    },
    {
      id: "payments",
      heading: "4. Payments and Fees",
      paragraphs: [
        "Where payments are processed through Mollure, applicable fees, taxes, and refund rules will be shown during checkout or in the relevant booking confirmation.",
        "Professionals are responsible for complying with local tax and invoicing requirements for services they deliver.",
      ],
    },
    {
      id: "conduct",
      heading: "5. Acceptable Use",
      paragraphs: [
        "You agree not to misuse the platform, including by posting false information, harassing other users, attempting unauthorized access, or interfering with the security or availability of Mollure.",
        "We may suspend or terminate accounts that violate these terms or applicable law.",
      ],
    },
    {
      id: "liability",
      heading: "6. Limitation of Liability",
      paragraphs: [
        "Mollure is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the platform or from services booked through it.",
        "This section does not exclude liability that cannot be excluded under applicable law.",
      ],
    },
    {
      id: "changes",
      heading: "7. Changes to These Terms",
      paragraphs: [
        "We may update these Terms & Conditions from time to time. The “Last updated” date at the top of this page will reflect the latest revision. Continued use of Mollure after changes means you accept the updated terms.",
      ],
    },
    {
      id: "contact",
      heading: "8. Contact Us",
      paragraphs: [
        "If you have questions about these Terms & Conditions, please contact us through the Contact Us page on Mollure or via the support channels listed in your account.",
      ],
    },
  ],
} as const;
