export const pricingPageData = {
  cardShadow: "0 10px 28px rgba(16, 35, 63, 0.10)",
  hero: {
    title: "Pricing",
    subtitle: "Simple. Transparent. No Hidden Fees.",
  },
  plan: {
    title: "Stripe Fee + 1% Mollure Fee",
    perTransaction: "(Per Online Transaction)",
    features: [
      "Business Setup & Management",
      "Booking & Calendar Management",
      "Client Management",
      "Payment & Invoicing",
      "Business Insight & Analytics",
      "Built-in Communication",
    ] as const,
  },
  transactionFees: {
    title: "Transaction Fees",
    online: {
      title: "Online Payments",
      paragraphs: [
        "Online payments are securely processed via Stripe.",
        "For each online transaction:",
      ] as const,
      feeBold: "Stripe processing fee (based on payment method)",
      feeRest: "+ 1% Mollure fee (Excluding VAT)",
      fundsNote:
        "All funds go directly to your own Stripe account. Mollure never holds, processes, or delays your money.",
    },
    offline: {
      title: "Offline Payments",
      paragraphs: [
        "No additional transaction fees.",
        "You keep 100% of the payment.",
      ] as const,
    },
  },
  stripeExamples: {
    title: "Stripe Processing Fees (Netherlands – Examples)",
    methods: [
      "iDEAL",
      "Bancontact",
      "SEPA Direct Debit",
      "EU credit cards",
      "Non-EU credit cards",
      "Apple Pay / Google Pay",
    ] as const,
    referLabel: "For the Stripe fees refer to the official pricing page:",
    stripePricingUrl: "https://stripe.com/nl/pricing/local-payment-methods",
  },
  payouts: {
    title: "Payout Options",
    subtitle: "All payouts are handled directly by Stripe.",
    standard: {
      title: "Standard Payout (Default)",
      body: "Free — Funds are deposited to your bank account according to Stripe’s standard schedule (typically 2–3 business days).",
    },
    instant: {
      title: "Instant Payout",
      body: "1% of payout amount (minimum €0.50) Funds are transferred instantly to your linked debit card. You can manage payout speed and bank details directly in your Stripe dashboard.",
    },
  },
  partnership: {
    title: "Stripe & MOLLURE Partnership",
    subtitle:
      "When you activate online payments, you receive your own Stripe Standard Connected Account.",
    thisMeans: {
      title: "This Means:",
      items: [
        "You retain full ownership and control",
        "Payments go directly to your Stripe balance",
        "Stripe handles payment processing and payouts",
        "Disputes and chargebacks are managed directly in Stripe",
        "MOLLURE does not access or hold your funds",
      ] as const,
    },
    dashboard: {
      title: "Inside Your Stripe Dashboard, You Can:",
      intro: "Inside your Stripe dashboard, you can:",
      items: [
        "View payments, balances, and payout history",
        "Update your bank account or debit card",
        "Enable or disable payment methods",
        "Provide additional business information if requested by Stripe",
      ] as const,
      customizationNote:
        "Additional customization options are available within your Stripe dashboard.",
      disconnectNote:
        "If you disconnect your Stripe account, your MOLLURE public booking profile will be temporarily disabled until reconnected.",
    },
  },
} as const;
