/** Default placeholder copy for the Policies page. */

export const policiesPageData = {
  title: "Policies",
  lastUpdated: "August 6, 2026",
  intro:
    "This page summarizes Mollure’s platform policies. The content below is placeholder copy for review and will be replaced with final legal text.",
  sections: [
    {
      id: "privacy",
      heading: "1. Privacy Policy",
      paragraphs: [
        "We collect and process personal information needed to create accounts, manage bookings, and improve the Mollure experience. Dummy placeholder: detailed data categories, lawful bases, and retention periods will be published here.",
        "You can request access, correction, or deletion of your personal data through your account settings or by contacting support.",
      ],
    },
    {
      id: "cookies",
      heading: "2. Cookie Policy",
      paragraphs: [
        "Mollure uses essential cookies to keep you signed in and to secure the platform. Optional analytics cookies may be used to understand product usage.",
        "Dummy placeholder: a full cookie table (name, purpose, duration, provider) will be listed in this section.",
      ],
    },
    {
      id: "cancellation",
      heading: "3. Cancellation and Rescheduling",
      paragraphs: [
        "Cancellation and rescheduling rules may vary by professional or business. Clients should review the booking confirmation for applicable deadlines and fees.",
        "Dummy placeholder: platform-wide minimum notice periods and dispute handling steps will be documented here.",
      ],
    },
    {
      id: "no-show",
      heading: "4. No-Show Policy",
      paragraphs: [
        "Repeated no-shows may result in booking restrictions. Professionals may apply their own no-show fees where clearly disclosed before booking.",
        "Dummy placeholder: enforcement guidelines and appeal options will appear in this section.",
      ],
    },
    {
      id: "payments",
      heading: "5. Payments and Refunds",
      paragraphs: [
        "Where payments are processed through Mollure, refund eligibility depends on the booking status, professional policy, and applicable law.",
        "Dummy placeholder: timelines for refunds, chargebacks, and invoicing rules will be described here.",
      ],
    },
    {
      id: "community",
      heading: "6. Community and Safety",
      paragraphs: [
        "Users must treat others with respect. Harassment, fraud, or misuse of the platform may lead to account suspension.",
        "Dummy placeholder: reporting channels and moderation processes will be outlined in this section.",
      ],
    },
    {
      id: "updates",
      heading: "7. Policy Updates",
      paragraphs: [
        "We may update these policies from time to time. The “Last updated” date at the top of this page will reflect the latest revision.",
        "Continued use of Mollure after updates means you accept the revised policies, unless applicable law requires additional consent.",
      ],
    },
    {
      id: "contact",
      heading: "8. Contact",
      paragraphs: [
        "If you have questions about these policies, contact us through the Contact Us page on Mollure or via the support channels listed in your account.",
      ],
    },
  ],
} as const;
