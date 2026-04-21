export const pricingPageData = {
  hero: {
    title: "Pricing",
    subtitle: "Simple. Transparent. No Hidden Fees.",
  },
  featureItems: [
    "Business Setup & Management",
    "Booking & Calendar Management",
    "Client Management",
    "Payment & Invoicing",
    "Business Insight & Analytics",
    "Built-in Communication",
  ] as const,
  stripeLocalPaymentMethodsUrl: "https://stripe.com/nl/pricing/local-payment-methods",
  stripeNetherlandsExamples: [
    "iDEAL",
    "Bancontact",
    "SEPA Direct Debit",
    "EU credit cards",
    "Non-EU credit cards",
    "Apple Pay / Google Pay",
  ] as const,
  partnershipThisMeans: [
    "You retain full ownership and control",
    "Payments go directly to your Stripe balance",
    "Stripe handles payment processing and payouts",
    "Disputes and chargebacks are managed directly in Stripe",
    "MOLLURE does not access or hold your funds",
  ] as const,
  partnershipInsideStripeYouCan: [
    "View payments, balances, and payout history",
    "Update your bank account or debit card",
    "Enable or disable payment methods",
    "Provide additional business information if requested by Stripe",
  ] as const,
} as const;

